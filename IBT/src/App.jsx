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
import DeletionRequests from "./pages/DeletionRequests";
import NotFound from "./components/NotFound";
import Notifications from "./pages/Notifications";
import EmployeeManage from "./pages/EmployeeManage";
import Archive from "./pages/Archive";

const PrivateRoute = ({ children, allowedRoles }) => {
  const isLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
  const role = localStorage.getItem("authRole") || "superadmin";
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "parking") return <Navigate to="/parking" replace />;
    if (role === "lostfound") return <Navigate to="/lost-found" replace />;
    
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AdminLogin />} />

      <Route path="/dashboard" element={<PrivateRoute allowedRoles={["superadmin"]}> <Dashboard /> </PrivateRoute>} />
      <Route path="/buses-trips" element={<PrivateRoute allowedRoles={["superadmin"]}> <BusesTrips /> </PrivateRoute>} />
      <Route path="/tickets" element={<PrivateRoute allowedRoles={["superadmin"]}> <TerminalFees /> </PrivateRoute>} />
      <Route path="/tenant-lease" element={<PrivateRoute allowedRoles={["superadmin"]}> <TenantLease /> </PrivateRoute>} />
      <Route path="/lost-found" element={<PrivateRoute allowedRoles={["superadmin","lostfound"]}> <LostFound /> </PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute allowedRoles={["superadmin"]}> <Reports /> </PrivateRoute>} />
      <Route path="/deletion-requests" element={<PrivateRoute allowedRoles={["superadmin"]}> <DeletionRequests /> </PrivateRoute>} />
      <Route path="/employee-management" element={<PrivateRoute allowedRoles={["superadmin"]}> <EmployeeManage /> </PrivateRoute>} />
      <Route path="/parking" element={<PrivateRoute allowedRoles={["superadmin", "parking"]}> <Parking /> </PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute allowedRoles={["superadmin", "parking", "lostfound"]}> <Notifications /> </PrivateRoute>} />
      <Route path="/archive" element={<PrivateRoute allowedRoles={["superadmin", "parking", "lostfound"]}> <Archive /> </PrivateRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
