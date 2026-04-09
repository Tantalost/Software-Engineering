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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
     
      <StatCard icon={Car} title="Cars" value={cars} color="cyan" />
      <StatCard icon={Bike} title="Motorcycles" value={motorcycles} color="orange" />
      <StatCard icon={Bus} title="Jeeps" value={jeeps} color="green" />

      <StatCard icon={MapPin} title="Parked" value={parked} color="blue" />
      <StatCard icon={LogOut} title="Departed" value={departed} color="slate" />

      <StatCard icon={CarFront} title="Total Vehicles" value={totalVehicles} color="black" />
      <StatCard
        icon={PhilippinePesoIcon}
        value={`₱${(totalRevenue || 0).toFixed(2)}`}
        title="Revenue"
        color="emerald"
      />
    </div>
  );
};

export default StatCardGroupPark;