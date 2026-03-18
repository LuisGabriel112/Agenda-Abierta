import { useState } from "react";

const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const DAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

const SAMPLE_CITAS = [
  { id: 1, dia: 0, hora: 9, duracion: 1, cliente: "Ana López", servicio: "Consulta Ge...", color: "bg-blue-100 border-blue-400 text-blue-800" },
  { id: 2, dia: 1, hora: 10, duracion: 1, cliente: "Juan Pérez", servicio: "Limpieza De...", color: "bg-green-100 border-green-400 text-green-800" },
  { id: 3, dia: 2, hora: 10, duracion: 1.5, cliente: "Beatriz Suarez", servicio: "Extracció...", color: "bg-green-100 border-green-400 text-green-800", urgente: true },
  { id: 4, dia: 3, hora: 10, duracion: 2, cliente: "", servicio: "Revisión Po...", color: "bg-yellow-100 border-yellow-400 text-yellow-800" },
  { id: 5, dia: 5, hora: 12, duracion: 1.5, cliente: "Carlos Ruiz", servicio: "Ortodoncia", color: "bg-purple-100 border-purple-400 text-purple-800" },
];

const PROXIMAS_CITAS = [
  { nombre: "Beatriz Suarez", servicio: "Extracción Molar", hora: "11:30", estado: "pendiente" },
  { nombre: "Juan Pérez", servicio: "Limpieza • Finalizado 10:45", hora: "", estado: "cobrar", monto: "$85.00" },
  { nombre: "Carlos Ruíz", servicio: "Ortodoncia", hora: "12:00", estado: "pendiente" },
];

const MOTIVOS = [
  { id: "almuerzo", label: "Almuerzo", icon: "🍽" },
  { id: "tramite", label: "Trámite", icon: "📄" },
  { id: "medico", label: "Médico", icon: "🏥" },
  { id: "otro", label: "Otro", icon: "···" },
];

function getWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatWeekRange(dates: Date[]) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  const start = dates[0].toLocaleDateString("es-MX", { day: "numeric", month: "long" });
  const end = dates[6].toLocaleDateString("es-MX", opts);
  return `${start} - ${end}`;
}

interface CitaForm {
  cliente: string;
  telefono: string;
  servicio: string;
  fecha: string;
  hora: string;
  notas: string;
}

interface BloqueoForm {
  motivo: string;
  notas: string;
  diaLabel: string;
  horaLabel: string;
}

