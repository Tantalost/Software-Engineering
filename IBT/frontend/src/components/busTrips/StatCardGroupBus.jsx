import React from "react";
import StatCard from "../tenants/StatCard";
import { Bus, CheckCircle, Clock, TrendingUp, PhilippinePeso } from "lucide-react";

const StatCardGroupBus = ({ totalTrips, paidTrips, pendingTrips, totalRevenue }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-10 mb-6">
      
      <StatCard
        title="Total Trips"
        value={totalTrips}
        icon={Bus}
        color="cyan"
      />

      <StatCard
        title="Pending"
        value={pendingTrips}
        icon={Clock}
        color="red"
      />

      <StatCard
        title="Departed (Paid)"
        value={paidTrips}
        icon={CheckCircle}
        color="emerald"
      />

      <StatCard
        title="Total Revenue"
        /* Updated to use PhilippinePeso and consistent orange color */
        icon={PhilippinePeso}
        value={totalRevenue.toFixed(2)}
        color="orange"
      />
    </div>
  );
};

export default StatCardGroupBus;