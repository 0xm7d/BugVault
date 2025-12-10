import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardPage from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import LandingPage from "./pages/Landing";
import VulnerabilitiesPage from "./pages/Vulnerabilities";
import BugDetailsPage from "./pages/BugDetails";
import VulnerabilityFormPage from "./pages/VulnerabilityForm";
import SettingsPage from "./pages/Settings";
import Layout from "./components/Layout";
import { getProfile } from "./api/client";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log("App component rendered", { user, loading });

  useEffect(() => {
    getProfile()
      .then((data) => setUser(data))
      .catch((err) => {
        console.log("Not authenticated:", err.message);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-700 dark:text-slate-300">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={setUser} />} />
      <Route path="/register" element={<RegisterPage onLogin={setUser} />} />
      <Route path="/" element={<LandingPage />} />
      <Route
        element={
          user ? <Layout user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />
        }
      >
        <Route path="/dashboard" element={<DashboardPage user={user} onUserUpdate={setUser} />} />
        <Route path="/bugs" element={<VulnerabilitiesPage user={user} />} />
        <Route path="/bugs/new" element={<VulnerabilityFormPage user={user} />} />
        <Route path="/bugs/:id" element={<BugDetailsPage user={user} />} />
        <Route path="/bugs/:id/edit" element={<VulnerabilityFormPage user={user} />} />
        <Route path="/settings" element={<SettingsPage user={user} onLogout={() => setUser(null)} />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;

