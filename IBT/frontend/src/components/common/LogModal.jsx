import React, { useState, useEffect } from "react";
import { History, X, Loader2 } from "lucide-react";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api`; 

const LogModal = ({ isOpen, onClose, title = "Activity Logs" }) => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/logs`);
      if (res.ok) {
        const data = await res.json();
        // Sort by newest first if API doesn't already
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLogs(sorted);
      }
    } catch (e) {
      console.error("Error loading logs:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRole = localStorage.getItem("authRole") || "superadmin";
  const displayedLogs = logs.filter((log) => {
    if (currentRole === "superadmin") return true;
    if (currentRole === "bus") {
      return log.user === "bus" && (log.module === "BusTrips" || log.source === "BusTrips");
    }
    if (currentRole === "ticket") {
      return log.user === "ticket" && (log.module === "TerminalFees" || log.source === "TerminalFees");
    }
    if (currentRole === "lease") {
      return log.user === "lease" && (log.module === "Tenants" || log.source === "Tenants" || log.module === "Tenant" || log.source === "Tenant" || log.module === "Archive" || log.source === "Archive");
    }
    if (currentRole === "parking") {
      return log.user === "parking" && (log.module === "Parking" || log.source === "Parking");
    }
    if (currentRole === "lostandfound") {
      return log.user === "lostandfound" && (log.module === "LostAndFound" || log.source === "LostAndFound");
    }
    
    return false;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl h-[500px] flex flex-col animate-in fade-in zoom-in-95">
      
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-800">
            <History className="text-blue-600" size={24} />
            <h3 className="text-lg font-bold">{title}</h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Update the counter to use displayedLogs */}
            {displayedLogs.length > 0 && (
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                    {displayedLogs.length} Records
                </span>
            )}
            
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-lg border-slate-200 scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600 w-40">Timestamp</th>
                <th className="px-4 py-3 font-semibold text-slate-600 w-32">User Role</th>
                <th className="px-4 py-3 font-semibold text-slate-600 w-40">Action</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                 <tr>
                    <td colSpan="4" className="px-4 py-12 text-center text-slate-400">
                       <div className="flex justify-center items-center gap-2">
                          <Loader2 className="animate-spin text-blue-500" size={20} /> Loading records...
                       </div>
                    </td>
                 </tr>
              ) : displayedLogs.length > 0 ? (
                // 3. Map over displayedLogs instead of logs
                displayedLogs.map((log) => (
                  <tr key={log._id || log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {new Date(log.createdAt || log.timestamp).toLocaleString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                        log.user === 'superadmin' 
                        ? 'bg-purple-50 text-purple-700 border-purple-100' 
                        : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {log.user}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 text-xs uppercase tracking-wide">{log.action}</td>
                    <td className="px-4 py-3 text-slate-600">{log.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-slate-400 italic">
                    <History size={32} className="mx-auto mb-2 opacity-20" />
                    No activity recorded for your account level.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogModal;