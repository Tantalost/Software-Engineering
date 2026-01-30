import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

const TargetModal = ({ isOpen, onClose, currentTargets, onSave }) => {
  const [localTargets, setLocalTargets] = useState(currentTargets);

  useEffect(() => {
    if (isOpen) {
      setLocalTargets(currentTargets);
    }
  }, [isOpen, currentTargets]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalTargets((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(localTargets);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-6 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold tracking-wide">Set Daily Targets</h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Adjust the daily revenue goals. Weekly, Monthly, and Yearly targets will be calculated automatically based on these values.
          </p>

          {[
            { label: "Tickets Target", name: "tickets", color: "text-red-500" },
            { label: "Bus Target", name: "bus", color: "text-yellow-500" },
            { label: "Tenants Target", name: "tenants", color: "text-green-500" },
            { label: "Parking Target", name: "parking", color: "text-blue-500" }
          ].map((field) => (
            <div key={field.name} className="flex flex-col">
              <label className={`text-xs font-bold uppercase tracking-wider mb-1 ${field.color}`}>
                {field.label}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₱</span>
                <input
                  type="number"
                  name={field.name}
                  value={localTargets[field.name]}
                  onChange={handleChange}
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-gray-700 transition"
                  min="0"
                />
              </div>
            </div>
          ))}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold shadow-lg hover:shadow-xl hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Save Targets
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TargetModal;