import React, { useState, useEffect } from "react";
import Sidebar from "../layout/sidebar/Sidebar";
import Topbar from "./Topbar";

const Layout = ({ title, children }) => {
  // 1. Initialize State from LocalStorage
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebarExpanded");
    // Explicit check for the string "false"
    return saved === "false" ? false : true;
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  // 2. KEY FIX: Automatically save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("sidebarExpanded", sidebarExpanded);
  }, [sidebarExpanded]);

  // Handle Document Title
  useEffect(() => {
    document.title = title ? `${title}` : "IBT Management";
  }, [title]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 relative overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar 
          sidebarExpanded={sidebarExpanded} 
          setSidebarExpanded={setSidebarExpanded} 
        />
      </div>

      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300 ${mobileOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Sidebar (Drawer) */}
      <div className={`fixed inset-y-0 left-0 bg-white z-50 transform transition-transform duration-300 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar 
            sidebarExpanded={true} // Mobile is always "expanded" visually inside the drawer
            setSidebarExpanded={setSidebarExpanded} 
            onMobileClose={() => setMobileOpen(false)} 
        />
      </div>

      <div className="flex-1 overflow-auto relative z-0">
        <Topbar title={title} onMenuClick={() => setMobileOpen(true)} />
        <div className="p-4 lg:p-8">{children}</div>
      </div>
    </div>
  );
};

export default Layout;