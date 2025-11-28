import { useState } from "react";

const Input = ({ label, value, onChange }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
    <input
      value={value}
      onChange={onChange}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none"
    />
  </div>
);

const Textarea = ({ label, value, onChange }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
    <textarea
      rows={4}
      value={value}
      onChange={onChange}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none"
    />
  </div>
);

const NotifyModal = ({ onClose }) => {
  const [draft, setDraft] = useState({ title: "", message: "" });

  const send = () => {
    const raw = localStorage.getItem("ibt_notifications");
    const list = raw ? JSON.parse(raw) : [];
    list.push({
      id: Date.now(),
      title: draft.title,
      message: draft.message,
      date: new Date().toISOString().slice(0, 10),
      source: "Lost and Found",
    });
    localStorage.setItem("ibt_notifications", JSON.stringify(list));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl p-5 shadow">
        <h3 className="mb-4 text-base font-semibold text-slate-800">Send Notification</h3>
        <div className="space-y-3">
          <Input label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <Textarea
            label="Body"
            value={draft.message}
            onChange={(e) => setDraft({ ...draft, message: e.target.value })}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm">
            Cancel
          </button>
          <button onClick={send} className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm shadow">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotifyModal;
