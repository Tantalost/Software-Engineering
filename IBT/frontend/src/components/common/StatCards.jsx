import React from "react";

const StatCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`flex items-center gap-4 ${stat.bgColor}  rounded-2xl p-4 shadow-sm hover:shadow-md transition`}
        >
          <div className={`${stat.iconBg} p-3 rounded-full`}>
            {stat.icon}
          </div>
          <div>
            <h3 className={`text-sm font-medium ${stat.textColor}`}>{stat.label}</h3>
            <p className={`text-2xl font-bold ${stat.valueColor}`}>{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
