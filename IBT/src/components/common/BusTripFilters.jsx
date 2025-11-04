import React from "react";

const BusTripFilters = ({
  searchQuery,
  setSearchQuery,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedCompany,
  setSelectedCompany,
  uniqueCompanies,
  onFilterClick,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm">
        <input
          type="text"
          placeholder="Search by Template No. or Route"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="outline-none text-gray-700 text-sm w-52"
        />
      </div>

      {/* Company Filter */}
      <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm">
        <label
          htmlFor="company"
          className="text-gray-500 text-sm mr-2 whitespace-nowrap"
        >
          Company:
        </label>
        <select
          id="company"
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="text-gray-700 text-sm outline-none bg-transparent"
        >
          <option value="">All</option>
          {uniqueCompanies.map((company, idx) => (
            <option key={idx} value={company}>
              {company}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range Filter */}
      <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm">
        <label htmlFor="start" className="text-gray-500 text-sm mr-2">
          From:
        </label>
        <input
          type="date"
          id="start"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="outline-none text-gray-700 text-sm"
        />
      </div>

      <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm">
        <label htmlFor="end" className="text-gray-500 text-sm mr-2">
          To:
        </label>
        <input
          type="date"
          id="end"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="outline-none text-gray-700 text-sm"
        />
      </div>

    </div>
  );
};

export default BusTripFilters;