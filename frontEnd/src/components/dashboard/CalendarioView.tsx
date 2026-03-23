import { useState, useEffect, useCallback } from "react";
import {
  useApi,
  CitaItem,
  ServicioData,
  ClienteListItem,
} from "../../hooks/useApi";
import { useNegocio } from "../../hooks/useNegocio";

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];
const DAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const CITA_COLORS = [
  "bg-blue-100 border-blue-400 text-blue-800",
  "bg-green-100 border-green-400 text-green-800",
  "bg-purple-100 border-purple-400 text-purple-800",
  "bg-yellow-100 border-yellow-400 text-yellow-800",
  "bg-pink-100 border-pink-400 text-pink-800",
];
const MOTIVOS = [
  { id: "almuerzo", label: "Almuerzo", icon: "🍽" },
  { id: "tramite", label: "Trámite", icon: "📄" },
  { id: "medico", label: "Médico", icon: "🏥" },
  { id: "otro", label: "Otro", icon: "···" },
];

type Vista = "hoy" | "semana" | "mes";

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function getViewDates(vista: Vista, ref: Date): Date[] {
  if (vista === "hoy") {
    return [startOfDay(ref)];
  }
  if (vista === "semana") {
    const day = ref.getDay();
    const diff = ref.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(ref);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }
  // mes
  const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const dates: Date[] = [];
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
}

