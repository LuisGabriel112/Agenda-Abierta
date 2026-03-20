import { useCallback } from "react";
import type { HorarioData } from "./useNegocio";

const API_BASE = import.meta.env.VITE_API_BASE as string;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ServicioData {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  duracion_minutos: number;
}

export interface ClienteListItem {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  total_citas: number;
  total_gastado: string;
}

export interface CitaEnHistorial {
  id: string;
  servicio_nombre: string;
  empleado_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  monto_anticipo: string;
}

export interface ClienteDetalle extends ClienteListItem {
  ticket_promedio: string;
  historial: CitaEnHistorial[];
}

export interface CitaItem {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  servicio_id: string;
  servicio_nombre: string;
  servicio_duracion_minutos: number;
  empleado_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  monto_anticipo: string;
}

export interface AnaliticaData {
  ingresos_totales: string;
  total_citas: number;
  total_clientes: number;
  citas_por_mes: { mes: string; total: number }[];
  transacciones_recientes: {
    cliente_nombre: string;
    servicio_nombre: string;
    fecha: string;
    monto: string;
  }[];
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function req<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(err.detail ?? "Error del servidor");
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useApi(negocioId: string | null) {
  // ── Servicios ─────────────────────────────────────────────────────────────

  const getServicios = useCallback((): Promise<ServicioData[]> => {
    if (!negocioId) return Promise.resolve([]);
    return req(`/api/negocio/${negocioId}/servicios`);
  }, [negocioId]);

  const createServicio = useCallback(
    (body: {
      nombre: string;
      precio: string;
      duracion_minutos: number;
      descripcion?: string;
    }): Promise<ServicioData> => {
      if (!negocioId) return Promise.reject(new Error("Sin negocio"));
      return req(`/api/negocio/${negocioId}/servicios`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    [negocioId],
  );

  const updateServicio = useCallback(
    (
      servicioId: string,
      body: Partial<{
        nombre: string;
        precio: string;
        duracion_minutos: number;
        descripcion: string;
      }>,
    ): Promise<ServicioData> => {
      if (!negocioId) return Promise.reject(new Error("Sin negocio"));
      return req(`/api/negocio/${negocioId}/servicios/${servicioId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    [negocioId],
  );

  const deleteServicio = useCallback(
    (servicioId: string): Promise<{ success: boolean }> => {
      if (!negocioId) return Promise.reject(new Error("Sin negocio"));
      return req(`/api/negocio/${negocioId}/servicios/${servicioId}`, {
        method: "DELETE",
      });
    },
    [negocioId],
  );

  // ── Clientes ──────────────────────────────────────────────────────────────

  const getClientes = useCallback((): Promise<ClienteListItem[]> => {
    if (!negocioId) return Promise.resolve([]);
    return req(`/api/negocio/${negocioId}/clientes`);
  }, [negocioId]);

  const getCliente = useCallback(
    (clienteId: string): Promise<ClienteDetalle> => {
      if (!negocioId) return Promise.reject(new Error("Sin negocio"));
      return req(`/api/negocio/${negocioId}/clientes/${clienteId}`);
    },
    [negocioId],
  );

  const createCliente = useCallback(
    (body: {
      nombre: string;
      telefono: string;
      email?: string;
    }): Promise<ClienteListItem> => {
      if (!negocioId) return Promise.reject(new Error("Sin negocio"));
      return req(`/api/negocio/${negocioId}/clientes`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    [negocioId],
  );

  const updateCliente = useCallback(
    (
      clienteId: string,
      body: Partial<{ nombre: string; telefono: string; email: string }>,
    ): Promise<ClienteListItem> => {
      if (!negocioId) return Promise.reject(new Error("Sin negocio"));
      return req(`/api/negocio/${negocioId}/clientes/${clienteId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    [negocioId],
  );

  const deleteCliente = useCallback(
    (clienteId: string): Promise<{ success: boolean }> => {
      if (!negocioId) return Promise.reject(new Error("Sin negocio"));
      return req(`/api/negocio/${negocioId}/clientes/${clienteId}`, {
        method: "DELETE",
      });
    },
    [negocioId],
  );

  // ── Citas ─────────────────────────────────────────────────────────────────

  const getCitas = useCallback(
    (params?: { fecha_inicio?: string; fecha_fin?: string }): Promise<CitaItem[]> => {
      if (!negocioId) return Promise.resolve([]);
      const qs = new URLSearchParams();
      if (params?.fecha_inicio) qs.set("fecha_inicio", params.fecha_inicio);
      if (params?.fecha_fin) qs.set("fecha_fin", params.fecha_fin);
      const query = qs.toString() ? `?${qs.toString()}` : "";
      return req(`/api/negocio/${negocioId}/citas${query}`);
    },
    [negocioId],
  );

  const createCita = useCallback(
    (body: {
      cliente_id: string;
      servicio_id: string;
      hora_inicio: string;
      notas?: string;
    }): Promise<CitaItem> => {
      if (!negocioId) return Promise.reject(new Error("Sin negocio"));
      return req(`/api/negocio/${negocioId}/citas`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    [negocioId],
  );

  const updateCita = useCallback(
    (
      citaId: string,
      body: Partial<{ estado: string; hora_inicio: string; hora_fin: string }>,
    ): Promise<CitaItem> => {
      if (!negocioId) return Promise.reject(new Error("Sin negocio"));
      return req(`/api/negocio/${negocioId}/citas/${citaId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    [negocioId],
  );

  const deleteCita = useCallback(
    (citaId: string): Promise<{ success: boolean }> => {
      if (!negocioId) return Promise.reject(new Error("Sin negocio"));
      return req(`/api/negocio/${negocioId}/citas/${citaId}`, {
        method: "DELETE",
      });
    },
    [negocioId],
  );

  // ── Horarios ──────────────────────────────────────────────────────────────

  const updateHorarios = useCallback(
    (body: HorarioData[]): Promise<unknown> => {
      if (!negocioId) return Promise.reject(new Error("Sin negocio"));
      return req(`/api/negocio/${negocioId}/horarios`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    [negocioId],
  );

  // ── Analítica ─────────────────────────────────────────────────────────────

  const getAnalitica = useCallback((): Promise<AnaliticaData> => {
    if (!negocioId) return Promise.reject(new Error("Sin negocio"));
    return req(`/api/negocio/${negocioId}/analitica`);
  }, [negocioId]);

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    // Servicios
    getServicios,
    createServicio,
    updateServicio,
    deleteServicio,
    // Clientes
    getClientes,
    getCliente,
    createCliente,
    updateCliente,
    deleteCliente,
    // Citas
    getCitas,
    createCita,
    updateCita,
    deleteCita,
    // Horarios
    updateHorarios,
    // Analítica
    getAnalitica,
  };
}
