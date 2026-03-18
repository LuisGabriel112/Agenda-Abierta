import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  // Recibimos los datos del plan y de la configuración desde el Checkout
  const {
    plan,
    isAnnual,
    total,
    paymentMethodId,
    businessName,
    selectedType,
    services,
    schedule,
  } = location.state || {
    plan: "profesional",
    isAnnual: false,
    total: "0.00",
    paymentMethodId: "mock_pm_123",
    businessName: "",
    selectedType: "",
    services: [],
    schedule: {},
  };

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Enviamos todos los datos al Backend
      const response = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          plan: plan,
          isAnnual: isAnnual,
          total: total,
          paymentMethodId: paymentMethodId,
          businessName: businessName,
          selectedType: selectedType,
          services: services,
          schedule: schedule,
          clerkUserId: user?.id ?? null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Error al procesar el pago y registro");
      }

      // 2. Si es exitoso, nos devuelve el JWT (Iniciamos sesión)
      localStorage.setItem("agenda_token", data.token);
      localStorage.setItem("agenda_user_name", formData.name);

      // 3. Redirigimos a la pantalla de Éxito
      navigate("/success");
    } catch (err) {
      // Si falla, redirigimos a la pantalla de Pago Rechazado pasando el error
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      navigate("/payment-failed", { state: { error: errorMessage } });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div
          className="flex justify-center cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 shadow-sm border border-brand-100">
            <svg
              className="h-8 w-8 text-brand-600"
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
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Crea tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Último paso para activar tu plan{" "}
          <span className="font-bold text-brand-600 capitalize">{plan}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          {/* Mini resumen */}
          <div className="mb-6 bg-brand-50 rounded-xl p-4 border border-brand-100 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-brand-800 uppercase tracking-wide">
                Total a pagar hoy
              </p>
              <p className="text-sm text-brand-600 font-medium">
                Plan {plan} ({isAnnual ? "Anual" : "Mensual"})
              </p>
            </div>
            <div className="text-xl font-extrabold text-brand-700">
              ${total}
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 font-medium">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Nombre completo
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-600 focus:border-brand-600 sm:text-sm"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Correo electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-600 focus:border-brand-600 sm:text-sm"
                  placeholder="juan@tumarca.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-600 focus:border-brand-600 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "Procesando pago y creando cuenta..."
                  : "Crear cuenta y Finalizar"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Transacción segura encriptada a 256-bits
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
