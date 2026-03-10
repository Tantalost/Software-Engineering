import React, { useState, useMemo, useEffect } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import DeleteModal from "../components/common/DeleteModal";
import LostFoundStatusFilter from "../components/lostfound/LostFoundStatusFilter";
import LogModal from "../components/common/LogModal";
import { submitPageReport } from "../utils/reportService.js";
import { logActivity } from "../utils/logger";
import { sendNotification } from "../utils/notificationService.js";
import {
  Archive,
  Trash2,
  Package,
  FileText,
  Calendar,
  MapPin,
  Loader2,
  History,
  ListChecks,
  X,
  Tag,
  Save,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";

import NotificationToast from "../components/common/NotificationToast";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import headerImg from "../assets/Header.png";
import footerImg from "../assets/FOOTER.png";

const formatDateTimeForExport = (dateStr) => {
  if (!dateStr) return "-";
  return (
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }) +
    " " +
    new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  );
};

// Need to clean
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
  const [editFormData, setEditFormData] = useState({});
  const [deleteRow, setDeleteRow] = useState(null);
  const [archiveRow, setArchiveRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [isReporting, setIsReporting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const role = localStorage.getItem("authRole") || "superadmin";
  const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/lostfound`;

  const [newItem, setNewItem] = useState({
    trackingNo: "",
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
    fetchLostFound();
  }, []);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    return (
      new Date(dateStr).toLocaleDateString() +
      " " +
      new Date(dateStr).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  useEffect(() => {
    if (editRow) {
      setEditFormData({
        ...editRow,
      });
    }
  }, [editRow]);

  const [notificationState, setNotificationState] = useState({
    isOpen: false,
    type: "",
    message: "",
    autoClose: true,
    duration: 3000,
  });

  useEffect(() => {
    if (notificationState.isOpen && notificationState.autoClose) {
      const timer = setTimeout(() => {
        setNotificationState({
          isOpen: false,
          type: "",
          message: "",
          autoClose: true,
          duration: 3000,
        });
      }, notificationState.duration);
      return () => clearTimeout(timer);
    }
  }, [
    notificationState.isOpen,
    notificationState.autoClose,
    notificationState.duration,
  ]);
  const handleAddClick = () => {
    const autoTracking = `LF-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const formattedNow = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 16);

    setNewItem({
      trackingNo: autoTracking,
      itemType: "",
      location: "",
      dateTime: formattedNow,
      status: "Unclaimed",
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

        logActivity(
          role,
          "CREATE_LOSTFOUND",
          `Logged Item #${created.trackingNo}`,
          "LostFound",
        );

        fetchLostFound();
        setShowAddModal(false);

        // Success Toast
        setNotificationState({
          isOpen: true,
          type: "success",
          message: "New item added successfully!",
          autoClose: true,
          duration: 3000,
        });
      } else {
        throw new Error("Failed to create item");
      }
    } catch (error) {
      console.error("Error creating item:", error);

      //  Error Toast
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Failed to add new item.",
        autoClose: true,
        duration: 3000,
      });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/${editFormData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        logActivity(
          role,
          "UPDATE_LOSTFOUND",
          `Updated Item #${editFormData.trackingNo}`,
          "LostFound",
        );

        fetchLostFound();
        setEditRow(null);

        // Success Toast
        setNotificationState({
          isOpen: true,
          type: "success",
          message: "Changes saved successfully!",
          autoClose: true,
          duration: 3000,
        });
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error("Error updating:", error);

      //  Error Toast
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Failed to save changes.",
        autoClose: true,
        duration: 3000,
      });
    }
  };

  const confirmArchive = async () => {
    if (!archiveRow) return;
    const row = archiveRow;
    setArchiveRow(null);

    try {
      const idToArchive = row._id || row.id;
      if (!idToArchive) throw new Error("Record ID is missing.");

      const archiveRes = await fetch(`${API_URL}/${idToArchive}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!archiveRes.ok) throw new Error("Failed to archive");

      logActivity(
        role,
        "ARCHIVE_LOSTFOUND",
        `Archived Item #${row.trackingNo}`,
        "LostFound",
      );
      fetchLostFound();

      // Success Toast
      setNotificationState({
        isOpen: true,
        type: "success",
        message: "Item archived successfully!",
        autoClose: true,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error archiving:", error);
      // Error Toast
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Failed to archive item.",
        autoClose: true,
        duration: 3000,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    try {
      const response = await fetch(`${API_URL}/${deleteRow.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        logActivity(
          role,
          "DELETE_LOSTFOUND",
          `Deleted Item #${deleteRow.trackingNo}`,
          "LostFound",
        );
        setRecords((prev) => prev.filter((r) => r.id !== deleteRow.id));

        // Success Toast
        setNotificationState({
          isOpen: true,
          type: "success",
          message: "Item permanently deleted!",
          autoClose: true,
          duration: 3000,
        });
      } else throw new Error("Delete failed");
    } catch (error) {
      console.error("Error deleting:", error);
      // Error Toast
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Failed to delete item.",
        autoClose: true,
        duration: 3000,
      });
    } finally {
      setDeleteRow(null);
    }
  };

  const filtered = records.filter((item) => {
    const matchesSearch =
      item.trackingNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.itemType &&
        item.itemType.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDate =
      !selectedDate ||
      new Date(item.dateTime).toDateString() ===
        new Date(selectedDate).toDateString();

    const matchesStatus =
      activeStatus === "All" ||
      item.status.toLowerCase() === activeStatus.toLowerCase();

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

  const handleBulkDelete = async () => {
    setIsLoading(true);
    try {
      if (role === "lostfound") {
        const requestPromises = selectedIds.map(async (id) => {
          const item = records.find((r) => r.id === id);
          if (!item) return;

          return fetch(`${API_URL}/deletion-requests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemType: "Lost & Found Item",
              requestedBy: "LostFound Admin",
              originalData: item,
              reason: "Bulk deletion request",
            }),
          });
        });

        await Promise.all(requestPromises);
        logActivity(
          role,
          "REQUEST_BULK_DELETE",
          `Requested deletion for ${selectedIds.length} items`,
          "LostFound",
        );

        sendNotification(
          "Deletion Request: Lost & Found",
          `Lost & Found Admin has requested to delete ${selectedIds.length} records.`,
          "Lost & Found",
          "superadmin",
        );

        // Success Toast (Request)
        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Sent deletion requests for ${selectedIds.length} records. Superadmin notified.`,
          autoClose: true,
          duration: 3000,
        });

        setSelectedIds([]);
        setIsSelectionMode(false);
      } else {
        const deletePromises = selectedIds.map((id) =>
          fetch(`${API_URL}/${id}`, { method: "DELETE" }),
        );

        await Promise.all(deletePromises);
        logActivity(
          role,
          "BULK_DELETE",
          `Deleted ${selectedIds.length} items via bulk action`,
          "LostFound",
        );

        // Success Toast (Direct Delete)
        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Successfully deleted ${selectedIds.length} records.`,
          autoClose: true,
          duration: 3000,
        });

        fetchLostFound();
        setSelectedIds([]);
        setIsSelectionMode(false);
      }
    } catch (error) {
      console.error("Bulk action failed", error);
      // Error Toast
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Failed to process some records.",
        autoClose: true,
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    setIsReporting(true);
    try {
      const formattedData = filtered.map((item) => {
        const { createdAt, updatedAt, isArchived, __v, _id, ...rest } = item;
        return {
          ...rest,
          dateTime: rest.dateTime
            ? new Date(rest.dateTime).toLocaleString("en-US", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : "-",
        };
      });

      const reportPayload = {
        screen: "Lost & Found Log",
        generatedDate: new Date().toLocaleString(),
        filters: {
          searchQuery,
          selectedDate: selectedDate
            ? new Date(selectedDate).toLocaleDateString()
            : "None",
          activeStatus,
        },
        statistics: {
          totalItems: records.length,
          displayedItems: filtered.length,
          unclaimed: filtered.filter((i) => i.status === "Unclaimed").length,
          claimed: filtered.filter((i) => i.status === "Claimed").length,
        },
        data: formattedData,
      };

      const adminName =
        localStorage.getItem("authName") || "Lost & Found Admin";
      await submitPageReport("Lost & Found", reportPayload, adminName);

      sendNotification(
        "Report Submitted: Lost & Found Report",
        "A new Lost & Found report has been generated and the active log has been cleared.",
        "Lost & Found",
        "superadmin",
      );

      const deletePromises = filtered.map((item) =>
        fetch(`${API_URL}/${item.id}`, { method: "DELETE" }),
      );

      await Promise.all(deletePromises);

      // Success Toast
      setNotificationState({
        isOpen: true,
        type: "success",
        message: "Report submitted successfully! The table has been cleared.",
        autoClose: true,
        duration: 3000,
      });

      setShowSubmitModal(false);
      fetchLostFound();
    } catch (error) {
      console.error(error);
      // Error Toast
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Failed to submit report.",
        autoClose: true,
        duration: 3000,
      });
    } finally {
      setIsReporting(false);
    }
  };

  const getExportData = (data) => {
    return data.map((item) => ({
      "Tracking No": item.trackingNo,
      "Item Type": item.itemType || "-",
      Location: item.location,
      DateTime: formatDateTimeForExport(item.dateTime),
      Status: item.status,
    }));
  };

  const handleExportExcel = async () => {
    if (filtered.length === 0) {
      showToast("info", "No records to export.");
      return;
    }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Lost and Found Report");

            // 1. ADJUSTED HEADER IMAGE (-1/8 height)
            worksheet.getRow(1).height = 35;
            await addImageToWorksheet(workbook, worksheet, headerImg, 'A1:F4');

            // 2. Title and Summary Metadata
            worksheet.mergeCells('A6:F6');
            const titleCell = worksheet.getCell('A6');
            titleCell.value = 'LOST & FOUND REPORTS';
            titleCell.font = { bold: true, size: 14, color: { argb: 'FFDC2626' } }; // IBT Red
            titleCell.alignment = { horizontal: 'center' };

            worksheet.addRow([]); // Spacer
            worksheet.addRow([`Date: ${new Date().toLocaleDateString()}`, '', '', '', '', `Total Items: ${filtered.length}`]);
            worksheet.addRow([`Claimed: ${filtered.filter(i => i.status === "Claimed").length}`]);
            worksheet.addRow([`Unclaimed: ${filtered.filter(i => i.status === "Unclaimed").length}`]);
            worksheet.addRow([]); // Spacer

            // 3. Table Headers
            const headerRow = worksheet.addRow(["Tracking No", "Item Type", "Location", "Date Time", "Status"]);
            headerRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            // 4. Populate Data
            filtered.forEach(item => {
                const row = worksheet.addRow([
                    item.trackingNo,
                    item.itemType || "-",
                    item.location,
                    formatDateTimeForExport(item.dateTime),
                    item.status,
                ]);

                // Conditional Status Colors
                const statusCell = row.getCell(5);
                if (item.status === 'Claimed') {
                    statusCell.font = { color: { argb: 'FF16A34A' }, bold: true };
                } else {
                    statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
                }
            });

            // 5. ADJUSTED FOOTER IMAGE (-1/8 height)
            const lastRowNumber = worksheet.lastRow.number + 2;
            worksheet.getRow(lastRowNumber).height = 52.5;
            await addImageToWorksheet(workbook, worksheet, footerImg, `A${lastRowNumber}:F${lastRowNumber + 3}`);

            // 6. Formatting Column Widths
            worksheet.columns = [
                { width: 20 }, { width: 20 }, { width: 30 }, { width: 25 }, { width: 15 }, { width: 45 }
            ];

            // 7. Generate and Download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `LostFound_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

            logActivity(role, "EXPORT_EXCEL", `Exported branded report with adjusted image heights`, "LostFound");

        } catch (error) {
            console.error("Excel Export Error:", error);
            alert("Failed to generate branded Excel. Please try again.");
        }
    };

    // --- EXPORT TO CSV (USING EXCELJS) ---
    const handleExportCSV = async () => {
        if (filtered.length === 0) {
            alert("No records to export.");
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("LostFound");

            // Define Columns
            worksheet.columns = [
                { header: "Tracking No", key: "trackingNo", width: 20 },
                { header: "Item Type", key: "itemType", width: 20 },
                { header: "Location", key: "location", width: 30 },
                { header: "Date & Time", key: "dateTime", width: 25 },
                { header: "Status", key: "status", width: 15 },
            ];

            // Add Data
            filtered.forEach(item => {
                worksheet.addRow({
                    trackingNo: item.trackingNo,
                    itemType: item.itemType || "-",
                    location: item.location,
                    dateTime: formatDateTimeForExport(item.dateTime),
                    status: item.status,
                });
            });

            // Write as CSV
            const buffer = await workbook.csv.writeBuffer();
            const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, `LostFound_Report_${new Date().toISOString().split('T')[0]}.csv`);

        } catch (error) {
            console.error("CSV Export Failed:", error);
            alert("Failed to export CSV file.");
        }
    };

  const handleExportPDF = () => {
    if (filtered.length === 0) {
      showToast("info", "No records to export.");
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    if (headerImg) doc.addImage(headerImg, "PNG", 0, 0, pageWidth, 35);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("LOST & FOUND REPORTS", pageWidth / 2, 45, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 55);
    doc.text(`Total Items: ${filtered.length}`, pageWidth - 15, 55, {
      align: "right",
    });
    doc.text(
      `Claimed: ${filtered.filter((i) => i.status === "Claimed").length}`,
      pageWidth - 15,
      61,
      { align: "right" },
    );

        autoTable(doc, {
            startY: 70,
            margin: { bottom: 35 },
            head: [["Tracking No", "Item Type", "Location", "Date Time", "Status"]],
            body: filtered.map(item => [
                item.trackingNo,
                item.itemType || "-",
                item.location,
                formatDateTimeForExport(item.dateTime),
                item.status,
            ]),
            headStyles: { fillColor: [16, 185, 129] },
            styles: { fontSize: 9 },
            didDrawPage: (data) => {

                if (footerImg) doc.addImage(footerImg, "PNG", 0, pageHeight - 30, pageWidth, 30);
            },
        });

    doc.save(`LostFound_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    logActivity(
      role,
      "EXPORT_PDF",
      `Exported ${filtered.length} Lost & Found records to PDF`,
      "LostFound",
    );
  };

  const tableColumns = isSelectionMode
    ? [
        <div key="header-check" className="flex items-center">
          <input
            type="checkbox"
            title="Select All Records on Page"
            checked={isAllSelected}
            onChange={handleSelectAll}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
        </div>,
        "Tracking No",
        "Item Type",
        "Location",
        "Date Time",
        "Status",
      ]
    : ["Tracking No", "Item Type", "Location", "Date Time", "Status"];


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
              {role === "lostfound" && (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  disabled={isReporting}
                  title="Submit Current Report and Clear Table"
                  className="flex items-center justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all w-full sm:w-auto cursor-pointer"
                >
                  <FileText size={18} />
                  <span>Submit Report</span>
                </button>
              )}

              <button
                onClick={handleAddClick}
                title="Add New Item"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-4 py-2.5 h-[44px] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center w-full sm:w-auto cursor-pointer"
              >
                + Add New
              </button>

              <div className="h-[44px] flex items-center" title="Download">
                <ExportMenu
                  onExportCSV={handleExportCSV}
                  onExportPDF={handleExportPDF}
                  onExportExcel={handleExportExcel}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full mb-4">

  {/* LEFT SIDE: Bulk Delete + Status Filter */}
  <div className="flex items-center gap-3">

    {isSelectionMode && selectedIds.length > 0 && (
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-600 px-2 whitespace-nowrap">
          {selectedIds.length} Selected
        </span>

        <button
          onClick={handleBulkDelete}
          title="Delete or Request Deletion for Selected Records"
          className="rounded-lg p-2 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-200 transition-all cursor-pointer"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    )}

    <LostFoundStatusFilter
      activeStatus={activeStatus}
      onStatusChange={setActiveStatus}
    />

  </div>            
            {/* RIGHT SIDE */}
            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowLogModal(true)}
                className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-4 h-[42px] rounded-xl shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
                title="View System Activity Logs"
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
                    title="Delete or Request Deletion for Selected Records"
                    className="rounded-lg p-2 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-200 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )}

              {role == "lostfound" && (
                <button
                  onClick={toggleSelectionMode}
                  title={
                    isSelectionMode
                      ? "Exit Multi-Selection Mode"
                      : "Enter Multi-Selection Mode"
                  }
                  className={`flex items-center justify-center h-10 cursor-pointer w-10 sm:w-auto sm:px-3 rounded-xl transition-all border ${
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
            data={paginatedData.map((item) => {
              const baseData = {
                id: item.id,
                trackingno: item.trackingNo,
                itemtype: item.itemType,
                location: item.location,
                datetime: formatDateTime(item.dateTime || item.createdAt),
                status: item.status,
              };

              if (isSelectionMode) {
                return {
                  select: (
                    <div
                      className="flex items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        title={`Select item #${item.trackingNo}`}
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
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
              const selectedRecord = records.find((r) => r.id === row.id);
              return (
                <div className="flex justify-end items-center space-x-2">
                  <TableActions
                    onView={() => setViewRow(selectedRecord)}
                    onEdit={() => setEditRow(selectedRecord)}
                    onDelete={() => setDeleteRow(selectedRecord)}
                  />
                  <button
                    onClick={() => setArchiveRow(selectedRecord)}
                    title="Move Record to Archives"
                    className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all cursor-pointer"
                  >
                    <Archive size={16} />
                  </button>

                  {role == "superadmin" && (
                    <button
                      onClick={() => setDeleteRow(selectedRecord)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                      title="Permanently Delete Record"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
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

      <LogModal isOpen={showLogModal} onClose={() => setShowLogModal(false)} />

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                Log Lost/Found Item
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                title="Close Modal"
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Item Type
                  </label>
                  <div className="relative">
                    <Tag
                      size={16}
                      className="absolute left-3 top-3 text-slate-400"
                    />
                    <input
                      type="text"
                      value={newItem.itemType}
                      onChange={(e) =>
                        setNewItem({ ...newItem, itemType: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="e.g., Wallet, Keys, Laptop, Book"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tracking Number
                  </label>
                  <div className="relative">
                    <Package
                      size={16}
                      className="absolute left-3 top-3 text-slate-400"
                    />
                    <input
                      type="text"
                      value={newItem.trackingNo}
                      disabled
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-slate-100 "
                      placeholder="LF-123456"
                      required
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date & Time Found/Reported
                  </label>
                  <div className="relative">
                    <Calendar
                      size={16}
                      className="absolute left-3 top-3 text-slate-400"
                    />
                    <input
                      type="datetime-local"
                      value={newItem.dateTime}
                      onChange={(e) =>
                        setNewItem({ ...newItem, dateTime: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white cursor-pointer"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-3 top-3 text-slate-400"
                    />
                    <textarea
                      value={newItem.location}
                      onChange={(e) =>
                        setNewItem({ ...newItem, location: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300"
                      placeholder="Location of the item found..."
                      required
                    />
                  </div>
                </div>

                <input type="hidden" name="status" value={newItem.status} />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  title="Discard Changes"
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  title="Save New Record to System"
                  className="flex-1 py-3 bg-emerald-600 rounded-xl text-white font-medium shadow-md hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-slate-800">
                View Lost/Found Details
              </h3>
              <button
                onClick={() => setViewRow(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <Field label="Tracking No" value={viewRow.trackingNo} />
              <Field label="Type" value={viewRow.itemType} />
              <Field label="Status" value={viewRow.status} />
              <Field
                label="DateTime"
                value={formatDateTime(viewRow.dateTime)}
              />
              <div className="md:col-span-2">
                <Field label="Location" value={viewRow.location} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setViewRow(null)}
                title="Close Details View"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                Edit Lost/Found Item
              </h3>
              <button
                onClick={() => setEditRow(null)}
                title="Close Modal"
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tracking Number
                  </label>
                  <div className="relative">
                    <Package
                      size={16}
                      className="absolute left-3 top-3 text-slate-400"
                    />
                    <input
                      type="text"
                      value={editFormData.trackingNo || ""}
                      disabled
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Item Status
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setEditFormData({
                          ...editFormData,
                          status: "Unclaimed",
                        })
                      }
                      title="Mark Item as Unclaimed"
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border cursor-pointer ${
                        editFormData.status === "Unclaimed"
                          ? "bg-red-50 text-red-600 border-red-200 ring-2 ring-red-500 ring-offset-1"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <XCircle size={18} />
                      Unclaimed
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditFormData({ ...editFormData, status: "Claimed" })
                      }
                      title="Mark Item as Claimed"
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border cursor-pointer ${
                        editFormData.status === "Claimed"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200 ring-2 ring-emerald-500 ring-offset-1"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <CheckCircle size={18} />
                      Claimed
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Item Type
                  </label>
                  <div className="relative">
                    <Tag
                      size={16}
                      className="absolute left-3 top-3 text-slate-400"
                    />
                    <input
                      type="text"
                      value={editFormData.itemType || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          itemType: e.target.value,
                        })
                      }
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date & Time Found
                  </label>
                  <div className="relative">
                    <Calendar
                      size={16}
                      className="absolute left-3 top-3 text-slate-400"
                    />
                    <input
                      type="text"
                      value={formatDateTime(editFormData.dateTime)}
                      disabled
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-3 top-3 text-slate-400"
                    />
                    <textarea
                      value={editFormData.location || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          location: e.target.value,
                        })
                      }
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditRow(null)}
                  title="Cancel Edits"
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  title="Commit Changes to Database"
                  className="flex-1 py-3 bg-emerald-500 rounded-xl text-white font-medium shadow-md hover:bg-emerald-600 transition-all flex justify-center items-center gap-2 cursor-pointer"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {archiveRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl text-center">
            <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Archive size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              Confirm Archiving
            </h3>
            <p className="text-slate-600 mt-2 text-sm">
              Are you sure you want to move{" "}
              <strong>#{archiveRow.trackingNo}</strong> to archives?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setArchiveRow(null)}
                title="Cancel Archive Action"
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                title="Confirm and Archive Item"
                className="flex-1 py-2.5 bg-yellow-500 rounded-lg text-white font-medium hover:bg-yellow-600 shadow-lg cursor-pointer"
              >
                Yes, Archive
              </button>
            </div>
          </div>
        </div>
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
              Are you sure you want to capture and submit the current Lost &
              Found report?
              <br />
              <span className="text-red-500 font-semibold text-xs">
                Note: This will clear the current table for new entries.
              </span>
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                title="Go Back to Table"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={isReporting}
                title="Confirm Submission and Reset Table"
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
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
      <NotificationToast
        isOpen={notificationState.isOpen}
        type={notificationState.type}
        message={notificationState.message}
        onClose={() =>
          setNotificationState({
            isOpen: false,
            type: "",
            message: "",
            autoClose: true,
            duration: 3000,
          })
        }
      />
    </Layout>
  );
};

export default LostFound;
