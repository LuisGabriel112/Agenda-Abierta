import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Inicializar Stripe con la clave pública de prueba
const stripePromise = loadStripe(
  "pk_test_51TCMqOJPFz0dv283un9eMO6BJ0wKjru8VamrKHg3Tx2SaNZfIo7ph3RkQS79MijRreUl2JtEqkahV7r5lC1ixAmV00BFaQPbVP",
);

function CheckoutContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const stripe = useStripe();
  const elements = useElements();

  // Datos recibidos desde Onboarding
  const { businessName, selectedType, services, schedule } =
    location.state || {};

  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<
    "emprendedor" | "profesional"
  >("profesional");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Precios base
  const prices = {
    emprendedor: { month: 399, annual: 319 },
    profesional: { month: 799, annual: 639 },
  };

  // Precios actuales basados en el toggle Anual/Mensual
  const currentEmprendedor = isAnnual
    ? prices.emprendedor.annual
    : prices.emprendedor.month;
  const currentProfesional = isAnnual
    ? prices.profesional.annual
    : prices.profesional.month;

  // Cálculos para el resumen
  const subtotalMensual =
    selectedPlan === "emprendedor" ? currentEmprendedor : currentProfesional;
  const subtotal = isAnnual ? subtotalMensual * 12 : subtotalMensual;
  const impuestos = subtotal * 0.16;
  const total = subtotal + impuestos;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage("");

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    // 1. Crear PaymentMethod con los datos de la tarjeta
    const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (pmError) {
      setErrorMessage(pmError.message || "Error al validar la tarjeta.");
      setIsProcessing(false);
      return;
    }

    try {
      // 2. Crear suscripción en el backend
      const amountCents = Math.round(total * 100);
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/create-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          plan: selectedPlan,
          isAnnual,
          amountCents,
          email: "",
          businessName: businessName || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al crear la suscripción.");

      // 3. Confirmar el pago con el client_secret y el método de pago
      const { error: confirmError } = await stripe.confirmCardPayment(data.client_secret, {
        payment_method: paymentMethod.id,
      });

      if (confirmError) {
        // Cancelar la suscripción incompleta para evitar duplicados
        await fetch(`${import.meta.env.VITE_API_BASE}/api/cancel-subscription`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription_id: data.subscription_id }),
        }).catch(() => {});
        setErrorMessage(confirmError.message || "El pago fue rechazado.");
        setIsProcessing(false);
        return;
      }

      // 4. Pago exitoso → ir al registro con los IDs de Stripe
      navigate("/register", {
        state: {
          plan: selectedPlan,
          isAnnual,
          total: total.toFixed(2),
          paymentMethodId: paymentMethod.id,
          stripeCustomerId: data.customer_id,
          stripeSubscriptionId: data.subscription_id,
          businessName,
          selectedType,
          services,
          schedule,
        },
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error desconocido.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      {/* Navbar Minimalista (Corregido el "Admin Usuario") */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
          <div className="flex items-center text-sm font-medium text-gray-500">
            Paso 2: Plan y Pago
          </div>
        </div>
      </nav>

      <main className="flex-grow mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4 tracking-tight">
            Elige el plan ideal para tu negocio
          </h1>
          <p className="text-lg text-gray-500">
            Impulsa tu crecimiento con las mejores herramientas de gestión de
            citas.
          </p>

          {/* Toggle Anual/Mensual */}
          <div className="mt-8 inline-flex items-center bg-gray-100/80 rounded-full p-1 border border-gray-200">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${!isAnnual ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Mensual
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${isAnnual ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Anual
              <span className="bg-brand-100 text-brand-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                -20% DTO.
              </span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_1fr_400px] gap-8 items-start">
          {/* Plan Emprendedor */}
          <div
            className={`relative rounded-3xl border-2 p-8 transition-all cursor-pointer
               ${selectedPlan === "emprendedor" ? "border-brand-600 bg-white shadow-xl" : "border-gray-200 bg-white shadow-sm hover:border-brand-300"}`}
            onClick={() => setSelectedPlan("emprendedor")}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Emprendedor
            </h3>
            <div className="flex items-baseline mb-6">
              <span className="text-4xl font-extrabold text-gray-900">
                ${currentEmprendedor}
              </span>
              <span className="text-sm font-medium text-gray-500 ml-2">
                MXN/mes
              </span>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 text-sm text-gray-600">
                <svg
                  className="w-5 h-5 text-brand-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>{" "}
                Hasta 100 citas mensuales
              </li>
              <li className="flex gap-3 text-sm text-gray-600">
                <svg
                  className="w-5 h-5 text-brand-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>{" "}
                Recordatorios Email/SMS
              </li>
              <li className="flex gap-3 text-sm text-gray-600">
                <svg
                  className="w-5 h-5 text-brand-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>{" "}
                Calendario personalizado
              </li>
            </ul>
            <button
              className={`w-full py-3 rounded-xl font-semibold transition-colors border ${selectedPlan === "emprendedor" ? "bg-brand-600 text-white border-brand-600 shadow-md" : "bg-gray-50 text-gray-900 border-gray-200 hover:bg-gray-100"}`}
            >
              {selectedPlan === "emprendedor"
                ? "Plan Actualizado"
                : "Seleccionar Plan"}
            </button>
          </div>

          {/* Plan Profesional */}
          <div
            className={`relative rounded-3xl border-2 p-8 transition-all cursor-pointer
               ${selectedPlan === "profesional" ? "border-brand-600 bg-white shadow-xl" : "border-gray-200 bg-white shadow-sm hover:border-brand-300"}`}
            onClick={() => setSelectedPlan("profesional")}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
              Más popular
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 mt-2">
              Profesional
            </h3>
            <div className="flex items-baseline mb-6">
              <span className="text-4xl font-extrabold text-gray-900">
                ${currentProfesional}
              </span>
              <span className="text-sm font-medium text-gray-500 ml-2">
                MXN/mes
              </span>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 text-sm text-gray-900 font-medium">
                <svg
                  className="w-5 h-5 text-brand-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>{" "}
                Citas ilimitadas
              </li>
              <li className="flex gap-3 text-sm text-gray-600">
                <svg
                  className="w-5 h-5 text-brand-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>{" "}
                Integración WhatsApp Directo
              </li>
              <li className="flex gap-3 text-sm text-gray-600">
                <svg
                  className="w-5 h-5 text-brand-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>{" "}
                Pasarela de pagos integrada
              </li>
              <li className="flex gap-3 text-sm text-gray-600">
                <svg
                  className="w-5 h-5 text-brand-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>{" "}
                Analítica de negocio avanzada
              </li>
            </ul>
            <button
              className={`w-full py-3 rounded-xl font-semibold transition-colors border ${selectedPlan === "profesional" ? "bg-brand-600 text-white border-brand-600 shadow-md" : "bg-gray-50 text-gray-900 border-gray-200 hover:bg-gray-100"}`}
            >
              {selectedPlan === "profesional"
                ? "Plan Actualizado"
                : "Seleccionar Plan"}
            </button>
          </div>

          {/* Formulario de Pago con Stripe */}
          <div className="rounded-3xl bg-gray-50/50 border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Resumen de Suscripción
            </h3>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Plan Seleccionado</span>
                <span className="font-semibold text-gray-900 capitalize">
                  {selectedPlan} ({isAnnual ? "Anual" : "Mensual"})
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Impuestos (IVA 16%)</span>
                <span className="font-medium text-gray-900">
                  ${impuestos.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center mb-8">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-extrabold text-brand-600">
                ${total.toFixed(2)} MXN
              </span>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-4">
              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 mb-4 font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Stripe Card Element */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Datos de la tarjeta
                </label>
                <div className="w-full rounded-lg bg-white border border-gray-300 p-4 shadow-sm focus-within:ring-2 focus-within:ring-brand-600 focus-within:border-brand-600 transition-all">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: "15px",
                          color: "#1f2937", // gray-800
                          fontFamily: "system-ui, -apple-system, sans-serif",
                          "::placeholder": {
                            color: "#9ca3af", // gray-400
                          },
                        },
                        invalid: {
                          color: "#dc2626", // red-600
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="mt-8 w-full py-4 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  "Suscribirme ahora"
                )}
              </button>
            </form>

            <div className="mt-6 flex justify-center gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-brand-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                SSL Secured
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-brand-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
                    clipRule="evenodd"
                  />
                </svg>
                Stripe
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          ¿Tienes dudas sobre los planes?{" "}
          <a href="#" className="font-bold text-brand-600 hover:underline">
            Habla con un asesor por WhatsApp
          </a>
        </div>
      </main>

      <footer className="py-6 px-4 sm:px-6 lg:px-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-gray-400">
          &copy; 2026 AgendaAbierta. Todos los derechos reservados.
        </p>
        <div className="flex gap-4 text-xs text-gray-400">
          <a href="#" className="hover:text-gray-600">
            Términos
          </a>
          <a href="#" className="hover:text-gray-600">
            Privacidad
          </a>
          <a href="#" className="hover:text-gray-600">
            Ayuda
          </a>
        </div>
      </footer>
    </div>
  );
}

// Envolvemos el componente en el Provider de Stripe para poder usar los hooks de react-stripe-js
export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutContent />
    </Elements>
  );
}
