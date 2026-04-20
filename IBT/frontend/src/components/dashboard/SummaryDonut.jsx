import React from "react";

const SummaryDonut = ({ data = [], quota = 0 }) => {
  // CALC TOTAL REV
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  const formatCurrencyFull = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  
  // CALC OV PERC vs Quota
  const overallPercent = quota > 0 ? Math.round((totalValue / quota) * 100) : 0;
  
  // PROCESS DATA FOR DONUT
  const processedData = data.map(item => ({
    ...item,
    percent: quota > 0 ? (item.value / quota) * 100 : 0
  }));

  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const displayPercent = overallPercent > 100 ? 100 : overallPercent;

  return (
    <div className="relative rounded-3xl p-8 shadow-2xl overflow-hidden bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600">
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-300 opacity-20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-400 opacity-20 rounded-full blur-3xl"></div>
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20"></div>

      <div className="relative z-10">
        <h3 className="text-white text-3xl font-bold mb-8 tracking-wide drop-shadow-md">
          Revenue Goal
        </h3>

        <div className="flex flex-col items-center">
          <div className="relative">
            <svg className="w-56 h-56 transform -rotate-90 drop-shadow-xl">
              <circle
                cx="112" cy="112" r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="32"
              />

              {processedData.map((segment, idx) => {
                const offset = processedData
                  .slice(0, idx)
                  .reduce((acc, s) => acc + s.percent, 0);
                
                const dashArray = `${(segment.percent / 100) * circumference} ${circumference}`;
                const dashOffset = -((offset / 100) * circumference);

                return (
                  <circle
                    key={idx}
                    cx="112" cy="112" r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="32"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 hover:opacity-90"
                  />
                );
              })}
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white rounded-full w-40 h-40 flex flex-col items-center justify-center shadow-2xl border-4 border-white/50 backdrop-blur-md">
                <p className="text-5xl font-extrabold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {overallPercent}%
                </p>
                <p className="text-xs text-gray-500 font-bold mt-1">of Target</p>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                    Target: ₱{formatCurrencyFull(quota)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-10 text-white w-full">
            {processedData.map((item, idx) => (
              <div key={idx} className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/25 text-center hover:bg-white/30 transition-all duration-300">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <p className="text-xs font-semibold tracking-wide">{item.name}</p>
                </div>
                <p className="font-extrabold text-xl drop-shadow-md">
                  ₱{formatCurrencyFull(item.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDonut;