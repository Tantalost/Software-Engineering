import React from "react";

const StatusBadge = ({ status }) => {
  const colors = {
    paid: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    active: "bg-green-100 text-green-700 border border-green-200",
    pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    overdue: "bg-red-100 text-red-700 border border-red-200",
    delayed: "bg-orange-100 text-orange-700 border border-orange-200",
    unclaimed: "bg-red-100 text-red-700 border border-red-200",
    claimed: "bg-green-100 text-green-700 border border-green-200",
    completed: "bg-slate-100 text-slate-700 border border-slate-200",
  };

  // FIX: Wrap in String() to prevent crash if status is a number or null
  const safeStatus = String(status || ""); 
  const key = safeStatus.toLowerCase();
  
  const colorClass = colors[key] || "bg-gray-100 text-gray-700 border border-gray-200";

  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${colorClass}`}>
      {/* Display the safe text, defaulting to "Unknown" if empty */}
      {safeStatus || "Unknown"}
    </span>
  );
};

export default StatusBadge;