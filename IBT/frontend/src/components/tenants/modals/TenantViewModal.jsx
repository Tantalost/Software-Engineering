import React from "react";
import { X, FileText, Eye } from "lucide-react";
import Field from "../../common/Field"; 

const TenantViewModal = ({ viewRow, onClose }) => {
  if (!viewRow) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
          <h3 className="text-lg font-semibold text-slate-800">Tenant Details</h3>
          <button onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
            <div className="col-span-1 md:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <Field label="Slot No" value={viewRow.slotNo} />
                <Field label="Reference No" value={viewRow.referenceNo || viewRow.referenceno} />
                <Field label="Name" value={viewRow.tenantName || viewRow.name} />
                <Field label="Type" value={viewRow.tenantType || "Permanent"} />
                <Field label="Contact" value={viewRow.contactNo || viewRow.contact} />
                <Field label="Email" value={viewRow.email} />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 mt-2">Financial Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                <Field label="Rent" value={viewRow.rentAmount ? `₱${viewRow.rentAmount.toLocaleString()}` : "₱0.00"} />
                <Field label="Utility" value={viewRow.utilityAmount ? `₱${viewRow.utilityAmount.toLocaleString()}` : "₱0.00"} />
                <Field label="Total" value={viewRow.totalAmount ? `₱${viewRow.totalAmount.toLocaleString()}` : "₱0.00"} />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2 border-t border-slate-100 pt-4">
                <FileText size={14} /> Documents Submitted
              </h4>
              {viewRow.documents && Object.keys(viewRow.documents).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(viewRow.documents).map(([key, file]) => {
                    if (!file) return null;
                    const fileName = file.name || "Unknown File";
                    return (
                      <div key={key} className="group flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-400 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-white rounded-lg border border-slate-100 text-emerald-600 shadow-sm">
                            <FileText size={18} />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-sm font-medium text-slate-700 truncate w-32 sm:w-auto" title={fileName}>{fileName}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (file instanceof File || file instanceof Blob) {
                              const fileURL = URL.createObjectURL(file);
                              window.open(fileURL, '_blank');
                            } else {
                              alert(`Preview not available for mock data.`);
                            }
                          }}
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-400">
                  <FileText size={24} className="mb-2 opacity-50" />
                  <span className="text-sm">No documents uploaded.</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end pt-4 border-t border-slate-100">
          <button onClick={onClose} className="rounded-lg bg-white border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">Close</button>
        </div>
      </div>
    </div>
  );
};

export default TenantViewModal;