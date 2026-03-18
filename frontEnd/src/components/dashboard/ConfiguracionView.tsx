import { useState, useEffect } from "react";
import type { NegocioData } from "../../hooks/useNegocio";

interface ConfiguracionViewProps {
  negocio: NegocioData | null;
  isLoading: boolean;
  onSave: (
    fields: Partial<
      Pick<
        NegocioData,
        "nombre" | "giro" | "descripcion" | "direccion" | "color_marca"
      >
    >,
  ) => Promise<boolean>;
}

interface Miembro {
  nombre: string;
  email: string;
  rol: string;
  estado: "Activo" | "Inactivo";
}

const MIEMBROS_INICIALES: Miembro[] = [
  {
    nombre: "Ana Martínez",
    email: "ana@vitalia.com",
    rol: "Administrador",
    estado: "Activo",
  },
  {
    nombre: "Carlos Ruiz",
    email: "carlos@vitalia.com",
    rol: "Especialista",
    estado: "Activo",
  },
];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-green-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function Avatar({ nombre }: { nombre: string }) {
  const initials = nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colors = [
    "bg-green-100 text-green-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-yellow-100 text-yellow-700",
  ];
  const color = colors[nombre.charCodeAt(0) % colors.length];
  return (
    <div
      className={`w-8 h-8 ${color} rounded-full flex items-center justify-center text-xs font-bold shrink-0`}
    >
      {initials}
    </div>
  );
}

export default function ConfiguracionView({
  negocio,
  isLoading,
  onSave,
}: ConfiguracionViewProps) {
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [direccion, setDireccion] = useState("");
  const [biografia, setBiografia] = useState("");
  const [emailNotif, setEmailNotif] = useState(true);
  const [whatsappNotif, setWhatsappNotif] = useState(false);
  const [cancelacion, setCancelacion] = useState("24 horas antes");
  const [terminosReembolso, setTerminosReembolso] = useState("");
  const [miembros, setMiembros] = useState<Miembro[]>(MIEMBROS_INICIALES);
  const [showInvitar, setShowInvitar] = useState(false);
  const [invitarEmail, setInvitarEmail] = useState("");
  const [invitarRol, setInvitarRol] = useState("Especialista");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Sync form with real data when it arrives from the backend
  useEffect(() => {
    if (negocio) {
      setNombreNegocio(negocio.nombre ?? "");
      setDireccion(negocio.direccion ?? "");
      setBiografia(negocio.descripcion ?? "");
    }
  }, [negocio]);

  const handleGuardar = async () => {
    setSaveError("");
    const ok = await onSave({
      nombre: nombreNegocio,
      descripcion: biografia,
      direccion: direccion,
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setSaveError(
        "No se pudo guardar. Revisa tu conexión e intenta de nuevo.",
      );
    }
  };

  const handleInvitar = () => {
    if (invitarEmail.trim()) {
      setMiembros([
        ...miembros,
        {
          nombre: invitarEmail.split("@")[0],
          email: invitarEmail,
          rol: invitarRol,
          estado: "Activo",
        },
      ]);
      setInvitarEmail("");
      setShowInvitar(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto p-6 lg:p-8 space-y-6 pb-32">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestiona los detalles de tu negocio y preferencias de la plataforma.
          </p>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 animate-pulse">
            <div className="h-5 bg-gray-100 rounded-lg w-40" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-100 rounded-xl" />
              <div className="h-10 bg-gray-100 rounded-xl" />
            </div>
            <div className="h-20 bg-gray-100 rounded-xl" />
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {saveError}
          </div>
        )}

        {/* Perfil del Negocio */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 bg-green-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900">
              Perfil del Negocio
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nombre + Dirección */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Nombre del Negocio
                </label>
                <input
                  value={nombreNegocio}
                  onChange={(e) => setNombreNegocio(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Dirección
                </label>
                <input
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Logo + Biografía */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Logo del Negocio
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 bg-green-700 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                    {negocio?.url_logo ? (
                      <img
                        src={negocio.url_logo}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        className="w-7 h-7 text-white"
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
                    )}
                  </div>
                  <button className="border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                    Cambiar Logo
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Biografía
                </label>
                <textarea
                  value={biografia}
                  onChange={(e) => setBiografia(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 bg-green-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900">
              Notificaciones
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Notificaciones por Email
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enviar confirmaciones y recordatorios por correo electrónico.
                </p>
              </div>
              <Toggle
                checked={emailNotif}
                onChange={() => setEmailNotif(!emailNotif)}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Alertas de WhatsApp
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enviar alertas automáticas a clientes a través de WhatsApp
                  Business API.
                </p>
              </div>
              <Toggle
                checked={whatsappNotif}
                onChange={() => setWhatsappNotif(!whatsappNotif)}
              />
            </div>
          </div>
        </div>

        {/* Políticas de Cancelación */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 bg-green-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-4 h-4 text-green-600"
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
            <h2 className="text-base font-bold text-gray-900">
              Políticas de Cancelación
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Límite de tiempo para cancelación
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Tiempo mínimo de antelación para cancelar sin penalización.
              </p>
              <select
                value={cancelacion}
                onChange={(e) => setCancelacion(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option>1 hora antes</option>
                <option>2 horas antes</option>
                <option>6 horas antes</option>
                <option>12 horas antes</option>
                <option>24 horas antes</option>
                <option>48 horas antes</option>
                <option>72 horas antes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Términos de reembolso del anticipo
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Define cómo se gestionará el dinero pagado por adelantado.
              </p>
              <textarea
                value={terminosReembolso}
                onChange={(e) => setTerminosReembolso(e.target.value)}
                rows={3}
                placeholder="Ej. El anticipo se reembolsará íntegramente si la cancelación se realiza antes del límite establecido..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Pagos y Facturación */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 bg-green-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900">
              Pagos y Facturación
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stripe Connect */}
            <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                  <span className="text-sm font-bold text-gray-800">
                    Stripe Connect
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full border border-green-200 uppercase tracking-wide">
                  Conectado
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                Recibe pagos con tarjeta de crédito de forma segura y
                automática.
              </p>
              <button className="text-xs text-green-600 font-semibold hover:underline">
                Configurar Webhooks
              </button>
            </div>

            {/* Cuenta Bancaria */}
            <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                  />
                </svg>
                <span className="text-sm font-bold text-gray-800">
                  Cuenta Bancaria
                </span>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 mb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  IBAN Finaliza en
                </p>
                <p className="text-sm font-bold text-gray-800 tracking-widest">
                  **** **** **** 8821
                </p>
              </div>
              <button className="text-xs text-green-600 font-semibold hover:underline">
                Actualizar datos bancarios
              </button>
            </div>
          </div>
        </div>

        {/* Miembros del Equipo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-green-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-900">
                Miembros del Equipo
              </h2>
            </div>
            <button
              onClick={() => setShowInvitar(true)}
              className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Invitar Miembro
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Nombre", "Rol", "Estado", "Acciones"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3 pr-6"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {miembros.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 pr-6">
                      <div className="flex items-center gap-2.5">
                        <Avatar nombre={m.nombre} />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {m.nombre}
                          </p>
                          <p className="text-xs text-gray-400">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-6">
                      <span className="text-sm text-gray-600">{m.rol}</span>
                    </td>
                    <td className="py-3.5 pr-6">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          m.estado === "Activo"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {m.estado}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <button className="text-gray-400 hover:text-gray-700 transition-colors">
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
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer fijo */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-100 px-8 py-4 flex items-center justify-end gap-3 z-40">
        <button
          onClick={() => {
            if (negocio) {
              setNombreNegocio(negocio.nombre ?? "");
              setDireccion(negocio.direccion ?? "");
              setBiografia(negocio.descripcion ?? "");
              setSaveError("");
            }
          }}
          className="border border-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
            saved
              ? "bg-green-700 text-white"
              : "bg-green-600 text-white hover:bg-green-700 shadow-green-600/20 shadow-lg"
          }`}
        >
          {saved ? (
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
              ¡Guardado!
            </>
          ) : (
            "Guardar Cambios"
          )}
        </button>
      </div>

      {/* Modal Invitar Miembro */}
      {showInvitar && (
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
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Invitar Miembro
                </h2>
              </div>
              <button
                onClick={() => setShowInvitar(false)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
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
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={invitarEmail}
                  onChange={(e) => setInvitarEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Rol
                </label>
                <select
                  value={invitarRol}
                  onChange={(e) => setInvitarRol(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option>Administrador</option>
                  <option>Especialista</option>
                  <option>Recepcionista</option>
                  <option>Solo lectura</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowInvitar(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleInvitar}
                className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors text-sm shadow-lg shadow-green-600/20"
              >
                Enviar Invitación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
