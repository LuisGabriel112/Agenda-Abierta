import { useState, useCallback, useEffect, useRef } from "react";
import { UserButton, useUser, useClerk } from "@clerk/react";
import DashboardHome from "../components/dashboard/DashboardHome";
import CalendarioView from "../components/dashboard/CalendarioView";
import ClientesView from "../components/dashboard/ClientesView";
import AnaliticaView from "../components/dashboard/AnaliticaView";
import ConfiguracionView from "../components/dashboard/ConfiguracionView";
import ServiciosView from "../components/dashboard/ServiciosView";
import EmpleadosView from "../components/dashboard/EmpleadosView";
import { useNegocio } from "../hooks/useNegocio";
import { useApi, CitaItem } from "../hooks/useApi";
import { useDarkMode } from "../hooks/useDarkMode";

const SUPPORT_WHATSAPP = import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined;

type Section =
  | "dashboard"
  | "calendario"
  | "clientes"
  | "servicios"
  | "equipo"
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
    id: "servicios",
    label: "Servicios",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
      />
    ),
  },
  {
    id: "equipo",
    label: "Equipo",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
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
  const { dashboardData, isLoadingDashboard, updateNegocio, negocioId, refetchDashboard, tieneSuscripcion, negocioActivo } = useNegocio();
  const { updateHorarios, getCitas } = useApi(negocioId);
  const { dark, toggle: toggleDark } = useDarkMode();

  // ── Notificaciones: citas pendientes ─────────────────────────────────────
  const [citasHoy, setCitasHoy] = useState<CitaItem[]>([]);
  const [citaAAbrir, setCitaAAbrir] = useState<CitaItem | null>(null);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("notif_read_ids");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  });

  const markRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("notif_read_ids", JSON.stringify([...next]));
      return next;
    });
  };

  const fetchCitasHoy = useCallback(() => {
    if (!negocioId) return;
    const desde = new Date();
    desde.setDate(desde.getDate() - 7);
    const pad = (n: number) => String(n).padStart(2, "0");
    const isoDesde = `${desde.getFullYear()}-${pad(desde.getMonth() + 1)}-${pad(desde.getDate())}T00:00:00`;
    getCitas({ fecha_inicio: isoDesde })
      .then((citas) => setCitasHoy(citas.filter((c) => c.estado === "PENDIENTE" || c.estado === "CONFIRMADA")))
      .catch(() => {});
  }, [negocioId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCitasHoy();
    const interval = setInterval(fetchCitasHoy, 30_000);
    return () => clearInterval(interval);
  }, [fetchCitasHoy]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    if (showNotif) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotif]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe_connected") === "1") {
      refetchDashboard().then(() => {
        setActive("configuracion");
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("stripe_refresh") === "1") {
      const negocioParam = params.get("negocio");
      if (negocioParam) {
        fetch(`${import.meta.env.VITE_API_BASE}/api/negocio/${negocioParam}/stripe-connect/onboard`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
          .then((r) => r.json())
          .then((d) => { if (d.url) window.location.href = d.url; })
          .catch(() => setActive("configuracion"));
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refetchDashboard]);

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = useCallback(
    (section: "servicios" | "configuracion" | "calendario") => {
      setActive(section);
    },
    [],
  );

  if (!negocioActivo || !tieneSuscripcion) {
    return (
      <div className="min-h-screen bg-[#f4f7f6] dark:bg-gray-950 flex items-center justify-center font-sans">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-10 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {!negocioActivo ? "Cuenta suspendida" : "Suscripción cancelada"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {!negocioActivo
              ? "Tu cuenta ha sido suspendida. Contacta a soporte para más información."
              : "Tu suscripción fue cancelada. Para seguir usando AgendaAbierta necesitas reactivar tu plan."}
          </p>
          <button
            onClick={() => signOut()}
            className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 underline"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  const sidebarNav = (onItemClick: () => void) => (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => { setActive(item.id); onItemClick(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors text-left ${
              isActive
                ? "bg-green-600 text-white shadow-sm shadow-green-600/20"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <svg className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400 dark:text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {item.icon}
            </svg>
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f4f7f6] dark:bg-gray-950 font-sans flex text-slate-900 dark:text-slate-100">
      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#f4f7f6] dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 dark:border-gray-800">
            <div
              className="flex items-center gap-x-2 cursor-pointer"
              onClick={() => { setActive("dashboard"); setMobileOpen(false); }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/30">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">AgendaAbierta</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-4 mt-8">
            <p className="px-2 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2">Menú Principal</p>
            {sidebarNav(() => setMobileOpen(false))}
          </div>
        </div>

        <div className="p-4 mb-4 space-y-3">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── Sidebar (desktop) ── */}
      <aside className="w-64 bg-[#f4f7f6] dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col justify-between sticky top-0 h-screen shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-transparent mt-2">
            <div
              className="flex items-center gap-x-2 cursor-pointer"
              onClick={() => setActive("dashboard")}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/30">
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
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                AgendaAbierta
              </span>
            </div>
          </div>

          {/* Nav */}
          <div className="px-4 mt-8">
            <p className="px-2 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2">
              Menú Principal
            </p>
            {sidebarNav(() => {})}
          </div>
        </div>

        {/* Bottom: Soporte + Cerrar Sesión */}
        <div className="p-4 mb-4 space-y-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-100/50 dark:border-green-800/30">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
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
              <h4 className="font-bold text-green-900 dark:text-green-300 text-sm">Soporte VIP</h4>
            </div>
            <p className="text-xs text-green-800/70 dark:text-green-400/70 mb-4 leading-relaxed">
              ¿Necesitas ayuda configurando tu negocio?
            </p>
            {SUPPORT_WHATSAPP ? (
              <a
                href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 font-bold text-xs py-2.5 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
              >
                Chatear ahora
              </a>
            ) : (
              <button className="w-full bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 font-bold text-xs py-2.5 rounded-xl shadow-sm opacity-50 cursor-not-allowed">
                Chatear ahora
              </button>
            )}
          </div>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
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
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden pb-16 md:pb-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-30">
          {/* Left: hamburger (mobile) + page title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-sm font-semibold text-gray-500 dark:text-gray-400 capitalize hidden sm:block">
              {NAV_ITEMS.find((n) => n.id === active)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Plan badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-xs font-bold">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Plan Pro
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className="h-9 w-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
            >
              {dark ? (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotif((v) => !v)}
                className="relative h-9 w-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {(() => { const unread = citasHoy.filter((c) => !readIds.has(c.id)).length; return unread > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null; })()}
              </button>

              {showNotif && (
                <div className="absolute right-0 top-11 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Próximas citas</span>
                    {citasHoy.some((c) => !readIds.has(c.id)) && (
                      <button
                        onClick={() => citasHoy.forEach((c) => markRead(c.id))}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  {citasHoy.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">Sin próximas citas pendientes</div>
                  ) : (
                    <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
                      {citasHoy.map((c) => {
                        const dt = new Date(c.hora_inicio);
                        const esHoy = dt.toDateString() === new Date().toDateString();
                        const fechaStr = esHoy
                          ? `Hoy ${dt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`
                          : dt.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" }) + " · " + dt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
                        const isUnread = !readIds.has(c.id);
                        const estadoColor: Record<string, string> = {
                          PENDIENTE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                          CONFIRMADA: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        };
                        return (
                          <li
                            key={c.id}
                            className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${isUnread ? "bg-green-50/40 dark:bg-green-900/10" : ""}`}
                            onClick={() => {
                              markRead(c.id);
                              setCitaAAbrir(c);
                              setActive("calendario");
                              setShowNotif(false);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1" />}
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{c.cliente_nombre}</span>
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${estadoColor[c.estado] ?? "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}>
                                {c.estado}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate ml-3">{c.servicio_nombre} · {c.empleado_nombre}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 ml-3">{fechaStr}</div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => { setActive("calendario"); setShowNotif(false); }}
                      className="text-xs text-green-600 dark:text-green-400 font-semibold hover:underline"
                    >
                      Ver calendario completo →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings shortcut */}
            <button
              onClick={() => setActive("configuracion")}
              className="h-9 w-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 pl-1 pr-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
              <UserButton />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:block">
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
              negocioSlug={dashboardData?.negocio.slug ?? null}
              totalCitas={dashboardData?.total_citas ?? 0}
              totalClientes={dashboardData?.total_clientes ?? 0}
              totalServicios={dashboardData?.servicios?.length ?? 0}
              tieneHorarios={(dashboardData?.horarios ?? []).some(
                (h) => !h.esta_cerrado,
              )}
              isLoading={isLoadingDashboard}
              onNavigate={handleNavigate}
            />
          )}
          {active === "calendario" && <CalendarioView onCitaCreada={fetchCitasHoy} citaAAbrir={citaAAbrir} />}
          {active === "clientes" && <ClientesView />}
          {active === "servicios" && <ServiciosView onDataChanged={refetchDashboard} />}
          {active === "equipo" && <EmpleadosView />}
          {active === "analitica" && <AnaliticaView />}
          {active === "configuracion" && (
            <ConfiguracionView
              negocio={dashboardData?.negocio ?? null}
              negocioId={negocioId}
              horarios={dashboardData?.horarios ?? []}
              isLoading={isLoadingDashboard}
              onSave={updateNegocio}
              onSaveHorarios={updateHorarios}
              onDataChanged={refetchDashboard}
            />
          )}
        </div>
      </main>

      {/* ── Bottom Nav (móvil) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex md:hidden">
        {([
          { id: "dashboard", label: "Inicio", path: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
          { id: "calendario", label: "Citas", path: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
          { id: "clientes", label: "Clientes", path: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
          { id: "servicios", label: "Servicios", path: "M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" },
          { id: "configuracion", label: "Config", path: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
        ] as { id: Section; label: string; path: string }[]).map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${isActive ? "text-green-600" : "text-gray-400 dark:text-gray-500"}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.path} />
              </svg>
              <span className="text-[10px] font-semibold">{item.label}</span>
              {isActive && <div className="absolute bottom-0 w-8 h-0.5 bg-green-600 rounded-t-full" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
