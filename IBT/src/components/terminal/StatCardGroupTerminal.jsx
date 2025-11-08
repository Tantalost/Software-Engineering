import React from "react";
import StatCard from "../tenants/StatCard";
import { User, GraduationCap, HeartPulse, UsersRound,  PhilippinePesoIcon} from "lucide-react";

const StatCardGroupTerminal = ({ regular, student, senior, totalPassengers, totalRevenue }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
      <StatCard
        icon={User}
        title="Regular"
        value={regular}
        color="red"
      />
      <StatCard
        icon={GraduationCap}
        title="Student"
        value={student}
        color="cyan"
      />

      <StatCard
        icon={HeartPulse}
        title="Senior Citizen/PWD"
        value={senior}
        color="yellow"
      />

       <StatCard icon={UsersRound} title="Total Passengers" value={totalPassengers}  color="emerald" />

      <StatCard
        icon={PhilippinePesoIcon}
        value={`₱${totalRevenue.toFixed(2)}`}
        title="Total Revenue"
        color="orange"
      />
    </div>
  );
};

export default StatCardGroupTerminal;