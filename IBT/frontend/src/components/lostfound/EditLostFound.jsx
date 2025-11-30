import React, { useState } from "react";
import Input from "../common/Input";
import Select from "../common/Select";

const EditLostFound = ({ row, onClose, onSave }) => {
  const [form, setForm] = useState({
    id: row.id,
    trackingNo: row.trackingno,
    description: row.description,
    location: row.location,
    dateTime: row.datetime,
    status: row.status,
  });
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
        <h3 className="mb-4 text-base font-semibold text-slate-800">Edit Record</h3>
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <div className="flex p-1 bg-slate-100 rounded-lg">
                {["Unclaimed", "Claimed"].map((status) => (
                  <button
                    type="button"
                    key={status}
                    onClick={() => setForm({ ...form, status })}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    form.status === status
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                  {status}
                  </button>
                ))}
              </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Tracking No" value={form.trackingNo} onChange={(e) => set("trackingNo", e.target.value)} />

          <Input label="DateTime" value={form.dateTime} onChange={(e) => set("dateTime", e.target.value)} />
          <div className="md:col-span-2">
            <Input label="Description" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
          <button onClick={() => onSave({ id: form.id, trackingNo: form.trackingNo, description: form.description, dateTime: form.dateTime, status: form.status })} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditLostFound;