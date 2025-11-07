import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    Menu, Home, Ticket, CircleParking, Store,
    SearchCheck, LogOut, Settings, FileText, Bus,
    X, AlertTriangle
} from "lucide-react";

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
        localStorage.removeItem("isAdminLoggedIn");
        localStorage.removeItem("authRole");
        navigate("/login");
    };

    const role = localStorage.getItem("authRole") || "superadmin";

    const allMenus = [
        { path: "/dashboard", icon: Home, label: "Dashboard", roles: ["superadmin"] },
        { path: "/buses-trips", icon: Bus, label: "Bus Trips", roles: ["superadmin"] },
        { path: "/tickets", icon: Ticket, label: "Tickets", roles: ["superadmin"] },
        { path: "/tenant-lease", icon: Store, label: "Tenants/Lease", roles: ["superadmin"] },
        { path: "/parking", icon: CircleParking, label: "Parking", roles: ["superadmin", "parking"] },
        { path: "/lost-found", icon: SearchCheck, label: "Lost and Found", roles: ["superadmin"] },
        { path: "/reports", icon: FileText, label: "Reports", roles: ["superadmin"] },
        { path: "/notifications", icon: AlertTriangle, label: "Notifications", roles: ["parking", "superadmin"] },
    ];
    const menuItems = allMenus.filter((m) => m.roles.includes(role));

    const bottomMenuItems = [
        { path: "/settings", icon: Settings, label: "Settings", roles: ["superadmin"] },
    ].filter((m) => (m.roles ? m.roles.includes(role) : true));

    return (
        <>
            <div
                className={`flex flex-col bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ${sidebarExpanded ? "w-64" : "w-20"
                    }`}
            >
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleMenuClick}
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

                <div className="flex-1 overflow-y-auto py-4 px-3">
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <NavLink
                                    key={item.path + item.label}
                                    to={item.path}
                                    onClick={() => onMobileClose && onMobileClose()}
                                    className={`w-full flex items-center ${sidebarExpanded ? "space-x-3" : "justify-center"
                                        } px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
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
                </div>

                <div className="border-t border-gray-200 p-3 space-y-1">
                    {bottomMenuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => onMobileClose && onMobileClose()}
                            className={`w-full flex items-center ${sidebarExpanded ? "space-x-3" : "justify-center"
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

                    {sidebarExpanded ? (
                        <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                                    A
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {role === "parking" ? "Parking Admin" : "Admin User"}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {role === "parking" ? "parkingadmin@example.com" : "admin@gmail.com"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowLogoutModal(true)}
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
                                onClick={() => setShowLogoutModal(true)}
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showLogoutModal && (
                <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-80 p-6 relative">
                        <button
                            onClick={() => setShowLogoutModal(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>
                        <div className="flex flex-col items-center text-center">
                            <AlertTriangle className="text-amber-500 mb-3" size={40} />
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">
                                Confirm Logout
                            </h2>
                            <p className="text-sm text-gray-500 mb-5">
                                Are you sure you want to log out of your account?
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 text-white hover:opacity-90 transition-all"
                                >
                                    Yes, Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;
