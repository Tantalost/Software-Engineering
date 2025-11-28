import React from "react";
import { Search } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const FilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedDate,
  setSelectedDate,
}) => {
  const handleDateChange = (date) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      setSelectedDate(formattedDate);
    } else {
      setSelectedDate("");
    }
  };

  const selectedDateObj = selectedDate ? new Date(selectedDate) : null;

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
        <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm w-full sm:w-auto hover:border-emerald-400 hover:shadow-md transition-all duration-200 cursor-pointer group">
          <label className="text-gray-500 text-sm mr-2 whitespace-nowrap group-hover:text-emerald-600 transition-colors">
            Date:
          </label>
          <DatePicker
            selected={selectedDateObj}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            placeholderText="Select date"
            isClearable
            className="outline-none text-gray-700 text-sm w-full sm:w-auto cursor-pointer hover:text-emerald-600 focus:text-emerald-600 transition-colors bg-transparent border-none"
            wrapperClassName="w-full sm:w-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
