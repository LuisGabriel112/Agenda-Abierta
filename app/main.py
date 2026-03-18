import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional

import stripe
from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import engine, get_db
from .modelos import Base, Empleado, HorarioTrabajo, Negocio, RolEmpleado, Servicio

# Configuración de Stripe (Idealmente usar variables de entorno)
stripe.api_key = "sk_test_YOUR_SECRET_KEY_HERE"  # Reemplazar con tu Secret Key real

# Crear las tablas en la base de datos (SQLite)
Base.metadata.create_all(bind=engine)

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Schemas
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
    clerkUserId: Optional[str] = None  # ID de Clerk del usuario autenticado


class RegisterResponse(BaseModel):
    success: bool
    message: str
    token: str
    negocio_id: str


class NegocioUpdateRequest(BaseModel):
    nombre: Optional[str] = None
    giro: Optional[str] = None
    descripcion: Optional[str] = None
    direccion: Optional[str] = None
    color_marca: Optional[str] = None


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
# Utilidades
# ---------------------------------------------------------------------------


def send_welcome_email(email: str, name: str, plan: str):
    print(f"==================================================")
    print(f"📧 ENVIANDO CORREO A: {email}")
    print(f"Asunto: ¡Bienvenido a AgendaAbierta, {name}!")
    print(
        f"Mensaje: Tu pago se ha procesado correctamente. Disfruta de tu plan {plan.capitalize()}."
    )
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
    signature = "simulated_signature_123"
    return f"{header}.{payload}.{signature}"


# ---------------------------------------------------------------------------
# Rutas
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/me")
async def get_me(clerk_user_id: str, db: Session = Depends(get_db)):
    """
    Verifica si un clerk_user_id ya tiene un negocio registrado.
    El frontend llama a esto justo después de que Clerk autentica al usuario.
    """
    empleado = (
        db.query(Empleado).filter(Empleado.clerk_user_id == clerk_user_id).first()
    )

    if not empleado:
        raise HTTPException(
            status_code=404,
            detail="Usuario no registrado. Debe completar el onboarding.",
        )

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
    }


@app.get("/api/negocio/{negocio_id}", response_model=DashboardDataResponse)
async def get_negocio(negocio_id: str, db: Session = Depends(get_db)):
    """Devuelve toda la data del negocio para poblar el dashboard."""
    try:
        nid = uuid.UUID(negocio_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de negocio inválido.")

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
    negocio_id: str,
    body: NegocioUpdateRequest,
    db: Session = Depends(get_db),
):
    """Actualiza los datos del negocio (desde Configuración del dashboard)."""
    try:
        nid = uuid.UUID(negocio_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de negocio inválido.")

    negocio = db.query(Negocio).filter(Negocio.id == nid).first()
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio no encontrado.")

    if body.nombre is not None:
        negocio.nombre = body.nombre
    if body.giro is not None:
        negocio.giro = body.giro
    if body.descripcion is not None:
        negocio.descripcion = body.descripcion
    if body.direccion is not None:
        negocio.direccion = body.direccion
    if body.color_marca is not None:
        negocio.color_marca = body.color_marca

    db.commit()
    db.refresh(negocio)
    return {"success": True, "message": "Negocio actualizado correctamente."}


@app.post("/api/register", response_model=RegisterResponse)
async def register_user(request: RegisterRequest, db: Session = Depends(get_db)):
    try:
        print(f"💳 Procesando pago por ${request.total} MXN")
        print(
            f"🏢 Creando Negocio: {request.businessName} (Giro: {request.selectedType})"
        )

        # 1. Crear Negocio
        nuevo_negocio = Negocio(
            nombre=request.businessName,
            slug=request.businessName.lower().replace(" ", "-")
            + "-"
            + str(uuid.uuid4())[:8],
            giro=request.selectedType,
        )
        db.add(nuevo_negocio)
        db.flush()

        # 2. Crear Empleado (Dueño/Admin) — con clerk_user_id si viene
        nuevo_empleado = Empleado(
            negocio_id=nuevo_negocio.id,
            nombre=request.name,
            email=request.email,
            rol=RolEmpleado.ADMIN,
            activo=True,
            clerk_user_id=request.clerkUserId if request.clerkUserId else None,
        )
        db.add(nuevo_empleado)

        # 3. Crear Servicios
        for srv in request.services:
            nuevo_servicio = Servicio(
                negocio_id=nuevo_negocio.id,
                nombre=srv.name,
                precio=srv.price,
                duracion_minutos=int(srv.duration),
            )
            db.add(nuevo_servicio)

        # 4. Crear Horarios
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
        print(f"✅ ¡Datos guardados correctamente en SQLite (agenda.db)!")

        send_welcome_email(request.email, request.name, request.plan)

        token = create_jwt_token(str(nuevo_empleado.id), request.email)
        print(f"🔑 Token de sesión generado: {token}")

        return RegisterResponse(
            success=True,
            message="Pago realizado, correo enviado y sesión iniciada exitosamente.",
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
