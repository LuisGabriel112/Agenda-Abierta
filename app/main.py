import os
import time
import uuid
from concurrent.futures import ThreadPoolExecutor

# ── Cargar .env ANTES de cualquier import que lea variables de entorno ──────
from dotenv import load_dotenv
_env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(dotenv_path=_env_path, override=True)
print(f"[env] _env_path={_env_path}, SUPABASE_SERVICE_KEY={'SET' if os.getenv('SUPABASE_SERVICE_KEY') else 'EMPTY'}")

from apscheduler.schedulers.background import BackgroundScheduler

from .notificaciones import enviar_recordatorio, notificar_reserva

_notif_executor = ThreadPoolExecutor(max_workers=4)
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Dict, List, Optional

import stripe
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import engine, get_db
from .modelos import (
    Base,
    Cita,
    Cliente,
    Empleado,
    EstadoCita,
    HorarioTrabajo,
    Negocio,
    RolEmpleado,
    Servicio,
)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PLATFORM_FEE_PCT = float(os.getenv("STRIPE_PLATFORM_FEE_PCT", "0"))

Base.metadata.create_all(bind=engine)

app = FastAPI()


# ---------------------------------------------------------------------------
# Scheduler de recordatorios — corre cada hora
# ---------------------------------------------------------------------------

def _job_recordatorios():
    """Revisa citas en las próximas 24-25h y manda recordatorio si aún no se envió."""
    from datetime import timezone as _tz
    from .database import SessionLocal as _Session

    ahora = datetime.now(_tz.utc)
    ventana_inicio = ahora + timedelta(hours=24)
    ventana_fin = ahora + timedelta(hours=25)

    db = _Session()
    try:
        citas = (
            db.query(Cita)
            .join(Cita.cliente)
            .join(Cita.negocio)
            .join(Cita.servicio)
            .join(Cita.empleado)
            .filter(
                Cita.hora_inicio >= ventana_inicio,
                Cita.hora_inicio < ventana_fin,
                Cita.estado != EstadoCita.CANCELADA,
                Cita.recordatorio_enviado == False,  # noqa: E712
            )
            .all()
        )
        for cita in citas:
            if not cita.cliente.email:
                continue
            if not cita.negocio.notif_email:
                continue
            enviado = enviar_recordatorio(
                cliente_nombre=cita.cliente.nombre,
                cliente_email=cita.cliente.email,
                negocio_nombre=cita.negocio.nombre,
                negocio_direccion=cita.negocio.direccion,
                servicio_nombre=cita.servicio.nombre,
                empleado_nombre=cita.empleado.nombre,
                hora_inicio=cita.hora_inicio,
            )
            if enviado:
                cita.recordatorio_enviado = True
        db.commit()
    except Exception as e:
        print(f"[recordatorios] error: {e}")
    finally:
        db.close()


_scheduler = BackgroundScheduler()
_scheduler.add_job(_job_recordatorios, "interval", hours=1, id="recordatorios")


@app.on_event("startup")
def startup_scheduler():
    _scheduler.start()
    print("[scheduler] Recordatorios activos — revisión cada hora.")


@app.on_event("shutdown")
def shutdown_scheduler():
    _scheduler.shutdown(wait=False)


# Static files — logos (fallback local cuando Supabase Storage no está configurado)
LOGOS_DIR = Path(__file__).parent.parent / "static" / "logos"
LOGOS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(LOGOS_DIR.parent)), name="static")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
_LOGOS_BUCKET = "logos"


