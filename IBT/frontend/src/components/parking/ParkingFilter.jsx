import React from "react";

const ParkingFilter = ({ activeType, onTypeChange }) => {
  const statuses = ["All", "4 Wheels", "2 Wheels", "Jeep"];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {statuses.map((type) => (
        <button
          key={type}
          onClick={() => onTypeChange(type)}
          className={`h-[42px] px-4 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            activeType === type
              ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md border border-transparent"
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