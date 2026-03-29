import React, { useState, useMemo } from "react";
import { Calendar, TrendingUp, Bus, Filter, X } from "lucide-react";

const formatStopType = (stopType, customStopCount) => {
  if (stopType === "Other") {
    if (customStopCount && Number(customStopCount) > 0) {
      return `${customStopCount}-stop`;
    }
    return "Other";
  }
  return stopType || "Regular Trip";
};

const CommonBusesView = ({ records, companyData, onClose }) => {
  const [timeFilter, setTimeFilter] = useState("Weekly"); 
  const [typeFilter, setTypeFilter] = useState("All"); 
  const [companyFilter, setCompanyFilter] = useState("All");

  const commonData = useMemo(() => {
    const now = new Date();
    let daysToSubtract = 7;
    if (timeFilter === "Monthly") daysToSubtract = 30;
    if (timeFilter === "Yearly") daysToSubtract = 365;

    const cutoffDate = new Date(now.setDate(now.getDate() - daysToSubtract));

    const validRecords = records.filter(r => {
      const isAfterCutoff = new Date(r.date) >= cutoffDate;
      const isDeparted = r.status === "Departed" || r.status === "Paid";
      const matchesType = typeFilter === "All" || r.busType === typeFilter;
      const matchesCompany = companyFilter === "All" || r.company === companyFilter;
      
      return isAfterCutoff && isDeparted && matchesType && matchesCompany;
    });

    const busStats = {};
    validRecords.forEach(record => {
      const plate = record.templateNo || record.templateno;
      if (!plate) return;

      if (!busStats[plate]) {
        busStats[plate] = {
          busNo: plate,
          company: record.company,
          busType: record.busType,
          stopType: record.stopType,
          customStopCount: record.customStopCount,
          route: record.route,
          price: record.price || 75,
          tripCount: 0,
          totalRevenue: 0,
          firstRecorded: record.date
        };
      }
      
      busStats[plate].tripCount += 1;
      busStats[plate].totalRevenue += (record.price || 75);
    });

    const threshold = timeFilter === "Weekly" ? 5 : timeFilter === "Monthly" ? 20 : 250;
    
    return Object.values(busStats)
      .filter(bus => bus.tripCount >= threshold)
      .sort((a, b) => b.totalRevenue - a.totalRevenue); 
  }, [records, timeFilter, typeFilter, companyFilter]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95">
        
        {/* Header & Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <TrendingUp className="text-emerald-600" size={24} />
            Common Bus Analytics
          </h3>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1 shadow-sm">
              <Filter size={14} className="text-slate-400 ml-1" />
              <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="p-1 text-sm outline-none bg-transparent font-medium text-slate-700 border-r border-slate-200 pr-2 cursor-pointer">
                <option value="All">All Companies</option>
                {companyData.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
              
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="p-1 text-sm outline-none bg-transparent font-medium text-slate-700 border-r border-slate-200 pr-2 cursor-pointer">
                <option value="All">All Types</option>
                <option value="Regular">Regular</option>
                <option value="Aircon">Aircon</option>
              </select>

              <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="p-1 text-sm outline-none bg-transparent font-medium text-slate-700 pr-1 cursor-pointer">
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-auto bg-slate-50">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4">Bus No.</th>
                <th className="p-4">Company & Type</th>
                <th className="p-4">Stop Type</th>
                <th className="p-4">Route</th>
                <th className="p-4">Price</th>
                <th className="p-4">Date Recorded</th>
                <th className="p-4 text-right">Trips Logged</th>
                <th className="p-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {commonData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-500 font-medium">
                    No common buses found matching these filters.
                  </td>
                </tr>
              ) : (
                commonData.map((bus) => (
                  <tr key={bus.busNo} className="hover:bg-slate-50 transition-colors">
                    
                    {/* 1. DEDICATED BUS NO. */}
                    <td className="p-4">
                      <div className="font-bold text-lg tracking-wide text-slate-900 flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${bus.busType === 'Aircon' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                          <Bus size={16}/>
                        </div>
                        {bus.busNo}
                      </div>
                    </td>

                    {/* 2. COMPANY & TYPE */}
                    <td className="p-4">
                      <div className="font-semibold text-sm text-slate-700">{bus.company}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{bus.busType}</div>
                    </td>

                    <td className="p-4 text-sm text-slate-600">
                      {formatStopType(bus.stopType, bus.customStopCount)}
                    </td>

                    <td className="p-4 text-sm font-medium text-slate-600">{bus.route}</td>
                    <td className="p-4 text-sm text-slate-600">₱{bus.price.toFixed(2)}</td>
                    <td className="p-4 text-sm text-slate-600 flex items-center gap-1">
                      <Calendar size={14} className="text-slate-400"/>
                      {new Date(bus.firstRecorded).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm text-right font-bold text-slate-700">{bus.tripCount}</td>
                    <td className="p-4 text-sm text-right font-bold text-emerald-600">₱{bus.totalRevenue.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommonBusesView;