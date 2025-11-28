import React, { useState } from "react";
import Input from "../common/Input";
import DatePickerInput from "../common/DatePickerInput";
import Select from "../common/Select";

const EditReport = ({ row, onClose, onSave }) => {
  const [form, setForm] = useState({
    id: row.id,
    type: row.type,
    author: row.author,
    date: row.date,
    status: row.status,
  });
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
        <h3 className="mb-4 text-base font-semibold text-slate-800">Edit Report</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Type" value={form.type} onChange={(e) => set("type", e.target.value)} />
          <Input label="Author" value={form.author} onChange={(e) => set("author", e.target.value)} />
          <DatePickerInput label="Date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          <Select label="Status" value={form.status} onChange={(e) => set("status", e.target.value)} options={["Pending", "Completed", "Draft", "Submitted"]} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
          <button onClick={() => onSave({ id: form.id, type: form.type, author: form.author, date: form.date, status: form.status })} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditReport;