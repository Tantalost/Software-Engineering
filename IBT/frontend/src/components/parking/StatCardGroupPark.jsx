import React from "react";
import StatCard from "../tenants/StatCard";
import {
  Car,
  Bike,
  Bus,
  CarFront,
  PhilippinePesoIcon,
  MapPin,
  LogOut
} from "lucide-react";

const StatCardGroupPark = ({
  cars,
  motorcycles,
  jeeps,
  parked,
  departed,
  totalVehicles,
  totalRevenue,
}) => {
  return (
    <div className="flex overflow-x-auto gap-4 mb-6 pb-4 snap-x">
      
      <div className="min-w-[240px] shrink-0 snap-start">
        <StatCard icon={Car} title="4 Wheels" value={cars} color="cyan" />
      </div>
      <div className="min-w-[240px] shrink-0 snap-start">
        <StatCard icon={Bike} title="2 Wheels" value={motorcycles} color="orange" />
      </div>
      <div className="min-w-[240px] shrink-0 snap-start">
        <StatCard icon={Bus} title="Jeeps" value={jeeps} color="green" />
      </div>

      <div className="min-w-[240px] shrink-0 snap-start">
        <StatCard icon={MapPin} title="Parked" value={parked} color="blue" />
      </div>
      <div className="min-w-[240px] shrink-0 snap-start">
        <StatCard icon={LogOut} title="Departed" value={departed} color="slate" />
      </div>

      <div className="min-w-[240px] shrink-0 snap-start">
        <StatCard icon={CarFront} title="Total Vehicles" value={totalVehicles} color="black" />
      </div>
      <div className="min-w-[240px] shrink-0 snap-start">
        <StatCard
          icon={PhilippinePesoIcon}
          value={`₱${(totalRevenue || 0).toFixed(2)}`}
          title="Revenue"
          color="emerald"
        />
      </div>

    </div>
  );
};

export default StatCardGroupPark;