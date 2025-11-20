import React from "react";
import { MessageSquare } from "lucide-react";
import Textarea from "./Textarea"; // Assuming you have this in common

const RequestDeletionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemIdentifier, // e.g., "Ticket #123"
  remarks, 
  setRemarks 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4 text-amber-600">
          <div className="p-2 bg-amber-50 rounded-full"><MessageSquare size={24}/></div>
          <h3 className="text-lg font-bold text-slate-800">Request Deletion</h3>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-slate-600 mb-2">
            You are requesting to delete <span className="font-bold text-slate-800">{itemIdentifier}</span>.
          </p>
          <p className="text-xs text-slate-500 mb-4">
            This item will be hidden from your view immediately, but a Superadmin must approve the final deletion.
          </p>

          <Textarea 
            label="Reason for Deletion (Required)"
            placeholder="E.g., Duplicate entry, Wrong encoding..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={!remarks.trim()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestDeletionModal;