import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE as string;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServicioPublico {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  duracion_minutos: number;
}

interface EmpleadoPublico {
  id: string;
  nombre: string;
  especialidad: string | null;
}

interface NegocioPublico {
  id: string;
  nombre: string;
  slug: string;
  giro: string | null;
  descripcion: string | null;
  direccion: string | null;
  color_marca: string | null;
  url_logo: string | null;
  servicios: ServicioPublico[];
  empleados: EmpleadoPublico[];
  acepta_pago_en_linea: boolean;
}

interface ReservaState {
  servicioId: string;
  servicioNombre: string;
  servicioDuracion: number;
  servicioPrecio: string;
  empleadoId: string | null;
  empleadoNombre: string;
  fecha: string;
  hora: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  metodoPago: "en_fisico" | "en_linea";
}

type Paso = 0 | 1 | 2 | 3 | 4 | "exito" | "error_reserva";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-green-100 text-green-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-yellow-100 text-yellow-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildGCalLink(state: ReservaState, negocioNombre: string) {
  const [y, mo, d] = state.fecha.split("-").map(Number);
  const [h, mi] = state.hora.split(":").map(Number);
  const start = new Date(y, mo - 1, d, h, mi);
  const end = new Date(start.getTime() + state.servicioDuracion * 60000);
  const fmt = (dt: Date) =>
    dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const title = encodeURIComponent(
    `${state.servicioNombre} — ${negocioNombre}`,
  );
  const details = encodeURIComponent(
    `Cita con ${state.empleadoNombre || negocioNombre}`,
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Avatar({
  nombre,
  size = "md",
}: {
  nombre: string;
  size?: "sm" | "md" | "lg";
}) {
  const sz =
    size === "sm"
      ? "w-8 h-8 text-xs"
      : size === "lg"
        ? "w-16 h-16 text-xl"
        : "w-11 h-11 text-sm";
  return (
    <div
      className={`${sz} ${avatarColor(nombre)} rounded-full flex items-center justify-center font-bold shrink-0`}
    >
      {initials(nombre)}
    </div>
  );
}

function ProgressBar({ paso }: { paso: number }) {
  const total = 4;
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < paso ? "bg-green-600 flex-1" : "bg-gray-200 flex-1"
          }`}
        />
      ))}
    </div>
  );
}

// Simple calendar component
function MiniCalendar({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (date: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  // Convert Sunday=0 to Monday=0
  const startDay = (firstDayOfMonth + 6) % 7;

  const MONTH_NAMES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const DAY_NAMES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const handleDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    if (d < today) return;
    const pad = (n: number) => String(n).padStart(2, "0");
    onSelect(`${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`);
  };

  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <span className="text-sm font-bold text-gray-900">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-bold text-gray-400 uppercase py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const cellDate = new Date(viewYear, viewMonth, day);
          const isPast = cellDate < today;
          const isToday = cellDate.getTime() === today.getTime();
          const isSelected = dateStr === selected;

          return (
            <button
              key={day}
              onClick={() => handleDay(day)}
              disabled={isPast}
              className={`w-9 h-9 mx-auto rounded-xl text-sm font-medium transition-all ${
                isSelected
                  ? "bg-green-600 text-white font-bold shadow-sm shadow-green-600/30"
                  : isToday
                    ? "border-2 border-green-600 text-green-700 font-bold hover:bg-green-50"
                    : isPast
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-green-50 hover:text-green-700"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function NegocioPublicoPage() {
  const { slug } = useParams<{ slug: string }>();

  const [negocio, setNegocio] = useState<NegocioPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [pagoCancelado, setPagoCancelado] = useState(false);
  const [paso, setPaso] = useState<Paso>(0);
  const [reserva, setReserva] = useState<ReservaState>({
    servicioId: "",
    servicioNombre: "",
    servicioDuracion: 60,
    servicioPrecio: "",
    empleadoId: null,
    empleadoNombre: "",
    fecha: "",
    hora: "",
    clienteNombre: "",
    clienteTelefono: "",
    clienteEmail: "",
    metodoPago: "en_fisico",
  });

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  const [confirming, setConfirming] = useState(false);
  const [errorReserva, setErrorReserva] = useState("");
  const [citaConfirmada, setCitaConfirmada] = useState<{
    cita_id: string;
  } | null>(null);

  const [formErrors, setFormErrors] = useState<{
    nombre?: string;
    telefono?: string;
  }>({});

  // ── Detectar regreso desde Stripe ────────────────────────────────────────
  useEffect(() => {
    const pago = searchParams.get("pago");
    if (pago === "exitoso") {
      setPagoExitoso(true);
      setSearchParams({});
    } else if (pago === "cancelado") {
      setPagoCancelado(true);
      setSearchParams({});
      // Ocultar el aviso después de 6 segundos
      const t = setTimeout(() => setPagoCancelado(false), 6000);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load negocio ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/public/negocio/${slug}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Error del servidor");
        const data: NegocioPublico = await res.json();
        setNegocio(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  // ── Fetch slots when date changes ─────────────────────────────────────────
  const fetchSlots = useCallback(
    async (fecha: string) => {
      if (!slug || !reserva.servicioId || !fecha) return;
      setLoadingSlots(true);
      setSlotsError("");
      setSlots([]);
      try {
        const params = new URLSearchParams({
          fecha,
          servicio_id: reserva.servicioId,
        });
        if (reserva.empleadoId) params.set("empleado_id", reserva.empleadoId);
        const res = await fetch(
          `${API_BASE}/api/public/negocio/${slug}/slots?${params}`,
        );
        if (!res.ok) throw new Error("Error cargando horarios");
        const data: { slots: string[] } = await res.json();
        setSlots(data.slots);
        if (data.slots.length === 0)
          setSlotsError(
            "No hay horarios disponibles para este día. Prueba otro.",
          );
      } catch {
        setSlotsError("Error al cargar los horarios disponibles.");
      } finally {
        setLoadingSlots(false);
      }
    },
    [slug, reserva.servicioId, reserva.empleadoId],
  );

  const handleFechaChange = (fecha: string) => {
    setReserva((r) => ({ ...r, fecha, hora: "" }));
    fetchSlots(fecha);
  };

  // ── Confirm booking ───────────────────────────────────────────────────────
  const handleConfirmar = async () => {
    const errors: { nombre?: string; telefono?: string } = {};
    if (!reserva.clienteNombre.trim())
      errors.nombre = "El nombre es obligatorio.";
    if (!reserva.clienteTelefono.trim())
      errors.telefono = "El teléfono es obligatorio.";
    else if (reserva.clienteTelefono.replace(/\D/g, "").length < 10)
      errors.telefono = "Ingresa un teléfono válido (mín. 10 dígitos).";

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const [h, mi] = reserva.hora.split(":").map(Number);
    const horaInicio = `${reserva.fecha}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00`;

    setConfirming(true);
    setErrorReserva("");
    try {
      const res = await fetch(
        `${API_BASE}/api/public/negocio/${slug}/reservar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            servicio_id: reserva.servicioId,
            empleado_id: reserva.empleadoId,
            hora_inicio: horaInicio,
            cliente_nombre: reserva.clienteNombre.trim(),
            cliente_telefono: reserva.clienteTelefono.trim(),
            cliente_email: reserva.clienteEmail.trim() || undefined,
            metodo_pago: reserva.metodoPago,
            success_url: `${window.location.origin}${window.location.pathname}`,
            cancel_url: `${window.location.origin}${window.location.pathname}`,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.detail || "Error al confirmar la cita.");
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
      setCitaConfirmada(data);
      setPaso("exito");
    } catch (e) {
      setErrorReserva(e instanceof Error ? e.message : "Error desconocido.");
      setPaso("error_reserva");
    } finally {
      setConfirming(false);
    }
  };

  const resetReserva = () => {
    setPaso(0);
    setReserva({
      servicioId: "",
      servicioNombre: "",
      servicioDuracion: 60,
      servicioPrecio: "",
      empleadoId: null,
      empleadoNombre: "",
      fecha: "",
      hora: "",
      clienteNombre: "",
      clienteTelefono: "",
      clienteEmail: "",
      metodoPago: "en_fisico",
    });
    setSlots([]);
    setSlotsError("");
    setCitaConfirmada(null);
    setErrorReserva("");
    setFormErrors({});
  };

  // ── Loading / 404 ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (notFound || !negocio) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          Negocio no encontrado
        </h1>
        <p className="text-gray-500 text-sm text-center max-w-sm">
          El enlace que seguiste no corresponde a ningún negocio activo en
          AgendaAbierta.
        </p>
        <a
          href="/"
          className="mt-6 text-green-600 text-sm font-semibold hover:underline"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  const brandColor = negocio.color_marca || "#16a34a";

  const logoSrc = negocio.url_logo
    ? negocio.url_logo.startsWith("http")
      ? negocio.url_logo
      : `${API_BASE}${negocio.url_logo}`
    : null;

  // ── Wizard panel ──────────────────────────────────────────────────────────
  const wizardOpen = paso !== 0;

  // ── Overlay pago exitoso (regreso desde Stripe) ───────────────────────────
  if (pagoExitoso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-5 animate-bounce">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Pago exitoso!</h1>
          <p className="text-gray-500 text-sm mb-2">Tu pago fue procesado y tu cita ha sido confirmada.</p>
          <p className="text-gray-400 text-xs mb-8">Recibirás un correo de confirmación si proporcionaste tu email.</p>
          <button
            onClick={() => {
              setPagoExitoso(false);
              setSearchParams({});
            }}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-2xl hover:bg-green-700 transition-colors"
          >
            Volver al negocio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ── Banner pago cancelado ── */}
      {pagoCancelado && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Pago cancelado. Tu cita no fue confirmada.
          <button onClick={() => setPagoCancelado(false)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── LANDING ── */}
      <div
        className={`transition-all duration-300 ${wizardOpen ? "lg:mr-[480px]" : ""}`}
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={negocio.nombre}
                  className="w-9 h-9 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  {initials(negocio.nombre)}
                </div>
              )}
              <span className="font-bold text-gray-900 text-lg tracking-tight">
                {negocio.nombre}
              </span>
            </div>
            <button
              onClick={() => setPaso(1)}
              className="hidden sm:flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ backgroundColor: brandColor }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Reservar cita
            </button>
          </div>
        </header>

        {/* Hero */}
        <section
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${brandColor}15 0%, #f0fdf4 100%)`,
          }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="max-w-xl">
              {negocio.giro && (
                <span
                  className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {negocio.giro}
                </span>
              )}
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
                {negocio.nombre}
              </h1>
              {negocio.descripcion && (
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  {negocio.descripcion}
                </p>
              )}
              <button
                onClick={() => setPaso(1)}
                className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
                style={{ backgroundColor: brandColor }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Reservar mi cita
              </button>
            </div>
          </div>
          {/* Decorative circle */}
          <div
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
            style={{ backgroundColor: brandColor }}
          />
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-14">
          {/* Servicios */}
          {negocio.servicios.length > 0 && (
            <section>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
                Nuestros Servicios
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {negocio.servicios.map((srv) => (
                  <div
                    key={srv.id}
                    onClick={() => {
                      setReserva((r) => ({
                        ...r,
                        servicioId: srv.id,
                        servicioNombre: srv.nombre,
                        servicioDuracion: srv.duracion_minutos,
                        servicioPrecio: srv.precio,
                      }));
                      setPaso(1);
                    }}
                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-green-200 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                        {srv.nombre}
                      </h3>
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-lg text-white ml-2 shrink-0"
                        style={{ backgroundColor: brandColor }}
                      >
                        ${srv.precio}
                      </span>
                    </div>
                    {srv.descripcion && (
                      <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                        {srv.descripcion}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {srv.duracion_minutos} min
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Equipo */}
          {negocio.empleados.length > 0 && (
            <section>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
                Nuestro Equipo
              </h2>
              <div className="flex flex-wrap gap-4">
                {negocio.empleados.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm w-32 text-center"
                  >
                    <Avatar nombre={emp.nombre} size="lg" />
                    <p className="text-sm font-bold text-gray-900 leading-tight">
                      {emp.nombre}
                    </p>
                    {emp.especialidad && (
                      <p className="text-xs text-gray-400">
                        {emp.especialidad}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Dirección */}
          {negocio.direccion && (
            <section className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${brandColor}20` }}
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: brandColor }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Ubicación</h3>
                <p className="text-gray-600 text-sm">{negocio.direccion}</p>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-100 py-6 mt-8">
          <p className="text-center text-xs text-gray-400">
            Reservas gestionadas con{" "}
            <a
              href="/"
              className="font-semibold text-green-600 hover:underline"
            >
              AgendaAbierta
            </a>
          </p>
        </footer>
      </div>

      {/* Mobile FAB */}
      {!wizardOpen && (
        <button
          onClick={() => setPaso(1)}
          className="fixed bottom-6 right-6 z-30 sm:hidden flex items-center gap-2 text-white px-5 py-3.5 rounded-2xl font-bold text-sm shadow-2xl"
          style={{ backgroundColor: brandColor }}
        >
          📅 Reservar ahora
        </button>
      )}

      {/* ── WIZARD ── */}
      {wizardOpen && (
        <>
          {/* Overlay (desktop) */}
          <div
            className="hidden lg:block fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
            onClick={resetReserva}
          />

          {/* Panel */}
          <div className="fixed inset-0 lg:inset-auto lg:right-0 lg:top-0 lg:bottom-0 lg:w-[480px] z-40 bg-white lg:shadow-2xl flex flex-col">
            {/* Wizard Header */}
            <div className="shrink-0 border-b border-gray-100 px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {typeof paso === "number" && paso > 1 && paso <= 4 && (
                    <button
                      onClick={() =>
                        setPaso((p) =>
                          typeof p === "number"
                            ? (Math.max(1, p - 1) as Paso)
                            : 1,
                        )
                      }
                      className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                  )}
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {paso === 1 && "Paso 1 de 4 — Servicio"}
                    {paso === 2 && "Paso 2 de 4 — Especialista"}
                    {paso === 3 && "Paso 3 de 4 — Fecha y hora"}
                    {paso === 4 && "Paso 4 de 4 — Confirmar"}
                    {paso === "exito" && "¡Reserva confirmada!"}
                    {paso === "error_reserva" && "Error en la reserva"}
                  </span>
                </div>
                <button
                  onClick={resetReserva}
                  className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {typeof paso === "number" && paso >= 1 && paso <= 4 && (
                <ProgressBar paso={paso} />
              )}
            </div>

            {/* Wizard Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* ── PASO 1: Servicio ── */}
              {paso === 1 && (
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 mb-1">
                    ¿Qué servicio necesitas?
                  </h2>
                  <p className="text-sm text-gray-500 mb-5">
                    Selecciona el servicio que deseas reservar.
                  </p>
                  {negocio.servicios.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400 text-sm">
                        Este negocio aún no tiene servicios publicados.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {negocio.servicios.map((srv) => (
                        <button
                          key={srv.id}
                          onClick={() =>
                            setReserva((r) => ({
                              ...r,
                              servicioId: srv.id,
                              servicioNombre: srv.nombre,
                              servicioDuracion: srv.duracion_minutos,
                              servicioPrecio: srv.precio,
                            }))
                          }
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                            reserva.servicioId === srv.id
                              ? "border-green-500 bg-green-50"
                              : "border-gray-100 bg-white hover:border-green-200 hover:bg-green-50/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p
                                className={`font-bold text-sm ${reserva.servicioId === srv.id ? "text-green-800" : "text-gray-900"}`}
                              >
                                {srv.nombre}
                              </p>
                              {srv.descripcion && (
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                  {srv.descripcion}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {srv.duracion_minutos} min
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-base font-extrabold text-green-700">
                                ${srv.precio}
                              </span>
                              {reserva.servicioId === srv.id && (
                                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── PASO 2: Especialista ── */}
              {paso === 2 && (
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 mb-1">
                    ¿Con quién prefieres?
                  </h2>
                  <p className="text-sm text-gray-500 mb-5">
                    Elige tu especialista o deja que elijamos por ti.
                  </p>
                  <div className="space-y-3">
                    {/* Sin preferencia */}
                    <button
                      onClick={() =>
                        setReserva((r) => ({
                          ...r,
                          empleadoId: null,
                          empleadoNombre: "",
                        }))
                      }
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        reserva.empleadoId === null
                          ? "border-green-500 bg-green-50"
                          : "border-gray-100 bg-white hover:border-green-200"
                      }`}
                    >
                      <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-bold text-sm ${reserva.empleadoId === null ? "text-green-800" : "text-gray-900"}`}
                        >
                          Sin preferencia
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          El primero disponible en el horario elegido
                        </p>
                      </div>
                      {reserva.empleadoId === null && (
                        <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center shrink-0">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </button>

                    {/* Empleados */}
                    {negocio.empleados.map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() =>
                          setReserva((r) => ({
                            ...r,
                            empleadoId: emp.id,
                            empleadoNombre: emp.nombre,
                          }))
                        }
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                          reserva.empleadoId === emp.id
                            ? "border-green-500 bg-green-50"
                            : "border-gray-100 bg-white hover:border-green-200"
                        }`}
                      >
                        <Avatar nombre={emp.nombre} />
                        <div className="flex-1">
                          <p
                            className={`font-bold text-sm ${reserva.empleadoId === emp.id ? "text-green-800" : "text-gray-900"}`}
                          >
                            {emp.nombre}
                          </p>
                          {emp.especialidad && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {emp.especialidad}
                            </p>
                          )}
                        </div>
                        {reserva.empleadoId === emp.id && (
                          <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center shrink-0">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PASO 3: Fecha y hora ── */}
              {paso === 3 && (
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 mb-1">
                    ¿Cuándo te queda bien?
                  </h2>
                  <p className="text-sm text-gray-500 mb-5">
                    Elige el día y la hora de tu cita.
                  </p>

                  <MiniCalendar
                    selected={reserva.fecha}
                    onSelect={handleFechaChange}
                  />

                  {reserva.fecha && (
                    <div className="mt-5">
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        Horarios disponibles —{" "}
                        <span className="text-green-700">
                          {formatDate(reserva.fecha)}
                        </span>
                      </p>

                      {loadingSlots ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : slotsError ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                          <p className="text-sm text-amber-700 font-medium">
                            {slotsError}
                          </p>
                        </div>
                      ) : slots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {slots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() =>
                                setReserva((r) => ({ ...r, hora: slot }))
                              }
                              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                                reserva.hora === slot
                                  ? "bg-green-600 border-green-600 text-white shadow-sm shadow-green-600/30"
                                  : "border-gray-200 text-gray-700 hover:border-green-400 hover:text-green-700 hover:bg-green-50"
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {/* ── PASO 4: Datos del cliente ── */}
              {paso === 4 && (
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 mb-1">
                    Confirma tu cita
                  </h2>
                  <p className="text-sm text-gray-500 mb-5">
                    Solo un paso más. Revisa los detalles y deja tus datos.
                  </p>

                  {/* Resumen */}
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-green-600 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121"
                        />
                      </svg>
                      <span className="text-sm font-semibold text-gray-800">
                        {reserva.servicioNombre}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        ${reserva.servicioPrecio}
                      </span>
                    </div>
                    {reserva.empleadoNombre && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-green-600 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span className="text-sm text-gray-700">
                          {reserva.empleadoNombre}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-green-600 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">
                        {formatDate(reserva.fecha)} — {reserva.hora}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-green-600 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">
                        {reserva.servicioDuracion} min
                      </span>
                    </div>
                  </div>

                  {/* Formulario */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Nombre completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={reserva.clienteNombre}
                        onChange={(e) =>
                          setReserva((r) => ({
                            ...r,
                            clienteNombre: e.target.value,
                          }))
                        }
                        placeholder="Ej. María García"
                        className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                          formErrors.nombre
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200"
                        }`}
                      />
                      {formErrors.nombre && (
                        <p className="text-xs text-red-500 mt-1">
                          {formErrors.nombre}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Teléfono <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={reserva.clienteTelefono}
                        onChange={(e) =>
                          setReserva((r) => ({
                            ...r,
                            clienteTelefono: e.target.value,
                          }))
                        }
                        placeholder="+52 55 1234 5678"
                        className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                          formErrors.telefono
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200"
                        }`}
                      />
                      {formErrors.telefono && (
                        <p className="text-xs text-red-500 mt-1">
                          {formErrors.telefono}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Email{" "}
                        <span className="text-gray-400 font-normal">
                          (Opcional)
                        </span>
                      </label>
                      <input
                        type="email"
                        value={reserva.clienteEmail}
                        onChange={(e) =>
                          setReserva((r) => ({
                            ...r,
                            clienteEmail: e.target.value,
                          }))
                        }
                        placeholder="tu@correo.com"
                        className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    {/* Método de pago */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        ¿Cómo vas a pagar? <span className="text-red-500">*</span>
                      </label>
                      <div className={`grid gap-3 ${negocio.acepta_pago_en_linea ? "grid-cols-2" : "grid-cols-1"}`}>
                        <button
                          type="button"
                          onClick={() => setReserva((r) => ({ ...r, metodoPago: "en_fisico" }))}
                          className={`flex flex-col items-center gap-2 border-2 rounded-xl p-4 text-sm font-semibold transition-all ${
                            reserva.metodoPago === "en_fisico"
                              ? "border-green-500 bg-green-50 text-green-800"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                          </svg>
                          Pagar en físico
                          {reserva.metodoPago === "en_fisico" && (
                            <span className="text-xs font-normal text-green-600">Al llegar</span>
                          )}
                        </button>
                        {negocio.acepta_pago_en_linea && (
                          <button
                            type="button"
                            onClick={() => setReserva((r) => ({ ...r, metodoPago: "en_linea" }))}
                            className={`flex flex-col items-center gap-2 border-2 rounded-xl p-4 text-sm font-semibold transition-all ${
                              reserva.metodoPago === "en_linea"
                                ? "border-green-500 bg-green-50 text-green-800"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                            </svg>
                            Pagar en línea
                            {reserva.metodoPago === "en_linea" && (
                              <span className="text-xs font-normal text-green-600">Tarjeta / débito</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ÉXITO ── */}
              {paso === "exito" && (
                <div className="flex flex-col items-center justify-center text-center py-8 px-2">
                  {/* Animated checkmark */}
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 relative">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                      <svg
                        className="w-10 h-10 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>

                  <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                    ¡Cita confirmada!
                  </h2>
                  <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                    Tu cita ha sido registrada exitosamente. Te esperamos.
                  </p>

                  {/* Resumen de la cita */}
                  <div className="w-full bg-gray-50 rounded-2xl border border-gray-100 p-5 text-left space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Negocio</span>
                      <span className="font-bold text-gray-900">
                        {negocio.nombre}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">
                        Servicio
                      </span>
                      <span className="font-semibold text-gray-800">
                        {reserva.servicioNombre}
                      </span>
                    </div>
                    {reserva.empleadoNombre && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">
                          Especialista
                        </span>
                        <span className="font-semibold text-gray-800">
                          {reserva.empleadoNombre}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Fecha</span>
                      <span className="font-semibold text-gray-800">
                        {formatDate(reserva.fecha)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Hora</span>
                      <span className="font-semibold text-gray-800">
                        {reserva.hora}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">
                        Duración
                      </span>
                      <span className="font-semibold text-gray-800">
                        {reserva.servicioDuracion} min
                      </span>
                    </div>
                    {citaConfirmada?.cita_id && (
                      <div className="flex justify-between text-sm border-t border-gray-200 pt-3 mt-2">
                        <span className="text-gray-400 text-xs">
                          ID de cita
                        </span>
                        <span className="text-gray-400 text-xs font-mono">
                          {citaConfirmada.cita_id.slice(0, 8)}...
                        </span>
                      </div>
                    )}
                  </div>

                  <a
                    href={buildGCalLink(reserva, negocio.nombre)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 border-2 border-green-600 text-green-700 font-bold py-3 rounded-2xl hover:bg-green-50 transition-colors text-sm mb-3"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Agregar a Google Calendar
                  </a>

                  <button
                    onClick={resetReserva}
                    className="w-full text-gray-500 font-semibold py-3 rounded-2xl hover:bg-gray-100 transition-colors text-sm"
                  >
                    Volver al inicio
                  </button>
                </div>
              )}

              {/* ── ERROR ── */}
              {paso === "error_reserva" && (
                <div className="flex flex-col items-center justify-center text-center py-8 px-2">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <svg
                      className="w-10 h-10 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900 mb-2">
                    No se pudo confirmar
                  </h2>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed max-w-xs">
                    {errorReserva ||
                      "Ocurrió un error al procesar tu reserva. Por favor inténtalo de nuevo."}
                  </p>
                  <button
                    onClick={() => setPaso(4)}
                    className="w-full bg-green-600 text-white font-bold py-3 rounded-2xl hover:bg-green-700 transition-colors text-sm shadow-lg shadow-green-600/20 mb-3"
                  >
                    Intentar de nuevo
                  </button>
                  <button
                    onClick={resetReserva}
                    className="w-full text-gray-500 font-semibold py-3 rounded-2xl hover:bg-gray-100 transition-colors text-sm"
                  >
                    Cancelar reserva
                  </button>
                </div>
              )}
            </div>

            {/* Wizard Footer — CTA Button */}
            {typeof paso === "number" && paso >= 1 && paso <= 4 && (
              <div className="shrink-0 border-t border-gray-100 p-5">
                {paso === 1 && (
                  <button
                    onClick={() => setPaso(2)}
                    disabled={!reserva.servicioId}
                    className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-all text-sm shadow-lg shadow-green-600/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Continuar
                  </button>
                )}
                {paso === 2 && (
                  <button
                    onClick={() => setPaso(3)}
                    className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-all text-sm shadow-lg shadow-green-600/20"
                  >
                    Continuar
                  </button>
                )}
                {paso === 3 && (
                  <button
                    onClick={() => setPaso(4)}
                    disabled={!reserva.fecha || !reserva.hora}
                    className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-all text-sm shadow-lg shadow-green-600/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {reserva.hora
                      ? `Reservar a las ${reserva.hora}`
                      : "Elige un horario"}
                  </button>
                )}
                {paso === 4 && (
                  <button
                    onClick={handleConfirmar}
                    disabled={confirming}
                    className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-all text-sm shadow-lg shadow-green-600/20 disabled:opacity-75 flex items-center justify-center gap-2"
                  >
                    {confirming ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Confirmar Cita
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
