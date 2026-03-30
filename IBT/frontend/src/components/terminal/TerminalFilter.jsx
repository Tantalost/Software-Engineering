import React from "react";

const TerminalFilter = ({ activeType, onTypeChange }) => {
  const statuses = ["All", "Regular", "Student/Senior/PWD"];

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1">
      {statuses.map((passengerType) => (
        <button
          key={passengerType}
          onClick={() => onTypeChange(passengerType)}
          className={`inline-flex h-[42px] items-center justify-center px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            activeType === passengerType
              ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          {passengerType}
        </button>
      ))}
    </div>
  );
};

export default TerminalFilter;