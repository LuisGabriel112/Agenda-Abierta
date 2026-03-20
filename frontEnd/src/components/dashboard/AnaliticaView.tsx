import { useState, useEffect, useCallback } from "react";
import { useApi, AnaliticaData } from "../../hooks/useApi";
import { useNegocio } from "../../hooks/useNegocio";

function Avatar({ nombre }: { nombre: string }) {
  const initials = nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colors = [
    "bg-green-100 text-green-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-yellow-100 text-yellow-700",
    "bg-pink-100 text-pink-700",
  ];
  const color = colors[nombre.charCodeAt(0) % colors.length];
  return (
    <div
      className={`w-8 h-8 ${color} rounded-full flex items-center justify-center text-xs font-bold shrink-0`}
    >
      {initials}
    </div>
  );
}

function BarChart({ data }: { data: { mes: string; total: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-end gap-1 h-10">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-100 rounded-sm"
            style={{ height: "8px" }}
          />
        ))}
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.total), 1);
  const MAX_H = 40;
  return (
    <div className="flex items-end gap-1" style={{ height: `${MAX_H}px` }}>
      {data.slice(-7).map((d, i, arr) => (
        <div
          key={d.mes}
          title={`${d.mes}: ${d.total} citas`}
          className={`flex-1 rounded-sm ${i === arr.length - 1 ? "bg-green-600" : "bg-green-200"}`}
          style={{ height: `${Math.max((d.total / max) * MAX_H, 4)}px` }}
        />
      ))}
    </div>
  );
}

