import React, { useState, useMemo, useEffect } from "react";
import emailjs from '@emailjs/browser';
import * as XLSX from 'xlsx'; // ADDED: Excel Library
import jsPDF from 'jspdf'; // ADDED: PDF Library
import autoTable from "jspdf-autotable"; // ADDED: PDF Table Plugin
import { 
    Trash2, Mail, Download, Store, MoonStar, Map, NotebookPen, // MODIFIED: Replaced Archive with NotebookPen for Remarks
    ClipboardList, CheckCircle, X // ADDED: For Notification Pop-up
} from "lucide-react";

// Layout & Components
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import StatCardGroup from "../components/tenants/StatCardGroup";
import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";

// Modals
import EditTenantLease from "../components/tenants/EditTenantLease";
import DeleteModal from "../components/common/DeleteModal";
import TenantStatusFilter from "../components/tenants/TenantStatusFilter"; 
import AddTenantModal from "../components/tenants/modals/AddTenantModal"; 
import TenantViewModal from "../components/tenants/modals/TenantViewModal";
import TenantMapModal from "../components/tenants/modals/TenantMapModal";
import WaitlistModal from "../components/tenants/modals/WaitlistModal";
import TenantEmailModal from "../components/tenants/modals/TenantEmailModal";
import ApplicationReviewModal from "../components/tenants/modals/ApplicationReviewModal";
import BroadcastModal from "../components/tenants/modals/BroadcastModal";
import RemarksModal from "../components/tenants/modals/RemarksModal";

import { generateRentStatementPDF } from "../utils/tenantUtils";

const API_URL = "http://localhost:3000/api";

