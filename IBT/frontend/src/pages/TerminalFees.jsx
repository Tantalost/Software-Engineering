import React, { useState, useMemo, useEffect } from "react";
import {
  Archive,
  Trash2,
  Plus,
  X,
  CheckCircle,
  Clock,
  Loader2,
  History,
  ListChecks,
  FileText,
  Settings,
  User,
  ChevronLeft,   
  ChevronRight,  
  Calendar
} from "lucide-react";
import jsPDF from "jspdf";
import headerImg from "../assets/Header.png";
import footerImg from "../assets/FOOTER.png";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Layout from "../components/layout/Layout";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import NotificationToast from "../components/common/NotificationToast";
import ViewModal from "../components/common/ViewModal";
import DeleteModal from "../components/common/DeleteModal";
import LogModal from "../components/common/LogModal";
import SecurityCheckModal from "../components/common/SecurityCheckModal";
import RequestDeletionModal from "../components/common/RequestDeletionModal";
import SharedSubmitReportModal from "../components/common/SharedSubmitReportModal.jsx";
import StatCardGroupTerminal from "../components/terminal/StatCardGroupTerminal";
import TerminalFilter from "../components/terminal/TerminalFilter";
import { logActivity } from "../utils/logger";
import { submitPageReport } from "../utils/reportService";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api`;

const getInitialBasePrices = () => {
  const storedPrices = localStorage.getItem("terminalBasePrices");
  if (storedPrices) {
    try {
      return JSON.parse(storedPrices);
    } catch (e) {
      console.error("Error parsing base prices from localStorage", e);
    }
  }
  return {
    regular: 15.0,
    discounted: 10.0,
  };
};
const addImageToWorksheet = async (workbook, worksheet, imageSrc, range) => {
  if (!imageSrc) return;
  try {
    const response = await fetch(imageSrc);
    if (!response.ok)
      throw new Error(`Failed to fetch image: ${response.statusText}`);

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const imageId = workbook.addImage({
      buffer: arrayBuffer,
      extension: "png",
    });

    worksheet.addImage(imageId, range);
  } catch (error) {
    console.error("Terminal Fees branding image failed:", error);
  }
};

const TerminalFees = () => {
  const role = localStorage.getItem("authRole") || "superadmin";
  const operatorName =
    localStorage.getItem("authName") ||
    localStorage.getItem("authEmail") ||
    "Admin";
  const asOfDateLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeType, setActiveType] = useState("All");
  const [dateFilterType, setDateFilterType] = useState("Daily");
  const [currentDateRange, setCurrentDateRange] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAutoTicket, setIsAutoTicket] = useState(true);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [archiveRow, setArchiveRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [basePrices, setBasePrices] = useState(getInitialBasePrices);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingEdit, setPendingEdit] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [deleteRemarks, setDeleteRemarks] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPreviousShiftModal, setShowPreviousShiftModal] = useState(false);
  const [previousShiftReports, setPreviousShiftReports] = useState([]);
  const [isPreviousShiftLoading, setIsPreviousShiftLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [collectorName, setCollectorName] = useState("");
  const [collectorId, setCollectorId] = useState("");
  const [collectors, setCollectors] = useState([]);
  const [sessionStartedAt] = useState(() => new Date().toISOString());
  const authAdminId = localStorage.getItem("authAdminId") || "";
  const authEmail = (localStorage.getItem("authEmail") || "").toLowerCase();
  const assignedShiftValue = localStorage.getItem("authShift") || "";
  const REPORTS_API_URL = `${API_URL}/reports`;

  const getRangeBounds = (type, date) => {
    const start = new Date(date);
    const end = new Date(date);

    if (type === "Daily") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (type === "Week") {
      const day = start.getDay(); 
      const diff = start.getDate() - day;
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(diff + 6);
      end.setHours(23, 59, 59, 999);
    } else if (type === "Month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0); 
      end.setHours(23, 59, 59, 999);
    } else if (type === "Year") {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  };

  const { start: filterStart, end: filterEnd } = getRangeBounds(dateFilterType, currentDateRange);

  const handlePrevPeriod = () => {
    const newDate = new Date(currentDateRange);
    if (dateFilterType === "Daily") newDate.setDate(newDate.getDate() - 1);
    else if (dateFilterType === "Week") newDate.setDate(newDate.getDate() - 7);
    else if (dateFilterType === "Month") newDate.setMonth(newDate.getMonth() - 1);
    else if (dateFilterType === "Year") newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentDateRange(newDate);
    setCurrentPage(1);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(currentDateRange);
    if (dateFilterType === "Daily") newDate.setDate(newDate.getDate() + 1);
    else if (dateFilterType === "Week") newDate.setDate(newDate.getDate() + 7);
    else if (dateFilterType === "Month") newDate.setMonth(newDate.getMonth() + 1);
    else if (dateFilterType === "Year") newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentDateRange(newDate);
    setCurrentPage(1);
  };

  const getPeriodDisplayStr = () => {
    const { start, end } = getRangeBounds(dateFilterType, currentDateRange);
    if (dateFilterType === "Daily") {
      return start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    } else if (dateFilterType === "Week") {
      const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${startStr} - ${endStr}`;
    } else if (dateFilterType === "Month") {
      return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else if (dateFilterType === "Year") {
      return start.getFullYear().toString();
    }
  };

  const [newTicket, setNewTicket] = useState({
    ticketNo: "",
    passengerType: "Regular",
    price: 15.0,
    date: "",
    time: "",
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

  useEffect(() => {
    const fetchCollectors = async () => {
      try {
        const res = await fetch(`${API_URL}/collectors?active=true`);
        if (!res.ok) return;
        const data = await res.json();
        setCollectors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching collectors:", error);
      }
    };

    fetchCollectors();
  }, []);

  const fetchPreviousShiftReports = async () => {
    if (role !== "ticket") return;
    setIsPreviousShiftLoading(true);
    try {
      const res = await fetch(REPORTS_API_URL);
      if (!res.ok) throw new Error("Failed to load reports.");
      const data = await res.json();

      const ownReports = (Array.isArray(data) ? data : [])
        .filter((report) => {
          const reportType = report?.reportType || report?.data?.reportType || "";
          if (reportType !== "TerminalFee") return false;

          const reportAdminId = report?.data?.adminId;
          const reportEmail = String(report?.data?.submittedByEmail || "").toLowerCase();

          if (authAdminId && reportAdminId) {
            return String(reportAdminId) === String(authAdminId);
          }
          if (authEmail && reportEmail) {
            return reportEmail === authEmail;
          }
          return true;
        })
        .sort(
          (a, b) =>
            new Date(b?.data?.submittedAtServer || b.createdAt).getTime() -
            new Date(a?.data?.submittedAtServer || a.createdAt).getTime(),
        )
        .slice(0, 10);

      setPreviousShiftReports(ownReports);
    } catch (error) {
      showToastMessage(error.message || "Failed to fetch previous shift reports.", "error");
    } finally {
      setIsPreviousShiftLoading(false);
    }
  };

  const [modalPrices, setModalPrices] = useState({
    regular: 15.0,
    discounted: 10.0,
  });

  useEffect(() => {
    localStorage.setItem("terminalBasePrices", JSON.stringify(basePrices));
  }, [basePrices]);

  const handleModalPriceChange = (key, value) => {
    if (value === "") {
      setModalPrices((prev) => ({ ...prev, [key]: "" }));
      return;
    }

    const regex = /^\d*\.?\d*$/;
    if (!regex.test(value)) {
      return;
    }
    if (value.length > 1 && value.startsWith("0") && value[1] !== ".") {
      value = value.substring(1);
    }
    setModalPrices((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveBasePrices = () => {
    const newPrices = {};
    let hasError = false;

    for (const key in modalPrices) {
      const priceString = String(modalPrices[key]);
      if (priceString === "" || priceString === ".") {
        newPrices[key] = 0.0;
      } else {
        const numValue = parseFloat(priceString);
        if (isNaN(numValue) || numValue < 0) {
          showToastMessage("Error: Price must be a valid non-negative number.");
          hasError = true;
          break;
        }
        newPrices[key] = parseFloat(numValue.toFixed(2));
      }
    }

    if (!hasError) {
      setBasePrices(newPrices);
      setShowPriceModal(false);
      showToastMessage(
        "Base prices updated successfully! New tickets will use these prices.",
      );
    }
  };

  const handleOpenPriceModal = () => {
    setModalPrices({
      regular: basePrices.regular.toFixed(2),
      discounted: basePrices.discounted.toFixed(2),
    });
    setShowPriceModal(true);
  };

  const filtered = useMemo(() => {
    return records.filter((fee) => {
      const pType = (fee.passengerType || "").toLowerCase();
      const aType = activeType.toLowerCase();

      let matchesType = false;
      if (aType === "all") {
        matchesType = true;
      } else if (
        aType.includes("student") ||
        aType.includes("senior") ||
        aType.includes("pwd")
      ) {
        matchesType =
          pType.includes("student") ||
          pType.includes("senior") ||
          pType.includes("pwd");
      } else {
        matchesType = pType.includes(aType);
      }

      const feeDate = fee.date ? new Date(fee.date) : null;
      let matchesDateRange = false;

      if (feeDate && !Number.isNaN(feeDate.getTime())) {
        matchesDateRange = feeDate >= filterStart && feeDate <= filterEnd;
      }

      return matchesType && matchesDateRange;
    });
  }, [records, activeType, filterStart, filterEnd]);

  const stats = useMemo(
    () => ({
      regular: filtered.filter((f) =>
        (f.passengerType || "").toLowerCase().includes("regular"),
      ).length,
      student: filtered.filter((f) =>
        (f.passengerType || "").toLowerCase().includes("student"),
      ).length,
      senior: filtered.filter((f) => {
        const type = (f.passengerType || "").toLowerCase();
        return type.includes("senior") || type.includes("pwd");
      }).length,
      total: filtered.length,
      revenue: filtered.reduce((sum, f) => sum + (f.price || 0), 0),
    }),
    [filtered],
  );

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
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = paginatedData.map((item) => item._id || item.id);
      setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    } else {
      const pageIds = paginatedData.map((item) => item._id || item.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.includes(item._id || item.id));

  const showToastMessage = (message, type = "success") => {
    setToast({
      isOpen: true,
      message,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleSubmitReport = async () => {
    if (!collectorName || !collectorName.trim() || !collectorId) {
      showToastMessage("Please enter Name of Collector before submitting report.", "error");
      return;
    }

    setIsReporting(true);
    try {
      const to12HourFormat = (timeStr) => {
        if (!timeStr) return "-";
        if (timeStr.includes("M") || timeStr.includes("m")) return timeStr;
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

      const shiftStart = new Date(sessionStartedAt);
      const shiftRecords = records.filter((item) => {
        const createdAt = item?.createdAt ? new Date(item.createdAt) : null;
        return createdAt && !Number.isNaN(createdAt.getTime()) && createdAt >= shiftStart;
      });

      const formattedData = shiftRecords.map((item) => {
        const { createdAt, updatedAt, __v, _id, isArchived, status, ...rest } =
          item;
        return {
          ...rest,
          price:
            typeof rest.price === "number"
              ? `Php ${rest.price.toFixed(2)}`
              : rest.price,
          date: rest.date ? new Date(rest.date).toLocaleDateString() : "-",
          time: to12HourFormat(rest.time),
        };
      });

      const reportPayload = {
        screen: "Terminal Fees Management",
        generatedDate: new Date().toLocaleString(),
        assignedShift: assignedShiftValue || "No assigned shift",
        sessionStartedAt,
        filters: {
          activeType,
          duration: dateFilterType,
          selectedDate: getPeriodDisplayStr(),
        },
        statistics: {
          totalPassengers: shiftRecords.length,
          totalRevenue: shiftRecords.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
          regularCount: shiftRecords.filter((f) =>
            (f.passengerType || "").toLowerCase().includes("regular"),
          ).length,
          studentCount: shiftRecords.filter((f) =>
            (f.passengerType || "").toLowerCase().includes("student"),
          ).length,
          seniorCount: shiftRecords.filter((f) => {
            const type = (f.passengerType || "").toLowerCase();
            return type.includes("senior") || type.includes("pwd");
          }).length,
          collector: collectorName.trim(),
          collectorId,
        },
        data: formattedData,
      };

      const adminName = localStorage.getItem("authName") || localStorage.getItem("authEmail") || "Ticket Admin";
      const report = await submitPageReport(
        "Terminal Fees",
        reportPayload,
        adminName,
        {
          reportType: "TerminalFee",
          payload: reportPayload,
        },
      );
      await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/notifications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Report Submitted: Terminal Fees Reports",
            message:
              "A new Terminal Fees report has been generated. Shift rows were submitted and cleared from active board.",
            source: "Terminal Fees",
          }),
        },
      );

      const submitShiftRes = await fetch(`${API_URL}/terminal-fees/submit-shift`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionStartedAt,
          reportId: report?._id || report?.id || null,
        }),
      });

      if (!submitShiftRes.ok) {
        throw new Error("Report created, but failed to mark shift records as submitted.");
      }

      showToastMessage("Report submitted successfully! Shift rows are cleared from active board.");
      setShowSubmitModal(false);
      setCollectorId("");
      setCollectorName("");
      fetchFees();
    } catch (error) {
      console.error(error);
      showToastMessage("Failed to submit report.");
    } finally {
      setIsReporting(false);
    }
  };

  const handleOpenSubmitModal = () => {
    setShowSubmitModal(true);
  };

  const shiftRecords = useMemo(() => {
    const shiftStart = new Date(sessionStartedAt);
    return records.filter((item) => {
      const createdAt = item?.createdAt ? new Date(item.createdAt) : null;
      return createdAt && !Number.isNaN(createdAt.getTime()) && createdAt >= shiftStart;
    });
  }, [records, sessionStartedAt]);

  const handleCollectorSelection = (nextCollectorId, selectedCollector) => {
    setCollectorId(nextCollectorId);
    if (!selectedCollector) {
      setCollectorName("");
      return;
    }

    const middleInitial = selectedCollector.middleName
      ? `${String(selectedCollector.middleName).trim().charAt(0).toUpperCase()}.`
      : "";
    const displayName = [
      selectedCollector.firstName,
      middleInitial,
      selectedCollector.lastName,
      selectedCollector.suffix,
    ]
      .filter(Boolean)
      .join(" ");

    setCollectorName(displayName);
  };

  const handleBulkDelete = async () => {
    setIsLoading(true);
    try {
      if (role === "ticket") {
        const requestPromises = selectedIds.map(async (id) => {
          const item = records.find((r) => (r._id || r.id) === id);
          if (!item) return;

          return fetch(`${API_URL}/deletion-requests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemType: "Terminal Fee",
              itemDescription: `Ticket #${item.ticketNo} - ${item.passengerType}`,
              requestedBy: "Ticket Admin",
              originalData: item,
              reason: "Bulk deletion request",
            }),
          });
        });

        await Promise.all(requestPromises);
        await logActivity(
          role,
          "REQUEST_BULK_DELETE",
          `Requested deletion for ${selectedIds.length} tickets`,
          "TerminalFees",
        );
        showToastMessage(
          `Sent deletion requests for ${selectedIds.length} records.`,
        );
      } else {
        const deletePromises = selectedIds.map((id) =>
          fetch(`${API_URL}/terminal-fees/${id}`, { method: "DELETE" }),
        );

        await Promise.all(deletePromises);
        await logActivity(
          role,
          "BULK_DELETE",
          `Deleted ${selectedIds.length} tickets via bulk action`,
          "TerminalFees",
        );
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
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Update failed");
      await fetchFees();
      await logActivity(
        role,
        "UPDATE_TICKET",
        `Updated Ticket #${data.ticketNo}.`,
        "TerminalFees",
      );
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
      const res = await fetch(`${API_URL}/terminal-fees/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchFees();
      await logActivity(
        role,
        "DELETE_TICKET",
        `Deleted Ticket #${ticketNo}`,
        "TerminalFees",
      );
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
            reason: deleteRemarks || "No remarks provided.",
          }),
        });

        if (!res.ok) throw new Error("Failed to send request");
        await logActivity(
          role,
          "REQUEST_DELETE",
          `Requested deletion: Ticket #${deleteRow.ticketNo}`,
          "TerminalFees",
        );
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
    const requiredPassword = localStorage.getItem("authPassword") || "";

    if (passwordInput && passwordInput === requiredPassword) {
      const recordId = pendingEdit?._id || pendingEdit?.id;
      if (!pendingEdit || !recordId) {
        setPasswordError(
          "System Error: Lost record ID. Please refresh and try again.",
        );
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

  const handleOpenAdd = async () => {
    
    const now = new Date();
    setNewTicket({
      
      ticketNo: isAutoTicket ? "Loading..." : "", 
      passengerType: "Regular",
      price: basePrices.regular,
      date: now.toISOString().split("T")[0],
      time: now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    });
    
    setShowAddModal(true);

    if (isAutoTicket) {
      try {
        const res = await fetch(`${API_URL}/terminal-fees/next-ticket`);
        if (!res.ok) throw new Error("Failed to fetch next ticket number");

        const data = await res.json();

        setNewTicket((prev) => ({
          ...prev,
          ticketNo: data.nextTicketNo,
        }));
      } catch (error) {
        console.error("Error getting next ticket:", error);
        setNewTicket((prev) => ({ ...prev, ticketNo: "Auto-generated" }));
      }
    }
  };

 const handleSaveNew = async () => {
    if (!newTicket.ticketNo || String(newTicket.ticketNo).trim() === "") {
      showToastMessage("Please enter a ticket number.", "error");
      return;
    }

    const ticketNoStr = String(newTicket.ticketNo).trim();
    const isDuplicateTicket = records.some(
      (fee) => String(fee.ticketNo).trim() === ticketNoStr
    );

    if (isDuplicateTicket) {
      showToastMessage(
        `Ticket Number ${ticketNoStr} already exists! `, 
        "error"
      );
      return;
    }

    try {
      const res = await fetch(`${API_URL}/terminal-fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Backend Error Details:", errorData);
        throw new Error(
          errorData.message || errorData.error || "Failed to save to database",
        );
      }

      await fetchFees();
      await logActivity(
        role,
        "CREATE_TICKET",
        `Created Ticket #${newTicket.ticketNo} - ${newTicket.passengerType}`,
        "TerminalFees",
      );
      showToastMessage("New ticket added successfully!", "success");
      setShowAddModal(false);
    } catch (error) {
      console.error("Error saving ticket:", error);
      showToastMessage(
        "Failed to save ticket. Please check server connection.",
        "error",
      );
    }
  };

  const confirmArchive = async () => {
    if (!archiveRow) return;
    const rowToArchive = archiveRow;
    setArchiveRow(null);

    try {
      const idToArchive = rowToArchive._id || rowToArchive.id;
      if (!idToArchive) throw new Error("System Error: Record ID is missing.");

      const archiveRes = await fetch(
        `${API_URL}/terminal-fees/${idToArchive}/archive`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!archiveRes.ok) throw new Error("Failed to archive");

      await fetchFees();
      await logActivity(
        role,
        "ARCHIVE_TICKET",
        `Archived Ticket #${rowToArchive.ticketNo}`,
        "TerminalFees",
      );
      showToastMessage("Ticket archived successfully!");
    } catch (e) {
      console.error("Failed to archive:", e);
      showToastMessage("Failed to archive ticket.");
    }
  };

  const handleExportExcel = async () => {
    if (!collectorName || collectorName.trim() === "") {
      setToast({
        isOpen: true,
        type: "error",
        message: "Collector name is required before exporting.",
      });

      setTimeout(() => {
        setToast({
          isOpen: false,
          type: "",
          message: "",
        });
      }, 3000);

      return;
    }
    if (filtered.length === 0) return alert("No records to export.");

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Terminal Fees Report");

      worksheet.getRow(1).height = 35;
      await addImageToWorksheet(workbook, worksheet, headerImg, "A1:E4");

      worksheet.mergeCells("A6:E6");
      const titleCell = worksheet.getCell("A6");
      titleCell.value = "PASSENGER REPORTS";
      titleCell.font = { bold: true, size: 14, color: { argb: "FFDC2626" } };
      titleCell.alignment = { horizontal: "center" };

      worksheet.addRow([]); 
      worksheet.addRow([
        `Date: ${new Date().toLocaleDateString()}`,
        "",
        `Regular: ${stats.regular}`,
        "",
        `Total Passengers: ${stats.total}`,
      ]);

      const collectorRow = worksheet.addRow([
        `Collector: ${collectorName || "N/A"}`,
        "",
        "",
        "",
        "",
      ]);

      collectorRow.getCell(1).font = { bold: true };

      worksheet.addRow([
        `Operator: ${localStorage.getItem("authName") || "Admin"}`,
        "",
        `Student/Senior: ${stats.student + stats.senior}`,
        "",
        `Total Revenue: Php ${stats.revenue.toFixed(2)}`,
      ]);
      worksheet.addRow([]); 

      const headerRow = worksheet.addRow([
        "Ticket No",
        "Passenger Type",
        "Time",
        "Date",
        "Price",
      ]);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF10B981" },
        };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      filtered.forEach((item) => {
        worksheet.addRow([
          item.ticketNo || "-",
          item.passengerType || "-",
          item.time || "-",
          item.date ? new Date(item.date).toLocaleDateString() : "-",
          `Php ${(item.price || 0).toFixed(2)}`,
        ]);
      });

      const lastRowNumber = worksheet.lastRow.number + 2;
      worksheet.getRow(lastRowNumber).height = 52.5;
      await addImageToWorksheet(
        workbook,
        worksheet,
        footerImg,
        `A${lastRowNumber}:E${lastRowNumber + 3}`,
      );

      worksheet.columns = [
        { width: 15 },
        { width: 25 },
        { width: 15 },
        { width: 15 },
        { width: 20 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `Terminal_Fees_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );

      logActivity(
        role,
        "EXPORT_EXCEL",
        `Exported branded report for ${filtered.length} terminal fees`,
        "TerminalFees",
      );
    } catch (err) {
      console.error("Terminal Fees ExcelJS Export Failed:", err);
      alert("Failed to export Excel. Please check the console for details.");
    }
  };

  const exportToPDF = () => {
    if (!collectorName || collectorName.trim() === "") {
      setToast({
        isOpen: true,
        type: "error",
        message: "Collector name is required before exporting.",
      });

      setTimeout(() => {
        setToast({
          isOpen: false,
          type: "",
          message: "",
        });
      }, 3000);

      return;
    }
    if (filtered.length === 0) return alert("No records to export.");

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const tableRightEdge = pageWidth - margin;

    doc.addImage(headerImg, "PNG", 0, 0, pageWidth, 35);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("PASSENGER REPORTS", pageWidth / 2, 45, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 55);
    doc.text(`Collector: ${collectorName || "N/A"}`, margin, 61);
    doc.text(`No. Regular: ${stats.regular}`, 75, 67);
    doc.text(`No. Student/Senior: ${stats.student + stats.senior}`, 75, 73);
    doc.text(`No. of Passengers: ${stats.total}`, tableRightEdge, 55, {
      align: "right",
    });
    doc.text(`Revenue: Php ${stats.revenue.toFixed(2)}`, tableRightEdge, 61, {
      align: "right",
    });

    autoTable(doc, {
      startY: 80,
      margin: { left: margin, right: margin, bottom: 35 },
      head: [["Ticket No", "Passenger Type", "Price", "Time", "Date"]],
      body: filtered.map((item) => [
        item.ticketNo || "-",
        item.passengerType || "-",
        `Php ${(item.price || 0).toFixed(2)}`,
        item.time || "-",
        item.date ? new Date(item.date).toLocaleDateString() : "-",
      ]),
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 9, halign: "center" },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "left" },
        2: { halign: "right" },
      },
      didDrawPage: (data) => {
        doc.addImage(footerImg, "PNG", 0, pageHeight - 30, pageWidth, 30);
      },
    });

    doc.save(
      `Terminal_Fees_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
    );

    logActivity(
      role,
      "EXPORT_PDF",
      `Exported ${filtered.length} Terminal Fees records to PDF`,
      "TerminalFees",
    );
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
        "Ticket No",
        "Passenger Type",
        "Report State",
        "Time",
        "Date",
        "Price",
      ]
    : ["Ticket No", "Passenger Type", "Report State", "Time", "Date", "Price"];

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

      <div className="flex flex-col lg:flex-row lg:items-center justify-end mb-6 gap-4">
        <div className="flex flex-wrap items-center justify-start lg:justify-end gap-3 w-full lg:w-auto">
          
          {role === "superadmin" && (
            <button
              title="Price Setting"
              onClick={handleOpenPriceModal}
              className="flex items-center justify-center cursor-pointer gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <Settings size={18} className="text-slate-600" /> <span>Set Price</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex cursor-pointer items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all whitespace-nowrap"
            title="Add Ticket"
          >
            <Plus size={18} /> <span>Add Fee</span>
          </button>

          {role === "ticket" && (
            <button
              onClick={handleOpenSubmitModal}
              disabled={isReporting}
              className="flex items-center cursor-pointer justify-center gap-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <FileText size={18} />
              <span>Submit Report</span>
            </button>
          )}

          {role === "ticket" && (
            <button
              onClick={() => {
                fetchPreviousShiftReports();
                setShowPreviousShiftModal(true);
              }}
              className="flex items-center cursor-pointer justify-center gap-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <span>Previous Shift Records</span>
            </button>
          )}

          <ExportMenu onExportExcel={handleExportExcel} onExportPDF={exportToPDF} />
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3">
            <TerminalFilter activeType={activeType} onTypeChange={setActiveType} />
          </div>

          {role === "superadmin" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 h-[42px]">
                {["Daily", "Week", "Month", "Year"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setDateFilterType(type);
                      setCurrentDateRange(new Date());
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                      dateFilterType === type
                        ? "bg-white text-emerald-600 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between border border-slate-200 bg-white rounded-xl h-[42px] min-w-[240px] px-2 shadow-sm">
                <button 
                  onClick={handlePrevPeriod} 
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 whitespace-nowrap">
                  <Calendar size={16} className="text-slate-400" />
                  {getPeriodDisplayStr()}
                </div>
                <button 
                  onClick={handleNextPeriod} 
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 min-h-[42px]">
            {role === "ticket" && (
              <button
                onClick={toggleSelectionMode}
                title={isSelectionMode ? "Cancel Selection" : "Select Records"}
                className={`flex items-center justify-center h-[42px] px-3 cursor-pointer rounded-xl transition-all border ${
                  isSelectionMode
                    ? "bg-red-500 text-white border-red-600 shadow-md"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {isSelectionMode ? <X size={18} className="mr-1.5"/> : <ListChecks size={18} className="mr-1.5"/>}
                <span className="text-sm font-medium">{isSelectionMode ? "Cancel" : "Select"}</span>
              </button>
            )}

            {isSelectionMode && selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-5 bg-red-50 p-1.5 rounded-xl border border-red-100 h-[42px]">
                <span className="text-sm font-semibold text-red-600 px-2 whitespace-nowrap">
                  {selectedIds.length} Selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  title={role === "ticket" ? "Request Deletion" : "Delete Selected"}
                  className="rounded-lg p-1.5 bg-white text-red-500 hover:text-red-700 shadow-sm border border-red-200 transition-all cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {role === "ticket" && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-[42px]">
                <label className="text-sm font-semibold text-slate-600 whitespace-nowrap">
                  Collector:
                </label>
                <select
                  value={collectorId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    const selectedCollector = collectors.find(
                      (collector) => (collector._id || collector.id) === nextId,
                    );
                    handleCollectorSelection(nextId, selectedCollector || null);
                  }}
                  className="w-full sm:w-48 bg-transparent border-none text-sm font-medium text-slate-800 focus:ring-0 cursor-pointer outline-none"
                >
                  <option value="">Select collector...</option>
                  {collectors.map((collector) => {
                    const middleInitial = collector.middleName
                      ? `${String(collector.middleName).trim().charAt(0).toUpperCase()}.`
                      : "";
                    const label = [
                      collector.firstName,
                      middleInitial,
                      collector.lastName,
                      collector.suffix,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <option key={collector._id || collector.id} value={collector._id || collector.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <button
              onClick={() => setShowLogModal(true)}
              className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-4 h-[42px] rounded-xl shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
              title="View Logs"
            >
              <History size={18} />
              <span className="hidden sm:inline">Logs</span>
            </button>
          </div>

        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-xl border-slate-200 bg-white/50">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-2" />
          <p className="text-sm text-slate-500 font-medium">
            Loading records...
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 text-white p-4 flex flex-wrap gap-3 justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Clock size={20} className="text-emerald-400" />
              Terminal Fees Board
            </h2>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-600 px-3 py-1 rounded-full">
                <User size={14} className="text-blue-400" />
                <span>
                  Operator: <span className="text-white">{operatorName}</span>
                </span>
              </div>

              <span className="text-sm font-medium text-slate-300 bg-slate-700 px-3 py-1 rounded-full">
                As of {asOfDateLabel}
              </span>
            </div>
          </div>

          <div className="p-4">
            <Table
              columns={tableColumns}
              data={paginatedData.map((fee) => {
                const rowId = fee._id || fee.id;
                const isOnRead = fee.reportStatus === "On Read";
                const baseData = {
                  id: rowId,
                  ticketno: fee.ticketNo,
                  passengertype: fee.passengerType,
                  reportstate: isOnRead ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      On Read
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      Pending
                    </span>
                  ),
                  time: fee.time,
                  date: fee.date,
                  price: `₱${fee.price.toFixed(2)}`,
                  __highlight: isOnRead,
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
                          checked={selectedIds.includes(rowId)}
                          onChange={() => toggleSelect(rowId)}
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
                const selectedRecord = records.find(
                  (r) => (r._id || r.id) == row.id,
                );

                return (
                  <div className="flex justify-end items-center space-x-2">
                    <TableActions
                      onView={() => setViewRow(selectedRecord)}
                      onEdit={() => setEditRow(selectedRecord)}
                    />
                    <button
                      onClick={() => setArchiveRow(selectedRecord)}
                      className="p-1.5 rounded-lg bg-yellow-50 cursor-pointer text-yellow-600 hover:bg-yellow-100"
                      title="Archive"
                    >
                      <Archive size={16} />
                    </button>

                    {role == "superadmin" && (
                      <button
                        onClick={() => {
                          setDeleteRow(selectedRecord);
                          setDeleteRemarks("");
                        }}
                        className="p-1.5 rounded-lg bg-red-50 cursor-pointer text-red-600 hover:bg-red-100"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              }}
            />
          </div>
        </div>
      )}

      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filtered.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filtered.length}
          onItemsPerPageChange={(n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          }}
        />
      </div>

      <LogModal isOpen={showLogModal} onClose={() => setShowLogModal(false)} />

      <SecurityCheckModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPendingEdit(null);
          setPasswordInput("");
        }}
        onConfirm={handleFinalizeAction}
        actionType={confirmAction}
        passwordInput={passwordInput}
        setPasswordInput={(val) => {
          setPasswordInput(val);
          setPasswordError("");
        }}
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
                <Settings size={20} className="text-emerald-600" /> Ticket Price
                Settings
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
              Set a new ticket rates. Changes take effect upon saving.
            </p>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="regular-price"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Regular Passenger Price
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-500">
                    ₱
                  </span>
                  <input
                    id="regular-price"
                    type="text"
                    value={modalPrices.regular}
                    onChange={(e) =>
                      handleModalPriceChange("regular", e.target.value)
                    }
                    className="w-full bg-white border border-slate-300 pl-8 pr-3 py-2.5 rounded-lg font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="discounted-price"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Student / Senior / PWD Price
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-500">
                    ₱
                  </span>
                  <input
                    id="discounted-price"
                    type="text"
                    value={modalPrices.discounted}
                    onChange={(e) =>
                      handleModalPriceChange("discounted", e.target.value)
                    }
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
              <h3 className="text-lg font-bold text-slate-800">
                New Terminal Fee
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between mb-3 border-b pb-3">
                <label className="block text-xs font-semibold text-slate-500 uppercase">
                  Ticket Input Mode
                </label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${!isAutoTicket ? 'text-emerald-600' : 'text-slate-400'}`}>Manual</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const nextMode = !isAutoTicket;
                      setIsAutoTicket(nextMode);
                      
                      if (!nextMode) {
                 
                        setNewTicket({ ...newTicket, ticketNo: "" });
                      } else {
                     
                        setNewTicket({ ...newTicket, ticketNo: "Loading..." });
                        try {
                          const res = await fetch(`${API_URL}/terminal-fees/next-ticket`);
                          if (res.ok) {
                            const data = await res.json();
                            setNewTicket(prev => ({ ...prev, ticketNo: data.nextTicketNo }));
                          } else {
                            setNewTicket(prev => ({ ...prev, ticketNo: "Auto-generated" }));
                          }
                        } catch (error) {
                          console.error("Error getting next ticket:", error);
                          setNewTicket(prev => ({ ...prev, ticketNo: "Auto-generated" }));
                        }
                      }
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      isAutoTicket ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        isAutoTicket ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-medium ${isAutoTicket ? 'text-emerald-600' : 'text-slate-400'}`}>Auto</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Ticket No {isAutoTicket && <span className="text-emerald-500 lowercase normal-case ml-1">(Auto-counted)</span>}
                </label>
                <input
                  type="text"
                  value={newTicket.ticketNo}
                  onChange={(e) => setNewTicket({ ...newTicket, ticketNo: e.target.value })}
                  disabled={isAutoTicket}
                  placeholder={!isAutoTicket ? "Enter ticket number" : ""}
                  className={`w-full px-3 py-2 rounded-lg font-medium border transition-all ${
                    isAutoTicket 
                      ? "bg-slate-100 text-slate-500 italic border-slate-300 cursor-not-allowed" 
                      : "bg-white text-slate-800 border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                  Passenger Type
                </label>
                <div className="grid grid-cols-2 gap-2 ">
                  {["Regular", "Student/Senior/PWD"].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        const price =
                          type === "Student/Senior/PWD"
                            ? basePrices.discounted
                            : basePrices.regular;
                        setNewTicket((prev) => ({
                          ...prev,
                          passengerType: type,
                          price,
                        }));
                      }}
                      className={`py-2 px-1 rounded-lg text-xs font-semibold border ${newTicket.passengerType === type ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-200"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    value={newTicket.price}
                    disabled
                    className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={newTicket.date}
                    disabled
                    className="w-full bg-slate-100 border border-slate-300 px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNew}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                Save Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                Edit Terminal Fee
              </h3>
              <button
                onClick={() => setEditRow(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {["Regular", "Student/Senior/PWD"].map((type) => {
                const newPrice =
                  type === "Student/Senior/PWD"
                    ? basePrices.discounted
                    : basePrices.regular;
                const active =
                  (editRow.passengerType || "").toLowerCase() ===
                  type.toLowerCase();
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setEditRow((prev) => ({
                        ...prev,
                        passengerType: type,
                        price: newPrice,
                      }))
                    }
                    className={`py-2 px-1 rounded-lg text-xs font-semibold border ${active ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-200"}`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Price
                </label>
                <input
                  type="number"
                  value={editRow.price ?? 0}
                  disabled
                  className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Date
                </label>
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
              <button
                onClick={() => setEditRow(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
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
              Are you sure you want to move Ticket{" "}
              <strong>#{archiveRow.ticketNo}</strong> to the Archives?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setArchiveRow(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
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

      <SharedSubmitReportModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmit={handleSubmitReport}
        requiresCollector={true}
        moduleName="Terminal Fee"
        reportType="TerminalFee"
        collectors={collectors}
        collectorId={collectorId}
        collectorName={collectorName}
        onCollectorChange={handleCollectorSelection}
        assignedShift={assignedShiftValue || "No assigned shift"}
        totalRecords={shiftRecords.length}
        helperText={`Operator: ${operatorName} | As of: ${asOfDateLabel}. Submitted rows are cleared from active board.`}
        isSubmitting={isReporting}
        submitDisabled={!collectorId || !collectorName.trim()}
        submitLabel="Confirm Submit"
      />

      {showPreviousShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Previous Shift Records</h3>
              <button
                onClick={() => setShowPreviousShiftModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {isPreviousShiftLoading ? (
              <div className="py-10 text-center text-slate-500">Loading previous shift reports...</div>
            ) : previousShiftReports.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No previous shift reports found for this Ticket Admin.</div>
            ) : (
              <div className="max-h-[65vh] overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Submitted At</th>
                      <th className="px-4 py-3">Shift</th>
                      <th className="px-4 py-3">Collector</th>
                      <th className="px-4 py-3">Records</th>
                      <th className="px-4 py-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previousShiftReports.map((report) => {
                      const recordCount =
                        report?.data?.data?.length ??
                        report?.data?.statistics?.totalPassengers ??
                        0;
                      const revenue = Number(report?.data?.statistics?.totalRevenue) || 0;
                      return (
                        <tr key={report._id || report.id}>
                          <td className="px-4 py-3 text-slate-700">
                            {new Date(
                              report?.data?.submittedAtServer || report.createdAt,
                            ).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {report?.data?.assignedShift || report?.payload?.assignedShift || report?.data?.shift || report?.payload?.shift || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {report?.data?.statistics?.collector || report?.data?.collectorName || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{recordCount}</td>
                          <td className="px-4 py-3 text-slate-700">{revenue.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <NotificationToast
          isOpen={toast.isOpen}
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </Layout>
  );
};

export default TerminalFees;
