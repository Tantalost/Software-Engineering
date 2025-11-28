import React, { useState, useEffect } from "react";
import { X, Upload, FileText, PhilippinePeso, Map, Check, ChevronDown } from "lucide-react";

const FormInput = ({ label, type = "text", readOnly = false, ...props }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <div className="relative">
      <input
        type={type}
        readOnly={readOnly}
        className={`rounded-lg border px-3 py-2 text-sm outline-none w-full transition-colors ${
          readOnly 
            ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed" 
            : "bg-white border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        }`}
        {...props} 
      />
    </div>
  </div>
);

const formatDateTimeForInput = (dateStr) => {
  if (!dateStr) return "";
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return ""; 
  
  const offset = dateObj.getTimezoneOffset() * 60000; 
  const localISOTime = new Date(dateObj.getTime() - offset).toISOString().slice(0, 16);
  return localISOTime;
};

const EditTenantLease = ({ row, onClose, onSave, tenants = [] }) => {
  
  const standardCategories = ["Food and Beverages", "Clothing"];
  const initialCategory = standardCategories.includes(row.products) ? row.products : "Other";
  const initialOther = standardCategories.includes(row.products) ? "" : row.products;

  const [productCategory, setProductCategory] = useState(initialCategory || "Food and Beverages");
  const [otherProductDetails, setOtherProductDetails] = useState(initialOther || "");

  const [formData, setFormData] = useState({
    ...row,
    rentAmount: row.rentAmount || 0,
    utilityFee: row.utilityFee || row.utilityAmount || 0,
    editStart: formatDateTimeForInput(row.StartDateTime || row.leaseStart),
    editDue: formatDateTimeForInput(row.DueDateTime || row.EndDateTime),
    slotno: row.slotNo || row.slotno || "",
    tenantType: row.tenantType || "Permanent" 
  });

  const [showMapModal, setShowMapModal] = useState(false);
  const [tempSelectedSlots, setTempSelectedSlots] = useState([]);

  useEffect(() => {
     if(showMapModal) {
        const current = formData.slotno ? formData.slotno.split(', ') : [];
        setTempSelectedSlots(current);
     }
  }, [showMapModal, formData.slotno]);

  const handleToggleSlot = (slotLabel, isOccupiedByOther) => {
    if (isOccupiedByOther) {
        alert("This slot is occupied by another tenant.");
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
    setFormData({ ...formData, slotno: sortedSlots.join(', ') });
    setShowMapModal(false);
  };

  const [documents, setDocuments] = useState(row.documents || {
    businessPermit: null,
    validID: null,
    barangayClearance: null,
    proofOfReceipt: null,
  });

  const [status, setStatus] = useState(row.status || "Paid");
  
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (formData.editStart) {
      const d = new Date(formData.editStart);
      
      if (formData.tenantType === "Permanent") {
         d.setMonth(d.getMonth() + 1); 
      } else {
         d.setDate(d.getDate() + 7);   
      }
      
      const newDueDate = formatDateTimeForInput(d);
      setFormData(prev => ({ ...prev, editDue: newDueDate }));
    }
  }, [formData.editStart, formData.tenantType]);

  useEffect(() => {
    const rent = parseFloat(formData.rentAmount) || 0;
    const util = parseFloat(formData.utilityFee) || 0;
    setTotalAmount(rent + util);
  }, [formData.rentAmount, formData.utilityFee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, docType) => {
    if (e.target.files && e.target.files[0]) {
      setDocuments((prev) => ({ ...prev, [docType]: e.target.files[0] }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalProduct = productCategory === "Other" ? otherProductDetails : productCategory;

    const formatForTable = (isoString) => {
        if (!isoString) return "";
        const d = new Date(isoString);
        return d.toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: 'numeric', minute: '2-digit', hour12: true
        }).replace(',', '');
    };

    const processedData = {
      ...formData,
      slotNo: formData.slotno,
      rentAmount: parseFloat(formData.rentAmount),
      utilityAmount: parseFloat(formData.utilityFee),
      totalAmount: totalAmount,
      StartDateTime: formatForTable(formData.editStart),
      DueDateTime: formatForTable(formData.editDue), 
      EndDateTime: formatForTable(formData.editDue), 
      products: finalProduct,
      status: status, 
      documents: documents
    };
    onSave(processedData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/5 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-800">Edit Lease Details</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-6 space-y-6">
          
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Tenant Information</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput label="Name" name="tenantName" value={formData.tenantName || formData.name} onChange={(e) => setFormData({...formData, tenantName: e.target.value, name: e.target.value})} />
              <FormInput label="Reference No" name="referenceNo" value={formData.referenceNo} onChange={handleChange} />
              <FormInput label="Email" type="email" name="email" value={formData.email} onChange={handleChange} />
              <FormInput label="Contact" name="contactNo" value={formData.contactNo || formData.contact} onChange={(e) => setFormData({...formData, contactNo: e.target.value, contact: e.target.value})} />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Products to be Sold</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <select 
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full"
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                  >
                    <option value="Food and Beverages">Food and Beverages</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Other">Other (Please specify)</option>
                  </select>
                </div>
                {productCategory === "Other" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Specify Product</label>
                    <input 
                      type="text" 
                      required
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full"
                      value={otherProductDetails}
                      onChange={(e) => setOtherProductDetails(e.target.value)}
                    />
                  </div>
                )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
             <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-600">Financial Configuration</h4>
             <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 grid gap-4 md:grid-cols-3">
                <FormInput label="Monthly Rent" type="number" name="rentAmount" value={formData.rentAmount} readOnly={true} />
                <FormInput label="Utility Fee" type="input" name="utilityFee" value={formData.utilityFee} onChange={handleChange} placeholder="Enter Amount"/>
                 <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Total Amount</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                           <PhilippinePeso size={14} />
                        </div>
                        <input
                            type="number"
                            readOnly
                            value={totalAmount}
                            className="pl-8 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold px-3 py-2 text-sm outline-none w-full"
                        />
                    </div>
                </div>
             </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Lease Terms</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput label="Start Date " type="datetime-local" name="editStart" value={formData.editStart} onChange={handleChange} />
              <FormInput label="Due Date " type="datetime-local" name="editDue" value={formData.editDue} readOnly={true} />

              <div className="flex flex-col gap-1">
                   <label className="text-sm font-medium text-slate-700">Slot Number(s)</label>
                   <div className="flex gap-2">
                    <input 
                        type="text" 
                        readOnly 
                        placeholder="Click View Map..."
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none w-full bg-slate-50 cursor-pointer"
                        value={formData.slotno}
                        onClick={() => setShowMapModal(true)}
                    />
                    <button 
                        type="button"
                        onClick={() => setShowMapModal(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-medium text-xs shadow-sm transition-all whitespace-nowrap"
                    >
                        <Map size={16} />
                        Map
                    </button>
                   </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <div className="relative">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className={`appearance-none rounded-lg border px-3 py-2 text-sm outline-none w-full font-bold cursor-pointer transition-colors
                            ${status === 'Paid' 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:border-emerald-500' 
                                : 'bg-red-50 border-red-200 text-red-700 focus:border-red-500'
                            }`}
                    >
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                       <ChevronDown size={14} />
                    </div>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
             <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-500">Documents (Upload)</h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['businessPermit', 'validID', 'barangayClearance', 'proofOfReceipt'].map((key) => {
                   const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                   const currentFile = documents[key];
                   return (
                    <div key={key} className="border border-dashed border-slate-300 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <label className="block cursor-pointer">
                        <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
                        <input type="file" className="hidden" onChange={(e) => handleFileChange(e, key)} />
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${currentFile ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                                {currentFile ? <FileText size={16} /> : <Upload size={16} />}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs text-slate-700 truncate w-32 font-medium">{currentFile ? (currentFile.name || "Existing File") : "No file uploaded"}</span>
                                <span className="text-[10px] text-slate-400">{currentFile ? "Click to replace" : "Click to upload"}</span>
                            </div>
                        </div>
                      </label>
                    </div>
                   );
                })}
             </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 rounded-b-xl">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={handleSubmit} className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2 text-sm font-medium text-white shadow-sm transition-all transform active:scale-95 hover:scale-105">Save Changes</button>
        </div>
      </div>

      {showMapModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Select Slot(s)</h3>
                        <p className="text-sm text-slate-500">
                            Type: <span className="font-semibold text-emerald-600">{formData.tenantType}</span>
                        </p>
                    </div>
                    <button onClick={() => setShowMapModal(false)} className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 overflow-y-auto flex-1">
                    <div className="flex gap-4 mb-6 justify-center flex-wrap">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-300"></div><span className="text-sm font-medium text-slate-600">Occupied (Others)</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-white border-2 border-dashed border-slate-300"></div><span className="text-sm font-medium text-slate-600">Available</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-500 border-2 border-blue-600"></div><span className="text-sm font-medium text-slate-600">Selected (Current)</span></div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {Array.from({ length: 30 }).map((_, i) => {
                            let slotLabel = "";
                            if (formData.tenantType === "Permanent") {
                                slotLabel = `A-${101 + i}`; 
                            } else {
                                const num = i + 1;
                                slotLabel = `NM-${num.toString().padStart(2, '0')}`;
                            }

                            const occupiedByOther = tenants.some(r => 
                                (r.slotNo === slotLabel || r.slotno === slotLabel || (r.slotNo && r.slotNo.includes(slotLabel))) 
                                && (r.tenantType === formData.tenantType)
                                && r.id !== row.id 
                                && r.status !== "Available"
                            );

                            const isSelected = tempSelectedSlots.includes(slotLabel);

                            let statusColor = "bg-white border-2 border-dashed border-slate-300 text-slate-400 hover:border-emerald-500 hover:text-emerald-500";
                            let statusText = "Available";
                            
                            if (occupiedByOther) {
                                statusText = "Occupied";
                                statusColor = "bg-slate-200 text-slate-500 border-transparent opacity-60 cursor-not-allowed";
                            } else if (isSelected) {
                                statusColor = "bg-blue-500 text-white border-2 border-blue-600 shadow-md transform scale-105";
                                statusText = "Selected";
                            }

                            return (
                                <div 
                                    key={slotLabel} 
                                    onClick={() => handleToggleSlot(slotLabel, occupiedByOther)}
                                    className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-200 ${statusColor}`}
                                >
                                    <span className="text-lg font-bold opacity-90">{slotLabel}</span>
                                    <span className="text-[10px] text-center truncate w-full px-1 leading-tight mt-1">{statusText}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={() => setShowMapModal(false)} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Cancel</button>
                    <button 
                        onClick={confirmSlotSelection}
                        disabled={tempSelectedSlots.length === 0}
                        className="px-6 py-2 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Check size={18} />
                        Confirm Selection ({tempSelectedSlots.length})
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default EditTenantLease;