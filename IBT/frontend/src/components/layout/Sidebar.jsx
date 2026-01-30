import React from "react"; 
import { NavLink, useLocation } from "react-router-dom";
import {
    Menu, Home, Ticket, CircleParking, Store,
    SearchCheck, FileText, Bus,
    AlertTriangle, Settings 
} from "lucide-react";

const Sidebar = ({ sidebarExpanded, setSidebarExpanded, onMobileClose }) => {
    const location = useLocation();

    const handleMenuClick = () => {
        setSidebarExpanded(!sidebarExpanded);

        if (window.innerWidth < 1024 && onMobileClose) {
            onMobileClose();
        }
    };

    const role = localStorage.getItem("authRole") || "superadmin";

    const allMenus = [
        { path: "/dashboard", icon: Home, label: "Dashboard", roles: ["superadmin"] },
        { path: "/buses-trips", icon: Bus, label: "Bus Trips", roles: ["bus", "superadmin"] },
        { path: "/tickets", icon: Ticket, label: "Tickets", roles: ["ticket", "superadmin"] },
        { path: "/tenant-lease", icon: Store, label: "Tenants/Lease", roles: ["lease", "superadmin"] },
        { path: "/parking", icon: CircleParking, label: "Parking", roles: ["superadmin", "parking"] },
        { path: "/lost-found", icon: SearchCheck, label: "Lost and Found", roles: ["lostfound", "superadmin"] },
        { path: "/reports", icon: FileText, label: "Reports", roles: ["superadmin"] },
        { path: "/deletion-requests", icon: AlertTriangle, label: "Deletion Requests", roles: ["superadmin"] },
        { path: "/notifications", icon: AlertTriangle, label: "Notifications", roles: ["parking", "lostfound", "bus", "ticket", "lease", "superadmin"] },
        { path: "/employee-management", icon: Settings, label: "Manage Employee", roles: ["superadmin"] },
    ];

    const bottomMenuItems = [
        { path: "/settings", icon: Settings, label: "Settings" }
    ];

    const menuItems = allMenus.filter((m) => m.roles.includes(role));

    const NavTooltip = ({ label }) => (
        <div
            className="absolute left-14 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-md"
            style={{ top: "50%", transform: "translateY(-50%)" }}
        >
            {label}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
    );

    return (
        <>
            <div
                className={`flex flex-col bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ${sidebarExpanded ? "w-64" : "w-20"
                    }`}
            >
                {/* Header Section */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleMenuClick}
                            className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 shrink-0"
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

                {/* Main Menu Items */}
                <div className="flex-1 overflow-y-auto py-4 px-3 overflow-x-hidden">
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <NavLink
                                    key={item.path + item.label}
                                    to={item.path}
                                    onClick={() => onMobileClose && onMobileClose()}
                                    className={`relative w-full flex items-center ${sidebarExpanded ? "space-x-3" : "justify-center"
                                        } px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                            ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <item.icon
                                        size={20}
                                        className={`shrink-0 ${isActive
                                                ? "text-emerald-600"
                                                : "text-gray-500 group-hover:text-gray-700"
                                            }`}
                                    />
                                    
                                    {sidebarExpanded ? (
                                        <>
                                            <span className="font-medium text-sm whitespace-nowrap">
                                                {item.label}
                                            </span>
                                            {isActive && (
                                                <div className="ml-auto w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                                            )}
                                        </>
                                    ) : (
                                        <NavTooltip label={item.label} />
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Menu Items */}
                <div className="border-t border-gray-200 p-3 space-y-1">
                    {bottomMenuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => onMobileClose && onMobileClose()}
                            className={`relative w-full flex items-center ${sidebarExpanded ? "space-x-3" : "justify-center"
                                } px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group`}
                        >
                            <item.icon
                                size={20}
                                className="text-gray-500 group-hover:text-gray-700 shrink-0"
                            />
                            {sidebarExpanded ? (
                                <span className="font-medium text-sm whitespace-nowrap">
                                    {item.label}
                                </span>
                            ) : (
                                <NavTooltip label={item.label} />
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Sidebar;