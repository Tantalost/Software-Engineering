import React from "react";
import StatCard from "./StatCard";
import { Store, Grid, PhilippinePesoIcon } from "lucide-react";

const StatCardGroup = ({ availableSlots, nonAvailableSlots, totalSlots }) => {
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
        title="Non-Available Slots"
        value={nonAvailableSlots}
        color="red"
      />
      <StatCard icon={Grid} title="Total Slots" value={totalSlots} color="cyan" />

      <StatCard
        icon={PhilippinePesoIcon}
        title="Revenue"
        color="orange"
      />
    </div>
  );
};

export default StatCardGroup;
