import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BusTripFilters = ({
    searchQuery, setSearchQuery,
    selectedCompany, selectedDate, setSelectedDate, setSelectedCompany, uniqueCompanies,

}) => {
    const handleDateChange = (date) => {
        if (date) {
            // Format date as YYYY-MM-DD for consistency
            const formattedDate = date.toISOString().split('T')[0];
            setSelectedDate(formattedDate);
        } else {
            setSelectedDate("");
        }
    };

    const selectedDateObj = selectedDate ? new Date(selectedDate) : null;

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

            <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm flex-grow sm:flex-none w-full sm:w-auto hover:border-emerald-400 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <label className="text-gray-500 text-sm mr-2 group-hover:text-emerald-600 transition-colors cursor-pointer whitespace-nowrap">
                    Date
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
    );
};

export default BusTripFilters;
