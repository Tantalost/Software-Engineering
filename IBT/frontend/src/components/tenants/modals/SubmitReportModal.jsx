import React from "react";
import { Loader2 } from "lucide-react";

const SubmitReportModal = ({ isOpen, onClose, onSubmit, isReporting, recordCount }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md cursor-pointer rounded-xl bg-white p-6 shadow-xl transform transition-all scale-100">
                <h3 className="text-lg font-bold text-slate-800">Submit Report</h3>
                <p className="mt-2 text-sm text-slate-600">
                    Are you sure you want to generate and submit the current Tenant Lease report?
                    <br />
                    <span className="text-emerald-600 font-semibold text-xs">
                        This will capture the current status of {recordCount} records and mark submitted rows as On Read.
                    </span>
                </p>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} disabled={isReporting} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onSubmit} disabled={isReporting} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                        {isReporting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Submitting...</span>
                            </>
                        ) : (
                            <span>Confirm Submit</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubmitReportModal;