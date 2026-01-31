import React, { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Layout from "../components/layout/Layout";
import Table from "../components/common/Table";
import ExportMenu from "../components/common/exportMenu";
import BusTripFilters from "../components/common/BusTripFilters";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import EditBusTrip from "../components/busTrips/EditBusTrip";
import DeleteModal from "../components/common/DeleteModal";
import LogModal from "../components/common/LogModal";
<<<<<<< HEAD
// --- NEW IMPORT ---
import StatCardGroupBus from "../components/busTrips/StatCardGroupBus";
// ------------------
=======
import StatCardGroupBus from "../components/busTrips/StatCardGroupBus";
>>>>>>> 4d573b902a8c9f9ff61a849107027e7e5fe8d252
import { submitPageReport } from "../utils/reportService.js";
import { sendNotification } from "../utils/notificationService.js";
import { logActivity } from "../utils/logger";
import { busCompanyRoutes } from "../data/busRoutes.js";
import {
  Archive,
  Trash2,
  LogOut,
  CheckCircle,
  FileText,
  Loader2,
  History,
  ListChecks,
  X,
} from "lucide-react";

const TEMPLATE_ROUTES = {
  ...busCompanyRoutes.dindo,
  ...busCompanyRoutes.alga,
  ...busCompanyRoutes.ceres,
  ...busCompanyRoutes.lizamae,
};

const BusTrips = () => {
<<<<<<< HEAD
  // 1. STATE DECLARATIONS
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [archiveRow, setArchiveRow] = useState(null);
  const [showNotify, setShowNotify] = useState(false);
  const [notifyDraft, setNotifyDraft] = useState({ title: "", message: "" });
  const [deleteRow, setDeleteRow] = useState(null);
  const [logoutRow, setLogoutRow] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isReporting, setIsReporting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const role = localStorage.getItem("authRole") || "superadmin";
  const API_URL = "http://localhost:3000/api/bustrips";

  const [newBusData, setNewBusData] = useState({
    templateNo: "",
    route: "",
    company: "Dindo",
    time: "",
    date: new Date().toISOString().split("T")[0],
    status: "Pending",
  });

  //Company Management
  const [companies, setCompanies] = useState([
    "Dindo",
    "Alga",
    "Ceres",
    "Lizamae",
  ]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  const [ticketRefInput, setTicketRefInput] = useState("");

  // 2. DATA FETCHING
  const fetchBusTrips = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const formattedData = data.map((item) => ({
        ...item,
        id: item._id,
      }));
      setRecords(formattedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusTrips();
  }, []);

  // 3. COMPUTED VALUES (FILTERING)
  const uniqueCompanies = [...new Set(records.map((bus) => bus.company))];

  const filtered = records.filter((bus) => {
    const templateNo = bus.templateNo || bus.templateno || "";
    const matchesSearch =
      templateNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.route.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany =
      selectedCompany === "" || bus.company === selectedCompany;
    const matchesDate =
      !selectedDate ||
      new Date(bus.date).toDateString() ===
        new Date(selectedDate).toDateString();
    return matchesSearch && matchesCompany && matchesDate;
  });

  // --- NEW: ANALYTICS CALCULATIONS ---
  const totalTrips = filtered.length;
  // Assuming "Paid" status means they have departed/logged out
  const paidTrips = filtered.filter((t) => t.status === "Paid").length;
  const pendingTrips = filtered.filter((t) => t.status === "Pending").length;

  // Calculate revenue only for "Paid" (departed) trips to ensure accuracy
  const totalRevenue = filtered
    .filter((t) => t.status === "Paid")
    .reduce((sum, t) => sum + (Number(t.price) || 75), 0);
  // -----------------------------------

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // --- HELPER: FORMAT DATA FOR EXPORT ---
  const formatTimeExport = (timeStr) => {
    if (!timeStr) return "";
    try {
      return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return timeStr;
    }
  };

  const getExportData = () => {
    return filtered.map((item) => ({
      "Template No": item.templateNo || item.templateno || "-",
      "Ticket Ref": item.ticketReferenceNo || "-",
      Route: item.route || "-",
      Price: `₱${(item.price || 75).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      Time: formatTimeExport(item.time),
      Departure: formatTimeExport(item.departureTime),
      Date: item.date ? new Date(item.date).toLocaleDateString() : "-",
      Company: item.company || "-",
      Status: item.status || "-",
    }));
  };

  // --- EXPORT TO EXCEL (CSV) ---
  const handleExportExcel = () => {
    if (filtered.length === 0) {
      alert("No records to export.");
      return;
    }
    const dataToExport = getExportData();

    const headers = Object.keys(dataToExport[0]).join(",");
    const rows = dataToExport
      .map((row) =>
        Object.values(row)
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const csvContent = headers + "\n" + rows;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Bus_Trips_Report_${new Date().toISOString().split("T")[0]}.csv`,
=======
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    const [viewRow, setViewRow] = useState(null);
    const [editRow, setEditRow] = useState(null);
    const [archiveRow, setArchiveRow] = useState(null);
    const [showNotify, setShowNotify] = useState(false);
    const [notifyDraft, setNotifyDraft] = useState({ title: "", message: "" });
    const [deleteRow, setDeleteRow] = useState(null);
    const [logoutRow, setLogoutRow] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [isReporting, setIsReporting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    const role = localStorage.getItem("authRole") || "superadmin";
    const API_URL = "http://localhost:3000/api/bustrips";

    const [newBusData, setNewBusData] = useState({
        templateNo: "",
        route: "",
        company: "Dindo",
        time: "",
        date: new Date().toISOString().split('T')[0],
        status: "Pending"
    });

    const [ticketRefInput, setTicketRefInput] = useState("");

    const fetchBusTrips = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            const formattedData = data.map(item => ({
                ...item,
                id: item._id,
            }));
            setRecords(formattedData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBusTrips();
    }, []);

    const uniqueCompanies = [...new Set(records.map((bus) => bus.company))];

    const filtered = records.filter((bus) => {
        const templateNo = bus.templateNo || bus.templateno || "";
        const matchesSearch =
            templateNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bus.route.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCompany = selectedCompany === "" || bus.company === selectedCompany;
        const matchesDate = !selectedDate || new Date(bus.date).toDateString() === new Date(selectedDate).toDateString();
        return matchesSearch && matchesCompany && matchesDate;
    });

    const totalTrips = filtered.length;
    const paidTrips = filtered.filter(t => t.status === "Paid").length;
    const pendingTrips = filtered.filter(t => t.status === "Pending").length;
    const totalRevenue = filtered
        .filter(t => t.status === "Paid")
        .reduce((sum, t) => sum + (Number(t.price) || 75), 0);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filtered.slice(startIndex, startIndex + itemsPerPage);
    }, [filtered, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const formatTimeExport = (timeStr) => {
        if (!timeStr) return "";
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

    const getExportData = () => {
        return filtered.map(item => ({
            "Template No": item.templateNo || item.templateno || "-",
            "Ticket Ref": item.ticketReferenceNo || "-",
            "Route": item.route || "-",
            "Price": `₱${(item.price || 75).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            "Time": formatTimeExport(item.time),
            "Departure": formatTimeExport(item.departureTime),
            "Date": item.date ? new Date(item.date).toLocaleDateString() : "-",
            "Company": item.company || "-",
            "Status": item.status || "-"
        }));
    };

    // EXPORT TO EXCEL (CSV)
    const handleExportExcel = () => {
        if (filtered.length === 0) {
            alert("No records to export.");
            return;
        }
        const dataToExport = getExportData();

        const headers = Object.keys(dataToExport[0]).join(',');
        const rows = dataToExport.map(row =>
            Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const csvContent = headers + '\n' + rows;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Bus_Trips_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // EXPORT TO PDF
    const handleExportPDF = () => {
        if (filtered.length === 0) {
            alert("No records to export.");
            return;
        }

        const dataToExport = getExportData();
        const headers = Object.keys(dataToExport[0]);
        const body = dataToExport.map(item => Object.values(item));

        const doc = new jsPDF('landscape', 'mm', 'a4');

        doc.setFontSize(16);
        doc.setTextColor(34, 34, 34);
        doc.text("Bus Trips Report", 14, 15);

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
                fontSize: 8,
                halign: 'center'
            },
            styles: {
                fontSize: 7,
                cellPadding: 2,
                valign: 'middle',
                textColor: [51, 51, 51]
            },
            alternateRowStyles: {
                fillColor: [240, 255, 240],
            }
        });

        doc.save(`Bus_Trips_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

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
            const ids = paginatedData.map(item => item.id);
            setSelectedIds(prev => [...new Set([...prev, ...ids])]);
        } else {
            const pageIds = paginatedData.map(item => item.id);
            setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
        }
    };

    const isAllSelected = paginatedData.length > 0 && paginatedData.every(item => selectedIds.includes(item.id));

    // BULK DELETE
    const handleBulkDelete = async () => {
        const confirmMsg = role === "bus"
            ? `Request deletion for ${selectedIds.length} records?`
            : `Are you sure you want to permanently delete ${selectedIds.length} records?`;

        if (!window.confirm(confirmMsg)) return;

        setIsLoading(true);
        try {
            if (role === "bus") {
                const requestPromises = selectedIds.map(async (id) => {
                    const item = records.find(r => r.id === id);
                    if (!item) return;

                    return fetch("http://localhost:3000/api/deletion-requests", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            itemType: "Bus Trip",
                            itemDescription: `Template: ${item.templateNo || item.templateno} - ${item.route}`,
                            requestedBy: "Bus Admin",
                            originalData: item,
                            reason: "Bulk deletion request"
                        })
                    });
                });

                await Promise.all(requestPromises);
                await logActivity(role, "REQUEST_BULK_DELETE", `Requested deletion for ${selectedIds.length} bus trips`, "BusTrips");
                await sendNotification(
                    "Deletion Request: Bus Trips",
                    `Bus Admin has requested to delete ${selectedIds.length} bus trip records. Please review in deletion requests.`,
                    "Bus Trips",
                    "superadmin"
                );

                alert(`Sent deletion requests for ${selectedIds.length} records. Superadmin has been notified.`);
                setSelectedIds([]);
                setIsSelectionMode(false);

            } else {
                const deletePromises = selectedIds.map(id =>
                    fetch(`${API_URL}/${id}`, { method: "DELETE" })
                );

                await Promise.all(deletePromises);
                await logActivity(role, "BULK_DELETE", `Deleted ${selectedIds.length} bus trips via bulk action`, "BusTrips");

                alert(`Successfully deleted ${selectedIds.length} records`);
                await fetchBusTrips();
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
            const to12HourFormat = (timeStr) => {
                if (!timeStr) return "-";
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
                const { createdAt, updatedAt, isArchived, __v, _id, ...rest } = item;
                return {
                    ...rest,
                    date: rest.date ? new Date(rest.date).toLocaleDateString() : "-",
                    time: to12HourFormat(rest.time),
                    departureTime: to12HourFormat(rest.departureTime || "")
                };
            });

            const reportPayload = {
                screen: "Bus Trips Management",
                generatedDate: new Date().toLocaleString(),
                filters: {
                    searchQuery,
                    selectedDate: selectedDate ? new Date(selectedDate).toLocaleDateString() : "None",
                    selectedCompany
                },
                statistics: {
                    totalRecords: records.length,
                    displayedRecords: filtered.length
                },
                data: formattedData
            };

            await submitPageReport("Bus Trips", reportPayload, "Admin");

            await sendNotification(
                "Report Submitted: Bus Report",
                `A Bus Trips report was successfully submitted by ${role === 'bus' ? 'Bus Admin' : 'Admin'}.`,
                "Bus Trips"
            );

            const deletePromises = filtered.map(item =>
                fetch(`${API_URL}/${item.id}`, { method: 'DELETE' })
            );

            await Promise.all(deletePromises);
            alert("Report submitted successfully!");
            setShowSubmitModal(false);
            fetchBusTrips();

        } catch (error) {
            console.error(error);
            alert("Failed to process report. Please try again.");
        } finally {
            setIsReporting(false);
        }
    };

    const handleAddClick = () => {
        setNewBusData({
            templateNo: "",
            route: "",
            company: "Dindo",
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toISOString().split('T')[0],
            status: "Pending"
        });
        setShowAddModal(true);
    };

    const handleTemplateChange = (e) => {
        const tempNo = e.target.value;
        setNewBusData(prev => ({
            ...prev,
            templateNo: tempNo,
            route: TEMPLATE_ROUTES[tempNo] || ""
        }));
    };

    const handleCreateRecord = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newBusData),
            });
            if (response.ok) {
                const newItem = await response.json();
                await logActivity(role, "CREATE_TRIP", `Created Trip ${newItem.templateNo} - ${newItem.route}`, "BusTrips");
                fetchBusTrips();
                setShowAddModal(false);
            }
        } catch (error) {
            console.error("Error creating:", error);
        }
    };

    const handleLogoutClick = (row) => {
        setLogoutRow(row);
        setTicketRefInput("");
    };

    const confirmLogout = async () => {
        if (!logoutRow || !ticketRefInput) return;

        const changes = {
            ticketReferenceNo: ticketRefInput,
            status: "Paid",
            departureTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        };

        try {
            const response = await fetch(`${API_URL}/${logoutRow.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(changes),
            });

            if (response.ok) {
                setRecords(prev => prev.map(r => (r.id === logoutRow.id ? { ...r, ...changes } : r)));
                await logActivity(role, "BUS_DEPARTURE", `Bus Departed: ${logoutRow.templateno} (Ref: ${ticketRefInput})`, "BusTrips");
                setLogoutRow(null);
            }
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteRow) return;
        try {
            const response = await fetch(`${API_URL}/${deleteRow.id}`, { method: "DELETE" });
            if (response.ok) {
                await logActivity(role, "DELETE_TRIP", `Deleted Trip ${deleteRow.templateno || deleteRow.templateNo}`, "BusTrips");
                setRecords(prev => prev.filter((r) => r.id !== deleteRow.id));
            }
        } catch (error) { console.error("Error deleting:", error); }
        finally { setDeleteRow(null); }
    };

    const handleUpdateRecord = async (updatedData) => {
        try {
            const response = await fetch(`${API_URL}/${updatedData.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });
            if (response.ok) {
                const savedItem = await response.json();
                await logActivity(role, "UPDATE_TRIP", `Updated Trip ${savedItem.templateNo}`, "BusTrips");
                setRecords(prev => prev.map(r => (r.id === savedItem._id ? { ...savedItem, id: savedItem._id } : r)));
                setEditRow(null);
            }
        } catch (error) { console.error("Error updating:", error); }
    };

    const handleArchive = async (rowToArchive) => {
        setArchiveRow(rowToArchive);
    };

    const confirmArchive = async () => {
        if (!archiveRow) return;
        const row = archiveRow;
        
        try {
            const archiveRes = await fetch("http://localhost:3000/api/archives", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "Bus Trip",
                    description: `Trip: ${row.templateno} - ${row.route}`,
                    originalData: row,
                    archivedBy: role
                })
            });
            if (!archiveRes.ok) throw new Error("Failed to archive");

            // DELETE
            const deleteRes = await fetch(`${API_URL}/${row.id}`, { method: "DELETE" });
            if (!deleteRes.ok) throw new Error("Failed to delete");

            await logActivity(role, "ARCHIVE_TRIP", `Archived Trip ${row.templateno}`, "BusTrips");
            setRecords(prev => prev.filter((r) => r.id !== row.id));

        } catch (error) {
            console.error("Error archiving:", error);
            alert("Failed to archive record.");
        } finally {
            setArchiveRow(null);
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return "";
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

    const getTemplatesForCurrentCompany = () => {
        const companyKey = newBusData.company.toLowerCase();
        const routes = busCompanyRoutes[companyKey];
        return routes ? Object.keys(routes) : [];
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
            "Template No", "Ticket Ref", "Route", "Price", "Time", "Departure", "Date", "Company", "Status"
        ]
        : ["Template No", "Ticket Ref", "Route", "Price", "Time", "Departure", "Date", "Company", "Status"];

    return (
        <Layout title="Bus Trips Management">
            <div className="mb-6">
                <StatCardGroupBus
                    totalTrips={totalTrips}
                    paidTrips={paidTrips}
                    pendingTrips={pendingTrips}
                    totalRevenue={totalRevenue}
                />
            </div>
            <div className="px-4 lg:px-8">
                <div className="flex flex-col gap-4 w-full">
                    <BusTripFilters
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        selectedCompany={selectedCompany}
                        setSelectedCompany={setSelectedCompany}
                        uniqueCompanies={uniqueCompanies}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-2">
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

                        <div className={`flex flex-wrap items-center justify-end gap-3 ${isSelectionMode ? 'ml-auto' : 'w-full'}`}>
                            {(role === "bus") && (
                                <button
                                    onClick={() => setShowSubmitModal(true)}
                                    disabled={isReporting}
                                    className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
                                >
                                    <FileText size={18} />
                                    <span>Submit Report</span>
                                </button>
                            )}

                            <button onClick={handleAddClick} className="flex items-center cursor-pointer justify-center bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
                            title='Add Bus'>
                                <span>+ Add Bus</span>
                            </button>

                            <ExportMenu
                                title='Download Options'
                                onExportExcel={handleExportExcel}
                                onExportPDF={handleExportPDF}
                            />

                            <button
                                onClick={() => setShowLogModal(true)}
                                className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-4 h-[42px] rounded-xl shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
                                title="View Logs"
                            >
                                <History size={18} />
                                <span className="hidden sm:inline">Logs</span>
                            </button>

                            {(role === "bus") && (<button
                                onClick={toggleSelectionMode}
                                title={isSelectionMode ? "Cancel Selection" : "Select Records"}
                                className={`flex items-center justify-center h-10 w-10 sm:w-auto sm:px-3 cursor-pointer rounded-xl transition-all border ${isSelectionMode
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
                        data={paginatedData.map((bus) => {
                            const baseData = {
                                id: bus.id,
                                templateno: bus.templateNo || bus.templateno,
                                route: bus.route,
                                price: `₱${bus.price || 75}`,
                                time: formatTime(bus.time),
                                rawTime: bus.time,
                                departure: formatTime(bus.departureTime),
                                rawDepartureTime: bus.departureTime,
                                date: bus.date ? new Date(bus.date).toLocaleDateString() : "",
                                rawDate: bus.date,
                                company: bus.company,
                                status: bus.status,
                                ticketref: bus.ticketReferenceNo || "-"
                            };

                            if (isSelectionMode) {
                                return {
                                    select: (
                                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(bus.id)}
                                                onChange={() => toggleSelect(bus.id)}
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
                            const selectedRecord = records.find(r => r.id === row.id) || row;

                            return (
                                <div className="flex justify-end items-center space-x-2">
                                    {row.status === "Pending" && (
                                        <button
                                            onClick={() => handleLogoutClick(row)}
                                            title="Log Out (Depart)"
                                            className="p-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all flex items-center gap-1 px-2"
                                        >
                                            <LogOut size={16} />
                                            <span className="text-xs font-medium">Depart</span>
                                        </button>
                                    )}
                                    <TableActions
                                        onView={() => setViewRow(row)}
                                        onEdit={() => setEditRow(row)}
                                        onDelete={() => setDeleteRow(row)}
                                    />
                                    <button onClick={() => handleArchive(selectedRecord)} className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 cursor-pointer hover:bg-yellow-100" title="Archive">
                                        <Archive size={16} />
                                    </button>

                                    {(role === "superadmin") && (
                                        <button
                                            onClick={() => setDeleteRow(selectedRecord)}
                                            className="p-1.5 rounded-lg bg-red-50 text-red-600  cursor-pointer hover:bg-red-100"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            );
                        }}
                    />
                )}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filtered.length}
                    onItemsPerPageChange={setItemsPerPage}
                />
            </div>

            <LogModal
                isOpen={showLogModal}
                onClose={() => setShowLogModal(false)}
            />

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                        <h3 className="mb-4 text-xl font-bold text-slate-800">Add New Bus Trip</h3>
                        <form onSubmit={handleCreateRecord}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                                    <div className="flex p-1 bg-slate-100 rounded-lg">
                                        {["Dindo", "Alga", "Ceres", "Lizamae"].map((company) => (
                                            <button
                                                type="button"
                                                key={company}
                                                onClick={() => setNewBusData({
                                                    ...newBusData,
                                                    company,
                                                    templateNo: "",
                                                    route: ""
                                                })}
                                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newBusData.company === company
                                                    ? "bg-white text-emerald-600 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                                    }`}
                                            >
                                                {company}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Template No.</label>
                                    <select
                                        required
                                        value={newBusData.templateNo}
                                        onChange={handleTemplateChange}
                                        className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                                    >
                                        <option value="">Select Template</option>
                                        {getTemplatesForCurrentCompany().map(key => (
                                            <option key={key} value={key}>{key}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Route</label>
                                    <input
                                        type="text"
                                        value={newBusData.route}
                                        readOnly
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-500 cursor-not-allowed"
                                        placeholder="Auto-filled based on template"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Arrival Time</label>
                                        <input
                                            type="time"
                                            value={newBusData.time}
                                            onChange={(e) => setNewBusData({ ...newBusData, time: e.target.value })}
                                            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={newBusData.date}
                                            onChange={(e) => setNewBusData({ ...newBusData, date: e.target.value })}
                                            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 border border-blue-100 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    Status will be set to <strong>Pending</strong>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                                >
                                    Save Bus Trip
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {logoutRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl transform transition-all">
                        <div className="mb-4 flex items-center gap-3 text-emerald-600">
                            <div className="p-2 bg-emerald-100 rounded-full">
                                <CheckCircle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Confirm Departure</h3>
                        </div>

                        <p className="text-sm text-slate-600 mb-4">
                            You are about to log out bus <strong>{logoutRow.templateno}</strong> ({logoutRow.company}).
                            Please enter the ticket reference number to proceed.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ticket Reference No.</label>
                            <input
                                type="text"
                                autoFocus
                                placeholder="Enter reference number..."
                                value={ticketRefInput}
                                onChange={(e) => setTicketRefInput(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                        </div>

                        <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 border border-yellow-100 mb-4">
                            Status will change from <strong>Pending</strong> to <strong>Paid</strong>.
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setLogoutRow(null)}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                disabled={!ticketRefInput}
                                className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm ${ticketRefInput
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-emerald-300 cursor-not-allowed"
                                    }`}
                            >
                                Confirm Departure
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md cursor-pointer rounded-xl bg-white p-6 shadow-xl transform transition-all scale-100">
                        <h3 className="text-lg font-bold text-slate-800">Submit Report</h3>
                        <p className="mt-2 text-sm text-slate-600">
                            Are you sure you want to capture and submit the current bus trips report?
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

            {viewRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
                        <h3 className="mb-4 text-base font-semibold text-slate-800">View Bus Trip</h3>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                            <Field label="Template No" value={viewRow.templateno} />
                            <Field label="Route" value={viewRow.route} />
                            <Field label="Scheduled Time" value={viewRow.time} />
                            <Field label="Departure" value={viewRow.departure || "-"} />
                            <Field label="Date" value={viewRow.date} />
                            <Field label="Company" value={viewRow.company} />
                            <Field label="Status" value={viewRow.status} />
                            <Field label="Ticket Ref" value={viewRow.ticketref || "N/A"} />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {editRow && (
                <EditBusTrip
                    row={editRow}
                    onClose={() => setEditRow(null)}
                    onSave={(updated) => {
                        setRecords(prev => prev.map((r) => (r.id === updated.id ? updated : r)));
                        setEditRow(null);
                    }}
                />
            )}

            {archiveRow && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setArchiveRow(null);
                        }
                    }}
                >
                    <div
                        className="w-full max-w-md rounded-2xl bg-white px-8 py-7 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                                <Archive size={24} />
                            </div>

                            <h3 className="text-lg font-semibold text-slate-900">
                                Confirm Archiving
                            </h3>

                            <p className="mt-2 text-sm text-slate-700">
                                Are you sure you want to move{" "}
                                <span className="font-semibold">
                                    Template #{archiveRow.templateNo}
                                </span>{" "}
                                to the Archives?
                            </p>

                            <p className="mt-1 text-xs font-medium text-red-500">
                                This item will be permanently removed from the active bus trips
                                list.
                            </p>

                            <div className="mt-6 flex w-full justify-center gap-3">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setArchiveRow(null);
                                    }}
                                    className="w-32 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        confirmArchive(); 
                                    }}
                                    className="w-32 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-amber-500"
                                >
                                    Yes, Archive
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DeleteModal
                isOpen={!!deleteRow}
                onClose={() => setDeleteRow(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Record"
                message="Are you sure you want to remove this bus record? This action cannot be undone."
                itemName={deleteRow ? `Template No - #${deleteRow.templateno} - ${deleteRow.route} - ${deleteRow.company}` : ""}
            />

            {role === "superadmin" && showNotify && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow">
                        <h3 className="mb-4 text-base font-semibold text-slate-800">Send Notification</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={notifyDraft.title}
                                    onChange={(e) => setNotifyDraft({ ...notifyDraft, title: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                                <textarea
                                    value={notifyDraft.message}
                                    onChange={(e) => setNotifyDraft({ ...notifyDraft, message: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 outline-none"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setShowNotify(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Cancel</button>
                            <button onClick={() => {
                                const raw = localStorage.getItem("ibt_notifications");
                                const list = raw ? JSON.parse(raw) : [];
                                list.push({ id: Date.now(), title: notifyDraft.title, message: notifyDraft.message, date: new Date().toISOString().slice(0, 10), source: "Bus Trips" });
                                localStorage.setItem("ibt_notifications", JSON.stringify(list));
                                setShowNotify(false);
                                setNotifyDraft({ title: "", message: "" });
                            }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700">Send</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
>>>>>>> 4d573b902a8c9f9ff61a849107027e7e5fe8d252
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- EXPORT TO PDF ---
  const handleExportPDF = () => {
    if (filtered.length === 0) {
      alert("No records to export.");
      return;
    }

    const dataToExport = getExportData();
    const headers = Object.keys(dataToExport[0]);
    const body = dataToExport.map((item) => Object.values(item));

    const doc = new jsPDF("landscape", "mm", "a4");

    doc.setFontSize(16);
    doc.setTextColor(34, 34, 34);
    doc.text("Bus Trips Report", 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [headers],
      body: body,
      theme: "grid",
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 8,
        halign: "center",
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        valign: "middle",
        textColor: [51, 51, 51],
      },
      alternateRowStyles: {
        fillColor: [240, 255, 240],
      },
    });

    doc.save(`Bus_Trips_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // --- SELECTION HANDLERS ---
  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setSelectedIds([]);
    }
    setIsSelectionMode(!isSelectionMode);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = paginatedData.map((item) => item.id);
      setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    } else {
      const pageIds = paginatedData.map((item) => item.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.includes(item.id));

  // --- BULK DELETE HANDLER ---
  const handleBulkDelete = async () => {
    const confirmMsg =
      role === "bus"
        ? `Request deletion for ${selectedIds.length} records?`
        : `Are you sure you want to permanently delete ${selectedIds.length} records?`;

    if (!window.confirm(confirmMsg)) return;

    setIsLoading(true);
    try {
      if (role === "bus") {
        const requestPromises = selectedIds.map(async (id) => {
          const item = records.find((r) => r.id === id);
          if (!item) return;

          return fetch("http://localhost:3000/api/deletion-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemType: "Bus Trip",
              itemDescription: `Template: ${item.templateNo || item.templateno} - ${item.route}`,
              requestedBy: "Bus Admin",
              originalData: item,
              reason: "Bulk deletion request",
            }),
          });
        });

        await Promise.all(requestPromises);
        await logActivity(
          role,
          "REQUEST_BULK_DELETE",
          `Requested deletion for ${selectedIds.length} bus trips`,
          "BusTrips",
        );
        await sendNotification(
          "Deletion Request: Bus Trips",
          `Bus Admin has requested to delete ${selectedIds.length} bus trip records. Please review in deletion requests.`,
          "Bus Trips",
          "superadmin",
        );

        alert(
          `Sent deletion requests for ${selectedIds.length} records. Superadmin has been notified.`,
        );
        setSelectedIds([]);
        setIsSelectionMode(false);
      } else {
        const deletePromises = selectedIds.map((id) =>
          fetch(`${API_URL}/${id}`, { method: "DELETE" }),
        );

        await Promise.all(deletePromises);
        await logActivity(
          role,
          "BULK_DELETE",
          `Deleted ${selectedIds.length} bus trips via bulk action`,
          "BusTrips",
        );

        alert(`Successfully deleted ${selectedIds.length} records`);
        await fetchBusTrips();
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

  // --- EXISTING HANDLERS ---
  const handleSubmitReport = async () => {
    setIsReporting(true);
    try {
      const to12HourFormat = (timeStr) => {
        if (!timeStr) return "-";
        try {
          return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        } catch (e) {
          return timeStr;
        }
      };

      const formattedData = filtered.map((item) => {
        const { createdAt, updatedAt, isArchived, __v, _id, ...rest } = item;
        return {
          ...rest,
          date: rest.date ? new Date(rest.date).toLocaleDateString() : "-",
          time: to12HourFormat(rest.time),
          departureTime: to12HourFormat(rest.departureTime || ""),
        };
      });

      const reportPayload = {
        screen: "Bus Trips Management",
        generatedDate: new Date().toLocaleString(),
        filters: {
          searchQuery,
          selectedDate: selectedDate
            ? new Date(selectedDate).toLocaleDateString()
            : "None",
          selectedCompany,
        },
        statistics: {
          totalRecords: records.length,
          displayedRecords: filtered.length,
        },
        data: formattedData,
      };

      await submitPageReport("Bus Trips", reportPayload, "Admin");

      await sendNotification(
        "Report Submitted: Bus Report",
        `A Bus Trips report was successfully submitted by ${role === "bus" ? "Bus Admin" : "Admin"}.`,
        "Bus Trips",
      );

      const deletePromises = filtered.map((item) =>
        fetch(`${API_URL}/${item.id}`, { method: "DELETE" }),
      );

      await Promise.all(deletePromises);
      alert("Report submitted successfully!");
      setShowSubmitModal(false);
      fetchBusTrips();
    } catch (error) {
      console.error(error);
      alert("Failed to process report. Please try again.");
    } finally {
      setIsReporting(false);
    }
  };

  const handleAddClick = () => {
    setNewBusData({
      templateNo: "",
      route: "",
      company: "Dindo",
      time: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: new Date().toISOString().split("T")[0],
      status: "Pending",
    });
    setShowAddModal(true);
  };

  const handleTemplateChange = (e) => {
    const tempNo = e.target.value;
    setNewBusData((prev) => ({
      ...prev,
      templateNo: tempNo,
      route: TEMPLATE_ROUTES[tempNo] || "",
    }));
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBusData),
      });
      if (response.ok) {
        const newItem = await response.json();
        await logActivity(
          role,
          "CREATE_TRIP",
          `Created Trip ${newItem.templateNo} - ${newItem.route}`,
          "BusTrips",
        );
        fetchBusTrips();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error("Error creating:", error);
    }
  };

  const handleLogoutClick = (row) => {
    setLogoutRow(row);
    setTicketRefInput("");
  };

  const confirmLogout = async () => {
    if (!logoutRow || !ticketRefInput) return;

    const changes = {
      ticketReferenceNo: ticketRefInput,
      status: "Paid",
      departureTime: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    try {
      const response = await fetch(`${API_URL}/${logoutRow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });

      if (response.ok) {
        setRecords((prev) =>
          prev.map((r) => (r.id === logoutRow.id ? { ...r, ...changes } : r)),
        );
        await logActivity(
          role,
          "BUS_DEPARTURE",
          `Bus Departed: ${logoutRow.templateno} (Ref: ${ticketRefInput})`,
          "BusTrips",
        );
        setLogoutRow(null);
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    try {
      const response = await fetch(`${API_URL}/${deleteRow.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await logActivity(
          role,
          "DELETE_TRIP",
          `Deleted Trip ${deleteRow.templateno || deleteRow.templateNo}`,
          "BusTrips",
        );
        setRecords((prev) => prev.filter((r) => r.id !== deleteRow.id));
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setDeleteRow(null);
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
        const savedItem = await response.json();
        await logActivity(
          role,
          "UPDATE_TRIP",
          `Updated Trip ${savedItem.templateNo}`,
          "BusTrips",
        );
        setRecords((prev) =>
          prev.map((r) =>
            r.id === savedItem._id ? { ...savedItem, id: savedItem._id } : r,
          ),
        );
        setEditRow(null);
      }
    } catch (error) {
      console.error("Error updating:", error);
    }
  };

  const handleArchive = async (rowToArchive) => {
    // Just set the state to open the modal
    setArchiveRow(rowToArchive);
  };

  const confirmArchive = async () => {
    if (!archiveRow) return;
    const row = archiveRow;

    try {
      // 1. Archive
      const archiveRes = await fetch("http://localhost:3000/api/archives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Bus Trip",
          description: `Trip: ${row.templateno} - ${row.route}`,
          originalData: row,
          archivedBy: role,
        }),
      });
      if (!archiveRes.ok) throw new Error("Failed to archive");

      // 2. Delete
      const deleteRes = await fetch(`${API_URL}/${row.id}`, {
        method: "DELETE",
      });
      if (!deleteRes.ok) throw new Error("Failed to delete");

      await logActivity(
        role,
        "ARCHIVE_TRIP",
        `Archived Trip ${row.templateno}`,
        "BusTrips",
      );
      setRecords((prev) => prev.filter((r) => r.id !== row.id));
    } catch (error) {
      console.error("Error archiving:", error);
      alert("Failed to archive record.");
    } finally {
      setArchiveRow(null);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return timeStr;
    }
  };

  // --- HELPER FOR TEMPLATE FILTERING ---
  const getTemplatesForCurrentCompany = () => {
    const companyKey = newBusData.company.toLowerCase();
    const routes = busCompanyRoutes[companyKey];
    return routes ? Object.keys(routes) : [];
  };

  // --- TABLE COLUMNS SETUP ---
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
        "Template No",
        "Ticket Ref",
        "Route",
        "Price",
        "Time",
        "Departure",
        "Date",
        "Company",
        "Status",
      ]
    : [
        "Template No",
        "Ticket Ref",
        "Route",
        "Price",
        "Time",
        "Departure",
        "Date",
        "Company",
        "Status",
      ];

  return (
    <Layout title="Bus Trips Management">
      {/* --- NEW: ANALYTICS SECTION --- */}
      <div className="mb-6">
        <StatCardGroupBus
          totalTrips={totalTrips}
          paidTrips={paidTrips}
          pendingTrips={pendingTrips}
          totalRevenue={totalRevenue}
        />
      </div>
      {/* ------------------------------- */}

      <div className="px-4 lg:px-8">
        <div className="flex flex-col gap-4 w-full">
          <BusTripFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
            uniqueCompanies={uniqueCompanies}
          />

          {/* CONSOLIDATED ACTION BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-2">
            {/* BULK DELETE BUTTON (Left) */}
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

            {/* PRIMARY/SECONDARY ACTIONS (Right) */}
            <div
              className={`flex flex-wrap items-center justify-end gap-3 ${isSelectionMode ? "ml-auto" : "w-full"}`}
            >
              {role === "bus" && (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  disabled={isReporting}
                  className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <FileText size={18} />
                  <span>Submit Report</span>
                </button>
              )}

              <button
                onClick={handleAddClick}
                className="flex items-center cursor-pointer justify-center bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
                title="Add Bus"
              >
                <span>+ Add Bus</span>
              </button>

              <ExportMenu
                title="Download Options"
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
              />

              {/* LOGS BUTTON */}
              <button
                onClick={() => setShowLogModal(true)}
                className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-4 h-[42px] rounded-xl shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
                title="View Logs"
              >
                <History size={18} />
                <span className="hidden sm:inline">Logs</span>
              </button>

              {/* TOGGLE SELECTION BUTTON */}
              {role === "bus" && (
                <button
                  onClick={toggleSelectionMode}
                  title={
                    isSelectionMode ? "Cancel Selection" : "Select Records"
                  }
                  className={`flex items-center justify-center h-10 w-10 sm:w-auto sm:px-3 cursor-pointer rounded-xl transition-all border ${
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
            data={paginatedData.map((bus) => {
              const baseData = {
                id: bus.id,
                templateno: bus.templateNo || bus.templateno,
                route: bus.route,
                price: `₱${bus.price || 75}`,
                time: formatTime(bus.time),
                rawTime: bus.time,
                departure: formatTime(bus.departureTime),
                rawDepartureTime: bus.departureTime,
                date: bus.date ? new Date(bus.date).toLocaleDateString() : "",
                rawDate: bus.date,
                company: bus.company,
                status: bus.status,
                ticketref: bus.ticketReferenceNo || "-",
              };

              // Add selection checkbox if in selection mode
              if (isSelectionMode) {
                return {
                  select: (
                    <div
                      className="flex items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(bus.id)}
                        onChange={() => toggleSelect(bus.id)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                  ),
                  ...baseData,
                };
              }
              return baseData;
            })}
            actions={(row) => {
              const selectedRecord =
                records.find((r) => r.id === row.id) || row;

              return (
                <div className="flex justify-end items-center space-x-2">
                  {row.status === "Pending" && (
                    <button
                      onClick={() => handleLogoutClick(row)}
                      title="Log Out (Depart)"
                      className="p-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all flex items-center gap-1 px-2"
                    >
                      <LogOut size={16} />
                      <span className="text-xs font-medium">Depart</span>
                    </button>
                  )}
                  <TableActions
                    onView={() => setViewRow(row)}
                    onEdit={() => setEditRow(row)}
                    onDelete={() => setDeleteRow(row)}
                  />
                  <button
                    onClick={() => handleArchive(selectedRecord)}
                    className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 cursor-pointer hover:bg-yellow-100"
                    title="Archive"
                  >
                    <Archive size={16} />
                  </button>

                  {role === "superadmin" && (
                    <button
                      onClick={() => setDeleteRow(selectedRecord)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600  cursor-pointer hover:bg-red-100"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            }}
          />
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filtered.length}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* --- MODALS --- */}

      <LogModal isOpen={showLogModal} onClose={() => setShowLogModal(false)} />

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-slate-800">
              Add New Bus Trip
            </h3>
            <form onSubmit={handleCreateRecord}>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Company
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCompanyModal(true)}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      Manage
                    </button>
                  </div>
                  <div className="flex p-1 bg-slate-100 rounded-lg">
                    {companies.map((company) => (
                      <button
                        type="button"
                        key={company}
                        onClick={() =>
                          setNewBusData({
                            ...newBusData,
                            company,
                            templateNo: "",
                            route: "",
                          })
                        }
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                          newBusData.company === company
                            ? "bg-white text-emerald-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {company}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Template No.
                  </label>
                  <select
                    required
                    value={newBusData.templateNo}
                    onChange={handleTemplateChange}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select Template</option>
                    {getTemplatesForCurrentCompany().map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Route
                  </label>
                  <input
                    type="text"
                    value={newBusData.route}
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-500 cursor-not-allowed"
                    placeholder="Auto-filled based on template"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Arrival Time
                    </label>
                    <input
                      type="time"
                      value={newBusData.time}
                      onChange={(e) =>
                        setNewBusData({ ...newBusData, time: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newBusData.date}
                      onChange={(e) =>
                        setNewBusData({ ...newBusData, date: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 border border-blue-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Status will be set to <strong>Pending</strong>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                >
                  Save Bus Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Manage Companies
              </h3>
              <button onClick={() => setShowCompanyModal(false)}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* ADD COMPANY */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="New company name"
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newCompanyName.trim()) return;
                  if (companies.includes(newCompanyName)) return;
                  setCompanies([...companies, newCompanyName]);
                  setNewCompanyName("");
                }}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white"
              >
                Add
              </button>
            </div>

            {/* COMPANY LIST */}
            <div className="space-y-2">
              {companies.map((company) => (
                <div
                  key={company}
                  className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2"
                >
                  <span className="text-sm">{company}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCompanies(companies.filter((c) => c !== company));
                      if (newBusData.company === company) {
                        setNewBusData({ ...newBusData, company: "" });
                      }
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {logoutRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl transform transition-all">
            <div className="mb-4 flex items-center gap-3 text-emerald-600">
              <div className="p-2 bg-emerald-100 rounded-full">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Confirm Departure
              </h3>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              You are about to log out bus{" "}
              <strong>{logoutRow.templateno}</strong> ({logoutRow.company}).
              Please enter the ticket reference number to proceed.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ticket Reference No.
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Enter reference number..."
                value={ticketRefInput}
                onChange={(e) => setTicketRefInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 border border-yellow-100 mb-4">
              Status will change from <strong>Pending</strong> to{" "}
              <strong>Paid</strong>.
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setLogoutRow(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={!ticketRefInput}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm ${
                  ticketRefInput
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-emerald-300 cursor-not-allowed"
                }`}
              >
                Confirm Departure
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md cursor-pointer rounded-xl bg-white p-6 shadow-xl transform transition-all scale-100">
            <h3 className="text-lg font-bold text-slate-800">Submit Report</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to capture and submit the current bus trips
              report?
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

      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-base font-semibold text-slate-800">
              View Bus Trip
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <Field label="Template No" value={viewRow.templateno} />
              <Field label="Route" value={viewRow.route} />
              <Field label="Scheduled Time" value={viewRow.time} />
              <Field label="Departure" value={viewRow.departure || "-"} />
              <Field label="Date" value={viewRow.date} />
              <Field label="Company" value={viewRow.company} />
              <Field label="Status" value={viewRow.status} />
              <Field label="Ticket Ref" value={viewRow.ticketref || "N/A"} />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setViewRow(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editRow && (
        <EditBusTrip
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={(updated) => {
            // FIXED: Replaced 'persist(next)' with setRecords to avoid undefined error
            setRecords((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r)),
            );
            setEditRow(null);
          }}
        />
      )}

      {archiveRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setArchiveRow(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white px-8 py-7 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                <Archive size={24} />
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                Confirm Archiving
              </h3>

              <p className="mt-2 text-sm text-slate-700">
                Are you sure you want to move{" "}
                <span className="font-semibold">
                  Template #{archiveRow.templateNo}
                </span>{" "}
                to the Archives?
              </p>

              <p className="mt-1 text-xs font-medium text-red-500">
                This item will be permanently removed from the active bus trips
                list.
              </p>

              <div className="mt-6 flex w-full justify-center gap-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setArchiveRow(null);
                  }}
                  className="w-32 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    confirmArchive();
                  }}
                  className="w-32 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-amber-500"
                >
                  Yes, Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteModal
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Record"
        message="Are you sure you want to remove this bus record? This action cannot be undone."
        itemName={
          deleteRow
            ? `Template No - #${deleteRow.templateno} - ${deleteRow.route} - ${deleteRow.company}`
            : ""
        }
      />

      {role === "superadmin" && showNotify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow">
            <h3 className="mb-4 text-base font-semibold text-slate-800">
              Send Notification
            </h3>
            <div className="space-y-3">
              {/* FIXED: Replaced undefined Input/Textarea with standard HTML + Tailwind */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={notifyDraft.title}
                  onChange={(e) =>
                    setNotifyDraft({ ...notifyDraft, title: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  value={notifyDraft.message}
                  onChange={(e) =>
                    setNotifyDraft({ ...notifyDraft, message: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 outline-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowNotify(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const raw = localStorage.getItem("ibt_notifications");
                  const list = raw ? JSON.parse(raw) : [];
                  list.push({
                    id: Date.now(),
                    title: notifyDraft.title,
                    message: notifyDraft.message,
                    date: new Date().toISOString().slice(0, 10),
                    source: "Bus Trips",
                  });
                  localStorage.setItem(
                    "ibt_notifications",
                    JSON.stringify(list),
                  );
                  setShowNotify(false);
                  setNotifyDraft({ title: "", message: "" });
                }}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:bg-emerald-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BusTrips;
