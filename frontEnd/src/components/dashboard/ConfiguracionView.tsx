import { useState, useEffect, useRef } from "react";
import type { NegocioData, HorarioData } from "../../hooks/useNegocio";

interface ConfiguracionViewProps {
  negocio: NegocioData | null;
  negocioId: string | null;
  horarios: HorarioData[];
  isLoading: boolean;
  onSave: (
    fields: Partial<
      Pick<
        NegocioData,
        "nombre" | "giro" | "descripcion" | "direccion" | "color_marca"
      >
    >,
  ) => Promise<boolean>;
  onSaveHorarios: (horarios: HorarioData[]) => Promise<unknown>;
  onDataChanged?: () => void;
}

interface Miembro {
  nombre: string;
  email: string;
  rol: string;
  estado: "Activo" | "Inactivo";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function buildHorarioState(horarios: HorarioData[]): HorarioData[] {
  return DIAS_SEMANA.map((_, idx) => {
    const h = horarios.find((h) => h.dia_semana === idx);
    return (
      h ?? {
        dia_semana: idx,
        hora_apertura: null,
        hora_cierre: null,
        esta_cerrado: true,
      }
    );
  });
}

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
  negocioId,
  horarios,
  isLoading,
  onSave,
  onSaveHorarios,
  onDataChanged,
}: ConfiguracionViewProps) {
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [direccion, setDireccion] = useState("");
  const [biografia, setBiografia] = useState("");
  const [giro, setGiro] = useState("");
  const [colorMarca, setColorMarca] = useState("#16a34a");
  const [emailNotif, setEmailNotif] = useState(true);
  const [whatsappNotif, setWhatsappNotif] = useState(false);
  const [cancelacion, setCancelacion] = useState("24 horas antes");
  const [terminosReembolso, setTerminosReembolso] = useState("");
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [showInvitar, setShowInvitar] = useState(false);
  const [invitarEmail, setInvitarEmail] = useState("");
  const [invitarRol, setInvitarRol] = useState("Especialista");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Logo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState("");

  // Horarios state
  const [horariosState, setHorariosState] = useState<HorarioData[]>(() =>
    buildHorarioState(horarios),
  );
  const [savingHorarios, setSavingHorarios] = useState(false);
  const [horariosSaved, setHorariosSaved] = useState(false);
  const [horariosError, setHorariosError] = useState("");

  // Sync form with real data when it arrives from the backend
  useEffect(() => {
    if (negocio) {
      setNombreNegocio(negocio.nombre ?? "");
      setDireccion(negocio.direccion ?? "");
      setBiografia(negocio.descripcion ?? "");
      setGiro(negocio.giro ?? "");
      setColorMarca(negocio.color_marca ?? "#16a34a");
      const raw = negocio.url_logo ?? null;
      setLogoUrl(raw ? (raw.startsWith("http") ? raw : `${import.meta.env.VITE_API_BASE}${raw}`) : null);
    }
  }, [negocio]);

  useEffect(() => {
    setHorariosState(buildHorarioState(horarios));
  }, [horarios]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !negocioId) return;
    setLogoError("");
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/negocio/${negocioId}/logo`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error al subir" }));
        throw new Error(err.detail ?? "Error al subir");
      }
      const data = await res.json();
      setLogoUrl(`${import.meta.env.VITE_API_BASE}${data.url_logo}?t=${Date.now()}`);
      onDataChanged?.();
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Error al subir el logo");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateDia = (idx: number, patch: Partial<HorarioData>) => {
    setHorariosState((prev) =>
      prev.map((h, i) => (i === idx ? { ...h, ...patch } : h)),
    );
  };

  const handleGuardarHorarios = async () => {
    setSavingHorarios(true);
    setHorariosError("");
    try {
      await onSaveHorarios(horariosState);
      setHorariosSaved(true);
      onDataChanged?.();
      setTimeout(() => setHorariosSaved(false), 2500);
    } catch (e) {
      setHorariosError(
        e instanceof Error ? e.message : "Error al guardar horarios",
      );
    } finally {
      setSavingHorarios(false);
    }
  };

  const handleGuardar = async () => {
    setSaveError("");
    const ok = await onSave({
      nombre: nombreNegocio,
      descripcion: biografia,
      direccion: direccion,
      giro: giro || undefined,
      color_marca: colorMarca,
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
      <div className="max-w-3xl mx-auto p-6 lg:p-8 space-y-6 pb-10">
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
                    {logoUrl ? (
                      <img
                        src={logoUrl}
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
                  <div className="flex flex-col gap-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {uploadingLogo ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        "Cambiar Logo"
                      )}
                    </button>
                    <p className="text-[10px] text-gray-400">JPG, PNG o WebP. Máx 2 MB.</p>
                    {logoError && (
                      <p className="text-[10px] text-red-500 font-medium">{logoError}</p>
                    )}
                  </div>
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

          {/* Save actions inline */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                ¡Guardado!
              </span>
            )}
            <button
              onClick={() => {
                if (negocio) {
                  setNombreNegocio(negocio.nombre ?? "");
                  setDireccion(negocio.direccion ?? "");
                  setBiografia(negocio.descripcion ?? "");
                  setGiro(negocio.giro ?? "");
                  setColorMarca(negocio.color_marca ?? "#16a34a");
                  setSaveError("");
                }
              }}
              className="border border-gray-200 text-gray-600 font-semibold px-5 py-2 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-sm shadow-green-600/20"
            >
              Guardar Cambios
            </button>
          </div>
        </div>

        {/* Página Pública */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900">Página Pública</h2>
          </div>

          {/* Link de la página */}
          {negocio?.slug && (
            <div className="mb-5 flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-sm text-gray-500 flex-1 truncate">
                {window.location.host}/b/<span className="font-semibold text-gray-800">{negocio.slug}</span>
              </span>
              <a
                href={`${window.location.origin}/b/${negocio.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-green-600 hover:underline shrink-0"
              >
                Ver página
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tipo de negocio */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Tipo de negocio
              </label>
              <p className="text-xs text-gray-400 mb-2">Aparece como etiqueta en tu página pública.</p>
              <input
                value={giro}
                onChange={(e) => setGiro(e.target.value)}
                placeholder="Ej. Barbería, Salón de belleza, Spa…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Color de marca */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Color de marca
              </label>
              <p className="text-xs text-gray-400 mb-2">Se usa en botones, etiquetas y el hero de tu página.</p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colorMarca}
                  onChange={(e) => setColorMarca(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-white"
                />
                <div className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: colorMarca }} />
                  <span className="text-sm text-gray-700 font-mono">{colorMarca}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preview strip */}
          <div className="mt-5 rounded-xl overflow-hidden border border-gray-100">
            <div className="h-2" style={{ backgroundColor: colorMarca }} />
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: `${colorMarca}10` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: colorMarca }}>
                {negocio ? initials(negocio.nombre) : "N"}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{negocio?.nombre || "Tu negocio"}</p>
                {giro && <p className="text-xs" style={{ color: colorMarca }}>{giro}</p>}
              </div>
              <div className="ml-auto">
                <div className="text-xs font-bold text-white px-3 py-1.5 rounded-lg" style={{ backgroundColor: colorMarca }}>
                  Reservar cita
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 mt-3">Guarda los cambios para ver los colores actualizados en tu página pública.</p>
        </div>

        {/* Horarios de Atención */}
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-900">
                Horarios de Atención
              </h2>
            </div>
            <button
              onClick={handleGuardarHorarios}
              disabled={savingHorarios}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                horariosSaved
                  ? "bg-green-700 text-white"
                  : "bg-green-600 text-white hover:bg-green-700 shadow-green-600/20"
              }`}
            >
              {horariosSaved ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  ¡Guardado!
                </>
              ) : savingHorarios ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Horarios"
              )}
            </button>
          </div>

          {horariosError && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl mb-4">
              {horariosError}
            </div>
          )}

          <div className="space-y-3">
            {horariosState.map((h, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0"
              >
                {/* Día */}
                <span className="text-sm font-semibold text-gray-700 w-24 shrink-0">
                  {DIAS_SEMANA[idx]}
                </span>

                {/* Toggle abierto/cerrado */}
                <Toggle
                  checked={!h.esta_cerrado}
                  onChange={() =>
                    updateDia(idx, {
                      esta_cerrado: !h.esta_cerrado,
                      hora_apertura: h.esta_cerrado ? "09:00" : null,
                      hora_cierre: h.esta_cerrado ? "18:00" : null,
                    })
                  }
                />
                <span
                  className={`text-xs font-semibold w-16 shrink-0 ${
                    h.esta_cerrado ? "text-gray-400" : "text-green-600"
                  }`}
                >
                  {h.esta_cerrado ? "Cerrado" : "Abierto"}
                </span>

                {/* Horas */}
                {!h.esta_cerrado && (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={h.hora_apertura ?? ""}
                      onChange={(e) =>
                        updateDia(idx, { hora_apertura: e.target.value })
                      }
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <span className="text-gray-400 text-sm">—</span>
                    <input
                      type="time"
                      value={h.hora_cierre ?? ""}
                      onChange={(e) =>
                        updateDia(idx, { hora_cierre: e.target.value })
                      }
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            ))}
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
                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full border border-gray-200 uppercase tracking-wide">
                  No configurado
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
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                Agrega tu cuenta bancaria para recibir transferencias de los anticipos cobrados.
              </p>
              <button className="text-xs text-green-600 font-semibold hover:underline">
                Agregar cuenta bancaria
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
