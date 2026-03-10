import React, { useState, useMemo, useEffect, useRef } from "react";
import Layout from "../components/layout/Layout";
import FilterBar from "../components/common/Filterbar";
import headerImg from "../assets/Header.png";
import footerImg from "../assets/FOOTER.png";
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
  Trash2,
  LogOut,
  Car,
  Bike,
  Archive,
  ArrowLeft,
  FileText,
  Loader2,
  History,
  ListChecks,
  X,
  Pencil,
  CheckCircle,
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
  const [selectedDate, setSelectedDate] = useState("");
  const [activeType, setActiveType] = useState("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [modalPrices, setModalPrices] = useState({
    car: 10,
    motorcycle: 5,
  });

  const [priceSettings, setPriceSettings] = useState({
    carRate: 10,
    motorcycleRate: 5,
  });

  useEffect(() => {
    if (showPriceModal) {
      setModalPrices({
        car: priceSettings.carRate.toFixed(2),
        motorcycle: priceSettings.motorcycleRate.toFixed(2),
      });
    }
  }, [showPriceModal, priceSettings]);

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

    if (
      isNaN(carRate) ||
      isNaN(motorcycleRate) ||
      carRate <= 0 ||
      motorcycleRate <= 0
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

  const role = localStorage.getItem("authRole") || "superadmin";
  const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/parking`;
  const ARCHIVE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/archives`;

  const [newTicket, setNewTicket] = useState({
    ticketNo: "",
    type: "Car",
    plateNo: "",
    baseRate: 10,
    timeIn: "",
  });

  const existingPlates = useMemo(() => {
    return [...new Set(records.map((r) => r.plateNo).filter(Boolean))];
  }, [records]);

  const existingTicketNumbers = useMemo(() => {
    return [...new Set(records.map((r) => r.ticketNo).filter(Boolean))];
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
        updatedData.type === "Car"
          ? priceSettings.carRate
          : priceSettings.motorcycleRate;

      // If admin manually edited price, use it
      if (updatedData.price !== undefined && updatedData.price !== "") {
        baseRate = Number(updatedData.price);
      }

      const payload = {
        plateNumber: updatedData.plateNumber,
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
    const ticketDate = ticket.timeIn
      ? new Date(ticket.timeIn).toDateString()
      : "";
    const filterDate = selectedDate
      ? new Date(selectedDate).toDateString()
      : "";
    const matchesDate = !selectedDate || ticketDate === filterDate;
    const matchesType =
      activeType === "All" ||
      ticket.type.toLowerCase() === activeType.toLowerCase();
    return matchesSearch && matchesType && matchesDate;
  });

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const carCount = filtered.filter((t) => t.type === "Car").length;
  const motoCount = filtered.filter((t) => t.type === "Motorcycle").length;
  const revenue = filtered.reduce((sum, t) => {
    if (t.finalPrice) return sum + Number(t.finalPrice);

    const duration = Number(t.duration) || 0;
    const rate = Number(t.baseRate) || 0;

    return sum + duration * rate;
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
        const requestPromises = selectedIds.map(async (id) => {
          const item = records.find((r) => r.id === id);
          if (!item) return;

          return fetch(`${API_URL}/api/deletion-requests`, {
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
          `Parking Admin has requested to delete ${selectedIds.length} parking records.`,
          "Parking",
          "superadmin",
        );

        await Promise.all(requestPromises);
        await logActivity(
          role,
          "REQUEST_BULK_DELETE",
          `Requested deletion for ${selectedIds.length} parking tickets`,
          "Parking",
        );

        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Sent deletion requests for ${selectedIds.length} records. Superadmin notified.`,
          autoClose: true,
          duration: 2000,
        });
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

  const generateTicketNumber = () => {
    if (records.length === 0) return "T-0001";

    const numbers = records
      .map((r) => parseInt(String(r.ticketNo).replace(/\D/g, "")))
      .filter((n) => !isNaN(n));

    const next = Math.max(...numbers) + 1;

    return `T-${String(next).padStart(4, "0")}`;
  };

  const handleAddClick = () => {
    const now = new Date();
    const formattedTimeIn = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 16);

    setNewTicket({
      ticketNo: generateTicketNumber(),
      type: "Car",
      plateNo: "",
      baseRate: 5,
      timeIn: formattedTimeIn,
    });
    setStep(1);
    setShowAddModal(true);
  };

  const handleSelectType = (type) => {
    const rate =
      type === "Car" ? priceSettings.carRate : priceSettings.motorcycleRate;
    setNewTicket((prev) => ({
      ...prev,
      type,
      baseRate: rate,
    }));
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setNewTicket((prev) => ({ ...prev, type: "", plateNo: "", ticketNo: "" }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.plateNo || !newTicket.ticketNo) {
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Please fill in both Ticket Number and Plate Number.",
        autoClose: true,
        duration: 2000,
      });
      return;
    }

    const duplicateTicket = existingTicketNumbers.includes(newTicket.ticketNo);

    if (duplicateTicket) {
      setDuplicateModal({
        isOpen: true,
        message: `Ticket Number #${newTicket.ticketNo} already exists!`,
      });
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
        await logActivity(
          role,
          "CREATE_TICKET",
          `Created Parking Ticket #${newTicket.ticketNo}`,
          "Parking",
        );
        fetchParkingTickets();
        setShowAddModal(false);
        setNotificationState({
          isOpen: true,
          type: "success",
          message: `Parking Ticket #${newTicket.ticketNo} created successfully.`,
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
      const response = await fetch(`${API_URL}/${logoutRow.id}/depart`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
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
      }
    } catch (error) {
      console.error("Error logging out:", error);
      setNotificationState({
        isOpen: true,
        type: "error",
        message: "Failed to process departure.",
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

  const handleSubmitReport = async () => {
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

      const formattedData = filtered.map((item) => {
        const { createdAt, updatedAt, isArchived, __v, _id, ...rest } = item;
        return {
          ...rest,
          timeIn: formatDateTime(rest.timeIn),
          timeOut: rest.timeOut
            ? formatDateTime(rest.timeOut)
            : "Parked (Active)",
        };
      });

      const reportPayload = {
        screen: "Parking Management",
        generatedDate: new Date().toLocaleString(),
        filters: {
          searchQuery,
          selectedDate: selectedDate
            ? new Date(selectedDate).toLocaleDateString()
            : "None",
          activeType,
        },
        statistics: {
          cars: carCount,
          motorcycles: motoCount,
          totalVehicles: filtered.length,
          totalRevenue: revenue,
        },
        data: formattedData,
      };

      const adminName = localStorage.getItem("authName") || "Parking Admin";
      await submitPageReport("Parking", reportPayload, adminName);

      await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/notifications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Report Submitted: Parking Report",
            message:
              "A new Parking Management report has been generated and the active log has been cleared.",
            source: "Parking",
            targetRole: "superadmin",
          }),
        },
      );

      const deletePromises = filtered.map((item) =>
        fetch(`${API_URL}/${item.id}`, { method: "DELETE" }),
      );

      await Promise.all(deletePromises);
      setNotificationState({
        isOpen: true,
        type: "success",
        message: "Report submitted successfully! The table has been cleared.",
        autoClose: true,
        duration: 2000,
      });
      setShowSubmitModal(false);
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
    if (newTicket.type === "Car")
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
    // Metadata on the right
    doc.text(`No. of Vehicles: ${filtered.length}`, pageWidth - 15, 55, {
      align: "right",
    });

    // Fix: Using "Php" and ensuring it fits within the margin by aligning right
    const revenueText = `Revenue: Php ${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    doc.text(revenueText, pageWidth - 15, 61, { align: "right" });

    // 3. DATA TABLE
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
          cars={carCount}
          motorcycles={motoCount}
          totalVehicles={filtered.length}
          totalRevenue={revenue}
        />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="flex items-center justify-end gap-3">
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
            className="bg-gradient-to-r cursor-pointer from-emerald-500 to-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
            title="Add New Ticket"
          >
            + Add New
          </button>
          <ExportMenu
            onExportExcel={handleExportExcel}
            onExportPDF={exportToPDF}
          />
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

          {role == "parking" && (
            <button
              onClick={toggleSelectionMode}
              title={isSelectionMode ? "Cancel Selection" : "Select Records"}
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

      {isLoading ? (
        <div className="text-center py-10">Loading tickets...</div>
      ) : (
        <>
          <Table
            columns={tableColumns}
            data={paginatedData.map((ticket) => {
              const baseData = {
                id: ticket.id,
                ticketno: ticket.ticketNo ? `#${ticket.ticketNo}` : "---",
                plateno: ticket.plateNo || "---",
                type: ticket.type,
                "fee/hr": ticket.baseRate ? `₱${ticket.baseRate}` : "---",
                total: ticket.finalPrice ? `₱${ticket.finalPrice}` : "---",
                timein: formatTimeOnly(ticket.timeIn),
                timeout: ticket.timeOut
                  ? formatTimeOnly(ticket.timeOut)
                  : "---",
                duration: ticket.duration || "---",
                status: ticket.status,
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
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
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
                  Car / Jeep Rate (per hour)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-500">
                    ₱
                  </span>
                  <input
                    type="text"
                    inputmode="decimal"
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
                  Motorcycle Rate (per hour)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-500">
                    ₱
                  </span>
                  <input
                    type="text"
                    inputmode="decimal"
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
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 text-center transition-all duration-300 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              {step === 1 ? "Select Vehicle" : "Enter Details"}
            </h1>
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in duration-300">
                <button
                  onClick={() => handleSelectType("Car")}
                  className="h-[220px] w-full flex flex-col items-center justify-center rounded-[20px] bg-cyan-50 text-cyan-600 cursor-pointer transition-transform active:scale-95 hover:shadow-lg hover:-translate-y-1"
                >
                  <Car size={80} className="mb-4" />
                  <span className="text-2xl font-bold mt-2">CAR / JEEP</span>
                  <span className="text-sm opacity-70 mt-1 font-medium">
                    {" "}
                    ₱{priceSettings.carRate}.00 / hr
                  </span>
                </button>
                <button
                  onClick={() => handleSelectType("Motorcycle")}
                  className="h-[220px] w-full flex flex-col items-center justify-center rounded-[20px] bg-orange-50 text-orange-500 cursor-pointer transition-transform active:scale-95 hover:shadow-lg hover:-translate-y-1"
                >
                  <Bike size={80} className="mb-4" />
                  <span className="text-2xl font-bold mt-2">MOTORCYCLE</span>
                  <span className="text-sm opacity-70 mt-1 font-medium">
                    {" "}
                    ₱{priceSettings.motorcycleRate}.00 / hr
                  </span>
                </button>
              </div>
            )}
            {step === 2 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div>
                  <span
                    className={`inline-block px-6 py-3 rounded-full text-lg font-bold border-2 ${getBadgeStyles()}`}
                  >
                    Selected:{" "}
                    {newTicket.type === "Car" ? "Car / Bus" : "Motorcycle"}
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
                <div className="text-left">
                  <label className="block text-gray-500 text-lg font-semibold mb-2 ml-1">
                    Ticket Number
                  </label>

                  <div className="w-full p-5 text-2xl border-2 border-gray-200 rounded-xl bg-gray-100 font-bold text-gray-700">
                    {newTicket.ticketNo}
                  </div>
                </div>
                <div className="flex gap-4 mt-2">
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
        isOpen={!!deleteRow}
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

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl transform transition-all scale-100">
            <h3 className="text-lg font-bold text-slate-800">Submit Report</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to capture and submit the current parking
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
