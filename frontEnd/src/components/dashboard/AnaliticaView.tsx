import { useState } from "react";

const TRANSACCIONES = [
  {
    nombre: "Jane Doe",
    servicio: "Consulta General",
    fecha: "May 24, 2024",
    monto: "$120.00",
  },
  {
    nombre: "Mark Smith",
    servicio: "Terapia de Piel",
    fecha: "May 23, 2024",
    monto: "$245.00",
  },
  {
    nombre: "Lucia Blanco",
    servicio: "Masaje de Tejido Profundo",
    fecha: "May 23, 2024",
    monto: "$180.00",
  },
  {
    nombre: "Carlos Ruíz",
    servicio: "Ortodoncia",
    fecha: "May 22, 2024",
    monto: "$2,500.00",
  },
  {
    nombre: "Ana López",
    servicio: "Corte de Cabello Premium",
    fecha: "May 21, 2024",
    monto: "$1,200.00",
  },
];

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

// Simple SVG line chart — no external dependencies
function LineChart() {
  const points = [20, 55, 35, 70, 45, 80, 60, 90, 50, 95];
  const w = 600;
  const h = 160;
  const pad = 20;
  const xs = points.map(
    (_, i) => pad + (i / (points.length - 1)) * (w - pad * 2),
  );
  const ys = points.map((p) => h - pad - (p / 100) * (h - pad * 2));

  const pathD = xs
    .map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`)
    .join(" ");

  // Area fill
  const areaD = `${pathD} L${xs[xs.length - 1]},${h - pad} L${xs[0]},${h - pad} Z`;

  // Dots at peaks (max points)
  const peaks = [4, 7];

  const xLabels = ["MAY 01", "MAY 08", "MAY 15", "MAY 22", "MAY 30"];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${w} ${h + 30}`}
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
        {/* Area */}
        <path d={areaD} fill="url(#areaGradient)" />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Dots at peaks */}
        {peaks.map((i) => (
          <g key={i}>
            <circle cx={xs[i]} cy={ys[i]} r="5" fill="#16a34a" />
            <circle
              cx={xs[i]}
              cy={ys[i]}
              r="9"
              fill="#16a34a"
              fillOpacity="0.15"
            />
          </g>
        ))}
        {/* X axis labels */}
        {xLabels.map((label, i) => {
          const x = pad + (i / (xLabels.length - 1)) * (w - pad * 2);
          return (
            <text
              key={label}
              x={x}
              y={h + 20}
              textAnchor="middle"
              fill="#9ca3af"
              fontSize="11"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// Mini bar chart for citas card
function BarChart() {
  const bars = [30, 55, 45, 70, 60, 85, 75];
  const maxH = 40;
  return (
    <div className="flex items-end gap-1 h-10">
      {bars.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${i === bars.length - 2 ? "bg-green-600" : "bg-green-200"}`}
          style={{ height: `${(v / 100) * maxH}px` }}
        />
      ))}
    </div>
  );
}

export default function AnaliticaView() {
  const [periodo, setPeriodo] = useState("30 Días");

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analítica</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Monitorea el desempeño y crecimiento de tu negocio en todos los
          sectores.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Ingresos Totales */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600">
              Ingresos Totales
            </p>
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
              +12.5%
            </span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mb-3">
            $12,450.00
          </p>
          {/* Mini line */}
          <svg viewBox="0 0 120 30" className="w-full h-8">
            <path
              d="M0,25 L20,18 L40,22 L60,10 L80,15 L100,5 L120,8"
              fill="none"
              stroke="#16a34a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Citas Totales */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600">Citas Totales</p>
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
              +5.2%
            </span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mb-3">842</p>
          <BarChart />
        </div>

        {/* Tasa de Retención */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600">
              Tasa de Retención
            </p>
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
              +2.1%
            </span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mb-3">88%</p>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1">
            <div
              className="bg-green-600 h-2.5 rounded-full"
              style={{ width: "88%" }}
            />
          </div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
            Meta: 90%
          </p>
        </div>
      </div>

      {/* Tendencias de Ingresos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Tendencias de Ingresos
            </h2>
            <p className="text-sm text-gray-700 font-semibold mt-0.5">
              $12,450.00{" "}
              <span className="text-green-600 font-semibold text-xs">
                +12.5% vs mes anterior
              </span>
            </p>
          </div>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {["30 Días", "90 Días", "1 Año"].map((p) => (
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
        <LineChart />
      </div>

      {/* Transacciones Recientes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">
            Transacciones Recientes
          </h2>
          <button className="text-xs text-green-600 font-semibold hover:underline">
            Ver todo
          </button>
        </div>
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
              {TRANSACCIONES.map((t, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 pr-6">
                    <div className="flex items-center gap-2.5">
                      <Avatar nombre={t.nombre} />
                      <span className="text-sm font-semibold text-gray-800">
                        {t.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-6">
                    <span className="text-sm text-gray-600">{t.servicio}</span>
                  </td>
                  <td className="py-3.5 pr-6">
                    <span className="text-sm text-gray-500">{t.fecha}</span>
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
      </div>
    </div>
  );
}
