import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BusTripFilters = ({
    searchQuery, setSearchQuery,
    selectedCompany, selectedDate, setSelectedDate, setSelectedCompany, uniqueCompanies,
    selectedBusType, setSelectedBusType,
    selectedStatus, setSelectedStatus
}) => {
    const formatLocalDate = (date) => {
        if (!date) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const parseDateStringToLocalDate = (dateString) => {
        if (!dateString) return null;
        const [year, month, day] = dateString.split("-").map(Number);
        if (!year || !month || !day) return null;
        return new Date(year, month - 1, day);
    };

    const handleDateChange = (date) => {
        if (date) {
            const formattedDate = formatLocalDate(date);
            setSelectedDate(formattedDate);
        } else {
            setSelectedDate("");
        }
    };

    const selectedDateObj = parseDateStringToLocalDate(selectedDate);

    return (
        <>
        <style>{`
          .bus-trip-filters-datepicker-popper.react-datepicker-popper {
            z-index: 400 !important;
          }
        `}</style>
        <div className="relative z-30 flex flex-wrap sm:flex-nowrap items-center gap-2 w-full">
            <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm flex-grow sm:flex-none w-full sm:w-auto">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="outline-none text-gray-700 text-sm w-full"
                />
            </div>

            <div className="cursor-pointer flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm flex-grow sm:flex-none w-full sm:w-auto">
                <label
                    htmlFor="company"
                    className="text-gray-500 text-sm mr-2 whitespace-nowrap cursor-pointer "
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

           
            <div className="cursor-pointer flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm flex-grow sm:flex-none w-full sm:w-auto">
                <label
                    htmlFor="busType"
                    className="text-gray-500 text-sm mr-2 whitespace-nowrap cursor-pointer "
                >
                    Bus Type:
                </label>
                <select
                    id="busType"
                    value={selectedBusType}
                    onChange={(e) => setSelectedBusType(e.target.value)}
                    className="text-gray-700 text-sm outline-none bg-transparent w-full sm:w-auto"
                >
                    <option value="">All</option>
                    <option value="Regular">Regular</option>
                    <option value="Aircon">Aircon</option>
                </select>
            </div>

            <div className="cursor-pointer flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm flex-grow sm:flex-none w-full sm:w-auto">
                <label
                    htmlFor="status"
                    className="text-gray-500 text-sm mr-2 whitespace-nowrap cursor-pointer "
                >
                    Status:
                </label>
                <select
                    id="status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="text-gray-700 text-sm outline-none bg-transparent w-full sm:w-auto"
                >
                    <option value="">All</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Arrived">Arrived</option>
                    <option value="Departed">Departed</option>
                    <option value="On Fix">On Fix</option>
                    <option value="Not Departed">Not Departed</option>
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
                    maxDate={new Date()}
                    onKeyDown={(e) => e.preventDefault()}
                    popperClassName="bus-trip-filters-datepicker-popper"
                    className="outline-none text-gray-700 text-sm w-full sm:w-auto cursor-pointer hover:text-emerald-600 focus:text-emerald-600 transition-colors bg-transparent border-none"
                    wrapperClassName="w-full sm:w-auto"
                />
            </div>
        </div>
        </>
    );
};

export default BusTripFilters;