export default function CalendarioView() {
  const weekDates = getWeekDates();
  const today = new Date();

  const [showNuevaCita, setShowNuevaCita] = useState(false);
  const [showBloqueo, setShowBloqueo] = useState(false);
  const [citaForm, setCitaForm] = useState<CitaForm>({ cliente: "", telefono: "", servicio: "", fecha: "", hora: "", notas: "" });
  const [bloqueoForm, setBloqueoForm] = useState<BloqueoForm>({ motivo: "almuerzo", notas: "", diaLabel: "", horaLabel: "" });

  const handleSlotClick = (diaIndex: number, hora: string) => {
    const date = weekDates[diaIndex];
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    setCitaForm({ cliente: "", telefono: "", servicio: "", fecha: `${yyyy}-${mm}-${dd}`, hora, notas: "" });
    setShowNuevaCita(true);
  };

  const handleBloqueoClick = (diaIndex: number, hora: string) => {
    const date = weekDates[diaIndex];
    const diaLabel = date.toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "long" });
    const [h] = hora.split(":");
    const start = `${h}:00 ${parseInt(h) < 12 ? "AM" : "PM"}`;
    const end = `${String(parseInt(h) + 1).padStart(2, "0")}:30 ${parseInt(h) + 1 < 12 ? "AM" : "PM"}`;
    setBloqueoForm({ motivo: "almuerzo", notas: "", diaLabel: diaLabel.charAt(0).toUpperCase() + diaLabel.slice(1), horaLabel: `${start} - ${end}` });
    setShowBloqueo(true);
  };

  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendario Semanal</h1>
              <p className="text-sm text-gray-500 mt-0.5">{formatWeekRange(weekDates)}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-xl p-1">
                {["Hoy", "Semana", "Mes"].map((v) => (
                  <button
                    key={v}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${v === "Semana" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleBloqueoClick(0, "14:00")}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Bloquear tiempo
              </button>
              <button
                onClick={() => setShowNuevaCita(true)}
                className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nueva Cita
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b border-gray-100">
              <div className="p-3" />
              {weekDates.map((date, i) => {
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <div key={i} className="p-3 text-center border-l border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase">{DAYS[i]}</p>
                    <p className={`text-lg font-bold mt-0.5 ${isToday ? "text-green-600" : "text-gray-800"}`}>
                      {date.getDate()}
                    </p>
                    {isToday && <div className="w-1.5 h-1.5 bg-green-500 rounded-full mx-auto mt-0.5" />}
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="relative">
              {HOURS.map((hora) => (
                <div key={hora} className="grid grid-cols-8 border-b border-gray-50 last:border-0" style={{ height: "64px" }}>
                  <div className="flex items-start pt-2 pr-3 justify-end">
                    <span className="text-xs text-gray-400 font-medium">{hora}</span>
                  </div>
                  {weekDates.map((_, diaIdx) => {
                    const citasEnSlot = SAMPLE_CITAS.filter(
                      (c) => c.dia === diaIdx && c.hora === parseInt(hora.split(":")[0])
                    );
                    return (
                      <div
                        key={diaIdx}
                        className="border-l border-gray-100 relative cursor-pointer hover:bg-green-50/40 transition-colors group"
                        onClick={() => handleSlotClick(diaIdx, hora)}
                      >
                        {citasEnSlot.map((cita) => (
                          <div
                            key={cita.id}
                            className={`absolute inset-x-1 top-1 rounded-lg border-l-4 px-2 py-1 z-10 cursor-pointer ${cita.color}`}
                            style={{ height: `${cita.duracion * 64 - 6}px` }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-xs font-bold truncate">{cita.servicio}</p>
                            {cita.cliente && <p className="text-xs truncate opacity-80">{cita.cliente}</p>}
                            {cita.urgente && (
                              <span className="inline-block bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5">
                                URGENTE
                              </span>
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
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-72 border-l border-gray-100 bg-white p-5 overflow-y-auto shrink-0 flex flex-col gap-5">
          {/* Próximas Citas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Próximas Citas</h3>
              <button className="text-xs text-green-600 font-semibold hover:underline">Ver todas</button>
            </div>
            <div className="space-y-3">
              {PROXIMAS_CITAS.map((cita, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-gray-900 truncate">{cita.nombre}</p>
                        {cita.estado === "cobrar" && (
                          <div className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                        )}
                        {cita.estado === "pendiente" && i === 0 && (
                          <div className="w-2 h-2 bg-yellow-400 rounded-full shrink-0" />
                        )}
                        {cita.estado === "pendiente" && i === 2 && (
                          <div className="w-2 h-2 bg-gray-300 rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{cita.servicio}{cita.hora ? ` • ${cita.hora}` : ""}</p>
                    </div>
                  </div>
                  {cita.estado === "cobrar" ? (
                    <button className="w-full bg-green-50 text-green-700 border border-green-200 text-xs font-bold py-2 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      COBRAR {cita.monto}
                    </button>
                  ) : (
                    <button className="w-full bg-green-600 text-white text-xs font-bold py-2 rounded-xl hover:bg-green-700 transition-colors">
                      MARCAR LLEGADA
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Resumen de Hoy */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Resumen de Hoy</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-green-50 rounded-2xl p-3 border border-green-100">
                <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Citas</p>
                <p className="text-2xl font-extrabold text-green-700 mt-1">12</p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100">
                <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Cobrado</p>
                <p className="text-2xl font-extrabold text-blue-700 mt-1">$1.2k</p>
              </div>
            </div>
            {/* Tip */}
            <div className="bg-gray-900 rounded-2xl p-4 text-white">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Tip del día</p>
              <p className="text-xs text-gray-200 leading-relaxed">
                Puedes sincronizar tu agenda con Google Calendar desde la configuración.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nueva Cita */}
      {showNuevaCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Nueva Cita</h2>
              </div>
              <button onClick={() => setShowNuevaCita(false)} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre del cliente</label>
                  <input
                    value={citaForm.cliente}
                    onChange={(e) => setCitaForm({ ...citaForm, cliente: e.target.value })}
                    placeholder="Ej. María García"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Teléfono</label>
                  <input
                    value={citaForm.telefono}
                    onChange={(e) => setCitaForm({ ...citaForm, telefono: e.target.value })}
                    placeholder="+52 55 0000 0000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Servicio</label>
                <select
                  value={citaForm.servicio}
                  onChange={(e) => setCitaForm({ ...citaForm, servicio: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={citaForm.fecha}
                    onChange={(e) => setCitaForm({ ...citaForm, fecha: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Hora</label>
                  <input
                    type="time"
                    value={citaForm.hora}
                    onChange={(e) => setCitaForm({ ...citaForm, hora: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notas <span className="font-normal text-gray-400">(Opcional)</span></label>
                <textarea
                  value={citaForm.notas}
                  onChange={(e) => setCitaForm({ ...citaForm, notas: e.target.value })}
                  rows={3}
                  placeholder="Ej. Cliente prefiere atención rápida..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowNuevaCita(false)} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                Cancelar
              </button>
              <button onClick={() => setShowNuevaCita(false)} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors text-sm shadow-lg shadow-green-600/20">
                Guardar Cita
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bloquear Horario */}
      {showBloqueo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Bloquear Horario</h2>
              </div>
              <button onClick={() => setShowBloqueo(false)} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Horario seleccionado */}
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">Horario Seleccionado</p>
                <p className="text-base font-bold text-gray-900">{bloqueoForm.diaLabel}</p>
                <p className="text-sm text-gray-600 mt-0.5">{bloqueoForm.horaLabel}</p>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Motivo del bloqueo</label>
                <div className="grid grid-cols-2 gap-2">
                  {MOTIVOS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setBloqueoForm({ ...bloqueoForm, motivo: m.id })}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                        bloqueoForm.motivo === m.id
                          ? "border-green-500 text-green-700 bg-green-50"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <span>{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Notas <span className="font-normal text-gray-400">(Opcional)</span>
                </label>
                <textarea
                  value={bloqueoForm.notas}
                  onChange={(e) => setBloqueoForm({ ...bloqueoForm, notas: e.target.value })}
                  rows={3}
                  placeholder="Ej. Almuerzo con proveedor"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowBloqueo(false)} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                Cancelar
              </button>
              <button onClick={() => setShowBloqueo(false)} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors text-sm shadow-lg shadow-green-600/20">
                Marcar como No Disponible
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
