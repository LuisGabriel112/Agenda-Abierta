import { useState, useEffect, useRef } from "react";
import { useClerk } from "@clerk/react";
import { useNavigate } from "react-router-dom";
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
        "nombre" | "giro" | "descripcion" | "direccion" | "color_marca" | "email_negocio" | "telefono_negocio" | "notif_email" | "notif_whatsapp" | "clabe" | "banco" | "titular_cuenta"
      >
    >,
  ) => Promise<boolean>;
  onSaveHorarios: (horarios: HorarioData[]) => Promise<unknown>;
  onDataChanged?: () => void;
}


function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
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


export default function ConfiguracionView({
  negocio,
  negocioId,
  horarios,
  isLoading,
  onSave,
  onSaveHorarios,
  onDataChanged,
}: ConfiguracionViewProps) {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [direccion, setDireccion] = useState("");
  const [biografia, setBiografia] = useState("");
  const [giro, setGiro] = useState("");
  const [colorMarca, setColorMarca] = useState("#16a34a");
  const [emailNotif, setEmailNotif] = useState(true);
  const [whatsappNotif, setWhatsappNotif] = useState(false);
  const [emailNegocio, setEmailNegocio] = useState("");
  const [telefonoNegocio, setTelefonoNegocio] = useState("");
  const [cancelacion, setCancelacion] = useState("24 horas antes");
  const [terminosReembolso, setTerminosReembolso] = useState("");
  // Pagos
  const [clabe, setClabe] = useState("");
  const [banco, setBanco] = useState("");
  const [titularCuenta, setTitularCuenta] = useState("");
  const [savingCuenta, setSavingCuenta] = useState(false);
  const [cuentaSaved, setCuentaSaved] = useState(false);
  const [cuentaError, setCuentaError] = useState("");
  const [stripeConnecting, setStripeConnecting] = useState(false);
  const [stripeConectado, setStripeConectado] = useState(false);
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
      setEmailNegocio(negocio.email_negocio ?? "");
      setTelefonoNegocio(negocio.telefono_negocio ?? "");
      setEmailNotif(negocio.notif_email ?? true);
      setWhatsappNotif(negocio.notif_whatsapp ?? false);
      setClabe(negocio.clabe ?? "");
      setBanco(negocio.banco ?? "");
      setTitularCuenta(negocio.titular_cuenta ?? "");
      const raw = negocio.url_logo ?? null;
      setLogoUrl(raw ? (raw.startsWith("http") ? raw : `${import.meta.env.VITE_API_BASE}${raw}`) : null);
    }
  }, [negocio]);

  // Verificar charges_enabled real contra Stripe (no solo si stripe_connect_id existe)
  useEffect(() => {
    if (!negocioId || !negocio?.stripe_connect_id) {
      setStripeConectado(false);
      return;
    }
    fetch(`${import.meta.env.VITE_API_BASE}/api/negocio/${negocioId}/stripe-connect/status`)
      .then((r) => r.json())
      .then((d) => setStripeConectado(!!d.conectado))
      .catch(() => setStripeConectado(false));
  }, [negocioId, negocio?.stripe_connect_id]);

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
      const logoRaw: string = data.url_logo;
      setLogoUrl(logoRaw.startsWith("http") ? logoRaw : `${import.meta.env.VITE_API_BASE}${logoRaw}?t=${Date.now()}`);
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
      email_negocio: emailNegocio || undefined,
      telefono_negocio: telefonoNegocio || undefined,
      notif_email: emailNotif,
      notif_whatsapp: whatsappNotif,
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

  // Guardar cuenta bancaria
  const handleGuardarCuenta = async () => {
    if (!negocioId) return;
    setSavingCuenta(true);
    setCuentaError("");
    const ok = await onSave({ clabe: clabe.trim(), banco: banco.trim(), titular_cuenta: titularCuenta.trim() });
    setSavingCuenta(false);
    if (ok) {
      setCuentaSaved(true);
      setTimeout(() => setCuentaSaved(false), 2500);
    } else {
      setCuentaError("No se pudo guardar la cuenta. Intenta de nuevo.");
    }
  };

  // Stripe Connect onboarding
  const handleStripeConnect = async () => {
    if (!negocioId) return;
    setStripeConnecting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/negocio/${negocioId}/stripe-connect/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Error al iniciar Stripe Connect");
      const data = await res.json();
      window.location.href = data.url;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al conectar con Stripe");
      setStripeConnecting(false);
    }
  };

  // Eliminar cuenta
  const [showEliminar, setShowEliminar] = useState(false);
  const [confirmNombre, setConfirmNombre] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleEliminarCuenta = async () => {
    if (!negocioId) return;
    setDeletingAccount(true);
    setDeleteError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/negocio/${negocioId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error al eliminar" }));
        throw new Error(err.detail ?? "Error al eliminar la cuenta");
      }
      localStorage.removeItem("agenda_negocio_id");
      await signOut();
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setDeletingAccount(false);
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
                className="py-3 border-b border-gray-50 last:border-0"
              >
                {/* Fila principal: día + toggle + estado */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700 w-24 shrink-0">
                    {DIAS_SEMANA[idx]}
                  </span>
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
                    className={`text-xs font-semibold ${
                      h.esta_cerrado ? "text-gray-400" : "text-green-600"
                    }`}
                  >
                    {h.esta_cerrado ? "Cerrado" : "Abierto"}
                  </span>
                </div>

                {/* Horas — segunda fila en móvil, misma fila en sm+ */}
                {!h.esta_cerrado && (
                  <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-36">
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

          <div className="space-y-5">
            {/* Email del negocio */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Email del negocio
              </label>
              <input
                type="email"
                value={emailNegocio}
                onChange={(e) => setEmailNegocio(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">Recibirás un aviso aquí cada vez que alguien agende una cita.</p>
            </div>

            {/* Toggle Email */}
            <div className="flex items-center justify-between py-3 border-t border-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-800">Notificaciones por Email</p>
                <p className="text-xs text-gray-500 mt-0.5">Confirmaciones al negocio y al cliente por correo.</p>
              </div>
              <Toggle checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
            </div>

            {/* Teléfono WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Teléfono WhatsApp del negocio
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">+52</span>
                <input
                  type="tel"
                  value={telefonoNegocio}
                  onChange={(e) => setTelefonoNegocio(e.target.value)}
                  placeholder="2281234567"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Número registrado en WhatsApp Business.</p>
            </div>

            {/* Toggle WhatsApp */}
            <div className="flex items-center justify-between py-3 border-t border-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-800">Alertas de WhatsApp</p>
                <p className="text-xs text-gray-500 mt-0.5">Requiere cuenta WhatsApp Business conectada a Brevo.</p>
              </div>
              <Toggle checked={whatsappNotif} onChange={() => setWhatsappNotif(!whatsappNotif)} />
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900">Pagos y Facturación</h2>
          </div>

          {/* Cuenta bancaria / CLABE */}
          <div className="border border-gray-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              <span className="text-sm font-bold text-gray-800">Cuenta Bancaria (CLABE)</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Tus clientes podrán ver estos datos para hacer transferencias de anticipo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">CLABE Interbancaria (18 dígitos)</label>
                <input
                  type="text"
                  maxLength={18}
                  value={clabe}
                  onChange={(e) => setClabe(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000000000000000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Banco</label>
                <input
                  type="text"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  placeholder="Ej. BBVA, Banamex, HSBC"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Titular de la cuenta</label>
                <input
                  type="text"
                  value={titularCuenta}
                  onChange={(e) => setTitularCuenta(e.target.value)}
                  placeholder="Nombre completo o razón social"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            {cuentaError && <p className="text-xs text-red-500">{cuentaError}</p>}
            <button
              onClick={handleGuardarCuenta}
              disabled={savingCuenta}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {savingCuenta ? (
                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
              ) : cuentaSaved ? (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Guardado</>
              ) : "Guardar cuenta bancaria"}
            </button>
          </div>

          {/* Stripe Connect */}
          <div className="border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-sm font-bold text-gray-800">Stripe Connect</span>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${
                stripeConectado
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-gray-100 text-gray-500 border-gray-200"
              }`}>
                {stripeConectado ? "Conectado" : "No configurado"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Conecta tu cuenta de Stripe para recibir pagos con tarjeta directamente en tu negocio. Stripe deposita en tu cuenta bancaria automáticamente.
            </p>
            <button
              onClick={handleStripeConnect}
              disabled={stripeConnecting}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {stripeConnecting ? (
                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Conectando...</>
              ) : stripeConectado ? "Gestionar cuenta Stripe" : "Conectar con Stripe"}
            </button>
          </div>
        </div>

        {/* Zona de Riesgo */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 bg-red-100 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900">Zona de Riesgo</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Las acciones de esta sección son permanentes e irreversibles.
          </p>
          <div className="flex items-center justify-between p-4 border border-red-100 rounded-xl bg-red-50/50">
            <div>
              <p className="text-sm font-semibold text-gray-800">Eliminar cuenta</p>
              <p className="text-xs text-gray-500 mt-0.5">Elimina tu negocio, citas, servicios y todos los datos de forma permanente.</p>
            </div>
            <button
              onClick={() => { setShowEliminar(true); setConfirmNombre(""); setDeleteError(""); }}
              className="shrink-0 ml-4 border border-red-200 text-red-600 font-semibold px-4 py-2 rounded-xl hover:bg-red-50 transition-colors text-sm"
            >
              Eliminar cuenta
            </button>
          </div>
        </div>
      </div>

      {/* Modal Eliminar Cuenta */}
      {showEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-red-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Eliminar cuenta</h2>
              </div>
              <button
                onClick={() => setShowEliminar(false)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-sm text-red-700 font-medium">Esta acción eliminará permanentemente:</p>
                <ul className="mt-2 space-y-1 text-xs text-red-600 list-disc list-inside">
                  <li>Tu negocio y todos sus datos</li>
                  <li>Historial de citas y clientes</li>
                  <li>Servicios y horarios configurados</li>
                  <li>Tu página pública de reservas</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Escribe <span className="text-gray-900 font-bold">"{negocio?.nombre}"</span> para confirmar
                </label>
                <input
                  type="text"
                  value={confirmNombre}
                  onChange={(e) => setConfirmNombre(e.target.value)}
                  placeholder={negocio?.nombre ?? "Nombre del negocio"}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                />
              </div>

              {deleteError && (
                <p className="text-sm text-red-600 font-medium">{deleteError}</p>
              )}
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowEliminar(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarCuenta}
                disabled={confirmNombre !== negocio?.nombre || deletingAccount}
                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deletingAccount ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Eliminar permanentemente"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante Guardar Cambios */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 bg-white border border-green-200 text-green-600 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            ¡Guardado!
          </span>
        )}
        {saveError && (
          <span className="bg-white border border-red-200 text-red-500 text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg">
            {saveError}
          </span>
        )}
        <button
          onClick={handleGuardar}
          className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-green-700 active:scale-95 transition-all shadow-xl shadow-green-600/30"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
