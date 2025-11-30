import React from "react";
import { ArrowLeft, CheckCircle, Lock, Unlock, FileText, User, CreditCard } from "lucide-react";

const ApplicationReviewModal = ({ 
  isOpen, 
  reviewData, 
  onClose, 
  onBack, 
  onUnlockPayment, 
  onProceedToLease 
}) => {
  if (!isOpen || !reviewData) return null;

  // Safe access to UID for display (Fixes the .slice error)
  // We convert to String() first to handle cases where uid might be a number or undefined object
  const displayId = reviewData?.uid 
    ? String(reviewData.uid).slice(-6).toUpperCase() 
    : "---";
  
  const isPaymentUnlocked = reviewData.status === "PAYMENT_UNLOCKED";
  // Check if receipt exists for logic, even if not displayed
  const hasProofOfPayment = !!reviewData.receiptUrl; 

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Application Review</h3>
              <p className="text-sm text-slate-500">ID: {displayId}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
            isPaymentUnlocked ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {reviewData.status || "Pending"}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* 1. Applicant Details */}
          <section>
            <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">
              <User size={18} className="text-emerald-600" /> Applicant Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                <p className="font-medium text-slate-800">{reviewData.name || "N/A"}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Contact</label>
                <p className="font-medium text-slate-800">{reviewData.contact || "N/A"}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                <p className="font-medium text-slate-800">{reviewData.email || "N/A"}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Target Slot</label>
                <p className="font-medium text-slate-800">
                  {reviewData.targetSlot ? `${reviewData.targetSlot} (${reviewData.floor || "General"})` : "Any"}
                </p>
              </div>
            </div>
          </section>

          {/* 2. Documents */}
          <section>
            <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">
              <FileText size={18} className="text-emerald-600" /> Submitted Documents
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Valid ID", url: reviewData.validIdUrl },
                { label: "Business Permit", url: reviewData.permitUrl },
                { label: "Brgy Clearance", url: reviewData.clearanceUrl },
                // Payment Receipt removed from display
              ].map((doc, idx) => (
                <div key={idx} className="group relative aspect-square bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center">
                  {doc.url ? (
                    <img 
                      src={doc.url} 
                      alt={doc.label} 
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(doc.url, '_blank')}
                    />
                  ) : (
                    <span className="text-xs text-slate-400 italic text-center px-2">No {doc.label}</span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-1 text-center font-medium">
                    {doc.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Payment Status */}
          <section>
            <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">
              <CreditCard size={18} className="text-emerald-600" /> Payment Verification
            </h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Reference Number</p>
                  <p className="text-lg font-mono font-bold text-slate-900">{reviewData.paymentReference || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 text-right">Amount Paid</p>
                  <p className="text-lg font-bold text-emerald-600 text-right">
                    {reviewData.paymentAmount ? `₱${Number(reviewData.paymentAmount).toLocaleString()}` : "₱0.00"}
                  </p>
                </div>
              </div>
              
              {!isPaymentUnlocked && (
                <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg flex items-start gap-2">
                  <Lock size={16} className="mt-0.5 shrink-0" />
                  <p>
                    <strong>Action Required:</strong> Review the documents above. If everything looks good, unlock the payment portal for this applicant so they can proceed with the official lease.
                  </p>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          {!isPaymentUnlocked ? (
            <button 
              onClick={() => {
                console.log("Unlock Payment Clicked"); // Debug log
                onUnlockPayment();
              }}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Unlock size={18} />
              Verify & Unlock Payment
            </button>
          ) : (
            <button 
              onClick={onProceedToLease}
              // If you removed the receipt because they don't provide one, 
              // you might want to remove this 'disabled' check as well.
              // disabled={!hasProofOfPayment} 
              className={`px-6 py-3 rounded-xl font-bold shadow-md flex items-center gap-2 transition-all bg-emerald-600 text-white hover:bg-emerald-700`}
            >
              <CheckCircle size={18} />
              Approve & Create Lease
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ApplicationReviewModal;