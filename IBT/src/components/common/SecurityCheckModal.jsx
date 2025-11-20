import React from "react";
import { Lock, AlertCircle } from "lucide-react";

const SecurityCheckModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  actionType, // 'delete' or 'edit'
  passwordInput, 
  setPasswordInput, 
  error 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-in zoom-in duration-200">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
            <Lock size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Security Check</h3>
          <p className="text-sm text-slate-500">
            Please enter your login password to confirm 
            <span className="font-bold text-slate-800"> {actionType === 'delete' ? 'deletion' : 'update'}</span>.
          </p>
        </div>
        <div className="mb-4">
          <input 
            type="password" 
            placeholder="Enter Password"
            className={`w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all ${error ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
          {error && (
            <div className="flex items-center gap-1 text-red-600 text-xs mt-2 font-medium">
              <AlertCircle size={12} /><span>{error}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={`flex-1 py-2.5 rounded-lg text-white font-medium shadow-sm transition-colors ${actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Confirm {actionType === 'delete' ? 'Delete' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityCheckModal;