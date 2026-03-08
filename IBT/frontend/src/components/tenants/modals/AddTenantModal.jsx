import React, { useState, useEffect, useRef } from "react";
import { X, Upload, FileText, Calendar, PhilippinePeso, Map, Check, Loader2, ZoomIn } from "lucide-react";

import CryptoJS from "crypto-js";


const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY; 

const AddTenantModal = ({ isOpen, onClose, onSave, tenants = [], initialData = null, activeTab = "permanent", defaultNightPrice = 1120, defaultPermanentPrice = 6000 }) => {
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
  const [utilityAmount, setUtilityAmount] = useState(0);

  const [feeBreakdown, setFeeBreakdown] = useState({
    garbageFee: 0,
    permitFee: 0,
    businessTaxes: 0,
    electricity: 0,
    water: 0,
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

  const formatDateTimeForInput = (dateObj) => {
    if (!dateObj) return "";
    const offset = dateObj.getTimezoneOffset() * 60000; 
    const localISOTime = new Date(dateObj.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
  };

  useEffect(() => {
    if (isOpen) {
      const generateRef = () => `REF-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;

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
          referenceNo: initialData.referenceNo || generateRef(),
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
            businessPermit: null, validID: null, barangayClearance: null, proofOfReceipt: null, contract: null,
            communityTax: null, policeClearance: null 
        });
        setTempSelectedSlots([]); 
      }
      
      else {
        setFormData({
            slotNo: "",
            firstName: "",
            middleName: "",
            lastName: "",
            suffix: "", 
            referenceNo: generateRef(), 
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
        setTempSelectedSlots([]); 
      }

      setStartDate(formatDateTimeForInput(new Date()));
      setUtilityAmount(0);
        setFeeBreakdown({
          garbageFee: 0, permitFee: 0, businessTaxes: 0, 
          electricity: 0, water: 0, otherAmount: 0, otherSpecify: ""
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
    let baseRent = 0;
    let calculatedDueDate = "";
    
    const slotCount = formData.slotNo ? formData.slotNo.split(',').length : 1;

    if (formData.tenantType === "Permanent") {
      baseRent = defaultPermanentPrice; 
      if (startDate) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + 1); 
        calculatedDueDate = formatDateTimeForInput(d);
      }
    } else {
      baseRent = defaultNightPrice; 
      if (startDate) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + 7); 
        calculatedDueDate = formatDateTimeForInput(d);
      }
    }

    setRentAmount(baseRent * slotCount);
    setDueDate(calculatedDueDate);

  }, [formData.tenantType, startDate, formData.slotNo, defaultNightPrice, defaultPermanentPrice]);

  useEffect(() => {
    const calculatedUtils = (parseFloat(feeBreakdown.garbageFee) || 0) +
                  (parseFloat(feeBreakdown.permitFee) || 0) +
                  (parseFloat(feeBreakdown.businessTaxes) || 0) +
                  (parseFloat(feeBreakdown.electricity) || 0) +
                  (parseFloat(feeBreakdown.water) || 0) +
                  (parseFloat(feeBreakdown.otherAmount) || 0);
                  
    setUtilityAmount(calculatedUtils);
    setTotalAmount(parseFloat(rentAmount || 0) + calculatedUtils);
  }, [rentAmount, feeBreakdown]);

  const handleFileChange = (e, docType) => {
    if (e.target.files && e.target.files[0]) {
      setDocuments((prev) => ({ ...prev, [docType]: e.target.files[0] }));
    }
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
                  <select 
                    required
                    className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.tenantType}
                    onChange={(e) => {
                        setFormData({...formData, tenantType: e.target.value, slotNo: ""}); 
                        setTempSelectedSlots([]);
                    }}
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Night Market">Night Market</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Reference No </label>
                  <input 
                  type="text" 
                  readOnly 
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 font-mono focus:outline-none cursor-not-allowed" 
                  value={formData.referenceNo}
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
                  <select className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={productCategory} onChange={(e) => setProductCategory(e.target.value)}>
                    <option value="food_non_alcoholic">Food and non-alcoholic beverages</option>
                    <option value="clothes_textiles">Clothes and textiles</option>
                    <option value="accessories">Accessories</option>
                    <option value="footwears">Footwears</option>
                    <option value="kitchenwares">Kitchenwares</option>
                    <option value="agricultural_produce">Fruits, vegetables and other agricultural produce</option>
                    <option value="other">Others, please specify</option>
                  </select>
                </div>
                {productCategory === "other" && (
                  <div className="flex flex-col gap-1 animate-fadeIn">
                    <label className="text-xs font-semibold text-slate-600">Specify Product</label>
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
                  <div className="relative"><span className="absolute left-3 top-2.5 text-slate-500">₱</span><input type="number" readOnly className="pl-8 p-2.5 w-full rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700" value={rentAmount} /></div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Garbage Fee</label>
                  <div className="relative"><span className="absolute left-3 top-2.5 text-slate-500">₱</span><input type="number" className="pl-8 p-2.5 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={feeBreakdown.garbageFee} onChange={(e) => setFeeBreakdown({...feeBreakdown, garbageFee: e.target.value})} /></div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Permit Fee</label>
                  <div className="relative"><span className="absolute left-3 top-2.5 text-slate-500">₱</span><input type="number" className="pl-8 p-2.5 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={feeBreakdown.permitFee} onChange={(e) => setFeeBreakdown({...feeBreakdown, permitFee: e.target.value})} /></div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Business Taxes</label>
                  <div className="relative"><span className="absolute left-3 top-2.5 text-slate-500">₱</span><input type="number" className="pl-8 p-2.5 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={feeBreakdown.businessTaxes} onChange={(e) => setFeeBreakdown({...feeBreakdown, businessTaxes: e.target.value})} /></div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Electricity</label>
                  <div className="relative"><span className="absolute left-3 top-2.5 text-slate-500">₱</span><input type="number" className="pl-8 p-2.5 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={feeBreakdown.electricity} onChange={(e) => setFeeBreakdown({...feeBreakdown, electricity: e.target.value})} /></div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Water</label>
                  <div className="relative"><span className="absolute left-3 top-2.5 text-slate-500">₱</span><input type="number" className="pl-8 p-2.5 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={feeBreakdown.water} onChange={(e) => setFeeBreakdown({...feeBreakdown, water: e.target.value})} /></div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Others (Amount)</label>
                  <div className="relative"><span className="absolute left-3 top-2.5 text-slate-500">₱</span><input type="number" className="pl-8 p-2.5 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={feeBreakdown.otherAmount} onChange={(e) => setFeeBreakdown({...feeBreakdown, otherAmount: e.target.value})} /></div>
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-600">Others (Please specify)</label>
                  <input type="text" className="p-2.5 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Specify what the other fee is for..." value={feeBreakdown.otherSpecify} onChange={(e) => setFeeBreakdown({...feeBreakdown, otherSpecify: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Total Additional Fees</label>
                  <div className="relative"><span className="absolute left-3 top-2.5 text-slate-500">₱</span><input type="number" readOnly className="pl-8 p-2.5 w-full rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700" value={utilityAmount} /></div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Total Amount Due</label>
                  <div className="relative"><span className="absolute left-3 top-2.5 text-slate-500">₱</span><input type="number" readOnly className="pl-8 p-2.5 w-full rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold" value={totalAmount} /></div>
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

                   return (
                    <div key={key} className={`border-2 border-dashed rounded-xl p-4 transition-colors relative group ${isString ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 hover:bg-slate-50'}`}>
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
                          <div className={`p-2 rounded-full ${isString ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200'}`}>
                            {isString ? <Check size={14} /> : <Upload size={14} />}
                          </div>
                          <span className={isString ? "text-emerald-700 font-bold" : ""}>
                             {getFileStatus(currentFile)}
                          </span>
                        </div>
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
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold shadow-lg transition-all transform active:scale-95 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
                <>
                    <Loader2 className="animate-spin" size={18} /> Saving...
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