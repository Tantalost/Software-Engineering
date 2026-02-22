import React from "react";
import { Archive } from "lucide-react";

const ArchiveConfirmModal = ({ isOpen, row, onClose, onConfirm }) => {
    if (!isOpen || !row) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl text-center">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Archive size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Confirm Archiving</h3>
                <p className="text-slate-600 mt-2 text-sm">
                    Are you sure you want to move <strong>{row.tenantName || row.name}</strong> to the Archives?
                    <br />
                    <span className="font-semibold text-xs text-red-500">
                        This will remove them from the active tenant list.
                    </span>
                </p>
                <div className="mt-6 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="flex-1 py-2.5 bg-yellow-500 rounded-lg text-white font-medium hover:bg-yellow-600 shadow-lg transition-colors">
                        Yes, Archive
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArchiveConfirmModal;