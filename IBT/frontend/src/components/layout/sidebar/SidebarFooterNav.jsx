import React from "react";
import { NavLink } from "react-router-dom";

const SidebarFooterNav = ({ items, sidebarExpanded, onLinkClick }) => {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => onLinkClick && onLinkClick()}
          className={`w-full flex items-center ${
            sidebarExpanded ? "space-x-3" : "justify-center"
          } px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group`}
          title={!sidebarExpanded ? item.label : ""}
        >
          <item.icon
            size={20}
            className="text-gray-500 group-hover:text-gray-700"
          />
          {sidebarExpanded && (
            <span className="font-medium text-sm whitespace-nowrap">
              {item.label}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default SidebarFooterNav;