import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Checkout from "./pages/Checkout";
import Register from "./pages/Register";
import Success from "./pages/Success";
import PaymentFailed from "./pages/PaymentFailed";
import Dashboard from "./pages/Dashboard";
import CompleteProfile from "./pages/CompleteProfile";

const API_BASE = "http://localhost:8000";

type RegStatus = "loading" | "registered" | "not_registered";

function RootRoute() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return isSignedIn ? <Navigate to="/dashboard" replace /> : <Landing />;
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [regStatus, setRegStatus] = useState<RegStatus>("loading");

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const check = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/me?clerk_user_id=${encodeURIComponent(user.id)}`,
        );
        if (res.ok) {
          setRegStatus("registered");
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
