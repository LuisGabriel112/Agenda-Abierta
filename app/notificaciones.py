"""
Módulo de notificaciones via Brevo (email + WhatsApp).
Se activa al crear una reserva si el negocio tiene las notificaciones habilitadas.
"""
import os
import requests
from datetime import datetime

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "noreply@agendaabierta.mx")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "AgendaAbierta")


def _brevo_headers() -> dict:
    return {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY,
    }


def _format_fecha(dt: datetime) -> str:
    dias = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
    meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
             "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    return f"{dias[dt.weekday()]} {dt.day} de {meses[dt.month - 1]} a las {dt.strftime('%H:%M')}"


def enviar_email(to_email: str, to_name: str, subject: str, html: str) -> bool:
    if not BREVO_API_KEY:
        print("[brevo] BREVO_API_KEY no configurada — email no enviado")
        return False
    try:
        res = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers=_brevo_headers(),
            json={
                "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
                "to": [{"email": to_email, "name": to_name}],
                "subject": subject,
                "htmlContent": html,
            },
            timeout=10,
        )
        if res.status_code in (200, 201):
            print(f"[brevo] Email enviado a {to_email} — asunto: {subject}")
            return True
        else:
            print(f"[brevo] Error {res.status_code} al enviar a {to_email}: {res.text}")
            return False
    except Exception as e:
        print(f"[brevo] Excepción al enviar email a {to_email}: {e}")
        return False


def enviar_whatsapp(to_phone: str, template_id: int, params: dict) -> bool:
    """
    Envía un mensaje de WhatsApp usando una plantilla aprobada en Brevo.
    El número debe incluir código de país sin el '+', ej: '5212281234567'
    """
    if not BREVO_API_KEY:
        return False
    try:
        res = requests.post(
            "https://api.brevo.com/v3/whatsapp/sendMessage",
            headers=_brevo_headers(),
            json={
                "receiverNumbers": [f"+{to_phone.lstrip('+')}"],
                "templateId": template_id,
                "params": params,
            },
            timeout=10,
        )
        return res.status_code in (200, 201)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Templates de email
# ---------------------------------------------------------------------------

def _html_confirmacion_cliente(
    cliente_nombre: str,
    negocio_nombre: str,
    servicio_nombre: str,
    hora_inicio: datetime,
    empleado_nombre: str,
    negocio_direccion: str | None,
    clabe: str | None = None,
    banco: str | None = None,
    titular_cuenta: str | None = None,
    cancel_url: str | None = None,
) -> str:
    fecha_str = _format_fecha(hora_inicio)
    direccion_html = f"<p style='margin:6px 0'><b>Dirección:</b> {negocio_direccion}</p>" if negocio_direccion else ""
    clabe_html = ""
    if clabe:
        banco_str = f" ({banco})" if banco else ""
        titular_str = f"<p style='margin:6px 0'><b>Titular:</b> {titular_cuenta}</p>" if titular_cuenta else ""
        clabe_html = f"""
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:16px 0">
        <p style="margin:0 0 8px 0;font-weight:bold;color:#15803d">Datos para anticipo por transferencia</p>
        <p style="margin:6px 0"><b>CLABE:</b> <span style="font-family:monospace;letter-spacing:1px">{clabe}</span>{banco_str}</p>
        {titular_str}
      </div>"""
    cancel_html = ""
    if cancel_url:
        cancel_html = f"""
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;margin:16px 0;text-align:center">
        <p style="margin:0 0 10px 0;font-size:13px;color:#92400e">¿Necesitas cancelar tu cita?</p>
        <a href="{cancel_url}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:13px;font-weight:bold">Cancelar cita</a>
        <p style="margin:10px 0 0 0;font-size:11px;color:#b45309">Este enlace es de un solo uso y solo puede ser usado por ti.</p>
      </div>"""
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px">
      <h2 style="color:#16a34a;margin-bottom:4px">Cita confirmada</h2>
      <p style="color:#6b7280;margin-top:0">Hola {cliente_nombre}, tu cita ha sido agendada exitosamente.</p>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:16px 0">
        <p style="margin:6px 0"><b>Negocio:</b> {negocio_nombre}</p>
        <p style="margin:6px 0"><b>Servicio:</b> {servicio_nombre}</p>
        <p style="margin:6px 0"><b>Fecha:</b> {fecha_str}</p>
        <p style="margin:6px 0"><b>Especialista:</b> {empleado_nombre}</p>
        {direccion_html}
      </div>
      {clabe_html}
      {cancel_html}
      <p style="color:#9ca3af;font-size:12px;text-align:center">AgendaAbierta — gestión de citas para tu negocio</p>
    </div>
    """


def _html_aviso_negocio(
    negocio_nombre: str,
    cliente_nombre: str,
    cliente_telefono: str,
    servicio_nombre: str,
    hora_inicio: datetime,
    empleado_nombre: str,
) -> str:
    fecha_str = _format_fecha(hora_inicio)
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px">
      <h2 style="color:#16a34a;margin-bottom:4px">Nueva cita agendada</h2>
      <p style="color:#6b7280;margin-top:0">Tienes una nueva reserva en {negocio_nombre}.</p>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:16px 0">
        <p style="margin:6px 0"><b>Cliente:</b> {cliente_nombre}</p>
        <p style="margin:6px 0"><b>Teléfono:</b> {cliente_telefono}</p>
        <p style="margin:6px 0"><b>Servicio:</b> {servicio_nombre}</p>
        <p style="margin:6px 0"><b>Fecha:</b> {fecha_str}</p>
        <p style="margin:6px 0"><b>Especialista:</b> {empleado_nombre}</p>
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center">AgendaAbierta</p>
    </div>
    """


