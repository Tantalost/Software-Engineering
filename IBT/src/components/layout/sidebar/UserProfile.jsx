// /components/sidebar/UserProfile.js
import React from "react";
import { LogOut } from "lucide-react";

const UserProfile = ({ sidebarExpanded, onLogoutClick }) => {
  return (
    <>
      {sidebarExpanded ? (
        <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                Admin User
              </p>
              <p className="text-xs text-gray-500 truncate">admin@gmail.com</p>
            </div>
            <button
              onClick={onLogoutClick}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex justify-center">
          <div
            className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            onClick={onLogoutClick}
            title="Logout"
          >
            <LogOut size={18} />
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfile;