import React, { useRef, useEffect } from "react";
import { X } from "lucide-react";

const TenantMapModal = ({ isOpen, onClose, activeTab, records, onSelectSlot }) => {

  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && activeTab === 'night' && scrollRef.current) {
    
      setTimeout(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
      }, 50);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

 
  const renderSlot = (slotLabel) => {
    const tenant = records.find(r => 
      (r.slotNo === slotLabel || r.slotno === slotLabel) && 
      (activeTab === 'permanent' ? (!r.tenantType || r.tenantType === 'Permanent') : r.tenantType === 'Night Market')
    );

    let statusColor = "bg-white border-2 border-dashed border-slate-300 text-slate-400";
    let statusText = "Available";

    if (tenant) {
      statusText = tenant.tenantName || tenant.name;
      if (tenant.status === "Overdue") statusColor = "bg-red-500 text-white shadow-md border-transparent";
      else if (tenant.status === "Pending") statusColor = "bg-amber-400 text-white shadow-md border-transparent";
      else statusColor = "bg-emerald-500 text-white shadow-md border-transparent";
    }

   
    const baseClasses = activeTab === 'permanent' 
      ? "aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all transform hover:scale-105"
      : "w-14 h-14 flex-shrink-0 rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer transition-all transform hover:scale-105";
      
  
    const displayLabel = activeTab === 'night' ? slotLabel.replace('NM-', '') : slotLabel;

    return (
      <div
        key={slotLabel}
        onClick={() => {
          if (tenant) {
            onSelectSlot(tenant);
            onClose();
          }
        }}
        className={`${baseClasses} ${statusColor}`}
        title={`${slotLabel} - ${statusText}`}
      >
        <span className={`${activeTab === 'night' ? 'text-sm' : 'text-lg'} font-bold opacity-90`}>{displayLabel}</span>
        <span className="text-[10px] text-center truncate w-full px-1 leading-tight mt-1">{statusText}</span>
      </div>
    );
  };

 
  const topBlock1 = [32, 31, 30, 29, 28, 27, 26, 25];
  const topBlock2 = [24, 23, 22, 21, 20, 19, 18, 17];
  const topBlock3 = [16, 15, 14, 13, 12, 11, 10, 9];
  const topBlock4 = [8, 7, 6, 5, 4, 3, 2, 1];

  const bottomBlock1 = [33, 34, 35, 36, 37, 38, 39, 40];
  const bottomBlock2 = [41, 42, 43, 44, 45, 46, 47, 48];
  const bottomBlock3 = [49, 50, 51, 52, 53, 54, 55, 56];
  const bottomBlock4 = [57, 58, 59, 60, 61, 62, 63, 64];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4 flex-shrink-0">
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

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 overflow-y-auto flex-grow">
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
              <div className="w-4 h-4 rounded bg-amber-400"></div>
              <span className="text-sm font-medium text-slate-600">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm font-medium text-slate-600">Overdue</span>
            </div>
          </div>

          {activeTab === 'permanent' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {Array.from({ length: 30 }).map((_, i) => renderSlot(`A-${101 + i}`))}
            </div>
          ) : (
            <div ref={scrollRef} className="overflow-x-auto pb-4 custom-scrollbar">
              <div className="min-w-max flex flex-col items-start bg-slate-200/50 p-4 rounded-xl border border-slate-200">
              
                <div className="flex flex-row items-center mb-10">
                  <div className="flex flex-row gap-1">{topBlock1.map(num => renderSlot(`NM-${num.toString().padStart(2, '0')}`))}</div>
                  <div className="w-8 flex-shrink-0"></div> 
                  <div className="flex flex-row gap-1">{topBlock2.map(num => renderSlot(`NM-${num.toString().padStart(2, '0')}`))}</div>
                  <div className="w-10 flex-shrink-0"></div> 
                  <div className="flex flex-row gap-1">{topBlock3.map(num => renderSlot(`NM-${num.toString().padStart(2, '0')}`))}</div>
                  <div className="w-8 flex-shrink-0"></div>
                  <div className="flex flex-row gap-1">{topBlock4.map(num => renderSlot(`NM-${num.toString().padStart(2, '0')}`))}</div>
                </div>

                
                <div className="flex flex-row items-center">
                  <div className="flex flex-row gap-1">{bottomBlock1.map(num => renderSlot(`NM-${num.toString().padStart(2, '0')}`))}</div>
                  <div className="w-8 flex-shrink-0"></div> 
                  <div className="flex flex-row gap-1">{bottomBlock2.map(num => renderSlot(`NM-${num.toString().padStart(2, '0')}`))}</div>
                  <div className="w-10 flex-shrink-0"></div> 
                  <div className="flex flex-row gap-1">{bottomBlock3.map(num => renderSlot(`NM-${num.toString().padStart(2, '0')}`))}</div>
                  <div className="w-8 flex-shrink-0"></div> 
                  <div className="flex flex-row gap-1">{bottomBlock4.map(num => renderSlot(`NM-${num.toString().padStart(2, '0')}`))}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TenantMapModal;