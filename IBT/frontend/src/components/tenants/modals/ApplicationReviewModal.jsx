import React, { useState, useMemo } from "react";
import { 
  ArrowLeft, CheckCircle, Lock, Unlock, FileText, User, 
  CreditCard, X, ZoomIn, PenTool, Download, AlertTriangle 
} from "lucide-react";

const ApplicationReviewModal = ({ 
  isOpen, 
  reviewData,
  defaultPermanentPrice = 6000,
  onBack, 
  onUnlockPayment, 
  onProceedToLease,
  onRequestContract,
  onReject,
  onApproveRenewal 
}) => {
  const [previewImage, setPreviewImage] = useState(null);
  const [documentError, setDocumentError] = useState("");
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, action: null, title: "", message: "", isReject: false });
  const [rejectionReason, setRejectionReason] = useState("");

  const getFileUrl = (pathOrString) => {
    if (!pathOrString || typeof pathOrString !== 'string') return null;
    if (pathOrString.startsWith("data:") || pathOrString.startsWith("http")) return pathOrString;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:10000";
    return `${baseUrl}/api/stalls/doc/${pathOrString}`; 
  };

  const parseDocumentError = async (response) => {
    let errorText = "";
    try {
      errorText = await response.text();
    } catch (_) {}

    const lower = (errorText || "").toLowerCase();
    if (response.status === 422 || lower.includes('unable to decrypt') || lower.includes('decryption')) {
      return "This uploaded file can't be decrypted. Please ask the applicant to re-upload the document.";
    }
    if (response.status === 404) {
      return "Document file was not found in storage.";
    }
    return "Unable to open this document right now. Please try again.";
  };

  const ensureDocumentAccessible = async (url) => {
    const response = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!response.ok) {
      const parsedError = await parseDocumentError(response);
      throw new Error(parsedError);
    }
  };

  const openPdf = async (url) => {
    try {
      setDocumentError("");
      await ensureDocumentAccessible(url);
      window.open(url, '_blank');
    } catch (error) {
      setDocumentError(error.message || "Unable to open this PDF.");
    }
  };

  const safeData = reviewData || {};
  const isPermanent = (safeData.floor === "Permanent" || safeData.tenantType === "Permanent");
  const isTenantRenewal = !!safeData.tenantName; 

  const documents = useMemo(() => {
    if (!reviewData) return []; 
    
    // If it's a renewal, only show the receipt
    if (isTenantRenewal) {
        return [
            { label: "Renewal Receipt", url: getFileUrl(reviewData.documents?.proofOfReceipt) }
        ];
    }

    const showContractSlot = isPermanent || reviewData.contractUrl;
    return [
      { label: "Valid ID", url: getFileUrl(reviewData.validIdUrl) },
      { label: "Business Permit", url: getFileUrl(reviewData.permitUrl) },
      { label: "Brgy Clearance", url: getFileUrl(reviewData.clearanceUrl) },
      { label: "Payment Receipt", url: getFileUrl(reviewData.receiptUrl) },
      ...(showContractSlot ? [{ label: "Signed Contract", url: getFileUrl(reviewData.contractUrl) }] : []),
      ...(!isPermanent && reviewData.communityTaxUrl ? [{ label: "Community Tax", url: getFileUrl(reviewData.communityTaxUrl) }] : []),
      ...(!isPermanent && reviewData.policeClearanceUrl ? [{ label: "Police Clearance", url: getFileUrl(reviewData.policeClearanceUrl) }] : [])
    ];
  }, [reviewData, isPermanent, isTenantRenewal]);

  if (!isOpen || !reviewData) return null;

  const displayId = String(reviewData._id || reviewData.id).slice(-6).toUpperCase();
  const status = reviewData.status || "Pending";
  
  const isPaymentReview = status === "PAYMENT_REVIEW" || status === "Payment Review"; 
  const isContractReview = status === "CONTRACT_REVIEW";
  
  const showUnlockBtn = !isTenantRenewal && status === "VERIFICATION_PENDING";
  const showRequestContractBtn = !isTenantRenewal && isPaymentReview && isPermanent;
  const showAddTenantBtn = !isTenantRenewal && ((isPaymentReview && !isPermanent) || isContractReview);
  const showApproveRenewalBtn = isTenantRenewal && isPaymentReview;

  const handleDownload = async (e, url, label) => {
    e.stopPropagation();
    try {
      setDocumentError("");
      await ensureDocumentAccessible(url);

      const link = document.createElement('a');
      link.href = url;
      link.target = "_blank";
      link.download = `${label.replace(/\s+/g, '_')}_${(reviewData.tenantName || reviewData.name).replace(/\s+/g, '_')}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setDocumentError(error.message || "Unable to download this file.");
    }
  };

  const handleImagePreview = async (url) => {
    try {
      setDocumentError("");
      await ensureDocumentAccessible(url);
      setPreviewImage(url);
    } catch (error) {
      setDocumentError(error.message || "Unable to preview this image.");
    }
  };

  const handleActionClick = (actionType) => {
    if (actionType === 'unlock') {
      setConfirmConfig({ isOpen: true, action: 'unlock', title: 'Approve Documents', message: 'Are you sure you want to verify these documents and unlock payment for this applicant?', isReject: false });
    } else if (actionType === 'contract') {
      setConfirmConfig({ isOpen: true, action: 'contract', title: 'Request Contract', message: 'Payment has been verified. Are you sure you want to request the signed contract?', isReject: false });
    } else if (actionType === 'lease') {
      setConfirmConfig({ isOpen: true, action: 'lease', title: 'Approve & Create Lease', message: 'Are you sure you want to finalize this application and create a lease for this tenant?', isReject: false });
    } else if (actionType === 'renewal') {
      setConfirmConfig({ isOpen: true, action: 'renewal', title: 'Confirm Renewal Payment', message: 'Are you sure you want to verify this renewal receipt and update the next due date?', isReject: false });
    } else if (actionType === 'reject') {
      setRejectionReason("");
      setConfirmConfig({ isOpen: true, action: 'reject', title: 'Reject Application', message: 'Please provide a reason for rejecting this application. This will be sent to the user via email.', isReject: true });
    }
  };

  const handleConfirmExecute = () => {
    if (confirmConfig.action === 'unlock') onUnlockPayment(reviewData._id || reviewData.id);
    if (confirmConfig.action === 'contract') onRequestContract(reviewData._id || reviewData.id);
    if (confirmConfig.action === 'lease') onProceedToLease(reviewData._id || reviewData.id);
    if (confirmConfig.action === 'renewal') onApproveRenewal(reviewData._id || reviewData.id);
    if (confirmConfig.action === 'reject') {
      if (onReject) onReject(reviewData._id || reviewData.id, rejectionReason);
    }
    setConfirmConfig({ isOpen: false, action: null, title: "", message: "", isReject: false });
  };

  return (
    <>
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className={`text-xl font-bold flex items-center gap-2 mb-2 ${confirmConfig.isReject ? 'text-red-600' : 'text-slate-800'}`}>
              {confirmConfig.isReject ? <AlertTriangle size={24} /> : <CheckCircle size={24} className="text-emerald-500"/>}
              {confirmConfig.title}
            </h3>
            <p className="text-slate-600 text-sm mb-4">{confirmConfig.message}</p>
            
            {confirmConfig.isReject && (
              <textarea 
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none mb-4"
                rows="3"
                placeholder="Enter reason for rejection (e.g., Blurred ID, Invalid Permit)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setConfirmConfig({ ...confirmConfig, isOpen: false })} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Cancel</button>
              <button 
                onClick={handleConfirmExecute} 
                disabled={confirmConfig.isReject && !rejectionReason.trim()}
                className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-all disabled:opacity-50 ${confirmConfig.isReject ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                Confirm {confirmConfig.isReject ? "Rejection" : "Action"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
          <button onClick={() => setPreviewImage(null)} className="absolute top-5 right-5 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 hover:text-red-400 transition-all"><X size={32} /></button>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-slate-700" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-full transition-all text-slate-500"><ArrowLeft size={20} /></button>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{isTenantRenewal ? "Renewal Payment Review" : "Application Review"}</h3>
                <p className="text-sm text-slate-500 font-mono">ID: {displayId}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${(isPaymentReview || isContractReview) ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{status}</div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <section>
              <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100"><User size={18} className="text-emerald-600" /> {isTenantRenewal ? "Tenant" : "Applicant"} Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label><p className="font-semibold text-slate-800 text-lg">{reviewData.tenantName || reviewData.name || "N/A"}</p></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</label><p className="font-medium text-slate-800">{reviewData.contactNo || reviewData.contact || "N/A"}</p></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label><p className="font-medium text-slate-800">{reviewData.email || "N/A"}</p></div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Slot</label>
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                    {reviewData.targetSlot || reviewData.slotNo ? <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-sm font-bold">{reviewData.targetSlot || reviewData.slotNo}</span> : "Any"}
                    <span className="text-slate-500 text-sm">({reviewData.floor || reviewData.tenantType || "General"})</span>
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100"><FileText size={18} className="text-emerald-600" /> Submitted Documents</h4>
              {documentError && (
                <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {documentError}
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {documents.map((doc, idx) => (
                  <div key={idx} className="group relative aspect-[4/3] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer">
                    {doc.url ? (
                      <>
                        <button onClick={(e) => handleDownload(e, doc.url, doc.label)} className="absolute top-2 right-2 z-20 p-1.5 bg-black/50 hover:bg-emerald-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all" title="Download File"><Download size={14} /></button>
                        {(doc.url.toLowerCase().endsWith(".pdf") || doc.url.startsWith("data:application/pdf")) ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 hover:bg-red-100 transition-colors" onClick={() => openPdf(doc.url)}>
                                <FileText size={40} className="text-red-500 mb-2" />
                                <span className="text-xs font-bold text-red-700">PDF Document</span>
                                <span className="text-[10px] text-red-500">Click to View</span>
                            </div>
                        ) : (
                          <div className="w-full h-full" onClick={() => handleImagePreview(doc.url)}>
                                <img src={doc.url} alt={doc.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 drop-shadow-lg" size={28} />
                                </div>
                            </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                        <FileText size={24} className="mb-2 opacity-50" /><span className="text-xs italic">Not Uploaded</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] py-1.5 text-center font-bold border-t border-slate-100">{doc.label}</div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100"><CreditCard size={18} className="text-emerald-600" /> Verification Status</h4>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Ref No</p>
                      <p className="font-mono font-bold text-slate-800">{reviewData.paymentReference || reviewData.referenceNo || "PENDING"}</p>
                  </div>
                 <div className="text-right">
                      {isTenantRenewal ? (
                          <>
                              <p className="text-xs font-bold text-slate-500 uppercase">Total Expected</p>
                              <p className="text-xl font-bold text-emerald-600">₱{Number(reviewData.paymentAmount || reviewData.totalAmount || reviewData.rentAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                          </>
                      ) : isPermanent ? (
                          <>
                              {(() => {
                                  const advance = typeof defaultPermanentPrice !== 'undefined' ? Number(defaultPermanentPrice) : 6000;
                                  const upcomingRent = Number(reviewData.rentAmount || 0); 
                                  
                                  return (
                                      <>
                                          <div className="flex justify-end gap-6 mb-1 text-sm">
                                              <div className="text-slate-500">Advance Payment (Due Now):</div>
                                              <div className="font-bold text-slate-700">₱{advance.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                                          </div>
                                          
                                          {(status === "VERIFICATION_PENDING" || status === "PAYMENT_UNLOCKED") && (
                                              <div className="flex justify-end gap-6 mb-2 text-sm border-b border-slate-200 pb-2">
                                                  <div className="text-orange-500">Prorated Rent (Due Next Cycle):</div>
                                                  <div className="font-bold text-orange-600">₱{upcomingRent.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                                              </div>
                                          )}
                                          
                                          <div className="flex justify-end gap-6 border-t border-slate-100 pt-2 mt-2">
                                              <div className="text-xs font-bold text-emerald-600 uppercase mt-1">Total Expected Now:</div>
                                              <div className="text-xl font-bold text-emerald-600">₱{advance.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                                          </div>
                                      </>
                                  );
                              })()}
                          </>
                      ) : (
                          <>
                              <p className="text-xs font-bold text-slate-500 uppercase">Total Expected Now:</p>
                              <p className="text-xl font-bold text-emerald-600">₱{Number(reviewData.paymentAmount || reviewData.totalAmount || reviewData.rentAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                          </>
                      )}
                  </div>

                </div>
                <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg flex items-start gap-3 border border-blue-100">
                    <Lock size={18} className="mt-0.5 shrink-0 text-blue-600" />
                    <p className="leading-relaxed">
                      {isTenantRenewal && "Step 1: Verify the renewal receipt, then click 'Confirm Receipt' to update the tenant's due date and history."}
                      {!isTenantRenewal && showUnlockBtn && "Step 1: Verify documents above, then click 'Unlock Payment'."}
                      {!isTenantRenewal && status === "PAYMENT_UNLOCKED" && "Waiting for applicant to upload receipt..."}
                      {showRequestContractBtn && "Step 2: Payment Verified. Permanent Slot requires a contract. Click 'Request Contract'."}
                      {!isTenantRenewal && status === "CONTRACT_PENDING" && "Waiting for applicant to upload signed contract..."}
                      {showAddTenantBtn && "Final Step: All documents verified. Click 'Approve & Create Lease' to finish."}
                    </p>
                </div>
              </div>
            </section>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between gap-3 rounded-b-2xl">
            {(!isTenantRenewal && status !== 'REJECTED') ? (
              <button onClick={() => handleActionClick('reject')} className="bg-white border border-red-200 text-red-600 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-red-50 hover:border-red-300 transition-all flex items-center gap-2 active:scale-95">
                <AlertTriangle size={18} /> Reject
              </button>
            ) : ( <div></div> )}

            <div className="flex gap-3">
              {showUnlockBtn && (
                <button onClick={() => handleActionClick('unlock')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95">
                  <Unlock size={18} /> Verify & Unlock Payment
                </button>
              )}
              {showRequestContractBtn && (
                  <button onClick={() => handleActionClick('contract')} className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-orange-600 transition-all flex items-center gap-2 active:scale-95">
                    <PenTool size={18} /> Request Contract
                  </button>
              )}
              {showApproveRenewalBtn && (
                <button onClick={() => handleActionClick('renewal')} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95">
                  <CheckCircle size={18} /> Confirm Receipt
                </button>
              )}
              {showAddTenantBtn && (
                <button onClick={() => handleActionClick('lease')} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95">
                  <CheckCircle size={18} /> Approve & Create Lease
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplicationReviewModal;