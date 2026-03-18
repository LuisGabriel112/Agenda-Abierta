import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/onboarding");
  };

  return (
    <section className="relative overflow-hidden bg-[#f9fafb] pt-16 pb-24 sm:pt-24 lg:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left content */}
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 mb-6 text-xs font-semibold text-brand-700 uppercase tracking-wide">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 mr-2"></span>
              NUEVO: PAGOS VIA WHATSAPP
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl mb-6 leading-tight">
              Tu agenda llena, <br />
              tus ingresos <br />
              <span className="text-brand-600">seguros</span>
            </h1>

            <p className="mt-4 text-lg text-gray-600 mb-8 max-w-xl">
              La plataforma Neo-minimalista para gestionar citas, reducir
              no-shows y automatizar cobros en un solo lugar. Diseñado para
              profesionales que valoran su tiempo.
            </p>

            <form
              onSubmit={handleStart}
              className="mt-8 flex flex-col sm:flex-row max-w-md gap-3"
            >
              <input
                type="email"
                required
                className="w-full flex-auto rounded-lg border-0 px-4 py-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 bg-white outline-none transition-shadow"
                placeholder="Email de tu negocio"
              />
              <button
                type="submit"
                className="flex-none rounded-lg bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all whitespace-nowrap cursor-pointer"
              >
                Empezar ahora
              </button>
            </form>

            <div className="mt-8 flex items-center gap-x-4 text-sm text-gray-500">
              <div className="flex -space-x-2">
                {/* Simulated avatars */}
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-orange-100"></div>
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-blue-100"></div>
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-brand-100"></div>
              </div>
              <p className="max-w-[200px] leading-tight text-xs text-gray-400">
                Sé parte de los primeros negocios en evolucionar con nosotros.
                Cupos limitados para el lanzamiento.
              </p>
            </div>
          </div>

          {/* Right graphic */}
          <div className="mt-16 lg:mt-0 relative">
            <div className="relative mx-auto w-full max-w-[500px] aspect-[4/3] rounded-3xl bg-[#134e4a] p-4 shadow-2xl flex items-center justify-center overflow-hidden">
              {/* Decorative base underneath the interface to simulate a laptop/screen */}
              <div className="absolute inset-x-8 bottom-6 h-4 bg-[#0f3d3a] rounded-b-xl z-0"></div>
              <div className="absolute inset-x-4 bottom-2 h-2 bg-[#0d3330] rounded-b-3xl z-0 blur-sm opacity-50"></div>

              {/* Mock App Interface (Calendar view) */}
              <div className="relative z-10 w-full h-[85%] bg-white rounded-t-xl rounded-b-md shadow-lg flex flex-col overflow-hidden border border-[#0f3d3a]/20">
                {/* App Header */}
                <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  </div>
                  <div className="mx-auto bg-white rounded text-[10px] px-3 py-0.5 text-gray-400 border border-gray-200">
                    agendaabierta.com/app
                  </div>
                </div>
                {/* App Calendar Grid (Mock) */}
                <div className="flex-1 p-4 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-semibold text-gray-800 text-sm">
                      Febrero
                    </div>
                    <div className="flex gap-1">
                      <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        {"<"}
                      </div>
                      <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        {">"}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Days header */}
                    {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
                      <div
                        key={i}
                        className="text-center text-[10px] text-gray-400 font-medium pb-2"
                      >
                        {d}
                      </div>
                    ))}
                    {/* Days grid */}
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded flex items-center justify-center text-[10px] ${i === 12 ? "bg-brand-600 text-white font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
