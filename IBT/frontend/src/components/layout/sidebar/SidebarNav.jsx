import React from "react";
import { NavLink } from "react-router-dom";

const SidebarNav = ({ items, sidebarExpanded, location, onLinkClick }) => {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink
            key={item.path + item.label}
            to={item.path}
            onClick={() => onLinkClick && onLinkClick()}
            className={`w-full flex items-center ${
              sidebarExpanded ? "space-x-3" : "justify-center"
            } px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive
                ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
            title={!sidebarExpanded ? item.label : ""}
          >
            <item.icon
              size={20}
              className={
                isActive
                  ? "text-emerald-600"
                  : "text-gray-500 group-hover:text-gray-700"
              }
            />
            {sidebarExpanded && (
              <>
                <span className="font-medium text-sm whitespace-nowrap">
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
};

export default SidebarNav;