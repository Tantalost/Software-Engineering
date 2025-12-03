import React, { useState, useMemo, useEffect } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import EditLostFound from "../components/lostfound/EditLostFound";
import DeleteModal from "../components/common/DeleteModal";
import LostFoundStatusFilter from "../components/lostfound/LostFoundStatusFilter";
import LogModal from "../components/common/LogModal"; 
import { submitPageReport } from "../utils/reportService.js";
import { logActivity } from "../utils/logger"; 
import { sendNotification } from "../utils/notificationService.js"; 
import { Archive, Trash2, Package, FileText, Calendar, MapPin, Loader2, History, ListChecks, X, Tag } from "lucide-react";

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import * as XLSX from 'xlsx';

const formatDateTimeForExport = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'numeric', day: 'numeric',
    }) + " " + new Date(dateStr).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true
    });
};

const LostFound = () => {
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [activeStatus, setActiveStatus] = useState("All");
    
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false); 
    
    const [viewRow, setViewRow] = useState(null);
    const [editRow, setEditRow] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    
    const [isReporting, setIsReporting] = useState(false);
    

    const role = localStorage.getItem("authRole") || "superadmin";
    const API_URL = "http://localhost:3000/api/lostfound";

    
    const [newItem, setNewItem] = useState({
        trackingNo: "",
        description: "",
        itemType: "", 
        location: "",
        dateTime: "",
        status: "Unclaimed", 
    });

    
    const fetchLostFound = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();

            
            const formattedData = data.map(item => ({
                ...item,
                id: item._id
            }));
            setRecords(formattedData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLostFound();
    }, []);

    
    const handleAddClick = () => {
        
        const autoTracking = `LF-${Date.now().toString().slice(-6)}`;
        const now = new Date();
        const formattedNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

        setNewItem({
            trackingNo: autoTracking,
            description: "",
            itemType: "", 
            location: "",
            dateTime: formattedNow,
            status: "Unclaimed" 
        });
        setShowAddModal(true);
    };

    const handleCreateItem = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newItem),
            });
            if (response.ok) {
                const created = await response.json();
                logActivity(role, "CREATE_LOSTFOUND", `Logged Item #${created.trackingNo}`, "LostFound");
                fetchLostFound();
                setShowAddModal(false);
            }
        } catch (error) {
            console.error("Error creating item:", error);
        }
    };

    
    const handleUpdateRecord = async (updatedData) => {
        try {
            const response = await fetch(`${API_URL}/${updatedData.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });
            if (response.ok) {
                logActivity(role, "UPDATE_LOSTFOUND", `Updated Item #${updatedData.trackingNo}`, "LostFound");
                fetchLostFound();
                setEditRow(null);
            }
        } catch (error) {
            console.error("Error updating:", error);
        }
    };

    
    const handleDeleteConfirm = async () => {
        if (!deleteRow) return;
        try {
            const response = await fetch(`${API_URL}/${deleteRow.id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                logActivity(role, "DELETE_LOSTFOUND", `Deleted Item #${deleteRow.trackingNo}`, "LostFound");
                setRecords(prev => prev.filter(r => r.id !== deleteRow.id));
            }
        } catch (error) {
            console.error("Error deleting:", error);
        } finally {
            setDeleteRow(null);
        }
    };

    const handleArchive = async (row) => {
        if (!window.confirm(`Are you sure you want to archive Item #${row.trackingNo}?`)) return;
        
        try {
            const archiveRes = await fetch("http://localhost:3000/api/archives", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "LostFound",
                    description: `Item #${row.trackingNo} - ${row.description}`,
                    originalData: row,
                    archivedBy: role
                })
            });
            if (!archiveRes.ok) throw new Error("Failed to archive");

            const deleteRes = await fetch(`${API_URL}/${row.id}`, { method: "DELETE" });
            if (!deleteRes.ok) throw new Error("Failed to remove from active list");

            logActivity(role, "ARCHIVE_LOSTFOUND", `Archived Item #${row.trackingNo}`, "LostFound");
            setRecords(prev => prev.filter(r => r.id !== row.id));
            alert("Item archived successfully!");

        } catch (error) {
            console.error("Error archiving:", error);
            alert("Failed to archive item.");
        }
    };

    
    const filtered = records.filter((item) => {
        const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.trackingNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.itemType && item.itemType.toLowerCase().includes(searchQuery.toLowerCase())); 

        const matchesDate = !selectedDate || new Date(item.dateTime).toDateString() === new Date(selectedDate).toDateString();

        const matchesStatus = activeStatus === "All" || item.status.toLowerCase() === activeStatus.toLowerCase();

        return matchesSearch && matchesDate && matchesStatus;
    });

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filtered.slice(startIndex, startIndex + itemsPerPage);
    }, [filtered, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);

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

    const handleBulkDelete = async () => {
        const confirmMsg = role === "lostfound" 
            ? `Request deletion for ${selectedIds.length} records?` 
            : `Are you sure you want to permanently delete ${selectedIds.length} records?`;

        if (!window.confirm(confirmMsg)) return;

        setIsLoading(true);
        try {
            if (role === "lostfound") {
                const requestPromises = selectedIds.map(async (id) => {
                    const item = records.find(r => r.id === id);
                    if (!item) return;

                    return fetch("http://localhost:3000/api/deletion-requests", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            itemType: "Lost & Found Item",
                            itemDescription: `Item #${item.trackingNo} - ${item.description}`,
                            requestedBy: "LostFound Admin",
                            originalData: item, 
                            reason: "Bulk deletion request"
                        })
                    });
                });

                await Promise.all(requestPromises);
                logActivity(role, "REQUEST_BULK_DELETE", `Requested deletion for ${selectedIds.length} items`, "LostFound");
                
                sendNotification(
                    "Deletion Request: Lost & Found", 
                    `Lost & Found Admin has requested to delete ${selectedIds.length} records.`,
                    "Lost & Found",
                    "superadmin"
                );

                alert(`Sent deletion requests for ${selectedIds.length} records. Superadmin notified.`);
                setSelectedIds([]);
                setIsSelectionMode(false);

            } else {
                const deletePromises = selectedIds.map(id => 
                    fetch(`${API_URL}/${id}`, { method: "DELETE" })
                );
                
                await Promise.all(deletePromises);
                logActivity(role, "BULK_DELETE", `Deleted ${selectedIds.length} items via bulk action`, "LostFound");
                
                alert(`Successfully deleted ${selectedIds.length} records`);
                fetchLostFound();
                setSelectedIds([]);
                setIsSelectionMode(false);
            }

        } catch (error) {
            console.error("Bulk action failed", error);
            alert("Failed to process some records.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitReport = async () => {
        setIsReporting(true);
        try {
            const formattedData = filtered.map(item => {
                const { createdAt, updatedAt, isArchived, __v, _id, ...rest } = item;
                return {
                    ...rest,
                    ...rest,
                    dateTime: rest.dateTime ? new Date(rest.dateTime).toLocaleString('en-US', {
                        year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                    }) : "-"
                };
            });

            const reportPayload = {
                screen: "Lost & Found Log",
                generatedDate: new Date().toLocaleString(),
                filters: {
                    searchQuery,
                    selectedDate: selectedDate ? new Date(selectedDate).toLocaleDateString() : "None",
                    activeStatus
                },
                statistics: {
                    totalItems: records.length,
                    displayedItems: filtered.length,
                    unclaimed: filtered.filter(i => i.status === "Unclaimed").length,
                    claimed: filtered.filter(i => i.status === "Claimed").length
                },
                data: formattedData
            };

            await submitPageReport("Lost & Found", reportPayload, "LostFound Admin");

            sendNotification(
                "Report Submitted: Lost & Found Report",
                "A new Lost & Found report has been generated and the active log has been cleared.",
                "Lost & Found",
                "superadmin"
            );

            const deletePromises = filtered.map(item =>
                fetch(`${API_URL}/${item.id}`, { method: 'DELETE' })
            );

            await Promise.all(deletePromises);
            alert("Report submitted successfully! The table has been cleared.");
            setShowSubmitModal(false);
            fetchLostFound();

        } catch (error) {
            console.error(error);
            alert("Failed to submit report.");
        } finally {
            setIsReporting(false);
        }
    };

    
    const formatDateTime = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString() + " " + new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
        
    const getExportData = (data) => {
        return data.map(item => ({
            "Tracking No": item.trackingNo,
            "Item Type": item.itemType || "-",
            "Description": item.description,
            "Location": item.location,
            "DateTime": formatDateTimeForExport(item.dateTime), 
            "Status": item.status,
        }));
    };

    const handleExportCSV = () => {
        if (filtered.length === 0) {
            alert("No records to export.");
            return;
        }
        const dataToExport = getExportData(filtered);
        
        // CSV headers now consistently match the table and PDF
        const headers = Object.keys(dataToExport[0]).join(',');
        const rows = dataToExport.map(row => 
            Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        const csvContent = headers + '\n' + rows;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `LostFound_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        logActivity(role, "EXPORT_CSV", `Exported ${dataToExport.length} Lost & Found records to CSV`, "LostFound");
    };

    const handleExportPDF = () => {
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
        doc.text("Lost & Found Records Report", 14, 15);
        
        // 2. Metadata Styling (Cleaner Look)
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

        doc.save(`LostFound_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        
        logActivity(role, "EXPORT_PDF", `Exported ${dataToExport.length} Lost & Found records to PDF`, "LostFound");
    };

    const handleExportExcel = () => {
        if (filtered.length === 0) {
            alert("No records to export.");
            return;
        }
        const dataToExport = getExportData(filtered);

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        
        XLSX.utils.book_append_sheet(workbook, worksheet, "LostFound_Records");

        XLSX.writeFile(workbook, `LostFound_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

        logActivity(role, "EXPORT_EXCEL", `Exported ${dataToExport.length} Lost & Found records to Excel`, "LostFound");
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
            "Tracking No", "Item Type", "Description", "Location", "DateTime", "Status"
          ]
        : ["Tracking No", "Item Type", "Description", "Location", "DateTime", "Status"];

    return (
        <Layout title="Lost and Found Records">
            <div className="px-4 lg:px-8 mt-4">
                <div className="flex flex-col gap-4 w-full">

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <FilterBar
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                        />

                        <div className="flex items-center justify-end gap-3 w-full lg:w-auto">

                            {(role === "lostfound") && (
                                <button
                                    onClick={() => setShowSubmitModal(true)}
                                    disabled={isReporting}
                                    className="flex items-center justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all w-full sm:w-auto"
                                >
                                    <FileText size={18} />
                                    <span>Submit Report</span>
                                </button>
                            )}
                            
                            <button onClick={handleAddClick} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 h-[44px] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center w-full sm:w-auto">
                                + Add New
                            </button>

                            <div className="h-[44px] flex items-center">
                                <ExportMenu 
                                    onExportCSV={handleExportCSV} 
                                    onExportPDF={handleExportPDF} 
                                    onExportExcel={handleExportExcel}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full mb-4">
                        <LostFoundStatusFilter activeStatus={activeStatus} onStatusChange={setActiveStatus} />

                        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                            <button 
                                onClick={() => setShowLogModal(true)} 
                                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-3 sm:px-4 h-10 rounded-xl shadow-sm hover:border-slate-300 transition-all"
                                title="View Logs"
                            >
                                <History size={18} /> 
                                <span className="hidden sm:inline">Logs</span>
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

                            {(role == "lostfound") &&(<button
                                onClick={toggleSelectionMode}
                                title={isSelectionMode ? "Cancel Selection" : "Select Records"}
                                className={`flex items-center justify-center h-10 w-10 sm:w-auto sm:px-3 rounded-xl transition-all border ${
                                    isSelectionMode
                                        ? "bg-red-500 text-white shadow-md"
                                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                                }`}
                            >
                                {isSelectionMode ? <X size={20} /> : <ListChecks size={20} />}
                            </button>)}
                        </div>
                    </div>
                </div>
            </div>


            <div className="p-4 lg:p-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-2" />
                        <p>Loading data...</p>
                    </div>
                ) : (
                    <Table
                        columns={tableColumns}
                        data={paginatedData.map((item) => {
                            const baseData = {
                                id: item.id,
                                trackingno: item.trackingNo,
                                // IMPORTANT: Use 'itemtype' here to match the column header 'Item Type'
                                itemtype: item.itemType, 
                                description: item.description,
                                location: item.location,
                                datetime: formatDateTime(item.dateTime),
                                status: item.status,
                            };

                            if (isSelectionMode) {
                                return {
                                    select: (
                                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                            <input 
                                                type="checkbox"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={() => toggleSelect(item.id)}
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
                            const selectedRecord = records.find(r => r.id === row.id);
                            return (
                                <div className="flex justify-end items-center space-x-2">
                                <TableActions
                                    onView={() => setViewRow(selectedRecord)}
                                    onEdit={() => setEditRow(selectedRecord)}
                                    onDelete={() => setDeleteRow(selectedRecord)}
                                />
                                <button onClick={() => handleArchive(selectedRecord)} title="Archive" className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all">
                                    <Archive size={16} />
                                </button>
                                {(role == "superadmin") &&(<button onClick={() => setDeleteRow(selectedRecord)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Delete">
                                                    <Trash2 size={16} />
                                </button>)}
                                </div>
                            );
                        }}
                    />
                )}
            </div>


            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filtered.length}
                onItemsPerPageChange={(newItemsPerPage) => {
                    setItemsPerPage(newItemsPerPage);
                    setCurrentPage(1);
                }}
            />

            {/* --- LOG MODAL --- */}
            <LogModal 
                isOpen={showLogModal} 
                onClose={() => setShowLogModal(false)} 
            />

            {/* --- ADD NEW MODAL --- */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Log Lost/Found Item</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleCreateItem}>
                            <div className="space-y-4">

                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Item Type</label>
                                    <div className="relative">
                                        <Tag size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="text"
                                            value={newItem.itemType}
                                            onChange={(e) => setNewItem({ ...newItem, itemType: e.target.value })}
                                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="e.g., Wallet, Keys, Laptop, Book"
                                            required
                                        />
                                    </div>
                                </div>
                            

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tracking Number</label>
                                    <div className="relative">
                                        <Package size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="text"
                                            value={newItem.trackingNo}
                                            onChange={(e) => setNewItem({ ...newItem, trackingNo: e.target.value })}
                                            disabled className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-slate-100 "
                                            placeholder="LF-123456"
                                            required
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time Found/Reported</label>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="datetime-local"
                                            value={newItem.dateTime}
                                            onChange={(e) => setNewItem({ ...newItem, dateTime: e.target.value })}
                                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white" 
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <div className="relative">
                                        <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <textarea
                                            value={newItem.description}
                                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px]"
                                            placeholder="Detailed description of the item..."
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <textarea
                                            value={newItem.location}
                                            onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300"
                                            placeholder="Location of the item found..."
                                            required
                                        />
                                    </div>
                                </div>

                            
                                <input type="hidden" name="status" value={newItem.status} />

                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-emerald-600 rounded-xl text-white font-medium shadow-md hover:bg-emerald-700 transition-all">Save Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            
            {viewRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
                        <h3 className="mb-4 text-base font-semibold text-slate-800">View Lost/Found</h3>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                            <Field label="Tracking No" value={viewRow.trackingNo} />
                            <Field label="Type" value={viewRow.itemType} /> 
                            <Field label="Status" value={viewRow.status} />
                            <Field label="DateTime" value={formatDateTime(viewRow.dateTime)} />
                            <div className="md:col-span-2"><Field label="Description" value={viewRow.description} /></div>
                            <div className="md:col-span-2"><Field label="Location" value={viewRow.location} /></div>
                        </div>
                        <div className="mt-4 flex justify-end"><button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">Close</button></div>
                    </div>
                </div>
            )}


            {editRow && (
                <EditLostFound
                    row={editRow}
                    onClose={() => setEditRow(null)}
                    onSave={handleUpdateRecord}
                />
            )}

            
            <DeleteModal
                isOpen={!!deleteRow}
                onClose={() => setDeleteRow(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Record"
                message="Are you sure you want to remove this record?"
                itemName={deleteRow ? `Track #${deleteRow.trackingNo}` : ""}
            />

            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl transform transition-all scale-100">
                        <h3 className="text-lg font-bold text-slate-800">Submit Report</h3>
                        <p className="mt-2 text-sm text-slate-600">
                            Are you sure you want to capture and submit the current Lost & Found report?
                            <br />
                            <span className="text-red-500 font-semibold text-xs">
                                Note: This will clear the current table for new entries.
                            </span>
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setShowSubmitModal(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
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

export default LostFound;