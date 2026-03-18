import { useState } from "react";
import { UserButton, useUser, useClerk } from "@clerk/react";
import DashboardHome from "../components/dashboard/DashboardHome";
import CalendarioView from "../components/dashboard/CalendarioView";
import ClientesView from "../components/dashboard/ClientesView";
import AnaliticaView from "../components/dashboard/AnaliticaView";
import ConfiguracionView from "../components/dashboard/ConfiguracionView";
import { useNegocio } from "../hooks/useNegocio";

type Section =
  | "dashboard"
  | "calendario"
  | "clientes"
  | "analitica"
  | "configuracion";

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    ),
  },
  {
    id: "calendario",
    label: "Calendario",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    ),
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    ),
  },
  {
    id: "analitica",
    label: "Analítica",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
  },
  {
    id: "configuracion",
    label: "Configuración",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
    ),
  },
];

export default function Dashboard() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [active, setActive] = useState<Section>("dashboard");
  const { dashboardData, isLoadingDashboard, updateNegocio } = useNegocio();

  return (
    <div className="min-h-screen bg-[#f4f7f6] font-sans flex text-slate-900">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-[#f4f7f6] border-r border-gray-200 hidden md:flex flex-col justify-between sticky top-0 h-screen shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-transparent mt-2">
            <div
              className="flex items-center gap-x-2 cursor-pointer"
              onClick={() => setActive("dashboard")}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                <svg
                  className="h-5 w-5 text-green-600"
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
          </div>

          {/* Nav */}
          <div className="px-4 mt-8">
            <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Menú Principal
            </p>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActive(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors text-left ${
                      isActive
                        ? "bg-green-600 text-white shadow-sm shadow-green-600/20"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      {item.icon}
                    </svg>
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom: Soporte + Cerrar Sesión */}
        <div className="p-4 mb-4 space-y-3">
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100/50">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <h4 className="font-bold text-green-900 text-sm">Soporte VIP</h4>
            </div>
            <p className="text-xs text-green-800/70 mb-4 leading-relaxed">
              ¿Necesitas ayuda configurando tu negocio?
            </p>
            <button className="w-full bg-white text-green-700 font-bold text-xs py-2.5 rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
              Chatear ahora
            </button>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
          {/* Left: page title */}
          <h1 className="text-sm font-semibold text-gray-500 capitalize hidden sm:block">
            {NAV_ITEMS.find((n) => n.id === active)?.label}
          </h1>

          <div className="flex items-center gap-3 ml-auto">
            {/* Plan badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold">
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Plan Pro
            </div>

            {/* Notifications */}
            <button className="relative h-9 w-9 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>

            {/* Settings shortcut */}
            <button
              onClick={() => setActive("configuracion")}
              className="h-9 w-9 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* User */}
            <div className="flex items-center gap-2 bg-white pl-1 pr-3 py-1 rounded-full border border-gray-200 shadow-sm">
              <UserButton />
              <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                {user?.firstName ?? "Usuario"}
              </span>
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {active === "dashboard" && (
            <DashboardHome
              negocioNombre={dashboardData?.negocio.nombre ?? null}
              totalCitas={dashboardData?.total_citas ?? 0}
              totalClientes={dashboardData?.total_clientes ?? 0}
              isLoading={isLoadingDashboard}
            />
          )}
          {active === "calendario" && <CalendarioView />}
          {active === "clientes" && <ClientesView />}
          {active === "analitica" && <AnaliticaView />}
          {active === "configuracion" && (
            <ConfiguracionView
              negocio={dashboardData?.negocio ?? null}
              isLoading={isLoadingDashboard}
              onSave={updateNegocio}
            />
          )}
        </div>
      </main>
    </div>
  );
}
