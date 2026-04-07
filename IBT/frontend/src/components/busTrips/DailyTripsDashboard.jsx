import React from "react";
import {
  CheckCircle,
  Clock,
  Wrench,
  XCircle,
  LogOut,
  User,
  Archive,
  Trash2,
  RotateCcw,
  Flag,
} from "lucide-react";
import TableActions from "../common/TableActions";

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

const formatStopType = (stopType, customStopCount) => {
  if (stopType === "Other") {
    if (customStopCount && Number(customStopCount) > 0) {
      return `${customStopCount}-stop`;
    }
    return "Other";
  }
  return stopType || "Regular Trip";
};

const DailyTripsDashboard = ({
  trips,
  role,
  onApproveDeparture,
  onToggleOnFixStatus,
  onMarkArrived,
  onMarkNotDeparted,
  onViewTrip,
  onEditTrip,
  onArchiveTrip,
  onDeleteTrip,
  onRequestDeleteTrip,
}) => {
  const todayFormatted = new Date().toLocaleDateString('en-US', { 
    month: 'long', day: 'numeric', year: 'numeric' 
  });

  const isAdminOperator = role === "admin" || role === "superadmin";
  const canDelete = role === "superadmin" || role === "admin";

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
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stops</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Route</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Park est.</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Exp. dep.</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Arrival time</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actual dep.</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Company</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trips.map((trip) => {
              const isDeparted = trip.status === "Departed" || trip.status === "Paid";
              const isOnFix = trip.status === "On Fix";
              const isArrived = trip.status === "Arrived";
              const isNotDeparted = trip.status === "Not Departed";
              const isScheduled = trip.status === "Scheduled";
              const isCompletedState = isDeparted || isNotDeparted;

              return (
                <tr 
                  key={trip._id || trip.id} 
                  className={`hover:bg-slate-50 transition-colors ${isDeparted ? 'opacity-60 bg-slate-50/50' : isOnFix ? 'bg-red-50/30' : isNotDeparted ? 'bg-orange-50/30' : 'bg-white'}`}
                >
                  <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                    {trip.templateNo || trip.templateno}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {trip.busType || "Regular"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatStopType(trip.stopType, trip.customStopCount)}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {trip.route}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {trip.parkingEstimation || "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 font-medium">
                    {formatTime(trip.expectedDeparture)}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 font-medium">
                    {formatTime(trip.time)}
                  </td>
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
                    ) : isNotDeparted ? (
                      <span className="inline-flex items-center justify-center bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-xs">
                        Not Departed
                      </span>
                    ) : isOnFix ? (
                      <span className="inline-flex items-center justify-center bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-xs">
                        On Fix
                      </span>
                    ) : isArrived ? (
                      <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">
                        Arrived
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center bg-white border border-slate-200 text-slate-600 font-bold px-3 py-1 rounded-full text-xs shadow-sm">
                        Scheduled
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center">
                    {!isCompletedState ? (
                      <div className="flex items-center justify-center gap-2">
                        <TableActions
                          onView={() => onViewTrip?.(trip)}
                          onEdit={
                            isAdminOperator && !isCompletedState
                              ? () => onEditTrip?.(trip)
                              : undefined
                          }
                        />

                        {isAdminOperator && (
                          <>
                            <button
                              onClick={() => onArchiveTrip?.(trip)}
                              title="Archive"
                              className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all cursor-pointer"
                            >
                              <Archive size={16} />
                            </button>

                            {canDelete && (
                              <button
                                onClick={() => onDeleteTrip?.(trip)}
                                title="Delete"
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </>
                        )}

                        {role === "bus" && (
                          <button
                            onClick={() => onRequestDeleteTrip?.(trip)}
                            title="Request Deletion"
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all cursor-pointer"
                          >
                            <Flag size={16} />
                          </button>
                        )}

                        {isScheduled && (
                          <button
                            onClick={() => onMarkArrived?.(trip)}
                            title="Mark as Arrived"
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-semibold shadow-sm transition-all"
                          >
                            <CheckCircle size={14} /> Arrived
                          </button>
                        )}

                        {isArrived && (
                          <>
                            <button
                              onClick={() => onToggleOnFixStatus?.(trip)}
                              title="Mark for Maintenance"
                              className="p-1.5 rounded-md transition-colors text-amber-500 bg-amber-50 hover:bg-amber-100"
                            >
                              <Wrench size={16} />
                            </button>

                            <button
                              onClick={() => onMarkNotDeparted?.(trip)}
                              title="Mark as Not Departed"
                              className="p-1.5 rounded-md transition-colors text-orange-600 bg-orange-50 hover:bg-orange-100"
                            >
                              <XCircle size={16} />
                            </button>

                            <button
                              onClick={() => onApproveDeparture(trip)}
                              title="Depart Bus"
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-xs font-semibold shadow-sm transition-all"
                            >
                              <LogOut size={14} /> Depart
                            </button>
                          </>
                        )}

                        {isOnFix && (
                          <button
                            onClick={() => onToggleOnFixStatus?.(trip)}
                            title="Mark as Scheduled"
                            className="p-1.5 rounded-md transition-colors text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    ) : isDeparted ? (
                       <CheckCircle size={18} className="text-emerald-500 mx-auto" />
                    ) : isNotDeparted ? (
                       <XCircle size={18} className="text-orange-500 mx-auto" />
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