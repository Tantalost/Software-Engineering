import React from "react";

const StatCard = ({ icon: Icon, title, value, color = "emerald" }) => {
  const colorStyles = {
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      iconBg: "bg-emerald-100",
      icon: "text-emerald-600",
      value: "text-emerald-800",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      iconBg: "bg-red-100",
      icon: "text-red-600",
      value: "text-red-800",
    },
    cyan: {
      bg: "bg-cyan-50",
      border: "border-cyan-200",
      text: "text-cyan-700",
      iconBg: "bg-cyan-100",
      icon: "text-cyan-600",
      value: "text-cyan-800",
    },

     orange: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-700",
      iconBg: "bg-yellow-100",
      icon: "text-yellow-600",
      value: "text-yellow-800",
    },

      orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-700",
      iconBg: "bg-orange-100",
      icon: "text-orange-600",
      value: "text-orange-800",
    },
  };

  const style = colorStyles[color] || colorStyles.emerald;

  return (
    <div
      className={`flex items-center gap-4 ${style.bg} ${style.border} rounded-2xl p-4 shadow-sm hover:shadow-md transition`}
    >
      <div className={`${style.iconBg} p-3 rounded-full`}>
        <Icon className={`${style.icon} w-6 h-6`} />
      </div>
      <div>
        <h3 className={`text-sm font-medium ${style.text}`}>{title}</h3>
        <p className={`text-2xl font-bold ${style.value}`}>{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
