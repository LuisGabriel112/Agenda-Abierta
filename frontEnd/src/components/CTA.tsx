import { SignUpButton } from "@clerk/react";

export default function CTA() {
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

          <div className="mt-10">
            <SignUpButton mode="modal">
              <button className="flex w-full max-w-xs mx-auto justify-center rounded-lg bg-white px-3 py-3.5 text-sm font-semibold text-brand-600 shadow-sm hover:bg-gray-50 transition-all cursor-pointer">
                Crear mi Agenda Gratis
              </button>
            </SignUpButton>
          </div>

          <p className="mt-4 text-xs text-brand-200">
            Al registrarte, aceptas nuestros términos y política de privacidad.
          </p>
        </div>
      </div>
    </section>
  );
}
