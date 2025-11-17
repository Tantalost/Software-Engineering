import React, { useState } from "react";

const EditBusTripModal = ({ row, onClose, onSave }) => {
  const [form, setForm] = useState({
    id: row.id,
    templateNo: row.templateno,
    route: row.route,
    time: row.time,
    date: row.date,
    company: row.company,
    status: row.status,
  });

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Edit Bus Trip</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Template No" value={form.templateNo} onChange={(e) => update("templateNo", e.target.value)} />
          <Field label="Route" value={form.route} onChange={(e) => update("route", e.target.value)} />
          <Field label="Time" type="time" value={form.time} onChange={(e) => update("time", e.target.value)} />
          <Field label="Date" type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
          <Field label="Company" value={form.company} onChange={(e) => update("company", e.target.value)} />
          <Select label="Status" value={form.status} onChange={(e) => update("status", e.target.value)} options={["Paid", "Pending"]} />
        </div>

        <div className="flex justify-end mt-5 gap-2">
          <button onClick={onClose} className="border border-slate-300 px-4 py-2 rounded-lg text-sm">
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                id: form.id,
                templateNo: form.templateNo,
                route: form.route,
                time: form.time,
                date: form.date,
                company: form.company,
                status: form.status,
              })
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text" }) => (
  <div>
    <label className="text-xs font-medium text-slate-600">{label}</label>
    <input type={type} value={value} onChange={onChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mt-1" />
  </div>
);

const Select = ({ label, value, onChange, options = [] }) => (
  <div>
    <label className="text-xs font-medium text-slate-600">{label}</label>
    <select value={value} onChange={onChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mt-1">
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

export default EditBusTripModal;
