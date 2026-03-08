import React, { useState, useEffect } from "react";
import { X, FileText, Eye, Loader2 } from "lucide-react";
import CryptoJS from "crypto-js";
import Field from "../../common/Field"; 

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api`;
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY;


const DecryptedDocument = ({ url, label }) => {
  const [docData, setDocData] = useState(null);
  const [isPDF, setIsPDF] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAndDecrypt = async () => {
      if (!url) return;

      try {
      
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch");
        
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
         <span className="text-[10px] font-bold uppercase">Load Failed</span>
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
    if (filename.startsWith('http')) return filename;
    return `${API_URL}/files/${filename}`; 
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
                <Field label="Reference No" value={viewRow.referenceNo || viewRow.referenceno} />
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
              Financial Details
            </h4>
            <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <Field label="Rent Amount" value={viewRow.rentAmount ? `₱${Number(viewRow.rentAmount).toLocaleString()}` : "₱0.00"} />
                <Field label="Utility Fee" value={viewRow.utilityAmount ? `₱${Number(viewRow.utilityAmount).toLocaleString()}` : "₱0.00"} />
                <Field label="Total Due" value={viewRow.totalAmount ? `₱${Number(viewRow.totalAmount).toLocaleString()}` : "₱0.00"} />
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
                    <div key={doc.key} className="relative aspect-square bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-emerald-400 transition-all">
                    
                      <DecryptedDocument url={doc.url} label={doc.label} />
                      
                      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 py-2 px-1 pointer-events-none">
                          <p className="text-[10px] font-bold text-center text-slate-700 truncate">
                              {doc.label}
                          </p>
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