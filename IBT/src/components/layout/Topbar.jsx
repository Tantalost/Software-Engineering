import React from "react";
import { Menu, Bell, ChevronDown } from "lucide-react";

const Topbar = ({ title, onMenuClick }) => {
  return (
    <div className="bg-white/90 border-b border-gray-200 shadow-sm sticky top-0 z-40 backdrop-blur-lg">
      <div className="p-4 lg:px-8 lg:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-all">
              <Menu size={24} className="text-gray-700" />
            </button>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              {title}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button className="hidden sm:flex p-2.5 hover:bg-gray-100 rounded-xl transition-all relative">
              <Bell size={22} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="hidden md:flex items-center space-x-3 bg-gray-100 rounded-xl px-4 py-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg flex items-center justify-center text-white font-semibold">A</div>
              <span className="text-sm font-medium text-gray-700">Admin</span>
              <ChevronDown size={18} className="text-gray-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