function formatRangeLabel(vista: Vista, dates: Date[]): string {
  if (vista === "hoy") {
    return dates[0].toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (vista === "semana") {
    const start = dates[0].toLocaleDateString("es-MX", { day: "numeric", month: "long" });
    const end = dates[6].toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
    return `${start} – ${end}`;
  }
  return dates[0].toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

function navigateRef(vista: Vista, ref: Date, dir: -1 | 1): Date {
  const d = new Date(ref);
  if (vista === "hoy") d.setDate(d.getDate() + dir);
  else if (vista === "semana") d.setDate(d.getDate() + dir * 7);
  else d.setMonth(d.getMonth() + dir);
  return d;
}

function colorForCita(id: string): string {
  let hash = 0;
  for (const ch of id)
    hash = (hash * 31 + ch.charCodeAt(0)) % CITA_COLORS.length;
  return CITA_COLORS[hash];
}

function estadoBadgeClass(estado: string): string {
  const map: Record<string, string> = {
    PENDIENTE: "bg-yellow-100 text-yellow-700",
    CONFIRMADA: "bg-blue-100 text-blue-700",
    COMPLETADA: "bg-green-100 text-green-700",
    CANCELADA: "bg-red-100 text-red-600",
  };
  return map[estado] ?? "bg-gray-100 text-gray-500";
}

// ─── Nueva Cita Modal ─────────────────────────────────────────────────────────
interface NuevaCitaModalProps {
  clientes: ClienteListItem[];
  servicios: ServicioData[];
  fechaPreseleccionada: string;
  horaPreseleccionada: string;
  saving: boolean;
  error: string;
  onClose: () => void;
  onGuardar: (
    clienteId: string,
    servicioId: string,
    horaInicio: string,
  ) => void;
}

function NuevaCitaModal({
  clientes,
  servicios,
  fechaPreseleccionada,
  horaPreseleccionada,
  saving,
  error,
  onClose,
  onGuardar,
}: NuevaCitaModalProps) {
  const [clienteId, setClienteId] = useState("");
  const [servicioId, setServicioId] = useState("");
  const [fecha, setFecha] = useState(fechaPreseleccionada);
  const [hora, setHora] = useState(horaPreseleccionada);
  const [localError, setLocalError] = useState("");

  const handleSubmit = () => {
    if (!clienteId) {
      setLocalError("Selecciona un cliente.");
      return;
    }
    if (!servicioId) {
      setLocalError("Selecciona un servicio.");
      return;
    }
    if (!fecha) {
      setLocalError("Selecciona una fecha.");
      return;
    }
    if (!hora) {
      setLocalError("Selecciona una hora.");
      return;
    }
    setLocalError("");
    const [h, m] = hora.split(":").map(Number);
    const d = new Date(fecha + "T00:00:00");
    d.setHours(h, m, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}:00`;
    onGuardar(clienteId, servicioId, iso);
  };

  const errMsg = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-green-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
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
            <h2 className="text-lg font-bold text-gray-900">Nueva Cita</h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
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

        <div className="p-6 space-y-4">
          {errMsg && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {errMsg}
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Cliente <span className="text-red-500">*</span>
            </label>
            {clientes.length === 0 ? (
              <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
                No hay clientes. Primero agrega uno en la sección Clientes.
              </p>
            ) : (
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} — {c.telefono}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Servicio <span className="text-red-500">*</span>
            </label>
            {servicios.length === 0 ? (
              <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
                No hay servicios. Agrega uno en Configuración.
              </p>
            ) : (
              <select
                value={servicioId}
                onChange={(e) => setServicioId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecciona un servicio</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} — {s.duracion_minutos} min — ${s.precio}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Hora
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 text-sm shadow-lg shadow-green-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cita"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bloquear Horario Modal ────────────────────────────────────────────────────
interface BloqueoModalProps {
  diaLabel: string;
  horaLabel: string;
  onClose: () => void;
}

function BloqueoModal({ diaLabel, horaLabel, onClose }: BloqueoModalProps) {
  const [motivo, setMotivo] = useState("almuerzo");
  const [notas, setNotas] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-green-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Bloquear Horario
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
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
        <div className="p-6 space-y-5">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">
              Horario Seleccionado
            </p>
            <p className="text-base font-bold text-gray-900">{diaLabel}</p>
            <p className="text-sm text-gray-600 mt-0.5">{horaLabel}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Motivo del bloqueo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MOTIVOS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMotivo(m.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${motivo === m.id ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >
                  <span>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Notas{" "}
              <span className="font-normal text-gray-400">(Opcional)</span>
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              placeholder="Ej. Almuerzo con proveedor"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 text-sm shadow-lg shadow-green-600/20"
          >
            Marcar como No Disponible
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detalle Cita Modal ────────────────────────────────────────────────────────
interface DetalleCitaModalProps {
  cita: CitaItem;
  onClose: () => void;
  onUpdateEstado: (citaId: string, estado: string) => void;
  onDelete: (citaId: string) => void;
  updating: boolean;
}

function DetalleCitaModal({
  cita,
  onClose,
  onUpdateEstado,
  onDelete,
  updating,
}: DetalleCitaModalProps) {
  const ESTADOS = ["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA"];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Detalle de Cita</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
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
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 font-medium">Cliente</span>
              <span className="text-xs font-bold text-gray-900">
                {cita.cliente_nombre}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Teléfono
              </span>
              <span className="text-xs text-gray-700">
                {cita.cliente_telefono}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Servicio
              </span>
              <span className="text-xs font-semibold text-gray-900">
                {cita.servicio_nombre}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Hora inicio
              </span>
              <span className="text-xs text-gray-700">
                {new Date(cita.hora_inicio).toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Hora fin
              </span>
              <span className="text-xs text-gray-700">
                {new Date(cita.hora_fin).toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-gray-500 font-medium">Estado</span>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${estadoBadgeClass(cita.estado)}`}
              >
                {cita.estado.charAt(0) + cita.estado.slice(1).toLowerCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Pago</span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cita.pagado ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {cita.pagado ? "Pagado" : cita.metodo_pago === "en_linea" ? "Pendiente" : "En físico"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Cambiar estado
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ESTADOS.map((e) => (
                <button
                  key={e}
                  onClick={() => onUpdateEstado(cita.id, e)}
                  disabled={updating || cita.estado === e}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors disabled:opacity-40 ${
                    cita.estado === e
                      ? "bg-green-600 text-white border-green-600"
                      : "border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700"
                  }`}
                >
                  {e.charAt(0) + e.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={() => {
              if (confirm("¿Eliminar esta cita?")) onDelete(cita.id);
            }}
            className="flex-1 border border-red-200 text-red-600 font-semibold py-3 rounded-xl hover:bg-red-50 text-sm"
          >
            Eliminar
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CalendarioView() {
  const { negocioId } = useNegocio();
  const { getCitas, getClientes, getServicios, createCita, updateCita, deleteCita } = useApi(negocioId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [vista, setVista] = useState<Vista>("semana");
  const [refDate, setRefDate] = useState<Date>(() => startOfDay(new Date()));
  const viewDates = getViewDates(vista, refDate);

  const [citas, setCitas] = useState<CitaItem[]>([]);
  const [clientes, setClientes] = useState<ClienteListItem[]>([]);
  const [servicios, setServicios] = useState<ServicioData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showNuevaCita, setShowNuevaCita] = useState(false);
  const [showBloqueo, setShowBloqueo] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaItem | null>(null);

  // Nueva cita state
  const [nuevaCitaFecha, setNuevaCitaFecha] = useState("");
  const [nuevaCitaHora, setNuevaCitaHora] = useState("");
  const [savingCita, setSavingCita] = useState(false);
  const [savingError, setSavingError] = useState("");
  const [paginaProximas, setPaginaProximas] = useState(0);

  // Bloqueo state
  const [bloqueoLabel, setBloqueoLabel] = useState({ dia: "", hora: "" });

  // Updating cita state
  const [updatingCita, setUpdatingCita] = useState(false);

  // ── fetch ─────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    if (!negocioId) { setLoading(false); return; }
    setLoading(true);
    try {
      const pad = (n: number) => String(n).padStart(2, "0");
      const fmt = (d: Date) =>
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const first = viewDates[0];
      const last = viewDates[viewDates.length - 1];
      const [c, cl, sv] = await Promise.all([
        getCitas({ fecha_inicio: fmt(first), fecha_fin: fmt(last) + "T23:59:59" }),
        getClientes(),
        getServicios(),
      ]);
      setCitas(c);
      setClientes(cl);
      setServicios(sv);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [negocioId, vista, refDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleSlotClick = (date: Date, hora: string) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const fechaStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    setNuevaCitaFecha(fechaStr);
    setNuevaCitaHora(hora);
    setSavingError("");
    setShowNuevaCita(true);
  };

  const handleBloqueoClick = (date: Date, hora: string) => {
    const diaLabel = date.toLocaleDateString("es-MX", {
      weekday: "long", day: "2-digit", month: "long",
    });
    const h = parseInt(hora.split(":")[0]);
    const ampm = (n: number) => `${String(n).padStart(2, "0")}:00 ${n < 12 ? "AM" : "PM"}`;
    setBloqueoLabel({
      dia: diaLabel.charAt(0).toUpperCase() + diaLabel.slice(1),
      hora: `${ampm(h)} - ${ampm(h + 1)}`,
    });
    setShowBloqueo(true);
  };

  const handleGuardarCita = async (clienteId: string, servicioId: string, horaInicio: string) => {
    setSavingCita(true);
    setSavingError("");
    try {
      const nueva = await createCita({ cliente_id: clienteId, servicio_id: servicioId, hora_inicio: horaInicio });
      setCitas((prev) => [...prev, nueva]);
      setShowNuevaCita(false);
    } catch (e) {
      setSavingError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSavingCita(false);
    }
  };

  const handleUpdateEstado = async (citaId: string, estado: string) => {
    setUpdatingCita(true);
    try {
      const updated = await updateCita(citaId, { estado });
      setCitas((prev) => prev.map((c) => (c.id === citaId ? updated : c)));
      setCitaSeleccionada(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setUpdatingCita(false);
    }
  };

  const handleDeleteCita = async (citaId: string) => {
    try {
      await deleteCita(citaId);
      setCitas((prev) => prev.filter((c) => c.id !== citaId));
      setCitaSeleccionada(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  // ── helpers ───────────────────────────────────────────────────────────────

  const citasEnSlot = (date: Date, hora: string): CitaItem[] => {
    const h = parseInt(hora.split(":")[0]);
    return citas.filter((c) => {
      const ci = new Date(c.hora_inicio);
      return (
        ci.getFullYear() === date.getFullYear() &&
        ci.getMonth() === date.getMonth() &&
        ci.getDate() === date.getDate() &&
        ci.getHours() === h
      );
    });
  };

  const citasEnDia = (date: Date): CitaItem[] =>
    citas.filter((c) => {
      const ci = new Date(c.hora_inicio);
      return (
        ci.getFullYear() === date.getFullYear() &&
        ci.getMonth() === date.getMonth() &&
        ci.getDate() === date.getDate()
      );
    });

  const citasDuracion = (cita: CitaItem): number =>
    Math.max((cita.servicio_duracion_minutos || 60) / 60, 0.5);

  const proximas = [...citas]
    .filter((c) => c.estado !== "CANCELADA")
    .sort((a, b) => new Date(a.hora_inicio).getTime() - new Date(b.hora_inicio).getTime());

  const citasHoy = citasEnDia(today);

  // ── grid columns for hoy/semana ───────────────────────────────────────────
  const gridDates = vista === "mes" ? [] : viewDates;
  const cols = gridDates.length + 1; // +1 for time column

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* Main */}
        <div className="flex-1 p-5 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 capitalize">
                {formatRangeLabel(vista, viewDates)}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Prev / Next */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRefDate(navigateRef(vista, refDate, -1))}
                  className="h-8 w-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => { setRefDate(startOfDay(new Date())); }}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Hoy
                </button>
                <button
                  onClick={() => setRefDate(navigateRef(vista, refDate, 1))}
                  className="h-8 w-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Vista selector */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                {(["hoy", "semana", "mes"] as Vista[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVista(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                      vista === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {v === "hoy" ? "Hoy" : v === "semana" ? "Semana" : "Mes"}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleBloqueoClick(viewDates[0], "14:00")}
                className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span className="hidden sm:inline">Bloquear tiempo</span>
              </button>
              <button
                onClick={() => { setSavingError(""); setShowNuevaCita(true); }}
                className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nueva Cita
              </button>
            </div>
          </div>

          {/* ── Vista Mes ── */}
          {vista === "mes" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Day labels */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {DAYS.map((d) => (
                  <div key={d} className="p-3 text-center text-xs font-bold text-gray-400 uppercase">
                    {d}
                  </div>
                ))}
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (() => {
                // Build 6-week grid starting from the first day of the month's Monday
                const firstDay = viewDates[0];
                const startDow = firstDay.getDay(); // 0=Sun
                const offset = startDow === 0 ? 6 : startDow - 1; // offset to Monday
                const gridStart = new Date(firstDay);
                gridStart.setDate(firstDay.getDate() - offset);
                const cells: Date[] = Array.from({ length: 42 }, (_, i) => {
                  const d = new Date(gridStart);
                  d.setDate(gridStart.getDate() + i);
                  return d;
                });
                const month = viewDates[0].getMonth();
                return (
                  <div className="grid grid-cols-7">
                    {cells.map((d, i) => {
                      const inMonth = d.getMonth() === month;
                      const isToday = d.toDateString() === today.toDateString();
                      const dayCitas = citasEnDia(d);
                      return (
                        <div
                          key={i}
                          onClick={() => { setVista("hoy"); setRefDate(startOfDay(d)); }}
                          className={`min-h-[80px] p-2 border-b border-r border-gray-50 cursor-pointer transition-colors ${
                            inMonth ? "hover:bg-green-50/40" : "bg-gray-50/60"
                          }`}
                        >
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                              isToday
                                ? "bg-green-600 text-white"
                                : inMonth
                                ? "text-gray-800"
                                : "text-gray-300"
                            }`}
                          >
                            {d.getDate()}
                          </span>
                          <div className="mt-1 space-y-0.5">
                            {dayCitas.slice(0, 3).map((c) => (
                              <div
                                key={c.id}
                                onClick={(e) => { e.stopPropagation(); setCitaSeleccionada(c); }}
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate cursor-pointer ${colorForCita(c.id)}`}
                              >
                                {new Date(c.hora_inicio).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} {c.cliente_nombre}
                              </div>
                            ))}
                            {dayCitas.length > 3 && (
                              <div className="text-[10px] text-gray-400 font-medium pl-1">
                                +{dayCitas.length - 3} más
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Vista Hoy / Semana ── */}
          {vista !== "mes" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
              {/* Day Headers */}
              <div className={`grid border-b border-gray-100`} style={{ gridTemplateColumns: `64px repeat(${gridDates.length}, minmax(80px, 1fr))` }}>
                <div className="p-3" />
                {gridDates.map((date, i) => {
                  const isToday = date.toDateString() === today.toDateString();
                  return (
                    <div key={i} className="p-3 text-center border-l border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase">
                        {DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                      </p>
                      <p className={`text-lg font-bold mt-0.5 ${isToday ? "text-green-600" : "text-gray-800"}`}>
                        {date.getDate()}
                      </p>
                      {isToday && <div className="w-1.5 h-1.5 bg-green-500 rounded-full mx-auto mt-0.5" />}
                    </div>
                  );
                })}
              </div>

              {/* Time Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="relative">
                  {HOURS.map((hora) => (
                    <div
                      key={hora}
                      className="grid border-b border-gray-50 last:border-0"
                      style={{ height: "64px", gridTemplateColumns: `64px repeat(${gridDates.length}, minmax(80px, 1fr))` }}
                    >
                      <div className="flex items-start pt-2 pr-3 justify-end shrink-0">
                        <span className="text-xs text-gray-400 font-medium">{hora}</span>
                      </div>
                      {gridDates.map((date, diaIdx) => {
                        const slotCitas = citasEnSlot(date, hora);
                        return (
                          <div
                            key={diaIdx}
                            className="border-l border-gray-100 relative cursor-pointer hover:bg-green-50/40 transition-colors group"
                            onClick={() => handleSlotClick(date, hora)}
                          >
                            {slotCitas.map((cita) => (
                              <div
                                key={cita.id}
                                className={`absolute inset-x-1 top-1 rounded-lg border-l-4 px-2 py-1 z-10 cursor-pointer ${colorForCita(cita.id)}`}
                                style={{ height: `${citasDuracion(cita) * 64 - 6}px` }}
                                onClick={(e) => { e.stopPropagation(); setCitaSeleccionada(cita); }}
                              >
                                <p className="text-xs font-bold truncate">{cita.servicio_nombre}</p>
                                <p className="text-xs truncate opacity-80">{cita.cliente_nombre}</p>
                                {cita.pagado && (
                                  <span className="text-[9px] font-bold bg-green-600 text-white px-1 rounded">Pagado</span>
                                )}
                              </div>
                            ))}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
              </div>{/* /overflow-x-auto */}
            </div>
          )}
        </div>

        {/* Right Sidebar — oculto en móvil */}
        <div className="w-72 border-l border-gray-100 bg-white p-5 overflow-y-auto shrink-0 flex-col gap-5 hidden lg:flex">
          {/* Próximas Citas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Próximas Citas</h3>
              <span className="text-xs text-gray-400">{proximas.length} pendientes</span>
            </div>
            {proximas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-gray-400">No hay citas próximas</p>
                <button
                  onClick={() => { setSavingError(""); setShowNuevaCita(true); }}
                  className="mt-2 text-green-600 text-xs font-semibold hover:underline"
                >
                  + Nueva cita
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {proximas.slice(paginaProximas * 3, paginaProximas * 3 + 3).map((cita) => (
                    <div
                      key={cita.id}
                      className="bg-gray-50 rounded-2xl p-3 border border-gray-100 cursor-pointer hover:border-green-200 transition-colors"
                      onClick={() => setCitaSeleccionada(cita)}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-green-700">
                          {cita.cliente_nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{cita.cliente_nombre}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {cita.servicio_nombre} •{" "}
                            {new Date(cita.hora_inicio).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${estadoBadgeClass(cita.estado)}`}>
                          {cita.estado.charAt(0) + cita.estado.slice(1).toLowerCase()}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdateEstado(cita.id, "CONFIRMADA"); }}
                        disabled={cita.estado === "CONFIRMADA" || cita.estado === "COMPLETADA"}
                        className="w-full bg-green-600 text-white text-xs font-bold py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {cita.estado === "COMPLETADA" ? "Completada ✓" : "Confirmar llegada"}
                      </button>
                    </div>
                  ))}
                </div>
                {proximas.length > 3 && (
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => setPaginaProximas((p) => Math.max(0, p - 1))}
                      disabled={paginaProximas === 0}
                      className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-xs text-gray-400">
                      {paginaProximas + 1} / {Math.ceil(proximas.length / 3)}
                    </span>
                    <button
                      onClick={() => setPaginaProximas((p) => Math.min(Math.ceil(proximas.length / 3) - 1, p + 1))}
                      disabled={paginaProximas >= Math.ceil(proximas.length / 3) - 1}
                      className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Resumen de Hoy */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Resumen de Hoy</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-green-50 rounded-2xl p-3 border border-green-100">
                <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Citas hoy</p>
                <p className="text-2xl font-extrabold text-green-700 mt-1">{citasHoy.length}</p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100">
                <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">En vista</p>
                <p className="text-2xl font-extrabold text-blue-700 mt-1">{citas.length}</p>
              </div>
            </div>
            <div className="bg-gray-900 rounded-2xl p-4 text-white">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Tip del día</p>
              <p className="text-xs text-gray-200 leading-relaxed">
                Haz clic en cualquier hora del calendario para crear una nueva cita rápidamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showNuevaCita && (
        <NuevaCitaModal
          clientes={clientes}
          servicios={servicios}
          fechaPreseleccionada={nuevaCitaFecha}
          horaPreseleccionada={nuevaCitaHora}
          saving={savingCita}
          error={savingError}
          onClose={() => setShowNuevaCita(false)}
          onGuardar={handleGuardarCita}
        />
      )}

      {showBloqueo && (
        <BloqueoModal
          diaLabel={bloqueoLabel.dia}
          horaLabel={bloqueoLabel.hora}
          onClose={() => setShowBloqueo(false)}
        />
      )}

      {citaSeleccionada && (
        <DetalleCitaModal
          cita={citaSeleccionada}
          onClose={() => setCitaSeleccionada(null)}
          onUpdateEstado={handleUpdateEstado}
          onDelete={handleDeleteCita}
          updating={updatingCita}
        />
      )}
    </>
  );
}
