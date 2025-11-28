import React from "react";
import { Menu } from "lucide-react";

const SidebarHeader = ({ sidebarExpanded, onMenuClick }) => {
  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <Menu className="text-white" size={24} />
        </button>
        {sidebarExpanded && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent whitespace-nowrap">
              IBT
            </h1>
            <p className="text-xs text-gray-500 whitespace-nowrap">
              Management System
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarHeader;