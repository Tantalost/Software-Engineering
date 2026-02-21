import React from "react";

const StatCards = ({ statsData = [] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <div
          key={index}
          className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-md transition"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 tracking-wide uppercase">
              {stat.label}
            </p>
            <span
              className={`h-2.5 w-2.5 rounded-full bg-${stat.color}-500`}
            />
          </div>

          {/* Main Value */}
          <div className="mt-3">
            <h2 className="text-xl font-semibold text-gray-900 leading-tight break-words">
              {stat.value}
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              {stat.subtitle}
            </p>
          </div>

          {/* Progress */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span className="font-normal">Progress</span>
              <span className="font-medium text-gray-600">
                {stat.change}
              </span>
            </div>

            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-${stat.color}-500 transition-all duration-500 ease-out`}
                style={{
                  width: stat.change.includes("%")
                    ? stat.change
                    : "0%",
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
