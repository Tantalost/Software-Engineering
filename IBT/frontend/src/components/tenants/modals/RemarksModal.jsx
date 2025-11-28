import React from "react";
import Textarea from "../../common/Textarea";

const RemarksModal = ({ isOpen, onClose, onSave, remarksText, setRemarksText }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow">
        <h3 className="mb-4 text-base font-semibold text-slate-800">Internal Remarks</h3>
        <Textarea label="Admin Notes" value={remarksText} onChange={(e) => setRemarksText(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
          <button onClick={onSave} className="rounded-lg bg-amber-600 px-3 py-2 text-sm text-white shadow hover:bg-amber-700">Save Note</button>
        </div>
      </div>
    </div>
  );
};
export default RemarksModal;