import React, { useEffect, useRef, useState } from "react";
import {
  Menu, Bell, ChevronDown, X, AlertTriangle, Megaphone, Upload,
  Eye, Edit, Trash2, ZoomIn, ZoomOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationToast from "../common/NotificationToast";

const Topbar = ({ title, onMenuClick }) => {
  const navigate = useNavigate();

  const [showBell, setShowBell] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTab, setBroadcastTab] = useState("create");
  const [adminBroadcasts, setAdminBroadcasts] = useState([]);
  const [isLoadingBroadcasts, setIsLoadingBroadcasts] = useState(false);

  const [postTiming, setPostTiming] = useState("now");
  const [broadcastData, setBroadcastData] = useState({ title: "", message: "", targetGroup: "All" });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [viewingPost, setViewingPost] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [postToDelete, setPostToDelete] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, type: 'success', message: '' });

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

  const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:10000").replace(/\/api\/?$/, '');

  const getImageUrl = (uri) => {
    if (!uri) return '';
    return uri.startsWith('http') ? uri : `${BASE_URL}${uri}`;
  };

  const showToast = (type, message) => {
    setToast({ isOpen: true, type, message });
    setTimeout(() => setToast({ isOpen: false, type: 'success', message: '' }), 3000);
  };

  const fetchNotifications = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:10000";
      const res = await fetch(`${baseUrl}/api/notifications`);
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

  const fetchAdminBroadcasts = async () => {
    setIsLoadingBroadcasts(true);
    try {
      const res = await fetch(`${BASE_URL}/api/broadcasts/admin`);
      if (res.ok) {
        const data = await res.json();
        setAdminBroadcasts(data);
      }
    } catch (error) {
      console.error("Error fetching broadcasts:", error);
    } finally {
      setIsLoadingBroadcasts(false);
    }
  };

  const confirmDeleteBroadcast = async () => {
    if (!postToDelete) return;
    try {
      const res = await fetch(`${BASE_URL}/api/broadcasts/${postToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAdminBroadcasts(prev => prev.filter(b => b.id !== postToDelete));
        showToast('success', 'Broadcast deleted successfully!');
      } else {
        showToast('error', 'Failed to delete broadcast.');
      }
    } catch (error) {
      console.error("Error deleting:", error);
      showToast('error', 'An error occurred while deleting.');
    } finally {
      setPostToDelete(null);
    }
  };

  const handleEditClick = (post) => {
    setEditMode(true);
    setEditId(post.id);
    setBroadcastData({ title: post.title, message: post.message });
    setExistingAttachments(post.attachments || []);
    setBroadcastTab("create");
  };

  const resetForm = () => {
    setBroadcastData({ title: "", message: "", targetGroup: "All" });
    setSelectedFiles([]);
    setExistingAttachments([]);
    setScheduledDate("");
    setScheduledTime("");
    setPostTiming("now");
    setEditMode(false);
    setEditId(null);
  };

  const applyRentReminderTemplate = () => {
    const today = new Date();
    // If we are past the 5th, assume the reminder is for next month
    if (today.getDate() > 5) {
      today.setMonth(today.getMonth() + 1);
    }
    const monthName = today.toLocaleString('default', { month: 'long' });
    const year = today.getFullYear();

    setBroadcastData({
      title: `Rent Due Reminder: ${monthName} ${year}`,
      message: `Dear Permanent Tenants,\n\nPlease be reminded that your rent for ${monthName} ${year} is due between the 1st and the 5th of the month.\n\nKindly settle your accounts on or before ${monthName} 5th to avoid any late penalties.\n\nThank you,\nIBT Management`,
      targetGroup: "Permanent"
    });
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (broadcastTab === "manage" && showBroadcastModal) {
      fetchAdminBroadcasts();
      setViewingPost(null);
    }
  }, [broadcastTab, showBroadcastModal]);

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleBroadcastSubmit = async () => {
    if (!broadcastData.title || !broadcastData.message) {
      return showToast("error", "Please provide a subject and a message.");
    }

    const formData = new FormData();
    formData.append('title', broadcastData.title);
    formData.append('message', broadcastData.message);
    formData.append('targetGroup', broadcastData.targetGroup);

    if (postTiming === "schedule" && !editMode) {
      if (!scheduledDate || !scheduledTime) {
        return showToast("error", "Please select a date and time to schedule.");
      }
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      formData.append('scheduledFor', scheduledDateTime);
    }

    if (selectedFiles.length > 0) {
      Array.from(selectedFiles).forEach((file) => {
        formData.append('files', file);
      });
    }

    setIsSubmitting(true);
    try {
      const url = editMode
        ? `${BASE_URL}/api/broadcasts/${editId}`
        : `${BASE_URL}/api/broadcasts`;

      const res = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        showToast("success", editMode ? "Broadcast updated successfully!" : (postTiming === "schedule" ? "Broadcast scheduled!" : "Broadcast sent!"));
        setShowBroadcastModal(false);
        resetForm();
      } else {
        showToast("error", `Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to broadcast:", error);
      showToast("error", "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    const notifId = notif.id || notif._id;
    if (!notif.read) {
      await handleMarkAsRead(notifId);
    }
    setShowBell(false);

    let route = "/notifications";
    const source = (notif.source || "").toLowerCase();
    const title = (notif.title || "").toLowerCase();

    if (source.includes("terminal") || title.includes("terminal")) {
      route = "/api/terminal-fees";
    } else if (source.includes("bus") || title.includes("bus")) {
      route = "/api/bus-trips";
    } else if (source.includes("lost") || title.includes("lost")) {
      route = "/api/lost-found";
    } else if (source.includes("parking") || title.includes("parking")) {
      route = "/api/parking";
    } else if (source.includes("tenant") || title.includes("tenant")) {
      route = "/api/tenants";
    } else if (title.includes("deletion request")) {
      route = "/api/deletion-requests";
    }
    navigate(route);
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("authRole");
    navigate("/login");
  };

  return (
    <>
      <NotificationToast
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />

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
              <button
                onClick={() => { setShowBroadcastModal(true); resetForm(); }}
                className="p-2.5 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-all cursor-pointer"
                title="Broadcast Message"
              >
                <Megaphone size={22} />
              </button>

              <div className="hidden sm:block relative" ref={bellRef}>
                <button
                  onClick={() => setShowBell((s) => !s)}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-all relative cursor-pointer"
                >
                  <Bell size={22} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showBell && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">

                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-500">
                          No new notifications.
                        </div>
                      ) : (
                        notifications.map((notif, index) => (
                          <div
                            key={notif.id || index}
                            // --- ADD THIS ONCLICK HANDLER ---
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.read ? 'bg-emerald-50/30' : ''}`}
                          >
                            {notif.title && <p className="text-sm font-semibold text-gray-800 mb-1">{notif.title}</p>}
                            <p className="text-xs text-gray-600 line-clamp-2">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setShowBell(false);
                        navigate("/notifications");
                      }}
                      className="w-full p-3 text-center text-sm text-emerald-600 font-semibold hover:bg-gray-50 transition-colors border-t border-gray-100 cursor-pointer"
                    >
                      View All Notifications
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
                    {userLetter}
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

                    <button onClick={() => setShowLogoutModal(true)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50">Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBroadcastModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

            <div className="p-6 pb-4 flex justify-between items-start border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {editMode ? "Edit Post" : "New Post Announcement"}
                </h2>

                <div className="flex space-x-4 mt-4 border-b border-gray-200">
                  <button
                    onClick={() => { setBroadcastTab("create"); resetForm(); }}
                    className={`pb-2 text-sm font-semibold transition-colors ${broadcastTab === "create" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {editMode ? "Editing Post" : "New Post Announcement"}
                  </button>
                  <button
                    onClick={() => { setBroadcastTab("manage"); setEditMode(false); }}
                    className={`pb-2 text-sm font-semibold transition-colors ${broadcastTab === "manage" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    History & Scheduled
                  </button>
                </div>
              </div>

              <button
                onClick={() => { setShowBroadcastModal(false); resetForm(); }}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {broadcastTab === "create" && (
              <>
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                  <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Audience</label>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {['All', 'Permanent', 'Night Market'].map(group => (
                          <button
                            key={group}
                            onClick={() => setBroadcastData({ ...broadcastData, targetGroup: group })}
                            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors whitespace-nowrap ${broadcastData.targetGroup === group ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                            {group}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Templates</label>
                      <button
                        onClick={applyRentReminderTemplate}
                        className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 font-medium transition-colors cursor-pointer"
                      >
                        Permanent Rent Due (1st-5th)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Subject / Title
                    </label>
                    <input
                      type="text"
                      value={broadcastData.title}
                      onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                      placeholder="Enter announcement subject..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Message</label>
                    <textarea
                      rows="4"
                      value={broadcastData.message}
                      onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                      placeholder="Write your message here..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Attachments (Optional)</label>
                    <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={(e) => setSelectedFiles(e.target.files)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="text-slate-300 group-hover:text-emerald-500 transition-colors mb-2" size={32} />
                      <p className="text-sm font-semibold text-slate-700">Click or drag to upload</p>
                      {editMode && <p className="text-[10px] text-amber-500 mt-1">Uploading new files replaces old ones</p>}
                    </div>


                    {selectedFiles.length > 0 && (
                      <div className="flex gap-3 mt-4 overflow-x-auto pb-2 custom-scrollbar">
                        {Array.from(selectedFiles).map((file, idx) => {
                          const isImage = file.type.startsWith('image/');
                          return (
                            <div
                              key={idx}
                              className={`relative min-w-[70px] h-[70px] rounded-lg overflow-hidden border border-gray-200 shadow-sm ${isImage ? 'cursor-pointer group' : ''}`}
                              onClick={() => isImage && setFullscreenImage(URL.createObjectURL(file))}
                            >
                              {isImage ? (
                                <>
                                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100" size={20} />
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-bold">VIDEO</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>


                  {editMode && existingAttachments.length > 0 && selectedFiles.length === 0 && (
                    <div className="mt-4">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Current Attachments</p>
                      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                        {existingAttachments.map((att, idx) => {
                          const isImage = att.type?.toLowerCase() === 'image';
                          return (
                            <div
                              key={idx}
                              className={`relative min-w-[70px] h-[70px] rounded-lg overflow-hidden border border-gray-200 shadow-sm ${isImage ? 'cursor-pointer group' : ''}`}
                              onClick={() => isImage && setFullscreenImage(getImageUrl(att.uri))}
                            >
                              {isImage ? (
                                <>
                                  <img src={getImageUrl(att.uri)} alt="preview" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100" size={20} />
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold">VIDEO</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {!editMode && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Post Timing</label>
                      <div className="flex p-1 bg-gray-50 border border-gray-100 rounded-xl">
                        <button onClick={() => setPostTiming("now")} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${postTiming === "now" ? "bg-white text-emerald-600 shadow-sm border border-emerald-100" : "text-slate-500"}`}>Post Now</button>
                        <button onClick={() => setPostTiming("schedule")} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${postTiming === "schedule" ? "bg-white text-emerald-600 shadow-sm border border-emerald-100" : "text-slate-500"}`}>Schedule</button>
                      </div>

                      {postTiming === "schedule" && (
                        <div className="flex space-x-4 mt-4 animate-in fade-in slide-in-from-top-2">
                          <div className="flex-1">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                            <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time</label>
                            <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-50 flex space-x-4">
                  <button onClick={() => { setShowBroadcastModal(false); resetForm(); }} className="flex-1 py-3.5 rounded-xl border border-gray-200 text-slate-600 font-semibold hover:bg-gray-50 transition-all cursor-pointer">Cancel</button>
                  <button onClick={handleBroadcastSubmit} disabled={isSubmitting} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold hover:opacity-90 transition-all shadow-md shadow-emerald-100 cursor-pointer disabled:opacity-50">
                    {isSubmitting ? "Saving..." : (editMode ? "Save Changes" : (postTiming === "schedule" ? "Schedule Post" : "Send Broadcast"))}
                  </button>
                </div>
              </>
            )}

            {broadcastTab === "manage" && (
              <div className="p-0 overflow-hidden flex flex-col flex-1 bg-slate-50">

                {viewingPost ? (
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                    <button onClick={() => setViewingPost(null)} className="text-emerald-600 text-sm font-bold flex items-center mb-4 hover:underline">
                      ← Back to History
                    </button>
                    <h3 className="text-xl font-bold text-gray-800">{viewingPost.title}</h3>
                    <p className="text-xs text-gray-400 mb-4">{viewingPost.date}</p>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{viewingPost.message}</p>


                    {viewingPost.attachments?.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Attachments</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {viewingPost.attachments.map((att, idx) => {
                            const isImage = att.type?.toLowerCase() === 'image';
                            return (
                              <div key={idx} className={`relative h-32 rounded-xl overflow-hidden border border-gray-200 ${isImage ? 'group cursor-pointer' : ''}`}
                                onClick={() => isImage && setFullscreenImage(getImageUrl(att.uri))}>
                                {isImage ? (
                                  <>
                                    <img src={getImageUrl(att.uri)} alt="attachment" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                                      <ZoomIn className="text-white opacity-0 group-hover:opacity-100" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-white p-2 text-center">
                                    <span className="text-xs font-bold">VIDEO FILE</span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (

                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {isLoadingBroadcasts ? (
                      <div className="text-center py-10 text-slate-500 text-sm font-medium">Loading broadcasts...</div>
                    ) : adminBroadcasts.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-sm font-medium">No broadcasts found.</div>
                    ) : (
                      <div className="space-y-4">
                        {adminBroadcasts.map((b) => (
                          <div key={b.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between group hover:border-emerald-200 transition-colors">
                            <div className="flex-1 pr-4 cursor-pointer" onClick={() => setViewingPost(b)}>
                              <div className="flex items-center space-x-2 mb-1">
                                {b.status === 'Scheduled' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">Scheduled</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Posted</span>
                                )}
                                <span className="text-xs text-slate-500 font-medium">{b.date}</span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{b.title}</h4>
                              <p className="text-xs text-slate-500 line-clamp-1 mt-1 mb-2">{b.message}</p>


                              {b.attachments?.length > 0 && (
                                <div className="flex gap-2">
                                  {b.attachments.map((att, idx) => {
                                    const isImage = att.type?.toLowerCase() === 'image';
                                    return (
                                      <div
                                        key={idx}
                                        className={`w-8 h-8 rounded border border-gray-200 overflow-hidden relative ${isImage ? 'cursor-pointer group' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (isImage) setFullscreenImage(getImageUrl(att.uri));
                                        }}
                                      >
                                        {isImage ? (
                                          <>
                                            <img src={getImageUrl(att.uri)} className="w-full h-full object-cover" alt="thumb" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                                              <ZoomIn className="text-white opacity-0 group-hover:opacity-100" size={10} />
                                            </div>
                                          </>
                                        ) : (
                                          <div className="w-full h-full bg-slate-800 flex items-center justify-center"><span className="text-[7px] font-bold text-white">VID</span></div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-1">
                              <button onClick={() => setViewingPost(b)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="View Details">
                                <Eye size={18} />
                              </button>
                              <button onClick={() => handleEditClick(b)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Post">
                                <Edit size={18} />
                              </button>
                              <button onClick={() => setPostToDelete(b.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Post">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {fullscreenImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="absolute top-6 right-6 flex items-center gap-4 z-[110]">
            <button onClick={() => setZoomLevel(z => z + 0.3)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer"><ZoomIn className="text-white" size={24} /></button>
            <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.3))} className="p-3 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer"><ZoomOut className="text-white" size={24} /></button>
            <div className="w-px h-8 bg-white/20 mx-2"></div>
            <button onClick={() => { setFullscreenImage(null); setZoomLevel(1); }} className="p-3 bg-red-500/80 hover:bg-red-500 rounded-full cursor-pointer"><X className="text-white" size={24} /></button>
          </div>
          <div className="overflow-auto w-full h-full flex items-center justify-center custom-scrollbar">
            <img
              src={fullscreenImage}
              alt="fullscreen"
              className="max-w-none transition-transform duration-200 ease-out"
              style={{ transform: `scale(${zoomLevel})` }}
            />
          </div>
        </div>
      )}

      {postToDelete && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-80 p-6 relative animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="text-red-500" size={32} />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Delete Broadcast?</h2>
              <p className="text-sm text-gray-500 mb-6">
                This action cannot be undone. This post will be permanently removed from the mobile app.
              </p>
              <div className="flex w-full space-x-3">
                <button onClick={() => setPostToDelete(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmDeleteBroadcast} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-md shadow-red-200">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl w-80 p-6 relative">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="text-amber-500 mb-3" size={40} />
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Confirm Logout</h2>
              <div className="flex w-full space-x-3 mt-4">
                <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700">Cancel</button>
                <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold">Yes, Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;