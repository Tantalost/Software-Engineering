import React from "react";
import { Clock, User } from "lucide-react";

/**
 * Same chrome as Terminal Dispatch Board: dark header with operator + date.
 */
const TerminalBoardShell = ({ title, children }) => {
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const currentAdmin =
    localStorage.getItem("authName") ||
    localStorage.getItem("authEmail") ||
    "Admin Operator";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-800 text-white p-4 flex flex-wrap gap-3 justify-between items-center">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Clock size={20} className="text-emerald-400" />
          {title}
        </h2>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-600 px-3 py-1 rounded-full">
            <User size={14} className="text-blue-400 shrink-0" />
            <span>
              Operator:{" "}
              <span className="text-white">{currentAdmin}</span>
            </span>
          </div>

          <span className="text-sm font-medium text-slate-300 bg-slate-700 px-3 py-1 rounded-full">
            As of {todayFormatted}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
};

export default TerminalBoardShell;
