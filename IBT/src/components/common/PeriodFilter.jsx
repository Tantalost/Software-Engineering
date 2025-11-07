import React from "react";

const PeriodFilter = ({ selectedPeriod, setSelectedPeriod }) => {
  const periods = ["This Week", "This Month", "This Year"];

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2 w-full mt-2">
      <label className="text-gray-600 text-sm font-medium">Period:</label>
      <div className="flex gap-2">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPeriod(selectedPeriod === p ? "" : p)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
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
