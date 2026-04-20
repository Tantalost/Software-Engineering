import React, { useState, useEffect } from "react";
import Input from "../common/Input";
import { ChevronDown } from "lucide-react";

const CAR_RATE = 20;
const MOTOR_RATE = 10;

const EditParking = ({ row, onClose, onSave }) => {
  const extractDate = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("en-CA");
  };

  const extractTime = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parsePrice = (p) =>
    parseFloat(String(p).replace(/[^0-9.]/g, "")) || 0;

  const [form, setForm] = useState({
    id: row.id,
    ticketNo: row.ticketNo || "",
    plateNo: row.plateNo || "",
    type: row.type,
    baseRate: parsePrice(row.baseRate || row.price).toFixed(2),
    date: extractDate(row.timeIn),
    timeInVal: extractTime(row.timeIn),
    timeOutVal: extractTime(row.timeOut),
    duration: row.duration || 1,
    status: row.status,
  });

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (form.type === "Car") {
      set("baseRate", Number(CAR_RATE).toFixed(2));
    } else {
      set("baseRate", Number(MOTOR_RATE).toFixed(2));
    }
  }, [form.type]);

  const handleSubmit = () => {
    onSave({
      id: form.id,
      plateNo: form.plateNo,
      type: form.type,
      price: Number(form.baseRate),
      duration: Number(form.duration),
      status: form.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-lg">

        <h3 className="mb-4 text-xl font-bold text-slate-800">
          Edit Parking Ticket
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ticket No
            </label>
            <input
              value={form.ticketNo}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-100 p-2 text-sm"
            />
          </div>

          <Input
            label="Plate No"
            value={form.plateNo}
            onChange={(e) => set("plateNo", e.target.value.toUpperCase())}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Type
            </label>
            <div className="relative">
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 pr-10 text-sm focus:border-emerald-500 outline-none appearance-none cursor-pointer bg-white"
              >
                <option value="Car">Car</option>
                <option value="Motorcycle">Motorcycle</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center w-10 border-l border-slate-200 text-slate-500 my-1.5">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          <Input
            label="Base Rate (₱)"
            type="text"
            value={form.baseRate}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9.]/g, "");
              set("baseRate", value);
            }}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Duration
            </label>
            <input
              value={form.duration}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-100 p-2 text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <div className="relative">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 pr-10 text-sm focus:border-emerald-500 outline-none appearance-none cursor-pointer bg-white"
              >
                <option value="Parked">Parked</option>
                <option value="Departed">Departed</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center w-10 border-l border-slate-200 text-slate-500 my-1.5">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditParking;