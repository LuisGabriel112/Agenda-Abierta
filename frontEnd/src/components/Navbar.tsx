import { useNavigate } from "react-router-dom";
import { SignInButton, UserButton, useAuth } from "@clerk/react";

export default function Navbar() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
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

        {/* Links (Hidden on mobile for simplicity, but flex on desktop) */}
        <div className="hidden md:flex items-center gap-x-8">
          <a
            href="#beneficios"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Beneficios
          </a>
          <a
            href="#precios"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Precios
          </a>
          <a
            href="#"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Próximamente
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-x-4">
          {isSignedIn ? (
            <>
              {/* Si está logueado, mostramos el UserButton de Clerk y un botón rápido para ir al Dashboard */}
              <button
                onClick={() => navigate("/dashboard")}
                className="hidden sm:block text-sm font-bold text-brand-600 hover:text-brand-800 transition-colors mr-2 cursor-pointer"
              >
                Ir al Panel
              </button>
              <UserButton />
            </>
          ) : (
            <>
              {/* Si NO está logueado, mostramos el modal de Clerk con el estilo de tu botón original */}
              <SignInButton mode="modal">
                <button className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all cursor-pointer">
                  Iniciar Sesión
                </button>
              </SignInButton>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
