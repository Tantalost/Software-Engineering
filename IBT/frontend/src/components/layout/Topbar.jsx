import React, { useEffect, useRef, useState } from "react";
import { Menu, Bell, ChevronDown, X, AlertTriangle, Radio, Upload } from "lucide-react"; // Added Radio and Upload icons
import { useNavigate } from "react-router-dom";

const Topbar = ({ title, onMenuClick }) => {
  const navigate = useNavigate();
  const [showBell, setShowBell] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false); // New State
  const [postTiming, setPostTiming] = useState("now"); // New State for toggle

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const role = (typeof window !== "undefined" && localStorage.getItem("authRole")) || "superadmin";
  const userLabel = role === "parking" ? "Parking Admin" :
    role === "lostfound" ? "Lostfound Admin" :
      role === "bus" ? "Bus Admin" :
        role === "ticket" ? "Ticket Admin" :
          role === "lease" ? "Lease Admin" : "Super Admin";

  const userLetter = role === "superadmin" ? "SA" : "A";

  const bellRef = useRef(null);
  const userRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`);
      if (res.ok) {
        const data = await res.json();
        const myRole = localStorage.getItem("authRole") || "superadmin";
        const filteredData = data.filter(n => !n.targetRole || n.targetRole === "all" || n.targetRole === myRole);
        setNotifications(filteredData.slice(0, 5));
        setUnreadCount(filteredData.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
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
    localStorage.removeItem("authName");
    navigate("/login");
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="p-4 lg:px-8 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-all cursor-pointer">
                <Menu size={24} className="text-gray-700" />
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">{title}</h1>
            </div>

            <div className="flex items-center space-x-3">
              {/* --- NEW BROADCAST BUTTON --- */}
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="p-2.5 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-all cursor-pointer"
                title="Broadcast Message"
              >
                <Radio size={22} />
              </button>

              {/* Notification Bell */}
              <div className="hidden sm:block relative" ref={bellRef}>
                <button
                  onClick={() => setShowBell((s) => !s)}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-all relative cursor-pointer"
                  title="Notification"
                >
                  <Bell size={22} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-bounce">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {/* ... existing notification dropdown code ... */}
                {showBell && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="max-h-80 overflow-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-slate-600">No new notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-4 border-b last:border-b-0 hover:bg-gray-50">
                            <div className="text-sm font-semibold text-slate-800">{n.title}</div>
                            <div className="mt-1 text-sm text-slate-600 line-clamp-2">{n.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="hidden md:block relative" ref={userRef}>
                <button
                  onClick={() => setShowUser((s) => !s)}
                  className="flex items-center space-x-3 bg-white border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 shadow-sm cursor-pointer"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    {userLetter}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{userLabel}</span>
                  <ChevronDown size={18} className="text-gray-500" />
                </button>
                {/* ... existing user dropdown code ... */}
                {showUser && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                    <button onClick={() => setShowLogoutModal(true)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50">Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- BROADCAST MODAL --- */}
      {showBroadcastModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 pb-2 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Broadcast Message</h2>
                <p className="text-sm text-slate-500 mt-1">Manage announcements and scheduling</p>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 pt-2 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Subject */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
                <input
                  type="text"
                  placeholder="Announcement Title"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Message</label>
                <textarea
                  rows="4"
                  placeholder="Write your message here..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              {/* Attachment */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Attachment</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
                  <Upload className="text-slate-300 group-hover:text-emerald-500 transition-colors mb-2" size={32} />
                  <p className="text-sm font-semibold text-slate-700">Click or drag to upload</p>
                  <p className="text-xs text-slate-400 mt-1">PDF or Image (Max 10MB)</p>
                </div>
              </div>

              {/* Post Timing Toggle */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Post Timing</label>
                <div className="flex p-1 bg-gray-50 border border-gray-100 rounded-xl">
                  <button
                    onClick={() => setPostTiming("now")}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${postTiming === "now" ? "bg-white text-emerald-600 shadow-sm border border-emerald-100" : "text-slate-500"}`}
                  >
                    Post Now
                  </button>
                  <button
                    onClick={() => setPostTiming("schedule")}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${postTiming === "schedule" ? "bg-white text-emerald-600 shadow-sm border border-emerald-100" : "text-slate-500"}`}
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-50 flex space-x-4">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-slate-600 font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold hover:opacity-90 transition-all shadow-md shadow-emerald-100 active:scale-[0.98]">
                Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-80 p-6 relative">
            <button onClick={() => setShowLogoutModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="text-amber-500 mb-3" size={40} />
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Confirm Logout</h2>
              <div className="flex space-x-3 mt-4">
                <button onClick={() => setShowLogoutModal(false)} className="px-4 py-2 rounded-lg border border-gray-300">Cancel</button>
                <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 text-white">Yes, Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;