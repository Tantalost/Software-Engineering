import React, { useState, useEffect } from "react";
import { X, Upload, FileText, Calendar, PhilippinePeso, Map, Check, Eye, Loader2 } from "lucide-react";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/ibt_tenants/image/upload";
const UPLOAD_PRESET = "ibt_upload";

const AddTenantModal = ({ isOpen, onClose, onSave, tenants = [], initialData = null }) => {

  const [isSubmitting, setIsSubmitting] = useState(false); // New loading state

  const [formData, setFormData] = useState({
    slotNo: "",
    tenantName: "",
    referenceNo: "", 
    email: "",
    contactNo: "",
    tenantType: "Permanent", 
    uid: "",
  });

  const [showMapModal, setShowMapModal] = useState(false);
  const [tempSelectedSlots, setTempSelectedSlots] = useState([]); 

  const [productCategory, setProductCategory] = useState("Food and Beverages");
  const [otherProductDetails, setOtherProductDetails] = useState("");

  const [rentAmount, setRentAmount] = useState(0);
  const [utilityAmount, setUtilityAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [documents, setDocuments] = useState({
    businessPermit: null,
    validID: null,
    barangayClearance: null,
    proofOfReceipt: null,
  });

  const formatDateTimeForInput = (dateObj) => {
    if (!dateObj) return "";
    const offset = dateObj.getTimezoneOffset() * 60000; 
    const localISOTime = new Date(dateObj.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          slotNo: initialData.slotNo || "", 
          referenceNo: initialData.referenceNo || "", 
          tenantName: initialData.name || "",
          email: initialData.email || "",
          contactNo: initialData.contactNo || "",
          tenantType: initialData.tenantType || "Permanent", 
          uid: initialData.uid || "",
        });

        if (initialData.slotNo) {
            setTempSelectedSlots(initialData.slotNo.split(', '));
        }

        if (initialData.documents) {
            setDocuments({
                businessPermit: initialData.documents.businessPermit || null,
                validID: initialData.documents.validID || null,
                barangayClearance: initialData.documents.barangayClearance || null,
                proofOfReceipt: initialData.documents.proofOfReceipt || null,
            });
        }

        const incomingProduct = initialData.products || "Food and Beverages";
        if (["Food and Beverages", "Clothing"].includes(incomingProduct)) {
          setProductCategory(incomingProduct);
          setOtherProductDetails("");
        } else {
          setProductCategory("Other");
          setOtherProductDetails(incomingProduct);
        }

      } else {
        // Reset
        setFormData({
            slotNo: "",
            tenantName: "",
            referenceNo: "", 
            email: "",
            contactNo: "",
            tenantType: "Permanent", 
            uid: "", // Reset UID for manual entry
        });
        setProductCategory("Food and Beverages");
        setOtherProductDetails("");
        setDocuments({
            businessPermit: null,
            validID: null,
            barangayClearance: null,
            proofOfReceipt: null,
        });
        setTempSelectedSlots([]); 
      }

      setStartDate(formatDateTimeForInput(new Date()));
      setUtilityAmount(0);
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]); 

  // --- MAP SYNC ---
  useEffect(() => {
    if (showMapModal) {
      const currentSlots = formData.slotNo ? formData.slotNo.split(', ') : [];
      setTempSelectedSlots(currentSlots);
    }
  }, [showMapModal, formData.slotNo]);

  // --- CALCULATIONS ---
  useEffect(() => {
    let baseRent = 0;
    let calculatedDueDate = "";
    
    const slotCount = formData.slotNo ? formData.slotNo.split(',').length : 1;

    if (formData.tenantType === "Permanent") {
      baseRent = 6000;
      if (startDate) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + 1); 
        calculatedDueDate = formatDateTimeForInput(d);
      }
    } else {
      baseRent = 160 * 7; 
      if (startDate) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + 7); 
        calculatedDueDate = formatDateTimeForInput(d);
      }
    }

    setRentAmount(baseRent * slotCount);
    setDueDate(calculatedDueDate);

  }, [formData.tenantType, startDate, formData.slotNo]); 

  useEffect(() => {
    setTotalAmount(parseFloat(rentAmount || 0) + parseFloat(utilityAmount || 0));
  }, [rentAmount, utilityAmount]);

  const handleFileChange = (e, docType) => {
    if (e.target.files && e.target.files[0]) {
      setDocuments((prev) => ({ ...prev, [docType]: e.target.files[0] }));
    }
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
  
    try {
      const res = await fetch(CLOUDINARY_URL, { 
      method: "POST",
      body: data,
      });
      const result = await res.json();
      return result.secure_url;
    } catch (error) {
      console.error("Upload failed", error);
      return null;
    }
  };

  // --- SUBMIT HANDLER ---
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

        // 1. Process Documents (Upload new ones, keep existing strings)
        const processedDocuments = { ...documents };
        
        for (const key of Object.keys(processedDocuments)) {
            const file = processedDocuments[key];
            // If it's a File object (new upload), upload it. 
            // If it's a string (URL from waitlist), keep it.
            if (file && typeof file !== 'string') {
                const url = await uploadToCloudinary(file);
                if (url) processedDocuments[key] = url;
            }
        }

        const newTenant = {
            // Remove ID generation here if relying on MongoDB _id, 
            // or keep it if you want a custom ID.
            ...formData,
            products: productCategory === "Other" ? otherProductDetails : productCategory,
            rentAmount,
            utilityAmount: parseFloat(utilityAmount),
            totalAmount,
            StartDateTime: formatForTable(startDate), 
            DueDateTime: formatForTable(dueDate),    
            status: "Paid", 
            documents: processedDocuments // Send URLs
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
      if (typeof file === 'string') return "Pre-filled from Application ✅";
      return file.name; 
  };

  if (!isOpen) return null;

  return (
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
            
            {/* ... SECTION 1 ... */}
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
                  <label className="text-xs font-semibold text-slate-600">Reference No</label>
                  <input 
                  type="text" 
                  required 
                  placeholder="Enter Reference No."
                  className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" 
                  value={formData.referenceNo}
                  onChange={(e) => setFormData({...formData, referenceNo: e.target.value})}
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

                {/* MAP MODAL UI (Unchanged logic, just ensure it renders) */}
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
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {Array.from({ length: 30 }).map((_, i) => {
                                let slotLabel = formData.tenantType === "Permanent" ? `A-${101 + i}` : `NM-${(i + 1).toString().padStart(2, '0')}`;
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
                                return (
                                <div key={slotLabel} onClick={() => handleToggleSlot(slotLabel, tenant)} className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-200 ${statusColor}`}>
                                    <span className="text-lg font-bold opacity-90">{slotLabel}</span>
                                    <span className="text-[10px] text-center truncate w-full px-1 leading-tight mt-1">{statusText}</span>
                                </div>
                                );
                            })}
                            </div>
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
               
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Full Name</label>
                  <input type="text" required className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.tenantName} onChange={(e) => setFormData({...formData, tenantName: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Email Address</label>
                  <input type="email" required className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-600">Contact Number</label>
                  <input type="tel" required className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.contactNo} onChange={(e) => setFormData({...formData, contactNo: e.target.value})} />
                </div>
              </div>
            </section>

            {/* ... SECTIONS 2, 3, 4 (Unchanged) ... */}
            <section className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 mb-4 flex items-center gap-2"><FileText size={16} /> 2. Products to be Sold</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Category</label>
                  <select className="p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={productCategory} onChange={(e) => setProductCategory(e.target.value)}>
                    <option value="Food and Beverages">Food and Beverages</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Other">Other (Please specify)</option>
                  </select>
                </div>
                {productCategory === "Other" && (
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 mb-4 flex items-center gap-2"><PhilippinePeso size={16} /> 4. Financial Setup</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Rent (x{formData.slotNo ? formData.slotNo.split(',').length : 1} Slots)</label>
                  <div className="relative"><span className="absolute left-3 top-2.5 text-slate-500">₱</span><input type="number" readOnly className="pl-8 p-2.5 w-full rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700" value={rentAmount} /></div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Utility Fee</label>
                  <div className="relative"><span className="absolute left-3 top-2.5 text-slate-500">₱</span><input className="pl-8 p-2.5 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" value={utilityAmount} onChange={(e) => setUtilityAmount(e.target.value)} /></div>
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
                
                {['Business Permit', 'Valid ID', 'Barangay Clearance', 'Proof of Receipt'].map((label, idx) => {
                   const keyMap = ['businessPermit', 'validID', 'barangayClearance', 'proofOfReceipt'];
                   const key = keyMap[idx];
                   const currentFile = documents[key];
                   const isBase64 = typeof currentFile === 'string';

                   return (
                    <div key={key} className={`border-2 border-dashed rounded-xl p-4 transition-colors ${isBase64 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                      <label className="block cursor-pointer">
                        <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => handleFileChange(e, key)}
                        />
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                          <div className={`p-2 rounded-full ${isBase64 ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200'}`}>
                            {isBase64 ? <Eye size={14} /> : <Upload size={14} />}
                          </div>
                          <span className={isBase64 ? "text-emerald-700 font-bold" : ""}>
                             {getFileStatus(currentFile)}
                          </span>
                        </div>
                      </label>
                    </div>
                   );
                })}

              </div>
            </section>

          </form>
        </div>

        {/* --- FOOTER (Disabled when submitting) --- */}
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
  );
};

export default AddTenantModal;