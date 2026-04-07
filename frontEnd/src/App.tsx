import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth, useUser, useClerk } from "@clerk/react";
import { useEffect, useState } from "react";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Checkout from "./pages/Checkout";
import Register from "./pages/Register";
import Success from "./pages/Success";
import PaymentFailed from "./pages/PaymentFailed";
import Dashboard from "./pages/Dashboard";
import CompleteProfile from "./pages/CompleteProfile";
import NegocioPublico from "./pages/NegocioPublico";
import AdminPanel from "./pages/AdminPanel";
import CancelarCita from "./pages/CancelarCita";

const API_BASE = import.meta.env.VITE_API_BASE as string;
const ADMIN_ID = import.meta.env.VITE_ADMIN_CLERK_USER_ID as string;

type RegStatus = "loading" | "registered" | "not_registered" | "no_subscription" | "suspended";

function RootRoute() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  if (!isLoaded)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (isSignedIn) {
    return user?.id === ADMIN_ID
      ? <Navigate to="/admin" replace />
      : <Navigate to="/dashboard" replace />;
  }
  return <Landing />;
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [regStatus, setRegStatus] = useState<RegStatus>("loading");

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const check = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/me?clerk_user_id=${encodeURIComponent(user.id)}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (!data.negocio_activo) {
            setRegStatus("suspended");
          } else if (!data.tiene_suscripcion) {
            setRegStatus("no_subscription");
          } else {
            setRegStatus("registered");
          }
        } else if (res.status === 404) {
          setRegStatus("not_registered");
        } else {
          // Backend error — allow access to avoid blocking legitimate users
          setRegStatus("registered");
        }
      } catch {
        // Backend unreachable — allow access
        setRegStatus("registered");
      }
    };

    check();
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || regStatus === "loading")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">
            Cargando tu espacio...
          </p>
        </div>
      </div>
    );

  if (!isSignedIn) return <Navigate to="/" replace />;

  if (regStatus === "not_registered")
    return <Navigate to="/complete-profile" replace />;

  if (regStatus === "suspended" || regStatus === "no_subscription") {
    const msg = regStatus === "suspended"
      ? "Tu cuenta ha sido suspendida. Contacta a soporte para más información."
      : "Tu suscripción fue cancelada. Para seguir usando AgendaAbierta necesitas reactivar tu plan.";
    const titulo = regStatus === "suspended" ? "Cuenta suspendida" : "Suscripción cancelada";
    return (
      <div className="min-h-screen bg-[#f4f7f6] flex items-center justify-center font-sans">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800">{titulo}</h2>
          <p className="text-sm text-gray-500">{msg}</p>
          {regStatus === "no_subscription" && (
            <button
              onClick={() => navigate("/checkout", { state: { reactivar: true } })}
              className="w-full mt-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              Reactivar plan
            </button>
          )}
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/register" element={<Register />} />
        <Route path="/success" element={<Success />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/b/:slug" element={<NegocioPublico />} />
        <Route path="/cancelar/:token" element={<CancelarCita />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
