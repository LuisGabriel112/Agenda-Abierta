import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE as string;

interface CitaInfo {
  cita_id: string;
  estado: string;
  hora_inicio: string;
  servicio: string;
  empleado: string;
  negocio: string;
  negocio_slug: string;
  cliente: string;
  cancelacion_horas: number | null;
  terminos_reembolso: string | null;
}

function formatFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CancelarCita() {
  const { token } = useParams<{ token: string }>();
  const [cita, setCita] = useState<CitaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [cancelada, setCancelada] = useState(false);
  const [errorCancelacion, setErrorCancelacion] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/public/cita/${token}`)
      .then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(d.detail));
        return r.json();
      })
      .then((data) => {
        setCita(data);
        if (data.estado === "CANCELADA") setCancelada(true);
      })
      .catch((msg) => setError(typeof msg === "string" ? msg : "No se pudo cargar la cita."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancelar = async () => {
    if (!token) return;
    setCancelando(true);
    setErrorCancelacion("");
    try {
      const res = await fetch(`${API_BASE}/api/public/cita/${token}/cancelar`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json();
        setErrorCancelacion(d.detail || "Error al cancelar.");
        return;
      }
      setCancelada(true);
    } catch {
      setErrorCancelacion("Error de conexión. Intenta de nuevo.");
    } finally {
      setCancelando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Enlace inválido</h1>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!cita) return null;

  if (cancelada) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Cita cancelada</h1>
          <p className="text-gray-500 text-sm mb-6">
            Tu cita en <span className="font-semibold">{cita.negocio}</span> ha sido cancelada exitosamente.
          </p>
          <Link
            to={`/b/${cita.negocio_slug}`}
            className="inline-block bg-gray-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-700 transition-colors"
          >
            Agendar nueva cita
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Cancelar cita</h1>
          <p className="text-gray-500 text-sm mt-1">¿Estás seguro de que deseas cancelar?</p>
        </div>

        {/* Detalle de la cita */}
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Negocio</span>
            <span className="font-semibold text-gray-800">{cita.negocio}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Servicio</span>
            <span className="font-semibold text-gray-800">{cita.servicio}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Especialista</span>
            <span className="font-semibold text-gray-800">{cita.empleado}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Fecha</span>
            <span className="font-semibold text-gray-800 text-right max-w-[60%]">{formatFecha(cita.hora_inicio)}</span>
          </div>
        </div>

        {/* Política de cancelación */}
        {cita.cancelacion_horas != null && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 mb-5 leading-relaxed">
            <span className="font-semibold">Política de cancelación:</span>{" "}
            Solo se permite cancelar con al menos{" "}
            <span className="font-semibold">
              {cita.cancelacion_horas === 1 ? "1 hora" : `${cita.cancelacion_horas} horas`}
            </span>{" "}
            de anticipación.
            {cita.terminos_reembolso && (
              <span> {cita.terminos_reembolso}</span>
            )}
          </div>
        )}

        {errorCancelacion && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
            {errorCancelacion}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            to={`/b/${cita.negocio_slug}`}
            className="flex-1 text-center py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Volver
          </Link>
          <button
            onClick={handleCancelar}
            disabled={cancelando}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {cancelando ? "Cancelando..." : "Sí, cancelar cita"}
          </button>
        </div>
      </div>
    </div>
  );
}
