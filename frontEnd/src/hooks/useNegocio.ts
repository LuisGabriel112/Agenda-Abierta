import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";

const API_BASE = import.meta.env.VITE_API_BASE as string;

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
  | "loading" // Verificando con el backend
  | "registered" // El usuario tiene negocio
  | "not_registered" // El usuario no tiene negocio
  | "backend_error"; // El backend no responde

interface UseNegocioReturn {
  status: RegistrationStatus;
  negocioId: string | null;
  isLoadingNegocioId: boolean;
  dashboardData: DashboardData | null;
  isLoadingDashboard: boolean;
  backendError: boolean;
  refetchDashboard: () => Promise<void>;
  retryConnection: () => void;
  updateNegocio: (
    fields: Partial<
      Pick<
        NegocioData,
        "nombre" | "giro" | "descripcion" | "direccion" | "color_marca"
      >
    >,
  ) => Promise<boolean>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useNegocio(): UseNegocioReturn {
  const { user, isLoaded } = useUser();

  const [status, setStatus] = useState<RegistrationStatus>("loading");
  const [negocioId, setNegocioId] = useState<string | null>(null);
  const [isLoadingNegocioId, setIsLoadingNegocioId] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // ── Step 1: Verify if the Clerk user has a registered negocio ─────────────
  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      setStatus("not_registered");
      setIsLoadingNegocioId(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      setIsLoadingNegocioId(true);
      setBackendError(false);

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const res = await fetch(
            `${API_BASE}/api/me?clerk_user_id=${encodeURIComponent(user.id)}`,
            { signal: AbortSignal.timeout(5000) },
          );

          if (cancelled) return;

          if (res.ok) {
            const data = await res.json();
            setNegocioId(data.negocio_id);
            setStatus("registered");
            setBackendError(false);
            setIsLoadingNegocioId(false);
            return;
          }

          if (res.status === 404) {
            setStatus("not_registered");
            setBackendError(false);
            setIsLoadingNegocioId(false);
            return;
          }

          // Any other HTTP error — don't retry
          console.error(`/api/me returned ${res.status}`);
          setStatus("backend_error");
          setBackendError(true);
          setIsLoadingNegocioId(false);
          return;
        } catch (err) {
          if (cancelled) return;
          const isLastAttempt = attempt === MAX_RETRIES - 1;
          if (isLastAttempt) {
            console.error("Backend unreachable after retries:", err);
            setStatus("backend_error");
            setBackendError(true);
            setIsLoadingNegocioId(false);
            return;
          }
          // Wait before next retry
          await sleep(RETRY_DELAY_MS * (attempt + 1));
        }
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, retryTrigger]);

  // ── Step 2: Fetch full dashboard data once we have negocioId ──────────────
  const fetchDashboard = useCallback(async () => {
    if (!negocioId) return;

    setIsLoadingDashboard(true);

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(`${API_BASE}/api/negocio/${negocioId}`, {
          signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
          const data: DashboardData = await res.json();
          setDashboardData(data);
          setBackendError(false);
          setIsLoadingDashboard(false);
          return;
        }

        // HTTP error
        console.error(`/api/negocio/${negocioId} returned ${res.status}`);
        setBackendError(true);
        setIsLoadingDashboard(false);
        return;
      } catch (err) {
        const isLastAttempt = attempt === MAX_RETRIES - 1;
        if (isLastAttempt) {
          console.error("Error fetching dashboard data:", err);
          setBackendError(true);
          setIsLoadingDashboard(false);
          return;
        }
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }, [negocioId]);

  useEffect(() => {
    if (status === "registered" && negocioId) {
      fetchDashboard();
    }
  }, [status, negocioId, fetchDashboard]);

  // ── Manual retry ──────────────────────────────────────────────────────────
  const retryConnection = useCallback(() => {
    setStatus("loading");
    setBackendError(false);
    setIsLoadingNegocioId(true);
    setRetryTrigger((n) => n + 1);
  }, []);

  // ── Update negocio fields ─────────────────────────────────────────────────
  const updateNegocio = useCallback(
    async (
      fields: Partial<
        Pick<
          NegocioData,
          "nombre" | "giro" | "descripcion" | "direccion" | "color_marca"
        >
      >,
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
            prev ? { ...prev, negocio: { ...prev.negocio, ...fields } } : prev,
          );
          return true;
        }
        return false;
      } catch (err) {
        console.error("Error updating negocio:", err);
        return false;
      }
    },
    [negocioId],
  );

  return {
    status,
    negocioId,
    isLoadingNegocioId,
    dashboardData,
    isLoadingDashboard,
    backendError,
    refetchDashboard: fetchDashboard,
    retryConnection,
    updateNegocio,
  };
}
