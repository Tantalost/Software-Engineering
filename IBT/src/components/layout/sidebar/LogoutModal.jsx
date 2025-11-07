// /components/sidebar/LogoutModal.js
import React from "react";
import { X, AlertTriangle } from "lucide-react";

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-80 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
        <div className="flex flex-col items-center text-center">
          <AlertTriangle className="text-amber-500 mb-3" size={40} />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Confirm Logout
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Are you sure you want to log out of your account?
          </p>
          <div className="flex space-x-3" >
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 text-white hover:opacity-90 transition-all"
            >
              Yes, Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;