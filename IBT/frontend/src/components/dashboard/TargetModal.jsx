import React, { useState, useEffect } from "react";
import { Settings, CheckCircle, X } from "lucide-react";

const TargetModal = ({ isOpen, onClose, currentTargets, onSave }) => {
  const [modalTargets, setModalTargets] = useState(currentTargets);

  useEffect(() => {
    if (isOpen) setModalTargets(currentTargets);
  }, [isOpen, currentTargets]);

  const handleChange = (key, value) => {
    // Allows only numbers and one decimal point
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value) || value === "") {
      setModalTargets((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSave = () => {
    const formattedTargets = {};
    Object.keys(modalTargets).forEach((key) => {
      formattedTargets[key] = parseFloat(modalTargets[key]) || 0;
    });
    onSave(formattedTargets);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* --- Header: Updated to use Settings Icon --- */}
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-xl">
              <Settings size={22} className="text-teal-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Revenue Targets</h3>
              <p className="text-xs text-slate-500 font-medium">Set your monthly performance goals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-slate-50 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- Form Body --- */}
        <div className="space-y-4">
          {[
            { id: "tickets", label: "Tickets Revenue Target", color: "border-l-red-500" },
            { id: "bus", label: "Bus Revenue Target", color: "border-l-yellow-500" },
            { id: "tenants", label: "Tenants Revenue Target", color: "border-l-green-500" },
            { id: "parking", label: "Parking Revenue Target", color: "border-l-blue-500" },
          ].map((field) => (
            <div key={field.id} className={`group relative border-l-4 ${field.color} bg-slate-50 p-3 rounded-r-xl transition-all hover:bg-slate-100/50`}>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                {field.label}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-400 group-focus-within:text-teal-600 transition-colors">
                  ₱
                </span>
                <input
                  type="text"
                  value={modalTargets[field.id]}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className="w-full bg-white border border-slate-200 pl-8 pr-3 py-2.5 rounded-lg font-bold text-slate-700 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
          ))}
        </div>

        {/* --- Footer Actions --- */}
        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <CheckCircle size={18} />
            Save Targets
          </button>
        </div>
      </div>
    </div>
  );
};

export default TargetModal;