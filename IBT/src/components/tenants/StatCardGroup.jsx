import React from "react";
import StatCard from "./StatCard";
import { CheckCircle, XCircle, Grid } from "lucide-react";

const StatCardGroup = ({ availableSlots, nonAvailableSlots, totalSlots }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <StatCard
        icon={CheckCircle}
        title="Available Slots"
        value={availableSlots}
        color="emerald"
      />
      <StatCard
        icon={XCircle}
        title="Non-Available Slots"
        value={nonAvailableSlots}
        color="red"
      />
      <StatCard icon={Grid} title="Total Slots" value={totalSlots} color="cyan" />
    </div>
  );
};

export default StatCardGroup;