# ---------------------------------------------------------------------------
# Template de recordatorio
# ---------------------------------------------------------------------------

def _html_recordatorio_cliente(
    cliente_nombre: str,
    negocio_nombre: str,
    servicio_nombre: str,
    hora_inicio: datetime,
    empleado_nombre: str,
    negocio_direccion: str | None,
) -> str:
    fecha_str = _format_fecha(hora_inicio)
    direccion_html = f"<p style='margin:6px 0'><b>Dirección:</b> {negocio_direccion}</p>" if negocio_direccion else ""
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px">
      <h2 style="color:#16a34a;margin-bottom:4px">Recordatorio de cita</h2>
      <p style="color:#6b7280;margin-top:0">Hola {cliente_nombre}, te recordamos que tienes una cita mañana.</p>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:16px 0">
        <p style="margin:6px 0"><b>Negocio:</b> {negocio_nombre}</p>
        <p style="margin:6px 0"><b>Servicio:</b> {servicio_nombre}</p>
        <p style="margin:6px 0"><b>Fecha:</b> {fecha_str}</p>
        <p style="margin:6px 0"><b>Especialista:</b> {empleado_nombre}</p>
        {direccion_html}
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center">AgendaAbierta — gestión de citas para tu negocio</p>
    </div>
    """


def enviar_recordatorio(
    *,
    cliente_nombre: str,
    cliente_email: str,
    negocio_nombre: str,
    negocio_direccion: str | None,
    servicio_nombre: str,
    empleado_nombre: str,
    hora_inicio: datetime,
) -> bool:
    return enviar_email(
        to_email=cliente_email,
        to_name=cliente_nombre,
        subject=f"Recordatorio: tu cita en {negocio_nombre} es mañana",
        html=_html_recordatorio_cliente(
            cliente_nombre=cliente_nombre,
            negocio_nombre=negocio_nombre,
            servicio_nombre=servicio_nombre,
            hora_inicio=hora_inicio,
            empleado_nombre=empleado_nombre,
            negocio_direccion=negocio_direccion,
        ),
    )


# ---------------------------------------------------------------------------
# Función principal — llamar desde el endpoint de reserva
# ---------------------------------------------------------------------------

def notificar_reserva(
    *,
    negocio_nombre: str,
    negocio_email: str | None,
    negocio_telefono: str | None,
    negocio_direccion: str | None,
    negocio_clabe: str | None = None,
    negocio_banco: str | None = None,
    negocio_titular: str | None = None,
    notif_email: bool,
    notif_whatsapp: bool,
    cliente_nombre: str,
    cliente_email: str | None,
    cliente_telefono: str,
    servicio_nombre: str,
    empleado_nombre: str,
    hora_inicio: datetime,
    cancel_url: str | None = None,
    whatsapp_template_cliente: int = 0,
    whatsapp_template_negocio: int = 0,
) -> None:
    """
    Envía notificaciones al cliente y al negocio tras una reserva exitosa.
    Se ejecuta en background — los errores no bloquean la respuesta.
    """
    fecha_str = _format_fecha(hora_inicio)

    # ── Email al cliente ───────────────────────────────────────────────────
    if notif_email and cliente_email:
        enviar_email(
            to_email=cliente_email,
            to_name=cliente_nombre,
            subject=f"Cita confirmada en {negocio_nombre}",
            html=_html_confirmacion_cliente(
                cliente_nombre=cliente_nombre,
                negocio_nombre=negocio_nombre,
                servicio_nombre=servicio_nombre,
                hora_inicio=hora_inicio,
                empleado_nombre=empleado_nombre,
                negocio_direccion=negocio_direccion,
                clabe=negocio_clabe,
                banco=negocio_banco,
                titular_cuenta=negocio_titular,
                cancel_url=cancel_url,
            ),
        )

    # ── Email al negocio ───────────────────────────────────────────────────
    if notif_email and negocio_email:
        enviar_email(
            to_email=negocio_email,
            to_name=negocio_nombre,
            subject=f"Nueva cita: {cliente_nombre} — {servicio_nombre}",
            html=_html_aviso_negocio(
                negocio_nombre=negocio_nombre,
                cliente_nombre=cliente_nombre,
                cliente_telefono=cliente_telefono,
                servicio_nombre=servicio_nombre,
                hora_inicio=hora_inicio,
                empleado_nombre=empleado_nombre,
            ),
        )

    # ── WhatsApp al cliente ────────────────────────────────────────────────
    if notif_whatsapp and whatsapp_template_cliente and cliente_telefono:
        enviar_whatsapp(
            to_phone=cliente_telefono,
            template_id=whatsapp_template_cliente,
            params={
                "negocio": negocio_nombre,
                "servicio": servicio_nombre,
                "fecha": fecha_str,
            },
        )

    # ── WhatsApp al negocio ────────────────────────────────────────────────
    if notif_whatsapp and whatsapp_template_negocio and negocio_telefono:
        enviar_whatsapp(
            to_phone=negocio_telefono,
            template_id=whatsapp_template_negocio,
            params={
                "cliente": cliente_nombre,
                "servicio": servicio_nombre,
                "fecha": fecha_str,
            },
        )
