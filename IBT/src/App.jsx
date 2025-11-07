import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogIn";
import Dashboard from "./pages/Dashboard";
import BusesTrips from "./pages/BusesTrips";
import TerminalFees from "./pages/TerminalFees";
import TenantLease from "./pages/TenantLease";
import Parking from "./pages/Parking";
import LostFound from "./pages/LostFound";
import Reports from "./pages/Reports";
import NotFound from "./components/NotFound";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

const PrivateRoute = ({ children, allowedRoles }) => {
  const isLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
  const role = localStorage.getItem("authRole") || "superadmin";
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/parking" replace />;
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AdminLogin />} />

      {/* Superadmin full access */}
      <Route path="/dashboard" element={<PrivateRoute allowedRoles={["superadmin"]}> <Dashboard /> </PrivateRoute>} />
      <Route path="/buses-trips" element={<PrivateRoute allowedRoles={["superadmin"]}> <BusesTrips /> </PrivateRoute>} />
      <Route path="/tickets" element={<PrivateRoute allowedRoles={["superadmin"]}> <TerminalFees /> </PrivateRoute>} />
      <Route path="/tenant-lease" element={<PrivateRoute allowedRoles={["superadmin"]}> <TenantLease /> </PrivateRoute>} />
      <Route path="/lost-found" element={<PrivateRoute allowedRoles={["superadmin"]}> <LostFound /> </PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute allowedRoles={["superadmin"]}> <Reports /> </PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute allowedRoles={["superadmin"]}> <Settings /> </PrivateRoute>} />

      {/* Parking admin restricted access */}
      <Route path="/parking" element={<PrivateRoute allowedRoles={["superadmin", "parking"]}> <Parking /> </PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute allowedRoles={["superadmin", "parking"]}> <Notifications /> </PrivateRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
