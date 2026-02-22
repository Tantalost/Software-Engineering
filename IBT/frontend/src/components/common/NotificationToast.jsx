import React from "react";
import { CheckCircle, X } from "lucide-react";

const NotificationToast = ({ isOpen, type, message, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 pointer-events-none">
            <div className={`flex items-center gap-4 ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white p-4 rounded-xl shadow-xl transition-all duration-300 transform animate-in fade-in slide-in-from-top-10 pointer-events-auto`} role="alert">
                {type === 'success' ? <CheckCircle size={32} /> : <X size={32} />}
                <div>
                    <h4 className="font-bold text-lg">{type === 'success' ? 'Success!' : 'Error'}</h4>
                    <p className="text-sm">{message}</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer">
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default NotificationToast;