import React, { useState } from "react";
import { ArrowLeft, CheckCircle, Lock, Unlock, FileText, User, CreditCard, X, ZoomIn, PenTool } from "lucide-react";

const ApplicationReviewModal = ({ 
  isOpen, 
  reviewData, 
  onClose, 
  onBack, 
  onUnlockPayment, 
  onProceedToLease,
  onRequestContract 
}) => {
  const [previewImage, setPreviewImage] = useState(null);

  if (!isOpen || !reviewData) return null;

  const displayId = reviewData?._id 
    ? String(reviewData._id).slice(-6).toUpperCase() 
    : "---";
  
  const status = reviewData.status || "Pending";
  const isPermanent = (reviewData.floor === "Permanent" || reviewData.tenantType === "Permanent");

  const isPaymentReview = status === "PAYMENT_REVIEW"; 
  const isContractReview = status === "CONTRACT_REVIEW";
  
  const showUnlockBtn = status === "VERIFICATION_PENDING";
  const showRequestContractBtn = isPaymentReview && isPermanent;
  const showAddTenantBtn = (isPaymentReview && !isPermanent) || isContractReview;

  // DOCUMENT LOGIC
  const showContractSlot = isPermanent || reviewData.contractUrl;
  const documents = [
    { label: "Valid ID", url: reviewData.validIdUrl },
    { label: "Business Permit", url: reviewData.permitUrl },
    { label: "Brgy Clearance", url: reviewData.clearanceUrl },
    { label: "Payment Receipt", url: reviewData.receiptUrl },
    ...(showContractSlot ? [{ label: "Signed Contract", url: reviewData.contractUrl }] : [])
  ];

  return (
    <>
      {/* --- IMAGE PREVIEW OVERLAY --- */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)} 
        >
          <button 
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-5 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 hover:text-red-400 transition-all"
          >
            <X size={32} />
          </button>
          <img 
            src={previewImage} 
            alt="Document Preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      {/* --- MAIN MODAL --- */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
          
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <button 
                onClick={onBack} 
                className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-full transition-all text-slate-500"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Application Review</h3>
                <p className="text-sm text-slate-500 font-mono">ID: {displayId}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
              (status === 'PAYMENT_REVIEW' || status === 'CONTRACT_REVIEW') 
                ? 'bg-amber-100 text-amber-700 border-amber-200' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {status}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Applicant Details */}
            <section>
              <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">
                <User size={18} className="text-emerald-600" /> Applicant Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label><p className="font-semibold text-slate-800 text-lg">{reviewData.name || "N/A"}</p></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</label><p className="font-medium text-slate-800">{reviewData.contact || "N/A"}</p></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label><p className="font-medium text-slate-800">{reviewData.email || "N/A"}</p></div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Slot</label>
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                    {reviewData.targetSlot ? <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-sm font-bold">{reviewData.targetSlot}</span> : "Any"}
                    <span className="text-slate-500 text-sm">({reviewData.floor || "General"})</span>
                  </p>
                </div>
              </div>
            </section>

            {/* Documents */}
            <section>
              <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">
                <FileText size={18} className="text-emerald-600" /> Submitted Documents
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {documents.map((doc, idx) => (
                  <div 
                    key={idx} 
                    className="group relative aspect-[4/3] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    {doc.url ? (
                      <>
                        {(doc.url.startsWith("data:application/pdf") || doc.url.toLowerCase().endsWith(".pdf")) ? (
                            <div 
                                className="w-full h-full flex flex-col items-center justify-center bg-red-50 hover:bg-red-100 transition-colors"
                                onClick={() => {
                                    const pdfWindow = window.open("");
                                    if (pdfWindow) pdfWindow.document.write(`<iframe width='100%' height='100%' src='${doc.url}'></iframe>`);
                                }} 
                            >
                                <FileText size={40} className="text-red-500 mb-2" />
                                <span className="text-xs font-bold text-red-700">PDF Document</span>
                                <span className="text-[10px] text-red-400">(Click to Open)</span>
                            </div>
                        ) : (
                            <div className="w-full h-full" onClick={() => setPreviewImage(doc.url)}>
                                <img src={doc.url} alt={doc.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 drop-shadow-lg" size={28} />
                                </div>
                            </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center"><FileText size={24} className="mb-2 opacity-50" /><span className="text-xs italic">Not Uploaded</span></div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] py-1.5 text-center font-bold border-t border-slate-100">{doc.label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Verification Status */}
            <section>
              <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">
                <CreditCard size={18} className="text-emerald-600" /> Verification Status
              </h4>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <div><p className="text-xs font-bold text-slate-500 uppercase">Ref No</p><p className="font-mono font-bold text-slate-800">{reviewData.paymentReference || "PENDING"}</p></div>
                  <div className="text-right"><p className="text-xs font-bold text-slate-500 uppercase">Amount</p><p className="text-xl font-bold text-emerald-600">{reviewData.paymentAmount ? `₱${Number(reviewData.paymentAmount).toLocaleString()}` : "₱0.00"}</p></div>
                </div>
                
                <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg flex items-start gap-3 border border-blue-100">
                    <Lock size={18} className="mt-0.5 shrink-0 text-blue-600" />
                    <p className="leading-relaxed">
                      {showUnlockBtn && "Step 1: Verify documents above, then click 'Unlock Payment'."}
                      {status === "PAYMENT_UNLOCKED" && "Waiting for applicant to upload receipt..."}
                      {showRequestContractBtn && "Step 2: Payment Verified. Permanent Slot requires a contract. Click 'Request Contract'."}
                      {status === "CONTRACT_PENDING" && "Waiting for applicant to upload signed contract..."}
                      {showAddTenantBtn && "Final Step: All documents verified. Click 'Approve & Create Lease' to finish."}
                    </p>
                </div>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
            {showUnlockBtn && (
              <button onClick={onUnlockPayment} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95">
                <Unlock size={18} /> Verify & Unlock Payment
              </button>
            )}

            {showRequestContractBtn && (
                <button onClick={onRequestContract} className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-orange-600 transition-all flex items-center gap-2 active:scale-95">
                  <PenTool size={18} /> Request Contract
                </button>
            )}

            {showAddTenantBtn && (
              <button onClick={onProceedToLease} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95">
                <CheckCircle size={18} /> Approve & Create Lease
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default ApplicationReviewModal;