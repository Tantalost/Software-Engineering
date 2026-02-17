import React from "react";

const StatCards = ({ stats }) => {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
        <span className={`h-2 w-2 rounded-full bg-${stat.color}-500`} />
      </div>

      {/* Revenue */}
      <h2 className="mt-2 text-2xl font-bold text-gray-900 tracking-tight">
        {stat.value}
      </h2>

      {/* Target */}
      <p className="mt-1 text-xs text-gray-500">{stat.subtitle}</p>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{stat.change}</span>
        </div>

        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-${stat.color}-500`}
            style={{ width: stat.change }}
          />
        </div>
      </div>
    </div>
  );
};

export default StatCards;
