import React from "react";
import StatCard from "../tenants/StatCard";
import { Car, Bike, CarFront,  PhilippinePesoIcon} from "lucide-react";

const StatCardGroupPark = ({ cars, motorcycles, totalVehicles, totalRevenue }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={Car}
        title="Cars"
        value={cars}
        color="cyan"
      />
      <StatCard
        icon={Bike}
        title="Motorcycles"
        value={motorcycles}
        color="red"
      />

      <StatCard
        icon={PhilippinePesoIcon}
        value={totalVehicles}
        title="Revenue"
        color="orange"
      />
      <StatCard icon={CarFront} title="Total Vehicles" value={`₱${totalRevenue.toFixed(2)}`} color="emerald" />
    </div>
  );
};

export default StatCardGroupPark;