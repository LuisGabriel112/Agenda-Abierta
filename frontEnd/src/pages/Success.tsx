import { useNavigate } from "react-router-dom";

export default function Success() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 sm:p-12 text-center border border-gray-100 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-2 bg-brand-600"></div>

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
          <svg
            className="h-10 w-10 text-brand-600"
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

        <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
          ¡Pago Exitoso!
        </h2>

        <p className="text-base text-gray-600 mb-8 leading-relaxed">
          Tu cuenta ha sido creada correctamente y tu suscripción está activa.
          Hemos enviado un recibo a tu correo electrónico junto con los pasos
          para empezar.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-8 text-sm text-gray-500 border border-gray-100">
          <p>¿Qué sigue?</p>
          <ul className="mt-2 text-left space-y-2 font-medium">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>{" "}
              Configura tu perfil
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>{" "}
              Comparte tu enlace de reservas
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>{" "}
              Recibe tus primeras citas
            </li>
          </ul>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full py-4 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/30"
        >
          Ir a mi Panel de Control
        </button>
      </div>
    </div>
  );
}
