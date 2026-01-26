import React, { useState, useMemo, useEffect, useRef } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import StatCardGroupPark from "../components/parking/StatCardGroupPark";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import EditParking from "../components/parking/EditParking";
import DeleteModal from "../components/common/DeleteModal";
import ParkingFilter from "../components/parking/ParkingFilter";
import LogModal from "../components/common/LogModal"; 
import { submitPageReport } from "../utils/reportService.js"; 
import { logActivity } from "../utils/logger"; 
import { sendNotification } from "../utils/notificationService.js"; 
import { 
    Trash2, LogOut, Car, Bike, Archive, ArrowLeft, FileText, Loader2, 
    History, ListChecks, X, Pencil, CheckCircle 
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Parking = () => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeType, setActiveType] = useState("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // --- SELECTION STATE ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  // -----------------------

  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [logoutRow, setLogoutRow] = useState(null);
  const [archiveRow, setArchiveRow] = useState(null); // State for Archive Confirmation Modal

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [step, setStep] = useState(1);
  const plateInputRef = useRef(null);

  const [duplicateModal, setDuplicateModal] = useState({ isOpen: false, message: "" });
  
  // State for custom notifications (SUCCESS/ERROR) - ADDED duration
  const [notificationState, setNotificationState] = useState({ 
    isOpen: false, 
    type: '', 
    message: '', 
    autoClose: true,
    duration: 2000 // Default duration (2 seconds)
  }); 

  const [isReporting, setIsReporting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const role = localStorage.getItem("authRole") || "superadmin";
  const API_URL = "http://localhost:3000/api/parking";
  const ARCHIVE_URL = "http://localhost:3000/api/archives";

  const [newTicket, setNewTicket] = useState({
    ticketNo: "",
    type: "Car",
    plateNo: "",
    baseRate: 10,
    timeIn: "",
  });

  const existingPlates = useMemo(() => {
    return [...new Set(records.map(r => r.plateNo).filter(Boolean))];
  }, [records]);

  const existingTicketNumbers = useMemo(() => {
    return [...new Set(records.map(r => r.ticketNo).filter(Boolean))];
  }, [records]);

  const fetchParkingTickets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const formattedData = data.map(item => ({ ...item, id: item._id }));
      setRecords(formattedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchParkingTickets(); }, []);

  // -----------------------------------------------------------------
  // Auto-close Notification Effect (CONDITIONAL & DYNAMIC DURATION)
  // -----------------------------------------------------------------
  useEffect(() => {
    // Only auto-close if the notification is open AND autoClose is true
    if (notificationState.isOpen && notificationState.autoClose) {
      const timerDuration = notificationState.duration || 2000; // Use state duration or default

      const timer = setTimeout(() => {
        // Reset state back to defaults (3 seconds)
        setNotificationState({ isOpen: false, type: '', message: '', autoClose: true, duration: 2000 }); 
      }, timerDuration); 

      // Cleanup function to clear the timeout
      return () => clearTimeout(timer);
    }
  }, [notificationState.isOpen, notificationState.autoClose, notificationState.duration]); 
  // -----------------------------------------------------------------

  // --- UPDATED EDIT HANDLER FUNCTION ---
  const handleEditSave = async (updatedData) => {
    try {
        const payload = {
            type: updatedData.type,
            baseRate: updatedData.price,
            timeIn: updatedData.timein,
            timeOut: updatedData.timeout,
            duration: updatedData.duration,
            date: updatedData.date,
            status: updatedData.status,
        };

        const response = await fetch(`${API_URL}/${updatedData.id}`, { 
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update parking record.');
        }

        // --- SUCCESS MESSAGE POP-UP (3s duration) ---
        setNotificationState({ 
            isOpen: true, 
            type: 'success', 
            message: "Parking ticket updated successfully!", 
            autoClose: true, 
            duration: 2000 
        }); 
        // ------------------------------------------

        logActivity(role, "EDIT_TICKET", `Updated Parking Ticket ID #${updatedData.id}`, "Parking");
        
        await fetchParkingTickets(); 
        setEditRow(null); // Close the modal

    } catch (error) {
        console.error("Update Error:", error);
        // --- ERROR MESSAGE POP-UP (3s duration) ---
        setNotificationState({ 
            isOpen: true, 
            type: 'error', 
            message: `Error updating record: ${error.message}`, 
            autoClose: true, 
            duration: 2000 
        });
        // ----------------------------------------
    }
  };

  // --- Filtered & Paginated Data ---
  const filtered = records.filter(ticket => {
    const matchesSearch =
      (ticket.ticketNo && String(ticket.ticketNo).includes(searchQuery)) ||
      (ticket.plateNo && ticket.plateNo.toLowerCase().includes(searchQuery.toLowerCase()));
    const ticketDate = ticket.timeIn ? new Date(ticket.timeIn).toDateString() : "";
    const filterDate = selectedDate ? new Date(selectedDate).toDateString() : "";
    const matchesDate = !selectedDate || ticketDate === filterDate;
    const matchesType = activeType === "All" || ticket.type.toLowerCase() === activeType.toLowerCase();
    return matchesSearch && matchesType && matchesDate;
  });

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const carCount = filtered.filter(t => t.type === "Car").length;
  const motoCount = filtered.filter(t => t.type === "Motorcycle").length;
  const revenue = filtered.reduce((sum, t) => sum + (Number(t.finalPrice) || 0), 0);

  // --- 5. SELECTION HANDLERS ---
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

  // --- 6. BULK DELETE HANDLER ---
  const handleBulkDelete = async () => {
    const confirmMsg = role === "parking" 
        ? `Request deletion for ${selectedIds.length} records?` 
        : `Are you sure you want to permanently delete ${selectedIds.length} records?`;

    if (!window.confirm(confirmMsg)) return;

    setIsLoading(true);
    try {
        if (role === "parking") {
            const requestPromises = selectedIds.map(async (id) => {
                const item = records.find(r => r.id === id);
                if (!item) return;

                return fetch("http://localhost:3000/api/deletion-requests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        itemType: "Parking Ticket",
                        itemDescription: `Ticket #${item.ticketNo} - ${item.plateNo}`,
                        requestedBy: "Parking Admin",
                        originalData: item, 
                        reason: "Bulk deletion request"
                    })
                });
            });

             await sendNotification(
        "Deletion Request: Parking", 
        `Parking Admin has requested to delete ${selectedIds.length} parking records.`,
        "Parking",
        "superadmin" 
    );

            await Promise.all(requestPromises);
            await logActivity(role, "REQUEST_BULK_DELETE", `Requested deletion for ${selectedIds.length} parking tickets`, "Parking");
            
            // Notification Pop-up (3s duration)
            setNotificationState({ 
                isOpen: true, 
                type: 'success', 
                message: `Sent deletion requests for ${selectedIds.length} records. Superadmin notified.`,
                autoClose: true,
                duration: 2000
            });
            setSelectedIds([]);
            setIsSelectionMode(false);

        } else {
            // --- SUPERADMIN: IMMEDIATE DELETE ---
            const deletePromises = selectedIds.map(id => 
                fetch(`${API_URL}/${id}`, { method: "DELETE" })
            );
            
            await Promise.all(deletePromises);
            await logActivity(role, "BULK_DELETE", `Deleted ${selectedIds.length} parking tickets via bulk action`, "Parking");
            
            // Notification Pop-up (3s duration)
            setNotificationState({ 
                isOpen: true, 
                type: 'success', 
                message: `Successfully deleted ${selectedIds.length} records`,
                autoClose: true,
                duration: 2000
            });
            fetchParkingTickets();
            setSelectedIds([]);
            setIsSelectionMode(false);
        }

    } catch (error) {
      console.error("Bulk action failed", error);
      // Notification Pop-up (3s duration)
      setNotificationState({ 
        isOpen: true, 
        type: 'error', 
        message: "Failed to process some records.",
        autoClose: true,
        duration: 2000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers ---
  const handleAddClick = () => {
    const now = new Date();
    const formattedTimeIn = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
      .toISOString()
      .slice(0, 16);

    setNewTicket({
      ticketNo: "",
      type: "Car",
      plateNo: "",
      baseRate: 5, 
      timeIn: formattedTimeIn, 
    });
    setStep(1);
    setShowAddModal(true);
  };

  const handleSelectType = (type) => {
    const rate = type === "Car" ? 10 : 5;
    setNewTicket(prev => ({ ...prev, type, baseRate: rate }));
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setNewTicket(prev => ({ ...prev, type: "", plateNo: "", ticketNo: "" }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault(); 
    if (!newTicket.plateNo || !newTicket.ticketNo) {
      // Notification Pop-up (3s duration)
      setNotificationState({ 
        isOpen: true, 
        type: 'error', 
        message: "Please fill in both Ticket Number and Plate Number.",
        autoClose: true,
        duration: 2000
      });
      return;
    }

    const duplicateTicket = existingTicketNumbers.includes(newTicket.ticketNo);

    if (duplicateTicket) {
      setDuplicateModal({ isOpen: true, message: `Ticket Number #${newTicket.ticketNo} already exists!` });
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });
      if (response.ok) {
        const created = await response.json();
        await logActivity(role, "CREATE_TICKET", `Created Parking Ticket #${newTicket.ticketNo}`, "Parking");
        fetchParkingTickets();
        setShowAddModal(false);
        // Notification Pop-up (3s duration)
        setNotificationState({ 
            isOpen: true, 
            type: 'success', 
            message: `Parking Ticket #${newTicket.ticketNo} created successfully.`,
            autoClose: true,
            duration: 2000
        });
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      // Notification Pop-up (3s duration)
      setNotificationState({ 
        isOpen: true, 
        type: 'error', 
        message: "Failed to create ticket.",
        autoClose: true,
        duration: 2000
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    try {
      const response = await fetch(`${API_URL}/${deleteRow.id}`, { method: "DELETE" });
      if (response.ok) {
        await logActivity(role, "DELETE_TICKET", `Deleted Parking Ticket #${deleteRow.ticketNo}`, "Parking");
        setRecords(prev => prev.filter(r => r.id !== deleteRow.id));
        setDeleteRow(null);
        // Notification Pop-up (3s duration)
        setNotificationState({ 
            isOpen: true, 
            type: 'success', 
            message: `Parking Ticket #${deleteRow.ticketNo} deleted successfully.`,
            autoClose: true,
            duration: 2000
        });
      } else {
        // Notification Pop-up (3s duration)
        setNotificationState({ 
            isOpen: true, 
            type: 'error', 
            message: "Failed to delete record.",
            autoClose: true,
            duration: 2000
        });
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  // --- NEW: Function to open custom archive confirmation modal ---
  const handleArchive = (rowToArchive) => {
    setArchiveRow(rowToArchive); // Open the custom confirmation modal
  };

  // --- NEW: Function to execute archive after confirmation ---
  const confirmArchive = async () => {
    if (!archiveRow) return;
    const rowToArchive = archiveRow;
    setArchiveRow(null); // Close the confirmation modal

    try {
      const idToDelete = rowToArchive._id || rowToArchive.id;
      if (!idToDelete) throw new Error("Record ID is missing.");

      const archiveRes = await fetch(ARCHIVE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Parking",
          description: `Ticket #${rowToArchive.ticketNo} - ${rowToArchive.type}`,
          originalData: rowToArchive,
          archivedBy: role
        })
      });
      if (!archiveRes.ok) throw new Error("Failed to save to archive");

      const deleteRes = await fetch(`${API_URL}/${idToDelete}`, { method: "DELETE" });
      if (!deleteRes.ok) throw new Error("Failed to remove from active list");

      await logActivity(role, "ARCHIVE_TICKET", `Archived Parking Ticket #${rowToArchive.ticketNo}`, "Parking");
      setRecords(prev => prev.filter(r => r.id !== idToDelete));
      
      // Notification Pop-up (autoClose: TRUE, 1-SECOND DURATION)
      setNotificationState({ 
        isOpen: true, 
        type: 'success', 
        message: `Ticket #${rowToArchive.ticketNo} was successfully moved to Archives.`, 
        autoClose: true, 
        duration: 1000 // <-- 1 second duration as requested
      });
    } catch (e) {
      console.error("Failed to archive:", e);
      
      // Notification Pop-up (autoClose: TRUE, 1-SECOND DURATION)
      setNotificationState({ 
        isOpen: true, 
        type: 'error', 
        message: `Failed to archive Ticket #${rowToArchive.ticketNo}. Please check network connection.`,
        autoClose: true, 
        duration: 1000 // <-- 1 second duration as requested
      });
    }
  };

  const confirmLogout = async () => {
    if (!logoutRow) return;
    try {
      const response = await fetch(`${API_URL}/${logoutRow.id}/depart`, { method: "PUT", headers: { "Content-Type": "application/json" } });
      if (response.ok) {
        await logActivity(role, "VEHICLE_DEPART", `Vehicle Departed: Ticket #${logoutRow.ticketNo}`, "Parking");
        fetchParkingTickets();
        setLogoutRow(null);
        // Notification Pop-up (3s duration)
        setNotificationState({ 
            isOpen: true, 
            type: 'success', 
            message: `Vehicle departed. Total price calculated.`,
            autoClose: true,
            duration: 2000
        });
      }
    } catch (error) {
      console.error("Error logging out:", error);
      // Notification Pop-up (3s duration)
      setNotificationState({ 
        isOpen: true, 
        type: 'error', 
        message: "Failed to process departure.",
        autoClose: true,
        duration: 2000
      });
    }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "--/--";
    return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeOnly = (dateString) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSubmitReport = async () => {
    setIsReporting(true);
    try {
      const formatDateTime = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString('en-US', {
          year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
      };

      const formattedData = filtered.map(item => {
        const { createdAt, updatedAt, isArchived, __v, _id, ...rest } = item; 
        return {
          ...rest, 
          timeIn: formatDateTime(rest.timeIn),
          timeOut: rest.timeOut ? formatDateTime(rest.timeOut) : "Parked (Active)"
        };
      });

      const reportPayload = {
        screen: "Parking Management",
        generatedDate: new Date().toLocaleString(),
        filters: {
           searchQuery,
           selectedDate: selectedDate ? new Date(selectedDate).toLocaleDateString() : "None",
           activeType
        },
        statistics: {
            cars: carCount,
            motorcycles: motoCount,
            totalVehicles: filtered.length,
            totalRevenue: revenue
        },
        data: formattedData 
      };

      await submitPageReport("Parking", reportPayload, "Parking Admin");

      await fetch("http://localhost:3000/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Report Submitted: Parking Report",
          message: "A new Parking Management report has been generated and the active log has been cleared.",
          source: "Parking",
          targetRole: "superadmin" 
        }),
      });

      const deletePromises = filtered.map(item => 
          fetch(`${API_URL}/${item.id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      // Notification Pop-up (3s duration)
      setNotificationState({ 
        isOpen: true, 
        type: 'success', 
        message: "Report submitted successfully! The table has been cleared.",
        autoClose: true,
        duration: 2000
      });
      setShowSubmitModal(false);
      fetchParkingTickets();

    } catch (error) {
      console.error(error);
      // Notification Pop-up (3s duration)
      setNotificationState({ 
        isOpen: true, 
        type: 'error', 
        message: "Failed to submit report.",
        autoClose: true,
        duration: 2000
      });
    } finally {
      setIsReporting(false);
    }
  };

  const getBadgeStyles = () => {
    if (newTicket.type === 'Car') return "bg-blue-50 text-blue-600 border-blue-600";
    return "bg-orange-50 text-orange-500 border-orange-500";
  };

  const getExportData = (data) => {
    return data.map(item => ({
        "Ticket No": item.ticketNo || "-",
        "Plate No": item.plateNo || "-",
        "Type": item.type,
        "Fee/Hr": item.baseRate ? `₱${item.baseRate}` : "-",
        "Total": item.finalPrice ? `₱${item.finalPrice}` : "-",
        "Time In": item.timeIn ? formatDateDisplay(item.timeIn) : "-",
        "Time Out": item.timeOut ? formatDateDisplay(item.timeOut) : "-",
        "Duration": item.duration || "-",
        "Status": item.status
    }));
  };

  const exportToCSV = () => {
    if (filtered.length === 0) {
        // Notification Pop-up (3s duration)
        setNotificationState({ 
            isOpen: true, 
            type: 'error', 
            message: "No records to export.",
            autoClose: true,
            duration: 2000
        });
        return;
    }
    const dataToExport = getExportData(filtered);

    const headers = Object.keys(dataToExport[0]).join(',');
    const rows = dataToExport.map(row => 
        Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const csvContent = headers + '\n' + rows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `parking_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    logActivity(role, "EXPORT_CSV", `Exported ${dataToExport.length} Parking records to CSV`, "Parking");
    // Notification Pop-up (3s duration)
    setNotificationState({ 
        isOpen: true, 
        type: 'success', 
        message: `Exported ${dataToExport.length} records to CSV.`,
        autoClose: true,
        duration: 2000
    });
  };

  const exportToPDF = () => {
    if (filtered.length === 0) {
        // Notification Pop-up (3s duration)
        setNotificationState({ 
            isOpen: true, 
            type: 'error', 
            message: "No records to export.",
            autoClose: true,
            duration: 2000
        });
        return;
    }
    
    const dataToExport = getExportData(filtered);
    const headers = Object.keys(dataToExport[0]);
    const body = dataToExport.map(item => Object.values(item));

    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    doc.setFontSize(16);
    doc.setTextColor(34, 34, 34);
    doc.text("Parking Records Report", 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
        startY: 30,
        head: [headers],
        body: body,
        theme: 'grid',
        headStyles: { 
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            fontSize: 9, 
            halign: 'center'
        }, 
        styles: {
            fontSize: 8, 
            cellPadding: 3,
            valign: 'middle',
            textColor: [51, 51, 51]
        },
        alternateRowStyles: {
            fillColor: [240, 255, 240],
        }
    });

    const finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    doc.text(`Total Vehicles: ${filtered.length}`, 14, finalY + 10);
    doc.text(`Total Revenue: ₱${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 16);

    doc.save(`parking_records_${new Date().toISOString().split('T')[0]}.pdf`);
    
    logActivity(role, "EXPORT_PDF", `Exported ${dataToExport.length} Parking records to PDF`, "Parking");
    // Notification Pop-up (3s duration)
    setNotificationState({ 
        isOpen: true, 
        type: 'success', 
        message: `Exported ${dataToExport.length} records to PDF.`,
        autoClose: true,
        duration: 2000
    });
  };

  // --- 7. COLUMN CONFIG FOR SELECTION ---
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
        "Ticket No", "Plate No", "Type", "Fee/Hr", "Total", "Time In", "Time Out", "Duration", "Status"
      ]
    : ["Ticket No", "Plate No", "Type", "Fee/Hr", "Total", "Time In", "Time Out", "Duration", "Status"];

  return (
    <Layout title="Parking Management">
      <div className="mb-6">
        <StatCardGroupPark cars={carCount} motorcycles={motoCount} totalVehicles={filtered.length} totalRevenue={revenue} />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="flex items-center justify-end gap-3">
          
          {(role === "parking") && (
            <button 
                onClick={() => setShowSubmitModal(true)} 
                disabled={isReporting}
                className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all w-full sm:w-auto"
            >
              <FileText size={18} />
              <span>Submit Report</span>
            </button>
          )}

          <button onClick={handleAddClick} className="bg-gradient-to-r cursor-pointer from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
          title ='Add New Ticket' >
            + Add New
          </button>
          <ExportMenu onExportExcel={exportToCSV} onExportPDF={exportToPDF} />

        </div>
      </div>

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full mb-4">
        
        <ParkingFilter activeType={activeType} onTypeChange={setActiveType} />

        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <button
                onClick={() => setShowLogModal(true)}
                className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-4 h-[42px] rounded-xl shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
                title="View Logs"
            >
                <History size={18} />
                <span className="hidden sm:inline cursor-pointer">Logs</span>
            </button>

            {isSelectionMode && selectedIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    <span className="text-xs font-semibold text-slate-600 px-2 whitespace-nowrap">
                        {selectedIds.length} Selected
                    </span>
                    <button
                        onClick={handleBulkDelete}
                        title="Delete Selected"
                        className="rounded-lg p-2 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-200 transition-all"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            )}

            {(role == "parking") &&(<button
                onClick={toggleSelectionMode}
                title={isSelectionMode ? "Cancel Selection" : "Select Records"}
                className={`flex items-center justify-center h-10 w-10 sm:w-auto sm:px-3 cursor-pointer rounded-xl transition-all border ${
                    isSelectionMode
                        ? "bg-red-500 text-white shadow-md"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
            >
                {isSelectionMode ? <X size={20} /> : <ListChecks size={20} />}
            </button>)}
        </div>
    </div>


      

      {isLoading ? (
        <div className="text-center py-10">Loading tickets...</div>
      ) : (
        <>
          <Table
            columns={tableColumns}
            data={paginatedData.map(ticket => {
              const baseData = {
                id: ticket.id,
                ticketno: ticket.ticketNo ? `#${ticket.ticketNo}` : "---",
                plateno: ticket.plateNo || "---",
                type: ticket.type,
                "fee/hr": ticket.baseRate ? `₱${ticket.baseRate}` : "---",
                total: ticket.finalPrice ? `₱${ticket.finalPrice}` : "---",
                timein: formatTimeOnly(ticket.timeIn),
                timeout: ticket.timeOut ? formatTimeOnly(ticket.timeOut) : "---",
                duration: ticket.duration || "---",
                status: ticket.status
              };

              // Add Checkbox if in selection mode
              if (isSelectionMode) {
                  return {
                      select: (
                          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                              <input 
                                  type="checkbox"
                                  checked={selectedIds.includes(ticket.id)}
                                  onChange={() => toggleSelect(ticket.id)}
                                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                          </div>
                      ),
                      ...baseData
                  };
              }

              return baseData;
            })}
            actions={row => {
              const selectedRecord = records.find(r => r.id === row.id);
              return (
                <div className="flex justify-end items-center space-x-2">
                  {row.status === "Parked" && (
                    <button onClick={() => setLogoutRow(selectedRecord)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center gap-1 px-2">
                      <LogOut size={16} /> <span className="text-xs cursor-pointer font-medium">Depart</span>
                    </button>
                  )}
                  <TableActions
                    onView={() => setViewRow(selectedRecord)}
                    onEdit={() => setEditRow(selectedRecord)}
                  />
                  {/* Updated to use custom modal */}
                  <button onClick={() => handleArchive(selectedRecord)} className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 cursor-pointer hover:bg-yellow-100" title="Archive">
                    <Archive size={16} />
                  </button>
                  {(role == "superadmin") &&(<button onClick={() => setDeleteRow(selectedRecord)} className="p-1.5 rounded-lg bg-red-50 cursor-pointer text-red-600 hover:bg-red-100" title="Delete">
                    <Trash2 size={16} />
                  </button>)}
                </div>
              );
            }}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filtered.length}
            onItemsPerPageChange={setItemsPerPage}
          />
        </>
      )}

      {/* --- RENDER EDIT MODAL --- */}
      {editRow && (
        <EditParking
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={handleEditSave}
        />
      )}
      {/* ------------------------- */}

      {/* --- 9. LOG MODAL --- */}
      <LogModal 
        isOpen={showLogModal} 
        onClose={() => setShowLogModal(false)} 
      />
      {/* -------------------- */}

      {/* NEW: ARCHIVE CONFIRMATION MODAL (Improved UI) */}
      {archiveRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl text-center">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Archive size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Confirm Archiving</h3>
                <p className="text-slate-600 mt-2 text-sm">
                    Are you sure you want to move Ticket <strong>#{archiveRow.ticketNo}</strong> to the Archives?
                    <br />
                    <span className="font-semibold text-xs text-red-500">
                        This item will be permanently removed from the active parking list.
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
      {/* END ARCHIVE CONFIRMATION MODAL */}


      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[600px] rounded-3xl shadow-2xl p-8 md:p-10 text-center transition-all duration-300 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors">✕</button>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              {step === 1 ? "Select Vehicle" : "Enter Details"}
            </h1>
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in duration-300">
                <button onClick={() => handleSelectType('Car')} className="h-[220px] w-full flex flex-col items-center justify-center rounded-[20px] border-[3px] border-cyan-500 bg-cyan-50 text-cyan-600 cursor-pointer transition-transform active:scale-95 hover:shadow-lg hover:-translate-y-1">
                  <Car size={80} className="mb-4" />
                  <span className="text-2xl font-bold mt-2">CAR / JEEP</span>
                  <span className="text-sm opacity-70 mt-1 font-medium">₱10.00 / hr</span>
                </button>
                <button onClick={() => handleSelectType('Motorcycle')} className="h-[220px] w-full flex flex-col items-center justify-center rounded-[20px] border-[3px] border-red-500 bg-red-50 text-red-500 cursor-pointer transition-transform active:scale-95 hover:shadow-lg hover:-translate-y-1">
                  <Bike size={80} className="mb-4" />
                  <span className="text-2xl font-bold mt-2">MOTORCYCLE</span>
                  <span className="text-sm opacity-70 mt-1 font-medium">₱5.00 / hr</span>
                </button>
              </div>
            )}
            {step === 2 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div>
                  <span className={`inline-block px-6 py-3 rounded-full text-lg font-bold border-2 ${getBadgeStyles()}`}>
                    Selected: {newTicket.type === 'Car' ? 'Car / Bus' : 'Motorcycle'}
                  </span>
                </div>
                <div className="text-left">
                  <label className="block text-gray-500 text-lg font-semibold mb-2 ml-1">Plate Number</label>
                  <input
                    ref={plateInputRef}
                    type="text"
                    list="plate-options"
                    placeholder="ABC 123"
                    required
                    value={newTicket.plateNo}
                    onChange={(e) => setNewTicket({...newTicket, plateNo: e.target.value.toUpperCase()})}
                    className="w-full p-5 text-2xl border-2 border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-600 outline-none transition-colors uppercase"
                  />
                  <datalist id="plate-options">
                    {existingPlates.map((plate, index) => (<option key={index} value={plate} />))}
                  </datalist>
                </div>
                <div className="text-left">
                  <label className="block text-gray-500 text-lg font-semibold mb-2 ml-1">Ticket Number</label>
                  <input
                    type="number"
                    placeholder="001"
                    required
                    value={newTicket.ticketNo}
                    onChange={(e) => setNewTicket({...newTicket, ticketNo: e.target.value})}
                    className="w-full p-5 text-2xl border-2 border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-600 outline-none transition-colors"
                  />
                </div>
                <div className="flex gap-4 mt-2">
                  <button onClick={handleBack} className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-500 border-2 border-gray-300 text-xl font-bold rounded-xl hover:bg-gray-50 transition-colors py-3">
                    <ArrowLeft size={24} /> Back
                  </button>
                  <button onClick={handleCreateTicket} className="flex-[2] bg-emerald-500 text-white text-xl font-bold rounded-xl hover:bg-emerald-600 active:scale-95 transition-all shadow-md hover:shadow-lg py-3">
                    ENTER TICKET
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {duplicateModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl text-center">
            <h3 className="text-lg font-bold text-red-600 mb-2">Duplicate Entry</h3>
            <p className="text-slate-700 mb-6">{duplicateModal.message}</p>
            <button
              onClick={() => setDuplicateModal({ isOpen: false, message: "" })}
              className="px-5 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {logoutRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Confirm Departure</h3>
            <p className="text-slate-600 mt-2 text-sm">
              Ticket <strong>{logoutRow.ticketNo}</strong> is leaving.<br />
              The system will calculate the total price based on duration.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setLogoutRow(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium">Cancel</button>
              <button onClick={confirmLogout} className="flex-1 py-2.5 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 shadow-lg">Process Payment</button>
            </div>
          </div>
        </div>
      )}

      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-base font-semibold text-slate-800">View Parking Ticket</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <Field label="Ticket No" value={viewRow.ticketNo || "N/A"} />
              <Field label="Plate No" value={viewRow.plateNo || "N/A"} />
              <Field label="Type" value={viewRow.type} />
              <Field label="Base Rate" value={viewRow.baseRate ? `₱${viewRow.baseRate}` : "N/A"} />
              <Field label="Final Price" value={viewRow.finalPrice ? `₱${viewRow.finalPrice}` : "Pending"} />
              <Field label="Time In" value={formatDateDisplay(viewRow.timeIn)} />
              <Field label="Time Out" value={formatDateDisplay(viewRow.timeOut)} />
              <Field label="Duration" value={viewRow.duration} />
              <Field label="Status" value={viewRow.status} />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">Close</button>
            </div>
          </div>
        </div>
      )}

      <DeleteModal
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Record"
        message="Are you sure you want to permanently remove this record?"
        itemName={deleteRow ? (deleteRow.ticketNo ? `Ticket #${deleteRow.ticketNo}` : "this item") : ""}
      />

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl transform transition-all scale-100">
                <h3 className="text-lg font-bold text-slate-800">Submit Report</h3>
                <p className="mt-2 text-sm text-slate-600">
                    Are you sure you want to capture and submit the current parking report?
                    <br />
                    <span className="text-red-500 font-semibold text-xs">
                        Note: This will clear the current table for new entries.
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
      
      {/* Status Pop-up Component (For both dynamic duration notifications) */}
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
                    onClick={() => setNotificationState({ isOpen: false, type: '', message: '', autoClose: true, duration: 2000 })} 
                    className="p-1 rounded-full text-white/80 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
      )}

    </Layout>
  );
};

export default Parking;