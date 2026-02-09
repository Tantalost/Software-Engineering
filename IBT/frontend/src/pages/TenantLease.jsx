import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from 'xlsx'; 
import jsPDF from 'jspdf'; 
import autoTable from "jspdf-autotable"; 
import {Archive, Trash2, Mail, Download, Store, MoonStar, Map, ClipboardList, CheckCircle, X, Bell, Calendar, Clock, Filter, Wand2, History, ListChecks, FileText, Loader2} from "lucide-react";

import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import StatCardGroup from "../components/tenants/StatCardGroup";
import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import LogModal from "../components/common/LogModal"; 

import EditTenantLease from "../components/tenants/EditTenantLease";
import DeleteModal from "../components/common/DeleteModal";
import TenantStatusFilter from "../components/tenants/TenantStatusFilter"; 
import AddTenantModal from "../components/tenants/modals/AddTenantModal"; 
import TenantViewModal from "../components/tenants/modals/TenantViewModal";
import TenantMapModal from "../components/tenants/modals/TenantMapModal";
import WaitlistModal from "../components/tenants/modals/WaitlistModal";
import TenantEmailModal from "../components/tenants/modals/TenantEmailModal";
import ApplicationReviewModal from "../components/tenants/modals/ApplicationReviewModal";
import { generateRentStatementPDF } from "../utils/tenantUtils";
import { logActivity } from "../utils/logger"; 
import { sendNotification } from "../utils/notificationService.js"; 
import { submitPageReport } from "../utils/reportService.js";

const API_URL = "http://localhost:3000/api";
const ARCHIVE_URL = "http://localhost:3000/api/archives"; 

