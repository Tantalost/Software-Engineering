import React, { useState, useMemo, useEffect } from "react";
// 1. IMPORT SETTINGS ICON
import { Archive, Trash2, Plus, X, CheckCircle, Loader2, History, ListChecks, FileText, Settings } from "lucide-react"; 
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";

import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";

import ViewModal from "../components/common/ViewModal";
import DeleteModal from "../components/common/DeleteModal"; 
import LogModal from "../components/common/LogModal"; 
import SecurityCheckModal from "../components/common/SecurityCheckModal"; 
import RequestDeletionModal from "../components/common/RequestDeletionModal"; 
import StatCardGroupTerminal from "../components/terminal/StatCardGroupTerminal";
import TerminalFilter from "../components/terminal/TerminalFilter";
import { logActivity } from "../utils/logger";
import { submitPageReport } from "../utils/reportService"; 

const API_URL = "http://localhost:3000/api";

const getInitialBasePrices = () => {
    const storedPrices = localStorage.getItem("terminalBasePrices");
    if (storedPrices) {
      try {
        // Use JSON.parse to retrieve the object from storage
        return JSON.parse(storedPrices);
      } catch (e) {
        console.error("Error parsing base prices from localStorage", e);
        // Fallback to default in case of corruption
      }
    }
    // Default values if nothing is in localStorage or if parsing fails
    return {
      regular: 15.00,
      discounted: 10.00 // Student, Senior, PWD
    };
};

