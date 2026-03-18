import { useState } from "react";

interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  ubicacion: string;
  totalCitas: number;
  totalGastado: string;
  ticketPromedio: string;
  estado: "Activo" | "Inactivo";
  tags: string[];
  verificado: boolean;
  historial: Visita[];
  notas: Nota[];
}

interface Visita {
  fecha: string;
  servicio: string;
  especialista: string;
  inicialesEsp: string;
  monto: string;
  estado: "Completado" | "Cancelado";
}

interface Nota {
  fecha: string;
  autor: string;
  texto: string;
  tipo: "manual" | "sistema";
}

const CLIENTES: Cliente[] = [
  {
    id: 1,
    nombre: "Alex Rivera",
    email: "alex.rivera@email.com",
    telefono: "+52 55 1234 5678",
    ubicacion: "CDMX, México",
    totalCitas: 8,
    totalGastado: "$12,450.00",
    ticketPromedio: "$1,556 MXN",
    estado: "Activo",
    tags: ["Fiel", "Cancelador frecuente"],
    verificado: true,
    historial: [
      {
        fecha: "12 Dic 2023 10:30 AM",
        servicio: "Corte de Cabello Premium",
        especialista: "Carlos C.",
        inicialesEsp: "CC",
        monto: "$1,200.00",
        estado: "Completado",
      },
      {
        fecha: "15 Nov 2023 04:00 PM",
        servicio: "Diseño de Barba + Facial",
        especialista: "Ana R.",
        inicialesEsp: "AR",
        monto: "$1,850.00",
        estado: "Completado",
      },
      {
        fecha: "22 Oct 2023 11:00 AM",
        servicio: "Corte de Cabello Premium",
        especialista: "Carlos C.",
        inicialesEsp: "CC",
        monto: "$1,200.00",
        estado: "Cancelado",
      },
      {
        fecha: "05 Sep 2023 01:00 PM",
        servicio: "Tratamiento Capilar Deep",
        especialista: "Luis M.",
        inicialesEsp: "LM",
        monto: "$2,500.00",
        estado: "Completado",
      },
      {
        fecha: "18 Ago 2023 06:30 PM",
        servicio: "Corte Clásico",
        especialista: "Ana R.",
        inicialesEsp: "AR",
        monto: "$800.00",
        estado: "Completado",
      },
    ],
    notas: [
      {
        fecha: "15 Oct 2023 - Recepción",
        autor: "Recepción",
        texto:
          "Prefiere ser atendido por Carlos. Le gusta el café americano sin azúcar.",
        tipo: "manual",
      },
      {
        fecha: "02 Jun 2023 - Sistema",
        autor: "Sistema",
        texto:
          "El cliente canceló dos veces en Mayo. Se requiere confirmación telefónica previa.",
        tipo: "sistema",
      },
    ],
  },
  {
    id: 2,
    nombre: "Beatriz Suarez",
    email: "beatriz.s@gmail.com",
    telefono: "+52 55 9876 5432",
    ubicacion: "Guadalajara, México",
    totalCitas: 12,
    totalGastado: "$18,900.00",
    ticketPromedio: "$1,575 MXN",
    estado: "Activo",
    tags: ["Fiel"],
    verificado: true,
    historial: [
      {
        fecha: "10 Dic 2023 11:30 AM",
        servicio: "Extracción Molar",
        especialista: "Dr. Ruíz",
        inicialesEsp: "DR",
        monto: "$3,200.00",
        estado: "Completado",
      },
      {
        fecha: "20 Nov 2023 09:00 AM",
        servicio: "Limpieza Dental",
        especialista: "Ana R.",
        inicialesEsp: "AR",
        monto: "$850.00",
        estado: "Completado",
      },
    ],
    notas: [
      {
        fecha: "10 Dic 2023 - Recepción",
        autor: "Recepción",
        texto: "Paciente puntual, siempre llega 10 minutos antes.",
        tipo: "manual",
      },
    ],
  },
  {
    id: 3,
    nombre: "Carlos Ruíz",
    email: "carlos.ruiz@outlook.com",
    telefono: "+52 33 4567 8901",
    ubicacion: "Monterrey, México",
    totalCitas: 5,
    totalGastado: "$7,250.00",
    ticketPromedio: "$1,450 MXN",
    estado: "Activo",
    tags: [],
    verificado: false,
    historial: [
      {
        fecha: "12 Dic 2023 12:00 PM",
        servicio: "Ortodoncia",
        especialista: "Dr. López",
        inicialesEsp: "DL",
        monto: "$2,500.00",
        estado: "Completado",
      },
    ],
    notas: [],
  },
  {
    id: 4,
    nombre: "María González",
    email: "maria.g@empresa.com",
    telefono: "+52 55 2233 4455",
    ubicacion: "CDMX, México",
    totalCitas: 3,
    totalGastado: "$3,600.00",
    ticketPromedio: "$1,200 MXN",
    estado: "Inactivo",
    tags: [],
    verificado: false,
    historial: [
      {
        fecha: "05 Oct 2023 03:00 PM",
        servicio: "Consulta General",
        especialista: "Ana R.",
        inicialesEsp: "AR",
        monto: "$1,200.00",
        estado: "Completado",
      },
    ],
    notas: [],
  },
];

function Avatar({
  nombre,
  size = "md",
}: {
  nombre: string;
  size?: "sm" | "md" | "lg";
}) {
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
  const sizeClass =
    size === "sm"
      ? "w-7 h-7 text-xs"
      : size === "lg"
        ? "w-16 h-16 text-xl"
        : "w-9 h-9 text-sm";
  return (
    <div
      className={`${sizeClass} ${color} rounded-full flex items-center justify-center font-bold shrink-0`}
    >
      {initials}
    </div>
  );
}

export default function ClientesView() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [showNuevaCita, setShowNuevaCita] = useState(false);

  const filtered = CLIENTES.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Lista de Clientes */}
      <div
        className={`flex flex-col ${selected ? "w-80 shrink-0 border-r border-gray-100" : "flex-1"} bg-gray-50 overflow-hidden transition-all`}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {CLIENTES.length} clientes registrados
              </p>
            </div>
            <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {!selected && "Nuevo Cliente"}
            </button>
          </div>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.map((cliente) => (
            <div
              key={cliente.id}
              onClick={() => setSelected(cliente)}
              className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all hover:border-green-300 hover:shadow-sm ${
                selected?.id === cliente.id
                  ? "border-green-400 shadow-sm ring-1 ring-green-200"
                  : "border-gray-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar nombre={cliente.nombre} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {cliente.nombre}
                    </p>
                    {cliente.verificado && (
                      <svg
                        className="w-4 h-4 text-green-500 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {cliente.email}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-600">
                      {cliente.totalCitas} citas
                    </span>
                    <span className="text-xs font-semibold text-green-700">
                      {cliente.totalGastado} MXN
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cliente.estado === "Activo"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {cliente.estado}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detalle del Cliente */}
      {selected && (
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Breadcrumb */}
          <div className="px-6 pt-5 pb-2 flex items-center gap-2 text-sm">
            <button
              onClick={() => setSelected(null)}
              className="text-green-600 hover:underline font-medium"
            >
              Clientes
            </button>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-gray-700 font-medium">{selected.nombre}</span>
          </div>

          <div className="px-6 pb-8 space-y-5">
            {/* Header Cliente */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Avatar nombre={selected.nombre} size="lg" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-extrabold text-gray-900">
                        {selected.nombre}
                      </h2>
                      {selected.verificado && (
                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-wide">
                          Verificado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Cliente frecuente • Desde enero 2023
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {selected.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            tag === "Fiel"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          {tag === "Fiel" ? "⭐ " : "📅 "}
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
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
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => setShowNuevaCita(true)}
                    className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Nueva Cita
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Columna izquierda */}
              <div className="space-y-4">
                {/* Contacto */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-7 w-7 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      Información de Contacto
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-4 h-4 text-green-500 mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                          Email
                        </p>
                        <p className="text-sm text-gray-700">
                          {selected.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-4 h-4 text-green-500 mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                          Teléfono
                        </p>
                        <p className="text-sm text-gray-700">
                          {selected.telefono}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-4 h-4 text-green-500 mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                          Ubicación
                        </p>
                        <p className="text-sm text-gray-700">
                          {selected.ubicacion}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resumen Financiero */}
                <div className="bg-green-700 rounded-2xl p-5 text-white shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-4 h-4 text-green-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <h3 className="font-bold text-sm text-green-100">
                      Resumen Financiero
                    </h3>
                  </div>
                  <p className="text-xs text-green-300 mb-1">Total gastado</p>
                  <p className="text-2xl font-extrabold mb-4">
                    {selected.totalGastado} MXN
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-600/40 rounded-xl p-2.5">
                      <p className="text-[10px] text-green-300 font-semibold">
                        Ticket promedio
                      </p>
                      <p className="text-sm font-bold mt-0.5">
                        {selected.ticketPromedio}
                      </p>
                    </div>
                    <div className="bg-green-600/40 rounded-xl p-2.5">
                      <p className="text-[10px] text-green-300 font-semibold">
                        Citas totales
                      </p>
                      <p className="text-sm font-bold mt-0.5">
                        {selected.totalCitas}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notas Internas */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">
                        Notas Internas
                      </h3>
                    </div>
                    <button className="text-xs text-green-600 font-semibold hover:underline">
                      Añadir
                    </button>
                  </div>
                  {selected.notas.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">
                      Sin notas aún
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selected.notas.map((nota, i) => (
                        <div
                          key={i}
                          className={`rounded-xl p-3 border-l-4 ${
                            nota.tipo === "manual"
                              ? "bg-yellow-50 border-yellow-400"
                              : "bg-gray-50 border-gray-300"
                          }`}
                        >
                          <p className="text-[10px] font-bold text-gray-500 mb-1">
                            {nota.fecha}
                          </p>
                          <p className="text-xs text-gray-700 leading-relaxed italic">
                            "{nota.texto}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Columna derecha - Historial */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">
                        Historial de Visitas
                      </h3>
                    </div>
                    <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-green-500">
                      <option>Todos los servicios</option>
                      <option>Corte de Cabello</option>
                      <option>Tratamientos</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {[
                            "Fecha",
                            "Servicio",
                            "Especialista",
                            "Monto",
                            "Estado",
                          ].map((h) => (
                            <th
                              key={h}
                              className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3 pr-4"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selected.historial.map((v, i) => (
                          <tr
                            key={i}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="py-3 pr-4">
                              <p className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                                {v.fecha.split(" ").slice(0, 3).join(" ")}
                              </p>
                              <p className="text-xs text-gray-400">
                                {v.fecha.split(" ").slice(3).join(" ")}
                              </p>
                            </td>
                            <td className="py-3 pr-4">
                              <p className="text-xs font-medium text-gray-800">
                                {v.servicio}
                              </p>
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">
                                  {v.inicialesEsp}
                                </div>
                                <span className="text-xs text-gray-600 whitespace-nowrap">
                                  {v.especialista}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className={`text-xs font-semibold ${v.estado === "Cancelado" ? "text-gray-400 line-through" : "text-gray-800"}`}
                              >
                                {v.monto}
                              </span>
                            </td>
                            <td className="py-3">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                  v.estado === "Completado"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                {v.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button className="mt-4 text-xs text-green-600 font-semibold flex items-center gap-1 hover:underline">
                    Ver historial completo
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Re-agendar */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        ¿Re-agendar próxima visita?
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selected.nombre.split(" ")[0]} suele venir cada 3-4
                        semanas. Su última visita fue hace 15 días.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNuevaCita(true)}
                    className="shrink-0 bg-green-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap"
                  >
                    Agendar Cita Manual
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Cita */}
      {showNuevaCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-green-100 rounded-xl flex items-center justify-center">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Nueva Cita{selected ? ` — ${selected.nombre}` : ""}
                </h2>
              </div>
              <button
                onClick={() => setShowNuevaCita(false)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Nombre del cliente
                  </label>
                  <input
                    defaultValue={selected?.nombre ?? ""}
                    placeholder="Ej. María García"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Teléfono
                  </label>
                  <input
                    defaultValue={selected?.telefono ?? ""}
                    placeholder="+52 55 0000 0000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Servicio
                </label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Selecciona un servicio</option>
                  <option>Consulta General</option>
                  <option>Corte de Cabello</option>
                  <option>Limpieza Dental</option>
                  <option>Masaje</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Fecha
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Hora
                  </label>
                  <input
                    type="time"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Notas{" "}
                  <span className="font-normal text-gray-400">(Opcional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej. Cliente prefiere atención rápida..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowNuevaCita(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowNuevaCita(false)}
                className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors text-sm shadow-lg shadow-green-600/20"
              >
                Guardar Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
