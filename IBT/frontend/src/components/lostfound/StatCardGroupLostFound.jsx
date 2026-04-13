import React from "react";
import { Package, CheckCircle, HelpCircle } from "lucide-react";
const StatCard = ({ title, value, icon: Icon, color }) => {

  const colorStyles = {
    emerald: { mainBg: "bg-emerald-50", iconBg: "bg-emerald-100", textColor: "text-emerald-700" },
    red: { mainBg: "bg-red-50", iconBg: "bg-red-100", textColor: "text-red-600" },
    cyan: { mainBg: "bg-cyan-50", iconBg: "bg-cyan-100", textColor: "text-cyan-700" },
    orange: { mainBg: "bg-orange-50", iconBg: "bg-orange-100", textColor: "text-orange-600" },
  };

  const styles = colorStyles[color] || colorStyles.cyan;

  return (
    <div className={`flex items-center p-4 rounded-2xl ${styles.mainBg} transition-all`}>
      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${styles.iconBg} ${styles.textColor} mr-4 shrink-0`}>
        {Icon && <Icon size={24} strokeWidth={2.5} />}
      </div>
      <div>
        <p className={`text-sm font-bold ${styles.textColor} mb-0.5`}>{title}</p>
        <h3 className="text-2xl font-black text-slate-800 leading-none">{value}</h3>
      </div>
    </div>
  );
};

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
        icon={HelpCircle}
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