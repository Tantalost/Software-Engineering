import React from "react";
import { Package, CheckCircle, HelpCircle } from "lucide-react";

const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
  <div className="flex items-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
    <div className={`p-3 rounded-xl ${bgClass} ${colorClass} mr-4`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-black text-slate-800">{value}</h3>
    </div>
  </div>
);

const StatCardGroupLostFound = ({ totalItems, claimedItems, unclaimedItems }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <StatCard
        title="Total Items"
        value={totalItems}
        icon={Package}
        colorClass="text-blue-600"
        bgClass="bg-blue-100"
      />
      <StatCard
        title="Claimed Items"
        value={claimedItems}
        icon={CheckCircle}
        colorClass="text-emerald-600"
        bgClass="bg-emerald-100"
      />
      <StatCard
        title="Unclaimed Items"
        value={unclaimedItems}
        icon={HelpCircle}
        colorClass="text-amber-600"
        bgClass="bg-amber-100"
      />
    </div>
  );
};

export default StatCardGroupLostFound;