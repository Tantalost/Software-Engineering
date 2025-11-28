import React from "react";
// Adjust these import paths based on your file structure
import DatePickerInput from "../common/DatePickerInput";
import Input from "../common/Input";
import Select from "../common/Select";

const EditParking = ({ row, onClose, onSave }) => {
  const parsePrice = (p) => parseFloat(String(p).replace(/[^0-9.]/g, "")) || 0;
  const [form, setForm] = React.useState({
    id: row.id,
    type: row.type,
    price: parsePrice(row.price),
    timein: row.timeIn,
    timeout: row.timeOut,
    duration: row.duration,
    date: row.date,
    status: row.status,
  });
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
        <h3 className="mb-4 text-base font-semibold text-slate-800">Edit Parking Ticket</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Type" value={form.type} onChange={(e) => set("type", e.target.value)} />
          <Input label="Price" type="number" value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
          <Input label="Time-in" value={form.timein} onChange={(e) => set("timein", e.target.value)} />
          <Input label="Time-out" value={form.timeout} onChange={(e) => set("timeout", e.target.value)} />
          <Input label="Duration" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
          <DatePickerInput label="Date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          <Select label="Status" value={form.status} onChange={(e) => set("status", e.target.value)} options={["Active", "Completed", "Inactive"]} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
          <button onClick={() => onSave({ id: form.id, type: form.type, price: form.price, time: form.time, duration: form.duration, date: form.date, status: form.status })} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditParking;