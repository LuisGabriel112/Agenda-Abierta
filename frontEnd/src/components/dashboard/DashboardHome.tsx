import { useState } from "react";

interface DashboardHomeProps {
  negocioNombre: string | null;
  negocioSlug: string | null;
  totalCitas: number;
  totalClientes: number;
  totalServicios: number;
  tieneHorarios: boolean;
  isLoading: boolean;
  onNavigate: (section: "servicios" | "configuracion" | "calendario") => void;
}

interface CitaForm {
  cliente: string;
  telefono: string;
  servicio: string;
  fecha: string;
  hora: string;
  notas: string;
}

export default function DashboardHome({
  negocioNombre,
  negocioSlug,
  totalCitas,
  totalClientes,
  totalServicios,
  tieneHorarios,
  isLoading,
  onNavigate,
}: DashboardHomeProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<CitaForm>({
    cliente: "",
    telefono: "",
    servicio: "",
    fecha: "",
    hora: "",
    notas: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGuardar = () => {
    console.log("Nueva cita:", form);
    setShowModal(false);
    setForm({
      cliente: "",
      telefono: "",
      servicio: "",
      fecha: "",
      hora: "",
      notas: "",
    });
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex-1 p-6 lg:p-8 flex flex-col lg:flex-row gap-8 overflow-y-auto">
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center p-8 min-h-[500px]">
          <div className="w-28 h-28 bg-gray-100 rounded-full animate-pulse mb-8" />
          <div className="w-72 h-8 bg-gray-100 rounded-xl animate-pulse mb-4" />
          <div className="w-56 h-4 bg-gray-100 rounded-xl animate-pulse mb-10" />
          <div className="w-48 h-12 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 h-64 animate-pulse" />
          <div className="bg-gray-100 rounded-3xl h-44 animate-pulse" />
        </div>
      </div>
    );
  }

  const hasActivity = totalCitas > 0 || totalClientes > 0;

  const publicUrl = negocioSlug
    ? `${window.location.origin}/b/${negocioSlug}`
    : null;

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = publicUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const serviciosOk = totalServicios > 0;
  const horariosOk = tieneHorarios;
  const enlaceOk = serviciosOk && horariosOk;

  const tutorialSteps = [
    {
      key: "servicios",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
      ),
      title: "Configura tus servicios",
      desc: serviciosOk
        ? `${totalServicios} servicio${totalServicios !== 1 ? "s" : ""} configurado${totalServicios !== 1 ? "s" : ""} ✓`
        : "Añade los tratamientos o servicios que ofreces a tus clientes.",
      done: serviciosOk,
      cta: serviciosOk ? "Ver servicios" : "Agregar servicios",
      onClick: () => onNavigate("servicios"),
    },
    {
      key: "horarios",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
      title: "Define tus horarios",
      desc: horariosOk
        ? "Horarios de atención configurados ✓"
        : "Establece tu jornada laboral y tiempos de descanso.",
      done: horariosOk,
      cta: horariosOk ? "Ver configuración" : "Definir horarios",
      onClick: () => onNavigate("configuracion"),
    },
    {
      key: "enlace",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      ),
      title: "Comparte tu enlace",
      desc: enlaceOk
        ? "Tu página pública está lista para recibir reservas."
        : "Primero configura servicios y horarios para activar tu enlace.",
      done: enlaceOk,
      cta: copied ? "¡Enlace copiado! ✓" : "Copiar enlace",
      onClick: enlaceOk ? handleCopyLink : undefined,
      disabled: !enlaceOk,
    },
  ];

  return (
    <>
      <div className="flex-1 p-6 lg:p-8 flex flex-col lg:flex-row gap-8 overflow-y-auto">
        {/* Panel Central */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center p-8 text-center min-h-[500px]">
          {/* Stats rápidas si ya hay actividad */}
          {hasActivity && (
            <div className="flex gap-6 mb-8">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-green-600">
                  {totalCitas}
                </p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Citas totales
                </p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="text-center">
                <p className="text-3xl font-extrabold text-green-600">
                  {totalClientes}
                </p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Clientes
                </p>
              </div>
            </div>
          )}

          <div className="relative mb-8">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-20 transform scale-150"></div>
            <div className="relative h-28 w-28 bg-green-50 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
              <svg
                className="w-12 h-12 text-green-600"
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 11v6m-3-3h6"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 max-w-md leading-tight tracking-tight">
            {negocioNombre
              ? `${negocioNombre} está listo para recibir clientes`
              : "Tu agenda está lista para recibir clientes"}
          </h2>
          <p className="text-gray-500 mb-10 max-w-md leading-relaxed">
            {hasActivity
              ? "Tu negocio está activo. Sigue gestionando tus citas y clientes desde el panel."
              : "¡Todo está configurado! Comienza a organizar tu tiempo y haz crecer tu negocio hoy mismo creando tu primera cita manual o compartiendo tu link."}
          </p>

          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-base shadow-lg hover:bg-green-700 transition-all hover:-translate-y-0.5 flex items-center gap-2"
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
            {hasActivity ? "Nueva cita" : "Crear mi primera cita"}
          </button>

          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-400">
            {[
              "Horarios definidos",
              "Servicios activos",
              "Perfil público listo",
            ].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex h-5 w-5 bg-green-500 text-white rounded-full items-center justify-center">
                  <svg
                    className="w-3 h-3"
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
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          {/* Tutorial Rápido */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 text-lg">
                Tutorial Rápido
              </h3>
              <span className="text-xs text-gray-400 font-medium">
                {[serviciosOk, horariosOk, enlaceOk].filter(Boolean).length}/3
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
              <div
                className="bg-green-600 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${([serviciosOk, horariosOk, enlaceOk].filter(Boolean).length / 3) * 100}%`,
                }}
              />
            </div>

            <div className="relative">
              <div className="absolute left-[19px] top-2 bottom-6 w-0.5 bg-gray-100"></div>
              <div className="space-y-4 relative">
                {tutorialSteps.map((step) => (
                  <div key={step.key} className="flex gap-4 relative group">
                    {/* Icon circle */}
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                        step.done
                          ? "bg-green-600 text-white shadow-sm shadow-green-600/20"
                          : step.disabled
                            ? "bg-gray-100 text-gray-300 border border-gray-200"
                            : "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}
                    >
                      {step.done ? (
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          {step.icon}
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4
                          className={`text-sm font-bold ${
                            step.done
                              ? "text-green-700"
                              : step.disabled
                                ? "text-gray-400"
                                : "text-gray-900"
                          }`}
                        >
                          {step.title}
                        </h4>
                      </div>
                      <p
                        className={`text-xs mt-0.5 leading-relaxed ${
                          step.done
                            ? "text-green-600"
                            : step.disabled
                              ? "text-gray-300"
                              : "text-gray-500"
                        }`}
                      >
                        {step.desc}
                      </p>

                      {/* CTA button */}
                      <button
                        onClick={step.onClick}
                        disabled={step.disabled && !step.done}
                        className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                          step.disabled && !step.done
                            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                            : step.done && step.key === "enlace" && copied
                              ? "bg-green-600 text-white"
                              : step.done
                                ? "bg-green-50 text-green-700 hover:bg-green-100"
                                : "bg-green-600 text-white hover:bg-green-700 shadow-sm shadow-green-600/20"
                        }`}
                      >
                        {step.key === "enlace" && !step.disabled && (
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            {copied ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                              />
                            )}
                          </svg>
                        )}
                        {step.key !== "enlace" && !step.disabled && (
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        )}
                        {step.cta}
                      </button>

                      {/* Public URL preview for enlace step */}
                      {step.key === "enlace" && enlaceOk && publicUrl && (
                        <p className="mt-1.5 text-[10px] text-gray-400 font-mono truncate max-w-[180px]">
                          {publicUrl}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* All done banner */}
            {serviciosOk && horariosOk && enlaceOk && (
              <div className="mt-5 bg-green-50 border border-green-100 rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4 text-white"
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
                <div>
                  <p className="text-xs font-bold text-green-800">
                    ¡Todo listo! 🎉
                  </p>
                  <p className="text-[10px] text-green-700 leading-tight mt-0.5">
                    Tu agenda ya puede recibir clientes en línea.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tip del Día */}
          <div className="bg-green-800 rounded-3xl shadow-lg p-6 relative overflow-hidden text-white">
            <div className="absolute -bottom-6 -right-6 w-32 h-32 text-white opacity-10">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-green-200">
              Tip del Día
            </p>
            <h3 className="font-bold text-lg leading-tight mb-2">
              Sincroniza con Google Calendar
            </h3>
            <p className="text-xs text-green-100 mb-6 leading-relaxed">
              Evita el solapamiento de citas personales y profesionales
              automáticamente.
            </p>
            <button className="bg-white text-green-800 font-bold text-xs px-5 py-2.5 rounded-full hover:bg-green-50 transition-colors">
              Configurar ahora
            </button>
          </div>
        </div>
      </div>

      {/* Modal Nueva Cita */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            {/* Header */}
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
                onClick={() => setShowModal(false)}
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

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Nombre del cliente
                  </label>
                  <input
                    name="cliente"
                    value={form.cliente}
                    onChange={handleChange}
                    placeholder="Ej. María García"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Teléfono
                  </label>
                  <input
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    placeholder="+52 55 0000 0000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Servicio
                </label>
                <select
                  name="servicio"
                  value={form.servicio}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="">Selecciona un servicio</option>
                  <option>Consulta General</option>
                  <option>Corte de Cabello</option>
                  <option>Limpieza Dental</option>
                  <option>Masaje</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Fecha
                  </label>
                  <input
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Hora
                  </label>
                  <input
                    type="time"
                    name="hora"
                    value={form.hora}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Notas{" "}
                  <span className="font-normal text-gray-400">(Opcional)</span>
                </label>
                <textarea
                  name="notas"
                  value={form.notas}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Ej. Cliente prefiere lado izquierdo, alérgico a..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors text-sm shadow-lg shadow-green-600/20"
              >
                Guardar Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
