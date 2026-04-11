import React from "react";
import StatCard from "../tenants/StatCard";
import {
  Bus,
  CalendarClock,
  CheckCircle,
  MapPin,
  PhilippinePeso,
  AlertTriangle,
  Wrench,
} from "lucide-react";

const StatCardGroupBus = ({
  totalTrips,
  predefinedSchedules,
  arrivedTrips,
  paidTrips,
  maintenanceTrips,
  totalRevenue,
  missedTrips,
}) => {
  return (
    <div className="flex overflow-x-auto gap-4 mb-6 pb-4 w-full snap-x">
      
      <div className="min-w-[180px] sm:min-w-[220px] flex-shrink-0 snap-start">
        <StatCard title="Total Trips" value={totalTrips} icon={Bus} color="cyan" />
      </div>

      <div className="min-w-[180px] sm:min-w-[220px] flex-shrink-0 snap-start">
        <StatCard title="Predefined Schedule" value={predefinedSchedules} icon={CalendarClock} color="orange" />
      </div>

      <div className="min-w-[180px] sm:min-w-[220px] flex-shrink-0 snap-start">
        <StatCard title="Arrived" value={arrivedTrips} icon={MapPin} color="purple" />
      </div>

      <div className="min-w-[180px] sm:min-w-[220px] flex-shrink-0 snap-start">
        <StatCard title="Departed" value={paidTrips} icon={CheckCircle} color="emerald" />
      </div>

      <div className="min-w-[180px] sm:min-w-[220px] flex-shrink-0 snap-start">
        <StatCard title="Under Maintenance" value={maintenanceTrips || 0} icon={Wrench} color="red" />
      </div>

      <div className="min-w-[180px] sm:min-w-[220px] flex-shrink-0 snap-start">
        <StatCard title="Missed Buses" value={missedTrips || 0} icon={AlertTriangle} color="orange" />
      </div>

      <div className="min-w-[180px] sm:min-w-[220px] flex-shrink-0 snap-start">
        <StatCard 
          title="Revenue" 
          value={totalRevenue ? totalRevenue.toFixed(2) : "0.00"} 
          icon={PhilippinePeso} 
          color="orange" 
        />
      </div>

    </div>
  );
};

export default StatCardGroupBus;