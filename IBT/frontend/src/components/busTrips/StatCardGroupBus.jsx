import React from "react";
import { Bus, CheckCircle, Clock, TrendingUp } from "lucide-react";

// Reusable Stat Card Component matching the image design
const StatCard = ({ title, value, icon: Icon, styles }) => (
  <div className={`flex items-center gap-5 rounded-[2rem] p-6 transition-all hover:shadow-md ${styles.bg}`}>
    {/* Icon Container */}
    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${styles.iconBg} ${styles.iconColor}`}>
      <Icon size={32} strokeWidth={2} />
    </div>
    
    {/* Text Content */}
    <div>
      <p className={`text-sm font-bold ${styles.titleColor} mb-0.5`}>{title}</p>
      <h3 className={`text-3xl font-extrabold ${styles.valueColor}`}>{value}</h3>
    </div>
  </div>
);

const StatCardGroupBus = ({ totalTrips, paidTrips, pendingTrips, totalRevenue }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      
      {/* 1. Total Trips - Cyan/Blue Style */}
      <StatCard
        title="Total Trips"
        value={totalTrips}
        icon={Bus}
        styles={{
          bg: "bg-cyan-50",
          iconBg: "bg-cyan-100",
          iconColor: "text-cyan-600",
          titleColor: "text-cyan-700",
          valueColor: "text-cyan-900",
        }}
      />

      {/* 2. Pending - Red/Pink Style */}
      <StatCard
        title="Pending"
        value={pendingTrips}
        icon={Clock}
        styles={{
          bg: "bg-red-50",
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          titleColor: "text-red-800",
          valueColor: "text-red-900",
        }}
      />

      {/* 3. Departed (Paid) - Green Style */}
      <StatCard
        title="Departed (Paid)"
        value={paidTrips}
        icon={CheckCircle}
        styles={{
          bg: "bg-emerald-50",
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-600",
          titleColor: "text-emerald-800",
          valueColor: "text-emerald-900",
        }}
      />

      {/* 4. Total Revenue - Orange Style */}
      <StatCard
        title="Total Revenue"
        value={`₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        icon={TrendingUp}
        styles={{
          bg: "bg-orange-50",
          iconBg: "bg-orange-100",
          iconColor: "text-orange-600",
          titleColor: "text-orange-800",
          valueColor: "text-orange-900",
        }}
      />
    </div>
  );
};

export default StatCardGroupBus;