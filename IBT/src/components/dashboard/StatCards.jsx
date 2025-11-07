import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react"; 

const StatCards = ({ statsData }) => {
  const defaultStats = [
    { label: "Tickets", value: "5,768", change: "10%", subtitle: "From last month", color: "red" },
    { label: "Bus", value: "5,768", change: "5%", subtitle: "From last month", color: "yellow" },
    { label: "Tenants/Lease", value: "5,768", change: "8%", subtitle: "From last month", color: "green" },
    { label: "Parking", value: "5,768", change: "2%", subtitle: "From last month", color: "blue" },
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
      {stats.map((stat, idx) => {
        const color = colorMap[stat.color] || colorMap.red;
        const isPositive = stat.change.startsWith("+");
        const cleanChange = stat.change.replace("+", "").replace("-", "");

        return (
          <div
            key={idx}
            className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden"
          >
            <div
              className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${color.bgMedium} ${color.bgStrong} rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-125 transition-transform duration-700`}
            ></div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-600 text-base font-semibold mb-3">{stat.label}</p>
                  <p className="text-6xl font-extrabold text-gray-900 mb-4">{stat.value}</p>
                </div>
                <div className={`w-6 h-6 ${color.bgCircle} rounded-full shadow-lg`}></div>
              </div>

              <div className="flex items-center space-x-3">
                <span
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold ${
                    isPositive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {isPositive ? (
                    <>
                      <TrendingUp size={16} />
                      {cleanChange}
                    </>
                  ) : (
                    <>
                      <TrendingDown size={16} />
                       {cleanChange}
                    </>
                  )}
                </span>
                <span className="text-gray-500 text-sm font-medium">{stat.subtitle}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatCards;
