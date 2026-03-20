import { useState, useEffect, useCallback } from "react";
import { useApi, ServicioData } from "../../hooks/useApi";
import { useNegocio } from "../../hooks/useNegocio";

interface ServicioForm {
  nombre: string;
  precio: string;
  duracion_minutos: string;
  descripcion: string;
}

const EMPTY_FORM: ServicioForm = {
  nombre: "",
  precio: "",
  duracion_minutos: "",
  descripcion: "",
};

function validate(
  form: ServicioForm,
): Partial<Record<keyof ServicioForm, string>> {
  const errors: Partial<Record<keyof ServicioForm, string>> = {};
  if (!form.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
  if (!form.precio || isNaN(Number(form.precio)) || Number(form.precio) <= 0)
    errors.precio = "Ingresa un precio válido mayor a 0.";
  if (
    !form.duracion_minutos ||
    isNaN(Number(form.duracion_minutos)) ||
    Number(form.duracion_minutos) <= 0
  )
    errors.duracion_minutos = "La duración debe ser mayor a 0.";
  return errors;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-6 bg-gray-100 rounded-lg w-16" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
      <div className="h-3 bg-gray-100 rounded w-3/4" />
    </div>
  );
}

interface ModalProps {
  editando: ServicioData | null;
  form: ServicioForm;
  setForm: (f: ServicioForm) => void;
  errors: Partial<Record<keyof ServicioForm, string>>;
  saving: boolean;
  apiError: string;
  onClose: () => void;
  onSave: () => void;
}

function ServicioModal({
  editando,
  form,
  setForm,
  errors,
  saving,
  apiError,
  onClose,
  onSave,
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        {/* Header */}
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {editando ? "Editar Servicio" : "Nuevo Servicio"}
            </h2>
          </div>
          <button
            onClick={onClose}
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

        {/* Body */}
        <div className="p-6 space-y-4">
          {apiError && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
              {apiError}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Nombre del servicio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Corte Clásico"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.nombre ? "border-red-300 bg-red-50" : "border-gray-200"
              }`}
            />
            {errors.nombre && (
              <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* Precio y Duración */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Precio ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
                placeholder="150.00"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.precio ? "border-red-300 bg-red-50" : "border-gray-200"
                }`}
              />
              {errors.precio && (
                <p className="text-xs text-red-500 mt-1">{errors.precio}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Duración (min) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.duracion_minutos}
                onChange={(e) =>
                  setForm({ ...form, duracion_minutos: e.target.value })
                }
                placeholder="45"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.duracion_minutos
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
                }`}
              />
              {errors.duracion_minutos && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.duracion_minutos}
                </p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Descripción{" "}
              <span className="font-normal text-gray-400">(Opcional)</span>
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
              rows={3}
              placeholder="Breve descripción del servicio para tus clientes..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors text-sm shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Servicio"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ServiciosView({
  onDataChanged,
}: {
  onDataChanged?: () => void;
}) {
  const { negocioId, isLoadingNegocioId, backendError, retryConnection } =
    useNegocio();
  const { getServicios, createServicio, updateServicio, deleteServicio } =
    useApi(negocioId);

  const [servicios, setServicios] = useState<ServicioData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<ServicioData | null>(null);
  const [form, setForm] = useState<ServicioForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof ServicioForm, string>>
  >({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchServicios = useCallback(async () => {
    if (!negocioId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getServicios();
      setServicios(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar servicios");
    } finally {
      setLoading(false);
    }
  }, [negocioId, getServicios]);

  useEffect(() => {
    if (!isLoadingNegocioId && negocioId) {
      fetchServicios();
    }
  }, [isLoadingNegocioId, negocioId, fetchServicios]);

  // ── open modal ────────────────────────────────────────────────────────────
  const openCrear = () => {
    setEditando(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setApiError("");
    setShowModal(true);
  };

  const openEditar = (srv: ServicioData) => {
    setEditando(srv);
    setForm({
      nombre: srv.nombre,
      precio: srv.precio,
      duracion_minutos: String(srv.duracion_minutos),
      descripcion: srv.descripcion ?? "",
    });
    setFormErrors({});
    setApiError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditando(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setApiError("");
  };

  // ── save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const errors = validate(form);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setApiError("");
    setSaving(true);

    const payload = {
      nombre: form.nombre.trim(),
      precio: form.precio,
      duracion_minutos: parseInt(form.duracion_minutos),
      descripcion: form.descripcion.trim() || undefined,
    };

    try {
      if (editando) {
        const updated = await updateServicio(editando.id, payload);
        setServicios((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s)),
        );
      } else {
        const nuevo = await createServicio(payload);
        setServicios((prev) => [nuevo, ...prev]);
        onDataChanged?.();
      }
      closeModal();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const handleEliminar = async (srv: ServicioData) => {
    if (
      !confirm(`¿Eliminar "${srv.nombre}"? Esta acción no se puede deshacer.`)
    )
      return;
    try {
      await deleteServicio(srv.id);
      setServicios((prev) => prev.filter((s) => s.id !== srv.id));
      onDataChanged?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  const isSpinning = isLoadingNegocioId || loading;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-3xl mx-auto p-6 lg:p-8 pb-20">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {isSpinning
                  ? "Cargando..."
                  : `${servicios.length} servicio${servicios.length !== 1 ? "s" : ""} registrado${servicios.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              onClick={openCrear}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
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
              Nuevo Servicio
            </button>
          </div>

          {/* Backend error */}
          {backendError && !isSpinning && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
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
                  No se pudo conectar al servidor
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

          {/* API error */}
          {error && !backendError && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchServicios}
                className="text-red-700 font-bold hover:underline ml-4"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Loading skeletons — only while genuinely loading */}
          {isSpinning && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isSpinning && !error && !backendError && servicios.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Aún no tienes servicios
              </h2>
              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                Agrega los servicios que ofreces para que tus clientes puedan
                reservar en línea.
              </p>
              <button
                onClick={openCrear}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
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
                Agregar el primero
              </button>
            </div>
          )}

          {/* Servicios list */}
          {!isSpinning && servicios.length > 0 && (
            <div className="space-y-3">
              {servicios.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-base">
                          {srv.nombre}
                        </h3>
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
                          ${srv.precio}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {srv.duracion_minutos} min
                      </div>

                      {srv.descripcion && (
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {srv.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditar(srv)}
                        className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-green-100 hover:text-green-700 transition-colors"
                        title="Editar"
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
                      </button>
                      <button
                        onClick={() => handleEliminar(srv)}
                        className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                        title="Eliminar"
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
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tip */}
          {!isSpinning && servicios.length > 0 && (
            <div className="mt-6 bg-green-50 border border-green-100 rounded-2xl p-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-green-800 leading-relaxed">
                <strong>Tip:</strong> Los servicios que agregues aquí aparecerán
                automáticamente en tu página pública para que tus clientes
                puedan reservar en línea.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ServicioModal
          editando={editando}
          form={form}
          setForm={setForm}
          errors={formErrors}
          saving={saving}
          apiError={apiError}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </>
  );
}
