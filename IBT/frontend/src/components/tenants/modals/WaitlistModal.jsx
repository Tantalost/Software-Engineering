import React, { useState } from "react"; 
import { X, ClipboardList, UserCheck, CreditCard, Eye, Filter } from "lucide-react";

const WaitlistModal = ({ 
  isOpen, onClose, waitlistData, onApprove, onReject 
}) => {
  // 1. ADD STATE FOR FILTER
  const [statusFilter, setStatusFilter] = useState("All"); 

  if (!isOpen) return null;

  // 2. FILTER LOGIC
  const filteredData = waitlistData.filter((app) => {
    if (statusFilter === "All") return true;
    
    if (statusFilter === "Verification Pending") {
        // Show if status is missing OR explicitly pending
        return !app.status || app.status === "VERIFICATION_PENDING";
    }
    
    if (statusFilter === "Payment Review") {
        // Show Payment Review OR Payment Unlocked (since they are in the same bucket)
        return app.status === "PAYMENT_REVIEW" || app.status === "PAYMENT_UNLOCKED";
    }
    
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-xl bg-white p-6 shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="text-emerald-600" /> Waitlist Applications
            </h3>
            <p className="text-xs text-slate-500 mt-1">Manage incoming applications and payments.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200"><X size={20}/></button>
        </div>

        {/* 3. FILTER BUTTONS UI */}
        <div className="flex gap-2 mb-4">
            <button 
                onClick={() => setStatusFilter("All")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                    statusFilter === "All" ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white " : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
            >
                All ({waitlistData.length})
            </button>
            <button 
                onClick={() => setStatusFilter("Verification Pending")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border flex items-center gap-2 ${
                    statusFilter === "Verification Pending" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
            >
                <Eye size={12}/> Verification Pending
            </button>
            <button 
                onClick={() => setStatusFilter("Payment Review")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border flex items-center gap-2 ${
                    statusFilter === "Payment Review" ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
            >
                <CreditCard size={12}/> Payment Review
            </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredData.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                <Filter size={32} className="opacity-20 mb-2"/>
                <p>No applications found for this filter.</p>
             </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Slot / Product</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* 4. MAP FILTERED DATA */}
                {filteredData.map((app) => (
                  <tr key={app.uid || app._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{app.name}</div>
                        <div className="text-xs text-slate-500">{app.contact}</div>
                        <div className="text-[10px] text-slate-400">{new Date(app.dateRequested).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100">
                                {app.targetSlot}
                            </span>
                            <span className="text-xs text-slate-600">{app.product}</span>
                        </div>
                    </td>
                    <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                            app.status === 'PAYMENT_REVIEW' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            app.status === 'PAYMENT_UNLOCKED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                           {app.status ? app.status.replace('_', ' ') : 'DOC REVIEW'}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                            <button 
                                // FIX: Use app.uid because backend deletes by uid
                                onClick={() => onReject(app.uid)} 
                                className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-transparent hover:border-red-100 transition-all"
                            >
                                Reject
                            </button>
                            <button 
                                onClick={() => onApprove(app)} 
                                className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 ${
                                    app.status === 'PAYMENT_REVIEW' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                            >
                                {app.status === 'PAYMENT_REVIEW' ? <><CreditCard size={14}/> Check Payment</> : <><Eye size={14}/> Review Docs</>}
                            </button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitlistModal;