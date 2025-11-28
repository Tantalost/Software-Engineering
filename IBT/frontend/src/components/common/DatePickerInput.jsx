import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DatePickerInput = ({ label, value, onChange, placeholder = "Select date", className = "" }) => {
    const handleDateChange = (date) => {
        if (date) {
            const formattedDate = date.toISOString().split('T')[0];
            onChange({ target: { value: formattedDate } });
        } else {
            onChange({ target: { value: "" } });
        }
    };

    const selectedDateObj = value ? new Date(value) : null;

    return (
        <div className={className}>
            {label && (
                <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
            )}
            <DatePicker
                selected={selectedDateObj}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                placeholderText={placeholder}
                isClearable
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                wrapperClassName="w-full"
            />
        </div>
    );
};

export default DatePickerInput;

