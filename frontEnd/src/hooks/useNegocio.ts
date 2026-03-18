import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";

const API_BASE = "http://localhost:8000";

export interface NegocioData {
  id: string;
  nombre: string;
  slug: string;
  giro: string | null;
  descripcion: string | null;
  direccion: string | null;
  color_marca: string | null;
  url_logo: string | null;
  fecha_creacion: string;
}

export interface ServicioData {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  duracion_minutos: number;
}

export interface HorarioData {
  dia_semana: number;
  hora_apertura: string | null;
  hora_cierre: string | null;
  esta_cerrado: boolean;
}

export interface DashboardData {
  negocio: NegocioData;
  servicios: ServicioData[];
  horarios: HorarioData[];
  total_clientes: number;
  total_citas: number;
}

export type RegistrationStatus =
  | "loading"       // Verificando con el backend
  | "registered"    // El usuario tiene negocio → ir al dashboard
  | "not_registered"; // El usuario no tiene negocio → ir al onboarding

interface UseNegocioReturn {
  status: RegistrationStatus;
  negocioId: string | null;
  dashboardData: DashboardData | null;
  isLoadingDashboard: boolean;
  refetchDashboard: () => Promise<void>;
  updateNegocio: (fields: Partial<Pick<NegocioData, "nombre" | "giro" | "descripcion" | "direccion" | "color_marca">>) => Promise<boolean>;
}

export function useNegocio(): UseNegocioReturn {
  const { user, isLoaded } = useUser();

  const [status, setStatus] = useState<RegistrationStatus>("loading");
  const [negocioId, setNegocioId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // ── Step 1: check if the Clerk user has a registered negocio ──────────────
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setStatus("not_registered");
      return;
    }

    const check = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/me?clerk_user_id=${encodeURIComponent(user.id)}`
        );
        if (res.ok) {
          const data = await res.json();
          setNegocioId(data.negocio_id);
          setStatus("registered");
        } else if (res.status === 404) {
          setStatus("not_registered");
        } else {
          // Unexpected error — default to not registered so we don't block
          console.error("Error checking registration:", res.status);
          setStatus("not_registered");
        }
      } catch (err) {
        console.error("Network error checking registration:", err);
        // If backend is down, let them through but log it
        setStatus("not_registered");
      }
    };

    check();
  }, [isLoaded, user]);

  // ── Step 2: once we have negocioId, fetch the full dashboard data ─────────
  const fetchDashboard = useCallback(async () => {
    if (!negocioId) return;
    setIsLoadingDashboard(true);
    try {
      const res = await fetch(`${API_BASE}/api/negocio/${negocioId}`);
      if (res.ok) {
        const data: DashboardData = await res.json();
        setDashboardData(data);
      } else {
        console.error("Error fetching dashboard data:", res.status);
      }
    } catch (err) {
      console.error("Network error fetching dashboard data:", err);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [negocioId]);

  useEffect(() => {
    if (status === "registered" && negocioId) {
      fetchDashboard();
    }
  }, [status, negocioId, fetchDashboard]);

  // ── Update negocio fields (used by ConfiguracionView) ────────────────────
  const updateNegocio = useCallback(
    async (
      fields: Partial<
        Pick<NegocioData, "nombre" | "giro" | "descripcion" | "direccion" | "color_marca">
      >
    ): Promise<boolean> => {
      if (!negocioId) return false;
      try {
        const res = await fetch(`${API_BASE}/api/negocio/${negocioId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });
        if (res.ok) {
          // Optimistically update local cache
          setDashboardData((prev) =>
            prev
              ? { ...prev, negocio: { ...prev.negocio, ...fields } }
              : prev
          );
          return true;
        }
        return false;
      } catch (err) {
        console.error("Error updating negocio:", err);
        return false;
      }
    },
    [negocioId]
  );

  return {
    status,
    negocioId,
    dashboardData,
    isLoadingDashboard,
    refetchDashboard: fetchDashboard,
    updateNegocio,
  };
}
