import React from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

const StatCards = ({ statsData }) => {
  const defaultStats = [
    {
      label: "Tickets",
      value: "0",
      change: "+0%",
      subtitle: "Target: 0",
      color: "red",
    },
    {
      label: "Bus",
      value: "0",
      change: "+0%",
      subtitle: "Target: 0",
      color: "yellow",
    },
    {
      label: "Tenants/Lease",
      value: "0",
      change: "+0%",
      subtitle: "Target: 0",
      color: "green",
    },
    {
      label: "Parking",
      value: "0",
      change: "+0%",
      subtitle: "Target: 0",
      color: "blue",
    },
  ];

  const stats = statsData && statsData.length > 0 ? statsData : defaultStats;

  const colorMap = {
    red: {
      bgMedium: "bg-red-200",
      bgStrong: "bg-red-300",
      bgCircle: "bg-red-400",
    },
    yellow: {
      bgMedium: "bg-yellow-200",
      bgStrong: "bg-yellow-300",
      bgCircle: "bg-yellow-400",
    },
    green: {
      bgMedium: "bg-green-200",
      bgStrong: "bg-green-300",
      bgCircle: "bg-green-400",
    },
    blue: {
      bgMedium: "bg-blue-200",
      bgStrong: "bg-blue-300",
      bgCircle: "bg-blue-400",
    },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {stats.map((stat, idx) => {
        const color = colorMap[stat.color] || colorMap.red;
        const changeText = stat.change || "";
        const isPositive = changeText.startsWith("+");
        const isNegative = changeText.startsWith("-");
        const cleanChange = changeText.replace("+", "").replace("-", "");

        let badgeStyle = "bg-blue-50 text-blue-600";
        let Icon = Activity;

        if (isPositive) {
          badgeStyle = "bg-green-100 text-green-700";
          Icon = TrendingUp;
        } else if (isNegative) {
          badgeStyle = "bg-red-100 text-red-700";
          Icon = TrendingDown;
        }

        return (
          <div
            key={idx}
            className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden hover:-translate-y-1 sm:hover:-translate-y-2 transform"
          >
            {/* Decorative Circle */}
            <div
              className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-3xl bg-gradient-to-br ${color.bgMedium} ${color.bgStrong} transition-transform duration-500 group-hover:scale-110`}
            ></div>

            <div className="relative z-10">
              {/* Top Section */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-full">
                  <p className="text-gray-500 text-sm sm:text-base font-medium mb-2">
                    {stat.label}
                  </p>

                  {/* Revenue / Value */}
                  <p
                    className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 truncate"
                    style={{ minWidth: "10ch" }}
                  >
                    {stat.value}
                  </p>

                  {/* Target Revenue (supports 10 digits) */}
                  <p
                    className="text-gray-400 text-xs sm:text-sm font-medium mb-3 truncate"
                    style={{ minWidth: "10ch" }}
                  >
                    {stat.subtitle}
                  </p>

                  {/* Percentage Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold ${badgeStyle}`}
                  >
                    <Icon size={14} />
                    <span className="tabular-nums leading-none">
                      {cleanChange}
                    </span>
                  </span>
                </div>

                {/* Small Circle Indicator */}
                <div
                  className={`w-6 h-6 ${color.bgCircle} rounded-full shadow-lg`}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatCards;