import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";

const GIROS = [
  { id: "barberia", label: "Barbería", emoji: "✂️" },
  { id: "salon_belleza", label: "Salón de Belleza", emoji: "💅" },
  { id: "spa", label: "Spa / Masajes", emoji: "🧘" },
  { id: "dentista", label: "Dentista", emoji: "🦷" },
  { id: "medico", label: "Médico / Clínica", emoji: "🏥" },
  { id: "nutricion", label: "Nutrición", emoji: "🥗" },
  { id: "psicologia", label: "Psicología", emoji: "🧠" },
  { id: "entrenamiento", label: "Entrenamiento Personal", emoji: "💪" },
  { id: "tatuajes", label: "Tatuajes / Piercing", emoji: "🎨" },
  { id: "veterinaria", label: "Veterinaria", emoji: "🐾" },
  { id: "otro", label: "Otro", emoji: "📋" },
];

const API_BASE = "http://localhost:8000";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();

  const [step, setStep] = useState<1 | 2>(1);
  const [businessName, setBusinessName] = useState("");
  const [selectedGiro, setSelectedGiro] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStep1 = () => {
    if (!businessName.trim()) {
      setError("Por favor ingresa el nombre de tu negocio.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleFinish = async () => {
    if (!selectedGiro) {
      setError("Por favor selecciona el giro de tu negocio.");
      return;
    }
    if (!user) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.fullName ?? user.firstName ?? "Usuario",
          email: user.primaryEmailAddress?.emailAddress ?? "",
          password: "",
          plan: "basico",
          isAnnual: false,
          total: "0.00",
          paymentMethodId: "google_oauth",
          businessName: businessName.trim(),
          selectedType: selectedGiro,
          services: [],
          schedule: {},
          clerkUserId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Error al crear el negocio.");
      }

      // Guardar negocio_id localmente para que el dashboard lo use de inmediato
      localStorage.setItem("agenda_negocio_id", data.negocio_id);

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex flex-col items-center justify-center p-4 font-sans">
      {/* Logo */}
      <div
        className="flex items-center gap-2 mb-8 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <div className="h-10 w-10 bg-green-600 rounded-xl flex items-center justify-center shadow-md shadow-green-600/30">
          <svg
            className="h-6 w-6 text-white"
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

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-green-600 transition-all duration-500"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            {/* User greeting */}
            <div className="flex items-center gap-3 mb-5 p-3 bg-green-50 rounded-2xl border border-green-100">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName ?? ""}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-green-200"
                />
              ) : (
                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-bold text-sm">
                  {(user?.fullName ?? user?.firstName ?? "U")[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-800">
                  Hola, {user?.firstName ?? "bienvenido"} 👋
                </p>
                <p className="text-xs text-gray-500">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
              <span
                className={`font-semibold ${step === 1 ? "text-green-600" : "text-gray-400"}`}
              >
                Paso 1
              </span>
              <div className="flex-1 h-px bg-gray-100" />
              <span
                className={`font-semibold ${step === 2 ? "text-green-600" : "text-gray-400"}`}
              >
                Paso 2
              </span>
            </div>

            {step === 1 ? (
              <>
                <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                  ¿Cuál es el nombre de tu negocio?
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                  Este nombre aparecerá en tu agenda pública y comunicaciones
                  con tus clientes.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                  ¿Cuál es el giro de{" "}
                  <span className="text-green-600">{businessName}</span>?
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                  Esto nos ayuda a personalizar las funciones de tu agenda.
                </p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
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
              {error}
            </div>
          )}

          {/* Step 1: Business Name */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del negocio
                </label>
                <input
                  autoFocus
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                  placeholder="Ej: Barbería El Estilo, Clínica Dental Sonrisa..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-300 transition-all"
                />
              </div>

              <button
                onClick={handleStep1}
                className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
              >
                Continuar
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Step 2: Giro */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {GIROS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGiro(g.id)}
                    className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
                      selectedGiro === g.id
                        ? "border-green-500 bg-green-50 text-green-800 shadow-sm shadow-green-100"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg leading-none">{g.emoji}</span>
                    <span className="leading-tight">{g.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    setStep(1);
                    setError("");
                  }}
                  className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  Atrás
                </button>
                <button
                  onClick={handleFinish}
                  disabled={isLoading || !selectedGiro}
                  className="flex-2 flex-grow-[2] bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creando tu agenda...
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
                      Crear mi agenda
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center gap-1.5 text-xs text-gray-400">
        <span>¿No eres tú?</span>
        <button
          onClick={() => signOut()}
          className="text-green-600 font-semibold hover:underline"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
