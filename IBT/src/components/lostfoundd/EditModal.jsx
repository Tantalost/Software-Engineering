import React from "react";

const Input = ({ label, value, onChange, type = "text" }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
    <input
      value={value}
      onChange={onChange}
      type={type}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none"
    />
  </div>
);

const Select = ({ label, value, onChange, options = [] }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const EditModal = ({ row, onClose, onSave }) => {
  const [form, setForm] = React.useState({
    id: row.id,
    trackingNo: row.trackingno,
    description: row.description,
    dateTime: row.datetime,
    status: row.status,
  });

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-xl p-5 shadow">
        <h3 className="mb-4 text-base font-semibold text-slate-800">Edit Record</h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Tracking No" value={form.trackingNo} onChange={(e) => set("trackingNo", e.target.value)} />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            options={["Unclaimed", "Claimed", "Pending"]}
          />
          <Input label="DateTime" value={form.dateTime} onChange={(e) => set("dateTime", e.target.value)} />
          <div className="md:col-span-2">
            <Input label="Description" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white shadow hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
