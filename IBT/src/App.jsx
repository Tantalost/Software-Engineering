import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import BusesTrips from "./pages/BusesTrips";
import TenantLease from "./pages/TenantLease";
import Parking from "./pages/Parking";
import LostFound from "./pages/LostFound";
import NotFound from "./components/NotFound";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/buses-trips" element={<BusesTrips />} />
      <Route path="/tenant-lease" element={<TenantLease />} />
      <Route path="/parking" element={<Parking />} />
      <Route path="/lost-found" element={<LostFound />} />
      <Route path="/*" element={<NotFound />} />
      {/* Add other routes as necessary */}
    </Routes>
  );
};

export default App;
