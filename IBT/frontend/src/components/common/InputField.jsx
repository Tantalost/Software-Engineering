import React from "react";

const InputField = ({ label, value, onChange, type = "text" }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none"
    />
  </div>
);

export default InputField;
