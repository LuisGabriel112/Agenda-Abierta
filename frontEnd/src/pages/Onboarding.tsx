import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const navigate = useNavigate();

  // Estados
  const [businessName, setBusinessName] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const [services, setServices] = useState<
    { name: string; duration: string; price: string }[]
  >([]);
  const [newService, setNewService] = useState({
    name: "",
    duration: "60",
    price: "450.00",
  });

  type TimeSlot = { open: string; close: string };
  type ScheduleDay = { active: boolean; slots: TimeSlot[] };
  type ScheduleState = Record<string, ScheduleDay>;

  const [schedule, setSchedule] = useState<ScheduleState>({
    lunes: { active: true, slots: [{ open: "09:00", close: "18:00" }] },
    martes: { active: true, slots: [{ open: "09:00", close: "18:00" }] },
    miercoles: { active: true, slots: [{ open: "09:00", close: "18:00" }] },
    jueves: { active: true, slots: [{ open: "09:00", close: "18:00" }] },
    viernes: { active: true, slots: [{ open: "09:00", close: "18:00" }] },
    sabado: { active: false, slots: [{ open: "09:00", close: "14:00" }] },
    domingo: { active: false, slots: [{ open: "09:00", close: "14:00" }] },
  });

  // Cálculos de Progreso
  let progress = 0;
  if (businessName.trim().length > 0) progress += 25;
  if (selectedType) progress += 25;
  if (services.length > 0) progress += 25;
  // Consideramos el horario completado si llegaron hasta aquí (sumamos el 25 restante)
  if (progress === 75) progress += 25;

  const handleAddService = () => {
    if (newService.name.trim() === "") return;
    setServices([...services, newService]);
    setNewService({ name: "", duration: "60", price: "450.00" }); // Reset form
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const toggleDay = (day: string) => {
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], active: !schedule[day].active },
    });
  };

  const addTimeSlot = (day: string) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        slots: [...schedule[day].slots, { open: "09:00", close: "18:00" }],
      },
    });
  };

  const removeTimeSlot = (day: string, slotIndex: number) => {
    const updatedSlots = schedule[day].slots.filter(
      (_, idx) => idx !== slotIndex,
    );
    // Si borra el último, desactivamos el día
    if (updatedSlots.length === 0) {
      setSchedule({
        ...schedule,
        [day]: { active: false, slots: [{ open: "09:00", close: "18:00" }] },
      });
    } else {
      setSchedule({
        ...schedule,
        [day]: { ...schedule[day], slots: updatedSlots },
      });
    }
  };

  const updateTimeSlot = (
    day: string,
    slotIndex: number,
    field: "open" | "close",
    value: string,
  ) => {
    const updatedSlots = [...schedule[day].slots];
    updatedSlots[slotIndex][field] = value;
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], slots: updatedSlots },
    });
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans text-slate-900 pb-20">
      {/* Navbar simplificado de Onboarding */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div
            className="flex items-center gap-x-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
              <svg
                className="h-5 w-5 text-brand-600"
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
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              AgendaAbierta
            </span>
          </div>
          <div className="flex items-center gap-x-2 text-sm text-gray-500 cursor-pointer hover:text-gray-800">
            <span>¿Necesitas ayuda?</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Progreso */}
        <div className="mb-10">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-brand-600 uppercase tracking-wide">
                CONFIGURACIÓN
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                Paso 1: Tu negocio
              </h1>
            </div>
            <p className="text-sm font-medium text-gray-500 transition-all">
              {progress}% completado
            </p>
          </div>
          <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* 1. Nombre del Negocio */}
        <div className="mb-14">
          <h2 className="text-lg font-bold text-gray-900">Nombra tu negocio</h2>
          <p className="text-sm text-gray-500 mb-6">
            ¿Cómo te conocen tus clientes? Este nombre aparecerá en tu enlace de
            reservas.
          </p>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Ej: Barbería Central, Centro Médico Salud..."
            className="w-full rounded-2xl bg-white border border-gray-200 px-5 py-4 text-lg font-medium shadow-sm focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-all placeholder:font-normal placeholder:text-gray-400"
          />
        </div>

        {/* 2. Selecciona el giro */}
        <div className="mb-14">
          <h2 className="text-lg font-bold text-gray-900">
            Selecciona el giro de tu negocio
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Esto nos ayudará a personalizar tu experiencia y servicios
            sugeridos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Opcion 1: Barbería */}
            <div
              onClick={() => setSelectedType("barberia")}
              className={`group relative rounded-2xl border-2 p-2 cursor-pointer transition-all ${selectedType === "barberia" ? "border-brand-600 shadow-md bg-brand-50/30" : "border-gray-200 bg-white hover:border-brand-300"}`}
            >
              {selectedType === "barberia" && (
                <div className="absolute top-4 right-4 z-10 rounded-full bg-brand-600 p-1 shadow-sm">
                  <svg
                    className="h-3 w-3 text-white"
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
              <div className="aspect-[4/3] rounded-xl bg-gray-100 mb-4 overflow-hidden">
                <div className="w-full h-full bg-[#3d2f24] flex items-center justify-center text-white/50">
                  Barbería Img
                </div>
              </div>
              <h3 className="font-bold text-gray-900 px-2">Barbería</h3>
              <p className="text-xs text-gray-500 px-2 pb-2">
                Cortes, barba y cuidado masculino.
              </p>
            </div>

            {/* Opcion 2: Spa */}
            <div
              onClick={() => setSelectedType("spa")}
              className={`group relative rounded-2xl border-2 p-2 cursor-pointer transition-all ${selectedType === "spa" ? "border-brand-600 shadow-md bg-brand-50/30" : "border-gray-200 bg-white hover:border-brand-300"}`}
            >
              {selectedType === "spa" && (
                <div className="absolute top-4 right-4 z-10 rounded-full bg-brand-600 p-1 shadow-sm">
                  <svg
                    className="h-3 w-3 text-white"
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
              <div className="aspect-[4/3] rounded-xl bg-gray-100 mb-4 overflow-hidden">
                <div className="w-full h-full bg-[#1e3431] flex items-center justify-center text-white/50">
                  Spa Img
                </div>
              </div>
              <h3 className="font-bold text-gray-900 px-2">Spa y Bienestar</h3>
              <p className="text-xs text-gray-500 px-2 pb-2">
                Masajes y relajación total.
              </p>
            </div>

            {/* Opcion 3: Clinica */}
            <div
              onClick={() => setSelectedType("clinica")}
              className={`group relative rounded-2xl border-2 p-2 cursor-pointer transition-all ${selectedType === "clinica" ? "border-brand-600 shadow-md bg-brand-50/30" : "border-gray-200 bg-white hover:border-brand-300"}`}
            >
              {selectedType === "clinica" && (
                <div className="absolute top-4 right-4 z-10 rounded-full bg-brand-600 p-1 shadow-sm">
                  <svg
                    className="h-3 w-3 text-white"
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
              <div className="aspect-[4/3] rounded-xl bg-gray-100 mb-4 overflow-hidden">
                <div className="w-full h-full bg-[#e3e8e2] flex items-center justify-center text-gray-500">
                  Clínica Img
                </div>
              </div>
              <h3 className="font-bold text-gray-900 px-2">Clínica Estética</h3>
              <p className="text-xs text-gray-500 px-2 pb-2">
                Tratamientos faciales y corporales.
              </p>
            </div>

            {/* Opcion 4: Estudio Musical */}
            <div
              onClick={() => setSelectedType("estudio_musical")}
              className={`group relative rounded-2xl border-2 p-2 cursor-pointer transition-all ${selectedType === "estudio_musical" ? "border-brand-600 shadow-md bg-brand-50/30" : "border-gray-200 bg-white hover:border-brand-300"}`}
            >
              {selectedType === "estudio_musical" && (
                <div className="absolute top-4 right-4 z-10 rounded-full bg-brand-600 p-1 shadow-sm">
                  <svg
                    className="h-3 w-3 text-white"
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
              <div className="aspect-[4/3] rounded-xl bg-gray-100 mb-4 overflow-hidden">
                <div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center text-4xl">
                  🎵
                </div>
              </div>
              <h3 className="font-bold text-gray-900 px-2">Estudio Musical</h3>
              <p className="text-xs text-gray-500 px-2 pb-2">
                Clases, grabación y ensayos musicales.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Crea tus servicios */}
        <div className="mb-14">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Crea tus servicios
              </h2>
              <p className="text-sm text-gray-500">
                Define lo que ofreces a tus clientes para empezar a recibir
                reservas.
              </p>
            </div>
          </div>

          {/* Lista de Servicios Agregados */}
          {services.length > 0 && (
            <div className="mb-6 space-y-3">
              {services.map((srv, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white border border-brand-200 p-4 rounded-xl shadow-sm border-l-4 border-l-brand-600"
                >
                  <div>
                    <h4 className="font-bold text-gray-900">{srv.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>{" "}
                        {srv.duration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>{" "}
                        ${srv.price}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => removeService(idx)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Formulario para Nuevo Servicio */}
          <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-100 to-gray-200"></div>
            <h3 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-brand-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {services.length === 0
                ? "Añadir tu primer servicio"
                : "Añadir otro servicio"}
            </h3>

            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Nombre del servicio
              </label>
              <input
                type="text"
                value={newService.name}
                onChange={(e) =>
                  setNewService({ ...newService, name: e.target.value })
                }
                className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-all placeholder:text-gray-400"
                placeholder="Ej: Masaje Relajante, Corte de Cabello..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Duración (minutos)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </span>
                  <input
                    type="number"
                    value={newService.duration}
                    onChange={(e) =>
                      setNewService({ ...newService, duration: e.target.value })
                    }
                    className="w-full rounded-xl bg-gray-50 border border-gray-200 pl-11 pr-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-all font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Precio ($)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 font-bold">
                    $
                  </span>
                  <input
                    type="text"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService({ ...newService, price: e.target.value })
                    }
                    className="w-full rounded-xl bg-gray-50 border border-gray-200 pl-10 pr-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleAddService}
              disabled={!newService.name.trim()}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                 ${
                   newService.name.trim()
                     ? "bg-gray-900 text-white hover:bg-gray-800 shadow-md cursor-pointer"
                     : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                 }`}
            >
              Guardar Servicio
            </button>
          </div>
        </div>

        {/* 3. Configura tu horario */}
        <div className="mb-14">
          <h2 className="text-lg font-bold text-gray-900">
            Configura tu horario
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Indica los días y horas en los que estarás disponible.
          </p>

          <div className="space-y-3">
            {/* Componente Reutilizable de Día */}
            {[
              { id: "lunes", label: "Lunes" },
              { id: "martes", label: "Martes" },
              { id: "miercoles", label: "Miércoles" },
              { id: "jueves", label: "Jueves" },
              { id: "viernes", label: "Viernes" },
              { id: "sabado", label: "Sábado" },
              { id: "domingo", label: "Domingo" },
            ].map((diaObj) => {
              const dayKey = diaObj.id;
              const dayData = schedule[dayKey];
              const isDayActive = dayData.active;

              return (
                <div
                  key={dayKey}
                  className={`flex flex-col sm:flex-row sm:items-start p-4 rounded-xl border transition-colors ${isDayActive ? "bg-white border-brand-200 shadow-sm" : "bg-gray-50/50 border-gray-100"}`}
                >
                  <div className="flex items-center gap-4 w-40 flex-shrink-0 pt-1">
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleDay(dayKey)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${isDayActive ? "bg-brand-600" : "bg-gray-300"}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDayActive ? "translate-x-5" : "translate-x-0"}`}
                      ></span>
                    </button>
                    <span
                      className={`font-semibold text-sm ${isDayActive ? "text-gray-900" : "text-gray-500"}`}
                    >
                      {diaObj.label}
                    </span>
                  </div>

                  {isDayActive ? (
                    <div className="flex-1 mt-4 sm:mt-0 flex flex-col gap-3">
                      {dayData.slots.map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 sm:gap-3 text-sm"
                        >
                          <div className="flex items-center bg-white border border-gray-300 rounded-lg px-2 py-1 hover:border-brand-400 focus-within:border-brand-600 focus-within:ring-1 focus-within:ring-brand-600 transition-all">
                            <input
                              type="time"
                              value={slot.open}
                              onChange={(e) =>
                                updateTimeSlot(
                                  dayKey,
                                  index,
                                  "open",
                                  e.target.value,
                                )
                              }
                              className="bg-transparent font-mono text-gray-700 outline-none w-[6.5rem] sm:w-24 text-center cursor-pointer"
                            />
                          </div>
                          <span className="text-gray-400">-</span>
                          <div className="flex items-center bg-white border border-gray-300 rounded-lg px-2 py-1 hover:border-brand-400 focus-within:border-brand-600 focus-within:ring-1 focus-within:ring-brand-600 transition-all">
                            <input
                              type="time"
                              value={slot.close}
                              onChange={(e) =>
                                updateTimeSlot(
                                  dayKey,
                                  index,
                                  "close",
                                  e.target.value,
                                )
                              }
                              className="bg-transparent font-mono text-gray-700 outline-none w-[6.5rem] sm:w-24 text-center cursor-pointer"
                            />
                          </div>

                          <div className="flex items-center gap-1 ml-2">
                            {/* Botón para eliminar (visible si hay más de 1 horario, o si se quiere cerrar el día vaciándolo) */}
                            <button
                              onClick={() => removeTimeSlot(dayKey, index)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                              title="Eliminar horario"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>

                            {/* Botón para añadir (solo en el último elemento) */}
                            {index === dayData.slots.length - 1 && (
                              <button
                                onClick={() => addTimeSlot(dayKey)}
                                className="text-brand-600 hover:text-brand-700 hover:bg-brand-50 p-1.5 rounded-md transition-colors font-medium flex items-center gap-1"
                                title="Añadir turno partido"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 mt-4 sm:mt-0 flex items-center">
                      <div className="text-sm text-gray-400 italic px-4">
                        Cerrado
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-between items-center pt-8 border-t border-gray-200 mt-8">
          <button
            onClick={() => navigate("/")}
            className="rounded-full bg-white border border-gray-300 px-6 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={() =>
              navigate("/checkout", {
                state: { businessName, selectedType, services, schedule },
              })
            }
            disabled={progress < 100}
            className={`flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold shadow-md transition-all
              ${
                progress === 100
                  ? "bg-brand-600 text-white hover:bg-brand-700 hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-brand-300 text-white/80 cursor-not-allowed"
              }`}
          >
            Siguiente paso
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}
