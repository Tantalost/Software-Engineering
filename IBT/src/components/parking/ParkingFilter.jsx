import React from "react";

const ParkingFilter = ({ activeType, onTypeChange }) => {
  const statuses = ["All", "Car", "Motorcycle"];

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1">
      {statuses.map((type) => (
        <button
          key={type}
          onClick={() => onTypeChange(type)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            activeType === type
              ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
};

export default ParkingFilter;