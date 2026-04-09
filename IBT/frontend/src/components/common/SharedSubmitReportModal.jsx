import React from "react";
import { CheckCircle, FileText, Loader2, X } from "lucide-react";

const formatCollectorDisplayName = (collector) => {
  if (!collector) return "";
  const middleInitial = collector.middleName
    ? `${String(collector.middleName).trim().charAt(0).toUpperCase()}.`
    : "";
  return [
    collector.firstName,
    middleInitial,
    collector.lastName,
    collector.suffix,
  ]
    .filter(Boolean)
    .join(" ");
};

const SharedSubmitReportModal = ({
  isOpen,
  onClose,
  onSubmit,
  requiresCollector,
  moduleName,
  reportType,
  collectors = [],
  collectorId = "",
  collectorName = "",
  onCollectorChange,
  assignedShift = "",
  totalRecords = 0,
  helperText = "",
  isSubmitting = false,
  submitDisabled = false,
  submitLabel = "Confirm Submit",
}) => {
  if (!isOpen) return null;
  const role = localStorage.getItem("authRole") || "superadmin";
  const canViewCollectorIdentity = role !== "superadmin";

  const handleCollectorChange = (event) => {
    const nextId = event.target.value;
    const selectedCollector = collectors.find(
      (collector) => (collector._id || collector.id) === nextId,
    );

    if (typeof onCollectorChange === "function") {
      onCollectorChange(nextId, selectedCollector || null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl transform transition-all">
        <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-4">
          {moduleName} Shift Hand-off Report
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            You are submitting the operational report for this module.
            <strong className="text-emerald-600 ml-1">
              Data will remain available for continuity.
            </strong>
          </p>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Assigned Shift
            </label>
            <input
              type="text"
              value={assignedShift || "No assigned shift"}
              readOnly
              className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm outline-none"
            />
          </div>

          {requiresCollector && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Collector
              </label>
              <select
                value={collectorId}
                onChange={handleCollectorChange}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none"
              >
                <option value="">Select collector</option>
                {collectors.map((collector) => {
                  const label = formatCollectorDisplayName(collector);
                  return (
                    <option
                      key={collector._id || collector.id}
                      value={collector._id || collector.id}
                    >
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-3">
            <FileText className="text-blue-500 shrink-0" size={20} />
            <div className="text-xs text-blue-800">
              <strong>Total Records Included:</strong> {totalRecords}
              {reportType ? <div className="mt-1">Report Type: {reportType}</div> : null}
              {helperText ? <div className="mt-1">{helperText}</div> : null}
              {collectorName && canViewCollectorIdentity ? (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <strong>Collector:</strong> {collectorName}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <X size={16} className="inline mr-1" />
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || submitDisabled}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-md disabled:opacity-70"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedSubmitReportModal;
