// src/App.tsx
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ExplorePage from "./pages/ExplorePage";
import CommitmentDetailPage from "./pages/CommitmentDetailPage";
import CreateCommitmentPage from "./pages/CreateCommitmentPage";
import ProfilePage from "./pages/ProfilePage";
import { loadUser, clearAuth, saveAuth } from "./auth";
import type { User } from "./types";

function AppRoutes() {
  const [user, setUser] = useState<User | null>(() => loadUser());
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is still valid on mount
    const storedUser = loadUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const handleAuthSuccess = (authUser: User, token: string) => {
    saveAuth(token, authUser);
    setUser(authUser);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    navigate("/");
  };

  const handleNavigateToAuth = () => {
    navigate("/auth");
  };

  const handleNavigateToLanding = () => {
    navigate("/");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LandingPage onGetStarted={handleNavigateToAuth} />
          )
        }
      />
      <Route
        path="/auth"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthPage
              onAuthSuccess={handleAuthSuccess}
              onBackToLanding={handleNavigateToLanding}
            />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route
        path="/explore"
        element={
          user ? (
            <ExplorePage user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route
        path="/commitments/new"
        element={
          user ? (
            <CreateCommitmentPage user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route
        path="/commitments/:id"
        element={
          user ? (
            <CommitmentDetailPage user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route
        path="/me"
        element={
          user ? (
            <ProfilePage user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="dark">
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </div>
    </BrowserRouter>
  );
}
