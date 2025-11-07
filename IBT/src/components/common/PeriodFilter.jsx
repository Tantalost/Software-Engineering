import React from "react";

const PeriodFilter = ({ selectedPeriod, setSelectedPeriod }) => {
  const periods = ["This Week", "This Month", "This Year"];

  return (
    <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm gap-2 flex-grow sm:flex-none w-full sm:w-auto">
      <label className="text-gray-500 text-sm mr-2 whitespace-nowrap">
        Period:
      </label>
      <div className="flex gap-1">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPeriod(selectedPeriod === p ? "" : p)}
            className={`px-3 py-1 text-sm rounded-lg border transition-all ${
              selectedPeriod === p
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PeriodFilter;
