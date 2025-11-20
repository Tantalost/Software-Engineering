import React, { useState, useEffect } from "react";
import { History, X } from "lucide-react";

const LogModal = ({ isOpen, onClose, storageKey = "ibt_activity_logs", title = "Activity Logs" }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (isOpen) {
      try {
        const raw = localStorage.getItem(storageKey);
        setLogs(raw ? JSON.parse(raw) : []);
      } catch (e) {
        console.error("Error loading logs:", e);
        setLogs([]);
      }
    }
  }, [isOpen, storageKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl h-[500px] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-800">
            <History className="text-blue-600" size={24} />
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-lg border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Timestamp</th>
                <th className="px-4 py-3 font-semibold text-slate-600">User Role</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Action</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.user === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {log.user}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{log.action}</td>
                    <td className="px-4 py-3 text-slate-600">{log.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-slate-400 italic">
                    No activity recorded yet.
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