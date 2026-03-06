import React from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

const StatCards = ({ statsData }) => {
  const defaultStats = [
    {
      label: "Tickets",
      value: "0",
      change: "+0%",
      subtitle: "No Data",
      color: "red",
    },
    {
      label: "Bus",
      value: "0",
      change: "+0%",
      subtitle: "No Data",
      color: "yellow",
    },
    {
      label: "Tenants/Lease",
      value: "0",
      change: "+0%",
      subtitle: "No Data",
      color: "green",
    },
    {
      label: "Parking",
      value: "0",
      change: "+0%",
      subtitle: "No Data",
      color: "blue",
    },
  ];

  const stats = statsData && statsData.length > 0 ? statsData : defaultStats;

  const colorMap = {
    red: {
      bgLight: "bg-red-100",
      bgMedium: "bg-red-200",
      bgStrong: "bg-red-300",
      bgCircle: "bg-red-400",
    },
    yellow: {
      bgLight: "bg-yellow-100",
      bgMedium: "bg-yellow-200",
      bgStrong: "bg-yellow-300",
      bgCircle: "bg-yellow-400",
    },
    green: {
      bgLight: "bg-green-100",
      bgMedium: "bg-green-200",
      bgStrong: "bg-green-300",
      bgCircle: "bg-green-400",
    },
    blue: {
      bgLight: "bg-blue-100",
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

            {/* Card Content */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-500 text-sm sm:text-base font-medium mb-2">
                    {stat.label}
                  </p>
                  {/* Value display fixed for up to 10 digits */}
                  <p
                    className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 truncate w-full"
                    style={{ minWidth: "10ch" }}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-6 h-6 ${color.bgCircle} rounded-full shadow-lg`}
                ></div>
              </div>

              {/* Change badge and subtitle */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                {/* % of Target badge */}
                <span
                  className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${badgeStyle}`}
                  style={{
                    flex: "0 0 auto", 
                    maxWidth: "4rem", 
                    minWidth: "2.5rem", 
                    textAlign: "center",
                  }}
                >
                  <Icon size={16} />
                  <span className="uppercase tracking-wide truncate">
                    {cleanChange}
                  </span>
                </span>

                {/* Subtitle / Target Revenue */}
                <span className="text-gray-400 text-xs sm:text-sm font-medium truncate flex-1 min-w-0">
                  {stat.subtitle}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatCards;
