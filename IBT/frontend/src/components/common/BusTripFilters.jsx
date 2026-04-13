import React from "react";
import { Search } from "lucide-react";

const BusTripFilters = ({
  searchQuery,
  setSearchQuery,
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
      
      <div className="relative w-full sm:w-64 shrink-0">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="w-full pl-10 pr-4 h-[42px] border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-slate-700 placeholder-slate-400 transition-all outline-none"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
          size={18}
        />
      </div>

      <select
        value={selectedCompany}
        onChange={(e) => setSelectedCompany(e.target.value)}
        className="w-full sm:w-auto h-[42px] px-3 border border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 cursor-pointer transition-all"
      >
        <option value="">All Companies</option>
        {uniqueCompanies.map((company) => (
          <option key={company} value={company}>
            {company}
          </option>
        ))}
      </select>

      <select
        value={selectedBusType}
        onChange={(e) => setSelectedBusType(e.target.value)}
        className="w-full sm:w-auto h-[42px] px-3 border border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 cursor-pointer transition-all"
      >
        <option value="">All Types</option>
        <option value="Regular">Regular</option>
        <option value="Aircon">Aircon</option>
      </select>

      <select
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
        className="w-full sm:w-auto h-[42px] px-3 border border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 cursor-pointer transition-all"
      >
        <option value="">All Status</option>
        <option value="Expected">Expected</option>
        <option value="Arrived">Arrived</option>
        <option value="Departed">Departed</option>
      </select>
    </div>
  );
};

export default BusTripFilters;