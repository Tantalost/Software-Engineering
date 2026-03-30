import React from "react";
import { Loader2, FileText, CheckCircle } from "lucide-react";

const SubmitReportModal = ({
    isOpen,
    onClose,
    onSubmit,
    isReporting,
    recordCount,
    collectorName = "",
    operatorName = "",
    asOfDateLabel = "",
}) => {
    if (!isOpen) return null;

    const trimmedCollector = (collectorName || "").trim();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl transform transition-all scale-100">
                <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-4">Tenant Lease Report</h3>

                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        You are submitting the current tenant lease report snapshot.
                        <strong className="text-emerald-600 ml-1">Data will remain on the table</strong>
                        {" "}and submitted rows will be marked as On Read.
                    </p>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Name of Collector
                        </label>
                        <input
                            type="text"
                            value={collectorName}
                            readOnly
                            className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm outline-none"
                        />
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-3">
                        <FileText className="text-blue-500 shrink-0" size={20} />
                        <div className="text-xs text-blue-800">
                            <strong>Total Records Included:</strong> {recordCount} row{recordCount === 1 ? "" : "s"}
                            <div className="mt-2 pt-2 border-t border-blue-200">
                                <strong>Collector:</strong> {trimmedCollector || "—"}
                            </div>
                            {operatorName ? (
                                <div className="mt-1">
                                    <strong>Operator:</strong> {operatorName}
                                </div>
                            ) : null}
                            {asOfDateLabel ? (
                                <div className="mt-1">
                                    <strong>As of:</strong> {asOfDateLabel}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isReporting}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={isReporting || !trimmedCollector}
                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isReporting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Submitting...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle size={16} />
                                <span>Confirm Submit</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubmitReportModal;