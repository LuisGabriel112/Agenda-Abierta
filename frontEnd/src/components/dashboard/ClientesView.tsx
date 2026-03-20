import { useState, useEffect, useCallback } from "react";
import { useApi, ClienteListItem, ClienteDetalle } from "../../hooks/useApi";
import { useNegocio } from "../../hooks/useNegocio";

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
  const sz =
    size === "sm"
      ? "w-7 h-7 text-xs"
      : size === "lg"
        ? "w-14 h-14 text-xl"
        : "w-9 h-9 text-sm";
  return (
    <div
      className={`${sz} ${color} rounded-full flex items-center justify-center font-bold shrink-0`}
    >
      {initials}
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    COMPLETADA: "bg-green-100 text-green-700",
    PENDIENTE: "bg-yellow-100 text-yellow-700",
    CONFIRMADA: "bg-blue-100 text-blue-700",
    CANCELADA: "bg-red-100 text-red-600",
  };
  return (
    <span
      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${map[estado] ?? "bg-gray-100 text-gray-500"}`}
    >
      {estado.charAt(0) + estado.slice(1).toLowerCase()}
    </span>
  );
}

function formatFecha(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

interface NuevoClienteForm {
  nombre: string;
  telefono: string;
  email: string;
}

export default function ClientesView() {
  const { negocioId, isLoadingNegocioId, backendError, retryConnection } =
    useNegocio();
  const {
    getClientes,
    getCliente,
    createCliente,
    updateCliente,
    deleteCliente,
  } = useApi(negocioId);

  const [clientes, setClientes] = useState<ClienteListItem[]>([]);
  const [selected, setSelected] = useState<ClienteDetalle | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState("");

  // Modal Nuevo Cliente
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NuevoClienteForm>({
    nombre: "",
    telefono: "",
    email: "",
  });
  const [formError, setFormError] = useState("");

  // Modal Editar
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<NuevoClienteForm>({
    nombre: "",
    telefono: "",
    email: "",
  });

  // ── fetch list ────────────────────────────────────────────────────────────

  const fetchClientes = useCallback(async () => {
    if (!negocioId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }, [negocioId, getClientes]);

  useEffect(() => {
    if (!isLoadingNegocioId && negocioId) {
      fetchClientes();
    }
  }, [isLoadingNegocioId, negocioId, fetchClientes]);

  // ── select detail ─────────────────────────────────────────────────────────

  const handleSelect = async (id: string) => {
    setLoadingDetalle(true);
    setSelected(null);
    try {
      const detalle = await getCliente(id);
      setSelected(detalle);
    } catch {
      // ignore
    } finally {
      setLoadingDetalle(false);
    }
  };

  // ── crear cliente ─────────────────────────────────────────────────────────

  const handleCrear = async () => {
    if (!form.nombre.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    if (!form.telefono.trim()) {
      setFormError("El teléfono es obligatorio.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const nuevo = await createCliente({
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim() || undefined,
      });
      setClientes((prev) => [nuevo, ...prev]);
      setShowModal(false);
      setForm({ nombre: "", telefono: "", email: "" });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Error al crear cliente");
    } finally {
      setSaving(false);
    }
  };

  // ── editar cliente ────────────────────────────────────────────────────────

  const handleOpenEdit = () => {
    if (!selected) return;
    setEditForm({
      nombre: selected.nombre,
      telefono: selected.telefono,
      email: selected.email ?? "",
    });
    setFormError("");
    setShowEdit(true);
  };

  const handleGuardarEdit = async () => {
    if (!selected) return;
    if (!editForm.nombre.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const updated = await updateCliente(selected.id, {
        nombre: editForm.nombre.trim(),
        telefono: editForm.telefono.trim(),
        email: editForm.email.trim() || undefined,
      });
      setClientes((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
      const detalle = await getCliente(updated.id);
      setSelected(detalle);
      setShowEdit(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  // ── eliminar cliente ──────────────────────────────────────────────────────

  const handleEliminar = async () => {
    if (!selected) return;
    if (
      !confirm(
        `¿Eliminar a ${selected.nombre}? Esta acción no se puede deshacer.`,
      )
    )
      return;
    try {
      await deleteCliente(selected.id);
      setClientes((prev) => prev.filter((c) => c.id !== selected.id));
      setSelected(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  // ── filter ────────────────────────────────────────────────────────────────

  const filtered = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.telefono.includes(search) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Lista ── */}
      <div
        className={`flex flex-col bg-gray-50 overflow-hidden transition-all ${selected ? "w-80 shrink-0 border-r border-gray-100" : "flex-1"}`}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {clientes.length} registrados
              </p>
            </div>
            <button
              onClick={() => {
                setForm({ nombre: "", telefono: "", email: "" });
                setFormError("");
                setShowModal(true);
              }}
              className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
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
              placeholder="Buscar por nombre, teléfono..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Backend unreachable */}
          {backendError && !loading && !isLoadingNegocioId && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800">
                  Sin conexión al servidor
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Verifica que el backend esté corriendo en{" "}
                  <code className="font-mono bg-amber-100 px-1 rounded">
                    localhost:8000
                  </code>
                </p>
              </div>
              <button
                onClick={retryConnection}
                className="shrink-0 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {loading || isLoadingNegocioId ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 text-sm">{error}</p>
              <button
                onClick={fetchClientes}
                className="mt-3 text-green-600 text-sm font-semibold hover:underline"
              >
                Reintentar
              </button>
            </div>
          ) : !backendError && filtered.length === 0 ? (
            <div className="text-center py-16">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">
                {search ? "Sin resultados" : "Aún no tienes clientes"}
              </p>
              {!search && (
                <button
                  onClick={() => {
                    setForm({ nombre: "", telefono: "", email: "" });
                    setFormError("");
                    setShowModal(true);
                  }}
                  className="mt-3 text-green-600 text-sm font-semibold hover:underline"
                >
                  Agregar el primero
                </button>
              )}
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all hover:border-green-300 hover:shadow-sm ${selected?.id === c.id ? "border-green-400 ring-1 ring-green-200 shadow-sm" : "border-gray-100"}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar nombre={c.nombre} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {c.nombre}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {c.telefono}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-gray-400">
                        {c.total_citas} cita{c.total_citas !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs font-semibold text-green-700">
                        {c.total_gastado}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Detalle ── */}
      {(selected || loadingDetalle) && (
        <div className="flex-1 overflow-y-auto bg-white">
          {loadingDetalle ? (
            <div className="p-8 space-y-4 animate-pulse">
              <div className="h-6 bg-gray-100 rounded w-48" />
              <div className="h-32 bg-gray-100 rounded-2xl" />
              <div className="h-48 bg-gray-100 rounded-2xl" />
            </div>
          ) : selected ? (
            <>
              {/* Breadcrumb */}
              <div className="px-6 pt-5 pb-2 flex items-center gap-2 text-sm border-b border-gray-50">
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
                <span className="text-gray-700 font-medium">
                  {selected.nombre}
                </span>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Header cliente */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <Avatar nombre={selected.nombre} size="lg" />
                      <div>
                        <h2 className="text-xl font-extrabold text-gray-900">
                          {selected.nombre}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {selected.telefono}
                        </p>
                        {selected.email && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {selected.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleOpenEdit}
                        className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
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
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={handleEliminar}
                        className="flex items-center gap-1.5 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Resumen financiero */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total gastado", value: selected.total_gastado },
                    {
                      label: "Ticket promedio",
                      value: selected.ticket_promedio,
                    },
                    {
                      label: "Citas totales",
                      value: String(selected.total_citas),
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-green-700 rounded-2xl p-4 text-white"
                    >
                      <p className="text-xs text-green-300 font-medium">
                        {s.label}
                      </p>
                      <p className="text-lg font-extrabold mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Historial de visitas */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-sm mb-4">
                    Historial de Visitas
                  </h3>
                  {selected.historial.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">
                      Sin citas registradas aún.
                    </p>
                  ) : (
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
                          {selected.historial.map((v) => (
                            <tr
                              key={v.id}
                              className="hover:bg-gray-50/50 transition-colors"
                            >
                              <td className="py-3 pr-4 text-xs text-gray-600 whitespace-nowrap">
                                {formatFecha(v.hora_inicio)}
                              </td>
                              <td className="py-3 pr-4 text-xs font-medium text-gray-800">
                                {v.servicio_nombre}
                              </td>
                              <td className="py-3 pr-4 text-xs text-gray-600">
                                {v.empleado_nombre}
                              </td>
                              <td className="py-3 pr-4 text-xs font-semibold text-gray-800">
                                {v.monto_anticipo}
                              </td>
                              <td className="py-3">
                                <EstadoBadge estado={v.estado} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── Modal Nuevo Cliente ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
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
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Nuevo Cliente
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
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
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {formError}
                </p>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. María García"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.telefono}
                  onChange={(e) =>
                    setForm({ ...form, telefono: e.target.value })
                  }
                  placeholder="+52 55 0000 0000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Email{" "}
                  <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="cliente@correo.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrear}
                disabled={saving}
                className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 text-sm shadow-lg shadow-green-600/20 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar Cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar Cliente ── */}
      {showEdit && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Editar Cliente
              </h2>
              <button
                onClick={() => setShowEdit(false)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
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
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {formError}
                </p>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Nombre
                </label>
                <input
                  value={editForm.nombre}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nombre: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Teléfono
                </label>
                <input
                  value={editForm.telefono}
                  onChange={(e) =>
                    setEditForm({ ...editForm, telefono: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarEdit}
                disabled={saving}
                className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 text-sm shadow-lg shadow-green-600/20 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