def _supabase_upload(filename: str, contents: bytes, content_type: str) -> str | None:
    """Sube un archivo al bucket 'logos' de Supabase Storage. Retorna la URL pública o None."""
    _url = os.environ.get("SUPABASE_URL", "")
    _key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not _url or not _key:
        print(f"[supabase-storage] Skipping — SUPABASE_URL={'SET' if _url else 'EMPTY'}, KEY={'SET' if _key else 'EMPTY'}")
        return None
    import requests as _req
    upload_url = f"{_url}/storage/v1/object/{_LOGOS_BUCKET}/{filename}"
    headers = {
        "Authorization": f"Bearer {_key}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }
    res = _req.put(upload_url, headers=headers, data=contents, timeout=15)
    if res.status_code in (200, 201):
        return f"{_url}/storage/v1/object/public/{_LOGOS_BUCKET}/{filename}"
    print(f"[supabase-storage] Error {res.status_code}: {res.text}")
    return None


def _supabase_delete(filename: str) -> None:
    """Elimina un archivo del bucket 'logos' de Supabase Storage."""
    _url = os.environ.get("SUPABASE_URL", "")
    _key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not _url or not _key:
        return
    import requests as _req
    url = f"{_url}/storage/v1/object/{_LOGOS_BUCKET}"
    headers = {"Authorization": f"Bearer {_key}"}
    _req.delete(url, headers=headers, json={"prefixes": [filename]}, timeout=10)

_cors_env = os.getenv("CORS_ORIGINS", "http://localhost:5173")
_cors_origins = [o.strip() for o in _cors_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Schemas — Registro
# ---------------------------------------------------------------------------


class TimeSlot(BaseModel):
    open: str
    close: str


class ScheduleDay(BaseModel):
    active: bool
    slots: List[TimeSlot]


class ServiceItem(BaseModel):
    name: str
    duration: str
    price: str


class CreateSubscriptionRequest(BaseModel):
    paymentMethodId: str
    plan: str
    isAnnual: bool
    amountCents: int
    email: Optional[str] = None
    businessName: Optional[str] = None


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    plan: str
    isAnnual: bool
    total: str
    paymentMethodId: str
    businessName: str
    selectedType: Optional[str] = None
    services: List[ServiceItem] = []
    schedule: Dict[str, ScheduleDay] = {}
    clerkUserId: Optional[str] = None
    stripeCustomerId: Optional[str] = None
    stripeSubscriptionId: Optional[str] = None


class RegisterResponse(BaseModel):
    success: bool
    message: str
    token: str
    negocio_id: str


# ---------------------------------------------------------------------------
# Schemas — Negocio
# ---------------------------------------------------------------------------


class NegocioUpdateRequest(BaseModel):
    nombre: Optional[str] = None
    giro: Optional[str] = None
    descripcion: Optional[str] = None
    direccion: Optional[str] = None
    color_marca: Optional[str] = None
    email_negocio: Optional[str] = None
    telefono_negocio: Optional[str] = None
    notif_email: Optional[bool] = None
    notif_whatsapp: Optional[bool] = None
    clabe: Optional[str] = None
    banco: Optional[str] = None
    titular_cuenta: Optional[str] = None
    cancelacion_horas: Optional[int] = None
    terminos_reembolso: Optional[str] = None
    timezone: Optional[str] = None


class NegocioResponse(BaseModel):
    id: str
    nombre: str
    slug: str
    giro: Optional[str]
    descripcion: Optional[str]
    direccion: Optional[str]
    color_marca: Optional[str]
    url_logo: Optional[str]
    fecha_creacion: str
    email_negocio: Optional[str] = None
    telefono_negocio: Optional[str] = None
    notif_email: bool = True
    notif_whatsapp: bool = False
    clabe: Optional[str] = None
    banco: Optional[str] = None
    titular_cuenta: Optional[str] = None
    stripe_connect_id: Optional[str] = None
    cancelacion_horas: Optional[int] = None
    terminos_reembolso: Optional[str] = None
    timezone: str = "America/Mexico_City"


class ServicioSchema(BaseModel):
    id: str
    nombre: str
    descripcion: Optional[str]
    precio: str
    duracion_minutos: int


class HorarioSchema(BaseModel):
    dia_semana: int
    hora_apertura: Optional[str]
    hora_cierre: Optional[str]
    esta_cerrado: bool


class DashboardDataResponse(BaseModel):
    negocio: NegocioResponse
    servicios: List[ServicioSchema]
    horarios: List[HorarioSchema]
    total_clientes: int
    total_citas: int


# ---------------------------------------------------------------------------
# Schemas — Servicios
# ---------------------------------------------------------------------------


class ServicioCreateRequest(BaseModel):
    nombre: str
    precio: str
    duracion_minutos: int
    descripcion: Optional[str] = None


class ServicioUpdateRequest(BaseModel):
    nombre: Optional[str] = None
    precio: Optional[str] = None
    duracion_minutos: Optional[int] = None
    descripcion: Optional[str] = None


# ---------------------------------------------------------------------------
# Schemas — Clientes
# ---------------------------------------------------------------------------


class ClienteCreateRequest(BaseModel):
    nombre: str
    telefono: str
    email: Optional[str] = None


class ClienteUpdateRequest(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None


class ClienteListItem(BaseModel):
    id: str
    nombre: str
    telefono: str
    email: Optional[str]
    total_citas: int
    total_gastado: str


class CitaEnHistorial(BaseModel):
    id: str
    servicio_nombre: str
    empleado_nombre: str
    hora_inicio: str
    hora_fin: str
    estado: str
    monto_anticipo: str


class ClienteDetalle(BaseModel):
    id: str
    nombre: str
    telefono: str
    email: Optional[str]
    total_citas: int
    total_gastado: str
    ticket_promedio: str
    historial: List[CitaEnHistorial]


# ---------------------------------------------------------------------------
# Schemas — Citas
# ---------------------------------------------------------------------------


class CitaCreateRequest(BaseModel):
    cliente_id: str
    servicio_id: str
    hora_inicio: str  # ISO 8601 e.g. "2025-07-15T10:00:00"
    empleado_id: Optional[str] = None
    notas: Optional[str] = None


class CitaUpdateRequest(BaseModel):
    estado: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None


class CitaItem(BaseModel):
    id: str
    cliente_id: str
    cliente_nombre: str
    cliente_telefono: str
    servicio_id: str
    servicio_nombre: str
    servicio_duracion_minutos: int
    empleado_id: Optional[str] = None
    empleado_nombre: str
    hora_inicio: str
    hora_fin: str
    estado: str
    monto_anticipo: str
    metodo_pago: Optional[str] = None
    pagado: bool = False


# ---------------------------------------------------------------------------
# Schemas — Analítica
# ---------------------------------------------------------------------------


class CitaMes(BaseModel):
    mes: str
    total: int


class TransaccionReciente(BaseModel):
    cliente_nombre: str
    servicio_nombre: str
    fecha: str
    monto: str


class AnaliticaResponse(BaseModel):
    ingresos_totales: str
    total_citas: int
    total_clientes: int
    citas_por_mes: List[CitaMes]
    transacciones_recientes: List[TransaccionReciente]


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------


def send_welcome_email(email: str, name: str, plan: str):
    print(f"==================================================")
    print(f"ENVIANDO CORREO A: {email}")
    print(f"Asunto: ¡Bienvenido a AgendaAbierta, {name}!")
    print(f"Mensaje: Plan {plan.capitalize()} activado.")
    print(f"==================================================")
    return True


def create_jwt_token(user_id: str, email: str) -> str:
    import base64
    import json

    header = base64.b64encode(
        json.dumps({"alg": "HS256", "typ": "JWT"}).encode()
    ).decode()
    payload = base64.b64encode(
        json.dumps(
            {"sub": user_id, "email": email, "exp": int(time.time()) + 86400}
        ).encode()
    ).decode()
    return f"{header}.{payload}.simulated_signature_123"


def _parse_uuid(value: str, label: str = "ID") -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"{label} inválido.")


# ---------------------------------------------------------------------------
# Rutas — Health / Auth
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/me")
async def get_me(clerk_user_id: str, db: Session = Depends(get_db)):
    empleado = (
        db.query(Empleado).filter(Empleado.clerk_user_id == clerk_user_id).first()
    )
    if not empleado:
        raise HTTPException(status_code=404, detail="Usuario no registrado.")

    negocio = db.query(Negocio).filter(Negocio.id == empleado.negocio_id).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    return {
        "registered": True,
        "empleado_id": str(empleado.id),
        "negocio_id": str(negocio.id),
        "nombre": empleado.nombre,
        "email": empleado.email,
        "rol": empleado.rol,
        "negocio_nombre": negocio.nombre,
        "negocio_giro": negocio.giro,
        "tiene_suscripcion": bool(negocio.stripe_subscription_id),
        "negocio_activo": negocio.activo,
    }


# ---------------------------------------------------------------------------
# Rutas — Negocio
# ---------------------------------------------------------------------------


@app.get("/api/negocio/{negocio_id}", response_model=DashboardDataResponse)
async def get_negocio(negocio_id: str, db: Session = Depends(get_db)):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    negocio = db.query(Negocio).filter(Negocio.id == nid).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    servicios = db.query(Servicio).filter(Servicio.negocio_id == nid).all()
    horarios = db.query(HorarioTrabajo).filter(HorarioTrabajo.negocio_id == nid).all()

    return DashboardDataResponse(
        negocio=NegocioResponse(
            id=str(negocio.id),
            nombre=negocio.nombre,
            slug=negocio.slug,
            giro=negocio.giro,
            descripcion=negocio.descripcion,
            direccion=negocio.direccion,
            color_marca=negocio.color_marca,
            url_logo=negocio.url_logo,
            fecha_creacion=negocio.fecha_creacion.isoformat(),
            email_negocio=negocio.email_negocio,
            telefono_negocio=negocio.telefono_negocio,
            notif_email=negocio.notif_email if negocio.notif_email is not None else True,
            notif_whatsapp=negocio.notif_whatsapp if negocio.notif_whatsapp is not None else False,
            clabe=negocio.clabe,
            banco=negocio.banco,
            titular_cuenta=negocio.titular_cuenta,
            stripe_connect_id=negocio.stripe_connect_id,
            cancelacion_horas=negocio.cancelacion_horas,
            terminos_reembolso=negocio.terminos_reembolso,
            timezone=negocio.timezone or "America/Mexico_City",
        ),
        servicios=[
            ServicioSchema(
                id=str(s.id),
                nombre=s.nombre,
                descripcion=s.descripcion,
                precio=str(s.precio),
                duracion_minutos=s.duracion_minutos,
            )
            for s in servicios
        ],
        horarios=[
            HorarioSchema(
                dia_semana=h.dia_semana,
                hora_apertura=h.hora_apertura.strftime("%H:%M")
                if h.hora_apertura
                else None,
                hora_cierre=h.hora_cierre.strftime("%H:%M") if h.hora_cierre else None,
                esta_cerrado=h.esta_cerrado,
            )
            for h in horarios
        ],
        total_clientes=len(negocio.clientes),
        total_citas=len(negocio.citas),
    )


@app.patch("/api/negocio/{negocio_id}")
async def update_negocio(
    negocio_id: str, body: NegocioUpdateRequest, db: Session = Depends(get_db)
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    negocio = db.query(Negocio).filter(Negocio.id == nid).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(negocio, field, value)

    db.commit()
    return {"success": True, "message": "Negocio actualizado."}


@app.delete("/api/negocio/{negocio_id}", status_code=204)
async def delete_negocio(negocio_id: str, db: Session = Depends(get_db)):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    negocio = db.query(Negocio).filter(Negocio.id == nid).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    # Eliminar en cascada: citas, clientes, servicios, horarios, empleados
    citas = db.query(Cita).filter(Cita.negocio_id == nid).all()
    for cita in citas:
        db.delete(cita)

    clientes = db.query(Cliente).filter(Cliente.negocio_id == nid).all()
    for cliente in clientes:
        db.delete(cliente)

    servicios = db.query(Servicio).filter(Servicio.negocio_id == nid).all()
    for servicio in servicios:
        db.delete(servicio)

    horarios = db.query(HorarioTrabajo).filter(HorarioTrabajo.negocio_id == nid).all()
    for horario in horarios:
        db.delete(horario)

    empleados = db.query(Empleado).filter(Empleado.negocio_id == nid).all()
    for empleado in empleados:
        db.delete(empleado)

    from .modelos import BloqueoTiempo
    bloqueos = db.query(BloqueoTiempo).filter(BloqueoTiempo.negocio_id == nid).all()
    for bloqueo in bloqueos:
        db.delete(bloqueo)

    db.delete(negocio)
    db.commit()


@app.post("/api/negocio/{negocio_id}/logo")
async def upload_logo(
    negocio_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    negocio = db.query(Negocio).filter(Negocio.id == nid).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    # Validate content type
    if file.content_type not in ("image/jpeg", "image/png", "image/webp", "image/gif"):
        raise HTTPException(status_code=400, detail="Formato no soportado. Usa JPG, PNG o WebP.")

    # Validate file size (max 2 MB)
    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no debe superar 2 MB.")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    filename = f"{nid}.{ext}"

    # Intentar Supabase Storage primero
    public_url = _supabase_upload(filename, contents, file.content_type or "image/jpeg")

    if public_url:
        # Eliminar logo anterior de Supabase si era local (migración)
        if negocio.url_logo and "/static/logos/" in negocio.url_logo:
            old_local = LOGOS_DIR / negocio.url_logo.split("/static/logos/")[-1]
            if old_local.exists():
                old_local.unlink()
        url_logo = public_url
    else:
        # Fallback: guardar en filesystem local
        if negocio.url_logo and "/static/logos/" in negocio.url_logo:
            old_path = LOGOS_DIR / negocio.url_logo.split("/static/logos/")[-1]
            if old_path.exists():
                old_path.unlink()
        save_path = LOGOS_DIR / filename
        with open(save_path, "wb") as f:
            f.write(contents)
        url_logo = f"/static/logos/{filename}"

    negocio.url_logo = url_logo
    db.commit()

    return {"url_logo": url_logo}


# ---------------------------------------------------------------------------
# Schemas — Empleados
# ---------------------------------------------------------------------------


class EmpleadoCreateRequest(BaseModel):
    nombre: str
    email: str
    rol: str = "STAFF"  # "ADMIN" | "STAFF"


class EmpleadoUpdateRequest(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None


class EmpleadoItem(BaseModel):
    id: str
    nombre: str
    email: str
    rol: str
    activo: bool
    servicios: List[str] = []  # IDs de servicios asignados


class EmpleadoServiciosRequest(BaseModel):
    servicios_ids: List[str]


# ---------------------------------------------------------------------------
# Rutas — Empleados
# ---------------------------------------------------------------------------


@app.get("/api/negocio/{negocio_id}/empleados", response_model=List[EmpleadoItem])
async def list_empleados(negocio_id: str, db: Session = Depends(get_db)):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    empleados = db.query(Empleado).filter(Empleado.negocio_id == nid).all()
    return [
        EmpleadoItem(
            id=str(e.id),
            nombre=e.nombre,
            email=e.email,
            rol=e.rol.value,
            activo=e.activo,
            servicios=[str(s.id) for s in e.servicios],
        )
        for e in empleados
    ]


@app.post("/api/negocio/{negocio_id}/empleados", response_model=EmpleadoItem)
async def create_empleado(
    negocio_id: str, body: EmpleadoCreateRequest, db: Session = Depends(get_db)
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    rol = RolEmpleado.ADMIN if body.rol.upper() == "ADMIN" else RolEmpleado.STAFF
    emp = Empleado(
        negocio_id=nid,
        nombre=body.nombre.strip(),
        email=body.email.strip().lower(),
        rol=rol,
        activo=True,
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return EmpleadoItem(
        id=str(emp.id),
        nombre=emp.nombre,
        email=emp.email,
        rol=emp.rol.value,
        activo=emp.activo,
    )


@app.patch("/api/negocio/{negocio_id}/empleados/{empleado_id}", response_model=EmpleadoItem)
async def update_empleado(
    negocio_id: str,
    empleado_id: str,
    body: EmpleadoUpdateRequest,
    db: Session = Depends(get_db),
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    eid = _parse_uuid(empleado_id, "ID de empleado")
    emp = (
        db.query(Empleado)
        .filter(Empleado.id == eid, Empleado.negocio_id == nid)
        .first()
    )
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    if body.nombre is not None:
        emp.nombre = body.nombre.strip()
    if body.email is not None:
        emp.email = body.email.strip().lower()
    if body.rol is not None:
        emp.rol = RolEmpleado.ADMIN if body.rol.upper() == "ADMIN" else RolEmpleado.STAFF
    if body.activo is not None:
        emp.activo = body.activo
    db.commit()
    db.refresh(emp)
    return EmpleadoItem(
        id=str(emp.id),
        nombre=emp.nombre,
        email=emp.email,
        rol=emp.rol.value,
        activo=emp.activo,
    )


@app.put("/api/negocio/{negocio_id}/empleados/{empleado_id}/servicios", response_model=EmpleadoItem)
async def update_empleado_servicios(
    negocio_id: str,
    empleado_id: str,
    body: EmpleadoServiciosRequest,
    db: Session = Depends(get_db),
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    eid = _parse_uuid(empleado_id, "ID de empleado")
    emp = db.query(Empleado).filter(Empleado.id == eid, Empleado.negocio_id == nid).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado.")
    ids_parsed = [_parse_uuid(sid, "ID de servicio") for sid in body.servicios_ids]
    servicios = (
        db.query(Servicio)
        .filter(Servicio.id.in_(ids_parsed), Servicio.negocio_id == nid)
        .all()
    )
    emp.servicios = servicios
    db.commit()
    db.refresh(emp)
    return EmpleadoItem(
        id=str(emp.id),
        nombre=emp.nombre,
        email=emp.email,
        rol=emp.rol.value,
        activo=emp.activo,
        servicios=[str(s.id) for s in emp.servicios],
    )


@app.delete("/api/negocio/{negocio_id}/empleados/{empleado_id}", status_code=204)
async def delete_empleado(
    negocio_id: str, empleado_id: str, db: Session = Depends(get_db)
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    eid = _parse_uuid(empleado_id, "ID de empleado")
    emp = (
        db.query(Empleado)
        .filter(Empleado.id == eid, Empleado.negocio_id == nid)
        .first()
    )
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    db.delete(emp)
    db.commit()


# ---------------------------------------------------------------------------
# Rutas — Servicios
# ---------------------------------------------------------------------------


@app.get("/api/negocio/{negocio_id}/servicios", response_model=List[ServicioSchema])
async def list_servicios(negocio_id: str, db: Session = Depends(get_db)):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    servicios = db.query(Servicio).filter(Servicio.negocio_id == nid).all()
    return [
        ServicioSchema(
            id=str(s.id),
            nombre=s.nombre,
            descripcion=s.descripcion,
            precio=str(s.precio),
            duracion_minutos=s.duracion_minutos,
        )
        for s in servicios
    ]


@app.post("/api/negocio/{negocio_id}/servicios", response_model=ServicioSchema)
async def create_servicio(
    negocio_id: str, body: ServicioCreateRequest, db: Session = Depends(get_db)
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    if not db.query(Negocio).filter(Negocio.id == nid).first():
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    s = Servicio(
        negocio_id=nid,
        nombre=body.nombre,
        descripcion=body.descripcion,
        precio=body.precio,
        duracion_minutos=body.duracion_minutos,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return ServicioSchema(
        id=str(s.id),
        nombre=s.nombre,
        descripcion=s.descripcion,
        precio=str(s.precio),
        duracion_minutos=s.duracion_minutos,
    )


@app.patch(
    "/api/negocio/{negocio_id}/servicios/{servicio_id}", response_model=ServicioSchema
)
async def update_servicio(
    negocio_id: str,
    servicio_id: str,
    body: ServicioUpdateRequest,
    db: Session = Depends(get_db),
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    sid = _parse_uuid(servicio_id, "ID de servicio")
    s = (
        db.query(Servicio)
        .filter(Servicio.id == sid, Servicio.negocio_id == nid)
        .first()
    )
    if not s:
        raise HTTPException(status_code=404, detail="Servicio no encontrado.")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(s, field, value)

    db.commit()
    db.refresh(s)
    return ServicioSchema(
        id=str(s.id),
        nombre=s.nombre,
        descripcion=s.descripcion,
        precio=str(s.precio),
        duracion_minutos=s.duracion_minutos,
    )


@app.delete("/api/negocio/{negocio_id}/servicios/{servicio_id}")
async def delete_servicio(
    negocio_id: str, servicio_id: str, db: Session = Depends(get_db)
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    sid = _parse_uuid(servicio_id, "ID de servicio")
    s = (
        db.query(Servicio)
        .filter(Servicio.id == sid, Servicio.negocio_id == nid)
        .first()
    )
    if not s:
        raise HTTPException(status_code=404, detail="Servicio no encontrado.")
    db.delete(s)
    db.commit()
    return {"success": True}


# ---------------------------------------------------------------------------
# Rutas — Clientes
# ---------------------------------------------------------------------------


def _cliente_to_list_item(c: Cliente) -> ClienteListItem:
    citas_completadas = [x for x in c.citas if x.estado == EstadoCita.COMPLETADA]
    total = sum(x.monto_anticipo or Decimal("0") for x in citas_completadas)
    return ClienteListItem(
        id=str(c.id),
        nombre=c.nombre,
        telefono=c.telefono,
        email=c.email,
        total_citas=len(c.citas),
        total_gastado=f"${total:,.2f}",
    )


@app.get("/api/negocio/{negocio_id}/clientes", response_model=List[ClienteListItem])
async def list_clientes(negocio_id: str, db: Session = Depends(get_db)):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    clientes = db.query(Cliente).filter(Cliente.negocio_id == nid).all()
    return [_cliente_to_list_item(c) for c in clientes]


@app.post("/api/negocio/{negocio_id}/clientes", response_model=ClienteListItem)
async def create_cliente(
    negocio_id: str, body: ClienteCreateRequest, db: Session = Depends(get_db)
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    if not db.query(Negocio).filter(Negocio.id == nid).first():
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    c = Cliente(
        negocio_id=nid,
        nombre=body.nombre,
        telefono=body.telefono,
        email=body.email,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _cliente_to_list_item(c)


@app.get(
    "/api/negocio/{negocio_id}/clientes/{cliente_id}",
    response_model=ClienteDetalle,
)
async def get_cliente(negocio_id: str, cliente_id: str, db: Session = Depends(get_db)):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    cid = _parse_uuid(cliente_id, "ID de cliente")
    c = db.query(Cliente).filter(Cliente.id == cid, Cliente.negocio_id == nid).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado.")

    citas_completadas = [x for x in c.citas if x.estado == EstadoCita.COMPLETADA]
    total = sum(x.monto_anticipo or Decimal("0") for x in citas_completadas)
    ticket_promedio = (
        total / len(citas_completadas) if citas_completadas else Decimal("0")
    )

    historial = sorted(c.citas, key=lambda x: x.hora_inicio, reverse=True)

    return ClienteDetalle(
        id=str(c.id),
        nombre=c.nombre,
        telefono=c.telefono,
        email=c.email,
        total_citas=len(c.citas),
        total_gastado=f"${total:,.2f}",
        ticket_promedio=f"${ticket_promedio:,.2f}",
        historial=[
            CitaEnHistorial(
                id=str(x.id),
                servicio_nombre=x.servicio.nombre if x.servicio else "—",
                empleado_nombre=x.empleado.nombre if x.empleado else "—",
                hora_inicio=x.hora_inicio.isoformat(),
                hora_fin=x.hora_fin.isoformat(),
                estado=x.estado.value,
                monto_anticipo=f"${x.monto_anticipo or 0:,.2f}",
            )
            for x in historial
        ],
    )


@app.patch(
    "/api/negocio/{negocio_id}/clientes/{cliente_id}",
    response_model=ClienteListItem,
)
async def update_cliente(
    negocio_id: str,
    cliente_id: str,
    body: ClienteUpdateRequest,
    db: Session = Depends(get_db),
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    cid = _parse_uuid(cliente_id, "ID de cliente")
    c = db.query(Cliente).filter(Cliente.id == cid, Cliente.negocio_id == nid).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado.")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(c, field, value)

    db.commit()
    db.refresh(c)
    return _cliente_to_list_item(c)


@app.delete("/api/negocio/{negocio_id}/clientes/{cliente_id}")
async def delete_cliente(
    negocio_id: str, cliente_id: str, db: Session = Depends(get_db)
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    cid = _parse_uuid(cliente_id, "ID de cliente")
    c = db.query(Cliente).filter(Cliente.id == cid, Cliente.negocio_id == nid).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado.")
    db.delete(c)
    db.commit()
    return {"success": True}


# ---------------------------------------------------------------------------
# Rutas — Citas
# ---------------------------------------------------------------------------


def _cita_to_item(x: Cita) -> CitaItem:
    return CitaItem(
        id=str(x.id),
        cliente_id=str(x.cliente_id),
        cliente_nombre=x.cliente.nombre if x.cliente else "—",
        cliente_telefono=x.cliente.telefono if x.cliente else "—",
        servicio_id=str(x.servicio_id),
        servicio_nombre=x.servicio.nombre if x.servicio else "—",
        servicio_duracion_minutos=x.servicio.duracion_minutos if x.servicio else 0,
        empleado_id=str(x.empleado_id) if x.empleado_id else None,
        empleado_nombre=x.empleado.nombre if x.empleado else "—",
        hora_inicio=x.hora_inicio.strftime("%Y-%m-%dT%H:%M:%S"),
        hora_fin=x.hora_fin.strftime("%Y-%m-%dT%H:%M:%S"),
        estado=x.estado.value,
        monto_anticipo=f"${x.monto_anticipo or 0:,.2f}",
        metodo_pago=x.metodo_pago,
        pagado=x.pagado,
    )


@app.get("/api/negocio/{negocio_id}/citas", response_model=List[CitaItem])
async def list_citas(
    negocio_id: str,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    db: Session = Depends(get_db),
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    q = db.query(Cita).filter(Cita.negocio_id == nid)

    if fecha_inicio:
        try:
            from datetime import timezone as _tz
            fi = datetime.fromisoformat(fecha_inicio)
            if fi.tzinfo is None:
                fi = fi.replace(tzinfo=_tz.utc)
            q = q.filter(Cita.hora_inicio >= fi)
        except ValueError:
            raise HTTPException(status_code=400, detail="fecha_inicio inválida.")

    if fecha_fin:
        try:
            from datetime import timezone as _tz
            ff = datetime.fromisoformat(fecha_fin)
            if ff.tzinfo is None:
                ff = ff.replace(tzinfo=_tz.utc)
            q = q.filter(Cita.hora_inicio <= ff)
        except ValueError:
            raise HTTPException(status_code=400, detail="fecha_fin inválida.")

    citas = q.order_by(Cita.hora_inicio.asc()).all()
    return [_cita_to_item(x) for x in citas]


@app.post("/api/negocio/{negocio_id}/citas", response_model=CitaItem)
async def create_cita(
    negocio_id: str, body: CitaCreateRequest, db: Session = Depends(get_db)
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    cliente_id = _parse_uuid(body.cliente_id, "ID de cliente")
    servicio_id = _parse_uuid(body.servicio_id, "ID de servicio")

    negocio = db.query(Negocio).filter(Negocio.id == nid).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    cliente = (
        db.query(Cliente)
        .filter(Cliente.id == cliente_id, Cliente.negocio_id == nid)
        .first()
    )
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado.")

    servicio = (
        db.query(Servicio)
        .filter(Servicio.id == servicio_id, Servicio.negocio_id == nid)
        .first()
    )
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado.")

    # Usar el empleado indicado, o el primer activo como fallback
    if body.empleado_id:
        eid = _parse_uuid(body.empleado_id, "ID de empleado")
        empleado = (
            db.query(Empleado)
            .filter(Empleado.id == eid, Empleado.negocio_id == nid, Empleado.activo == True)
            .first()
        )
        if not empleado:
            raise HTTPException(status_code=404, detail="Empleado no encontrado.")
    else:
        empleado = (
            db.query(Empleado)
            .filter(Empleado.negocio_id == nid, Empleado.activo == True)
            .first()
        )
    if not empleado:
        raise HTTPException(
            status_code=400, detail="No hay empleados activos en el negocio."
        )

    try:
        hora_inicio = datetime.fromisoformat(body.hora_inicio)
    except ValueError:
        raise HTTPException(
            status_code=400, detail="hora_inicio inválida. Usa ISO 8601."
        )

    hora_fin = hora_inicio + timedelta(minutes=servicio.duracion_minutos)

    cita = Cita(
        negocio_id=nid,
        cliente_id=cliente_id,
        servicio_id=servicio_id,
        empleado_id=empleado.id,
        hora_inicio=hora_inicio,
        hora_fin=hora_fin,
        estado=EstadoCita.PENDIENTE,
        monto_anticipo=Decimal("0"),
    )
    db.add(cita)
    db.commit()
    db.refresh(cita)
    return _cita_to_item(cita)


@app.patch("/api/negocio/{negocio_id}/citas/{cita_id}", response_model=CitaItem)
async def update_cita(
    negocio_id: str,
    cita_id: str,
    body: CitaUpdateRequest,
    db: Session = Depends(get_db),
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    xid = _parse_uuid(cita_id, "ID de cita")
    cita = db.query(Cita).filter(Cita.id == xid, Cita.negocio_id == nid).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada.")

    if body.estado is not None:
        try:
            cita.estado = EstadoCita(body.estado.upper())
        except ValueError:
            raise HTTPException(
                status_code=400, detail=f"Estado inválido: {body.estado}"
            )

    if body.hora_inicio is not None:
        try:
            cita.hora_inicio = datetime.fromisoformat(body.hora_inicio)
        except ValueError:
            raise HTTPException(status_code=400, detail="hora_inicio inválida.")

    if body.hora_fin is not None:
        try:
            cita.hora_fin = datetime.fromisoformat(body.hora_fin)
        except ValueError:
            raise HTTPException(status_code=400, detail="hora_fin inválida.")

    db.commit()
    db.refresh(cita)
    return _cita_to_item(cita)


@app.delete("/api/negocio/{negocio_id}/citas/{cita_id}")
async def delete_cita(negocio_id: str, cita_id: str, db: Session = Depends(get_db)):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    xid = _parse_uuid(cita_id, "ID de cita")
    cita = db.query(Cita).filter(Cita.id == xid, Cita.negocio_id == nid).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada.")
    db.delete(cita)
    db.commit()
    return {"success": True}


# ---------------------------------------------------------------------------
# Rutas — iCal feed
# ---------------------------------------------------------------------------


@app.get("/api/negocio/{negocio_id}/calendar.ics")
async def get_ical(negocio_id: str, db: Session = Depends(get_db)):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    negocio = db.query(Negocio).filter(Negocio.id == nid).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    hace_30_dias = datetime.utcnow() - timedelta(days=30)
    citas = (
        db.query(Cita)
        .filter(
            Cita.negocio_id == nid,
            Cita.estado != EstadoCita.CANCELADA,
            Cita.hora_inicio >= hace_30_dias,
        )
        .all()
    )

    def fmt(dt: datetime) -> str:
        return dt.strftime("%Y%m%dT%H%M%S")

    def ical_escape(text: str) -> str:
        return text.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//AgendaAbierta//ES",
        f"X-WR-CALNAME:{ical_escape(negocio.nombre)}",
        f"X-WR-TIMEZONE:{negocio.timezone}",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
    ]

    for cita in citas:
        cliente_nombre = cita.cliente.nombre if cita.cliente else "Cliente"
        servicio_nombre = cita.servicio.nombre if cita.servicio else "Cita"
        empleado_nombre = cita.empleado.nombre if cita.empleado else ""
        estado_ical = "CONFIRMED" if cita.estado == EstadoCita.CONFIRMADA else "TENTATIVE"
        descripcion = f"Cliente: {cliente_nombre}"
        if empleado_nombre:
            descripcion += f"\\nEmpleado: {empleado_nombre}"

        lines += [
            "BEGIN:VEVENT",
            f"UID:{cita.id}@agendaabierta",
            f"DTSTAMP:{fmt(datetime.utcnow())}Z",
            f"DTSTART:{fmt(cita.hora_inicio)}",
            f"DTEND:{fmt(cita.hora_fin)}",
            f"SUMMARY:{ical_escape(servicio_nombre)} — {ical_escape(cliente_nombre)}",
            f"DESCRIPTION:{descripcion}",
            f"STATUS:{estado_ical}",
            "END:VEVENT",
        ]

    lines.append("END:VCALENDAR")
    content = "\r\n".join(lines)

    return Response(
        content=content,
        media_type="text/calendar; charset=utf-8",
        headers={"Content-Disposition": f'inline; filename="agenda_{negocio.slug}.ics"'},
    )


# ---------------------------------------------------------------------------
# Rutas — Analítica
# ---------------------------------------------------------------------------


@app.get("/api/negocio/{negocio_id}/analitica", response_model=AnaliticaResponse)
async def get_analitica(negocio_id: str, db: Session = Depends(get_db)):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    if not db.query(Negocio).filter(Negocio.id == nid).first():
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    todas_citas = db.query(Cita).filter(Cita.negocio_id == nid).all()
    total_clientes = db.query(Cliente).filter(Cliente.negocio_id == nid).count()

    completadas = [c for c in todas_citas if c.estado == EstadoCita.COMPLETADA]
    ingresos = sum(c.monto_anticipo or Decimal("0") for c in completadas)

    # Citas por mes
    meses: Dict[str, int] = {}
    for c in todas_citas:
        clave = c.hora_inicio.strftime("%Y-%m")
        meses[clave] = meses.get(clave, 0) + 1
    citas_por_mes = [CitaMes(mes=k, total=v) for k, v in sorted(meses.items())]

    # Últimas 10 transacciones completadas
    recientes = sorted(completadas, key=lambda c: c.hora_inicio, reverse=True)[:10]
    transacciones = [
        TransaccionReciente(
            cliente_nombre=c.cliente.nombre if c.cliente else "—",
            servicio_nombre=c.servicio.nombre if c.servicio else "—",
            fecha=c.hora_inicio.strftime("%b %d, %Y"),
            monto=f"${c.monto_anticipo or 0:,.2f}",
        )
        for c in recientes
    ]

    return AnaliticaResponse(
        ingresos_totales=f"${ingresos:,.2f}",
        total_citas=len(todas_citas),
        total_clientes=total_clientes,
        citas_por_mes=citas_por_mes,
        transacciones_recientes=transacciones,
    )


# ---------------------------------------------------------------------------
# Ruta — Crear suscripción Stripe
# ---------------------------------------------------------------------------


@app.post("/api/create-subscription")
async def create_subscription(body: CreateSubscriptionRequest):
    try:
        # 1. Crear cliente en Stripe
        customer = stripe.Customer.create(
            email=body.email or None,
            description=f"Negocio: {body.businessName or 'Sin nombre'}",
        )

        # 2. Adjuntar el método de pago al cliente
        stripe.PaymentMethod.attach(body.paymentMethodId, customer=customer.id)

        # 3. Establecer como método de pago por defecto
        stripe.Customer.modify(
            customer.id,
            invoice_settings={"default_payment_method": body.paymentMethodId},
        )

        # 4. Crear Price dinámico con recurrencia
        interval = "year" if body.isAnnual else "month"
        price = stripe.Price.create(
            currency="mxn",
            unit_amount=body.amountCents,
            recurring={"interval": interval},
            product_data={
                "name": f"Plan {body.plan.capitalize()} AgendaAbierta ({'Anual' if body.isAnnual else 'Mensual'})"
            },
        )

        # 5. Crear suscripción con pago incompleto hasta confirmar
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": price.id}],
            payment_behavior="default_incomplete",
            payment_settings={"save_default_payment_method": "on_subscription"},
            expand=["latest_invoice.payments"],
        )

        # 6. Obtener client_secret desde invoice.payments (nueva API Stripe basil 2025-03-31)
        invoice = subscription.latest_invoice
        payments_data = invoice.payments.data if hasattr(invoice, "payments") else []
        if not payments_data:
            raise HTTPException(status_code=502, detail="No se pudo obtener el payment intent de la suscripción.")
        payment_intent_id = payments_data[0].payment.payment_intent
        if isinstance(payment_intent_id, str):
            pi = stripe.PaymentIntent.retrieve(payment_intent_id)
            client_secret = pi.client_secret
        else:
            client_secret = payment_intent_id.client_secret

        return {
            "client_secret": client_secret,
            "subscription_id": subscription.id,
            "customer_id": customer.id,
        }

    except stripe.error.CardError as e:  # type: ignore
        raise HTTPException(status_code=400, detail=e.user_message)
    except stripe.error.StripeError as e:  # type: ignore
        raise HTTPException(status_code=502, detail=str(e))


# ---------------------------------------------------------------------------
# Ruta — Cancelar suscripción incompleta (cleanup en caso de error de pago)
# ---------------------------------------------------------------------------


@app.post("/api/reactivar-suscripcion")
async def reactivar_suscripcion(body: dict, db: Session = Depends(get_db)):
    clerk_user_id = body.get("clerk_user_id")
    subscription_id = body.get("stripe_subscription_id")
    customer_id = body.get("stripe_customer_id")

    if not clerk_user_id or not subscription_id:
        raise HTTPException(status_code=400, detail="Faltan datos requeridos.")

    empleado = db.query(Empleado).filter(Empleado.clerk_user_id == clerk_user_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    negocio = db.query(Negocio).filter(Negocio.id == empleado.negocio_id).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    negocio.stripe_subscription_id = subscription_id
    if customer_id:
        negocio.stripe_customer_id = customer_id
    negocio.activo = True
    db.commit()
    return {"ok": True}


@app.post("/api/cancel-subscription")
async def cancel_subscription(body: dict):
    subscription_id = body.get("subscription_id")
    if subscription_id:
        try:
            stripe.Subscription.cancel(subscription_id)
        except Exception:
            pass
    return {"ok": True}


# ---------------------------------------------------------------------------
# Ruta de prueba — envío de email
# ---------------------------------------------------------------------------


class TestEmailRequest(BaseModel):
    to_email: str
    to_name: str = "Prueba"


# ---------------------------------------------------------------------------
# Admin — sólo accesible para el dueño de la plataforma
# ---------------------------------------------------------------------------

ADMIN_CLERK_USER_ID = os.environ.get("ADMIN_CLERK_USER_ID", "")


def _require_admin(request: Request):
    user_id = request.headers.get("x-clerk-user-id", "")
    if not ADMIN_CLERK_USER_ID or user_id != ADMIN_CLERK_USER_ID:
        raise HTTPException(status_code=403, detail="Acceso denegado.")


@app.get("/api/admin/stats")
def admin_stats(db: Session = Depends(get_db), _: None = Depends(_require_admin)):
    from sqlalchemy import func, extract
    from datetime import date

    total_negocios = db.query(func.count(Negocio.id)).scalar()
    negocios_activos = db.query(func.count(Negocio.id)).filter(Negocio.activo == True).scalar()
    con_suscripcion = db.query(func.count(Negocio.id)).filter(
        Negocio.stripe_subscription_id.isnot(None)
    ).scalar()

    hoy = date.today()
    citas_mes = db.query(func.count(Cita.id)).filter(
        extract("month", Cita.hora_inicio) == hoy.month,
        extract("year", Cita.hora_inicio) == hoy.year,
    ).scalar()

    ingresos_mes = db.query(func.coalesce(func.sum(Cita.monto_anticipo), 0)).filter(
        Cita.pagado == True,
        extract("month", Cita.hora_inicio) == hoy.month,
        extract("year", Cita.hora_inicio) == hoy.year,
    ).scalar()

    return {
        "total_negocios": total_negocios,
        "negocios_activos": negocios_activos,
        "con_suscripcion": con_suscripcion,
        "citas_mes": citas_mes,
        "ingresos_mes": float(ingresos_mes),
    }


@app.get("/api/admin/negocios")
def admin_negocios(db: Session = Depends(get_db), _: None = Depends(_require_admin)):
    from sqlalchemy import func

    negocios = db.query(Negocio).order_by(Negocio.fecha_creacion.desc()).all()
    result = []
    for n in negocios:
        total_citas = db.query(func.count(Cita.id)).filter(Cita.negocio_id == n.id).scalar()
        admin_emp = next(
            (e for e in n.empleados if e.rol.value == "ADMIN"), None
        )
        result.append({
            "id": str(n.id),
            "nombre": n.nombre,
            "slug": n.slug,
            "giro": n.giro,
            "email": admin_emp.email if admin_emp else None,
            "activo": n.activo,
            "con_suscripcion": bool(n.stripe_subscription_id),
            "stripe_charges_enabled": n.stripe_charges_enabled,
            "total_citas": total_citas,
            "fecha_creacion": n.fecha_creacion.isoformat(),
        })
    return result


@app.patch("/api/admin/negocio/{negocio_id}/activo")
def admin_toggle_activo(
    negocio_id: str,
    db: Session = Depends(get_db),
    _: None = Depends(_require_admin),
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    negocio = db.query(Negocio).filter(Negocio.id == nid).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")
    negocio.activo = not negocio.activo
    db.commit()
    return {"activo": negocio.activo}


@app.post("/api/admin/negocio/{negocio_id}/cancel-subscription")
def admin_cancel_subscription(
    negocio_id: str,
    db: Session = Depends(get_db),
    _: None = Depends(_require_admin),
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    negocio = db.query(Negocio).filter(Negocio.id == nid).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")
    if not negocio.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="El negocio no tiene suscripción activa.")
    try:
        stripe.Subscription.cancel(negocio.stripe_subscription_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al cancelar en Stripe: {e}")
    negocio.stripe_subscription_id = None
    db.commit()
    return {"ok": True}


@app.get("/api/debug-env")
async def debug_env():
    return {
        "SUPABASE_URL": os.environ.get("SUPABASE_URL", "EMPTY"),
        "SUPABASE_SERVICE_KEY": "SET" if os.environ.get("SUPABASE_SERVICE_KEY") else "EMPTY",
        "BREVO_API_KEY": "SET" if os.environ.get("BREVO_API_KEY") else "EMPTY",
        "env_path": _env_path,
        "env_path_exists": os.path.exists(_env_path),
    }


@app.post("/api/test-email")
async def test_email(body: TestEmailRequest):
    """Envía un email de prueba para verificar la configuración de Brevo."""
    from .notificaciones import enviar_email as _enviar
    from datetime import datetime as _dt

    ok = _enviar(
        to_email=body.to_email,
        to_name=body.to_name,
        subject="Prueba de email — AgendaAbierta",
        html=f"""
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px">
          <h2 style="color:#16a34a">Email de prueba</h2>
          <p>Este es un email de prueba enviado desde AgendaAbierta.</p>
          <p style="color:#9ca3af;font-size:12px">Enviado el {_dt.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        """,
    )
    if ok:
        return {"ok": True, "mensaje": f"Email enviado a {body.to_email}"}
    raise HTTPException(
        status_code=502,
        detail="No se pudo enviar el email. Revisa los logs del servidor y verifica BREVO_API_KEY y el dominio remitente.",
    )


# ---------------------------------------------------------------------------
# Rutas — Stripe Connect (pagos del negocio a sus clientes)
# ---------------------------------------------------------------------------

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:4001")


@app.post("/api/negocio/{negocio_id}/stripe-connect/onboard")
async def stripe_connect_onboard(negocio_id: str, db: Session = Depends(get_db)):
    """
    Crea (o recupera) una cuenta Stripe Express para el negocio
    y devuelve la URL de onboarding de Stripe.
    """
    nid = _parse_uuid(negocio_id, "ID de negocio")
    negocio = db.query(Negocio).filter(Negocio.id == nid).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    try:
        # Crear cuenta Express si no existe aún
        if not negocio.stripe_connect_id:
            account = stripe.Account.create(
                type="express",
                country="MX",
                email=negocio.email_negocio or None,
                capabilities={"card_payments": {"requested": True}, "transfers": {"requested": True}},
                business_profile={"name": negocio.nombre},
            )
            negocio.stripe_connect_id = account.id
            db.commit()

        # Generar link de onboarding
        link = stripe.AccountLink.create(
            account=negocio.stripe_connect_id,
            refresh_url=f"{FRONTEND_URL}/dashboard?stripe_refresh=1&negocio={negocio_id}",
            return_url=f"{FRONTEND_URL}/dashboard?stripe_connected=1",
            type="account_onboarding",
        )
        return {"url": link.url, "stripe_connect_id": negocio.stripe_connect_id}
    except stripe.error.StripeError as e:  # type: ignore
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/negocio/{negocio_id}/stripe-connect/status")
async def stripe_connect_status(negocio_id: str, db: Session = Depends(get_db)):
    """Verifica si la cuenta Stripe Connect del negocio está activa."""
    nid = _parse_uuid(negocio_id, "ID de negocio")
    negocio = db.query(Negocio).filter(Negocio.id == nid).first()
    if not negocio or not negocio.stripe_connect_id:
        return {"conectado": False}
    try:
        account = stripe.Account.retrieve(negocio.stripe_connect_id)
        conectado = bool(account.get("charges_enabled", False))
        # Persistir el estado para que la página pública lo lea sin llamar a Stripe
        if negocio.stripe_charges_enabled != conectado:
            negocio.stripe_charges_enabled = conectado
            db.commit()
        return {"conectado": conectado, "stripe_connect_id": negocio.stripe_connect_id}
    except stripe.error.StripeError:  # type: ignore
        return {"conectado": False}


# ---------------------------------------------------------------------------
# Webhook de Stripe
# ---------------------------------------------------------------------------

@app.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Recibe eventos de Stripe.
    Eventos manejados:
      - checkout.session.completed  → marca la cita como pagada y CONFIRMADA
      - account.updated             → (futuro) sincronizar estado del onboarding
    """
    import json as _json

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if STRIPE_WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        except stripe.error.SignatureVerificationError:  # type: ignore
            raise HTTPException(status_code=400, detail="Firma inválida")
    else:
        # Sin secret configurado (desarrollo local) — parsear directamente
        try:
            event = _json.loads(payload)
        except Exception:
            raise HTTPException(status_code=400, detail="Payload inválido")

    event_type = event.get("type") if isinstance(event, dict) else event["type"]

    # ── checkout.session.completed ─────────────────────────────────────────
    if event_type == "checkout.session.completed":
        session_obj = event["data"]["object"]
        cita_id_str = (session_obj.get("metadata") or {}).get("cita_id")
        if cita_id_str:
            try:
                cita_id = uuid.UUID(cita_id_str)
                cita = db.query(Cita).filter(Cita.id == cita_id).first()
                if cita:
                    cita.pagado = True
                    amount_total = session_obj.get("amount_total") or 0
                    if amount_total:
                        cita.monto_anticipo = Decimal(str(amount_total)) / 100
                    if cita.estado == EstadoCita.PENDIENTE:
                        cita.estado = EstadoCita.CONFIRMADA
                    db.commit()
                    print(f"[webhook] Cita {cita_id_str} marcada como pagada y CONFIRMADA")
            except Exception as e:
                print(f"[webhook] Error actualizando cita {cita_id_str}: {e}")

    # ── account.updated ────────────────────────────────────────────────────
    elif event_type == "account.updated":
        account_obj = event["data"]["object"]
        charges_enabled = bool(account_obj.get("charges_enabled", False))
        account_id = account_obj.get("id", "")
        print(f"[webhook] account.updated {account_id} charges_enabled={charges_enabled}")
        try:
            negocio = db.query(Negocio).filter(
                Negocio.stripe_connect_id == account_id
            ).first()
            if negocio and negocio.stripe_charges_enabled != charges_enabled:
                negocio.stripe_charges_enabled = charges_enabled
                db.commit()
        except Exception as e:
            print(f"[webhook] Error actualizando stripe_charges_enabled: {e}")

    return {"received": True}


# ---------------------------------------------------------------------------
# Ruta — Registro inicial
# ---------------------------------------------------------------------------


@app.post("/api/register", response_model=RegisterResponse)
async def register_user(request: RegisterRequest, db: Session = Depends(get_db)):
    try:
        print(
            f"Creando Negocio: {request.businessName} (Giro: {request.selectedType})"
        )

        nuevo_negocio = Negocio(
            nombre=request.businessName,
            slug=request.businessName.lower().replace(" ", "-")
            + "-"
            + str(uuid.uuid4())[:8],
            giro=request.selectedType,
            stripe_customer_id=request.stripeCustomerId or None,
            stripe_subscription_id=request.stripeSubscriptionId or None,
        )
        db.add(nuevo_negocio)
        db.flush()

        nuevo_empleado = Empleado(
            negocio_id=nuevo_negocio.id,
            nombre=request.name,
            email=request.email,
            rol=RolEmpleado.ADMIN,
            activo=True,
            clerk_user_id=request.clerkUserId if request.clerkUserId else None,
        )
        db.add(nuevo_empleado)

        for srv in request.services:
            nuevo_servicio = Servicio(
                negocio_id=nuevo_negocio.id,
                nombre=srv.name,
                precio=srv.price,
                duracion_minutos=int(srv.duration),
            )
            db.add(nuevo_servicio)

        dias_map = {
            "lunes": 0,
            "martes": 1,
            "miercoles": 2,
            "jueves": 3,
            "viernes": 4,
            "sabado": 5,
            "domingo": 6,
        }
        for dia_str, dia_data in request.schedule.items():
            dia_num = dias_map.get(dia_str)
            if dia_num is not None:
                if dia_data.active and dia_data.slots:
                    for slot in dia_data.slots:
                        hora_apertura = datetime.strptime(slot.open, "%H:%M").time()
                        hora_cierre = datetime.strptime(slot.close, "%H:%M").time()
                        nuevo_horario = HorarioTrabajo(
                            negocio_id=nuevo_negocio.id,
                            dia_semana=dia_num,
                            hora_apertura=hora_apertura,
                            hora_cierre=hora_cierre,
                            esta_cerrado=False,
                        )
                        db.add(nuevo_horario)
                else:
                    nuevo_horario = HorarioTrabajo(
                        negocio_id=nuevo_negocio.id,
                        dia_semana=dia_num,
                        esta_cerrado=True,
                    )
                    db.add(nuevo_horario)

        db.commit()
        print(f"Datos guardados en SQLite (agenda.db)")

        send_welcome_email(request.email, request.name, request.plan)
        token = create_jwt_token(str(nuevo_empleado.id), request.email)

        return RegisterResponse(
            success=True,
            message="Registro exitoso.",
            token=token,
            negocio_id=str(nuevo_negocio.id),
        )

    except stripe.error.CardError as e:  # type: ignore
        raise HTTPException(status_code=400, detail=e.user_message)
    except Exception as e:
        db.rollback()
        print(f"Error en registro: {e}")
        raise HTTPException(
            status_code=500, detail="Ocurrió un error al procesar el registro."
        )


# ---------------------------------------------------------------------------
# Import adicional — BloqueoTiempo
# ---------------------------------------------------------------------------

from .modelos import BloqueoTiempo  # noqa: E402

# ---------------------------------------------------------------------------
# Schemas — Endpoints Públicos
# ---------------------------------------------------------------------------


class ServicioPublico(BaseModel):
    id: str
    nombre: str
    descripcion: Optional[str] = None
    precio: str
    duracion_minutos: int


class EmpleadoPublico(BaseModel):
    id: str
    nombre: str
    especialidad: Optional[str] = None


class NegocioPublicoResponse(BaseModel):
    id: str
    nombre: str
    slug: str
    giro: Optional[str] = None
    descripcion: Optional[str] = None
    direccion: Optional[str] = None
    color_marca: Optional[str] = None
    url_logo: Optional[str] = None
    servicios: List[ServicioPublico]
    empleados: List[EmpleadoPublico]
    acepta_pago_en_linea: bool = False
    cancelacion_horas: Optional[int] = None
    terminos_reembolso: Optional[str] = None
    timezone: str = "America/Mexico_City"


class SlotsResponse(BaseModel):
    fecha: str
    slots: List[str]


class ReservaRequest(BaseModel):
    servicio_id: str
    empleado_id: Optional[str] = None
    hora_inicio: str  # ISO 8601: "2025-07-15T10:00:00"
    cliente_nombre: str
    cliente_telefono: str
    cliente_email: str
    metodo_pago: Optional[str] = "en_fisico"  # "en_linea" | "en_fisico"
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class ReservaResponse(BaseModel):
    success: bool
    cita_id: str
    mensaje: str
    checkout_url: Optional[str] = None


# ---------------------------------------------------------------------------
# Schemas — Bloqueos de Tiempo
# ---------------------------------------------------------------------------


class BloqueoCreateRequest(BaseModel):
    hora_inicio: str  # ISO 8601
    hora_fin: str  # ISO 8601
    motivo: Optional[str] = None
    notas: Optional[str] = None
    empleado_id: Optional[str] = None


class BloqueoItem(BaseModel):
    id: str
    negocio_id: str
    empleado_id: Optional[str] = None
    hora_inicio: str
    hora_fin: str
    motivo: Optional[str] = None
    notas: Optional[str] = None


# ---------------------------------------------------------------------------
# Schemas — Horarios (PUT reemplazo completo)
# ---------------------------------------------------------------------------


class HorarioDiaRequest(BaseModel):
    dia_semana: int  # 0=Lunes … 6=Domingo
    hora_apertura: Optional[str] = None  # "HH:MM" o null si cerrado
    hora_cierre: Optional[str] = None  # "HH:MM" o null si cerrado
    esta_cerrado: bool


# ---------------------------------------------------------------------------
# Helper — normaliza datetimes para comparaciones naive vs aware
# ---------------------------------------------------------------------------


def _strip_tz(dt: datetime) -> datetime:
    """Quita tzinfo para comparar datetimes de forma homogénea."""
    return dt.replace(tzinfo=None) if dt.tzinfo else dt


# ---------------------------------------------------------------------------
# Endpoints Públicos — GET /api/public/negocio/{slug}
# ---------------------------------------------------------------------------


@app.get("/api/public/negocio/{slug}", response_model=NegocioPublicoResponse)
async def get_negocio_publico(slug: str, db: Session = Depends(get_db)):
    negocio = db.query(Negocio).filter(Negocio.slug == slug).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    servicios = db.query(Servicio).filter(Servicio.negocio_id == negocio.id).all()
    empleados = (
        db.query(Empleado)
        .filter(
            Empleado.negocio_id == negocio.id,
            Empleado.activo == True,  # noqa: E712
        )
        .all()
    )

    return NegocioPublicoResponse(
        id=str(negocio.id),
        nombre=negocio.nombre,
        slug=negocio.slug,
        giro=negocio.giro,
        descripcion=negocio.descripcion,
        direccion=negocio.direccion,
        color_marca=negocio.color_marca,
        url_logo=negocio.url_logo,
        servicios=[
            ServicioPublico(
                id=str(s.id),
                nombre=s.nombre,
                descripcion=s.descripcion,
                precio=f"{s.precio:.2f}",
                duracion_minutos=s.duracion_minutos,
            )
            for s in servicios
        ],
        empleados=[EmpleadoPublico(id=str(e.id), nombre=e.nombre) for e in empleados],
        acepta_pago_en_linea=bool(negocio.stripe_charges_enabled),
        cancelacion_horas=negocio.cancelacion_horas,
        terminos_reembolso=negocio.terminos_reembolso,
        timezone=negocio.timezone or "America/Mexico_City",
    )


# ---------------------------------------------------------------------------
# Endpoints Públicos — GET /api/public/negocio/{slug}/slots
# ---------------------------------------------------------------------------


@app.get("/api/public/negocio/{slug}/slots", response_model=SlotsResponse)
async def get_slots_disponibles(
    slug: str,
    fecha: str,
    servicio_id: str,
    empleado_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    # Buscar negocio por slug
    negocio = db.query(Negocio).filter(Negocio.slug == slug).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    # Parsear fecha
    try:
        fecha_dt = datetime.strptime(fecha, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD."
        )

    # Parsear servicio_id
    sid = _parse_uuid(servicio_id, "ID de servicio")
    servicio = (
        db.query(Servicio)
        .filter(Servicio.id == sid, Servicio.negocio_id == negocio.id)
        .first()
    )
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado.")

    # Parsear empleado_id opcional
    eid = _parse_uuid(empleado_id, "ID de empleado") if empleado_id else None

    # Día de la semana: Python weekday() → 0=Lunes, 6=Domingo (igual al modelo)
    dia_semana = fecha_dt.weekday()

    # Buscar horario del negocio para ese día
    horario = (
        db.query(HorarioTrabajo)
        .filter(
            HorarioTrabajo.negocio_id == negocio.id,
            HorarioTrabajo.dia_semana == dia_semana,
        )
        .first()
    )

    if (
        not horario
        or horario.esta_cerrado
        or not horario.hora_apertura
        or not horario.hora_cierre
    ):
        return SlotsResponse(fecha=fecha, slots=[])

    # Generar todos los slots posibles entre apertura y cierre
    duracion = timedelta(minutes=servicio.duracion_minutos)
    apertura = datetime(
        fecha_dt.year,
        fecha_dt.month,
        fecha_dt.day,
        horario.hora_apertura.hour,
        horario.hora_apertura.minute,
    )
    cierre = datetime(
        fecha_dt.year,
        fecha_dt.month,
        fecha_dt.day,
        horario.hora_cierre.hour,
        horario.hora_cierre.minute,
    )

    slots_candidatos: List[datetime] = []
    cursor = apertura
    while cursor + duracion <= cierre:
        slots_candidatos.append(cursor)
        cursor += duracion

    # Rango del día para filtrar citas y bloqueos
    inicio_dia = datetime(fecha_dt.year, fecha_dt.month, fecha_dt.day, 0, 0, 0)
    fin_dia = datetime(fecha_dt.year, fecha_dt.month, fecha_dt.day, 23, 59, 59, 999999)

    # Citas activas del negocio en ese día (excluyendo canceladas)
    q_citas = db.query(Cita).filter(
        Cita.negocio_id == negocio.id,
        Cita.estado != EstadoCita.CANCELADA,
        Cita.hora_inicio < fin_dia,
        Cita.hora_fin > inicio_dia,
    )
    if eid:
        q_citas = q_citas.filter(Cita.empleado_id == eid)
    citas_activas = q_citas.all()

    # Bloqueos activos del negocio en ese día
    q_bloqueos = db.query(BloqueoTiempo).filter(
        BloqueoTiempo.negocio_id == negocio.id,
        BloqueoTiempo.hora_inicio < fin_dia,
        BloqueoTiempo.hora_fin > inicio_dia,
    )
    if eid:
        # Bloqueos del empleado concreto O bloqueos globales (sin empleado)
        q_bloqueos = q_bloqueos.filter(
            (BloqueoTiempo.empleado_id == eid) | (BloqueoTiempo.empleado_id == None)  # noqa: E711
        )
    bloqueos = q_bloqueos.all()

    # Filtrar slots con solapamiento
    slots_libres: List[str] = []
    for slot_inicio in slots_candidatos:
        slot_fin = slot_inicio + duracion

        solapado_cita = any(
            slot_inicio < _strip_tz(c.hora_fin) and slot_fin > _strip_tz(c.hora_inicio)
            for c in citas_activas
        )
        solapado_bloqueo = any(
            slot_inicio < b.hora_fin and slot_fin > b.hora_inicio for b in bloqueos
        )

        if not solapado_cita and not solapado_bloqueo:
            slots_libres.append(slot_inicio.strftime("%H:%M"))

    return SlotsResponse(fecha=fecha, slots=slots_libres)


# ---------------------------------------------------------------------------
# Endpoints Públicos — POST /api/public/negocio/{slug}/reservar
# ---------------------------------------------------------------------------


@app.post("/api/public/negocio/{slug}/reservar", response_model=ReservaResponse)
async def reservar_cita_publica(
    slug: str, body: ReservaRequest, db: Session = Depends(get_db)
):
    negocio = db.query(Negocio).filter(Negocio.slug == slug).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    # Parsear y validar servicio
    sid = _parse_uuid(body.servicio_id, "ID de servicio")
    servicio = (
        db.query(Servicio)
        .filter(Servicio.id == sid, Servicio.negocio_id == negocio.id)
        .first()
    )
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado.")

    # Parsear hora_inicio y calcular hora_fin
    try:
        hora_inicio = datetime.fromisoformat(body.hora_inicio)
    except ValueError:
        raise HTTPException(
            status_code=400, detail="Formato de hora_inicio inválido. Use ISO 8601."
        )
    hora_fin = hora_inicio + timedelta(minutes=servicio.duracion_minutos)

    # Resolver empleado
    if body.empleado_id:
        eid = _parse_uuid(body.empleado_id, "ID de empleado")
        empleado = (
            db.query(Empleado)
            .filter(
                Empleado.id == eid,
                Empleado.negocio_id == negocio.id,
                Empleado.activo == True,  # noqa: E712
            )
            .first()
        )
        if not empleado:
            raise HTTPException(
                status_code=404, detail="Empleado no encontrado o inactivo."
            )
        eid = empleado.id
    else:
        # Asignar primer empleado activo disponible
        empleado = (
            db.query(Empleado)
            .filter(
                Empleado.negocio_id == negocio.id,
                Empleado.activo == True,  # noqa: E712
            )
            .first()
        )
        if not empleado:
            raise HTTPException(status_code=400, detail="No hay empleados disponibles.")
        eid = empleado.id

    # Verificar solapamiento con citas existentes
    cita_solapada = (
        db.query(Cita)
        .filter(
            Cita.negocio_id == negocio.id,
            Cita.empleado_id == eid,
            Cita.estado != EstadoCita.CANCELADA,
            Cita.hora_inicio < hora_fin,
            Cita.hora_fin > hora_inicio,
        )
        .first()
    )
    if cita_solapada:
        raise HTTPException(
            status_code=409, detail="El slot seleccionado ya no está disponible."
        )

    # Verificar solapamiento con bloqueos
    bloqueo_solapado = (
        db.query(BloqueoTiempo)
        .filter(
            BloqueoTiempo.negocio_id == negocio.id,
            BloqueoTiempo.hora_inicio < hora_fin,
            BloqueoTiempo.hora_fin > hora_inicio,
        )
        .first()
    )
    if bloqueo_solapado:
        raise HTTPException(
            status_code=409, detail="El slot seleccionado está bloqueado."
        )

    # Buscar o crear cliente por teléfono dentro del negocio
    cliente = (
        db.query(Cliente)
        .filter(
            Cliente.negocio_id == negocio.id,
            Cliente.telefono == body.cliente_telefono,
        )
        .first()
    )
    if not cliente:
        cliente = Cliente(
            negocio_id=negocio.id,
            nombre=body.cliente_nombre,
            telefono=body.cliente_telefono,
            email=body.cliente_email,
        )
        db.add(cliente)
        db.flush()

    # Crear la cita con estado PENDIENTE
    nueva_cita = Cita(
        negocio_id=negocio.id,
        cliente_id=cliente.id,
        empleado_id=eid,
        servicio_id=sid,
        hora_inicio=hora_inicio,
        hora_fin=hora_fin,
        estado=EstadoCita.PENDIENTE,
        metodo_pago=body.metodo_pago or "en_fisico",
    )
    db.add(nueva_cita)
    db.commit()
    db.refresh(nueva_cita)

    # Pago en línea — crear Stripe Checkout Session
    checkout_url = None
    if body.metodo_pago == "en_linea" and body.success_url and body.cancel_url:
        try:
            session_params: dict = dict(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "mxn",
                            "product_data": {"name": servicio.nombre},
                            "unit_amount": int(servicio.precio * 100),
                        },
                        "quantity": 1,
                    }
                ],
                mode="payment",
                success_url=f"{body.success_url}?pago=exitoso&cita_id={nueva_cita.id}",
                cancel_url=f"{body.cancel_url}?pago=cancelado&cita_id={nueva_cita.id}",
                metadata={"cita_id": str(nueva_cita.id)},
                customer_email=body.cliente_email or None,
            )
            # Si el negocio tiene Stripe Connect, enrutar el pago a su cuenta
            if negocio.stripe_connect_id:
                pi_data: dict = {"transfer_data": {"destination": negocio.stripe_connect_id}}
                if STRIPE_PLATFORM_FEE_PCT > 0:
                    pi_data["application_fee_amount"] = int(
                        servicio.precio * 100 * STRIPE_PLATFORM_FEE_PCT / 100
                    )
                session_params["payment_intent_data"] = pi_data
            session = stripe.checkout.Session.create(**session_params)
            checkout_url = session.url
            nueva_cita.stripe_session_id = session.id
            db.commit()
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"Cita guardada pero no se pudo crear el pago: {str(e)}",
            )

    # Enviar notificaciones en background (no bloquea la respuesta)
    _notif_executor.submit(
        notificar_reserva,
        negocio_nombre=negocio.nombre,
        negocio_email=negocio.email_negocio,
        negocio_telefono=negocio.telefono_negocio,
        negocio_direccion=negocio.direccion,
        negocio_clabe=negocio.clabe,
        negocio_banco=negocio.banco,
        negocio_titular=negocio.titular_cuenta,
        notif_email=bool(negocio.notif_email),
        notif_whatsapp=bool(negocio.notif_whatsapp),
        cliente_nombre=body.cliente_nombre,
        cliente_email=body.cliente_email,
        cliente_telefono=body.cliente_telefono,
        servicio_nombre=servicio.nombre,
        empleado_nombre=empleado.nombre if empleado else "—",
        hora_inicio=hora_inicio,
    )

    return ReservaResponse(
        success=True,
        cita_id=str(nueva_cita.id),
        mensaje="Cita agendada exitosamente",
        checkout_url=checkout_url,
    )


# ---------------------------------------------------------------------------
# Payment link para cita existente
# ---------------------------------------------------------------------------

@app.post("/api/negocio/{negocio_id}/citas/{cita_id}/payment-link")
async def cita_payment_link(negocio_id: str, cita_id: str, db: Session = Depends(get_db)):
    """Genera (o reutiliza) un Stripe Checkout Session para cobrar una cita."""
    nid = _parse_uuid(negocio_id, "ID de negocio")
    xid = _parse_uuid(cita_id, "ID de cita")

    negocio = db.query(Negocio).filter(Negocio.id == nid).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    cita = db.query(Cita).filter(Cita.id == xid, Cita.negocio_id == nid).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada.")

    if cita.pagado:
        raise HTTPException(status_code=400, detail="La cita ya fue pagada.")

    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Stripe no configurado.")

    # Reutilizar sesión existente si aún está activa
    if cita.stripe_session_id:
        try:
            session = stripe.checkout.Session.retrieve(cita.stripe_session_id)
            if session.status == "open":
                return {"url": session.url}
        except Exception:
            pass  # Sesión expirada, crear una nueva

    servicio = db.query(Servicio).filter(Servicio.id == cita.servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado.")

    cliente = db.query(Cliente).filter(Cliente.id == cita.cliente_id).first()

    try:
        session_params: dict = dict(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "mxn",
                    "product_data": {"name": servicio.nombre},
                    "unit_amount": int(servicio.precio * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{FRONTEND_URL}/dashboard?pago=exitoso&cita_id={cita_id}",
            cancel_url=f"{FRONTEND_URL}/dashboard?pago=cancelado&cita_id={cita_id}",
            metadata={"cita_id": str(cita.id)},
            customer_email=cliente.email if cliente and cliente.email else None,
        )
        if negocio.stripe_connect_id:
            pi_data: dict = {"transfer_data": {"destination": negocio.stripe_connect_id}}
            if STRIPE_PLATFORM_FEE_PCT > 0:
                pi_data["application_fee_amount"] = int(
                    servicio.precio * 100 * STRIPE_PLATFORM_FEE_PCT / 100
                )
            session_params["payment_intent_data"] = pi_data

        session = stripe.checkout.Session.create(**session_params)
        cita.stripe_session_id = session.id
        cita.metodo_pago = "en_linea"
        db.commit()
        return {"url": session.url}
    except stripe.error.StripeError as e:  # type: ignore
        raise HTTPException(status_code=502, detail=str(e))


# ---------------------------------------------------------------------------
# Endpoints Bloqueos — GET /api/negocio/{negocio_id}/bloqueos
# ---------------------------------------------------------------------------


@app.get("/api/negocio/{negocio_id}/bloqueos", response_model=List[BloqueoItem])
async def list_bloqueos(negocio_id: str, db: Session = Depends(get_db)):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    negocio = db.query(Negocio).filter(Negocio.id == nid).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    ahora = datetime.now()
    bloqueos = (
        db.query(BloqueoTiempo)
        .filter(
            BloqueoTiempo.negocio_id == nid,
            BloqueoTiempo.hora_fin >= ahora,
        )
        .order_by(BloqueoTiempo.hora_inicio.asc())
        .all()
    )

    return [
        BloqueoItem(
            id=str(b.id),
            negocio_id=str(b.negocio_id),
            empleado_id=str(b.empleado_id) if b.empleado_id else None,
            hora_inicio=b.hora_inicio.isoformat(),
            hora_fin=b.hora_fin.isoformat(),
            motivo=b.motivo,
            notas=b.notas,
        )
        for b in bloqueos
    ]


# ---------------------------------------------------------------------------
# Endpoints Bloqueos — POST /api/negocio/{negocio_id}/bloqueos
# ---------------------------------------------------------------------------


@app.post("/api/negocio/{negocio_id}/bloqueos", response_model=BloqueoItem)
async def create_bloqueo(
    negocio_id: str, body: BloqueoCreateRequest, db: Session = Depends(get_db)
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    negocio = db.query(Negocio).filter(Negocio.id == nid).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    try:
        hi = datetime.fromisoformat(body.hora_inicio)
        hf = datetime.fromisoformat(body.hora_fin)
    except ValueError:
        raise HTTPException(
            status_code=400, detail="Formato de fechas inválido. Use ISO 8601."
        )

    if hf <= hi:
        raise HTTPException(
            status_code=400,
            detail="hora_fin debe ser posterior a hora_inicio.",
        )

    eid = None
    if body.empleado_id:
        eid = _parse_uuid(body.empleado_id, "ID de empleado")
        empleado = (
            db.query(Empleado)
            .filter(Empleado.id == eid, Empleado.negocio_id == nid)
            .first()
        )
        if not empleado:
            raise HTTPException(status_code=404, detail="Empleado no encontrado.")

    bloqueo = BloqueoTiempo(
        negocio_id=nid,
        empleado_id=eid,
        hora_inicio=hi,
        hora_fin=hf,
        motivo=body.motivo,
        notas=body.notas,
    )
    db.add(bloqueo)
    db.commit()
    db.refresh(bloqueo)

    return BloqueoItem(
        id=str(bloqueo.id),
        negocio_id=str(bloqueo.negocio_id),
        empleado_id=str(bloqueo.empleado_id) if bloqueo.empleado_id else None,
        hora_inicio=bloqueo.hora_inicio.isoformat(),
        hora_fin=bloqueo.hora_fin.isoformat(),
        motivo=bloqueo.motivo,
        notas=bloqueo.notas,
    )


# ---------------------------------------------------------------------------
# Endpoints Bloqueos — DELETE /api/negocio/{negocio_id}/bloqueos/{bloqueo_id}
# ---------------------------------------------------------------------------


@app.delete("/api/negocio/{negocio_id}/bloqueos/{bloqueo_id}", status_code=204)
async def delete_bloqueo(
    negocio_id: str, bloqueo_id: str, db: Session = Depends(get_db)
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    bid = _parse_uuid(bloqueo_id, "ID de bloqueo")

    bloqueo = (
        db.query(BloqueoTiempo)
        .filter(BloqueoTiempo.id == bid, BloqueoTiempo.negocio_id == nid)
        .first()
    )
    if not bloqueo:
        raise HTTPException(status_code=404, detail="Bloqueo no encontrado.")

    db.delete(bloqueo)
    db.commit()


# ---------------------------------------------------------------------------
# Endpoint Horarios — PUT /api/negocio/{negocio_id}/horarios
# ---------------------------------------------------------------------------


@app.put("/api/negocio/{negocio_id}/horarios")
async def update_horarios(
    negocio_id: str,
    body: List[HorarioDiaRequest],
    db: Session = Depends(get_db),
):
    nid = _parse_uuid(negocio_id, "ID de negocio")
    negocio = db.query(Negocio).filter(Negocio.id == nid).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    # Validar entradas antes de tocar la base de datos
    for h in body:
        if h.dia_semana < 0 or h.dia_semana > 6:
            raise HTTPException(
                status_code=400,
                detail=f"dia_semana inválido: {h.dia_semana}. Debe ser 0-6.",
            )
        if not h.esta_cerrado:
            if not h.hora_apertura or not h.hora_cierre:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Día {h.dia_semana}: se requieren hora_apertura y "
                        "hora_cierre cuando esta_cerrado es false."
                    ),
                )

    # Reemplazar todos los horarios existentes del negocio
    db.query(HorarioTrabajo).filter(HorarioTrabajo.negocio_id == nid).delete()

    nuevos: List[HorarioTrabajo] = []
    for h in body:
        hora_apertura = None
        hora_cierre = None

        if not h.esta_cerrado and h.hora_apertura and h.hora_cierre:
            try:
                hora_apertura = datetime.strptime(h.hora_apertura, "%H:%M").time()
                hora_cierre = datetime.strptime(h.hora_cierre, "%H:%M").time()
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Formato de hora inválido en día {h.dia_semana}. Use HH:MM."
                    ),
                )

        nuevo = HorarioTrabajo(
            negocio_id=nid,
            dia_semana=h.dia_semana,
            hora_apertura=hora_apertura,
            hora_cierre=hora_cierre,
            esta_cerrado=h.esta_cerrado,
        )
        db.add(nuevo)
        nuevos.append(nuevo)

    db.commit()

    return [
        {
            "id": str(h.id),
            "dia_semana": h.dia_semana,
            "hora_apertura": (
                h.hora_apertura.strftime("%H:%M") if h.hora_apertura else None
            ),
            "hora_cierre": (h.hora_cierre.strftime("%H:%M") if h.hora_cierre else None),
            "esta_cerrado": h.esta_cerrado,
        }
        for h in nuevos
    ]
