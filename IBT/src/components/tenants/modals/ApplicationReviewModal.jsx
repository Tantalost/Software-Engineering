// src/components/tenants/modals/ApplicationReviewModal.jsx
import React from "react";
import { ArrowLeft, XCircle, UserCheck, FileText, CheckCircle, CreditCard } from "lucide-react";

const ApplicationReviewModal = ({ 
  isOpen, 
  reviewData, 
  onClose, 
  onBack, 
  onUnlockPayment, 
  onProceedToLease 
}) => {
  if (!isOpen || !reviewData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 p-4 flex justify-between items-center text-white rounded-t-xl shrink-0">
           <div className="flex items-center gap-3">
               <button onClick={onBack} className="p-1.5 rounded-full hover:bg-emerald-600 transition-colors" title="Back to Waitlist">
                   <ArrowLeft size={22} />
               </button>
               <div className="h-6 w-px bg-emerald-600 mx-1"></div>
               <h2 className="font-bold text-lg flex items-center gap-2">
                   <UserCheck size={20}/> Verify Application
               </h2>
           </div>
           <button onClick={onClose} className="hover:bg-emerald-600 p-1 rounded-full transition-colors">
               <XCircle size={22}/>
           </button>
        </div>
        
        
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-xl text-slate-800">{reviewData.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">ID: {reviewData.id.slice(-6)}</span>
                  </div>
                  <div className="space-y-1 mb-3">
                      <p className="text-sm text-slate-600 flex items-center gap-2"><span className="font-semibold">📞</span> {reviewData.contact}</p>
                      <p className="text-sm text-slate-600 flex items-center gap-2"><span className="font-semibold">✉️</span> {reviewData.email}</p>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-md font-bold border border-blue-200">
                        Slot: {reviewData.targetSlot}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-md font-bold border border-emerald-200">
                        {reviewData.product}
                      </span>
                  </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 border-b pb-2">
                    <FileText size={18}/> 1. Identity Documents
                </h4>
                <div className="grid grid-cols-3 gap-3">
                    <DocumentPreview label="Business Permit" url={reviewData.permitUrl} />
                    <DocumentPreview label="Valid ID" url={reviewData.validIdUrl} />
                    <DocumentPreview label="Brgy. Clearance" url={reviewData.clearanceUrl} />
                </div>
              </div>
          </div>

          <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-700 text-sm">Current Status</h4>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    reviewData.status === 'PAYMENT_REVIEW' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                    reviewData.status === 'PAYMENT_UNLOCKED' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 border-slate-200'
                }`}>
                    {reviewData.status ? reviewData.status.replace('_', ' ') : "PENDING"}
                </span>
              </div>

              <div className={`p-5 rounded-xl border-2 border-dashed ${reviewData.receiptUrl ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-dashed border-slate-300 pb-2">
                    <CreditCard size={18} className="text-slate-500"/> 2. Payment Verification
                  </h4>
                  {reviewData.receiptUrl ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-2 rounded border border-orange-100">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Ref No.</p>
                                <p className="font-mono font-bold text-slate-800">{reviewData.paymentReference}</p>
                            </div>
                            <div className="bg-white p-2 rounded border border-orange-100">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Amount</p>
                                <p className="font-mono font-bold text-emerald-600">₱{reviewData.paymentAmount}</p>
                            </div>
                        </div>
                        <div className="group relative rounded-lg overflow-hidden border border-orange-200 shadow-sm">
                            <img src={reviewData.receiptUrl} alt="Receipt" className="w-full h-48 object-contain bg-white cursor-pointer" onClick={() => window.open(reviewData.receiptUrl)} />
                        </div>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                          <CreditCard size={40} className="mb-2 opacity-20"/>
                          <p className="text-sm font-medium">No receipt uploaded yet.</p>
                          <p className="text-xs">User must be "Unlocked" to upload.</p>
                      </div>
                  )}
              </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center rounded-b-xl shrink-0">
           <div className="text-xs text-slate-400 italic">
               Action Required: {reviewData.status === 'PAYMENT_REVIEW' ? 'Verify Payment' : 'Review Documents'}
           </div>
           <div className="flex gap-3">
               {(!reviewData.status || reviewData.status === 'VERIFICATION_PENDING') && (
                   <button onClick={onUnlockPayment} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-5 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95">
                       <CheckCircle size={18}/> Approve Docs & Unlock
                   </button>
               )}

               {(reviewData.status === 'PAYMENT_UNLOCKED' || reviewData.status === 'PAYMENT_REVIEW') && (
                   <button 
                     onClick={onProceedToLease} 
                     disabled={!reviewData.receiptUrl}
                     className={`px-5 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95 text-white ${!reviewData.receiptUrl ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'}`}
                   >
                       <UserCheck size={18}/> Confirm & Finalize
                   </button>
               )}
           </div>
        </div>
      </div>
    </div>
  );
};

const DocumentPreview = ({ label, url }) => (
    <div className="group">
        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">{label}</p>
        {url ? (
            <div className="relative overflow-hidden rounded-lg border border-slate-300 h-28 cursor-pointer" onClick={() => window.open(url)}>
                <img src={url} alt={label} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
            </div>
        ) : <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded">Missing</span>}
    </div>
);

export default ApplicationReviewModal;