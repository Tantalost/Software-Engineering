import React from "react";

const SummaryDonut = () => {
  const donutData = [
    { label: "Tickets", value: "25%", color: "red", percent: 25 },
    { label: "Bus", value: "25%", color: "orange", percent: 25 },
    { label: "Tenants/Lease", value: "20%", color: "green", percent: 20 },
    { label: "Parking", value: "30%", color: "#3b82f6", percent: 30 },
    { label: "Lost & Found", value: "25%", color: "yellow", percent: 25 },
  ];

  const circumference = 2 * Math.PI * 80;
  const overallPercent = Math.round(
    donutData.reduce((sum, d) => sum + d.percent, 0) / donutData.length
  );

  return (
    <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-8 shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),_transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(0,0,0,0.05),_transparent_50%)]"></div>

      <div className="relative z-10">
        <h3 className="text-white text-2xl font-bold mb-6">Summary</h3>

        <div className="flex flex-col items-center">
          <div className="relative">
            <svg className="w-56 h-56 transform -rotate-90 drop-shadow-2xl">
              
              <circle
                cx="112"
                cy="112"
                r="85"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="32"
              />
             
              {donutData.map((segment, idx) => {
                const offset = donutData
                  .slice(0, idx)
                  .reduce((acc, s) => acc + s.percent, 0);
                const dashArray = `${(segment.percent / 100) * circumference} ${circumference}`;
                const dashOffset = -((offset / 100) * circumference);
                return (
                  <circle
                    key={idx}
                    cx="112"
                    cy="112"
                    r="85"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="32"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-500 hover:opacity-90"
                  />
                );
              })}
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white rounded-full w-40 h-40 flex flex-col items-center justify-center shadow-2xl border-4 border-white/50">
                <p className="text-6xl font-extrabold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {overallPercent}%
                </p>
                <p className="text-xs text-gray-500 font-bold mt-1">Overall</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-8 text-white w-full">
            {donutData.map((item, idx) => (
              <div
                key={idx}
                className="text-white bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center hover:bg-white/25 transition-all"
              >
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <p className="text-xs font-semibold">{item.label}</p>
                </div>
                <p className="font-extrabold text-2xl">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDonut;
