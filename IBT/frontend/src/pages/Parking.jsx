import React, { useState, useMemo, useEffect, useRef } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import headerImg from "../assets/Header.png";
import footerImg from "../assets/FOOTER.png";
import StatCardGroupPark from "../components/parking/StatCardGroupPark";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import TerminalBoardShell from "../components/common/TerminalBoardShell";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import EditParking from "../components/parking/EditParking";
import DeleteModal from "../components/common/DeleteModal";
import RequestDeletionModal from "../components/common/RequestDeletionModal";
import ParkingFilter from "../components/parking/ParkingFilter";
import LogModal from "../components/common/LogModal";
import SharedSubmitReportModal from "../components/common/SharedSubmitReportModal.jsx";
import { submitPageReport } from "../utils/reportService.js";
import { logActivity } from "../utils/logger";
import { sendNotification } from "../utils/notificationService.js";
import {
  Trash2,
  LogOut,
  Car,
  Bike,
  Bus,
  Archive,
  ArrowLeft,
  FileText,
  History,
  ListChecks,
  X,
  CheckCircle,
  ChevronLeft,   
  ChevronRight,
  Calendar
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Settings } from "lucide-react";
const Parking = () => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [activeStatus, setActiveStatus] = useState("All");
  const [dateFilterType, setDateFilterType] = useState("Daily");
  const [currentDateRange, setCurrentDateRange] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [useManualTimes, setUseManualTimes] = useState(false);
  const [manualArrivalTime, setManualArrivalTime] = useState("");
  const [manualDepartureTime, setManualDepartureTime] = useState("");
  const [showLogModal, setShowLogModal] = useState(false);

  const [collectorName, setCollectorName] = useState("");
  const [collectorId, setCollectorId] = useState("");
  const [collectors, setCollectors] = useState([]);
  const [deleteRequestIds, setDeleteRequestIds] = useState([]);
  const [sessionStartedAt] = useState(() => new Date().toISOString());

  const [isAutoTicket, setIsAutoTicket] = useState(true); 

  const validateCollector = () => {
    const currentRole = localStorage.getItem("authRole") || "superadmin";
    if (currentRole === "superadmin") {
      return true;
    }

    if (!collectorName || collectorName.trim() === "" || !collectorId) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Please select a Collector before exporting.",
        autoClose: true,
        duration: 2000,
      });
      return false;
    }
    return true;
  };

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [modalPrices, setModalPrices] = useState({
    car: 10,
    motorcycle: 5,
    jeep: 10,
  });

  const [priceSettings, setPriceSettings] = useState({
    carRate: 10,
    motorcycleRate: 5,
    jeepRate: 10,
  });

  useEffect(() => {
    if (showPriceModal) {
      setModalPrices({
        car: priceSettings.carRate.toFixed(2),
        motorcycle: priceSettings.motorcycleRate.toFixed(2),
        jeep: priceSettings.jeepRate.toFixed(2),
      });
    }
  }, [showPriceModal, priceSettings]);

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

  const getLocalDateTimeValue = (date = new Date()) => {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const calculateParkingFinalPrice = (type, baseRate, timeIn, timeOut) => {
    const diffMs = timeOut - timeIn;
    const durationHours = diffMs / (1000 * 60 * 60);

    if (type === "4 Wheels" || type === "2 Wheels") {
      if (durationHours <= 3) {
        return baseRate;
      }

      const extraHours = Math.ceil(durationHours - 3);
      return baseRate + extraHours * baseRate;
    }

    if (type === "Jeep") {
      return baseRate;
    }

    return baseRate;
  };
 
  const handleModalPriceChange = (type, value) => {
    if (!/^\d*\.?\d*$/.test(value)) return;

    setModalPrices((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const closePriceModal = () => {
    setModalPrices({
      car: priceSettings.carRate,
      motorcycle: priceSettings.motorcycleRate,
    });
    setShowPriceModal(false);
    if (!collectorName || !collectorName.trim() || !collectorId) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Please select a Collector before submitting report.",
        autoClose: true,
        duration: 2000,
      });
      return;
    }

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
      console.error("Parking branding image failed:", error);
    }
  };

  const handleSaveBasePrices = () => {
    const carRate = parseFloat(modalPrices.car);
    const motorcycleRate = parseFloat(modalPrices.motorcycle);
    const jeepRate = parseFloat(modalPrices.jeep);

    if (
      isNaN(carRate) ||
      isNaN(motorcycleRate) ||
      isNaN(jeepRate) ||
      carRate <= 0 ||
      motorcycleRate <= 0 ||
      jeepRate <= 0
    ) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Please enter valid prices greater than zero.",
        autoClose: true,
        duration: 2000,
      });
      return;
    }

    setPriceSettings({
      carRate: Number(carRate.toFixed(2)),
      motorcycleRate: Number(motorcycleRate.toFixed(2)),
      jeepRate: Number(jeepRate.toFixed(2)),
    });

    setShowPriceModal(false);

    setNotificationState({
      isOpen: true,
      type: "success",
      message: "Parking prices updated successfully.",
      autoClose: true,
      duration: 2000,
    });
  };

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleteRemarks, setDeleteRemarks] = useState("");
  const [logoutRow, setLogoutRow] = useState(null);
  const [archiveRow, setArchiveRow] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [step, setStep] = useState(1);
  const plateInputRef = useRef(null);

  const [duplicateModal, setDuplicateModal] = useState({
    isOpen: false,
    message: "",
  });
  const [notificationState, setNotificationState] = useState({
    isOpen: false,
    type: "",
    message: "",
    autoClose: true,
    duration: 2000,
  });

  const [isReporting, setIsReporting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPreviousShiftModal, setShowPreviousShiftModal] = useState(false);
  const [previousShiftReports, setPreviousShiftReports] = useState([]);
  const [isPreviousShiftLoading, setIsPreviousShiftLoading] = useState(false);

  const role = localStorage.getItem("authRole") || "superadmin";
  const authAdminId = localStorage.getItem("authAdminId") || "";
  const authEmail = (localStorage.getItem("authEmail") || "").toLowerCase();
  const assignedShiftValue = localStorage.getItem("authShift") || "";
  const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/parking`;
  const ARCHIVE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/archives`;
  const REPORTS_API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/reports`;
  const DELETION_REQUESTS_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/deletion-requests`;

  const [newTicket, setNewTicket] = useState({
    ticketNo: "",
    type: "4 Wheels",
    plateNo: "",
    baseRate: 10,
    timeIn: "",
  });

  const existingPlates = useMemo(() => {
    return [...new Set(records.map((r) => r.plateNo).filter(Boolean))];
  }, [records]);

  const existingTicketNumbers = useMemo(() => {
  const todayStr = new Date().toDateString();
  return [
    ...new Set(
      records
        .filter(r => r.timeIn && new Date(r.timeIn).toDateString() === todayStr)
        .map((r) => r.ticketNo)
        .filter(Boolean)
    ),
  ];
}, [records]);

  const fetchParkingTickets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const formattedData = data.map((item) => ({ ...item, id: item._id }));
      setRecords(formattedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingTickets();
  }, []);

  const fetchDeleteRequests = async () => {
    try {
      const response = await fetch(DELETION_REQUESTS_URL);
      if (!response.ok) return;

      const data = await response.json();
      const requestedIds = (Array.isArray(data) ? data : [])
        .filter((request) => (request?.status || "pending") === "pending")
        .filter((request) => request?.itemType === "Parking Ticket")
        .map((request) => request?.originalData?._id || request?.originalData?.id)
        .filter(Boolean)
        .map(String);

      setDeleteRequestIds(requestedIds);
    } catch (error) {
      console.error("Error fetching deletion requests:", error);
    }
  };

  useEffect(() => {
    fetchDeleteRequests();
  }, []);

  useEffect(() => {
    const fetchCollectors = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/collectors?active=true`);
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
    if (role !== "parking") return; 
    
    setIsPreviousShiftLoading(true);
    try {
      const res = await fetch(REPORTS_API_URL); 
      if (!res.ok) throw new Error("Failed to load reports.");
      
      const data = await res.json();
      const ownReports = (Array.isArray(data) ? data : [])
        .filter((report) => {
          if (report.type !== "Parking") return false; 
          
          const reportAdminId = report?.data?.adminId;
          return authAdminId ? String(reportAdminId || "") === String(authAdminId) : true;
        })
        .sort(
          (a, b) =>
            new Date(b?.data?.submittedAtServer || b.createdAt).getTime() -
            new Date(a?.data?.submittedAtServer || a.createdAt).getTime(),
        )
        .slice(0, 10); 
        
      setPreviousShiftReports(ownReports);
    } catch (error) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: error.message || "Failed to fetch previous shift reports.",
        autoClose: true,
        duration: 3500,
      });
    } finally {
      setIsPreviousShiftLoading(false);
    }
  };

  useEffect(() => {
    if (notificationState.isOpen && notificationState.autoClose) {
      const timerDuration = notificationState.duration || 2000;

      const timer = setTimeout(() => {
        setNotificationState({
          isOpen: false,
          type: "",
          message: "",
          autoClose: true,
          duration: 2000,
        });
      }, timerDuration);

      return () => clearTimeout(timer);
    }
  }, [
    notificationState.isOpen,
    notificationState.autoClose,
    notificationState.duration,
  ]);

  const handleEditSave = async (updatedData) => {
    if (editRow?.timeOut) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message:
          "This ticket can no longer be edited because the vehicle has already departed.",
        autoClose: true,
        duration: 2500,
      });
      return;
    }
    try {
      // Determine correct rate based on vehicle type
      let baseRate =
        updatedData.type === "4 Wheels"
          ? priceSettings.carRate
          : priceSettings.motorcycleRate;

      // If admin manually edited price, use it
      if (updatedData.price !== undefined && updatedData.price !== "") {
        baseRate = Number(updatedData.price);
      }

      const payload = {
        plateNo: updatedData.plateNumber,
        type: updatedData.type,
        baseRate: baseRate,
        status: updatedData.status,
      };

      const response = await fetch(`${API_URL}/${updatedData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update parking record.");
      }

      // Update frontend state WITHOUT touching time or duration
      setRecords((prev) =>
        prev.map((ticket) => {
          if (ticket.id === updatedData.id) {
            return {
              ...ticket,
              plateNumber: updatedData.plateNumber,
              type: updatedData.type,
              baseRate: baseRate,
              status: updatedData.status,
            };
          }
          return ticket;
        }),
      );

      setEditRow(null);

      setNotificationState({
        isOpen: true,
        type: "success",
        message: "Parking ticket updated successfully!",
        autoClose: true,
        duration: 2000,
      });

      logActivity(
        role,
        "EDIT_TICKET",
        `Updated Parking Ticket ID #${updatedData.id}`,
        "Parking",
      );
    } catch (error) {
      console.error("Update Error:", error);

      setNotificationState({
        isOpen: true,
        type: "error",
        message: `Error updating record: ${error.message}`,
        autoClose: true,
        duration: 2000,
      });
    }
  };

  const filtered = records.filter((ticket) => {
    const matchesSearch =
      (ticket.ticketNo && String(ticket.ticketNo).includes(searchQuery)) ||
      (ticket.plateNo &&
        ticket.plateNo.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType =
      activeType === "All" ||
      ticket.type.toLowerCase() === activeType.toLowerCase();

    const matchesStatus = 
      activeStatus === "All" || 
      (ticket.status && ticket.status.toLowerCase() === activeStatus.toLowerCase());

    const ticketTimeIn = ticket.timeIn ? new Date(ticket.timeIn) : null;
    
    const matchesDateRange = ticketTimeIn 
      ? (ticketTimeIn >= filterStart && ticketTimeIn <= filterEnd)
      : false;

    return matchesSearch && matchesType && matchesStatus && matchesDateRange;
  });

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const getRank = (status, isSubmitted) => {
        if (status === "Parked") return 1;
        if (status === "Departed" && !isSubmitted) return 2;
        if (status === "Departed" && isSubmitted) return 3;
        return 4;
      };
      return getRank(a.status, a.submitted) - getRank(b.status, b.submitted);
    });
  }, [filtered]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedFiltered.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedFiltered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const fourWheelCount = filtered.filter((t) => t.type === "4 Wheels").length;
  const twoWheelCount = filtered.filter((t) => t.type === "2 Wheels").length;
  const jeepCount = filtered.filter((t) => t.type === "Jeep").length;
  const parkedCount = filtered.filter((t) => t.status === "Parked").length;
  const departedCount = filtered.filter((t) => t.status === "Departed").length;

  const revenue = filtered.reduce((sum, t) => {
    if (t.status !== "Departed") return sum;

    if (t.finalPrice) return sum + Number(t.finalPrice);

    if (!t.timeIn) return sum;

    const timeIn = new Date(t.timeIn);
    const timeOut = t.timeOut ? new Date(t.timeOut) : new Date();

    const diffMs = timeOut - timeIn;
    const duration = diffMs / (1000 * 60 * 60);

    // ✅ 4 Wheels
    if (t.type === "4 Wheels") {
      const base = priceSettings.carRate;

      if (duration <= 3) return sum + base;

      const extraHours = Math.ceil(duration - 3);
      return sum + base + extraHours * base;
    }

    // ✅ 2 Wheels
    if (t.type === "2 Wheels") {
      const base = priceSettings.motorcycleRate;

      if (duration <= 3) return sum + base;

      const extraHours = Math.ceil(duration - 3);
      return sum + base + extraHours * base;
    }

    // ✅ Jeep (fixed per day)
    if (t.type === "Jeep") {
      return sum + priceSettings.jeepRate;
    }

    return sum;
  }, 0);

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

  // BULK DELETE
  const handleBulkDelete = async () => {
    setIsLoading(true);
    try {
      if (role === "parking") {
        const newRequestIds = selectedIds.filter(
          (id) => !deleteRequestIds.includes(String(id)),
        );

        if (newRequestIds.length === 0) {
          setNotificationState({
            isOpen: true,
            type: "error",
            message: "Selected tickets already have pending deletion requests.",
            autoClose: true,
            duration: 2000,
          });
          setSelectedIds([]);
          setIsSelectionMode(false);
          return;
        }

        const requestPromises = newRequestIds.map(async (id) => {
          const item = records.find((r) => r.id === id);
          if (!item) return;

          return fetch(DELETION_REQUESTS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemType: "Parking Ticket",
              itemDescription: `Ticket #${item.ticketNo} - ${item.plateNo}`,
              requestedBy: "Parking Admin",
              originalData: item,
              reason: "Bulk deletion request",
            }),
          });
        });

        await sendNotification(
          "Deletion Request: Parking",
          `Parking Admin has requested to delete ${newRequestIds.length} parking records.`,
          "Parking",
          "superadmin",
        );

        await Promise.all(requestPromises);
        await logActivity(
          role,
          "REQUEST_BULK_DELETE",
          `Requested deletion for ${newRequestIds.length} parking tickets`,
          "Parking",
        );

        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Sent deletion requests for ${newRequestIds.length} records. Superadmin notified.`,
          autoClose: true,
          duration: 2000,
        });
        await fetchDeleteRequests();
        setSelectedIds([]);
        setIsSelectionMode(false);
      } else {
        // SUPERADMIN: INSTA DELETE
        const deletePromises = selectedIds.map((id) =>
          fetch(`${API_URL}/${id}`, { method: "DELETE" }),
        );

        await Promise.all(deletePromises);
        await logActivity(
          role,
          "BULK_DELETE",
          `Deleted ${selectedIds.length} parking tickets via bulk action`,
          "Parking",
        );

        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Successfully deleted ${selectedIds.length} records`,
          autoClose: true,
          duration: 2000,
        });
        fetchParkingTickets();
        setSelectedIds([]);
        setIsSelectionMode(false);
      }
    } catch (error) {
      console.error("Bulk action failed", error);
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Failed to process some records.",
        autoClose: true,
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLocalDateKey = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getCounterData = () => {
    try {
      return JSON.parse(localStorage.getItem("ticketCounter")) || {};
    } catch {
      return {};
    }
  };

  const peekNextTicketNumber = () => {
    const dateKey = getLocalDateKey();
    const counterData = getCounterData();
    const nextCount = (counterData[dateKey] || 0) + 1;
    return `T-${nextCount.toString().padStart(2, "0")}`;
  };

  const commitTicketCounterFromTicketNo = (ticketNo) => {
    const match = String(ticketNo || "").match(/^T-(\d+)$/i);
    if (!match) return;

    const ticketCount = Number(match[1]);
    if (!Number.isFinite(ticketCount) || ticketCount <= 0) return;

    const dateKey = getLocalDateKey();
    const counterData = getCounterData();
    const currentCount = counterData[dateKey] || 0;
    counterData[dateKey] = Math.max(currentCount, ticketCount);
    localStorage.setItem("ticketCounter", JSON.stringify(counterData));
  };

  const handleAddClick = async () => {
    const now = new Date();
    const formattedTimeIn = now.toISOString();

    setUseManualTimes(false);
    setManualArrivalTime("");
    setManualDepartureTime("");

    setNewTicket({
      ticketNo: isAutoTicket ? "Loading..." : "",
      type: "4 Wheels",
      plateNo: "",
      baseRate: priceSettings.carRate,
      timeIn: formattedTimeIn,
    });
    setStep(1);
    setShowAddModal(true);

    if (isAutoTicket) {
      try {
        const res = await fetch(`${API_URL}/next-ticket`);
        if (!res.ok) throw new Error("Failed to fetch next ticket number");
        const data = await res.json();
        setNewTicket((prev) => ({ ...prev, ticketNo: data.nextTicketNo }));
      } catch (error) {
        console.error("Error getting next ticket:", error);
        setNewTicket((prev) => ({ ...prev, ticketNo: "T-01" }));
      }
    }
  };

  const handleSelectType = (type) => {
    let rate = 0;

    if (type === "4 Wheels") rate = priceSettings.carRate;
    else if (type === "2 Wheels") rate = priceSettings.motorcycleRate;
    else if (type === "Jeep") rate = priceSettings.jeepRate;
    setNewTicket((prev) => ({
      ...prev,
      type,
      baseRate: rate,
    }));
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setNewTicket((prev) => ({ ...prev, type: "", plateNo: "" }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
  
    const ticketNo = (newTicket.ticketNo || "").trim();
    const plateNo = (newTicket.plateNo || "").trim().toUpperCase();
    const hasManualTimeEntry = useManualTimes;
    const arrivalTimeValue = hasManualTimeEntry ? manualArrivalTime : getLocalDateTimeValue(new Date());
    const departureTimeValue = hasManualTimeEntry ? manualDepartureTime : "";

    if (!plateNo || !ticketNo || ticketNo === "Loading...") {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Please enter both a valid Ticket Number and Plate Number.",
        autoClose: true,
        duration: 2000,
      });
      return;
    }
 
  // Duplicate checks are based on what is currently shown in the main table.
  const visibleTableRows = sortedFiltered;

  const isCurrentlyParked = visibleTableRows.some(
    (record) =>
      String(record.plateNo || "").trim().toUpperCase() === plateNo &&
      record.status === "Parked",
  );

  if (isCurrentlyParked) {
    setNotificationState({
      isOpen: true,
      type: "error",
      message: `Vehicle ${plateNo} is still parked! Please process its departure first.`,
      autoClose: true,
      duration: 3000,
    });
    return; 
  }

  const isDuplicateTicket = visibleTableRows.some(
    (ticket) => String(ticket.ticketNo || "").trim() === ticketNo,
  );

  if (isDuplicateTicket) {
    setNotificationState({
      isOpen: true,
      type: "error",
      message: `Ticket Number ${ticketNo} already exists!`,
      autoClose: true,
      duration: 3000,
    });
    return;
  }

  const parsedArrivalTime = new Date(arrivalTimeValue);
  if (Number.isNaN(parsedArrivalTime.getTime())) {
    setNotificationState({
      isOpen: true,
      type: "error",
      message: "Please enter a valid arrival time.",
      autoClose: true,
      duration: 3000,
    });
    return;
  }

  const parsedDepartureTime = departureTimeValue ? new Date(departureTimeValue) : null;
  if (parsedDepartureTime && Number.isNaN(parsedDepartureTime.getTime())) {
    setNotificationState({
      isOpen: true,
      type: "error",
      message: "Please enter a valid departure time.",
      autoClose: true,
      duration: 3000,
    });
    return;
  }

  if (parsedDepartureTime && parsedDepartureTime < parsedArrivalTime) {
    setNotificationState({
      isOpen: true,
      type: "error",
      message: "Departure time cannot be earlier than arrival time.",
      autoClose: true,
      duration: 3000,
    });
    return;
  }

  const payload = {
    ...newTicket,
    plateNo, 
    ticketNo,
    timeIn: parsedArrivalTime.toISOString(),
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const createdTicket = await response.json();

      if (parsedDepartureTime && createdTicket?._id) {
        const finalPrice = calculateParkingFinalPrice(
          newTicket.type,
          Number(payload.baseRate) || 0,
          parsedArrivalTime,
          parsedDepartureTime,
        );

        const diffMs = parsedDepartureTime - parsedArrivalTime;
        const durationHours = diffMs / (1000 * 60 * 60);
        const hours = Math.floor(durationHours);
        const minutes = Math.round((durationHours - hours) * 60);
        const durationText = `${hours} hours ${minutes} minutes`;

        const updateResponse = await fetch(`${API_URL}/${createdTicket._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timeOut: parsedDepartureTime.toISOString(),
            duration: durationText,
            finalPrice,
            status: "Departed",
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json().catch(() => ({}));
          throw new Error(errorData.message || "Manual departure save failed.");
        }
      }

      await logActivity(
        role,
        "CREATE_TICKET",
        `Created Parking Ticket #${ticketNo}`,
        "Parking",
      );
      fetchParkingTickets();
      setShowAddModal(false);
      setNotificationState({
        isOpen: true,
        type: "success",
        message: parsedDepartureTime
          ? `Parking Ticket #${ticketNo} created with manual arrival and departure times.`
          : `Parking Ticket #${ticketNo} created successfully.`,
        autoClose: true,
        duration: 2000,
      });
    }
  } catch (error) {
    console.error("Error creating ticket:", error);
    setNotificationState({
      isOpen: true,
      type: "error",
      message: "Failed to create ticket.",
      autoClose: true,
      duration: 2000,
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
        await logActivity(
          role,
          "DELETE_TICKET",
          `Deleted Parking Ticket #${deleteRow.ticketNo}`,
          "Parking",
        );
        setRecords((prev) => prev.filter((r) => r.id !== deleteRow.id));
        setDeleteRow(null);
        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Parking Ticket #${deleteRow.ticketNo} deleted successfully.`,
          autoClose: true,
          duration: 2000,
        });
      } else {
        setNotificationState({
          isOpen: true,
          type: "error",
          message: "Failed to delete record.",
          autoClose: true,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleDeleteRequestConfirm = async () => {
    if (!deleteRow) return;

    const rowId = String(deleteRow.id || deleteRow._id || "");
    if (rowId && deleteRequestIds.includes(rowId)) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Deletion request already pending for this ticket.",
        autoClose: true,
        duration: 2000,
      });
      setDeleteRow(null);
      setDeleteRemarks("");
      return;
    }

    try {
      const response = await fetch(DELETION_REQUESTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "Parking Ticket",
          itemDescription: `Ticket #${deleteRow.ticketNo} - ${deleteRow.plateNo}`,
          requestedBy: "Parking Admin",
          originalData: deleteRow,
          reason: deleteRemarks || "No remarks provided.",
        }),
      });

      if (!response.ok) throw new Error("Failed to send request");

      await logActivity(
        role,
        "REQUEST_DELETE",
        `Requested deletion: Ticket #${deleteRow.ticketNo}`,
        "Parking",
      );

      await sendNotification(
        "Deletion Request: Parking",
        `Parking Admin requested deletion for ticket #${deleteRow.ticketNo}.`,
        "Parking",
        "superadmin",
      );

      setNotificationState({
        isOpen: true,
        type: "success",
        message: "Deletion request sent to Superadmin.",
        autoClose: true,
        duration: 2000,
      });

      setDeleteRow(null);
      setDeleteRemarks("");
      await fetchDeleteRequests();
    } catch (error) {
      console.error("Error requesting deletion:", error);
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Failed to submit deletion request.",
        autoClose: true,
        duration: 2000,
      });
    }
  };

  const handleArchive = (rowToArchive) => {
    setArchiveRow(rowToArchive);
  };

  const confirmArchive = async () => {
    if (!archiveRow) return;
    const rowToArchive = archiveRow;
    setArchiveRow(null);

    try {
      const idToArchive = rowToArchive._id || rowToArchive.id;
      if (!idToArchive) throw new Error("Record ID is missing.");

      // Send a PATCH request to our new soft-delete endpoint
      const archiveRes = await fetch(`${API_URL}/${idToArchive}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!archiveRes.ok) throw new Error("Failed to archive");

      // Log the activity and re-fetch the data to update the table
      await logActivity(
        role,
        "ARCHIVE_PARKING",
        `Archived Parking Ticket #${rowToArchive.ticketNo}`,
        "Parking",
      );
      fetchParkingTickets();

      setNotificationState({
        isOpen: true,
        type: "success",
        message: `Ticket #${rowToArchive.ticketNo} was successfully moved to Archives.`,
        autoClose: true,
        duration: 2000,
      });
    } catch (e) {
      console.error("Failed to archive:", e);

      setNotificationState({
        isOpen: true,
        type: "error",
        message: `Failed to archive Ticket #${rowToArchive.ticketNo}. Please check network connection.`,
        autoClose: true,
        duration: 2000,
      });
    }
  };

  const confirmLogout = async () => {
    if (!logoutRow) return;

    try {
      console.log("Processing departure for ID:", logoutRow.id);

      const response = await fetch(`${API_URL}/${logoutRow.id}/depart`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      console.log("Response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed request");
      }

      await logActivity(
        role,
        "VEHICLE_DEPART",
        `Vehicle Departed: Ticket #${logoutRow.ticketNo}`,
        "Parking",
      );

      fetchParkingTickets();
      setLogoutRow(null);

      setNotificationState({
        isOpen: true,
        type: "success",
        message: `Vehicle departed. Total price calculated.`,
        autoClose: true,
        duration: 2000,
      });
    } catch (error) {
      console.error("Error logging out:", error);

      setNotificationState({
        isOpen: true,
        type: "error",
        message: error.message || "Failed to process departure.",
        autoClose: true,
        duration: 2000,
      });
    }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "--/--";
    return (
      new Date(dateString).toLocaleDateString() +
      " " +
      new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const formatTimeOnly = (dateString) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSubmittedDateTime = (dateString) => {
    if (!dateString) return "-";
    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSubmitReport = async () => {
    if (!collectorName || !collectorName.trim() || !collectorId) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Please select a Collector before submitting report.",
        autoClose: true,
        duration: 2000,
      });
      return;
    }

    setIsReporting(true);
    try {
      const formatDateTime = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString("en-US", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      };

     const shiftRecords = records.filter((item) => item.status === "Departed");

      if (shiftRecords.length === 0) {
        setNotificationState({
          isOpen: true,
          type: "error",
          message: "No departed vehicles to submit. Parked vehicles will carry over.",
          autoClose: true,
          duration: 3000,
        });
        setIsReporting(false);
        return;
      }

      const formattedData = shiftRecords.map((item) => {
        const { createdAt, updatedAt, isArchived, __v, _id, ...rest } = item;
        return {
          ...rest,
          timeIn: formatDateTime(rest.timeIn),
          timeOut: rest.timeOut
            ? formatDateTime(rest.timeOut)
            : "Parked (Active)",
        };
      });

      const carCount = shiftRecords.filter(
        (item) => item.type && item.type.toLowerCase() === "4 wheels",
      ).length;
      const motoCount = shiftRecords.filter(
        (item) => item.type && item.type.toLowerCase() === "2 wheels",
      ).length;

      const reportPayload = {
        screen: "Parking Management",
        generatedDate: new Date().toLocaleString(),
        assignedShift: assignedShiftValue || "No assigned shift",
        sessionStartedAt,
        filters: {
          searchQuery,
          selectedDate: getPeriodDisplayStr(), 
          activeType,
          duration: dateFilterType,           
        },
        statistics: {
          cars: carCount,
          motorcycles: motoCount,
          totalVehicles: shiftRecords.length,
          totalRevenue: shiftRecords.reduce((sum, t) => sum + (Number(t.finalPrice) || 0), 0),
          collector: collectorName.trim(),
          collectorId,
        },
        data: formattedData,
      };

      const adminName =
        localStorage.getItem("authName") ||
        localStorage.getItem("authEmail") ||
        "Parking Admin";
      const report = await submitPageReport("Parking", reportPayload, adminName, {
        reportType: "Parking",
        payload: reportPayload,
      });

      await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/notifications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Report Submitted: Parking Report",
            message:
              "A new Parking Management report has been generated. Shift rows were submitted and cleared from active board.",
            source: "Parking",
            targetRole: "superadmin",
          }),
        },
      );

      const submitShiftRes = await fetch(`${API_URL}/submit-shift`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionStartedAt,
          reportId: report?._id || report?.id || null,
        }),
      });

      if (!submitShiftRes.ok) {
        throw new Error("Report created, but failed to mark shift parking records as submitted.");
      }

      setNotificationState({
        isOpen: true,
        type: "success",
        message: "Report submitted successfully! Shift rows are cleared from active board.",
        autoClose: true,
        duration: 2000,
      });
      setShowSubmitModal(false);
      setCollectorId("");
      setCollectorName("");
      fetchParkingTickets();
    } catch (error) {
      console.error(error);
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Failed to submit report.",
        autoClose: true,
        duration: 2000,
      });
    } finally {
      setIsReporting(false);
    }
  };

  const getBadgeStyles = () => {
    if (newTicket.type === "4 Wheels")
      return "bg-blue-50 text-blue-600 border-blue-600";
    return "bg-orange-50 text-orange-500 border-orange-500";
  };

  const getExportData = (data) => {
    return data.map((item) => ({
      "Ticket No": item.ticketNo || "-",
      "Plate No": item.plateNo || "-",
      Type: item.type,
      "Fee/Hr": item.baseRate ? `₱${item.baseRate}` : "-",
      Total: item.finalPrice ? `₱${item.finalPrice}` : "-",
      "Time In": item.timeIn ? formatDateDisplay(item.timeIn) : "-",
      "Time Out": item.timeOut ? formatDateDisplay(item.timeOut) : "-",
      Duration: item.duration || "-",
      Status: item.status,
    }));
  };

  const handleExportExcel = async () => {
    if (!validateCollector()) return;
    if (filtered.length === 0) return alert("No records to export.");

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Parking Report");

      // 1. BRANDED HEADER (-1/8 height adjustment)
      worksheet.getRow(1).height = 35;
      await addImageToWorksheet(workbook, worksheet, headerImg, "A1:E4");

      // 2. Report Title & Metadata
      worksheet.mergeCells("A6:E6");
      const titleCell = worksheet.getCell("A6");
      titleCell.value = "PARKING REPORTS";
      titleCell.font = { bold: true, size: 14, color: { argb: "FFDC2626" } };
      titleCell.alignment = { horizontal: "center" };

      worksheet.addRow([]); // Spacer
      worksheet.addRow([
        `Date: ${new Date().toLocaleDateString()}`,
        "",
        "",
        "",
        `No. of Vehicles: ${filtered.length}`,
      ]);
      worksheet.addRow([
        `Collector: ${collectorName}`,
        `Operator: ${localStorage.getItem("authName") || "Admin"}`,
        "",
        "",
        "",
        `Revenue: Php ${revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      ]);
      worksheet.addRow([]); // Spacer

      // 3. Styled Table Headers (IBT Red)
      const headerRow = worksheet.addRow([
        "Ticket No.",
        "Plate No.",
        "Type",
        "Fee",
        "Total",
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

      // 4. Populate Vehicle Data
      filtered.forEach((item) => {
        worksheet.addRow([
          item.ticketNo || "-",
          item.plateNo || "-",
          item.type || "-",
          `Php ${(item.baseRate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          `Php ${(item.finalPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        ]);
      });

      // 5. BRANDED FOOTER (-1/8 height adjustment)
      const lastRowNumber = worksheet.lastRow.number + 2;
      worksheet.getRow(lastRowNumber).height = 52.5;
      await addImageToWorksheet(
        workbook,
        worksheet,
        footerImg,
        `A${lastRowNumber}:E${lastRowNumber + 3}`,
      );

      // 6. Formatting Column Widths
      worksheet.columns = [
        { width: 15 }, // Ticket No
        { width: 15 }, // Plate No
        { width: 15 }, // Type
        { width: 15 }, // Fee
        { width: 20 }, // Total
      ];

      // 7. Generate and Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `Parking_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );

      logActivity(
        role,
        "EXPORT_EXCEL",
        `Exported branded report for ${filtered.length} vehicles`,
        "Parking",
      );
    } catch (err) {
      console.error("Parking ExcelJS Export Failed:", err);
      alert("Failed to export Excel. Please check the console for details.");
    }
  };

  const exportToPDF = () => {
    if (!validateCollector()) return;
    if (filtered.length === 0) return alert("No records to export.");

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. HEADER IMAGE
    doc.addImage(headerImg, "PNG", 0, 0, pageWidth, 35);

    // 2. REPORT TITLE & METADATA
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("PARKING REPORTS", pageWidth / 2, 45, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 55);
    doc.text(`Collector: ${collectorName}`, 15, 61);
    doc.text(`No. of Vehicles: ${filtered.length}`, pageWidth - 15, 55, {
      align: "right",
    });

    const revenueText = `Revenue: Php ${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    doc.text(revenueText, pageWidth - 15, 67, { align: "right" });

    // DATA TABLE
    autoTable(doc, {
      startY: 70,
      margin: { left: 15, right: 15, bottom: 35 }, // Ensure table stays within page margins
      head: [["Ticket No.", "Plate No.", "Type", "Fee", "Total"]], // Removed "Duration"
      body: filtered.map((item) => [
        item.ticketNo || "-",
        item.plateNo || "-",
        item.type || "-",
        `Php ${(item.baseRate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, // Use Php
        `Php ${(item.finalPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, // Use Php
      ]),
      headStyles: { fillColor: [16, 185, 129] }, // Red branding
      styles: { fontSize: 9, halign: "center" },
      columnStyles: {
        0: { halign: "left" }, // Ticket No
        1: { halign: "left" }, // Plate No
      },
      didDrawPage: (data) => {
        // 4. FOOTER IMAGE ON EVERY PAGE
        doc.addImage(footerImg, "PNG", 0, pageHeight - 30, pageWidth, 30);
      },
    });

    doc.save(`Parking_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
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
        "Plate No",
        "Type",
        "Report State",
        "Fee/Hr",
        "Total",
        "Time In",
        "Time Out",
        "Duration",
        "Status",
      ]
    : [
        "Ticket No",
        "Plate No",
        "Type",
        "Report State",
        "Fee/Hr",
        "Total",
        "Time In",
        "Time Out",
        "Duration",
        "Status",
      ];

  return (
    <Layout title="Parking Management">
      <div className="mb-6">
        <StatCardGroupPark
          cars={fourWheelCount}
          motorcycles={twoWheelCount}
          jeeps={jeepCount}            
          parked={parkedCount}        
          departed={departedCount}     
          totalVehicles={filtered.length}
          totalRevenue={revenue}
        />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        
        <div className="w-full lg:w-[350px]">
          <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
        
        <div className="flex flex-wrap items-center justify-start lg:justify-end gap-3 w-full lg:w-auto">
          {role === "parking" && (
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={isReporting}
              className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all w-full sm:w-auto"
            >
              <FileText size={18} />
              <span>Submit Report</span>
            </button>
          )}

          {role === "parking" && (
            <button
                onClick={() => {
                  fetchPreviousShiftReports(); 
                    setShowPreviousShiftModal(true);
                }}
                className="flex items-center cursor-pointer justify-center space-x-2 border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-all"
                >
                <span>Previous Shift Records</span>
            </button>
          )}

          {role === "superadmin" && (
            <button
              onClick={() => setShowPriceModal(true)}
              className="flex items-center justify-center cursor-pointer gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
              title="Price Setting"
            >
              <Settings size={18} className="text-slate-600" />
              <span>Set Price</span>
            </button>
          )}

          <button
            onClick={handleAddClick}
            className="bg-gradient-to-r cursor-pointer from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all whitespace-nowrap"
            title="Add New Ticket"
          >
            + Add New
          </button>
          
          <ExportMenu onExportExcel={handleExportExcel} onExportPDF={exportToPDF} />
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3">
            <ParkingFilter activeType={activeType} onTypeChange={setActiveType} />
            <select
              value={activeStatus}
              onChange={(e) => {
                setActiveStatus(e.target.value);
                setCurrentPage(1); 
              }}
              className="h-[42px] rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Parked">Parked</option>
              <option value="Departed">Departed</option>
            </select>
          </div>

          {/* Right Side: Wrapped Date Filters and Logs Button Together */}
          <div className="flex flex-wrap items-center justify-start xl:justify-end gap-3 w-full xl:w-auto">
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 min-h-[42px]">
            {role === "parking" && (
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
                  title="Delete Selected"
                  className="rounded-lg p-1.5 bg-white text-red-500 hover:text-red-700 shadow-sm border border-red-200 transition-all cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end w-full sm:w-auto gap-3">
            {role !== "superadmin" && (
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
                    setCollectorId(nextId);

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
          </div>

        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading tickets...</div>
      ) : (
        <>
          <TerminalBoardShell title="Parking Board">
            <Table
              variant="terminal"
            columns={tableColumns}
            data={paginatedData.map((ticket) => {
              const isDeleteRequested = deleteRequestIds.includes(String(ticket.id));
              const isOnRead = Boolean(ticket.submitted);
              const isDeleteHighlighted = isDeleteRequested || isOnRead;
              const baseData = {
                id: ticket.id,
                ticketno: ticket.ticketNo ? `#${ticket.ticketNo}` : "---",
                plateno: ticket.plateNo || "---",
                type: ticket.type,
                reportstate: isDeleteRequested ? (
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                    Delete Requested
                  </span>
                ) : isOnRead ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-400">
                    Submitted
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    Pending
                  </span>
                ),
                "fee/hr": ticket.baseRate ? `₱${ticket.baseRate}` : "---",
                total: ticket.finalPrice ? `₱${ticket.finalPrice}` : "---",
                timein: formatTimeOnly(ticket.timeIn),
                timeout: ticket.timeOut
                  ? formatTimeOnly(ticket.timeOut)
                  : "---",
                duration: ticket.duration || "---",
                status: ticket.status,
                __highlightVariant: isDeleteRequested ? "amber" : "emerald",
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
                        checked={selectedIds.includes(ticket.id)}
                        onChange={() => toggleSelect(ticket.id)}
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
                  {row.status === "Parked" && (
                    <button
                      onClick={() => setLogoutRow(selectedRecord)}
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center gap-1 px-2"
                    >
                      <LogOut size={16} />{" "}
                      <span className="text-xs cursor-pointer font-medium">
                        Depart
                      </span>
                    </button>
                  )}
                  <TableActions
                    onView={() => setViewRow(selectedRecord)}
                    onEdit={
                      selectedRecord.timeOut
                        ? undefined
                        : () => setEditRow(selectedRecord)
                    }
                    onDelete={
                      role === "parking"
                        ? () => {
                            setDeleteRow(selectedRecord);
                            setDeleteRemarks("");
                          }
                        : undefined
                    }
                    deleteVariant={role === "parking" ? "request" : "delete"}
                  />
                  <button
                    onClick={() => handleArchive(selectedRecord)}
                    className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 cursor-pointer hover:bg-yellow-100"
                    title="Archive"
                  >
                    <Archive size={16} />
                  </button>
                  {role == "superadmin" && (
                    <button
                      onClick={() => setDeleteRow(selectedRecord)}
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
          </TerminalBoardShell>

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

      {editRow && (
        <EditParking
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={handleEditSave}
        />
      )}

      <LogModal isOpen={showLogModal} onClose={() => setShowLogModal(false)} />

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
              <br />
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

      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-5 border-b pb-3">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings size={20} className="text-emerald-600" />
                Parking Price Settings
              </h3>
              <button
                onClick={closePriceModal}
                className="text-slate-400 hover:text-red-500 p-1 rounded-full transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-5">
              Set a new parking rates. These prices will apply to newly created
              tickets.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Jeep Rate (₱{modalPrices.jeep || 0} per day)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-500">
                    ₱
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={modalPrices.jeep}
                    onChange={(e) =>
                      handleModalPriceChange("jeep", e.target.value)
                    }
                    className="w-full bg-white border border-slate-300 pl-8 pr-3 py-2.5 rounded-lg font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  4 Wheels Rate (₱{modalPrices.car || 0} for the first 3 hours,
                  +₱{modalPrices.car || 0} per additional hour)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-500">
                    ₱
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={modalPrices.car}
                    onChange={(e) =>
                      handleModalPriceChange("car", e.target.value)
                    }
                    className="w-full bg-white border border-slate-300 pl-8 pr-3 py-2.5 rounded-lg font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  2 Wheels Rate (₱{modalPrices.motorcycle || 0} for the first 3
                  hours, +₱{modalPrices.motorcycle || 0} per additional hour)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-500">
                    ₱
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={modalPrices.motorcycle}
                    onChange={(e) =>
                      handleModalPriceChange("motorcycle", e.target.value)
                    }
                    className="w-full bg-white border border-slate-300 pl-8 pr-3 py-2.5 rounded-lg font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t pt-4">
              <button
                onClick={closePriceModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveBasePrices}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div
            className={`bg-white w-full ${
              step === 1 ? "max-w-4xl p-8" : "max-w-md p-6"
            } rounded-2xl shadow-2xl text-center transition-all duration-300 relative`}
          >
            <button
              onClick={() => {
                setShowAddModal(false);
                setUseManualTimes(false);
                setManualArrivalTime("");
                setManualDepartureTime("");
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              {step === 1 ? "Select Vehicle" : "Enter Details"}
            </h1>
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 animate-in fade-in duration-300">
                {/* 4 Wheels */}
                <button
                  onClick={() => handleSelectType("4 Wheels")}
                  className="h-[170px] px-6 w-full flex flex-col items-center justify-center text-center rounded-[20px] bg-cyan-50 text-cyan-600 cursor-pointer transition-transform active:scale-95 hover:shadow-lg hover:-translate-y-1"
                >
                  <Car size={80} className="mb-4" />
                  <span className="text-2xl font-bold mt-2">4 Wheels</span>
                  <span className="text-sm opacity-70 mt-2 font-medium">
                    ₱{Number(priceSettings.carRate || 0).toFixed(2)} for 3 hrs,
                    +₱{Number(priceSettings.carRate || 0).toFixed(2)}/hr
                  </span>
                </button>

                {/* 2 Wheels */}
                <button
                  onClick={() => handleSelectType("2 Wheels")}
                  className="h-[170px] px-6 w-full flex flex-col items-center justify-center text-center rounded-[20px] bg-orange-50 text-orange-500 cursor-pointer transition-transform active:scale-95 hover:shadow-lg hover:-translate-y-1"
                >
                  <Bike size={70} className="mb-4" />
                  <span className="text-2xl font-bold mt-2">2 Wheels</span>
                  <span className="text-sm opacity-70 mt-2 font-medium">
                    ₱{Number(priceSettings.motorcycleRate || 0).toFixed(2)} for
                    3 hrs, +₱
                    {Number(priceSettings.motorcycleRate || 0).toFixed(2)}/hr
                  </span>
                </button>

                {/* Jeep */}
                <button
                  onClick={() => handleSelectType("Jeep")}
                  className="h-[170px] px-6 w-full flex flex-col items-center justify-center text-center rounded-[20px] bg-green-50 text-green-600 cursor-pointer transition-transform active:scale-95 hover:shadow-lg hover:-translate-y-1"
                >
                  <Bus size={70} className="mb-4 text-green-600" />
                  <span className="text-2xl font-bold mt-2">Jeep</span>
                  <span className="text-sm opacity-70 mt-2 font-medium">
                    ₱{Number(priceSettings.jeepRate || 0).toFixed(2)} / day
                  </span>
                </button>
              </div>
            )}
            {step === 2 && (
              <div className="flex justify-center">
                <div className="w-full max-w-lg flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  
                  <div>
                    <span
                      className={`inline-block px-6 py-3 rounded-full text-lg font-bold border-2 ${getBadgeStyles()}`}
                    >
                      Selected:{" "}
                      {newTicket.type === "4 Wheels"
                        ? "4 Wheels"
                        : newTicket.type === "2 Wheels"
                          ? "2 Wheels"
                          : "Jeep"}
                    </span>
                  </div>

                  <div className="text-left">
                    <label className="block text-gray-500 text-lg font-semibold mb-2 ml-1">
                      Plate Number
                    </label>
                    <input
                      ref={plateInputRef}
                      type="text"
                      list="plate-options"
                      placeholder="ABC 123"
                      required
                      value={newTicket.plateNo}
                      onChange={(e) =>
                        setNewTicket({
                          ...newTicket,
                          plateNo: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full p-5 text-2xl border-2 border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-600 outline-none transition-colors uppercase"
                    />
                    <datalist id="plate-options">
                      {existingPlates.map((plate, index) => (
                        <option key={index} value={plate} />
                      ))}
                    </datalist>
                  </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Manual Time Entry</p>
                          <p className="text-xs text-slate-500">
                            Toggle this if you need to backdate arrival or departure times.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUseManualTimes((prev) => !prev)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                            useManualTimes ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              useManualTimes ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      {useManualTimes ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="text-left text-sm font-medium text-slate-600">
                            Arrival Time
                            <input
                              type="datetime-local"
                              value={manualArrivalTime}
                              onChange={(e) => setManualArrivalTime(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                          </label>

                          <label className="text-left text-sm font-medium text-slate-600">
                            Departure Time
                            <input
                              type="datetime-local"
                              value={manualDepartureTime}
                              onChange={(e) => setManualDepartureTime(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                          </label>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Current time will be used unless you turn on manual time entry.
                        </p>
                      )}
                    </div>

                  <div className="text-left mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-gray-500 text-lg font-semibold ml-1">
                        Ticket Number {isAutoTicket && <span className="text-emerald-500 text-sm lowercase normal-case ml-1">(Auto-counted)</span>}
                      </label>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${!isAutoTicket ? 'text-emerald-600' : 'text-gray-400'}`}>Manual</span>
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
                                const res = await fetch(`${API_URL}/next-ticket`);
                                if (res.ok) {
                                  const data = await res.json();
                                  setNewTicket(prev => ({ ...prev, ticketNo: data.nextTicketNo }));
                                }
                              } catch (error) {
                                setNewTicket(prev => ({ ...prev, ticketNo: "T-01" }));
                              }
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${isAutoTicket ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAutoTicket ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className={`text-xs font-bold uppercase tracking-wider ${isAutoTicket ? 'text-emerald-600' : 'text-gray-400'}`}>Auto</span>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={newTicket.ticketNo}
                      onChange={(e) => setNewTicket({ ...newTicket, ticketNo: e.target.value })}
                      disabled={isAutoTicket}
                      placeholder={!isAutoTicket ? "Enter ticket number" : ""}
                      className={`w-full p-5 text-2xl border-2 rounded-xl transition-all font-bold ${
                        isAutoTicket
                          ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-gray-50 border-gray-300 text-gray-800 focus:bg-white focus:border-blue-600 outline-none"
                      }`}
                    />
                  </div>

                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={handleBack}
                      className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-500 border-2 border-gray-300 text-xl font-bold rounded-xl hover:bg-gray-50 transition-colors py-3"
                    >
                      <ArrowLeft size={24} /> Back
                    </button>
                    <button
                      onClick={handleCreateTicket}
                      className="flex-[2] bg-emerald-500 text-white text-xl font-bold rounded-xl hover:bg-emerald-600 active:scale-95 transition-all shadow-md hover:shadow-lg py-3"
                    >
                      ENTER TICKET
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {duplicateModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl text-center">
            <h3 className="text-lg font-bold text-red-600 mb-2">
              Duplicate Entry
            </h3>
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
            <h3 className="text-lg font-bold text-slate-800">
              Confirm Departure
            </h3>
            <p className="text-slate-600 mt-2 text-sm">
              Ticket <strong>{logoutRow.ticketNo}</strong> is leaving.
              <br />
              The system will calculate the total price based on duration.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setLogoutRow(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 shadow-lg"
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-slate-800">
                View Parking Ticket
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
              <Field label="Ticket No" value={viewRow.ticketNo || "N/A"} />
              <Field label="Plate No" value={viewRow.plateNo || "N/A"} />
              <Field label="Type" value={viewRow.type} />
              <Field
                label="Base Rate"
                value={viewRow.baseRate ? `₱${viewRow.baseRate}` : "N/A"}
              />
              <Field
                label="Final Price"
                value={
                  viewRow.finalPrice ? `₱${viewRow.finalPrice}` : "Pending"
                }
              />
              <Field
                label="Time In"
                value={formatDateDisplay(viewRow.timeIn)}
              />
              <Field
                label="Time Out"
                value={formatDateDisplay(viewRow.timeOut)}
              />
              <Field label="Duration" value={viewRow.duration} />
              <Field label="Status" value={viewRow.status} />
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

      <DeleteModal
        isOpen={role === "superadmin" && !!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Record"
        message="Are you sure you want to permanently remove this record?"
        itemName={
          deleteRow
            ? deleteRow.ticketNo
              ? `Ticket #${deleteRow.ticketNo}`
              : "this item"
            : ""
        }
      />

      <RequestDeletionModal
        isOpen={role === "parking" && !!deleteRow}
        onClose={() => {
          setDeleteRow(null);
          setDeleteRemarks("");
        }}
        onConfirm={handleDeleteRequestConfirm}
        itemIdentifier={
          deleteRow
            ? deleteRow.ticketNo
              ? `Ticket #${deleteRow.ticketNo}`
              : "this item"
            : ""
        }
        remarks={deleteRemarks}
        setRemarks={setDeleteRemarks}
      />

      <SharedSubmitReportModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmit={handleSubmitReport}
        requiresCollector={role !== "superadmin"}
        moduleName="Parking"
        reportType="Parking"
        collectors={collectors}
        collectorId={collectorId}
        collectorName={collectorName}
        onCollectorChange={(nextCollectorId, selectedCollector) => {
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
        }}
        assignedShift={assignedShiftValue || "No assigned shift"}
        totalRecords={records.length}
        helperText="Submitted shift rows are removed from active parking board."
        isSubmitting={isReporting}
        submitDisabled={role !== "superadmin" && (!collectorId || !collectorName.trim())}
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
              <div className="py-10 text-center text-slate-500">No previous shift reports found for this Parking Admin.</div>
            ) : (
              <div className="max-h-[65vh] overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Submitted At</th>
                      <th className="px-4 py-3">Shift</th>
                      <th className="px-4 py-3">Collector</th>
                      <th className="px-4 py-3">Departed Vehicles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previousShiftReports.map((report) => {
                      const recordCount =
                        report?.data?.data?.length ??
                        report?.data?.statistics?.totalVehicles ??
                        0;
                      return (
                        <tr key={report._id || report.id}>
                          <td className="px-4 py-3 text-slate-700">
                            {formatSubmittedDateTime(
                              report?.data?.submittedAtServer || report.createdAt,
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {report?.data?.assignedShift || report?.payload?.assignedShift || report?.data?.shift || report?.payload?.shift || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {report?.data?.statistics?.collector || report?.data?.collectorName || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{recordCount}</td>
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

      {notificationState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 pointer-events-none">
          <div
            className={`flex items-center gap-4 ${notificationState.type === "success" ? "bg-emerald-500" : "bg-red-500"} 
                            text-white p-4 rounded-xl shadow-xl transition-all duration-300 transform 
                            animate-in fade-in slide-in-from-top-10 pointer-events-auto`}
            role="alert"
          >
            {notificationState.type === "success" ? (
              <CheckCircle size={32} />
            ) : (
              <X size={32} />
            )}
            <div>
              <h4 className="font-bold text-lg">
                {notificationState.type === "success" ? "Success!" : "Error"}
              </h4>
              <p className="text-sm">{notificationState.message}</p>
            </div>
            <button
              onClick={() =>
                setNotificationState({
                  isOpen: false,
                  type: "",
                  message: "",
                  autoClose: true,
                  duration: 2000,
                })
              }
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
