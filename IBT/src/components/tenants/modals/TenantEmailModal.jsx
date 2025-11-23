import React from "react";
import { X, Mail } from "lucide-react";
import Textarea from "../../common/Textarea";

const TenantEmailModal = ({ isOpen, onClose, recipient, body, setBody, onSend }) => {
  if (!isOpen || !recipient) return null;

  const setTemplate = (type) => {
    if (type === 'late') setBody(`Dear ${recipient.tenantName || recipient.name},\n\nWe noticed you missed the payment due date (${recipient.DueDateTime}). Please settle this immediately.`);
    if (type === 'renewal') setBody(`Dear ${recipient.tenantName || recipient.name},\n\nThis is a reminder that your lease for Slot ${recipient.slotNo} is expiring soon.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl ring-1 ring-slate-900/5">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-base font-semibold text-slate-800">
            Send Email to: <span className="text-purple-600">{recipient.tenantName || recipient.name}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button onClick={() => setTemplate('late')} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1 rounded-full hover:bg-orange-100 whitespace-nowrap">Template: Late Payment</button>
          <button onClick={() => setTemplate('renewal')} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full hover:bg-blue-100 whitespace-nowrap">Template: Renewal</button>
        </div>

        <Textarea label="Message Body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type your custom message here..." />

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={() => onSend(recipient, body)} className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white shadow hover:bg-purple-700 flex items-center gap-2">
            <Mail size={16} /> Send Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantEmailModal;