
import React from "react";
import StatCard from "./StatCard";
import { Store, Grid, PhilippinePeso } from "lucide-react"; // Changed PhilippinePesoIcon to PhilippinePeso

const StatCardGroup = ({ availableSlots, nonAvailableSlots, totalSlots, totalRevenue }) => {
  
  // Format the passed revenue prop
  const formattedRevenue = (totalRevenue || 0).toLocaleString("en-PH", {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={Store}
        title="Available Slots"
        value={availableSlots}
        color="emerald"
      />
      <StatCard
        icon={Store}
        title="Occupied Slots"
        value={nonAvailableSlots}
        color="red"
      />
      <StatCard 
        icon={Grid} 
        title="Total Slots" 
        value={totalSlots} 
        color="cyan" 
      />
      <StatCard
        icon={PhilippinePeso}
        value={formattedRevenue}
        title="Total Revenue"
        color="orange"
      />
    </div>
  );
};

export default StatCardGroup;