const BroadcastModal = ({ isOpen, onClose, onBroadcast, draft, setDraft, tenantCount }) => {
    if (!isOpen) return null;

    const handleTemplateClick = () => {
        setDraft(prev => ({
            ...prev,
            title: "Payment Reminder: Due Date Approaching",
            message: "Dear Tenant,\n\nThis is a friendly reminder that your rent payment is due within the next 5 days. Please ensure your payment is settled to avoid penalties.\n\nThank you!",
            templateApplied: true
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl transform transition-all scale-100">
                <div className="flex items-center justify-between mb-5 border-b pb-3">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Bell className="text-emerald-600" size={24} /> 
                        Broadcast Notification
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                            <Filter size={14} /> Target Audience
                        </label>
                        <select 
                            value={draft.targetGroup}
                            onChange={(e) => setDraft({...draft, targetGroup: e.target.value})}
                            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50"
                        >
                            <option value="All">All Tenants</option>
                            <option value="Permanent">Permanent Tenants Only</option>
                            <option value="Night Market">Night Market Only</option>
                        </select>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            type="button"
                            onClick={handleTemplateClick}
                            className="text-xs flex items-center gap-1 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100"
                        >
                            <Wand2 size={12} /> Auto-fill "Due Near" Template
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Title / Subject</label>
                        <input 
                            type="text" 
                            value={draft.title}
                            onChange={(e) => setDraft({...draft, title: e.target.value})}
                            placeholder="e.g. Important Announcement"
                            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Message Body</label>
                        <textarea 
                            value={draft.message}
                            onChange={(e) => setDraft({...draft, message: e.target.value})}
                            placeholder="Type your message here..."
                            rows={4}
                            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                            <Clock size={14} /> Schedule Send (Optional)
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                                type="datetime-local"
                                value={draft.scheduleTime}
                                onChange={(e) => setDraft({...draft, scheduleTime: e.target.value})}
                                className="w-full pl-10 p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 pl-1">
                            Leave blank to send immediately.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                    <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={onBroadcast}
                        className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md transition-all flex items-center gap-2"
                    >
                        {draft.scheduleTime ? "Schedule Broadcast" : "Send Now"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TenantLease = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState("permanent"); 
  const [activeStatus, setActiveStatus] = useState("All"); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const role = localStorage.getItem("authRole") || "superadmin";

  const [records, setRecords] = useState([]); 
  const [waitlistData, setWaitlistData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotify, setShowNotify] = useState(false); 
  const [showMapModal, setShowMapModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false); 
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false); 
  
  const [showLogModal, setShowLogModal] = useState(false);

  const [isReporting, setIsReporting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [waitlistForm, setWaitlistForm] = useState({ name: "", contact: "", email: "", preferredType: "Permanent", notes: "" });
  const [reviewData, setReviewData] = useState(null);
  const [transferApplicant, setTransferApplicant] = useState(null);
  
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null); 
  const [messagingRow, setMessagingRow] = useState(null);      
  const [archiveRow, setArchiveRow] = useState(null); 
  
  const [emailBody, setEmailBody] = useState("");             
  
  const [notifyDraft, setNotifyDraft] = useState({ 
    title: "", 
    message: "", 
    targetGroup: "All", 
    scheduleTime: "",
    templateApplied: false
  });

  const [notificationState, setNotificationState] = useState({ 
    isOpen: false, 
    type: '', 
    message: '', 
    autoClose: true,
    duration: 3000 
  }); 

 useEffect(() => {
    fetchTenants();
    fetchWaitlist();

    const interval = setInterval(() => {
        fetchTenants();
        fetchWaitlist();
    }, 5000); 

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (notificationState.isOpen && notificationState.autoClose) {
        const timerDuration = notificationState.duration || 3000;
        const timer = setTimeout(() => {
            setNotificationState({ isOpen: false, type: '', message: '', autoClose: true, duration: 3000 }); 
        }, timerDuration); 
        return () => clearTimeout(timer);
    }
  }, [notificationState.isOpen, notificationState.autoClose, notificationState.duration]); 

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${API_URL}/tenants`);
      if (!res.ok) throw new Error("Failed to fetch tenants");
      const data = await res.json();
      const formatted = data.map(d => ({ ...d, id: d._id || d.id }));
      formatted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRecords(formatted);
    } catch (err) {
      console.error("Error fetching tenants:", err);
    }
  };

 const fetchWaitlist = async () => {
    try {
      const res = await fetch(`${API_URL}/waitlist`);
      if (!res.ok) throw new Error("Failed to fetch waitlist");
      const data = await res.json();
      const formatted = data.map(d => ({ ...d, id: d._id || d.id }));
      const activeWaitlist = formatted.filter(app => app.status !== 'TENANT');
      setWaitlistData(activeWaitlist);
      if (reviewData) {
          const updatedRecord = activeWaitlist.find(r => r.id === reviewData.id);
          if (updatedRecord) setReviewData(updatedRecord);
      }
    } catch (err) {
      console.error("Error fetching waitlist:", err);
    }
  };

  useEffect(() => {
    const newAlerts = [];
    records.forEach(t => {
      if (t.DueDateTime) {
        const diff = Math.ceil((new Date(t.DueDateTime) - new Date()) / (1000 * 60 * 60 * 24));
        if (diff > 0 && diff <= 30) {
          newAlerts.push({ id: t.id, type: "renewal", msg: `Renewal Warning: ${t.tenantName} (Slot ${t.slotNo}) expires in ${diff} days.` });
        }
      }
    });
    setAlerts(newAlerts);
  }, [records]);

  // FILTERER & PAGINATION
  const filtered = records.filter((t) => {
    const name = t.tenantName || t.name || "";
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.referenceNo || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "permanent" ? (t.tenantType === "Permanent" || !t.tenantType) : t.tenantType === "Night Market"; 
    const matchesDate = !selectedDate || new Date(t.StartDateTime).toDateString() === new Date(selectedDate).toDateString(); 
    const matchesStatus = activeStatus === "All" || t.status.toLowerCase() === activeStatus.toLowerCase();
    return matchesSearch && matchesTab && matchesDate && matchesStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  // STATS CALCULATION
  const mapStats = useMemo(() => {
    let available = 0; let paid = 0; let revenue = 0;
    const SECTION_CAPACITY = 30; 
    for (let i = 0; i < SECTION_CAPACITY; i++) {
      let slotLabel = activeTab === "permanent" ? `A-${101 + i}` : `NM-${(i + 1).toString().padStart(2, '0')}`;
      const tenant = records.find(r => 
        (r.slotNo === slotLabel || r.slotno === slotLabel) && 
        (activeTab === "permanent" ? (r.tenantType === "Permanent" || !r.tenantType) : r.tenantType === "Night Market")
      );
      if (tenant && tenant.status !== "Available") {
        paid++;
        revenue += (parseFloat(tenant.rentAmount) || 0) + (parseFloat(tenant.utilityAmount) || 0);
      } else available++;
    }
    return { availableSlots: available, nonAvailableSlots: paid, totalSlots: SECTION_CAPACITY, totalRevenue: revenue };
  }, [records, activeTab]); 

  const handleSubmitReport = async () => {
    setIsReporting(true);
    try {
        const formattedData = filtered.map(t => ({
            "Slot": t.slotNo,
            "Name": t.tenantName || t.name,
            "Type": t.tenantType || "Permanent",
            "Contact": t.contactNo || "-",
            "Status": t.status,
            "Start Date": formatDate(t.StartDateTime),
            "Due Date": formatDate(t.DueDateTime || t.EndDateTime),
            "Rent": t.rentAmount || 0,
            "Utility": t.utilityAmount || 0,
            "Total Due": t.totalAmount || 0
        }));

        const reportPayload = {
            screen: "Tenant Lease Management",
            generatedDate: new Date().toLocaleString(),
            filters: {
                searchQuery,
                activeTab, 
                activeStatus,
                dateFilter: selectedDate || "None"
            },
            statistics: {
                totalRecords: records.length,
                displayedRecords: filtered.length,
                totalRevenue: mapStats.totalRevenue,
                occupancy: `${mapStats.nonAvailableSlots}/${mapStats.totalSlots}`
            },
            data: formattedData
        };

        const adminName = localStorage.getItem("authName") || (role === "lease" ? "Tenant Admin" : "Admin");
        await submitPageReport("Tenant Lease", reportPayload, adminName);
        await sendNotification(
            "Report Submitted: Tenant Lease", 
            `A Tenant Lease report was submitted by ${role === 'lease' ? 'Tenant Admin' : 'Admin'}.`,
            "Tenants",
            "superadmin" 
        );

        await logActivity(role, "SUBMIT_REPORT", "Submitted Tenant Lease Report", "Tenants");

        setNotificationState({ 
            isOpen: true, 
            type: 'success', 
            message: "Report submitted successfully!", 
            autoClose: true, 
            duration: 3000 
        });
        
        setShowSubmitModal(false);

    } catch (error) {
        console.error("Report Error:", error);
        setNotificationState({ 
            isOpen: true, 
            type: 'error', 
            message: "Failed to submit report.", 
            autoClose: true, 
            duration: 3000 
        });
    } finally {
        setIsReporting(false);
    }
  };

  const toggleSelectionMode = () => {
    if (isSelectionMode) setSelectedIds([]);
    setIsSelectionMode(!isSelectionMode);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = paginatedData.map(item => item.id);
      setSelectedIds(prev => [...new Set([...prev, ...ids])]);
    } else {
      const pageIds = paginatedData.map(item => item.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };
  
  const isAllSelected = paginatedData.length > 0 && paginatedData.every(item => selectedIds.includes(item.id));

  // BULK DELETE HANDLER (Lease Admin Only)
  const handleBulkDelete = async () => {
    const confirmMsg = `Request deletion for ${selectedIds.length} tenants?`;
    if (!window.confirm(confirmMsg)) return;

    try {
        if (role === "lease") {
            const requestPromises = selectedIds.map(async (id) => {
                const item = records.find(r => r.id === id);
                if (!item) return;

                return fetch("http://localhost:3000/api/deletion-requests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        itemType: "Tenant Lease",
                        itemDescription: `Slot ${item.slotNo} - ${item.tenantName || item.name}`,
                        requestedBy: "Tenant Admin",
                        originalData: item, 
                        reason: "Bulk deletion request"
                    })
                });
            });

             await sendNotification(
                "Deletion Request: Tenants", 
                `Tenant Admin has requested to delete ${selectedIds.length} tenant records.`,
                "Tenants",
                "superadmin" 
            );

            await Promise.all(requestPromises);
            await logActivity(role, "REQUEST_BULK_DELETE", `Requested deletion for ${selectedIds.length} tenants`, "Tenants");
            
            setNotificationState({ 
                isOpen: true, 
                type: 'success', 
                message: `Sent deletion requests for ${selectedIds.length} records. Superadmin notified.`,
                autoClose: true,
                duration: 3000
            });
            setSelectedIds([]);
            setIsSelectionMode(false);
        } 
    } catch (error) {
      console.error("Bulk action failed", error);
      setNotificationState({ 
        isOpen: true, 
        type: 'error', 
        message: "Failed to process some records.",
        autoClose: true,
        duration: 3000
      });
    }
  };

  const handleAddToWaitlist = async () => {
    if (!waitlistForm.name || !waitlistForm.contact) { 
        setNotificationState({ isOpen: true, type: 'error', message: "Please fill in Name and Contact.", autoClose: true, duration: 3000 });
        return; 
    }
    try {
        const payload = {
            ...waitlistForm,
            dateRequested: new Date().toISOString(),
            status: "Pending"
        };
        const response = await fetch(`${API_URL}/waitlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            setNotificationState({ isOpen: true, type: 'success', message: "Added to waitlist successfully!", autoClose: true, duration: 3000 });
            await logActivity(role, "ADD_WAITLIST", `Added ${waitlistForm.name} to waitlist`, "Tenants");
            fetchWaitlist();
            setWaitlistForm({ name: "", contact: "", email: "", preferredType: "Permanent", notes: "" });
            setShowWaitlistForm(false); 
        } else {
            setNotificationState({ isOpen: true, type: 'error', message: "Failed to add to waitlist", autoClose: true, duration: 3000 });
        }
    } catch (error) {
        console.error("Waitlist Error:", error);
        setNotificationState({ isOpen: true, type: 'error', message: "Server Error: Could not add to waitlist.", autoClose: true, duration: 3000 });
    }
  };

  const handleStartApproval = (applicant) => {
    setReviewData(applicant);
    setShowWaitlistModal(false);
    setShowReviewModal(true); 
  };

  const handleUnlockPayment = async () => {
    if (!reviewData?.id) return; 
    const idToUpdate = reviewData.id; 
    try {
        const response = await fetch(`${API_URL}/waitlist/${idToUpdate}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: "PAYMENT_UNLOCKED" })
        });
        if (response.ok) {
            setNotificationState({ isOpen: true, type: 'success', message: "Payment Unlocked! The applicant has been notified via email.", autoClose: true, duration: 3000 });
            await logActivity(role, "UNLOCK_PAYMENT", `Unlocked payment for waitlist applicant ID #${idToUpdate}`, "Tenants");
            setShowReviewModal(false);
            setShowWaitlistModal(true); 
            fetchWaitlist(); 
        } else {
            setNotificationState({ isOpen: true, type: 'error', message: "Failed to update status.", autoClose: true, duration: 3000 });
        }
    } catch (error) { 
        console.error("Error:", error); 
        setNotificationState({ isOpen: true, type: 'error', message: "Server Error: Could not unlock payment.", autoClose: true, duration: 3000 });
    }
  };

  const handleRequestContract = async () => {
    if (!reviewData?.id) return; 
    const idToUpdate = reviewData.id; 
    try {
        const response = await fetch(`${API_URL}/waitlist/${idToUpdate}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: "CONTRACT_PENDING" })
        });
        if (response.ok) {
            setNotificationState({ isOpen: true, type: 'success', message: "Status updated to Contract Pending. Applicant notified via email.", autoClose: true, duration: 3000 });
            await logActivity(role, "REQUEST_CONTRACT", `Requested contract for waitlist applicant ID #${idToUpdate}`, "Tenants");
            setShowReviewModal(false);
            setShowWaitlistModal(true); 
            fetchWaitlist(); 
        } else {
            setNotificationState({ isOpen: true, type: 'error', message: "Failed to update status.", autoClose: true, duration: 3000 });
        }
    } catch (error) { 
        console.error("Error:", error); 
        setNotificationState({ isOpen: true, type: 'error', message: "Server Error: Could not request contract.", autoClose: true, duration: 3000 });
    }
  };

  const handleProceedToLease = () => {
    setTransferApplicant(reviewData);
    setShowReviewModal(false);
    setShowAddModal(true);
  };

  const handleAddTenant = async (newTenant) => {
    try {
      const response = await fetch(`${API_URL}/tenants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newTenant, transferWaitlistId: transferApplicant?.id })
      });
      if (response.ok) {
          setShowAddModal(false);
          setNotificationState({ isOpen: true, type: 'success', message: "Tenant Added Successfully! Welcome email sent.", autoClose: true, duration: 3000 });
          await logActivity(role, "ADD_TENANT", `Added new tenant: ${newTenant.name}`, "Tenants");
          fetchTenants(); 
          fetchWaitlist(); 
          setTransferApplicant(null);
      } else {
          const err = await response.json();
          setNotificationState({ isOpen: true, type: 'error', message: `Error saving to database: ${err.error || 'Unknown error'}`, autoClose: true, duration: 3000 });
      }
    } catch (e) { 
        console.error(e); 
        setNotificationState({ isOpen: true, type: 'error', message: "Server Error: Could not save tenant.", autoClose: true, duration: 3000 });
    }
  };

  const handleRejectApplicant = async (id) => { 
    if(window.confirm("Are you sure you want to REJECT and DELETE this application?")) {
      try {
        const response = await fetch(`${API_URL}/waitlist/${id}`, { method: 'DELETE' }); 
        if (response.ok) {
            setNotificationState({ isOpen: true, type: 'success', message: "Application removed.", autoClose: true, duration: 3000 });
            await logActivity(role, "REJECT_APPLICANT", `Rejected/Deleted waitlist applicant ID #${id}`, "Tenants");
            fetchWaitlist(); 
            if(showReviewModal) setShowReviewModal(false);
        } else {
            setNotificationState({ isOpen: true, type: 'error', message: "Failed to delete application.", autoClose: true, duration: 3000 });
        }
      } catch (error) { 
          console.error(error); 
          setNotificationState({ isOpen: true, type: 'error', message: "Error removing application.", autoClose: true, duration: 3000 });
      }
    }
  };

  const confirmArchive = async () => {
    if (!archiveRow) return;
    const rowToArchive = archiveRow;
    setArchiveRow(null); 
    try {
      const idToDelete = rowToArchive._id || rowToArchive.id;
      if (!idToDelete) throw new Error("Record ID is missing.");
      const archiveRes = await fetch(ARCHIVE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Tenant Lease", 
          description: `Slot ${rowToArchive.slotNo} - ${rowToArchive.tenantName || rowToArchive.name}`,
          originalData: rowToArchive,
          archivedBy: role
        })
      });
      if (!archiveRes.ok) throw new Error("Failed to save to archive");
      const deleteRes = await fetch(`${API_URL}/tenants/${idToDelete}`, { method: "DELETE" });
      if (!deleteRes.ok) throw new Error("Failed to remove from active list");

      await logActivity(role, "ARCHIVE_TENANT", `Archived tenant: ${rowToArchive.tenantName || rowToArchive.name}`, "Tenants");

      setNotificationState({ 
        isOpen: true, 
        type: 'success', 
        message: "Tenant moved to Archives successfully.", 
        autoClose: true, 
        duration: 2000 
      });
      fetchTenants(); 
    } catch (e) {
      console.error("Failed to archive:", e);
      setNotificationState({ 
        isOpen: true, 
        type: 'error', 
        message: "Failed to archive record.", 
        autoClose: true, 
        duration: 2000 
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow?.id && !deleteRow?._id) return; 
    const idToDelete = deleteRow._id || deleteRow.id;
    try {
      const response = await fetch(`${API_URL}/tenants/${idToDelete}`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Failed to delete record.");
      
      await logActivity(role, "DELETE_TENANT", `Permanently deleted tenant ID #${idToDelete}`, "Tenants");
      setRecords(prev => prev.filter(item => (item._id || item.id) !== idToDelete));
      setDeleteRow(null);
      setNotificationState({ isOpen: true, type: 'success', message: "Record successfully deleted!", autoClose: true, duration: 3000 });
    } catch (e) { 
      console.error(e); 
      setNotificationState({ isOpen: true, type: 'error', message: `Error deleting record: ${e.message}`, autoClose: true, duration: 3000 });
    }
  };

  const handleBroadcast = async () => {
    let targetTenants = records;
    if (notifyDraft.targetGroup !== "All") {
        targetTenants = records.filter(t => t.tenantType === notifyDraft.targetGroup);
    }
    if (notifyDraft.templateApplied) {
        const today = new Date();
        const next5Days = new Date();
        next5Days.setDate(today.getDate() + 5);
        targetTenants = targetTenants.filter(t => {
            if (!t.DueDateTime) return false;
            const due = new Date(t.DueDateTime);
            return due >= today && due <= next5Days;
        });
        if (targetTenants.length === 0) {
            setNotificationState({ isOpen: true, type: 'error', message: "No tenants found with due dates in the next 5 days.", autoClose: true, duration: 3000 });
            return;
        }
    }
    const payload = {
        title: notifyDraft.title,
        message: notifyDraft.message,
        recipients: targetTenants.map(t => t.email).filter(Boolean),
        recipientIds: targetTenants.map(t => t.id),
        scheduleTime: notifyDraft.scheduleTime || null, 
        source: "Tenant Lease",
    };
    await logActivity(role, "BROADCAST_MSG", `Sent broadcast to ${targetTenants.length} tenants`, "Tenants");
    setShowNotify(false); 
    setNotifyDraft({ title: "", message: "", targetGroup: "All", scheduleTime: "", templateApplied: false }); 
    if (payload.scheduleTime) {
        setNotificationState({ isOpen: true, type: 'success', message: `Broadcast scheduled for ${new Date(payload.scheduleTime).toLocaleString()}`, autoClose: true, duration: 4000 });
    } else {
        setNotificationState({ isOpen: true, type: 'success', message: `Broadcast sent to ${targetTenants.length} tenants!`, autoClose: true, duration: 3000 });
    }
  };

  const getExportData = () => {
      return filtered.map(t => ({
          "Slot No": t.slotNo,
          "Ref No": t.referenceNo || t.referenceno || "-",
          "Tenant Name": t.tenantName || t.name,
          "Email": t.email || "-",
          "Contact No": t.contactNo || "-",
          "Start Date": formatDate(t.StartDateTime), 
          "Due Date": formatDate(t.DueDateTime || t.EndDateTime),
          "Rent Amount": t.rentAmount ? `₱${t.rentAmount}` : "0",
          "Utility Amount": t.utilityAmount ? `₱${t.utilityAmount}` : "0",
          "Total Due": t.totalAmount ? `₱${t.totalAmount}` : "0",
          "Status": t.status,
      }));
  };

  const handleExportExcel = () => {
    const data = getExportData();
    if (!data.length) {
        setNotificationState({ isOpen: true, type: 'error', message: "No records to export.", autoClose: true, duration: 3000 });
        return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tenants");
    XLSX.writeFile(workbook, `Tenant_List_${new Date().toISOString().split('T')[0]}.xlsx`);
    logActivity(role, "EXPORT_EXCEL", "Exported tenant list to Excel", "Tenants");
    setNotificationState({ isOpen: true, type: 'success', message: "Exported records to Excel.", autoClose: true, duration: 3000 });
  };

  const handleExportPDF = () => {
    const data = getExportData();
    if (!data.length) {
        setNotificationState({ isOpen: true, type: 'error', message: "No records to export.", autoClose: true, duration: 3000 });
        return;
    }
    const doc = new jsPDF();
    const tableColumn = Object.keys(data[0]);
    const tableRows = data.map(row => Object.values(row));
    doc.text("Tenant Management Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] } 
    });
    doc.save(`Tenant_List_${new Date().toISOString().split('T')[0]}.pdf`);
    logActivity(role, "EXPORT_PDF", "Exported tenant list to PDF", "Tenants");
    setNotificationState({ isOpen: true, type: 'success', message: "Exported records to PDF.", autoClose: true, duration: 3000 });
  };

  const tableColumns = isSelectionMode 
    ? [
        <div key="header-check" className="flex items-center">
            <input 
                type="checkbox" 
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
        </div>,
        "Slot No", "Ref No", "Name", "Email", "Contact No", "Start Date", "Due Date", "Rent", "Util", "Total Due", "Status"
      ]
    : ["Slot No", "Ref No", "Name", "Email", "Contact No", "Start Date", "Due Date", "Rent", "Util", "Total Due", "Status"];

  return (
    <Layout title="Tenants/Lease Management">
      <div className="mb-6">
        <StatCardGroup {...mapStats} />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full lg:w-auto">
    
          {(role === "lease" ) && (
            <button
                onClick={() => setShowSubmitModal(true)}
                disabled={isReporting}
                className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
                <FileText size={18} />
                <span className="hidden sm:inline">Submit Report</span>
            </button>
          )}

          <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 hover:scale-105 flex items-center justify-center cursor-pointer"
            title='Add New Tenant'> + Add New </button>
          {role === "superadmin" && (<button onClick={() => setShowNotify(true)} className="bg-white border border-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:border-slate-300 transition-all cursor-pointer"
            title='Notify All Tenants'> Notify All </button>)}
          
          <ExportMenu 
            onPrint={() => window.print()} 
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-emerald-100 rounded-xl p-1 border-2 border-emerald-200">
            <button onClick={() => setActiveTab("permanent")} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${activeTab === "permanent" ? "bg-white text-emerald-700 shadow-md" : "text-emerald-600 hover:text-emerald-700"}`}>
              <Store size={18} /> <span className="hidden sm:inline">Permanent</span>
            </button>
            <button onClick={() => setActiveTab("night")} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${activeTab === "night" ? "bg-white text-emerald-700 shadow-md" : "text-emerald-600 hover:text-emerald-700"}`}>
              <MoonStar size={18} /> <span className="hidden sm:inline">Night Market</span>
            </button>
          </div>
          <button onClick={() => setShowMapModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 font-medium text-sm shadow-sm transition-all cursor-pointer">
            <Map size={18} /> <span className="hidden sm:inline">View Map</span>
          </button>
          <button onClick={() => setShowWaitlistModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 font-medium text-sm shadow-sm transition-all cursor-pointer">
            <ClipboardList size={18} /> <span className="hidden sm:inline">Waitlist</span>
            {waitlistData.length > 0 && (<span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{waitlistData.length}</span>)}
          </button>
        </div>
        
        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <TenantStatusFilter activeStatus={activeStatus} onStatusChange={setActiveStatus} />
            {(role === "superadmin" || role === "lease") && (
                <button
                    onClick={() => setShowLogModal(true)}
                    className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-3 sm:px-4 h-10 rounded-xl shadow-sm hover:border-slate-300 transition-all"
                    title="View Logs"
                >
                    <History size={18} />
                    <span className="hidden sm:inline cursor-pointer">Logs</span>
                </button>
            )}

            {isSelectionMode && selectedIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    <span className="text-xs font-semibold text-slate-600 px-2 whitespace-nowrap">
                        {selectedIds.length} Selected
                    </span>
                    <button
                        onClick={handleBulkDelete}
                        title="Request Delete"
                        className="rounded-lg p-2 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-200 transition-all"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            )}

            {(role === "lease") && (
                <button
                    onClick={toggleSelectionMode}
                    title={isSelectionMode ? "Cancel Selection" : "Select Records"}
                    className={`flex items-center justify-center cursor-pointer h-10 w-10 sm:w-auto sm:px-3 rounded-xl transition-all border ${
                        isSelectionMode
                            ? "bg-red-500 text-white shadow-md"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                >
                    {isSelectionMode ? <X size={20} /> : <ListChecks size={20} />}
                </button>
            )}
        </div>
      </div>

      <Table
        columns={tableColumns}
        data={paginatedData.map((t) => {
            const baseData = {
                id: t.id,
                slotno: t.slotNo,
                refno: t.referenceNo || t.referenceno,
                name: t.tenantName || t.name,
                email: t.email,
                contactno: t.contactNo,
                startdate: formatDate(t.StartDateTime), 
                duedate: formatDate(t.DueDateTime || t.EndDateTime),
                rent: t.rentAmount ? `₱${t.rentAmount.toLocaleString()}` : "-",
                util: t.utilityAmount ? `₱${t.utilityAmount.toLocaleString()}` : "₱0",
                totaldue: t.totalAmount ? `₱${t.totalAmount.toLocaleString()}` : (t.rentAmount ? `₱${t.rentAmount.toLocaleString()}` : "-"),
                status: t.status,
            };

            if (isSelectionMode) {
                return {
                    select: (
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                                type="checkbox"
                                checked={selectedIds.includes(t.id)}
                                onChange={() => toggleSelect(t.id)}
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                        </div>
                    ),
                    ...baseData
                };
            }
            return baseData;
        })}
        actions={(row) => {
            if (isSelectionMode) return null;
            return (
              <div className="flex justify-end items-center space-x-2">
                <TableActions onView={() => setViewRow(records.find(r => r.id === row.id))} onEdit={() => setEditRow(records.find(r => r.id === row.id))} onDelete={() => setDeleteRow(records.find(r => r.id === row.id))} />
                <button onClick={() => generateRentStatementPDF(records.find(r => r.id === row.id))} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all cursor-pointer" title="Download Rent Statement"><Download size={16} /></button>
                <button onClick={() => { setMessagingRow(records.find(r => r.id === row.id)); setShowEmailModal(true); }} className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all cursor-pointer" title="Send Email"><Mail size={16} /></button>
                <button onClick={() => setArchiveRow(records.find(r => r.id === row.id))} className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all cursor-pointer" title="Archive Record"><Archive size={16} /></button>
                {(role === "superadmin") && (
                    <button onClick={() => setDeleteRow(records.find(r => r.id === row.id))} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer" title="Delete"><Trash2 size={16} /></button>
                )}
              </div>
            )
        }}
      />
      
      <Pagination 
        currentPage={currentPage} 
        totalPages={Math.ceil(filtered.length / itemsPerPage)} 
        onPageChange={setCurrentPage} 
        itemsPerPage={itemsPerPage} 
        totalItems={filtered.length} 
        onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }} 
      />
      
      <TenantViewModal viewRow={viewRow} onClose={() => setViewRow(null)} />
      <TenantMapModal isOpen={showMapModal} onClose={() => setShowMapModal(false)} activeTab={activeTab} records={records} onSelectSlot={(tenant) => setViewRow(tenant)} />
      <LogModal isOpen={showLogModal} onClose={() => setShowLogModal(false)} />

      <WaitlistModal 
        isOpen={showWaitlistModal} 
        onClose={() => setShowWaitlistModal(false)} 
        waitlistData={waitlistData} 
        showForm={showWaitlistForm} 
        setShowForm={setShowWaitlistForm} 
        formData={waitlistForm} 
        setFormData={setWaitlistForm} 
        onAdd={handleAddToWaitlist} 
        onApprove={handleStartApproval} 
        onReject={handleRejectApplicant} 
      />

      <TenantEmailModal 
        isOpen={showEmailModal} 
        onClose={() => setShowEmailModal(false)} 
        recipient={messagingRow} 
        body={emailBody} 
        setBody={setEmailBody} 
        onSend={() => { 
          setNotificationState({ isOpen: true, type: 'error', message: "Please use the automated email feature or implement backend logic.", autoClose: true, duration: 3000 });
          setShowEmailModal(false); 
        }} 
      />

      <ApplicationReviewModal 
        isOpen={showReviewModal}
        reviewData={reviewData}
        onClose={() => setShowReviewModal(false)}
        onBack={() => { setShowReviewModal(false); setShowWaitlistModal(true); }}
        onUnlockPayment={handleUnlockPayment}
        onRequestContract={handleRequestContract} 
        onProceedToLease={handleProceedToLease}
      />

      <AddTenantModal 
        isOpen={showAddModal} 
        onClose={() => { setShowAddModal(false); setTransferApplicant(null); }} 
        onSave={handleAddTenant} 
        tenants={records}
        initialData={transferApplicant ? {
          name: transferApplicant.name,
          contactNo: transferApplicant.contact,
          email: transferApplicant.email,
          tenantType: transferApplicant.floor || transferApplicant.preferredType || "Permanent",
          products: transferApplicant.product,
          uid: transferApplicant.uid,
          slotNo: transferApplicant.targetSlot || "", 
          referenceNo: transferApplicant.paymentReference || "", 
          documents: {
              businessPermit: transferApplicant.permitUrl,
              validID: transferApplicant.validIdUrl,
              barangayClearance: transferApplicant.clearanceUrl,
              proofOfReceipt: transferApplicant.receiptUrl,
              contract: transferApplicant.contractUrl 
          }
        } : null}
      />

      {editRow && (
        <EditTenantLease 
          row={editRow} 
          tenants={records} 
          onClose={() => setEditRow(null)} 
          onSave={async (updatedData) => { 
            try {
              const idToUpdate = updatedData._id || updatedData.id;
              if (!idToUpdate) {
                setNotificationState({ isOpen: true, type: 'error', message: "Error: No Tenant ID found to update.", autoClose: true, duration: 3000 });
                return;
              }
              const response = await fetch(`${API_URL}/tenants/${idToUpdate}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
              }); 
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Update failed");
              }
              setNotificationState({ isOpen: true, type: 'success', message: "Tenant updated successfully!", autoClose: true, duration: 3000 });
              await logActivity(role, "EDIT_TENANT", `Updated tenant details for ${updatedData.tenantName || updatedData.name}`, "Tenants");
              fetchTenants(); 
              setEditRow(null); 
            } catch (error) { 
              console.error("Update Error:", error); 
              setNotificationState({ isOpen: true, type: 'error', message: `Failed to update record: ${error.message}`, autoClose: true, duration: 3000 });
            }
          }}
        />
      )}
      
      <DeleteModal 
        isOpen={!!deleteRow} 
        onClose={() => setDeleteRow(null)} 
        onConfirm={handleDeleteConfirm} 
        title="Delete Record" 
        message="Are you sure you want to PERMANENTLY delete this record? Use Archive for soft deletion." 
        itemName={deleteRow ? `Slot #${deleteRow.slotNo} - ${deleteRow.tenantName || deleteRow.name}` : ""} 
      />

      <BroadcastModal 
        isOpen={showNotify} 
        onClose={() => setShowNotify(false)} 
        onBroadcast={handleBroadcast} 
        draft={notifyDraft} 
        setDraft={setNotifyDraft} 
        tenantCount={records.length}
      />

      {archiveRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl text-center">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Archive size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Confirm Archiving</h3>
                <p className="text-slate-600 mt-2 text-sm">
                    Are you sure you want to move <strong>{archiveRow.tenantName || archiveRow.name}</strong> to the Archives?
                    <br />
                    <span className="font-semibold text-xs text-red-500">
                        This will remove them from the active tenant list.
                    </span>
                </p>
                <div className="mt-6 flex gap-3">
                    <button onClick={() => setArchiveRow(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={confirmArchive} 
                        className="flex-1 py-2.5 bg-yellow-500 rounded-lg text-white font-medium hover:bg-yellow-600 shadow-lg transition-colors"
                    >
                        Yes, Archive
                    </button>
                </div>
            </div>
        </div>
      )}

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md cursor-pointer rounded-xl bg-white p-6 shadow-xl transform transition-all scale-100">
                <h3 className="text-lg font-bold text-slate-800">Submit Monthly Report</h3>
                <p className="mt-2 text-sm text-slate-600">
                    Are you sure you want to generate and submit the current Tenant Lease report?
                    <br />
                    <span className="text-emerald-600 font-semibold text-xs">
                        This will capture the current status of {filtered.length} records.
                    </span>
                </p>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={() => setShowSubmitModal(false)}
                        disabled={isReporting}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmitReport}
                        disabled={isReporting}
                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isReporting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Submitting...</span>
                            </>
                        ) : (
                            <span>Confirm Submit</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}
      
      {notificationState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 pointer-events-none">
            <div 
                className={`flex items-center gap-4 ${notificationState.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} 
                            text-white p-4 rounded-xl shadow-xl transition-all duration-300 transform 
                            animate-in fade-in slide-in-from-top-10 pointer-events-auto`}
                role="alert"
            >
                {notificationState.type === 'success' ? <CheckCircle size={32} /> : <X size={32} />}
                <div>
                    <h4 className="font-bold text-lg">{notificationState.type === 'success' ? 'Success!' : 'Error'}</h4>
                    <p className="text-sm">{notificationState.message}</p>
                </div>
                <button 
                    onClick={() => setNotificationState({ isOpen: false, type: '', message: '', autoClose: true, duration: 3000 })} 
                    className="p-1 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
      )}
    </Layout>
  );
};

export default TenantLease;