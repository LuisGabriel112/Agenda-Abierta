import { useState, useEffect, useCallback } from "react";
import { useApi, EmpleadoData } from "../../hooks/useApi";
import { useNegocio } from "../../hooks/useNegocio";

interface EmpleadoForm {
  nombre: string;
  email: string;
  rol: "ADMIN" | "STAFF";
}

const EMPTY_FORM: EmpleadoForm = { nombre: "", email: "", rol: "STAFF" };

function validate(form: EmpleadoForm): Partial<Record<keyof EmpleadoForm, string>> {
  const errors: Partial<Record<keyof EmpleadoForm, string>> = {};
  if (!form.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Ingresa un correo válido.";
  return errors;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-gray-100 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

interface ModalProps {
  editando: EmpleadoData | null;
  form: EmpleadoForm;
  setForm: (f: EmpleadoForm) => void;
  errors: Partial<Record<keyof EmpleadoForm, string>>;
  saving: boolean;
  apiError: string;
  onClose: () => void;
  onSave: () => void;
}

function EmpleadoModal({ editando, form, setForm, errors, saving, apiError, onClose, onSave }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {editando ? "Editar Empleado" : "Nuevo Empleado"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {apiError && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
              {apiError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Carlos Ramírez"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.nombre ? "border-red-300 bg-red-50" : "border-gray-200"
              }`}
            />
            {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="carlos@ejemplo.com"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.email ? "border-red-300 bg-red-50" : "border-gray-200"
              }`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Rol</label>
            <select
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value as "ADMIN" | "STAFF" })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              <option value="STAFF">Staff — puede ver el calendario</option>
              <option value="ADMIN">Admin — acceso completo</option>
            </select>
          </div>
        </div>

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
              "Guardar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmpleadosView() {
  const { negocioId, isLoadingNegocioId } = useNegocio();
  const { getEmpleados, createEmpleado, updateEmpleado, deleteEmpleado } = useApi(negocioId);

  const [empleados, setEmpleados] = useState<EmpleadoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<EmpleadoData | null>(null);
  const [form, setForm] = useState<EmpleadoForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EmpleadoForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  const fetchEmpleados = useCallback(async () => {
    if (!negocioId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getEmpleados();
      setEmpleados(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar empleados");
    } finally {
      setLoading(false);
    }
  }, [negocioId, getEmpleados]);

  useEffect(() => {
    if (!isLoadingNegocioId && negocioId) fetchEmpleados();
  }, [isLoadingNegocioId, negocioId, fetchEmpleados]);

  const openCrear = () => {
    setEditando(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setApiError("");
    setShowModal(true);
  };

  const openEditar = (emp: EmpleadoData) => {
    setEditando(emp);
    setForm({ nombre: emp.nombre, email: emp.email, rol: emp.rol });
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

  const handleSave = async () => {
    const errors = validate(form);
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    setFormErrors({});
    setApiError("");
    setSaving(true);
    try {
      if (editando) {
        const updated = await updateEmpleado(editando.id, { nombre: form.nombre, email: form.email, rol: form.rol });
        setEmpleados((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        const nuevo = await createEmpleado({ nombre: form.nombre, email: form.email, rol: form.rol });
        setEmpleados((prev) => [nuevo, ...prev]);
      }
      closeModal();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (emp: EmpleadoData) => {
    try {
      const updated = await updateEmpleado(emp.id, { activo: !emp.activo });
      setEmpleados((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al actualizar");
    }
  };

  const handleEliminar = async (emp: EmpleadoData) => {
    if (!confirm(`¿Eliminar a "${emp.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteEmpleado(emp.id);
      setEmpleados((prev) => prev.filter((e) => e.id !== emp.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  const isSpinning = isLoadingNegocioId || loading;

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-3xl mx-auto p-6 lg:p-8 pb-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Equipo</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {isSpinning
                  ? "Cargando..."
                  : `${empleados.length} empleado${empleados.length !== 1 ? "s" : ""} registrado${empleados.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              onClick={openCrear}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Empleado
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={fetchEmpleados} className="text-red-700 font-bold hover:underline ml-4">Reintentar</button>
            </div>
          )}

          {isSpinning && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!isSpinning && !error && empleados.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Aun no tienes empleados</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                Da de alta a tu equipo para asignarles citas y servicios.
              </p>
              <button
                onClick={openCrear}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Agregar el primero
              </button>
            </div>
          )}

          {!isSpinning && empleados.length > 0 && (
            <div className="space-y-3">
              {empleados.map((emp) => (
                <div
                  key={emp.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow group ${
                    emp.activo ? "border-gray-100" : "border-gray-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <span className="text-green-700 font-bold text-sm">
                        {emp.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">{emp.nombre}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          emp.rol === "ADMIN"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {emp.rol === "ADMIN" ? "Admin" : "Staff"}
                        </span>
                        {!emp.activo && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{emp.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleToggleActivo(emp)}
                        className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-yellow-100 hover:text-yellow-700 transition-colors"
                        title={emp.activo ? "Desactivar" : "Activar"}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={emp.activo
                            ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                        </svg>
                      </button>
                      <button
                        onClick={() => openEditar(emp)}
                        className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-green-100 hover:text-green-700 transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEliminar(emp)}
                        className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <EmpleadoModal
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
