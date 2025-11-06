import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { menuItems, bottomMenuItems } from "./navItems";
import SidebarHeader from "./SidebarHeader";
import SidebarNav from "./SidebarNav";
import SidebarFooterNav from "./SidebarFooterNav";
import UserProfile from "./UserProfile";
import LogoutModal from "./LogoutModal";

const Sidebar = ({ sidebarExpanded, setSidebarExpanded, onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleMenuClick = () => {
    setSidebarExpanded(!sidebarExpanded);
    if (window.innerWidth < 1024 && onMobileClose) {
      onMobileClose();
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    navigate("/login");
  };

  return (
    <>
      <div
        className={`flex flex-col bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ${
          sidebarExpanded ? "w-64" : "w-20"
        }`}
      >
        <SidebarHeader
          sidebarExpanded={sidebarExpanded}
          onMenuClick={handleMenuClick}
        />

        <div className="flex-1 overflow-y-auto py-4 px-3">
          <SidebarNav
            items={menuItems}
            sidebarExpanded={sidebarExpanded}
            location={location}
            onLinkClick={onMobileClose}
          />
        </div>

        <div className="border-t border-gray-200 p-3 space-y-1">
          <SidebarFooterNav
            items={bottomMenuItems}
            sidebarExpanded={sidebarExpanded}
            onLinkClick={onMobileClose}
          />
          <UserProfile
            sidebarExpanded={sidebarExpanded}
            onLogoutClick={() => setShowLogoutModal(true)}
          />
        </div>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
};

export default Sidebar;