const TerminalFees = () => {
  const role = localStorage.getItem("authRole") || "superadmin"; 
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [archiveRow, setArchiveRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false); 
  
  // FIX: Added missing state for Price Modal
  const [showPriceModal, setShowPriceModal] = useState(false);

  const [basePrices, setBasePrices] = useState(getInitialBasePrices);
   
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingEdit, setPendingEdit] = useState(null); 
  const [confirmAction, setConfirmAction] = useState(null); 
  const [deleteRemarks, setDeleteRemarks] = useState(""); 
  const [toast, setToast] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [newTicket, setNewTicket] = useState({
    ticketNo: "",
    passengerType: "Regular", 
    price: 15.00,
    date: "",
    time: ""
  });

  const fetchFees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/terminal-fees`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error("Error fetching fees:", err);
      showToastMessage("Error loading data from server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);


   const [modalPrices, setModalPrices] = useState({
      regular: 15.00,
      discounted: 10.00 
  });

   useEffect(() => {
    // This runs on mount (to read from basePrices), and after every update via setBasePrices
    localStorage.setItem("terminalBasePrices", JSON.stringify(basePrices));
  }, [basePrices]);


  // Input handler for modal price, using string to fix "01" issue
  const handleModalPriceChange = (key, value) => {
      // 1. Allow empty string
      if (value === "") {
          setModalPrices(prev => ({ ...prev, [key]: "" }));
          return;
      }

      // 2. Check for valid numeric/decimal input structure (allow "15", "15.", ".5", "15.50")
      const regex = /^\d*\.?\d*$/;
      if (!regex.test(value)) {
          // Ignore invalid input (like letters or multiple decimals)
          return;
      }

      // 3. FIX: Strip leading zero if it's immediately followed by a digit (e.g., "01" -> "1"), 
      // but keep it for decimals (e.g., "0.5").
      if (value.length > 1 && value.startsWith("0") && value[1] !== '.') {
          value = value.substring(1); 
      }
      
      // 4. Update local state as a string
      setModalPrices(prev => ({ ...prev, [key]: value }));
  };
  
  // Function to commit changes from modal local state to global basePrices state
  const handleSaveBasePrices = () => {
      const newPrices = {};
      let hasError = false;

      for (const key in modalPrices) {
          const priceString = String(modalPrices[key]);
          
          // Treat empty string or just a decimal point as 0.00
          if (priceString === "" || priceString === ".") {
              newPrices[key] = 0.00;
          } else {
              const numValue = parseFloat(priceString);
              
              if (isNaN(numValue) || numValue < 0) {
                  showToastMessage("Error: Price must be a valid non-negative number.");
                  hasError = true;
                  break;
              }
              // Commit rounded value (optional, but good practice for currency)
              newPrices[key] = parseFloat(numValue.toFixed(2)); 
          }
      }

      if (!hasError) {
          setBasePrices(newPrices); // Commit to parent state (triggers useEffect to save to localStorage)
          setShowPriceModal(false);
          showToastMessage("Base prices updated successfully!");
      }
  };
  
  // Function to open modal and sync local state
  const handleOpenPriceModal = () => {
      // Set modalPrices to the string version of basePrices for input fields to work correctly with decimals
      // Use toFixed(2) to ensure the decimal point is present for editing if the number is an integer
      setModalPrices({
          regular: basePrices.regular.toFixed(2),
          discounted: basePrices.discounted.toFixed(2)
      });
      setShowPriceModal(true);
  };

  const filtered = useMemo(() => {
    return records.filter((fee) => {
      const pType = (fee.passengerType || "").toLowerCase();
      const aType = activeType.toLowerCase();
      const matchesSearch = pType.includes(searchQuery.toLowerCase());
      const matchesDate = selectedDate ? new Date(fee.date).toDateString() === new Date(selectedDate).toDateString() : true;
      
      let matchesType = false;
      if (aType === "all") {
        matchesType = true;
      } else if (aType.includes("senior") || aType.includes("pwd")) {
        matchesType = pType.includes("senior") || pType.includes("pwd");
      } else {
        matchesType = pType.includes(aType);
      }

      return matchesSearch && matchesDate && matchesType;
    });
  }, [records, searchQuery, selectedDate, activeType]);

  const stats = useMemo(() => ({
    regular: filtered.filter(f => (f.passengerType || "").toLowerCase().includes("regular")).length,
    student: filtered.filter(f => (f.passengerType || "").toLowerCase().includes("student")).length,
    senior: filtered.filter(f => {
      const type = (f.passengerType || "").toLowerCase();
      return type.includes("senior") || type.includes("pwd");
    }).length,
    total: filtered.length,
    revenue: filtered.reduce((sum, f) => sum + (f.price || 0), 0)
  }), [filtered]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const toggleSelectionMode = () => {
    if (isSelectionMode) {
        setSelectedIds([]); 
    }
    setIsSelectionMode(!isSelectionMode);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = paginatedData.map(item => item._id || item.id);
      setSelectedIds(prev => [...new Set([...prev, ...ids])]);
    } else {
        const pageIds = paginatedData.map(item => item._id || item.id);
        setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(item => selectedIds.includes(item._id || item.id));

  const showToastMessage = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000); 
  };

  const handleSubmitReport = async () => {
    setIsReporting(true);
    try {
      const to12HourFormat = (timeStr) => {
        if (!timeStr) return "-";
        if (timeStr.includes("M") || timeStr.includes("m")) return timeStr;
        try {
          return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        } catch (e) {
          return timeStr;
        }
      };

      const formattedData = filtered.map(item => {
        const { createdAt, updatedAt, __v, _id, isArchived, status,...rest } = item;
        return {
          ...rest, 
          price: typeof rest.price === 'number' ? `₱${rest.price.toFixed(2)}` : rest.price,
          date: rest.date ? new Date(rest.date).toLocaleDateString() : "-",
          time: to12HourFormat(rest.time)
        };
      });

      const reportPayload = {
        screen: "Terminal Fees Management",
        generatedDate: new Date().toLocaleString(),
        filters: {
          searchQuery,
          selectedDate: selectedDate ? new Date(selectedDate).toLocaleDateString() : "None",
          activeType
        },
        statistics: {
           totalPassengers: stats.total,
           totalRevenue: stats.revenue,
           regularCount: stats.regular,
           studentCount: stats.student,
           seniorCount: stats.senior
        },
        data: formattedData 
      };

      await submitPageReport("Terminal Fees", reportPayload, "Ticket Admin");
      await fetch("http://localhost:3000/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Report Submitted: Terminal Fees Reports",
          message: "A new Terminal Fees report has been generated and the active log has been cleared.",
          source: "Terminal Fees"
        }),
      });

      const deletePromises = filtered.map(item => 
          fetch(`${API_URL}/terminal-fees/${item._id || item.id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      showToastMessage("Report submitted successfully! Table cleared.");
      setShowSubmitModal(false);
      fetchFees();
    } catch (error) {
      console.error(error);
      showToastMessage("Failed to submit report.");
    } finally {
      setIsReporting(false);
    }
  };

  const handleBulkDelete = async () => {
    const confirmMsg = role === "ticket" 
        ? `Request deletion for ${selectedIds.length} records?` 
        : `Are you sure you want to permanently delete ${selectedIds.length} records?`;

    if (!window.confirm(confirmMsg)) return;

    setIsLoading(true);
    try {
        if (role === "ticket") {
            const requestPromises = selectedIds.map(async (id) => {
                const item = records.find(r => (r._id || r.id) === id);
                if (!item) return;

                return fetch(`${API_URL}/deletion-requests`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        itemType: "Terminal Fee",
                        itemDescription: `Ticket #${item.ticketNo} - ${item.passengerType}`,
                        requestedBy: "Ticket Admin",
                        originalData: item, 
                        reason: "Bulk deletion request"
                    })
                });
            });

            await Promise.all(requestPromises);
            await logActivity(role, "REQUEST_BULK_DELETE", `Requested deletion for ${selectedIds.length} tickets`, "TerminalFees");
            showToastMessage(`Sent deletion requests for ${selectedIds.length} records.`);

        } else {
            const deletePromises = selectedIds.map(id => 
                fetch(`${API_URL}/terminal-fees/${id}`, { method: "DELETE" })
            );
            
            await Promise.all(deletePromises);
            await logActivity(role, "BULK_DELETE", `Deleted ${selectedIds.length} tickets via bulk action`, "TerminalFees");
            showToastMessage(`Successfully deleted ${selectedIds.length} records`);
            await fetchFees(); 
        }

        setSelectedIds([]);
        setIsSelectionMode(false);

    } catch (error) {
      console.error("Bulk action failed", error);
      showToastMessage("Failed to process some records.");
    } finally {
      setIsLoading(false);
    }
  };

  const executeUpdate = async (data) => {
    try {
      const idToUpdate = data._id || data.id;
      const res = await fetch(`${API_URL}/terminal-fees/${idToUpdate}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Update failed");
      await fetchFees(); 
      await logActivity(role, "UPDATE_TICKET", `Updated Ticket #${data.ticketNo}.`, "TerminalFees");
      showToastMessage("Record updated successfully!"); 
    } catch (error) {
      console.error(error);
      showToastMessage("Failed to update record.");
    }
  };

  const handleEditSubmit = (updatedData) => {
    if (!editRow) return;
    const finalData = { ...editRow, ...updatedData };

    if (role === "superadmin") {
        executeUpdate(finalData); 
        setEditRow(null);        
    } else if (role === "ticket") {
        setPendingEdit(finalData); 
        setEditRow(null); 
        setConfirmAction("edit"); 
        setPasswordInput(""); 
        setPasswordError("");
        setShowPasswordModal(true); 
    }
  };
  
  const executeDelete = async (id, ticketNo) => {
    try {
      const res = await fetch(`${API_URL}/terminal-fees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetchFees();
      await logActivity(role, "DELETE_TICKET", `Deleted Ticket #${ticketNo}`, "TerminalFees");
      showToastMessage("Record deleted successfully!"); 
    } catch (error) {
       console.error(error);
       showToastMessage("Failed to delete record.");
    }
  };

  const handleDeleteProceed = async () => {
      if (!deleteRow) return;

      if (role === "ticket") {
          try {
            const res = await fetch(`${API_URL}/deletion-requests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemType: "Terminal Fee",
                    itemDescription: `Ticket #${deleteRow.ticketNo} - ${deleteRow.passengerType}`,
                    requestedBy: "Ticket Admin",
                    originalData: deleteRow, 
                    reason: deleteRemarks || "No remarks provided."
                })
            });

            if (!res.ok) throw new Error("Failed to send request");
            await logActivity(role, "REQUEST_DELETE", `Requested deletion: Ticket #${deleteRow.ticketNo}`, "TerminalFees");
            showToastMessage("Deletion request sent to Superadmin.");
            setDeleteRow(null);
            setDeleteRemarks(""); 

          } catch (e) {
            console.error("Error requesting deletion", e);
            showToastMessage("Failed to submit deletion request.");
          }
          return; 
      }

     if (role === "superadmin") {
         const idToDelete = deleteRow._id || deleteRow.id;
         if (!idToDelete) {
            showToastMessage("System Error: Cannot delete (Missing ID)");
            return;
         }
         await executeDelete(idToDelete, deleteRow.ticketNo);
         setDeleteRow(null);
         return;
      }
      
      setPendingEdit(deleteRow);
      setDeleteRow(null);
      setConfirmAction("delete");
      setPasswordInput("");
      setPasswordError("");
      setShowPasswordModal(true);
  };

  const handleFinalizeAction = () => {
    const requiredPassword = role === "ticket" 
        ? (localStorage.getItem("ticketPassword") || "ticket123") 
        : (localStorage.getItem("authPassword") || "admin123");

    if (passwordInput === requiredPassword) {
      const recordId = pendingEdit?._id || pendingEdit?.id;
      if (!pendingEdit || !recordId) {
          setPasswordError("System Error: Lost record ID. Please refresh and try again.");
          return;
      }
      if (confirmAction === "edit") {
          executeUpdate(pendingEdit); 
      } else if (confirmAction === "delete") {
          executeDelete(recordId, pendingEdit.ticketNo); 
      }
      setShowPasswordModal(false);
      setPendingEdit(null);
      setConfirmAction(null);
      setPasswordInput("");
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  const handleOpenAdd = () => {
    const maxTicket = records.length > 0 ? Math.max(...records.map(r => Number(r.ticketNo) || 0)) : 0;
    const now = new Date();
    setNewTicket({
      ticketNo: maxTicket + 1,
      passengerType: "Regular",
      price: basePrices.regular, 
      date: now.toISOString().split('T')[0], 
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    });
    setShowAddModal(true);
  };

  const handleSaveNew = async () => {
    try {
      const res = await fetch(`${API_URL}/terminal-fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket)
      });
      if (!res.ok) throw new Error("Failed to save to database");
      await fetchFees(); 
      await logActivity(role, "CREATE_TICKET", `Created Ticket #${newTicket.ticketNo} - ${newTicket.passengerType}`, "TerminalFees");
      showToastMessage("New ticket added successfully!"); 
      setShowAddModal(false);
    } catch (error) {
      console.error("Error saving ticket:", error);
      showToastMessage("Failed to save ticket. Please check server connection.");
    }
  };

  // REPLACE the existing handleArchive function with this:
  const confirmArchive = async () => {
    if (!archiveRow) return;
    const rowToArchive = archiveRow;
    setArchiveRow(null); // Close modal

    try {
      // 1. Send to Archives
      const archiveRes = await fetch(`${API_URL}/archives`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             type: "Terminal Fee",
             description: `Ticket #${rowToArchive.ticketNo} - ${rowToArchive.passengerType}`,
             originalData: rowToArchive,
             archivedBy: role
          })
      });
      if (!archiveRes.ok) throw new Error("Failed to archive");

      // 2. Delete from Active List
      const idToDelete = rowToArchive._id || rowToArchive.id;
      if (!idToDelete) throw new Error("System Error: Record ID is missing.");
      
      const deleteRes = await fetch(`${API_URL}/terminal-fees/${idToDelete}`, { method: "DELETE" });
      if (!deleteRes.ok) throw new Error("Failed to remove from active list");

      await fetchFees(); 
      await logActivity(role, "ARCHIVE_TICKET", `Archived Ticket #${rowToArchive.ticketNo}`, "TerminalFees");
      showToastMessage("Ticket archived successfully!"); 
    } catch (e) {
      console.error("Failed to archive:", e);
      showToastMessage("Failed to archive ticket.");
    }
  };
  

  // Helper function to ensure consistent data and formatting for all exports
    const getExportData = (data) => {
        return data.map(item => ({
            "Ticket No": item.ticketNo || "-",
            "Passenger Type": item.passengerType || "-",
            "Price": item.price ? `₱${item.price.toFixed(2)}` : "₱0.00",
            "Date": item.date ? new Date(item.date).toLocaleDateString() : "-", // Added Date handling
            "Time": item.time || "-",
        }));
    };

    const exportToCSV = () => {
        if (filtered.length === 0) {
            alert("No records to export.");
            return;
        }
        const dataToExport = getExportData(filtered);

        // Uses the dataToExport object keys for consistent headers
        const headers = Object.keys(dataToExport[0]).join(',');
        const rows = dataToExport.map(row => 
            // Escape quotes and wrap in quotes for robust CSV
            Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        const csvContent = headers + '\n' + rows;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `terminal_fees_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        logActivity(role, "EXPORT_CSV", `Exported ${dataToExport.length} Terminal Fees records to CSV`, "TerminalFees");
    };

    const exportToPDF = () => {
        if (filtered.length === 0) {
            alert("No records to export.");
            return;
        }
        
        const dataToExport = getExportData(filtered);
        const headers = Object.keys(dataToExport[0]);
        const body = dataToExport.map(item => Object.values(item));

        const doc = new jsPDF('portrait', 'mm', 'a4');
        
        // 1. Title Styling (Cleaner Look)
        doc.setFontSize(16);
        doc.setTextColor(34, 34, 34); // Dark text
        doc.text("Terminal Fees Records Report", 14, 15);
        
        // 2. Metadata Styling (Date Generated)
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100); // Gray text for metadata
        doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 22);

        // 3. Table Styling (The 'Clean' Layout)
        autoTable(doc, {
            startY: 30, // Start lower for the header text
            head: [headers],
            body: body,
            theme: 'grid', // Uses clear borders for a clean look
            headStyles: { 
                fillColor: [16, 185, 129], // Emerald Green header color
                textColor: [255, 255, 255],
                fontSize: 9, 
                halign: 'center'
            }, 
            styles: {
                fontSize: 8, 
                cellPadding: 3, // Increased padding for better spacing
                valign: 'middle',
                textColor: [51, 51, 51] // Dark body text
            },
            alternateRowStyles: {
                fillColor: [240, 255, 240], // Light stripe for readability
            }
        });

        // 4. Summary Totals (Uses stats memo if available)
        const finalY = doc.lastAutoTable.finalY;
        doc.setFontSize(10);
        doc.setTextColor(51, 51, 51);
        doc.text(`Total Records: ${filtered.length}`, 14, finalY + 10);
        
        doc.save(`terminal_fees_report_${new Date().toISOString().split('T')[0]}.pdf`);
        
        logActivity(role, "EXPORT_PDF", `Exported ${dataToExport.length} Terminal Fees records to PDF`, "TerminalFees");
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
        "Ticket No", "Passenger Type", "Time", "Date", "Price"
      ]
    : ["Ticket No", "Passenger Type", "Time", "Date", "Price"];

  return (
    <Layout title="Terminal Fees Management">
      <div className="mb-6">
        <StatCardGroupTerminal
          regular={stats.regular}
          student={stats.student}
          senior={stats.senior}
          totalPassengers={stats.total}
          totalRevenue={stats.revenue}
        />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
        
        <div className="flex items-center justify-end gap-3">
          {(role === "superadmin") && (
            <button 
            title='Price Setting'
            onClick={handleOpenPriceModal} 
            className="flex items-center justify-center cursor-pointer gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Settings size={18} /> <span>Pricing</span>
          </button>)}

          <button onClick={handleOpenAdd} className="flex cursor-pointer items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
          title='Add Ticket'>
            <Plus size={18} /> <span>Add Fee</span>
          </button>

          {(role === "ticket") && (
            <button 
                onClick={() => setShowSubmitModal(true)} 
                disabled={isReporting}
                className="flex items-center cursor-pointer justify-center gap-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <FileText size={18} />
              <span>Submit Report</span>
            </button>
          )}
          <ExportMenu 
            onExportExcel={exportToCSV} 
            onExportPDF={exportToPDF} 
          />
        </div>
      </div>

     <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
  
  <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
    <TerminalFilter activeType={activeType} onTypeChange={setActiveType} />
  </div>

  <div className="flex items-center justify-end gap-2 w-full sm:w-auto">

    {role === "superadmin" && (
      <button 
        onClick={() => setShowLogModal(true)} 
        className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-4 h-[42px] rounded-xl shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
        title="View Logs"
      >
        <History size={18} /> 
        <span className="hidden sm:inline">Logs</span>
      </button>
    )}
    
    {role === "ticket" && (
      <button 
        onClick={() => setShowLogModal(true)} 
        className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-4 h-[42px] rounded-xl shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
        title="View Logs"
      >
        <History size={18} /> 
        <span className="hidden sm:inline">Logs</span>
      </button>
    )}
    
    {isSelectionMode && selectedIds.length > 0 && (
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-600 px-1 sm:px-2 whitespace-nowrap">
          {selectedIds.length} <span className="hidden xs:inline">Selected</span>
        </span>
        <button
          onClick={handleBulkDelete}
          title={role === "ticket" ? "Request Deletion" : "Delete Selected"}
          className="rounded-lg p-1.5 sm:p-2 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-200 transition-all"
        >
          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <div className="hidden sm:block h-5 w-px bg-slate-300 mx-1"></div>
      </div>
    )}

    {(role == "ticket") &&(<button
      onClick={toggleSelectionMode}
      title={isSelectionMode ? "Cancel Selection" : "Select Records"}
      className={`flex items-center justify-center cursor-pointer h-10 w-10 sm:w-auto sm:px-3 rounded-xl transition-all border ${
        isSelectionMode
          ? "bg-red-500  text-white shadow-md"
          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
      }`}
    >
      {isSelectionMode ? <X size={20} /> : <ListChecks size={20} />}
    </button>)}
  </div>
</div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-xl border-slate-200 bg-white/50">
            <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-2" />
            <p className="text-sm text-slate-500 font-medium">Loading records...</p>
        </div>
      ) : (
      
      <Table
        columns={tableColumns}
          data={paginatedData.map((fee) => {
            const rowId = fee._id || fee.id;
            const baseData = {
                id: rowId,
                ticketno: fee.ticketNo,
                passengertype: fee.passengerType, 
                time: fee.time,
                date: fee.date,
                price: `₱${fee.price.toFixed(2)}`,
            };

            if (isSelectionMode) {
                return {
                    select: (
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                                type="checkbox"
                                checked={selectedIds.includes(rowId)}
                                onChange={() => toggleSelect(rowId)}
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
            const selectedRecord = records.find(r => (r._id || r.id) == row.id);

            return (
              <div className="flex justify-end items-center space-x-2">
                <TableActions
                  onView={() => setViewRow(selectedRecord)}
                  onEdit={() => setEditRow(selectedRecord)}
                /> 
                <button 
                  onClick={() => setArchiveRow(selectedRecord)}
                  className="p-1.5 rounded-lg bg-yellow-50 cursor-pointer text-yellow-600 hover:bg-yellow-100"
                  title="Archive">
                  <Archive size={16} />
                </button>

                {(role == "superadmin") && (<button 
                  onClick={() => { 
                    setDeleteRow(selectedRecord); 
                    setDeleteRemarks(""); 
                  }} 
                  className="p-1.5 rounded-lg bg-red-50 cursor-pointer text-red-600 hover:bg-red-100"
                  title="Delete">
                  <Trash2 size={16} />
                </button>)}
              </div>
            );
          }}
        />
      )}

      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filtered.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filtered.length}
          onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
        />
      </div>

      <LogModal 
        isOpen={showLogModal} 
        onClose={() => setShowLogModal(false)} 
      />

      <SecurityCheckModal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setPendingEdit(null); setPasswordInput(""); }}
        onConfirm={handleFinalizeAction}
        actionType={confirmAction}
        passwordInput={passwordInput}
        setPasswordInput={(val) => { setPasswordInput(val); setPasswordError(""); }}
        error={passwordError}
      />

      <RequestDeletionModal
        isOpen={role === "ticket" && !!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDeleteProceed}
        itemIdentifier={deleteRow ? `Ticket #${deleteRow.ticketNo}` : ""}
        remarks={deleteRemarks}
        setRemarks={setDeleteRemarks}
      />

      {viewRow && (
        <ViewModal
          title="View Terminal Fee"
          fields={[
            { label: "Ticket No", value: viewRow.ticketNo },
            { label: "Passenger Type", value: viewRow.passengerType },
            { label: "Time", value: viewRow.time },
            { label: "Date", value: viewRow.date },
            { label: "Price", value: viewRow.price },
          ]}
          onClose={() => setViewRow(null)}
        />
      )}

      {role !== "ticket" && (
        <DeleteModal
            isOpen={!!deleteRow}
            onClose={() => setDeleteRow(null)}
            onConfirm={handleDeleteProceed} 
            title="Delete Record"
            message="Are you sure you want to remove this terminal fee record? This action cannot be undone."
            itemName={deleteRow ? `Ticket #${deleteRow.ticketNo}` : ""}
        />
      )}

      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-5 border-b pb-3">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings size={20} className="text-emerald-600"/> Base Price Settings
              </h3>
              <button 
                onClick={() => setShowPriceModal(false)} 
                className="text-slate-400 hover:text-red-500 p-1 rounded-full transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-slate-600 mb-5">
                Adjust the default fees applied to new tickets. Changes take effect upon saving.
            </p>

            <div className="space-y-5">
               {/* REGULAR PRICE INPUT - FIXED: Changed type to text and added custom handler */}
               <div>
                  <label htmlFor="regular-price" className="block text-sm font-semibold text-slate-700 mb-1">Regular Passenger Price</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-500">₱</span>
                    <input 
                      id="regular-price"
                      type="text" // Use text for better decimal control
                      value={modalPrices.regular} 
                      onChange={(e) => handleModalPriceChange('regular', e.target.value)}
                      className="w-full bg-white border border-slate-300 pl-8 pr-3 py-2.5 rounded-lg font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      placeholder="0.00"
                    />
                  </div>
               </div>

               {/* DISCOUNTED PRICE INPUT - FIXED: Changed type to text and added custom handler */}
               <div>
                  <label htmlFor="discounted-price" className="block text-sm font-semibold text-slate-700 mb-1">Student / Senior / PWD Price</label>
                  <div className="relative">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-500">₱</span>
                     <input 
                      id="discounted-price"
                      type="text" // Use text for better decimal control
                      value={modalPrices.discounted} 
                      onChange={(e) => handleModalPriceChange('discounted', e.target.value)}
                      className="w-full bg-white border border-slate-300 pl-8 pr-3 py-2.5 rounded-lg font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      placeholder="0.00"
                    />
                  </div>
               </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-3 border-t pt-4">
              <button 
                onClick={() => setShowPriceModal(false)} 
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveBasePrices} 
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                <CheckCircle size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">New Terminal Fee</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ticket No</label>
                <input type="text" value={newTicket.ticketNo} disabled className="w-full bg-slate-100 border border-slate-300 px-3 py-2 rounded-lg font-medium"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Passenger Type</label>
                <div className="grid grid-cols-3 gap-2 ">
                  {["Regular", "Student", "Senior Citizen / PWD"].map((type) => (
                    <button key={type} onClick={() => {
                        // 6. USE DYNAMIC PRICE IN ADD MODAL
                        const price = (type === 'Student' || type === 'Senior Citizen / PWD') ? basePrices.discounted : basePrices.regular;
                        setNewTicket(prev => ({ ...prev, passengerType: type, price }));
                      }}
                      className={`py-2 px-1 rounded-lg text-xs font-semibold border ${newTicket.passengerType === type ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-200"}`}
                    >
                      {type === "Senior Citizen / PWD" ? "Senior/PWD" : type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Price</label>
                    <input type="number" value={newTicket.price} disabled className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg font-semibold"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
                    <input type="text" value={newTicket.date} disabled className="w-full bg-slate-100 border border-slate-300 px-3 py-2 rounded-lg text-sm"/>
                  </div>
               </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button onClick={handleSaveNew} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">Save Ticket</button>
            </div>
          </div>
        </div>
      )}

    {editRow && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-800">Edit Terminal Fee</h3>
            <button onClick={() => setEditRow(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {["Regular", "Student", "Senior Citizen / PWD"].map((type) => {
              // 7. USE DYNAMIC PRICE IN EDIT MODAL
              const newPrice = (type === "Student" || type === "Senior Citizen / PWD") ? basePrices.discounted : basePrices.regular;
              const active = (editRow.passengerType || "").toLowerCase() === type.toLowerCase();
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEditRow(prev => ({ ...prev, passengerType: type, price: newPrice }))}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold border ${active ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-200"}`}
                >
                  {type === "Senior Citizen / PWD" ? "Senior/PWD" : type}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Price</label>
              <input
                type="number"
                value={editRow.price ?? 0}
                disabled
                className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
              <input
                type="text"
                value={
                  editRow.date
                    ? new Date(editRow.date).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""
                }
                disabled
                className="w-full bg-slate-100 border border-slate-300 px-3 py-2 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <button onClick={() => setEditRow(null)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">Cancel</button>
            <button
              onClick={() => {
                handleEditSubmit(editRow);
                setEditRow(null);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    )}

    {/* --- ARCHIVE MODAL --- */}
      {archiveRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl text-center">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Archive size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Confirm Archiving</h3>
                <p className="text-slate-600 mt-2 text-sm">
                    Are you sure you want to move Ticket <strong>#{archiveRow.ticketNo}</strong> to the Archives?
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

      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-3 bg-slate-800 text-white px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in">
          <CheckCircle className="text-emerald-400" size={22} />
          <span className="font-semibold text-sm">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-4 text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
      )}
      
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl transform transition-all scale-100">
            <h3 className="text-lg font-bold text-slate-800">Submit Report</h3>
            <p className="mt-2 text-sm text-slate-600">
                Are you sure you want to capture and submit the current terminal fees report?
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
    </Layout>
  );
};

export default TerminalFees;