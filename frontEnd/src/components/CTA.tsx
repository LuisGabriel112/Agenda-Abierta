import { useNavigate } from "react-router-dom";

export default function CTA() {
  const navigate = useNavigate();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/onboarding");
  };

  return (
    <section className="bg-brand-600 py-24 sm:py-32 relative overflow-hidden">
      {/* Background abstract shapes to match the image a bit */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-20">
        <div className="w-[500px] h-[500px] rounded-full bg-brand-400 blur-3xl"></div>
      </div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 opacity-20">
        <div className="w-[400px] h-[400px] rounded-full bg-brand-800 blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white/10 backdrop-blur-sm p-8 sm:p-12 border border-white/20 text-center shadow-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Empieza hoy mismo
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-brand-50">
            Regístrate ultra-rápido. Sin tarjetas de crédito, sin
            complicaciones.
          </p>

          <form
            onSubmit={handleStart}
            className="mt-10 max-w-md mx-auto flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-left">
                <label
                  htmlFor="business-name"
                  className="block text-xs font-semibold uppercase tracking-wide text-brand-100 mb-1"
                >
                  Nombre de tu negocio
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg
                      className="h-5 w-5 text-brand-300"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="business-name"
                    id="business-name"
                    className="block w-full rounded-lg border-0 py-3 pl-10 text-white bg-white/10 ring-1 ring-inset ring-white/20 placeholder:text-brand-200 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 outline-none"
                    placeholder="Ej: Barbería Central"
                  />
                </div>
              </div>

              <div className="text-left">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wide text-brand-100 mb-1"
                >
                  Tu email profesional
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="block w-full rounded-lg border-0 py-3 px-4 text-white bg-white/10 ring-1 ring-inset ring-white/20 placeholder:text-brand-200 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 outline-none"
                  placeholder="nombre@ejemplo.com"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 flex w-full justify-center rounded-lg bg-white px-3 py-3.5 text-sm font-semibold text-brand-600 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all"
            >
              Crear mi Agenda Gratis
            </button>
          </form>

          <p className="mt-4 text-xs text-brand-200">
            Al registrarte, aceptas nuestros términos y política de privacidad.
          </p>
        </div>
      </div>
    </section>
  );
}
