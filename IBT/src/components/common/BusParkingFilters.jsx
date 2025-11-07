import React from "react";
import PeriodFilter from "./PeriodFilter"; 

const BusParkingFilters = ({
  searchQuery,
  setSearchQuery,
  selectedCompany,
  setSelectedCompany,
  uniqueCompanies = [],
  selectedDate,
  setSelectedDate,
  showCompany = true,
  showDate = true,
  showPeriod = true,

}) => {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full">
      <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm w-full sm:w-auto">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="outline-none text-gray-700 text-sm w-full"
        />
      </div>

      {showCompany && (
        <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm w-full sm:w-auto">
          <label className="text-gray-500 text-sm mr-2 whitespace-nowrap">
            Company:
          </label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="text-gray-700 text-sm outline-none bg-transparent w-full"
          >
            <option value="">All</option>
            {uniqueCompanies.map((company, idx) => (
              <option key={idx} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
      )}

      {showDate && (
        <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm w-full sm:w-auto">
          <label className="text-gray-500 text-sm mr-2">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="outline-none text-gray-700 text-sm w-full"
          />
        </div>
      )}

      {showPeriod && (
        <PeriodFilter
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
        />
      )}
    </div>
  );
};

export default BusParkingFilters;
