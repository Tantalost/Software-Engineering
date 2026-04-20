import React, { useState, useEffect, useRef } from "react";
import { X, Upload, FileText, Calendar, PhilippinePeso, Map, Check, Loader2, ZoomIn, ChevronDown } from "lucide-react";

import CryptoJS from "crypto-js";


const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY; 
const DOCUMENT_UPLOAD_KEYS = [
  "businessPermit",
  "validID",
  "barangayClearance",
  "proofOfReceipt",
  "contract",
  "communityTax",
  "policeClearance",
];

const buildDocumentUploadState = (docs = {}) => {
  return DOCUMENT_UPLOAD_KEYS.reduce((acc, key) => {
    const hasAttachedFile = typeof docs?.[key] === "string" && docs[key].trim() !== "";
    acc[key] = {
      status: hasAttachedFile ? "done" : "idle",
      progress: hasAttachedFile ? 100 : 0,
      error: "",
    };
    return acc;
  }, {});
};

const AddTenantModal = ({ isOpen, onClose, onSave, tenants = [], initialData = null, activeTab = "permanent", defaultNightPrice = 150, defaultNightWeeklyRent = 1050, defaultPermanentPrice = 6000, defaultDueDate = 5 }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({
    slotNo: "",
    firstName: "", 
    middleName: "",
    lastName: "",
    suffix: "",
    referenceNo: "", 
    email: "",
    contactNo: "",
    tenantType: "Permanent", 
    _id: "",
    uid: "",
  });

  const [showMapModal, setShowMapModal] = useState(false);
  const [tempSelectedSlots, setTempSelectedSlots] = useState([]); 

  const scrollRef = useRef(null);

  useEffect(() => {
    if (showMapModal && formData.tenantType === 'Night Market' && scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
      }, 50);
    }
  }, [showMapModal, formData.tenantType]);

  const [productCategory, setProductCategory] = useState("food_non_alcoholic");
  const [otherProductDetails, setOtherProductDetails] = useState("");

  const [rentAmount, setRentAmount] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [utilityAmount, setUtilityAmount] = useState(0);

  const [feeBreakdown, setFeeBreakdown] = useState({
    electricity: 0,
    otherAmount: 0,
    otherSpecify: ""
  });

  const [totalAmount, setTotalAmount] = useState(0);

  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [documents, setDocuments] = useState({
    businessPermit: null,
    validID: null,
    barangayClearance: null,
    proofOfReceipt: null,
    contract: null,
  });
  const [documentUploadState, setDocumentUploadState] = useState(buildDocumentUploadState());

  const formatDateTimeForInput = (dateObj) => {
    if (!dateObj) return "";
    const offset = dateObj.getTimezoneOffset() * 60000; 
    const localISOTime = new Date(dateObj.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
  };

  useEffect(() => {
    if (isOpen) {
      
      if (initialData) {
        const fullName = initialData.name || initialData.tenantName || "";
        let nameParts = fullName.trim().split(/\s+/);
        let fName = "", mName = "", lName = "", parsedSuffix = "";

        const suffixList = ["jr", "jr.", "sr", "sr.", "ii", "iii", "iv", "v"];
        if (nameParts.length > 1 && suffixList.includes(nameParts[nameParts.length - 1].toLowerCase())) {
            parsedSuffix = nameParts.pop(); 
        }

        if (nameParts.length === 1) {
            fName = nameParts[0];
        } else if (nameParts.length === 2) {
            fName = nameParts[0];
            lName = nameParts[1];
        } else if (nameParts.length > 2) {
            fName = nameParts[0];
            lName = nameParts.pop(); 
            mName = nameParts.slice(1).join(" "); 
        }

        setFormData({
          slotNo: initialData.slotNo || "", 
          referenceNo: initialData.paymentReference || initialData.referenceNo || "",
          firstName: fName,
          middleName: mName,
          lastName: lName,
          suffix: parsedSuffix || initialData.suffix || "", 
          email: initialData.email || "",
          contactNo: initialData.contactNo || "",
          tenantType: initialData.tenantType || "Permanent", 
          _id: initialData._id || "",
          uid: initialData.uid || "",
        });

        setProductCategory("food_non_alcoholic");
        setOtherProductDetails("");
        setDocuments({
            businessPermit: initialData.documents?.businessPermit || null, 
            validID: initialData.documents?.validID || null, 
            barangayClearance: initialData.documents?.barangayClearance || null, 
            proofOfReceipt: initialData.documents?.proofOfReceipt || null, 
            contract: initialData.documents?.contract || null,
            communityTax: initialData.documents?.communityTax || null, 
            policeClearance: initialData.documents?.policeClearance || null 
        });
        setDocumentUploadState(buildDocumentUploadState(initialData.documents || {}));
        setTempSelectedSlots([]); 
      }
      
      else {
        setFormData({
            slotNo: "",
            firstName: "",
            middleName: "",
            lastName: "",
            suffix: "", 
            referenceNo: "",
            email: "",
            contactNo: "",
            tenantType: activeTab === "night" ? "Night Market" : "Permanent", 
            _id: "",
            uid: "",
        });
        setProductCategory("food_non_alcoholic");
        setOtherProductDetails("");
        setDocuments({
            businessPermit: null, validID: null, barangayClearance: null, proofOfReceipt: null, contract: null,
            communityTax: null, policeClearance: null 
        });
        setDocumentUploadState(buildDocumentUploadState());
        setTempSelectedSlots([]); 
      }

      setStartDate(formatDateTimeForInput(new Date()));
      setUtilityAmount(0);
        setFeeBreakdown({
          electricity: Number(0).toFixed(2), 
          otherAmount: Number(0).toFixed(2), 
          otherSpecify: ""
        });
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]); 

  useEffect(() => {
    if (showMapModal) {
      const currentSlots = formData.slotNo ? formData.slotNo.split(', ') : [];
      setTempSelectedSlots(currentSlots);
    }
  }, [showMapModal, formData.slotNo]);

  useEffect(() => {
    let calculatedRent = 0;
    let lockedAdvance = 0;
    let calculatedDueDate = "";
    const hasStartedOperation = Boolean(initialData?.operationStartDate);
    const existingProratedRent = Number(initialData?.rentAmount || 0);
    
    const slotCount = formData.slotNo ? formData.slotNo.split(',').length : 1;

    if (formData.tenantType === "Permanent") {
      const baseRent = defaultPermanentPrice; 
      lockedAdvance = baseRent * slotCount;   

      // Permanent proration starts only after Start Operation.
      calculatedRent = hasStartedOperation ? existingProratedRent : 0;

      if (startDate) {
        const d = new Date(startDate);
        const targetDay = Number(defaultDueDate) || 5;
        let nextDue = new Date(d.getFullYear(), d.getMonth(), targetDay);
        
        if (d.getDate() >= targetDay) {
            nextDue.setMonth(nextDue.getMonth() + 1);
        }
        calculatedDueDate = formatDateTimeForInput(nextDue);
      }
    } else {
      const nightBasePerDay = Number(defaultNightPrice || 0);
      const parsedStart = startDate ? new Date(startDate) : new Date();
      const startDay = Number.isNaN(parsedStart.getTime()) ? new Date().getDay() : parsedStart.getDay();
      const remainingDaysInWeek = Math.max(1, 7 - startDay);
      calculatedRent = nightBasePerDay * slotCount * remainingDaysInWeek;
      lockedAdvance = 0;
      if (startDate) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + remainingDaysInWeek);
        calculatedDueDate = formatDateTimeForInput(d);
      }
    }

    setRentAmount(calculatedRent);
    setAdvancePayment(Number(lockedAdvance).toFixed(2));
    setDueDate(calculatedDueDate);

  }, [formData.tenantType, startDate, formData.slotNo, defaultNightPrice, defaultPermanentPrice, defaultDueDate, initialData]);

  useEffect(() => {
    const isNightMarket = formData.tenantType === "Night Market";
    const electricityFee = isNightMarket ? 0 : (parseFloat(feeBreakdown.electricity) || 0);
    const otherFee = parseFloat(feeBreakdown.otherAmount) || 0;
    const calculatedUtils = electricityFee + otherFee;
                  
    setUtilityAmount(calculatedUtils);
    const baseUpfront = isNightMarket ? parseFloat(rentAmount || 0) : parseFloat(advancePayment || 0);
    setTotalAmount(baseUpfront + calculatedUtils);
  }, [rentAmount, feeBreakdown, formData.tenantType, advancePayment]);

  const handleFileChange = (e, docType) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setDocumentUploadState((prev) => ({
      ...prev,
      [docType]: { status: "loading", progress: 0, error: "" },
    }));

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const nextProgress = Math.min(99, Math.round((event.loaded / event.total) * 100));
      setDocumentUploadState((prev) => ({
        ...prev,
        [docType]: { status: "loading", progress: nextProgress, error: "" },
      }));
    };

    reader.onload = () => {
      setDocuments((prev) => ({ ...prev, [docType]: selectedFile }));
      setDocumentUploadState((prev) => ({
        ...prev,
        [docType]: { status: "done", progress: 100, error: "" },
      }));
    };

    reader.onerror = () => {
      setDocumentUploadState((prev) => ({
        ...prev,
        [docType]: { status: "error", progress: 0, error: "Failed to read file." },
      }));
      alert(`Failed to process ${selectedFile.name}. Please try again.`);
    };

    reader.readAsArrayBuffer(selectedFile);
    e.target.value = "";
  };

  const encryptFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const base64Data = e.target.result; 
          
          const pureBase64 = base64Data.split(',')[1]; 

          const encrypted = CryptoJS.AES.encrypt(pureBase64, SECRET_KEY).toString();
          
          const blob = new Blob([encrypted], { type: 'application/octet-stream' });
          resolve(blob);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasPendingUpload = Object.values(documentUploadState).some((item) => item?.status === "loading");
    if (hasPendingUpload) {
      alert("Please wait for all document uploads to finish before saving.");
      return;
    }

    setIsSubmitting(true);

    try {
        const formatForTable = (dateStr) => {
            if (!dateStr) return "";
            const dateObj = new Date(dateStr);
            return dateObj.toLocaleString('en-US', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: 'numeric', minute: '2-digit', hour12: true 
            }).replace(',', ''); 
        };

        const { _id, firstName, middleName, lastName, suffix, ...restOfFormData } = formData;
        const combinedName = `${firstName} ${middleName} ${lastName} ${suffix || ''}`.replace(/\s+/g, ' ').trim();

        const processedDocs = { ...documents };
        
        for (const key of Object.keys(processedDocs)) {
          const file = processedDocs[key];
          if (file && typeof file !== 'string') {
       
            const encryptedBlob = await encryptFile(file);
        
            processedDocs[key] = new File([encryptedBlob], file.name, {
              type: 'application/octet-stream'
            });
          }
        }

        const newTenant = {
            ...restOfFormData,
            tenantName: combinedName,
            ...(_id ? { _id } : {}),
            products: productCategory === "other" ? otherProductDetails : productCategory,
            rentAmount,
            advancePaymentBalance: parseFloat(advancePayment || 0),
            utilityAmount: parseFloat(utilityAmount),
            totalAmount,
            feeBreakdown: JSON.stringify(feeBreakdown),
            StartDateTime: formatForTable(startDate), 
            DueDateTime: formatForTable(dueDate),    
            status: "Paid", 
            documents: processedDocs 
        };

        await onSave(newTenant);
        onClose();
    } catch (error) {
        console.error("Error saving tenant:", error);
        alert("Failed to save tenant. Check console.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleToggleSlot = (slotLabel, tenant) => {
    if (tenant) {
        alert("This slot is already occupied.");
        return;
    }
    setTempSelectedSlots((prev) => {
        if (prev.includes(slotLabel)) {
            return prev.filter(s => s !== slotLabel);
        } else {
            return [...prev, slotLabel];
        }
    });
  };

  const confirmSlotSelection = () => {
    const sortedSlots = [...tempSelectedSlots].sort();
    setFormData({ ...formData, slotNo: sortedSlots.join(', ') });
    setShowMapModal(false);
  };

  const getFileStatus = (file) => {
      if (!file) return "Click to upload";
      if (typeof file === 'string') {
          return "Attached";
      }
      return file.name; 
  };

    const hasPendingDocumentUpload = Object.values(documentUploadState).some((item) => item?.status === "loading");

  if (!isOpen) return null;

  return (
    <>
    {previewImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-5 p-2 bg-white/10 rounded-full text-white hover:text-red-400 hover:bg-white/20 transition-all"
          >
            <X size={32} />
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
    )}

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Add New Tenant / Lease</h2>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          <form id="addTenantForm" onSubmit={handleSubmit} className="space-y-8">
            
            <section>
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 mb-4 flex items-center gap-2">
                <FileText size={16} /> 1. Tenant Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Lease Type</label>
                  <div className="relative">
                    <select 
                      required
                      className="p-2.5 pr-10 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer bg-white"
                      value={formData.tenantType}
                      onChange={(e) => {
                          setFormData({...formData, tenantType: e.target.value, slotNo: ""}); 
                          setTempSelectedSlots([]);
                      }}
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Night Market">Night Market</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center w-10 border-l border-slate-200 text-slate-500 my-1">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Reference No</label>
                  <input 
                    type="text" 
                    className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" 
                    value={formData.referenceNo}
                    onChange={(e) => setFormData({...formData, referenceNo: e.target.value})}
                    placeholder="Enter OR / Reference No."
                    required
                  />
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                   <label className="text-xs font-semibold text-slate-600">Slot Number(s)</label>
                   <div className="flex gap-2">
                    <input 
                        type="text" 
                        readOnly 
                        placeholder="Click 'View Map' to select slots..."
                        className="p-2.5 w-full rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                        value={formData.slotNo}
                        onClick={() => setShowMapModal(true)}
                    />
                    <button 
                        type="button"
                        onClick={() => setShowMapModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 font-medium text-sm shadow-sm transition-all whitespace-nowrap"
                    >
                        <Map size={18} />
                        <span className="hidden sm:inline">View Map</span>
                    </button>
                   </div>
                </div>

                {showMapModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                            <div>
                            <h3 className="text-xl font-bold text-slate-800">
                                Select Slot(s) - {formData.tenantType}
                            </h3>
                            <p className="text-sm text-slate-500">
                                Selected: <span className="font-bold text-emerald-600">{tempSelectedSlots.length}</span> slots
                            </p>
                            </div>
                            <button onClick={() => setShowMapModal(false)} type="button" className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"><X size={20} /></button>
                        </div>
            
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 overflow-y-auto flex-1">
                           
                            {(() => {
                             
                              const renderSlotBox = (slotLabel) => {
                                  const tenant = tenants.find(r => 
                                      (r.slotNo === slotLabel || r.slotno === slotLabel || (r.slotNo && r.slotNo.includes(slotLabel))) 
                                      && (r.tenantType === formData.tenantType)
                                      && r.status !== "Available" 
                                  );
                                  const isSelected = tempSelectedSlots.includes(slotLabel);
                                  
                                  let statusColor = "bg-white border-2 border-dashed border-slate-300 text-slate-400 hover:border-emerald-500 hover:text-emerald-500";
                                  let statusText = "Available";
                                  
                                  if (tenant) {
                                      statusText = tenant.tenantName || tenant.name;
                                      statusColor = "bg-slate-200 text-slate-500 border-transparent opacity-60 cursor-not-allowed";
                                  } else if (isSelected) {
                                      statusColor = "bg-blue-500 text-white border-2 border-blue-600 shadow-md transform scale-105";
                                      statusText = "Selected";
                                  }

                                  const isNightMarket = formData.tenantType === "Night Market";
                                  const baseClasses = isNightMarket 
                                      ? "w-14 h-14 flex-shrink-0 rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer transition-all duration-200"
                                      : "aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-200";
                                  
                                  const displayLabel = isNightMarket ? slotLabel.replace('NM-', '') : slotLabel;

                                  return (
                                      <div key={slotLabel} onClick={() => handleToggleSlot(slotLabel, tenant)} className={`${baseClasses} ${statusColor}`} title={`${slotLabel} - ${statusText}`}>
                                          <span className={`${isNightMarket ? 'text-sm' : 'text-lg'} font-bold opacity-90`}>{displayLabel}</span>
                                          <span className="text-[10px] text-center truncate w-full px-1 leading-tight mt-1">{statusText}</span>
                                      </div>
                                  );
                              };

                             
                              if (formData.tenantType === "Permanent") {
                                  return (
                                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                          {Array.from({ length: 30 }).map((_, i) => renderSlotBox(`A-${101 + i}`))}
                                      </div>
                                  );
                              } else {
                                 
                                  return (
                                      <div ref={scrollRef} className="overflow-x-auto pb-4 custom-scrollbar">
                                          <div className="min-w-max flex flex-col items-start bg-slate-200/50 p-4 rounded-xl border border-slate-200">
                                           
                                              <div className="flex flex-row items-center mb-10">
                                                  <div className="flex flex-row gap-1">{[32, 31, 30, 29, 28, 27, 26].map(num => renderSlotBox(`NM-${num.toString().padStart(2, '0')}`))}</div>
                                                  <div className="w-8 flex-shrink-0"></div>
                                                  <div className="flex flex-row gap-1">{[25, 24, 23, 22, 21, 20, 19, 18].map(num => renderSlotBox(`NM-${num.toString().padStart(2, '0')}`))}</div>
                                                  <div className="w-10 flex-shrink-0"></div>
                                                  <div className="flex flex-row gap-1">{[17, 16, 15, 14, 12, 11, 10, 9].map(num => renderSlotBox(`NM-${num.toString().padStart(2, '0')}`))}</div>
                                                  <div className="w-8 flex-shrink-0"></div>
                                                  <div className="flex flex-row gap-1">{[8, 7, 6, 5, 4, 3, 2, 1].map(num => renderSlotBox(`NM-${num.toString().padStart(2, '0')}`))}</div>
                                              </div>
                                             
                                              <div className="flex flex-row items-center">
                                                  <div className="flex flex-row gap-1">{[33, 34, 35, 36, 37, 38, 39].map(num => renderSlotBox(`NM-${num.toString().padStart(2, '0')}`))}</div>
                                                  <div className="w-8 flex-shrink-0"></div>
                                                  <div className="flex flex-row gap-1">{[40, 41, 42, 43, 44, 45, 46, 47].map(num => renderSlotBox(`NM-${num.toString().padStart(2, '0')}`))}</div>
                                                  <div className="w-10 flex-shrink-0"></div>
                                                  <div className="flex flex-row gap-1">{[48, 49, 50, 51, 53, 54, 55, 56].map(num => renderSlotBox(`NM-${num.toString().padStart(2, '0')}`))}</div>
                                                  <div className="w-8 flex-shrink-0"></div>
                                                  <div className="flex flex-row gap-1">{[57, 58, 59, 60, 61, 62, 63, 64].map(num => renderSlotBox(`NM-${num.toString().padStart(2, '0')}`))}</div>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              }
                            })()}
                           
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowMapModal(false)} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Cancel</button>
                            <button onClick={confirmSlotSelection} disabled={tempSelectedSlots.length === 0} className="px-6 py-2 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                <Check size={18} /> Confirm Selection ({tempSelectedSlots.length})
                            </button>
                        </div>
                        </div>
                    </div>
                )}
               
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 md:col-span-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-600">First Name</label>
                    <input type="text" required className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" 
                      value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-600">Middle Name</label>
                    <input type="text" className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" 
                      value={formData.middleName} onChange={(e) => setFormData({...formData, middleName: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-600">Last Name</label>
                    <input type="text" required className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" 
                      value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-600">Suffix</label>
                    <input type="text" placeholder="Jr, Sr, etc." className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" 
                      value={formData.suffix} onChange={(e) => setFormData({...formData, suffix: e.target.value})} />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Email Address</label>
                  <input type="email" required className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Contact Number</label>
                  <input type="tel" required className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.contactNo} onChange={(e) => setFormData({...formData, contactNo: e.target.value})} />
                </div>
              </div>
            </section>

            <section className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 mb-4 flex items-center gap-2"><FileText size={16} /> 2. Products to be Sold</h3>
              <div className="grid grid-cols-1 gap-4">
               <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Category</label>
                  <div className="relative">
                    <select 
                      className="p-2.5 pr-10 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer bg-white" 
                      value={productCategory} 
                      onChange={(e) => setProductCategory(e.target.value)}
                    >
                      <option value="food_non_alcoholic">Food and non-alcoholic beverages</option>
                      <option value="clothes_textiles">Clothes and textiles</option>
                      <option value="accessories">Accessories</option>
                      <option value="footwears">Footwears</option>
                      <option value="kitchenwares">Kitchenwares</option>
                      <option value="agricultural_produce">Fruits, vegetables and other agricultural produce</option>
                      <option value="other">Others, please specify</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center w-10 border-l border-slate-200 text-slate-500 my-1">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>
                {productCategory === "other" && (
                  <div className="flex flex-col gap-1 animate-fadeIn">
                    <label className="text-xs font-semibold text-slate-600">Specify Category</label>
                    <input type="text" required placeholder="Enter product details..." className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={otherProductDetails} onChange={(e) => setOtherProductDetails(e.target.value)} />
                  </div>
                )}
              </div>
            </section>

            <section className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 mb-4 flex items-center gap-2"><Calendar size={16} /> 3. Contract Duration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Start Date & Time</label>
                  <input type="datetime-local" required className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Due Date & Time</label>
                  <input type="datetime-local" readOnly className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500" value={dueDate} />
                </div>
              </div>
            </section>

            <section className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 mb-4 flex items-center gap-2"><PhilippinePeso size={16} /> 4. Financial Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Rental Fee (x{formData.slotNo ? formData.slotNo.split(',').length : 1})</label>
                  <div className="relative"><span className="absolute left-3 top-2.5 text-slate-500">₱</span><input type="text" readOnly className="pl-8 p-2.5 w-full rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700" value={Number(rentAmount).toFixed(2)} /></div>
                  {formData.tenantType === "Night Market" && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      First due uses Base Price x remaining days to week-end. Weekly rent after this cycle: ₱{Number(defaultNightWeeklyRent || 0).toLocaleString()} per slot.
                    </p>
                  )}
                </div>

                {formData.tenantType === "Permanent" && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-600">Advance Payment</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500">₱</span>
                        <input 
                          type="text" 
                          className="pl-8 p-2.5 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" 
                          value={advancePayment} 
                          onChange={(e) => setAdvancePayment(e.target.value.replace(/[^0-9.]/g, ""))} 
                        />
                      </div>
                    </div>
                )}
                
                {formData.tenantType === "Permanent" && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-600">Electricity</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500">₱</span>
                        <input 
                          type="text" 
                          className="pl-8 p-2.5 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" 
                          value={feeBreakdown.electricity} 
                          onChange={(e) => setFeeBreakdown({...feeBreakdown, electricity: e.target.value.replace(/[^0-9.]/g, "")})} 
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Others (Amount)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500">₱</span>
                    <input 
                      type="text" 
                      className="pl-8 p-2.5 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" 
                      value={feeBreakdown.otherAmount} 
                      onChange={(e) => setFeeBreakdown({...feeBreakdown, otherAmount: e.target.value.replace(/[^0-9.]/g, "")})} 
                    />
                  </div>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Total Additional Fees</label>
                  <div className="relative"><span className="absolute left-3 top-2.5 text-slate-500">₱</span><input type="text" readOnly className="pl-8 p-2.5 w-full rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700" value={Number(utilityAmount).toFixed(2)} /></div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Total Amount Due</label>
                  <div className="relative"><span className="absolute left-3 top-2.5 text-slate-500">₱</span><input type="text" readOnly className="pl-8 p-2.5 w-full rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold" value={Number(totalAmount).toFixed(2)} /></div>
                </div>
              </div>
            </section>

            <section className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 mb-4 flex items-center gap-2">
                <Upload size={16} /> 5. Upload Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {(() => {
                  const docFields = [
                    { label: 'Business Permit', key: 'businessPermit' },
                    { label: 'Valid ID', key: 'validID' },
                    { label: 'Barangay Clearance', key: 'barangayClearance' },
                    { label: 'Proof of Receipt', key: 'proofOfReceipt' }
                  ];

                  if (formData.tenantType === "Permanent") {
                    docFields.push({ label: 'Signed Contract', key: 'contract' });
                  } else if (formData.tenantType === "Night Market") {
                    docFields.push({ label: 'Community Tax', key: 'communityTax' });
                    docFields.push({ label: 'Police Clearance', key: 'policeClearance' });
                  }

                  return docFields.map(({ label, key }) => {
                   const currentFile = documents[key];
                   const isString = typeof currentFile === 'string'; 
                   const uploadMeta = documentUploadState[key] || { status: "idle", progress: 0, error: "" };
                   const isUploading = uploadMeta.status === "loading";
                   const isUploadDone = !isUploading && (isString || uploadMeta.status === "done");
                   const hasUploadError = uploadMeta.status === "error";
                   const statusText = isUploading
                    ? `Uploading... ${uploadMeta.progress}%`
                    : hasUploadError
                      ? uploadMeta.error || "Upload failed. Click to retry"
                      : isUploadDone
                        ? "Done"
                        : "Click to upload";

                   return (
                    <div
                      key={key}
                      className={`border-2 border-dashed rounded-xl p-4 transition-colors relative group ${
                        isUploadDone
                          ? 'border-emerald-300 bg-emerald-50'
                          : hasUploadError
                            ? 'border-red-300 bg-red-50'
                            : 'border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isUploadDone && (
                        <span className="absolute top-2 left-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Done
                        </span>
                      )}

                      {isString && (
                        <div className="absolute top-2 right-2 z-10">
                            <button 
                                type="button" 
                                onClick={(e) => {
                                    e.preventDefault(); 
                                    
                                    const fileUrl = currentFile.startsWith('http') || currentFile.startsWith('data:') 
                                      ? currentFile 
                                      : `${import.meta.env.VITE_API_URL}/api/stalls/doc/${currentFile}`;
                                      
                                    if (currentFile.toLowerCase().endsWith('.pdf')) {
                                        window.open(fileUrl, '_blank', 'noopener,noreferrer');
                                    } else {
                                        setPreviewImage(fileUrl);
                                    }
                                }} 
                                className="bg-white text-emerald-600 p-1.5 rounded-full shadow border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
                                title="View Document"
                            >
                                <ZoomIn size={16} />
                            </button>
                        </div>
                      )}

                      <label className="block cursor-pointer">
                        <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => handleFileChange(e, key)}
                        />
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                          <div className={`p-2 rounded-full ${isUploadDone ? 'bg-emerald-200 text-emerald-700' : hasUploadError ? 'bg-red-100 text-red-600' : 'bg-slate-200'}`}>
                            {isUploading ? <Loader2 size={14} className="animate-spin" /> : isUploadDone ? <Check size={14} /> : <Upload size={14} />}
                          </div>
                          <span className={isUploadDone ? "text-emerald-700 font-bold" : hasUploadError ? "text-red-600 font-semibold" : ""}>
                             {getFileStatus(currentFile)}
                          </span>
                        </div>
                        <p className={`mt-1 text-[11px] ${isUploadDone ? 'text-emerald-700 font-semibold' : hasUploadError ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                          {statusText}
                        </p>
                        {isUploading && (
                          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${uploadMeta.progress}%` }}
                            />
                          </div>
                        )}
                      </label>
                    </div>
                   );
                  });
                })()}
              </div>
            </section>
          </form>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            type="button" 
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleSubmit} 
            type="submit" 
            disabled={isSubmitting || hasPendingDocumentUpload}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold shadow-lg transition-all transform active:scale-95 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
                <>
                    <Loader2 className="animate-spin" size={18} /> Saving...
                </>
            ) : hasPendingDocumentUpload ? (
                <>
                    <Loader2 className="animate-spin" size={18} /> Uploading Documents...
                </>
            ) : "Save Tenant"}
          </button>
        </div>
        
      </div>
    </div>
    </>
  );
};

export default AddTenantModal;