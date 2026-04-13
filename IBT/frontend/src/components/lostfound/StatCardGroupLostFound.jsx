import React from "react";
import { Package, CheckCircle, HelpCircle } from "lucide-react";

const StatCard = ({ title, value, icon: Icon, mainBg, iconBg, textColor }) => (
  <div className={`flex items-center p-4 rounded-2xl ${mainBg} transition-all`}>
    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${iconBg} ${textColor} mr-4 shrink-0`}>
      <Icon size={24} strokeWidth={2.5} />
    </div>
    <div>
      <p className={`text-sm font-bold ${textColor} mb-0.5`}>{title}</p>
      <h3 className="text-2xl font-black text-slate-800 leading-none">{value}</h3>
    </div>
  </div>
);

const StatCardGroupLostFound = ({ totalItems, claimedItems, unclaimedItems }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <StatCard
        title="Claimed Items"
        value={claimedItems}
        color="emerald"

      />
      <StatCard
        title="Unclaimed Items"
        value={unclaimedItems}
        color="red"
      />
      <StatCard
        title="Total Items" 
        value={totalItems} 
        color="cyan" 
      />
    </div>
  );
};

export default StatCardGroupLostFound;