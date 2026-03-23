import { useState } from "react";
import { SignUpButton } from "@clerk/react";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  // Precios base (Mensuales)
  const priceEmprendedor = 399;
  const priceProfesional = 799;

  // Calculamos el 20% de descuento si es anual (y redondeamos)
  const displayEmprendedor = isAnnual
    ? Math.round(priceEmprendedor * 0.8)
    : priceEmprendedor;
  const displayProfesional = isAnnual
    ? Math.round(priceProfesional * 0.8)
    : priceProfesional;

  return (
    <section
      id="precios"
      className="bg-[#f9fafb] py-24 sm:py-32 transition-colors duration-500"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl transition-all duration-300">
            Planes diseñados para ti
          </h2>

          {/* Botón Toggle Funcional */}
          <div className="mt-8 flex items-center justify-center gap-x-4">
            <span
              className={`text-sm font-semibold transition-colors duration-300 ${!isAnnual ? "text-gray-900" : "text-gray-500"}`}
            >
              Mensual
            </span>

            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${isAnnual ? "bg-brand-600" : "bg-gray-300"}`}
              role="switch"
              aria-checked={isAnnual}
            >
              <span className="sr-only">Usar plan anual</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${isAnnual ? "translate-x-5" : "translate-x-0"}`}
              ></span>
            </button>

            <span
              className={`text-sm font-semibold transition-colors duration-300 ${isAnnual ? "text-gray-900" : "text-gray-500"}`}
            >
              Anual{" "}
              <span className="ml-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-brand-700 transition-all duration-300 hover:scale-105">
                -20%
              </span>
            </span>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12 items-center">
          {/* Plan 1 */}
          <div className="group rounded-3xl bg-white p-8 xl:p-10 shadow-sm ring-1 ring-gray-200 border border-gray-100 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:border-brand-200">
            <h3 className="text-lg font-semibold leading-8 text-gray-900">
              Emprendedor
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Ideal para empezar a organizar tu tiempo.
            </p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-gray-900 transition-all duration-500">
                ${displayEmprendedor}
              </span>
              <span className="text-sm font-semibold leading-6 text-gray-600">
                /mes
              </span>
            </p>
            {isAnnual && (
              <p className="text-xs text-brand-600 font-medium animate-pulse mt-1">
                Facturado anualmente (${displayEmprendedor * 12}/año)
              </p>
            )}
            <ul
              role="list"
              className="mt-8 space-y-3 text-sm leading-6 text-gray-600"
            >
              <li className="flex gap-x-3">
                <svg
                  className="h-6 w-5 flex-none text-brand-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                Hasta 100 citas mensuales
              </li>
              <li className="flex gap-x-3">
                <svg
                  className="h-6 w-5 flex-none text-brand-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                Recordatorios Email/SMS
              </li>
              <li className="flex gap-x-3">
                <svg
                  className="h-6 w-5 flex-none text-brand-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                Calendario personalizado
              </li>
            </ul>
            <SignUpButton mode="modal">
              <button className="mt-8 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-center text-sm font-semibold text-gray-900 shadow-sm transition-all duration-300 hover:bg-gray-50 hover:border-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer">
                Elegir plan
              </button>
            </SignUpButton>
          </div>

          {/* Plan 2 - Popular */}
          <div className="group relative rounded-3xl bg-white p-8 xl:p-10 shadow-xl ring-2 ring-brand-600 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute -top-4 inset-x-0 mx-auto w-fit rounded-full bg-brand-600 px-4 py-1 text-xs font-bold text-white uppercase tracking-wide shadow-sm">
              POPULAR
            </div>
            <h3 className="text-lg font-semibold leading-8 text-gray-900">
              Profesional
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Para negocios en crecimiento.
            </p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-gray-900 transition-all duration-500">
                ${displayProfesional}
              </span>
              <span className="text-sm font-semibold leading-6 text-gray-600">
                /mes
              </span>
            </p>
            {isAnnual && (
              <p className="text-xs text-brand-600 font-medium animate-pulse mt-1">
                Facturado anualmente (${displayProfesional * 12}/año)
              </p>
            )}
            <ul
              role="list"
              className="mt-8 space-y-3 text-sm leading-6 text-gray-600"
            >
              <li className="flex gap-x-3">
                <svg
                  className="h-6 w-5 flex-none text-brand-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                Citas Ilimitadas
              </li>
              <li className="flex gap-x-3">
                <svg
                  className="h-6 w-5 flex-none text-brand-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                WhatsApp ilimitado
              </li>
              <li className="flex gap-x-3">
                <svg
                  className="h-6 w-5 flex-none text-brand-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                Integración de pagos
              </li>
              <li className="flex gap-x-3">
                <svg
                  className="h-6 w-5 flex-none text-brand-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                Analítica avanzada
              </li>
            </ul>
            <SignUpButton mode="modal">
              <button className="mt-8 w-full rounded-xl bg-brand-600 px-3 py-3 text-center text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-brand-700 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 cursor-pointer">
                Elegir Pro
              </button>
            </SignUpButton>
          </div>
        </div>
      </div>
    </section>
  );
}
