import React from "react";
import { ChevronDown } from "lucide-react";

const BusTripFilters = ({
  selectedCompany,
  setSelectedCompany,
  uniqueCompanies,
  selectedBusType,
  setSelectedBusType,
  selectedStatus,
  setSelectedStatus,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 w-full">
      
      <div className="relative w-full sm:w-auto shrink-0">
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="w-full appearance-none h-[42px] pl-3 pr-12 border border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 cursor-pointer transition-all"
        >
          <option value="">All Companies</option>
          {uniqueCompanies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none pr-3">
          <div className="border-l border-slate-200 pl-2 h-5 flex items-center justify-center">
            <ChevronDown size={16} className="text-slate-500" />
          </div>
        </div>
      </div>

      <div className="relative w-full sm:w-auto shrink-0">
        <select
          value={selectedBusType}
          onChange={(e) => setSelectedBusType(e.target.value)}
          className="w-full appearance-none h-[42px] pl-3 pr-12 border border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 cursor-pointer transition-all"
        >
          <option value="">All Types</option>
          <option value="Regular">Regular</option>
          <option value="Aircon">Aircon</option>
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none pr-3">
          <div className="border-l border-slate-200 pl-2 h-5 flex items-center justify-center">
            <ChevronDown size={16} className="text-slate-500" />
          </div>
        </div>
      </div>

      <div className="relative w-full sm:w-auto shrink-0">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full appearance-none h-[42px] pl-3 pr-12 border border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 cursor-pointer transition-all"
        >
          <option value="">All Status</option>
          <option value="Expected">Expected</option>
          <option value="Arrived">Arrived</option>
          <option value="Departed">Departed</option>
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none pr-3">
          <div className="border-l border-slate-200 pl-2 h-5 flex items-center justify-center">
            <ChevronDown size={16} className="text-slate-500" />
          </div>
        </div>
      </div>

    </div>
  );
};

export default BusTripFilters;