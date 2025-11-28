import React from "react";
import PeriodFilter from "./PeriodFilter";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BusParkingFilters = ({
  searchQuery,
  setSearchQuery,
  selectedCompany,
  setSelectedCompany,
  uniqueCompanies = [],
  selectedDate,
  setSelectedDate,
  selectedPeriod,
  setSelectedPeriod,
  showCompany = true,
  showDate = true,
  showPeriod = true,
}) => {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full">
      <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm flex-grow sm:flex-none w-full sm:w-auto">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="outline-none text-gray-700 text-sm w-full"
        />
      </div>

      {showCompany && (
        <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm flex-grow sm:flex-none w-full sm:w-auto">
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
        <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm flex-grow sm:flex-none w-full sm:w-auto hover:border-emerald-400 hover:shadow-md transition-all duration-200 cursor-pointer group">
          <label className="text-gray-500 text-sm mr-2 group-hover:text-emerald-600 transition-colors">Date:</label>
          <DatePicker
            selected={selectedDate ? new Date(selectedDate) : null}
            onChange={(date) => {
              if (date) {
                const formattedDate = date.toISOString().split('T')[0];
                setSelectedDate(formattedDate);
              } else {
                setSelectedDate("");
              }
            }}
            dateFormat="yyyy-MM-dd"
            placeholderText="Select date"
            isClearable
            className="outline-none text-gray-700 text-sm w-full cursor-pointer hover:text-emerald-600 focus:text-emerald-600 transition-colors bg-transparent border-none"
            wrapperClassName="w-full"
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
