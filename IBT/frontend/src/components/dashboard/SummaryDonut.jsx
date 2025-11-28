import React from "react";

const SummaryDonut = () => {
  const donutData = [
    { label: "Tickets", value: "25%", color: "#ef4444", percent: 25 },
    { label: "Bus", value: "25%", color: "#f97316", percent: 25 },
    { label: "Tenants/Lease", value: "20%", color: "#22c55e", percent: 20 },
    { label: "Parking", value: "15%", color: "#3b82f6", percent: 15 },
    { label: "Lost & Found", value: "10%", color: "#eab308", percent: 10 },
  ];

  const totalPercent = donutData.reduce((sum, d) => sum + d.percent, 0);
  const overallPercent = totalPercent > 95 ? 95 : totalPercent;

  const radius = 85;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative rounded-3xl p-8 shadow-2xl overflow-hidden bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600">
     
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-300 opacity-20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-400 opacity-20 rounded-full blur-3xl"></div>

      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20"></div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(0,0,0,0.15),_transparent_50%)]"></div>

      <div className="relative z-10">
        <h3 className="text-white text-3xl font-bold mb-8 tracking-wide drop-shadow-md">
          Summary
        </h3>

        <div className="flex flex-col items-center">
          <div className="relative">
            <svg className="w-56 h-56 transform -rotate-90 drop-shadow-xl">
              <circle
                cx="112"
                cy="112"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="32"
              />

              {donutData.map((segment, idx) => {
                const offset = donutData
                  .slice(0, idx)
                  .reduce((acc, s) => acc + s.percent, 0);
                const dashArray = `${
                  (segment.percent / 100) * circumference
                } ${circumference}`;
                const dashOffset = -((offset / 100) * circumference);
                return (
                  <circle
                    key={idx}
                    cx="112"
                    cy="112"
                    r={radius}
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

              <circle
                cx="112"
                cy="112"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="32"
                strokeDasharray={`${
                  ((100 - overallPercent) / 100) * circumference
                } ${circumference}`}
                strokeDashoffset={-(
                  (overallPercent / 100) *
                  circumference
                )}
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white rounded-full w-40 h-40 flex flex-col items-center justify-center shadow-2xl border-4 border-white/50 backdrop-blur-md">
                <p className="text-6xl font-extrabold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {overallPercent}%
                </p>
                <p className="text-xs text-gray-500 font-bold mt-1">Overall</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-10 text-white w-full">
            {donutData.map((item, idx) => (
              <div
                key={idx}
                className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/25 text-center hover:bg-white/30 transition-all duration-300"
              >
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <p className="text-xs font-semibold tracking-wide">
                    {item.label}
                  </p>
                </div>
                <p className="font-extrabold text-2xl drop-shadow-md">
                  {item.value}
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
