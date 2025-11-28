import React from "react";

const Textarea = ({ label, value, onChange }) => (
  <div className="md:col-span-2">
    <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
    <textarea value={value} onChange={onChange} rows={4} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none" />
  </div>
);

export default Textarea;