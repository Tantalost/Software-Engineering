import React from "react";

const BusParkingFilters = ({
  searchQuery,
  setSearchQuery,
  selectedCompany,
  selectedDate,
  setSelectedDate,
  setSelectedCompany,
  uniqueCompanies,
}) => {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full">
      <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm flex-grow sm:flex-none w-full sm:w-auto">
        <input
          type="text"
          placeholder="Search parking..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="outline-none text-gray-700 text-sm w-full"
        />
      </div>

      <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm flex-grow sm:flex-none w-full sm:w-auto">
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
          className="text-gray-700 text-sm outline-none bg-transparent w-full sm:w-auto"
        >
          <option value="">All</option>
          {uniqueCompanies.map((company, idx) => (
            <option key={idx} value={company}>
              {company}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm flex-grow sm:flex-none w-full sm:w-auto">
        <label htmlFor="date" className="text-gray-500 text-sm mr-2">
          Date:
        </label>
        <input
          type="date"
          id="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="outline-none text-gray-700 text-sm w-full sm:w-auto"
        />
      </div>
    </div>
  );
};

export default BusParkingFilters;
