import React from "react";
import StatCard from "../tenants/StatCard";
import { User, UsersRound,  PhilippinePesoIcon} from "lucide-react";

const StatCardGroupTerminal = ({ regular, student, senior, totalPassengers, totalRevenue }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-10 mb-6">
      <StatCard
        icon={User}
        title="Regular"
        value={regular}
        color="red"
      />
     
      <StatCard
        icon={UsersRound }
        title="Senior/PWD/Student"
        value={senior + student}
        color="cyan"
      />

       <StatCard icon={UsersRound} title="Total Passengers" value={totalPassengers}  color="emerald" />

      <StatCard
        icon={PhilippinePesoIcon}
        value={`${totalRevenue.toFixed(2)}`}
        title="Total Revenue"
        color="orange"
      />
    </div>
  );
};

export default StatCardGroupTerminal;