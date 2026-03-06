import React from "react";
import { CheckCircle, X } from "lucide-react";

const NotificationToast = ({ isOpen, type, message, onClose }) => {
    if (!isOpen) return null;

    const isSuccess = type === "success";

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 pointer-events-none">
            <div
                className={`pointer-events-auto flex items-start gap-3 max-w-md w-full rounded-xl shadow-lg border border-white/20
                ${isSuccess ? "bg-emerald-500" : "bg-red-500"}
                text-white px-5 py-4 animate-in fade-in slide-in-from-top-5 duration-300`}
                role="alert"
            >
                {/* Icon */}
                <div className="flex items-center justify-center mt-0.5">
                    {isSuccess ? (
                        <CheckCircle size={26} className="text-white" />
                    ) : (
                        <X size={26} className="text-white" />
                    )}
                </div>

                {/* Text Content */}
                <div className="flex-1">
                    <h4 className="text-sm font-semibold tracking-wide">
                        {isSuccess ? "Success" : "Error"}
                    </h4>
                    <p className="text-sm text-white/90 mt-0.5">
                        {message}
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="rounded-md p-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default NotificationToast;