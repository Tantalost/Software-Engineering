import React from "react";
import { X } from "lucide-react";

const TenantMapModal = ({ isOpen, onClose, activeTab, records, onSelectSlot }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {activeTab === 'permanent' ? 'Permanent Section (A)' : 'Night Market Section (NM)'} Map
            </h3>
            <p className="text-sm text-slate-500">Visual representation of slot availability</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 max-h-[60vh] overflow-y-auto">
          <div className="flex gap-4 mb-6 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500"></div>
              <span className="text-sm font-medium text-slate-600">Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white border-2 border-dashed border-slate-300"></div>
              <span className="text-sm font-medium text-slate-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm font-medium text-slate-600">Overdue</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {Array.from({ length: 30 }).map((_, i) => {
              let slotLabel = activeTab === "permanent" ? `A-${101 + i}` : `NM-${(i + 1).toString().padStart(2, '0')}`;
              
              const tenant = records.find(r => 
                (r.slotNo === slotLabel || r.slotno === slotLabel) && 
                (r.tenantType === (activeTab === 'permanent' ? 'Permanent' : 'Night Market'))
              );

              let statusColor = "bg-white border-2 border-dashed border-slate-300 text-slate-400";
              let statusText = "Available";

              if (tenant) {
                statusText = tenant.tenantName || tenant.name;
                if (tenant.status === "Overdue") statusColor = "bg-red-500 text-white shadow-md border-transparent";
                else if (tenant.status === "Pending") statusColor = "bg-amber-400 text-white shadow-md border-transparent";
                else statusColor = "bg-emerald-500 text-white shadow-md border-transparent";
              }

              return (
                <div
                  key={slotLabel}
                  onClick={() => {
                    if (tenant) {
                      onSelectSlot(tenant);
                      onClose();
                    }
                  }}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all transform hover:scale-105 ${statusColor}`}
                >
                  <span className="text-lg font-bold opacity-90">{slotLabel}</span>
                  <span className="text-[10px] text-center truncate w-full px-1 leading-tight mt-1">{statusText}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantMapModal;