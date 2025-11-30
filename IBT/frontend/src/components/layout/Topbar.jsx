import React, { useEffect, useRef, useState } from "react";
import { Menu, Bell, ChevronDown, X, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Topbar = ({ title, onMenuClick }) => {
  const navigate = useNavigate();
  const [showBell, setShowBell] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const role = (typeof window !== "undefined" && localStorage.getItem("authRole")) || "superadmin";
  const userLabel = role === "parking" ? "Parking Admin" : 
  role === "lostfound" ? "Lostfound Admin" : 
  role === "bus" ? "Bus Admin" :
  role === "ticket" ? "Ticket Admin" :
  role === "lease" ? "Lease Admin" :  "Admin";
  const bellRef = useRef(null);
  const userRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/notifications");
      if (res.ok) {
        const data = await res.json();
        // Update the list for the dropdown
        setNotifications(data.slice(0, 5)); 
        // Calculate unread count
        const unread = data.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications(); // Initial fetch
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("authRole");
    navigate("/login");
  };

  return (
    <>
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
               <button
                  onClick={() => setShowBell((s) => !s)}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-all relative cursor-pointer"
                >
                  <Bell size={22} className="text-gray-600" />
                  
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-bounce">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
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
                            <div className="mt-1 text-xs text-slate-400">
                              {n.date} {n.source ? `• ${n.source}` : ""}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setShowBell(false);
                        navigate("/notifications");
                      }}
                      className="w-full text-center text-sm font-medium text-emerald-700 hover:bg-emerald-50 py-2 border-t cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                )}
              </div>

              <div className="hidden md:block relative" ref={userRef}>
                <button
                  onClick={() => setShowUser((s) => !s)}
                  className="flex items-center space-x-3 bg-white border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 shadow-sm cursor-pointer"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    A
                  </div>
                  <span className="text-sm font-medium text-gray-700">{userLabel}</span>
                  <ChevronDown size={18} className="text-gray-500" />
                </button>

                {showUser && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                    <button
                      onClick={() => {
                        setShowUser(false);
                        navigate("/notifications");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer"
                    >
                      Notifications
                    </button>

                     <button
                      onClick={() => {
                        setShowUser(false);
                        navigate("/archive");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer"
                    >
                      Archive
                    </button>

                    {role === "superadmin" && (
                      <button
                        onClick={() => {
                          setShowUser(false);
                          navigate("/employee-management");
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer"
                      >
                        Settings
                      </button>
                    )}

                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
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
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Confirm Logout</h2>
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

export default Topbar;
