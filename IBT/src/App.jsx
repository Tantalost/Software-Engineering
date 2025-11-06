import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogIn";
import Dashboard from "./pages/Dashboard";
import BusesParking from "./pages/BusesParking";
import TerminalFees from "./pages/TerminalFees";
import TenantLease from "./pages/TenantLease";
import Parking from "./pages/Parking";
import LostFound from "./pages/LostFound";
import Reports from "./pages/Reports";
import NotFound from "./components/NotFound";

const PrivateRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AdminLogin />} />

      <Route path="/dashboard" element={<PrivateRoute> <Dashboard /> </PrivateRoute>} />
      <Route path="/buses-parking" element={ <PrivateRoute> <BusesParking /> </PrivateRoute>} />
      <Route path="/tickets" element={ <PrivateRoute> <TerminalFees /> </PrivateRoute>} />
      <Route path="/tenant-lease" element={ <PrivateRoute> <TenantLease /> </PrivateRoute>} />
      <Route path="/parking" element={ <PrivateRoute> <Parking /> </PrivateRoute>} />
      <Route path="/lost-found" element={ <PrivateRoute> <LostFound /> </PrivateRoute>} />
      <Route path="/reports" element={ <PrivateRoute> <Reports /> </PrivateRoute>} />
  
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
