import React, { useState, useEffect } from "react";
import { X, FileText, Eye, Loader2 } from "lucide-react";
import { calculateDueAmount } from "../../../utils/tenantUtils.js";
import CryptoJS from "crypto-js";
import Field from "../../common/Field"; 

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api`;
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY;


const DecryptedDocument = ({ url, label }) => {
  const [docData, setDocData] = useState(null);
  const [isPDF, setIsPDF] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadAndDecrypt = async () => {
      if (!url) return;

      try {
        setErrorMessage("");
      
        const response = await fetch(url);
        if (!response.ok) {
          let serverMessage = "";
          try {
            serverMessage = await response.text();
          } catch (_) {}

          const lower = (serverMessage || "").toLowerCase();
          if (response.status === 422 || lower.includes('unable to decrypt') || lower.includes('decryption')) {
            throw new Error("This uploaded file can't be decrypted. Please ask the applicant to re-upload the document.");
          }
          if (response.status === 404) {
            throw new Error("Document not found in storage.");
          }
          throw new Error("Failed to load document.");
        }
        
        const blob = await response.blob();
        const encryptedText = await blob.text();

        try {
        
          const decryptedBytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
          const decryptedBase64 = decryptedBytes.toString(CryptoJS.enc.Utf8);

          if (decryptedBase64) {
          
            const isPdfDoc = decryptedBase64.startsWith('JVBERi0');
            setIsPDF(isPdfDoc);
            
            const mimeType = isPdfDoc ? 'application/pdf' : 'image/jpeg';
            setDocData(`data:${mimeType};base64,${decryptedBase64}`);
          } else {
           
            setDocData(url);
            setIsPDF(url.toLowerCase().includes('.pdf'));
          }
        } catch (decErr) {
         
          setDocData(URL.createObjectURL(blob));
          setIsPDF(url.toLowerCase().includes('.pdf'));
        }
      } catch (err) {
        console.error("Error loading document:", err);
        setErrorMessage(err.message || "Unable to load this document.");
      } finally {
        setLoading(false);
      }
    };

    loadAndDecrypt();
  }, [url]);

  const handleOpenFullscreen = () => {
    if (!docData) return;
  
    if (docData.startsWith('data:')) {
      fetch(docData)
        .then(res => res.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, "_blank");
        });
    } else {
      window.open(docData, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-emerald-500">
        <Loader2 className="animate-spin mb-2" size={24} />
        <span className="text-[10px] font-bold uppercase tracking-wide">Loading...</span>
      </div>
    );
  }

  if (!docData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400">
         <X size={24} className="mb-2 opacity-50" />
         <span className="text-[10px] font-bold uppercase text-center px-2">{errorMessage || "Load Failed"}</span>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full relative group cursor-pointer"
      onClick={handleOpenFullscreen}
      title={`Click to View ${label}`}
    >
      {isPDF ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors">
            <FileText size={32} />
            <span className="text-[10px] font-bold mt-2 uppercase tracking-wide">PDF Document</span>
        </div>
      ) : (
        <>
            <img 
                src={docData} 
                alt={label} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Eye className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md transform scale-75 group-hover:scale-100 transition-all" size={24} />
            </div>
        </>
      )}
    </div>
  );
};

const TenantViewModal = ({ viewRow, onClose }) => {
  if (!viewRow) return null;

  const getFullUrl = (filename) => {
    if (!filename) return null;
    if (filename.startsWith("data:") || filename.startsWith("http")) return filename;
    return `${API_URL}/stalls/doc/${filename}`; 
  };

  const documentList = [
    { key: 'permit', label: "Business Permit", url: getFullUrl(viewRow.documents?.businessPermit || viewRow.permitUrl) },
    { key: 'id', label: "Valid ID", url: getFullUrl(viewRow.documents?.validID || viewRow.validIdUrl) },
    { key: 'clearance', label: "Barangay Clearance", url: getFullUrl(viewRow.documents?.barangayClearance || viewRow.clearanceUrl) },
    { key: 'receipt', label: "Proof of Receipt", url: getFullUrl(viewRow.documents?.proofOfReceipt || viewRow.receiptUrl) },
    { key: 'contract', label: "Signed Contract", url: getFullUrl(viewRow.documents?.contract || viewRow.contractUrl) },
    { key: 'communityTax', label: "Community Tax", url: getFullUrl(viewRow.documents?.communityTax || viewRow.communityTaxUrl) },
    { key: 'policeClearance', label: "Police Clearance", url: getFullUrl(viewRow.documents?.policeClearance || viewRow.policeClearanceUrl) }
  ].filter(doc => doc.url);

  const parseFeeBreakdown = (data) => {
    if (!data) return { electricity: 0, otherAmount: 0, otherSpecify: "" };
    if (typeof data === 'string') {
        try { return JSON.parse(data); } 
        catch (e) { return { electricity: 0, otherAmount: 0, otherSpecify: "" }; }
    }
    return data;
  };

  const feeBreakdown = parseFeeBreakdown(viewRow.feeBreakdown);
  const isPermanentTenant = (viewRow.tenantType || viewRow.floor || "Permanent") === "Permanent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-white p-0 shadow-2xl ring-1 ring-slate-900/5 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Tenant Details</h3>
            <p className="text-xs text-slate-500">ID: {viewRow._id || viewRow.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Field label="Slot Number" value={viewRow.slotNo} />
                <Field label="Reference No" value={viewRow.referenceNo || viewRow.referenceno || (viewRow.paymentHistory && viewRow.paymentHistory.length > 0 ? viewRow.paymentHistory[viewRow.paymentHistory.length - 1].referenceNo : "-")} />
                <Field label="Tenant Name" value={viewRow.tenantName || viewRow.name} />
                <Field label="Lease Type" value={viewRow.tenantType || viewRow.floor || "Permanent"} />
                <Field label="Contact No" value={viewRow.contactNo || viewRow.contact} />
                <Field label="Email Address" value={viewRow.email} />

                <Field 
                  label="Products to be Sold" 
                  value={viewRow.products || viewRow.product ? String(viewRow.products || viewRow.product).replace(/_/g, ' ') : "N/A"} 
                />
                
            </div>
          </section>

          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Financial Breakdown
            </h4>
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 grid gap-4 md:grid-cols-3">
              <Field label={isPermanentTenant ? "Monthly Rent" : "Rental Fee"} value={viewRow.rentAmount ? `₱${Number(viewRow.rentAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₱0.00"} />
              {isPermanentTenant && (
                <Field label="Advance Balance" value={viewRow.advancePaymentBalance ? `₱${Number(viewRow.advancePaymentBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₱0.00"} />
              )}
              
              {isPermanentTenant && <Field label="Electricity" value={`₱${Number(feeBreakdown.electricity || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />}
              <Field label="Others (Amount)" value={`₱${Number(feeBreakdown.otherAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              <div className="md:col-span-2">
                <Field label="Others (Specify)" value={feeBreakdown.otherSpecify || "N/A"} />
              </div>

              <div className="md:col-start-3 bg-emerald-50 p-2 rounded border border-emerald-100">
                <Field label="Total Amount Due" value={`₱${(viewRow.totalAmount || calculateDueAmount(viewRow)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                {viewRow.status === "Overdue" && (
                  <>
                    <Field label="Penalty Charge" value={`₱${(viewRow.chargeAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                    <Field label="Interest Fee" value={`₱${(viewRow.interestAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                  </>
                )}
              </div>
            </div>
          </section>

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
                  {documentList.map((doc) => (
                      <div 
                          key={doc.key} 
                          onClick={() => window.open(doc.url, '_blank')}
                          className="relative aspect-square bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:shadow-md hover:border-emerald-400 transition-all group"
                          title={`Click to View ${doc.label}`}
                        >
                        <FileText size={32} className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-center text-slate-700 truncate px-2 w-full">
                        {doc.label}
                        </span>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center rounded-xl">
                      <Eye className="text-slate-700 opacity-0 group-hover:opacity-100 drop-shadow-md transform scale-75 group-hover:scale-100 transition-all" size={24} />
                    </div>
                  </div>
                ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                  <FileText size={32} className="mb-2 opacity-30" />
                  <span className="text-sm font-medium">No documents uploaded yet.</span>
                </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Payment Logs
                </h4>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200 font-bold">
                    {viewRow.paymentHistory?.length || 0} Records
                </span>
            </div>

            {viewRow.paymentHistory && viewRow.paymentHistory.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Date Paid</th>
                      <th className="px-4 py-3">Ref / OR No.</th>
                      <th className="px-4 py-3 text-right">Amount Paid</th>
                      <th className="px-4 py-3 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...viewRow.paymentHistory].sort((a, b) => new Date(b.datePaid) - new Date(a.datePaid)).map((payment, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                          {new Date(payment.datePaid).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 text-xs">
                          {payment.referenceNo || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">
                          ₱{Number(payment.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {payment.receiptUrl ? (
                            <button 
                              onClick={() => window.open(getFullUrl(payment.receiptUrl), '_blank')}
                              className="text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-500 px-3 py-1 rounded-md text-xs font-bold transition-colors border border-emerald-200 hover:border-emerald-600 shadow-sm"
                            >
                              View
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic font-medium">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-400">
                <FileText size={24} className="mb-2 opacity-30" />
                <span className="text-xs font-medium">No payment history recorded yet.</span>
              </div>
            )}
          </section>
          
        </div>
        
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