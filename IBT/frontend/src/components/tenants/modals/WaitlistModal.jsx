import React, { useState } from "react"; 
import { X, ClipboardList, CreditCard, Eye, Filter, AlertTriangle, FileSignature, XCircle } from "lucide-react";


const getTimeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30);
  const years = Math.round(days / 365);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${years} year${years > 1 ? 's' : ''} ago`;
};


const WaitlistModal = ({ 
  isOpen, 
  onClose, 
  waitlistData, 
  onApprove, 
  onReject,
  renewalsData = [], 
  onReviewRenewal,
  onRejectRenewal,
   initialTab = "All"
}) => {
  const [statusFilter, setStatusFilter] = useState(initialTab);
  const [slotTypeFilter, setSlotTypeFilter] = useState("All"); 

 React.useEffect(() => {
    if (isOpen) {
      setStatusFilter(initialTab);
      setSlotTypeFilter("All"); 
    }
  }, [isOpen, initialTab]);
  
 const [rejectData, setRejectData] = useState({ isOpen: false, appId: null, isRenewal: false });
 const [rejectionReason, setRejectionReason] = useState("");

  if (!isOpen) return null;

  const isRenewalsTab = statusFilter === "Renewals";


const baseFilteredData = isRenewalsTab 
  ? renewalsData 
  : statusFilter === "All"
    ? [...waitlistData, ...renewalsData] 
    : waitlistData.filter((app) => {
        if (statusFilter === "Verification Pending") return !app.status || app.status === "VERIFICATION_PENDING";
        if (statusFilter === "Payment Review") return app.status === "PAYMENT_REVIEW" || app.status === "PAYMENT_UNLOCKED";
        if (statusFilter === "Contract Review") return app.status === "CONTRACT_REVIEW" || app.status === "CONTRACT_PENDING";
        if (statusFilter === "Rejected") return app.status === "REJECTED";
        return true;
      });

const filteredData = baseFilteredData.filter((app) => {
    if (slotTypeFilter === "All") return true;
    const type = app.floor || app.tenantType; 
    return type === slotTypeFilter;
});


const isRenewalRecord = (app) => renewalsData.some(r => (r._id || r.id) === (app._id || app.id));

  const handleOpenReject = (appId, isRenewal = false) => {
    setRejectionReason("");
    setRejectData({ isOpen: true, appId, isRenewal });
  };

  const handleConfirmReject = () => {
    if (rejectData.isRenewal && onRejectRenewal) {
        onRejectRenewal(rejectData.appId, rejectionReason);
    } else if (onReject) {
        onReject(rejectData.appId, rejectionReason);
    }
    setRejectData({ isOpen: false, appId: null, isRenewal: false });
  };

  return (
    <>
      {rejectData.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-2 text-red-600">
              <AlertTriangle size={24} /> Reject Application
            </h3>
            <p className="text-slate-600 text-sm mb-4">Please specify why this application is being rejected. This will be emailed to the applicant.</p>
            
            <textarea 
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none mb-4"
              rows="3"
              placeholder="e.g., Blurred ID, Missing Pages, Incorrect Business Permit..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setRejectData({ isOpen: false, appId: null })} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Cancel</button>
              <button 
                onClick={handleConfirmReject} 
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div className="w-full max-w-6xl rounded-xl bg-white p-6 shadow-2xl flex flex-col max-h-[85vh]">
          <div className="flex justify-between items-center mb-4 border-b pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <ClipboardList className="text-emerald-600" /> Applicants & Renewals
              </h3>
              <p className="text-xs text-slate-500 mt-1">Manage incoming applications and lease renewal payments.</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"><X size={20}/></button>
          </div>
          
          <div className="flex gap-2 mb-4 flex-wrap items-center">
              <button onClick={() => setStatusFilter("All")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border flex items-center gap-2 ${statusFilter === "All" ? "bg-emerald-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>All ({waitlistData.length + (renewalsData?.length || 0)})</button>
              <button onClick={() => setStatusFilter("Verification Pending")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border flex items-center gap-2 ${statusFilter === "Verification Pending" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}><Eye size={12}/> Verification Pending</button>
              <button onClick={() => setStatusFilter("Payment Review")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border flex items-center gap-2 ${statusFilter === "Payment Review" ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}><CreditCard size={12}/> Payment Review</button>
              <button onClick={() => setStatusFilter("Contract Review")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border flex items-center gap-2 ${statusFilter === "Contract Review" ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}><FileSignature size={12}/> Contract Review</button>
              <button onClick={() => setStatusFilter("Rejected")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border flex items-center gap-2 ${statusFilter === "Rejected" ? "bg-red-500 text-white border-red-500" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}><XCircle size={12}/> Rejected</button>
              
              <button onClick={() => setStatusFilter("Renewals")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border flex items-center gap-2 ${statusFilter === "Renewals" ? "bg-yellow-500 text-white border-yellow-500 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yelow-200"}`}>
                  <ClipboardList size={12}/> Pending Renewals ({renewalsData?.length || 0})
              </button>

             
              <div className="ml-auto flex items-center gap-2 border-l border-slate-200 pl-3">
                  <span className="text-xs font-bold text-slate-500">TYPE:</span>
                  <select
                      value={slotTypeFilter}
                      onChange={(e) => setSlotTypeFilter(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-1.5 outline-none font-bold shadow-sm cursor-pointer"
                  >
                      <option value="All">All Slots</option>
                      <option value="Permanent">Permanent</option>
                      <option value="Night Market">Night Market</option>
                  </select>
              </div>
             
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                  <Filter size={40} className="opacity-20 mb-3"/>
                  <p className="font-medium text-slate-500">No records found for this filter.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Name & Contact</th>
                    <th className="px-4 py-3">Slot / Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((app) => (
                    <tr key={app._id || app.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3">
                          <div className="font-bold text-slate-800 text-base">{app.tenantName || app.name}</div>
                          <div className="text-xs text-slate-500 font-medium">{app.contactNo || app.contact}</div>
                          
                          
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            {new Date(app.createdAt || app.dateRequested || app.StartDateTime).toLocaleDateString()}
                            <span className="italic font-medium text-emerald-600">
                              ({getTimeAgo(app.createdAt || app.dateRequested || app.StartDateTime)})
                            </span>
                          </div>
                          
                          
                      </td>
                      <td className="px-4 py-3">
                          <div className="flex flex-col items-start gap-1">
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold border border-emerald-100 shadow-sm">
                                  {app.slotNo || app.targetSlot || "Any Slot"}
                              </span>
                              <span className="text-xs text-slate-600 font-medium">{app.product || app.tenantType || "Permanent"}</span>
                          </div>
                      </td>
                      <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
                              app.status === 'PAYMENT_REVIEW' || app.status === 'Payment Review' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              app.status === 'PAYMENT_UNLOCKED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              app.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                              app.status === 'CONTRACT_REVIEW' || app.status === 'CONTRACT_PENDING' ? 'bg-green-50 text-green-700 border-green-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {app.status ? app.status.replace('_', ' ') : 'DOC REVIEW'}
                          </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                              {app.status !== 'REJECTED' && (
                                <button onClick={() => handleOpenReject(app._id || app.id, isRenewalRecord(app))} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-transparent hover:border-red-100 transition-all">Reject</button>
                              )}
                              
                              <button 
                                onClick={() => isRenewalRecord(app) ? onReviewRenewal(app) : onApprove(app)} 
                                className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
                                  isRenewalRecord(app) ? 'bg-orange-600 hover:bg-orange-700' :
                                  (app.status === 'PAYMENT_REVIEW' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-600 hover:bg-emerald-700')
                                }`}
                              >
                                {isRenewalRecord(app) ? <><ClipboardList size={14}/> Review Renewal</> : 
                                (app.status === 'PAYMENT_REVIEW' ? <><CreditCard size={14}/> Check Payment</> : <><Eye size={14}/> Review Docs</>)}
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
    </>
  );
};

export default WaitlistModal;