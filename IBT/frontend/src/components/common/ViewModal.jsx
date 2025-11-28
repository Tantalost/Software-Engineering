import React from "react";
import Field from "./Field";

const ViewModal = ({ title, fields, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
      <h3 className="mb-4 text-base font-semibold text-slate-800">{title}</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
        {fields.map((f, i) => (
          <Field key={i} label={f.label} value={f.value} />
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:border-slate-300"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default ViewModal;
