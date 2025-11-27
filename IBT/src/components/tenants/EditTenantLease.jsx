import React, { useState } from "react";
import Input from "../common/Input"; 
import DatePickerInput from "../common/DatePickerInput"; 
const EditTenantLease = ({ row, onClose, onSave }) => {
  const [form, setForm] = useState({
    id: row.id,
    slotno: row.slotno,
    referenceno: row.referenceno,
    name: row.name,
    email: row.email,
    contact: row.contact,
    date: row.date,
    status: row.status,
  });

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
        <h3 className="mb-4 text-base font-semibold text-slate-800">Edit Tenant Lease</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Slot No" value={form.slotno} onChange={(e) => set("slotno", e.target.value)} />
          <Input label="Reference No" value={form.referenceno} onChange={(e) => set("referenceno", e.target.value)} />
          <Input label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <Input label="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <Input label="Contact" value={form.contact} onChange={(e) => set("contact", e.target.value)} />
          <DatePickerInput label="Date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          <Input label="Status" value={form.status} onChange={(e) => set("status", e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
          <button onClick={() => onSave({
            id: form.id,
            slotno: form.slotno,
            referenceno: form.referenceno,
            name: form.name,
            email: form.email,
            contact: form.contact,
            date: form.date,
            status: form.status,
          })} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditTenantLease;