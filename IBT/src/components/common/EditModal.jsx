import React, { useState } from "react";

const EditModal = ({ title, initialData, fields, onClose }) => {
  const [form, setForm] = useState(initialData);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    console.log("Saved:", form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
        <h3 className="mb-4 text-base font-semibold text-slate-800">{title}</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{fields(form, set)}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
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
