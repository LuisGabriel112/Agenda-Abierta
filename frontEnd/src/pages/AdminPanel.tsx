import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE as string;
const ADMIN_ID = import.meta.env.VITE_ADMIN_CLERK_USER_ID as string;

interface Stats {
  total_negocios: number;
  negocios_activos: number;
  con_suscripcion: number;
  citas_mes: number;
  ingresos_mes: number;
}

interface NegocioAdmin {
  id: string;
  nombre: string;
  slug: string;
  giro: string | null;
  email: string | null;
  activo: boolean;
  con_suscripcion: boolean;
  stripe_charges_enabled: boolean;
  total_citas: number;
  fecha_creacion: string;
}

export default function AdminPanel() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [negocios, setNegocios] = useState<NegocioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const headers = { "x-clerk-user-id": user?.id ?? "" };

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      navigate("/", { replace: true });
      return;
    }
    if (user.id !== ADMIN_ID) {
      navigate("/dashboard", { replace: true });
      return;
    }
    Promise.all([
      fetch(`${API_BASE}/api/admin/stats`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/api/admin/negocios`, { headers }).then((r) => r.json()),
    ])
      .then(([s, n]) => {
        setStats(s);
        setNegocios(n);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isLoaded, user]);

  const toggleActivo = async (id: string) => {
    const res = await fetch(`${API_BASE}/api/admin/negocio/${id}/activo`, {
      method: "PATCH",
      headers,
    });
    if (res.ok) {
      const data = await res.json();
      setNegocios((prev) =>
        prev.map((n) => (n.id === id ? { ...n, activo: data.activo } : n))
      );
    }
  };

  const filtered = negocios.filter(
    (n) =>
      n.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (n.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (n.giro ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f6]">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6] font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Panel de Administración</h1>
            <p className="text-xs text-gray-500">AgendaAbierta Platform</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Dashboard
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Total negocios" value={stats.total_negocios} color="blue" />
            <StatCard label="Negocios activos" value={stats.negocios_activos} color="green" />
            <StatCard label="Con suscripción" value={stats.con_suscripcion} color="purple" />
            <StatCard label="Citas este mes" value={stats.citas_mes} color="orange" />
            <StatCard
              label="Ingresos este mes"
              value={`$${stats.ingresos_mes.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
              color="green"
            />
          </div>
        )}

        {/* Tabla de negocios */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Negocios registrados
              <span className="ml-2 text-xs font-normal text-gray-400">{filtered.length} de {negocios.length}</span>
            </h2>
            <input
              type="text"
              placeholder="Buscar por nombre, email o giro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3 text-left">Negocio</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Giro</th>
                  <th className="px-4 py-3 text-center">Citas</th>
                  <th className="px-4 py-3 text-center">Suscripción</th>
                  <th className="px-4 py-3 text-center">Pagos online</th>
                  <th className="px-4 py-3 text-left">Registro</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((n) => (
                  <tr key={n.id} className={`hover:bg-gray-50 transition-colors ${!n.activo ? "opacity-50" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{n.nombre}</div>
                      <div className="text-xs text-gray-400">/{n.slug}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{n.email ?? "—"}</td>
                    <td className="px-4 py-4 text-gray-600">{n.giro ?? "—"}</td>
                    <td className="px-4 py-4 text-center font-medium">{n.total_citas}</td>
                    <td className="px-4 py-4 text-center">
                      <Badge active={n.con_suscripcion} label={n.con_suscripcion ? "Activa" : "Sin plan"} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge active={n.stripe_charges_enabled} label={n.stripe_charges_enabled ? "Listo" : "No"} />
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(n.fecha_creacion).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggleActivo(n.id)}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                          n.activo
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {n.activo ? "Suspender" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-400">
                      No se encontraron negocios
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colors[color] ?? "text-slate-800"}`}>{value}</p>
    </div>
  );
}

function Badge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
    }`}>
      {label}
    </span>
  );
}