const TenantLease = () => {

  // --- STATE MANAGEMENT ---
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

  // Modal Visibility States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotify, setShowNotify] = useState(false); 
  const [showMapModal, setShowMapModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false); 
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false); 

  // Data States
  const [waitlistForm, setWaitlistForm] = useState({ name: "", contact: "", email: "", preferredType: "Permanent", notes: "" });
  const [reviewData, setReviewData] = useState(null);
  const [transferApplicant, setTransferApplicant] = useState(null);
  
  // Row Actions States
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null); 
  const [remarksRow, setRemarksRow] = useState(null);
  const [messagingRow, setMessagingRow] = useState(null);      
  
  const [emailBody, setEmailBody] = useState("");             
  const [notifyDraft, setNotifyDraft] = useState({ title: "", message: "" });
  const [remarksText, setRemarksText] = useState("");

  // State for custom notifications (SUCCESS/ERROR) - ADDED duration
  const [notificationState, setNotificationState] = useState({ 
    isOpen: false, 
    type: '', 
    message: '', 
    autoClose: true,
    duration: 3000 // Default duration (3 seconds)
  }); 

  // --- DATA FETCHING ---
 useEffect(() => {
    // 1. Initial Fetch
    fetchTenants();
    fetchWaitlist();

    // 2. Set up Auto-Refresh (Polling) every 5 seconds
    const interval = setInterval(() => {
        fetchTenants();
        fetchWaitlist();
    }, 5000); // 5000ms = 5 seconds

    // 3. Cleanup on unmount (prevents memory leaks)
    return () => clearInterval(interval);
  }, []);

  // --- Auto-close Notification Effect (CONDITIONAL & DYNAMIC DURATION) ---
  useEffect(() => {
    // Only auto-close if the notification is open AND autoClose is true
    if (notificationState.isOpen && notificationState.autoClose) {
        const timerDuration = notificationState.duration || 3000; // Use state duration or default

        const timer = setTimeout(() => {
            // Reset state back to defaults (3 seconds)
            setNotificationState({ isOpen: false, type: '', message: '', autoClose: true, duration: 3000 }); 
        }, timerDuration); 

        // Cleanup function to clear the timeout
        return () => clearTimeout(timer);
    }
  }, [notificationState.isOpen, notificationState.autoClose, notificationState.duration]); 
  // -----------------------------------------------------------------


  const fetchTenants = async () => {
    try {
      const res = await fetch(`${API_URL}/tenants`);
      if (!res.ok) throw new Error("Failed to fetch tenants");
      const data = await res.json();
      const formatted = data.map(d => ({ ...d, id: d._id || d.id }));
      // Sort newest first
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

      // --- ADD THIS BLOCK ---
      // If the admin is currently viewing an application, update it live!
      if (reviewData) {
          const updatedRecord = activeWaitlist.find(r => r.id === reviewData.id);
          if (updatedRecord) {
              setReviewData(updatedRecord);
          }
      }
      // ----------------------

    } catch (err) {
      console.error("Error fetching waitlist:", err);
    }
  };

  // --- ALERTS LOGIC ---
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

  // --- STATS CALCULATION ---
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

  // --- HANDLERS ---

  // 1. Manual Waitlist Add
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

  // 2. Unlock Payment (Step 3)
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

  // 3. Request Contract (Step 7 - Permanent)
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

  // 4. Prepare for Final Approval
  const handleProceedToLease = () => {
    setTransferApplicant(reviewData);
    setShowReviewModal(false);
    setShowAddModal(true);
  };

  // 5. Add Tenant & Send Welcome Email (Step 9)
  const handleAddTenant = async (newTenant) => {
    try {
      const response = await fetch(`${API_URL}/tenants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              ...newTenant,
              transferWaitlistId: transferApplicant?.id 
          })
      });

      if (response.ok) {
          setShowAddModal(false);
          setNotificationState({ isOpen: true, type: 'success', message: "Tenant Added Successfully! Welcome email sent.", autoClose: true, duration: 3000 });
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

  const handleDeleteConfirm = async () => {
    if (!deleteRow?.id && !deleteRow?._id) return; 
    const idToDelete = deleteRow._id || deleteRow.id;

    try {
      const response = await fetch(`${API_URL}/tenants/${idToDelete}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error("Failed to delete record.");
      }
      setRecords(prev => prev.filter(item => (item._id || item.id) !== idToDelete));
      setDeleteRow(null);
      setNotificationState({ isOpen: true, type: 'success', message: "Record successfully deleted!", autoClose: true, duration: 3000 });
    } catch (e) { 
      console.error(e); 
      setNotificationState({ isOpen: true, type: 'error', message: `Error deleting record: ${e.message}`, autoClose: true, duration: 3000 });
    }
  };

  const handleSaveRemarks = () => {
    const storedRemarks = localStorage.getItem("ibt_tenantRemarks"); 
    const remarks = storedRemarks ? JSON.parse(storedRemarks) : {}; 
    remarks[remarksRow.id] = remarksText; 
    localStorage.setItem("ibt_tenantRemarks", JSON.stringify(remarks)); 
    setRemarksRow(null); 
    setNotificationState({ isOpen: true, type: 'success', message: "Remarks saved successfully.", autoClose: true, duration: 3000 });
  };
  
  const handleBroadcast = () => {
    setShowNotify(false); 
    setNotifyDraft({ title: "", message: "" }); 
    setNotificationState({ isOpen: true, type: 'success', message: "Notification broadcasted successfully!", autoClose: true, duration: 3000 });
  };

  // --- FILTERING ---
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
      month: 'numeric', 
      day: 'numeric', 
      year: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  // --- ADDED: EXPORT LOGIC ---

  const getExportData = () => {
      // Use the filtered data to ensure what the user sees is what gets exported
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

    // FIX APPLIED: Using autoTable(doc, options)
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] } // Emerald green matches your theme
    });

    doc.save(`Tenant_List_${new Date().toISOString().split('T')[0]}.pdf`);
    setNotificationState({ isOpen: true, type: 'success', message: "Exported records to PDF.", autoClose: true, duration: 3000 });
  };

  // ---------------------------

  return (
    <Layout title="Tenants/Lease Management">
      
      {/* 1. Statistics Cards */}
      <div className="mb-6">
        <StatCardGroup {...mapStats} />
      </div>

      {/* 2. Filter & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full lg:w-auto">
          <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 hover:scale-105 flex items-center justify-center cursor-pointer"> + Add New </button>
          {role === "superadmin" && (<button onClick={() => setShowNotify(true)} className="bg-white border border-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:border-slate-300 transition-all cursor-pointer"> Notify All </button>)}
          
          {/* UPDATED: Export Menu with new handlers */}
          <ExportMenu 
            onPrint={() => window.print()} 
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
          />

        </div>
      </div>

      {/* 3. Tabs & Status Filters */}
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
        <TenantStatusFilter activeStatus={activeStatus} onStatusChange={setActiveStatus} />
      </div>

      {/* 4. Table */}
      <Table
        columns={["Slot No", "Ref No", "Name", "Email", "Contact No", "Start Date", "Due Date", "Rent", "Util", "Total Due", "Status"]}
        data={paginatedData.map((t) => ({
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
        }))}

        actions={(row) => (
          <div className="flex justify-end items-center space-x-2">
            <TableActions onView={() => setViewRow(records.find(r => r.id === row.id))} onEdit={() => setEditRow(records.find(r => r.id === row.id))} onDelete={() => setDeleteRow(records.find(r => r.id === row.id))} />
            <button onClick={() => generateRentStatementPDF(records.find(r => r.id === row.id))} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all cursor-pointer" title="Download Rent Statement"><Download size={16} /></button>
            <button onClick={() => { setMessagingRow(records.find(r => r.id === row.id)); setShowEmailModal(true); }} className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all cursor-pointer" title="Send Email"><Mail size={16} /></button>
            {/* UPDATED: Changed icon from Archive to NotebookPen */}
            <button onClick={() => { setRemarksRow(records.find(r => r.id === row.id)); setRemarksText(""); }} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all cursor-pointer" title="Add Remarks"><NotebookPen size={16} /></button>
            <button onClick={() => setDeleteRow(records.find(r => r.id === row.id))} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer" title="Delete"><Trash2 size={16} /></button>
          </div>
        )}
      />
      
      <Pagination 
        currentPage={currentPage} 
        totalPages={Math.ceil(filtered.length / itemsPerPage)} 
        onPageChange={setCurrentPage} 
        itemsPerPage={itemsPerPage} 
        totalItems={filtered.length} 
        onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }} 
      />
      
      {/* --- MODALS --- */}

      {/* View Details */}
      <TenantViewModal viewRow={viewRow} onClose={() => setViewRow(null)} />
      
      {/* Map View */}
      <TenantMapModal isOpen={showMapModal} onClose={() => setShowMapModal(false)} activeTab={activeTab} records={records} onSelectSlot={(tenant) => setViewRow(tenant)} />

      {/* Waitlist (Applications) */}
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

      {/* Manual Email */}
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

      {/* Application Review (The Main Flow) */}
      <ApplicationReviewModal 
        isOpen={showReviewModal}
        reviewData={reviewData}
        onClose={() => setShowReviewModal(false)}
        onBack={() => { setShowReviewModal(false); setShowWaitlistModal(true); }}
        onUnlockPayment={handleUnlockPayment}
        onRequestContract={handleRequestContract} // <--- Passed Correctly
        onProceedToLease={handleProceedToLease}
      />

      {/* Add New Tenant */}
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
              contract: transferApplicant.contractUrl // Pass contract if exists
          }
        } : null}
      />

      {/* Edit Tenant */}
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
              fetchTenants(); 
              setEditRow(null); 
            } catch (error) { 
              console.error("Update Error:", error); 
              setNotificationState({ isOpen: true, type: 'error', message: `Failed to update record: ${error.message}`, autoClose: true, duration: 3000 });
            }
          }}
        />
      )}
      
      {/* Delete Confirmation */}
      <DeleteModal 
        isOpen={!!deleteRow} 
        onClose={() => setDeleteRow(null)} 
        onConfirm={handleDeleteConfirm} 
        title="Delete Record" 
        message="Are you sure you want to PERMANENTLY delete this record? Use Archive for soft deletion." 
        itemName={deleteRow ? `Slot #${deleteRow.slotNo} - ${deleteRow.tenantName || deleteRow.name}` : ""} 
      />

      {/* Remarks */}
      <RemarksModal 
        isOpen={!!remarksRow} 
        onClose={() => setRemarksRow(null)} 
        onSave={handleSaveRemarks} 
        remarksText={remarksText} 
        setRemarksText={setRemarksText} 
      />

      {/* Broadcast Notification */}
      <BroadcastModal 
        isOpen={showNotify} 
        onClose={() => setShowNotify(false)} 
        onBroadcast={handleBroadcast} 
        draft={notifyDraft} 
        setDraft={setNotifyDraft} 
      />
      
      {/* Status Pop-up Component (For dynamic duration notifications) */}
      {notificationState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 pointer-events-none">
            <div 
                className={`flex items-center gap-4 ${notificationState.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} 
                            text-white p-4 rounded-xl shadow-xl transition-all duration-300 transform 
                            animate-in fade-in slide-in-from-top-10 pointer-events-auto`}
                role="alert"
            >
                {notificationState.type === 'success' 
                    ? <CheckCircle size={32} /> 
                    : <X size={32} />
                }
                <div>
                    <h4 className="font-bold text-lg">{notificationState.type === 'success' ? 'Success!' : 'Error'}</h4>
                    <p className="text-sm">{notificationState.message}</p>
                </div>
                {/* Manual close button, visible for all notifications */}
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