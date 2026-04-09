import React from "react";
import { Search } from "lucide-react";

const FilterBar = ({
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-slate-700 placeholder-slate-400 transition-all"
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={18}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;