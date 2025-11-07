import React, { useEffect, useRef, useState } from "react";
import { Menu, Bell, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Topbar = ({ title, onMenuClick }) => {
  const navigate = useNavigate();
  const [showBell, setShowBell] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const role = (typeof window !== "undefined" && localStorage.getItem("authRole")) || "superadmin";
  const userLabel = role === "parking" ? "Parking Admin" : "Admin";
  const bellRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ibt_notifications");
      const list = raw ? JSON.parse(raw) : [];
      // sort by id/date descending best-effort
      const sorted = [...list].sort((a, b) => (b.id || 0) - (a.id || 0));
      setNotifications(sorted.slice(0, 3));
    } catch {
      setNotifications([]);
    }
  }, [showBell]);

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const logout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("authRole");
    navigate("/login");
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="p-4 lg:px-8 lg:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-all">
              <Menu size={24} className="text-gray-700" />
            </button>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">{title}</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block relative" ref={bellRef}>
              <button onClick={() => setShowBell((s) => !s)} className="p-2.5 hover:bg-gray-100 rounded-xl transition-all relative">
                <Bell size={22} className="text-gray-600" />
                {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
              </button>
              {showBell && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="max-h-80 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-sm text-slate-600">No new notifications.</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-4 border-b last:border-b-0 hover:bg-gray-50">
                          <div className="text-sm font-semibold text-slate-800">{n.title}</div>
                          <div className="mt-1 text-sm text-slate-600 line-clamp-2">{n.message}</div>
                          <div className="mt-1 text-xs text-slate-400">{n.date} {n.source ? `• ${n.source}` : ""}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <button onClick={() => { setShowBell(false); navigate("/notifications"); }} className="w-full text-center text-sm font-medium text-emerald-700 hover:bg-emerald-50 py-2 border-t">
                    View All
                  </button>
                </div>
              )}
            </div>
            <div className="hidden md:block relative" ref={userRef}>
              <button onClick={() => setShowUser((s) => !s)} className="flex items-center space-x-3 bg-white border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 shadow-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg flex items-center justify-center text-white font-semibold">A</div>
                <span className="text-sm font-medium text-gray-700">{userLabel}</span>
                <ChevronDown size={18} className="text-gray-500" />
              </button>
              {showUser && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                  <button onClick={() => { setShowUser(false); navigate("/notifications"); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50">Notifications</button>
                  {role === "superadmin" && (
                    <button onClick={() => { setShowUser(false); navigate("/settings"); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50">Settings</button>
                  )}
                  <button onClick={() => { setShowUser(false); logout(); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50">Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
