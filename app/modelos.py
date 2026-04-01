import uuid
from datetime import datetime, time, timezone
from decimal import Decimal
from enum import Enum as PyEnum
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Time,
    Uuid,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# --- Enums ---


class RolEmpleado(str, PyEnum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"


class EstadoCita(str, PyEnum):
    PENDIENTE = "PENDIENTE"
    CONFIRMADA = "CONFIRMADA"
    CANCELADA = "CANCELADA"
    COMPLETADA = "COMPLETADA"


# --- Tabla de Asociación ---


class EmpleadoServicio(Base):
    __tablename__ = "empleado_servicio"

    empleado_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("empleados.id", ondelete="CASCADE"),
        primary_key=True,
    )
    servicio_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("servicios.id", ondelete="CASCADE"),
        primary_key=True,
    )


# --- Modelos Principales ---


class Negocio(Base):
    __tablename__ = "negocios"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(150), unique=True, index=True, nullable=False
    )
    giro: Mapped[Optional[str]] = mapped_column(
        String(100)
    )  # Ej: "Barbería", "Dentista"
    descripcion: Mapped[Optional[str]] = mapped_column(String(500))
    direccion: Mapped[Optional[str]] = mapped_column(String(255))
    color_marca: Mapped[Optional[str]] = mapped_column(String(7))  # Ej: #FF5733
    url_logo: Mapped[Optional[str]] = mapped_column(String(255))
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(100))
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(100))
    email_negocio: Mapped[Optional[str]] = mapped_column(String(255))
    telefono_negocio: Mapped[Optional[str]] = mapped_column(String(30))
    notif_email: Mapped[bool] = mapped_column(default=True)
    notif_whatsapp: Mapped[bool] = mapped_column(default=False)
    # Pagos — cuenta bancaria
    clabe: Mapped[Optional[str]] = mapped_column(String(18))
    banco: Mapped[Optional[str]] = mapped_column(String(100))
    titular_cuenta: Mapped[Optional[str]] = mapped_column(String(150))
    # Stripe Connect Express (para cobros con tarjeta)
    stripe_connect_id: Mapped[Optional[str]] = mapped_column(String(100))
    stripe_charges_enabled: Mapped[bool] = mapped_column(default=False)
    # Políticas de cancelación
    cancelacion_horas: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    terminos_reembolso: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    # Zona horaria IANA (ej. "America/Mexico_City")
    timezone: Mapped[str] = mapped_column(String(60), default="America/Mexico_City", nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relaciones - Un negocio tiene muchos de estos elementos
    empleados: Mapped[List["Empleado"]] = relationship(
        back_populates="negocio", cascade="all, delete-orphan"
    )
    servicios: Mapped[List["Servicio"]] = relationship(
        back_populates="negocio", cascade="all, delete-orphan"
    )
    horarios: Mapped[List["HorarioTrabajo"]] = relationship(
        back_populates="negocio", cascade="all, delete-orphan"
    )
    clientes: Mapped[List["Cliente"]] = relationship(
        back_populates="negocio", cascade="all, delete-orphan"
    )
    citas: Mapped[List["Cita"]] = relationship(
        back_populates="negocio", cascade="all, delete-orphan"
    )


class Empleado(Base):
    __tablename__ = "empleados"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    negocio_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("negocios.id", ondelete="CASCADE"),
        nullable=False,
    )
    clerk_user_id: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )  # ID del usuario en Clerk (ej: "user_2abc...")
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    rol: Mapped[RolEmpleado] = mapped_column(
        Enum(RolEmpleado, native_enum=True), nullable=False
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relaciones
    negocio: Mapped["Negocio"] = relationship(back_populates="empleados")
    servicios: Mapped[List["Servicio"]] = relationship(
        secondary="empleado_servicio", back_populates="empleados"
    )
    citas: Mapped[List["Cita"]] = relationship(back_populates="empleado")


class Servicio(Base):
    __tablename__ = "servicios"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    negocio_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("negocios.id", ondelete="CASCADE"),
        nullable=False,
    )
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(String(500))
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    duracion_minutos: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relaciones
    negocio: Mapped["Negocio"] = relationship(back_populates="servicios")
    empleados: Mapped[List["Empleado"]] = relationship(
        secondary="empleado_servicio", back_populates="servicios"
    )
    citas: Mapped[List["Cita"]] = relationship(back_populates="servicio")


class HorarioTrabajo(Base):
    __tablename__ = "horarios_trabajo"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    negocio_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("negocios.id", ondelete="CASCADE"),
        nullable=False,
    )
    dia_semana: Mapped[int] = mapped_column(
        Integer, nullable=False
    )  # 0 = Lunes, 6 = Domingo
    hora_apertura: Mapped[Optional[time]] = mapped_column(Time)
    hora_cierre: Mapped[Optional[time]] = mapped_column(Time)
    esta_cerrado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relaciones
    negocio: Mapped["Negocio"] = relationship(back_populates="horarios")


class Cliente(Base):
    __tablename__ = "clientes"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    negocio_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("negocios.id", ondelete="CASCADE"),
        nullable=False,
    )
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    telefono: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255))

    # Relaciones
    negocio: Mapped["Negocio"] = relationship(back_populates="clientes")
    citas: Mapped[List["Cita"]] = relationship(back_populates="cliente")


class Cita(Base):
    __tablename__ = "citas"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    negocio_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("negocios.id", ondelete="CASCADE"),
        nullable=False,
    )
    cliente_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("clientes.id", ondelete="CASCADE"),
        nullable=False,
    )
    empleado_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("empleados.id", ondelete="CASCADE"),
        nullable=False,
    )
    servicio_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("servicios.id", ondelete="CASCADE"),
        nullable=False,
    )

    hora_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    hora_fin: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    estado: Mapped[EstadoCita] = mapped_column(
        Enum(EstadoCita, native_enum=True), default=EstadoCita.PENDIENTE, nullable=False
    )
    monto_anticipo: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), default=0)
    metodo_pago: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # "en_linea" | "en_fisico"
    pagado: Mapped[bool] = mapped_column(default=False)
    stripe_session_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    recordatorio_enviado: Mapped[bool] = mapped_column(default=False)

    # Relaciones
    negocio: Mapped["Negocio"] = relationship(back_populates="citas")
    cliente: Mapped["Cliente"] = relationship(back_populates="citas")
    empleado: Mapped["Empleado"] = relationship(back_populates="citas")
    servicio: Mapped["Servicio"] = relationship(back_populates="citas")


class BloqueoTiempo(Base):
    __tablename__ = "bloqueos_tiempo"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    negocio_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("negocios.id", ondelete="CASCADE"),
        nullable=False,
    )
    empleado_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("empleados.id", ondelete="CASCADE"),
        nullable=True,
    )
    hora_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), nullable=False
    )
    hora_fin: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    motivo: Mapped[Optional[str]] = mapped_column(String(100))
    notas: Mapped[Optional[str]] = mapped_column(String(500))

    # Relaciones
    negocio: Mapped["Negocio"] = relationship()
