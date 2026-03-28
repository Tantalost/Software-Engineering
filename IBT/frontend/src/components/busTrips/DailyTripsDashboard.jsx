import React from "react";
import { CheckCircle, Clock, Wrench, LogOut, User } from "lucide-react";

// NEW HELPER: Converts 24-hour military time to 12-hour AM/PM format
const formatTime = (timeStr) => {
  if (!timeStr || timeStr === "-") return "-";
  // If it already contains AM/PM, just return it
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) return timeStr;
  
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  
  let hour = parseInt(parts[0], 10);
  const minute = parts[1].substring(0, 2); 
  const ampm = hour >= 12 ? 'PM' : 'AM';
  
  hour = hour % 12;
  hour = hour ? hour : 12; // If hour is 0, make it 12
  
  return `${hour}:${minute} ${ampm}`;
};

const DailyTripsDashboard = ({ trips, onApproveDeparture, onMarkOnFix }) => {
  const todayFormatted = new Date().toLocaleDateString('en-US', { 
    month: 'long', day: 'numeric', year: 'numeric' 
  });

  const currentAdmin = localStorage.getItem("authName") || localStorage.getItem("authEmail") || "Admin Operator";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Global Date & Operator Header */}
      <div className="bg-slate-800 text-white p-4 flex flex-wrap gap-3 justify-between items-center">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Clock size={20} className="text-emerald-400" />
          Terminal Dispatch Board
        </h2>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-600 px-3 py-1 rounded-full">
            <User size={14} className="text-blue-400" />
            <span>Operator: <span className="text-white">{currentAdmin}</span></span>
          </div>

          <span className="text-sm font-medium text-slate-300 bg-slate-700 px-3 py-1 rounded-full">
            As of {todayFormatted}
          </span>
        </div>
      </div>

      {/* Flat Spreadsheet-Style Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bus No</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket Ref</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Route</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Departure</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Company</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trips.map((trip) => {
              const isDeparted = trip.status === "Departed" || trip.status === "Paid";
              const isOnFix = trip.status === "On Fix";

              return (
                <tr 
                  key={trip._id || trip.id} 
                  className={`hover:bg-slate-50 transition-colors ${isDeparted ? 'opacity-60 bg-slate-50/50' : isOnFix ? 'bg-red-50/30' : 'bg-white'}`}
                >
                  <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                    {trip.templateNo || trip.templateno}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {trip.busType || "Regular"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 font-mono">
                    {trip.ticketReferenceNo || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {trip.route}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-700">
                    ₱{(trip.price || 75).toFixed(2)}
                  </td>
                  
                  {/* --- UPDATED: FORMATTED TIME COLUMN --- */}
                  <td className="px-4 py-4 text-sm text-slate-600 font-medium">
                    {formatTime(trip.time)}
                  </td>
                  
                  {/* --- UPDATED: FORMATTED DEPARTURE COLUMN --- */}
                  <td className="px-4 py-4 text-sm text-slate-600 font-medium">
                    {formatTime(trip.departureTime)}
                  </td>
                  
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {trip.company}
                  </td>
                  
                  <td className="px-4 py-4 text-center">
                    {isDeparted ? (
                      <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-xs">
                        Departed
                      </span>
                    ) : isOnFix ? (
                      <span className="inline-flex items-center justify-center bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-xs">
                        On Fix
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center bg-white border border-slate-200 text-slate-600 font-bold px-3 py-1 rounded-full text-xs shadow-sm">
                        Scheduled
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center">
                    {!isDeparted && !isOnFix ? (
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => onMarkOnFix(trip._id || trip.id)}
                          title="Mark for Maintenance"
                          className="p-1.5 text-amber-500 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                        >
                          <Wrench size={16} />
                        </button>
                        
                        <button 
                          onClick={() => onApproveDeparture(trip)}
                          title="Depart Bus"
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-xs font-semibold shadow-sm transition-all"
                        >
                          <LogOut size={14} /> Depart
                        </button>
                      </div>
                    ) : isDeparted ? (
                       <CheckCircle size={18} className="text-emerald-500 mx-auto" />
                    ) : (
                       <Wrench size={18} className="text-red-400 mx-auto" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {trips.length === 0 && (
        <div className="p-10 text-center text-slate-500 font-medium">
          No scheduled trips found for today.
        </div>
      )}
    </div>
  );
};

export default DailyTripsDashboard;