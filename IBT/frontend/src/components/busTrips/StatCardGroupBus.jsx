import React from "react";
import StatCard from "../tenants/StatCard";
import { Bus, Clock, CheckCircle, CalendarClock, MapPin } from "lucide-react";

const StatCardGroupBus = ({ totalTrips, scheduledTrips, pendingTrips, arrivedTrips, paidTrips }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <StatCard title="Total Trips" value={totalTrips} icon={Bus} color="cyan" />
      <StatCard title="Scheduled" value={scheduledTrips} icon={CalendarClock} color="blue" />
      <StatCard title="Pending" value={pendingTrips} icon={Clock} color="orange" />
      <StatCard title="Arrived" value={arrivedTrips} icon={MapPin} color="purple" />
      <StatCard title="Departed" value={paidTrips} icon={CheckCircle} color="emerald" />
    </div>
  );
};

export default StatCardGroupBus;