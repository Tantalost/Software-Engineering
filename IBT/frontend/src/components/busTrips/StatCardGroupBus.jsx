import React from "react";
import StatCard from "../tenants/StatCard";
import { Bus, Clock, CheckCircle, CalendarClock, MapPin, PhilippinePeso } from "lucide-react";

const StatCardGroupBus = ({ totalTrips, scheduledTrips, pendingTrips, arrivedTrips, paidTrips, totalRevenue }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <StatCard title="Total Trips" value={totalTrips} icon={Bus} color="cyan" />
      <StatCard title="Scheduled" value={scheduledTrips} icon={CalendarClock} color="blue" />
      <StatCard title="Pending" value={pendingTrips} icon={Clock} color="orange" />
      <StatCard title="Arrived" value={arrivedTrips} icon={MapPin} color="purple" />
      <StatCard title="Departed" value={paidTrips} icon={CheckCircle} color="emerald" />
      <StatCard 
        title="Revenue" 
        value={totalRevenue ? totalRevenue.toFixed(2) : "0.00"} 
        icon={PhilippinePeso} 
        color="orange" 
      />
    </div>
  );
};

export default StatCardGroupBus;