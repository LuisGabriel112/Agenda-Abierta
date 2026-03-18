import { useLocation, useNavigate } from 'react-router-dom';

export default function PaymentFailed() {
  const navigate = useNavigate();
  const location = useLocation();
  const errorMessage = location.state?.error || "La tarjeta fue declinada por el banco o hubo un error de conexión.";

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 sm:p-12 text-center border border-gray-100 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
          <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Pago Rechazado
        </h2>

        <p className="text-base text-gray-600 mb-6 leading-relaxed">
          No pudimos procesar tu suscripción. Tu cuenta no ha sido creada y no se ha realizado ningún cargo.
        </p>

        <div className="bg-red-50 rounded-xl p-4 mb-8 text-sm text-red-700 font-medium border border-red-100 text-left">
           <strong>Motivo del error:</strong>
           <p className="mt-1 opacity-90">{errorMessage}</p>
        </div>

        <button
          onClick={() => navigate('/checkout')}
          className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-colors shadow-lg"
        >
          Intentar con otra tarjeta
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-3 py-4 rounded-xl bg-white text-gray-600 font-bold text-sm hover:bg-gray-50 border border-gray-200 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
