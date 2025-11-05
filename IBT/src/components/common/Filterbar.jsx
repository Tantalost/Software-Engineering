import React from "react";
import { Search } from "lucide-react";

const FilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedDate,
  setSelectedDate,
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
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-gray-700 placeholder-gray-400 transition-all"
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm w-full sm:w-auto">
          <label htmlFor="date" className="text-gray-500 text-sm mr-2 whitespace-nowrap">
            Date:
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="outline-none text-gray-700 text-sm w-full sm:w-auto bg-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
