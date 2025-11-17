import React from "react";

const ViewBusTripModal = ({ row, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center p-4">
    <div className="bg-white w-full max-w-xl rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">View Bus Trip</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <Display label="Template No" value={row.templateno} />
        <Display label="Route" value={row.route} />
        <Display label="Time" value={row.time} />
        <Display label="Date" value={row.date} />
        <Display label="Company" value={row.company} />
        <Display label="Status" value={row.status} />
      </div>

      <div className="flex justify-end mt-5">
        <button onClick={onClose} className="border border-slate-300 px-4 py-2 rounded-lg text-sm">
          Close
        </button>
      </div>
    </div>
  </div>
);

const Display = ({ label, value }) => (
  <div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="border border-slate-200 px-3 py-2 rounded bg-slate-50">{value || "-"}</div>
  </div>
);

export default ViewBusTripModal;
