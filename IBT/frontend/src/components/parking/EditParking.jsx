import React, { useState, useEffect } from "react";
import Input from "../common/Input";
import Select from "../common/Select";

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
    baseRate: parsePrice(row.baseRate || row.price),
    date: extractDate(row.timeIn),
    timeInVal: extractTime(row.timeIn),
    timeOutVal: extractTime(row.timeOut),
    duration: row.duration || 1,
    status: row.status,
  });

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  /* AUTO UPDATE RATE WHEN VEHICLE TYPE CHANGES */
  useEffect(() => {
    if (form.type === "Car") {
      set("baseRate", CAR_RATE);
    } else {
      set("baseRate", MOTOR_RATE);
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

          <Select
            label="Type"
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            options={["Car", "Motorcycle"]}
          />

          <Input
            label="Base Rate (₱)"
            type="text"
            value={form.baseRate}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              set("baseRate", Number(value));
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
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              options={["Parked", "Departed"]}
            />
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