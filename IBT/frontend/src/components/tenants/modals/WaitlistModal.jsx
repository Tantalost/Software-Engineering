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
  
  const [rejectData, setRejectData] = useState({ isOpen: false, appId: null });
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
        if (statusFilter === "Contract Pending") return app.status === "CONTRACT_PENDING";
        if (statusFilter === "Contract Review") return app.status === "CONTRACT_REVIEW";
        if (statusFilter === "Rejected") return app.status === "REJECTED";
        return true;
      });


const filteredData = baseFilteredData.filter((app) => {
    if (slotTypeFilter === "All") return true;
    const type = app.floor || app.tenantType; 
    return type === slotTypeFilter;
});

  const isRenewalRecord = (record) => {
    return record.slotNo !== undefined && record.tenantName !== undefined; 
  };

  const getStatusBadge = (status, isRenewal) => {
    if (isRenewal) {
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 flex items-center gap-1 w-max border border-orange-200"><ClipboardList size={12}/> Renewal Pending</span>;
    }
    
    switch(status) {
      case 'PAYMENT_UNLOCKED':
      case 'PAYMENT_REVIEW':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1 w-max border border-blue-200"><CreditCard size={12}/> Payment Phase</span>;
      case 'CONTRACT_PENDING':
      case 'CONTRACT_REVIEW':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 flex items-center gap-1 w-max border border-purple-200"><FileSignature size={12}/> Contract Phase</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1 w-max border border-red-200"><XCircle size={12}/> Rejected</span>;
      case 'VERIFICATION_PENDING':
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 flex items-center gap-1 w-max border border-amber-200"><AlertTriangle size={12}/> Verification</span>;
    }
  };

  const handleOpenReject = (appId) => {
    setRejectData({ isOpen: true, appId });
    setRejectionReason("");
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
        alert("Please provide a reason for rejection.");
        return;
    }
    onReject(rejectData.appId, rejectionReason);
    setRejectData({ isOpen: false, appId: null });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-white/10">
          
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                <ClipboardList className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Application Review Center</h3>
                <p className="text-emerald-100 text-sm font-medium">Process waitlist applications and stall renewals</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full sm:w-auto pb-2 sm:pb-0">
              {["All", "Verification Pending", "Payment Review", "Contract Pending", "Contract Review", "Renewals", "Rejected"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                    statusFilter === tab
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-200 transform scale-105"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-emerald-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

          
            <div className="w-full sm:w-auto flex justify-end">
                <select
                    value={slotTypeFilter}
                    onChange={(e) => setSlotTypeFilter(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 outline-none font-bold shadow-sm w-full sm:w-auto cursor-pointer"
                >
                    <option value="All">All Slots</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Night Market">Night Market</option>
                </select>
            </div>
         
          </div>

          <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50">
            {filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <Filter size={48} className="mb-4 text-slate-300" />
                <p className="text-lg font-bold text-slate-500">No applications found</p>
                <p className="text-sm">Try adjusting your filters to see more results.</p>
              </div>
            ) : (
              <table className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-4 first:rounded-tl-2xl">Applicant / Tenant</th>
                    <th className="px-4 py-4">Contact Info</th>
                    <th className="px-4 py-4">Target Slot</th>
                    <th className="px-4 py-4">Phase</th>
                    <th className="px-4 py-4">Submission Date</th>
                    <th className="px-4 py-4 text-right last:rounded-tr-2xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map((app, idx) => (
                    <tr key={app._id || app.id || idx} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{app.name || app.tenantName}</p>
                        <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-max mt-1">{isRenewalRecord(app) ? "Renewal" : "New Application"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700 font-medium">{app.contact || app.contactNo}</p>
                        <p className="text-xs text-slate-500">{app.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-700">{app.targetSlot || app.slotNo}</p>
                        <p className="text-xs text-slate-500">{app.floor || app.tenantType}</p>
                      </td>
                      <td className="px-4 py-3">
                         {getStatusBadge(app.status, isRenewalRecord(app))}
                      </td>
                      
                     
                      <td className="px-4 py-3 text-sm text-slate-600">
                         <div className="flex flex-col">
                           <span className="font-medium">{new Date(app.createdAt || app.updatedAt).toLocaleString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}</span>
                           <span className="text-xs text-emerald-600 font-bold italic mt-0.5">
                               ({getTimeAgo(app.createdAt || app.updatedAt)})
                           </span>
                         </div>
                      </td>
                    

                      <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                              
                              {!isRenewalRecord(app) && app.status !== 'REJECTED' && (
                                  <button onClick={() => handleOpenReject(app._id || app.id)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-transparent hover:border-red-100 transition-all">Reject</button>
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

      {rejectData.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all scale-100">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                    <AlertTriangle size={28} />
                    <h3 className="text-xl font-bold">Reject Application</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">Please provide a reason for rejecting this application. This will be visible to the applicant.</p>
                <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none h-32 mb-6"
                    placeholder="E.g., Incomplete documents, blurred ID..."
                ></textarea>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setRejectData({ isOpen: false, appId: null })} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                    <button onClick={confirmReject} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition-colors active:scale-95">Confirm Rejection</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default WaitlistModal;