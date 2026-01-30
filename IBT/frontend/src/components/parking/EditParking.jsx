import React, { useState, useEffect } from "react";
import Input from "../common/Input";
import Select from "../common/Select";

const EditParking = ({ row, onClose, onSave }) => {
  
  const extractDate = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString('en-CA'); 
  };

  const extractTime = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const parsePrice = (p) => parseFloat(String(p).replace(/[^0-9.]/g, "")) || 0;

  const [form, setForm] = useState({
    id: row.id,
    ticketNo: row.ticketNo || "",
    plateNo: row.plateNo || "",
    type: row.type,
    baseRate: parsePrice(row.baseRate || row.price), 
    
    // Separate Date and Time for editing
    date: extractDate(row.timeIn),
    timeInVal: extractTime(row.timeIn),
    timeOutVal: extractTime(row.timeOut),
    
    duration: row.duration || "",
    status: row.status,
  });

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = () => {
    // Reconstruct the ISO DateTime strings before saving
    // Format: YYYY-MM-DDTHH:mm
    const combinedTimeIn = form.date && form.timeInVal 
      ? new Date(`${form.date}T${form.timeInVal}`).toISOString() 
      : row.timeIn;

    const combinedTimeOut = form.date && form.timeOutVal 
      ? new Date(`${form.date}T${form.timeOutVal}`).toISOString() 
      : null; // Null if no time out set

    onSave({ 
      id: form.id, 
      ticketNo: form.ticketNo,
      plateNo: form.plateNo,
      type: form.type, 
      price: form.baseRate, 
      timein: combinedTimeIn, 
      timeout: combinedTimeOut, 
      duration: form.duration, 
      date: form.date, // Sending date separately just in case, but timein/out usually covers it
      status: form.status 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-xl font-bold text-slate-800">Edit Parking Ticket</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Ticket No - Read Only usually */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ticket No</label>
                <input 
                    type="text" 
                    value={form.ticketNo} 
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 p-2 text-sm text-slate-500 cursor-not-allowed"
                />
            </div>

            {/* Plate No */}
            <Input 
                label="Plate No" 
                value={form.plateNo} 
                onChange={(e) => set("plateNo", e.target.value.toUpperCase())} 
            />

            {/* Type */}
            <div className="md:col-span-1">
                 <Select 
                    label="Type" 
                    value={form.type} 
                    onChange={(e) => set("type", e.target.value)} 
                    options={["Car", "Motorcycle"]}
                />
            </div>

            {/* Base Rate */}
            <Input 
                label="Base Rate (₱)" 
                type="number" 
                value={form.baseRate} 
                onChange={(e) => set("baseRate", Number(e.target.value))} 
            />

            {/* Date - Read Only */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input 
                    type="date" 
                    value={form.date} 
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 p-2 text-sm text-slate-500 cursor-not-allowed"
                />
            </div>
            
            {/* Duration */}
            <Input 
                label="Duration" 
                value={form.duration} 
                onChange={(e) => set("duration", e.target.value)} 
            />

            {/* Time In */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time In</label>
                <input 
                    type="time" 
                    value={form.timeInVal} 
                    onChange={(e) => set("timeInVal", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
            </div>

            {/* Time Out */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time Out</label>
                <input 
                    type="time" 
                    value={form.timeOutVal} 
                    onChange={(e) => set("timeOutVal", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
            </div>

            {/* Status */}
            <div className="md:col-span-2">
                 <Select 
                    label="Status" 
                    value={form.status} 
                    onChange={(e) => set("status", e.target.value)} 
                    options={["Parked", "Departed"]} 
                />
            </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditParking;