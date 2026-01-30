import React from "react";
import { X, FileText, Eye, ExternalLink } from "lucide-react";
import Field from "../../common/Field"; 

const TenantViewModal = ({ viewRow, onClose }) => {
  if (!viewRow) return null;
  const documentList = [
    { 
      key: 'permit', 
      label: "Business Permit", 
      url: viewRow.documents?.businessPermit || viewRow.permitUrl 
    },
    { 
      key: 'id', 
      label: "Valid ID", 
      url: viewRow.documents?.validID || viewRow.validIdUrl 
    },
    { 
      key: 'clearance', 
      label: "Barangay Clearance", 
      url: viewRow.documents?.barangayClearance || viewRow.clearanceUrl 
    },
    { 
      key: 'receipt', 
      label: "Proof of Receipt", 
      url: viewRow.documents?.proofOfReceipt || viewRow.receiptUrl 
    },
    { 
      key: 'contract', 
      label: "Signed Contract", 
      url: viewRow.documents?.contract || viewRow.contractUrl 
    }
  ].filter(doc => doc.url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-white p-0 shadow-2xl ring-1 ring-slate-900/5 flex flex-col max-h-[90vh]">
        
        {/* --- HEADER --- */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Tenant Details</h3>
            <p className="text-xs text-slate-500">ID: {viewRow._id || viewRow.id}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- SCROLLABLE CONTENT --- */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* 1. Basic Information */}
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Field label="Slot Number" value={viewRow.slotNo} />
                <Field label="Reference No" value={viewRow.referenceNo || viewRow.referenceno} />
                <Field label="Tenant Name" value={viewRow.tenantName || viewRow.name} />
                <Field label="Lease Type" value={viewRow.tenantType || viewRow.floor || "Permanent"} />
                <Field label="Contact No" value={viewRow.contactNo || viewRow.contact} />
                <Field label="Email Address" value={viewRow.email} />
            </div>
          </section>

          {/* 2. Financial Details */}
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Financial Details
            </h4>
            <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <Field label="Rent Amount" value={viewRow.rentAmount ? `₱${Number(viewRow.rentAmount).toLocaleString()}` : "₱0.00"} />
                <Field label="Utility Fee" value={viewRow.utilityAmount ? `₱${Number(viewRow.utilityAmount).toLocaleString()}` : "₱0.00"} />
                <Field label="Total Due" value={viewRow.totalAmount ? `₱${Number(viewRow.totalAmount).toLocaleString()}` : "₱0.00"} />
            </div>
          </section>

          {/* 3. DOCUMENTS (The Fixed Part) */}
          <section>
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Attached Documents
                </h4>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200">
                    {documentList.length} Files Found
                </span>
            </div>

            {documentList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {documentList.map((doc) => {
                    const isPDF = doc.url.toLowerCase().includes("application/pdf") || doc.url.toLowerCase().endsWith(".pdf");

                    return (
                      <div 
                        key={doc.key} 
                        className="group relative aspect-square bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer"
                        onClick={() => window.open(doc.url, "_blank")}
                        title="Click to View"
                      >
                        {isPDF ? (
                            // PDF VIEW
                            <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors">
                                <FileText size={32} />
                                <span className="text-[10px] font-bold mt-2 uppercase tracking-wide">PDF Document</span>
                            </div>
                        ) : (
                            // IMAGE VIEW
                            <>
                                <img 
                                    src={doc.url} 
                                    alt={doc.label} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <Eye className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md transform scale-75 group-hover:scale-100 transition-all" size={24} />
                                </div>
                            </>
                        )}
                        
                        {/* Label Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 py-2 px-1">
                            <p className="text-[10px] font-bold text-center text-slate-700 truncate">
                                {doc.label}
                            </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                  <FileText size={32} className="mb-2 opacity-30" />
                  <span className="text-sm font-medium">No documents uploaded yet.</span>
                </div>
            )}
          </section>

        </div>
        
        {/* --- FOOTER --- */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 hover:shadow-sm transition-all text-sm"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default TenantViewModal;