import React from "react";
import { Package, CheckCircle, HelpCircle } from "lucide-react";
import StatCard from "../tenants/StatCard";

const StatCardGroupLostFound = ({ totalItems, claimedItems, unclaimedItems }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <StatCard
        icon={CheckCircle}
        title="Claimed Items"
        value={claimedItems}
        color="emerald"

      />
      <StatCard
        icon = {HelpCircle}
        title="Unclaimed Items"
        value={unclaimedItems}
        color="red"
      />
      <StatCard
        icon={Package}
        title="Total Items" 
        value={totalItems} 
        color="cyan" 
      />
    </div>
  );
};

export default StatCardGroupLostFound;