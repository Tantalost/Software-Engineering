import React from "react";
import Input from "../../common/Input";
import Textarea from "../../common/Textarea";

const BroadcastModal = ({ isOpen, onClose, onBroadcast, draft, setDraft }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow">
        <h3 className="mb-4 text-base font-semibold text-slate-800">System Notification</h3>
        <div className="space-y-3">
          <Input label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <Textarea label="Body" value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
          <button onClick={onBroadcast} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Broadcast</button>
        </div>
      </div>
    </div>
  );
};
export default BroadcastModal;