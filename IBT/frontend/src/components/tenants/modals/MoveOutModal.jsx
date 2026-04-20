import React, { useState } from "react";
import { X, LogOut, AlertTriangle, PhilippinePeso, ClipboardList } from "lucide-react";
import { getZeroAmountDisplay } from "../../../utils/currencyDisplay";

const MoveOutModal = ({ isOpen, onClose, tenant, onConfirm }) => {
  const [damageCost, setDamageCost] = useState("");
  const [damageRemarks, setDamageRemarks] = useState("");
  const [consumeDeposit, setConsumeDeposit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !tenant) return null;

  const advance = tenant.advancePaymentBalance || 0;
  const unpaid = tenant.status === "Overdue" ? (tenant.totalAmount || 0) : 0;
  const damages = Number(damageCost) || 0;
  const rentAmount = tenant.rentAmount || 0;
  
  
  const showConsumeOption = advance > 0 && tenant.status !== "Overdue";
  const lastMonthDeduction = (showConsumeOption && consumeDeposit) ? rentAmount : 0;
  
  const refund = advance - damages - unpaid - lastMonthDeduction;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm({
        tenantId: tenant._id || tenant.id,
        damageCost: damages,
        damageRemarks,
        consumeDeposit: showConsumeOption ? consumeDeposit : false
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to process move out.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
     
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
        
        <div className="bg-red-50 p-6 border-b border-red-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 text-red-700">
            <LogOut size={24} />
            <h2 className="text-xl font-bold">Process Move Out</h2>
          </div>
          <button onClick={onClose} className="text-red-400 hover:text-red-700 hover:bg-red-100 p-2 rounded-full transition-all"><X size={20} /></button>
        </div>

      
        <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
             <p className="text-sm text-slate-500 font-medium mb-1">Tenant Name</p>
             <p className="text-lg font-bold text-slate-800">{tenant.tenantName || tenant.name}</p>
             <p className="text-sm text-slate-500 mt-1">Slot: <span className="font-bold text-slate-700">{tenant.slotNo}</span></p>
          </div>

          <div>
             <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><ClipboardList size={16}/> Deductions & Damages</h3>
             <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Damage Assessment Cost</label>
                  <div className="relative">
                     <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₱</span>
                    
                     <input type="number" min="0" placeholder={getZeroAmountDisplay()} value={damageCost} onChange={(e) => setDamageCost(e.target.value)} className="pl-8 p-2 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Damage Remarks (Optional)</label>
                 
                  <input type="text" placeholder="e.g., Broken lights, uncleaned grease..." value={damageRemarks} onChange={(e) => setDamageRemarks(e.target.value)} className="p-2 w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none" />
                </div>
             </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2"><PhilippinePeso size={16}/> Final Accounting Breakdown</h3>
            
            {showConsumeOption && (
                <div className="mb-4 bg-white p-3 rounded-lg border border-emerald-200 shadow-sm">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={consumeDeposit}
                            onChange={(e) => setConsumeDeposit(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">Use Advance for Last Month</span>
                            <span className="text-xs text-slate-500">Deduct ₱{rentAmount.toLocaleString()} from deposit</span>
                        </div>
                    </label>
                </div>
            )}

          
            <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between items-center text-slate-600">
                    <span>Advance Deposit</span> 
                    <span className="font-bold">₱{advance.toLocaleString()}</span>
                </div>
                
                {consumeDeposit && (
                    <div className="flex justify-between items-center text-indigo-600">
                        <span>Less Last Month's Rent</span> 
                        <span className="font-bold">- ₱{lastMonthDeduction.toLocaleString()}</span>
                    </div>
                )}
                
                <div className="flex justify-between items-center text-red-500">
                    <span>Less Damages</span> 
                    <span className="font-bold">- ₱{damages.toLocaleString()}</span>
                </div>
                
                {unpaid > 0 && (
                    <div className="flex justify-between items-center text-red-500">
                        <span>Less Unpaid Rent/Penalties</span> 
                        <span className="font-bold">- ₱{unpaid.toLocaleString()}</span>
                    </div>
                )}
                
                <div className="border-t border-emerald-200 my-1 pt-3 flex justify-between items-center">
                    <span className="font-bold text-emerald-800 uppercase tracking-wider text-xs">Final Refund</span>
                    <span className={`text-xl font-black ${refund < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                        {refund < 0 ? `- ₱${Math.abs(refund).toLocaleString()}` : `₱${refund.toLocaleString()}`}
                    </span>
                </div>
                {refund < 0 && (
                   <p className="text-[10px] text-red-600 font-bold italic mt-1 leading-tight"><AlertTriangle size={12} className="inline mr-1"/> Tenant owes the management ₱{Math.abs(refund).toLocaleString()} to clear their account.</p>
                )}
            </div>
          </div>

        </div>

       
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-white transition-all">Cancel</button>
          <button onClick={handleConfirm} disabled={isSubmitting} className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold shadow-md hover:bg-red-700 transition-all flex items-center gap-2">
            {isSubmitting ? "Processing..." : <><LogOut size={18} /> Confirm Move Out</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default MoveOutModal;