function LineChart({ data }: { data: { mes: string; total: number }[] }) {
  const W = 600;
  const H = 160;
  const PAD = 20;

  if (data.length < 2) {
    // flat line placeholder
    return (
      <svg
        viewBox={`0 0 ${W} ${H + 30}`}
        className="w-full"
        style={{ height: "180px" }}
        preserveAspectRatio="none"
      >
        <path
          d={`M${PAD},${H / 2} L${W - PAD},${H / 2}`}
          fill="none"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const max = Math.max(...data.map((d) => d.total), 1);
  const xs = data.map((_, i) => PAD + (i / (data.length - 1)) * (W - PAD * 2));
  const ys = data.map((d) => H - PAD - (d.total / max) * (H - PAD * 2));

  const pathD = xs
    .map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`)
    .join(" ");
  const areaD = `${pathD} L${xs[xs.length - 1].toFixed(1)},${H - PAD} L${xs[0].toFixed(1)},${H - PAD} Z`;

  // find peak index
  const peakIdx = data.reduce(
    (best, d, i) => (d.total > data[best].total ? i : best),
    0,
  );

  // x-axis labels — show up to 5 evenly spaced
  const labelIndices =
    data.length <= 5
      ? data.map((_, i) => i)
      : [
          0,
          Math.floor(data.length / 4),
          Math.floor(data.length / 2),
          Math.floor((3 * data.length) / 4),
          data.length - 1,
        ];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H + 30}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height: "180px" }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaGradient)" />
        <path
          d={pathD}
          fill="none"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={xs[peakIdx]} cy={ys[peakIdx]} r="5" fill="#16a34a" />
        <circle
          cx={xs[peakIdx]}
          cy={ys[peakIdx]}
          r="9"
          fill="#16a34a"
          fillOpacity="0.15"
        />
        {labelIndices.map((idx) => (
          <text
            key={idx}
            x={xs[idx]}
            y={H + 20}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize="11"
          >
            {data[idx].mes}
          </text>
        ))}
      </svg>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  children,
}: {
  label: string;
  value: string;
  change?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        {change && (
          <span className="flex items-center gap-1 text-xs font-bold text-green-600">
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            {change}
          </span>
        )}
      </div>
      <p className="text-3xl font-extrabold text-gray-900 mb-3">{value}</p>
      {children}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50 space-y-6">
      <div className="h-8 bg-gray-200 rounded-xl w-48 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-36 animate-pulse"
          >
            <div className="h-4 bg-gray-100 rounded w-3/4 mb-4" />
            <div className="h-8 bg-gray-100 rounded w-1/2 mb-3" />
            <div className="h-8 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-64 animate-pulse" />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-48 animate-pulse" />
    </div>
  );
}

export default function AnaliticaView() {
  const { negocioId } = useNegocio();
  const api = useApi(negocioId);

  const [data, setData] = useState<AnaliticaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periodo, setPeriodo] = useState("Todo");

  const fetchData = useCallback(async () => {
    if (!negocioId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await api.getAnalitica();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar analítica");
    } finally {
      setLoading(false);
    }
  }, [negocioId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 text-sm font-medium mb-3">{error}</p>
          <button
            onClick={fetchData}
            className="text-green-600 text-sm font-semibold hover:underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Filter citas_por_mes based on selected period
  const filteredMeses = (() => {
    const all = data.citas_por_mes;
    if (periodo === "30 Días") return all.slice(-1);
    if (periodo === "90 Días") return all.slice(-3);
    return all;
  })();

  const isEmpty =
    data.total_citas === 0 &&
    data.total_clientes === 0 &&
    parseFloat(data.ingresos_totales.replace(/[$,]/g, "")) === 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analítica</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitorea el desempeño y crecimiento de tu negocio.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Actualizar
        </button>
      </div>

      {isEmpty ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            Sin datos todavía
          </h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Una vez que registres clientes y citas completadas, aquí verás tus
            métricas de negocio.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard label="Ingresos Totales" value={data.ingresos_totales}>
              <svg viewBox="0 0 120 30" className="w-full h-8">
                <path
                  d={
                    data.citas_por_mes.length >= 2
                      ? data.citas_por_mes
                          .slice(-7)
                          .map((d, i, arr) => {
                            const max = Math.max(...arr.map((x) => x.total), 1);
                            const x = (i / (arr.length - 1)) * 120;
                            const y = 28 - (d.total / max) * 24;
                            return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
                          })
                          .join(" ")
                      : "M0,20 L120,20"
                  }
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </StatCard>

            <StatCard label="Citas Totales" value={String(data.total_citas)}>
              <BarChart data={data.citas_por_mes} />
            </StatCard>

            <StatCard
              label="Clientes Registrados"
              value={String(data.total_clientes)}
            >
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1">
                <div
                  className="bg-green-600 h-2.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min((data.total_clientes / Math.max(data.total_clientes, 10)) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                Total acumulado
              </p>
            </StatCard>
          </div>

          {/* Tendencias de Citas */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Tendencias de Citas
                </h2>
                <p className="text-sm text-gray-600 font-semibold mt-0.5">
                  {data.total_citas} citas en total
                </p>
              </div>
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                {["30 Días", "90 Días", "Todo"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriodo(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      periodo === p
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {filteredMeses.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                Sin datos para este período
              </div>
            ) : (
              <LineChart data={filteredMeses} />
            )}
          </div>

          {/* Transacciones Recientes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">
                Transacciones Recientes
              </h2>
              <span className="text-xs text-gray-400">
                Últimas {data.transacciones_recientes.length} completadas
              </span>
            </div>

            {data.transacciones_recientes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">
                  No hay transacciones completadas aún.
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Las citas marcadas como "Completada" aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Cliente", "Servicio", "Fecha", "Monto"].map((h) => (
                        <th
                          key={h}
                          className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3 pr-6"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.transacciones_recientes.map((t, i) => (
                      <tr
                        key={i}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="py-3.5 pr-6">
                          <div className="flex items-center gap-2.5">
                            <Avatar nombre={t.cliente_nombre} />
                            <span className="text-sm font-semibold text-gray-800">
                              {t.cliente_nombre}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 pr-6">
                          <span className="text-sm text-gray-600">
                            {t.servicio_nombre}
                          </span>
                        </td>
                        <td className="py-3.5 pr-6">
                          <span className="text-sm text-gray-500">
                            {t.fecha}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className="text-sm font-bold text-gray-900">
                            {t.monto}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
