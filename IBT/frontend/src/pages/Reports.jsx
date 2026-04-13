import React, { useState, useEffect, useMemo } from "react";
import NotificationToast from "../components/common/NotificationToast";
import { useLocation } from "react-router-dom";
import Layout from "../components/layout/Layout";
import headerImg from "../assets/Header.png";
import footerImg from "../assets/FOOTER.png";
import FilterBar from "../components/common/Filterbar";
import ExportMenu from "../components/common/exportMenu";
import Table from "../components/common/Table";
import TableActions from "../components/common/TableActions";
import Pagination from "../components/common/Pagination";
import Field from "../components/common/Field";
import DeleteModal from "../components/common/DeleteModal";
import LogModal from "../components/common/LogModal";
import { logActivity } from "../utils/logger";
import {
  Archive,
  Trash2,
  Calendar,
  Tag,
  History,
  ListChecks,
  X,
  Loader2,
  FileSpreadsheet,
  FileText,
  ChevronLeft,   
  ChevronRight
} from "lucide-react";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const formatStatisticsLabel = (rawKey) => {
  const normalized = String(rawKey || "").replace(/[\s_-]/g, "").toLowerCase();

  if (normalized === "cars") return "4 Wheels";
  if (normalized === "motorcycles") return "2 Wheels";
  if (normalized === "missedcount" || normalized === "missedbus") return "Missed Bus";
  if (normalized === "departednow" || normalized === "departedbus") return "Departed Bus";

  return String(rawKey).replace(/([A-Z])/g, " $1").trim();
};

const DataRenderer = ({ reportPayload }) => {
  if (!reportPayload)
    return (
      <div className="text-gray-400 italic p-4">No report data available</div>
    );

  const { statistics, data } = reportPayload;

  const normalizeKey = (value) =>
    String(value || "")
      .replace(/[\s_-]/g, "")
      .toLowerCase();

  const formatStatLabel = (rawKey) => {
    return formatStatisticsLabel(rawKey);
  };

  const formatStatValue = (key, value) => {
    if (typeof value !== "number") return value;

    const normalizedKey = normalizeKey(key);
    const isCurrencyField =
      normalizedKey.includes("revenue") ||
      normalizedKey.includes("price") ||
      normalizedKey.includes("amount") ||
      normalizedKey.includes("fee");

    if (isCurrencyField) {
      return `₱${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    return value.toLocaleString();
  };

  const formatTimeWithAmPm = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "-";

    const already12Hour = raw.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (already12Hour) {
      const h = parseInt(already12Hour[1], 10);
      if (Number.isNaN(h) || h < 1 || h > 12) return raw;
      return `${h}:${already12Hour[2]} ${already12Hour[3].toUpperCase()}`;
    }

    const twentyFourHour = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!twentyFourHour) return raw;

    const hour = parseInt(twentyFourHour[1], 10);
    if (Number.isNaN(hour) || hour < 0 || hour > 23) return raw;
    const minute = twentyFourHour[2];
    const period = hour >= 12 ? "PM" : "AM";
    const converted = hour % 12 || 12;
    return `${converted}:${minute} ${period}`;
  };

  const formatDateTimeWithAmPm = (value) => {
    if (value === null || value === undefined || value === "") return "-";

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    return formatTimeWithAmPm(value);
  };

  const renderStats = () => {
    if (!statistics || Object.keys(statistics).length === 0) return null;

    const visibleStats = Object.entries(statistics).filter(([key]) => {
      const normalizedKey = String(key).toLowerCase();
      return !["collectorid", "arrivalslogged", "departureslogged"].includes(normalizedKey);
    });

    if (visibleStats.length === 0) return null;

    return (
      <div className="mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {visibleStats.map(([key, value]) => (
            <div
              key={key}
              className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm"
            >
              <div className="text-xs text-slate-400 uppercase font-bold mb-1">
                {formatStatLabel(key)}
              </div>
              <div className="text-xl font-bold text-slate-800">
                {formatStatValue(key, value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDataTable = () => {
    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-medium">
            No records were found in this report.
          </p>
        </div>
      );
    }

    const reportScreen = String(reportPayload?.screen || "").toLowerCase();
    const hasParkingShape = Object.keys(data[0]).some((key) =>
      ["ticketno", "plateno", "reportid", "pricingtype", "timein", "timeout"].includes(
        normalizeKey(key),
      ),
    );
    const hasTerminalShape = Object.keys(data[0]).some((key) =>
      ["ticketno", "passengertype", "reportstatus", "time", "date", "price"].includes(
        normalizeKey(key),
      ),
    );
    const isParkingReport = reportScreen.includes("parking") || hasParkingShape;
    const isTerminalReport = reportScreen.includes("terminal") || hasTerminalShape;

    const hiddenParkingHeaders = new Set(["reportid", "pricingtype", "submitted"]);
    const hiddenTerminalHeaders = new Set([
      "reportstatus",
      "submitted",
      "submittedat",
      "submittedatserver",
    ]);

    const headers = Object.keys(data[0]).filter((k) => {
      const normalizedKey = normalizeKey(k);
      if (["id", "_id", "category"].includes(normalizedKey)) return false;
      if (isParkingReport && hiddenParkingHeaders.has(normalizedKey)) return false;
      if (isTerminalReport && hiddenTerminalHeaders.has(normalizedKey)) return false;
      return true;
    });

    const timeInHeader = headers.find((header) => normalizeKey(header) === "timein");
    const timeOutHeader = headers.find((header) => normalizeKey(header) === "timeout");

    if (timeInHeader && timeOutHeader) {
      const timeInIndex = headers.indexOf(timeInHeader);
      const timeOutIndex = headers.indexOf(timeOutHeader);

      if (timeOutIndex !== timeInIndex + 1) {
        headers.splice(timeOutIndex, 1);
        const targetIndex = headers.indexOf(timeInHeader) + 1;
        headers.splice(targetIndex, 0, timeOutHeader);
      }
    }

    return (
      <div>
        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm max-h-[400px]">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 whitespace-nowrap font-semibold border-b border-slate-200"
                  >
                    {header
                      .replace(/([a-z])([A-Z])/g, "$1 $2")
                      .replace(/[_-]+/g, " ")
                      .trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  {headers.map((header) => {
                    let cellVal = row[header];
                    if (typeof cellVal === "object" && cellVal !== null)
                      cellVal = JSON.stringify(cellVal);

                    const normalizedHeader = normalizeKey(header);
                    if (["arrivaltime", "departuretime", "time", "departure", "timein", "timeout"].includes(normalizedHeader)) {
                      cellVal = formatTimeWithAmPm(cellVal);
                    }

                    if (["submittedat", "submittedatserver"].includes(normalizedHeader)) {
                      cellVal = formatDateTimeWithAmPm(cellVal);
                    }

                    return (
                      <td
                        key={`${idx}-${header}`}
                        className="px-4 py-3 whitespace-nowrap text-slate-700"
                      >
                        {cellVal || "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-2">
      {renderStats()}
      {renderDataTable()}
    </div>
  );
};

  const formatReportDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDateKey = (dateInput) => {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

const Reports = () => {
  const location = useLocation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({
    isOpen: false,
    type: "success",
    message: ""
  });

  const showToast = (type, message) => {
    setToast({ isOpen: true, type, message });

    setTimeout(() => {
      setToast(prev => ({ ...prev, isOpen: false }));
    }, 3000);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilterType, setDateFilterType] = useState("All");
  const [currentDateRange, setCurrentDateRange] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showLogModal, setShowLogModal] = useState(false);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [viewRow, setViewRow] = useState(null);
  const [archiveRow, setArchiveRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const role = localStorage.getItem("authRole") || "superadmin";
  const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/reports`;
  const ARCHIVE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/archives`;

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setRecords(data.map((item) => ({ ...item, id: item._id || item.id })));
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to delete report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    const onFocusRefresh = () => fetchReports();
    window.addEventListener("focus", onFocusRefresh);
    document.addEventListener("visibilitychange", onFocusRefresh);
    const interval = setInterval(fetchReports, 30000);
    return () => {
      window.removeEventListener("focus", onFocusRefresh);
      document.removeEventListener("visibilitychange", onFocusRefresh);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (records.length > 0 && location.state?.openReportId) {
      const targetId = location.state.openReportId;

      const reportToOpen = records.find(
        (r) => r.id === targetId || r._id === targetId,
      );

      if (reportToOpen) {
        setViewRow(reportToOpen);

        window.history.replaceState({}, document.title);
      }
    }
  }, [records, location.state]);

  const getRangeBounds = (type, date) => {
    if (type === "All") return { start: null, end: null };
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
    if (dateFilterType === "All") return;
    const newDate = new Date(currentDateRange);
    if (dateFilterType === "Daily") newDate.setDate(newDate.getDate() - 1);
    else if (dateFilterType === "Week") newDate.setDate(newDate.getDate() - 7);
    else if (dateFilterType === "Month") newDate.setMonth(newDate.getMonth() - 1);
    else if (dateFilterType === "Year") newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentDateRange(newDate);
    setCurrentPage(1);
  };

  const handleNextPeriod = () => {
    if (dateFilterType === "All") return;
    const newDate = new Date(currentDateRange);
    if (dateFilterType === "Daily") newDate.setDate(newDate.getDate() + 1);
    else if (dateFilterType === "Week") newDate.setDate(newDate.getDate() + 7);
    else if (dateFilterType === "Month") newDate.setMonth(newDate.getMonth() + 1);
    else if (dateFilterType === "Year") newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentDateRange(newDate);
    setCurrentPage(1);
  };

  const getPeriodDisplayStr = () => {
    if (dateFilterType === "All") return "All Time";
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

  const filtered = useMemo(() => {
    return records.filter((report) => {
      const reportDate = new Date(report.createdAt || report.date);

      const matchesSearch =
        report.id?.toString().includes(searchQuery) ||
        report.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.author?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || report.type === selectedCategory;

      let matchesDateRange = false;
      if (dateFilterType === "All") {
        matchesDateRange = true;
      } else if (reportDate && !Number.isNaN(reportDate.getTime())) {
        matchesDateRange = reportDate >= filterStart && reportDate <= filterEnd;
      }

      return matchesSearch && matchesCategory && matchesDateRange;
    });
  }, [records, searchQuery, selectedCategory, filterStart, filterEnd, dateFilterType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilterType, currentDateRange, selectedCategory]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);
  const addImageToWorksheet = async (workbook, worksheet, imageSrc, range) => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: 'png',
      });

      worksheet.addImage(imageId, range);
    } catch (error) {
      console.error("Reports branding image failed:", error);
    }
  };

  const handleExportExcel = async () => {
    if (filtered.length === 0) return alert("No records to export.");

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Overall Terminal Report");

      worksheet.getRow(1).height = 35;
      await addImageToWorksheet(workbook, worksheet, headerImg, 'A1:D4');

      worksheet.mergeCells('A6:D6');
      const titleCell = worksheet.getCell('A6');
      titleCell.value = 'OVERALL TERMINAL REPORTS';
      titleCell.font = { bold: true, size: 14, color: { argb: 'FFDC2626' } };
      titleCell.alignment = { horizontal: 'center' };

      const getRevenue = (item) => item.data?.statistics?.totalRevenue || item.data?.statistics?.revenue || 0;
      const overallTotalRevenue = filtered.reduce((sum, item) => sum + getRevenue(item), 0);

      const adminName = localStorage.getItem("authName") || localStorage.getItem("authEmail") || "Admin";

      worksheet.addRow([]);
      worksheet.addRow([`Date: ${new Date().toLocaleDateString()}`, '', '', `Overall Total Revenue: Php ${overallTotalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]);
      worksheet.addRow([`Collector: ${adminName}`, '', '', '']); 
      worksheet.addRow([]);

      const headerRow = worksheet.addRow(["Report ID", "Department", "Operator", "Revenue"]);
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center' };
      });

      
      filtered.forEach((item) => {
        worksheet.addRow([
          item.id ? item.id.substring(0, 8).toUpperCase() : "-",
          item.type || "-",
          item.author || "-",
          `Php ${getRevenue(item).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        ]);
      });

      const lastRowNumber = worksheet.lastRow.number + 2;
      worksheet.getRow(lastRowNumber).height = 52.5;
      await addImageToWorksheet(workbook, worksheet, footerImg, `A${lastRowNumber}:D${lastRowNumber + 3}`);

      worksheet.columns = [{ width: 20 }, { width: 25 }, { width: 25 }, { width: 25 }];

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Overall_Terminal_Report_${new Date().toISOString().split("T")[0]}.xlsx`);

      logActivity(role, "EXPORT_OVERALL_EXCEL", "Exported branded Overall Report", "Reports");
    } catch (err) {
      console.error("ExcelJS Overall Export Error:", err);
      alert("Failed to export branded Excel.");
    }
  };

  const handleExportPDF = () => {
    if (filtered.length === 0) return alert("No records to export.");

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const getRevenue = (item) =>
      item.data?.statistics?.totalRevenue ||
      item.data?.statistics?.revenue ||
      0;
    const overallTotalRevenue = filtered.reduce(
      (sum, item) => sum + getRevenue(item),
      0,
    );

    doc.addImage(headerImg, "PNG", 0, 0, pageWidth, 35);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("OVERALL REPORTS", pageWidth / 2, 45, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 55);
    doc.text(
      `Collector: ${localStorage.getItem("authName") || "Admin"}`,
      15,
      61,
    );

    doc.setFont("helvetica", "bold");
    doc.text("Overall Total Revenue:", pageWidth - 70, 55);
    doc.setFont("helvetica", "normal");
    doc.text(
      `₱${overallTotalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      pageWidth - 15,
      55,
      { align: "right" },
    );

    autoTable(doc, {
      startY: 70,
      margin: { bottom: 35 },
      head: [["Report ID", "Department", "Operator", "Revenue"]],
      body: filtered.map((item) => [
        item.id ? item.id.substring(0, 8).toUpperCase() : "-",
        item.type || "-",
        item.author || "-",
        `₱${getRevenue(item).toFixed(2)}`,
      ]),
      headStyles: { fillColor: [16, 185, 129] }, 
      styles: { fontSize: 9, halign: "center" },
      columnStyles: {
        0: { halign: "left" }, 
        1: { halign: "left" }, 
        2: { halign: "left" }, 
      },
      didDrawPage: (data) => {
      
        doc.addImage(footerImg, "PNG", 0, pageHeight - 30, pageWidth, 30);
      },
    });

    doc.save(
      `Overall_Terminal_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
    );
    logActivity(
      role,
      "EXPORT_OVERALL_PDF",
      `Exported Overall Report summary to PDF`,
      "Reports",
    );
  };

 
  const handleSingleExportExcel = async (report) => {
    try {
      const workbook = new ExcelJS.Workbook();

    
      const wsSummary = workbook.addWorksheet("Summary");

     
      wsSummary.getRow(1).height = 35;
      await addImageToWorksheet(workbook, wsSummary, headerImg, 'A1:B4');

      wsSummary.addRow([]); 
      wsSummary.addRow(["REPORT DETAILS"]).font = { bold: true, size: 12 };
      wsSummary.addRow(["ID", report.id]);
      wsSummary.addRow(["Type", report.type]);
      wsSummary.addRow(["Author", report.author]);
      wsSummary.addRow(["Date", formatReportDate(report.createdAt || report.date)]);
      wsSummary.addRow([]);

      const statsHeader = wsSummary.addRow(["STATISTICS"]);
      statsHeader.font = { bold: true };

      if (report.data?.statistics) {
        Object.entries(report.data.statistics).forEach(([key, value]) => {
          wsSummary.addRow([formatStatisticsLabel(key), value]);
        });
      }
      const lastRowSummary = wsSummary.lastRow.number + 2;
      wsSummary.getRow(lastRowSummary).height = 52.5;
      await addImageToWorksheet(workbook, wsSummary, footerImg, `A${lastRowSummary}:B${lastRowSummary + 3}`);

      wsSummary.getColumn(1).width = 25;
      wsSummary.getColumn(2).width = 30;

      if (Array.isArray(report.data?.data) && report.data.data.length > 0) {
        const wsData = workbook.addWorksheet("Data Records");
        const headers = Object.keys(report.data.data[0]);

        const dataHeaderRow = wsData.addRow(headers.map(h => h.replace(/([A-Z])/g, " $1").trim()));
        dataHeaderRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        });

        report.data.data.forEach(row => {
          wsData.addRow(Object.values(row));
        });

        wsData.getRow(1).height = 35;


        wsData.columns.forEach(col => col.width = 20);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `${report.type}_Report_${report.id.substring(0, 8)}.xlsx`);

      logActivity(role, "EXPORT_SINGLE_EXCEL", `Exported branded Single Report for ${report.id}`, "Reports");
    } catch (err) {
      console.error("Single Export Error:", err);
      alert("Failed to export individual report.");
    }
  };

  const handleSingleExportPDF = (report) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Report Details", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`ID: ${report.id}`, 14, 30);
    doc.text(`Type: ${report.type}`, 14, 36);
    doc.text(`Author: ${report.author}`, 14, 42);
    doc.text(
      `Date: ${formatReportDate(report.createdAt || report.date)}`,
      14,
      48,
    );

    let currentY = 60;
    if (report.data?.statistics) {
      doc.setFontSize(12);
      doc.text("Statistics", 14, currentY);
      currentY += 10;

      const statsData = Object.entries(report.data.statistics).map(([k, v]) => [
        formatStatisticsLabel(k),
        v,
      ]);
      autoTable(doc, {
        startY: currentY,
        head: [["Metric", "Value"]],
        body: statsData,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129], textColor: 50 },
        styles: { fontSize: 10 },
      });
      currentY = doc.lastAutoTable.finalY + 15;
    }

    if (Array.isArray(report.data?.data) && report.data.data.length > 0) {
      doc.setFontSize(12);
      doc.text("Data Records", 14, currentY);

      const headers = Object.keys(report.data.data[0]);
      const rows = report.data.data.map((row) => Object.values(row));

      autoTable(doc, {
        startY: currentY + 5,
        head: [headers],
        body: rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [16, 185, 129] },
      });
    }

    doc.save(`${report.type}_Report_${report.id}.pdf`);
  };

  const toggleSelectionMode = () => {
    if (isSelectionMode) setSelectedIds([]);
    setIsSelectionMode(!isSelectionMode);
  };

  const handleClearDateFilter = () => {
    setSelectedDate("");
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
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} reports? \n\nThey will be moved to the Archives before deletion.`,
      )
    )
      return;

    setLoading(true);
    try {
      const processPromises = selectedIds.map(async (id) => {
        const report = records.find((r) => r.id === id);
        if (!report) return;

        await fetch(ARCHIVE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "Report",
            description: `${report.type} Report by ${report.author}`,
            originalData: report,
            archivedBy: role,
          }),
        });

        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      });

      await Promise.all(processPromises);
      await logActivity(
        role,
        "BULK_DELETE_REPORTS",
        `Archived & Deleted ${selectedIds.length} reports`,
        "Reports",
      );

      await fetchReports();
      setSelectedIds([]);
      setIsSelectionMode(false);
      alert(`Successfully archived and deleted ${selectedIds.length} reports.`);
    } catch (error) {
      console.error("Bulk action failed", error);
      alert("Failed to process some records.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    try {
      await fetch(`${API_URL}/${deleteRow.id}`, { method: "DELETE" });
      await logActivity(
        role,
        "DELETE_REPORT",
        `Deleted Report ${deleteRow.id}`,
        "Reports",
      );
      setRecords(records.filter((r) => r.id !== deleteRow.id));
      setDeleteRow(null);
      showToast("success", "Report deleted successfully.");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to delete report.");
    }
  };

  const confirmArchive = async () => {
    if (!archiveRow) return;
    const row = archiveRow;
    setArchiveRow(null);

    try {
      const idToArchive = row._id || row.id;
      if (!idToArchive) throw new Error("Record ID is missing.");


      const response = await fetch(`${API_URL}/${idToArchive}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) throw new Error("Failed to archive report");

      await logActivity(role, "ARCHIVE_REPORT", `Archived Report ${idToArchive}`, "Reports");

      setRecords(records.filter((r) => r.id !== idToArchive));

      showToast("success", "Report archived successfully.");
    } catch (e) {
      console.error("Archive Error:", e);
      showToast("error", "Failed to archive report.");
    }
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
      "Report ID",
      "Type",
      "Author",
      "Date",
    ]
    : ["Report ID", "Type", "Author", "Date"];

  return (
    <Layout title="Reports Management">
      <div className="flex flex-col gap-4 mb-6">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="w-full lg:w-[350px]">
            <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>
          
          <div className="flex items-center justify-end gap-3 w-full lg:w-auto">
             <ExportMenu onExportExcel={handleExportExcel} onExportPDF={handleExportPDF} />
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          <div className="relative w-full sm:w-64 shrink-0">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Tag size={16} />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-8 h-[42px] bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
            >
              {["All", "Bus Trips", "Terminal Fees", "Tenant/Lease", "Parking", "Lost & Found"].map((cat) => (
                <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-start xl:justify-end gap-3 w-full xl:w-auto">
            
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 h-[42px]">
                {["All", "Daily", "Week", "Month", "Year"].map((type) => (
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

              {dateFilterType !== "All" && (
                <div className="flex items-center justify-between border border-slate-200 bg-white rounded-xl h-[42px] min-w-[240px] px-2 shadow-sm">
                  <button onClick={handlePrevPeriod} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer">
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 whitespace-nowrap">
                    <Calendar size={16} className="text-slate-400" />
                    {getPeriodDisplayStr()}
                  </div>
                  <button onClick={handleNextPeriod} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer">
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            {isSelectionMode && selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in bg-slate-100 p-1.5 rounded-xl border border-slate-200 h-[42px]">
                <span className="text-xs font-semibold text-slate-600 px-2 whitespace-nowrap">{selectedIds.length} Selected</span>
                <button onClick={handleBulkDelete} className="rounded-lg p-2 bg-white text-slate-500 hover:text-red-600 shadow-sm border border-slate-200 cursor-pointer">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )}

            {role === "superadmin" && (
              <button
                onClick={toggleSelectionMode}
                className={`flex items-center justify-center h-[42px] px-3 rounded-xl transition-all border cursor-pointer ${
                  isSelectionMode ? "bg-red-500 text-white border-red-600 shadow-md" : "bg-white border-slate-300 text-slate-500 hover:border-slate-400"
                }`}
              >
                {isSelectionMode ? <X size={20} /> : <ListChecks size={20} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 flex flex-col items-center">
          <Loader2 className="animate-spin mb-2" />
          Loading reports...
        </div>
      ) : (
        <Table
          columns={tableColumns}
          data={paginatedData.map((report) => {
            const baseData = {
              id: report.id,
              reportid: report.id
                ? report.id.substring(0, 8).toUpperCase()
                : "ERR",
              type: report.type,
              author: report.author,
              date: formatReportDate(report.createdAt || report.date),
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
                      checked={selectedIds.includes(report.id)}
                      onChange={() => toggleSelect(report.id)}
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
            const fullRecord = records.find((r) => r.id === row.id);

            return (
              <div className="flex justify-end items-center space-x-2">
                <TableActions
                  onView={() => setViewRow(fullRecord)}
                />
                <button
                  onClick={() => setArchiveRow(fullRecord)}
                  className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                  title="Archive"
                >
                  <Archive size={16} />
                </button>

                <button
                  onClick={() => setDeleteRow(fullRecord)}
                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          }}
        />
      )}

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

      <LogModal isOpen={showLogModal} onClose={() => setShowLogModal(false)} />

      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Report Details
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  ID:{" "}
                  <span className="font-mono text-slate-700">{viewRow.id}</span>
                </p>
              </div>
              <button
                onClick={() => setViewRow(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {/* WE CHANGED md:grid-cols-3 TO md:grid-cols-4 TO MAKE ROOM FOR MORE DATA */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                <Field label="Source Module" value={viewRow.type} />
                <Field label="Submitted By" value={viewRow.author} />
                <Field
                  label="Submission Date"
                  value={formatReportDate(viewRow.createdAt || viewRow.date)}
                />
                
                {/* --- NEW DYNAMIC FIELDS (Only show if they exist in the report payload) --- */}
                {viewRow.data?.collectorName && (
                  <Field label="Name of Collector" value={viewRow.data.collectorName} />
                )}
                
                {viewRow.data?.shift && (
                  <Field label="Shift Block" value={`${viewRow.data.shift} Hours`} />
                )}
                
                {viewRow.data?.submittedLate !== undefined && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500 uppercase">
                      Punctuality
                    </label>
                    <div className={`text-sm font-bold ${viewRow.data.submittedLate ? 'text-red-600' : 'text-emerald-600'}`}>
                      {viewRow.data.submittedLate ? "⚠️ Late Submission" : "✅ On Time"}
                    </div>
                  </div>
                )}
                {/* ------------------------------------------------------------------------ */}
              </div>
              
              <hr className="border-slate-100 mb-6" />
              <DataRenderer reportPayload={viewRow.data} />
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => handleSingleExportExcel(viewRow)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  <FileSpreadsheet size={16} />
                  Export Excel
                </button>
                <button
                  onClick={() => handleSingleExportPDF(viewRow)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <FileText size={16} />
                  Export PDF
                </button>
              </div>

              <button
                onClick={() => setViewRow(null)}
                className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
              >
                Close Report
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
              Are you sure you want to move <strong>{archiveRow.id}</strong> to archives?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setArchiveRow(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                className="flex-1 py-2.5 bg-yellow-500 rounded-lg text-white font-medium hover:bg-yellow-600 shadow-lg"
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
        message="Are you sure you want to remove this report? This action cannot be undone."
      />

      <DeleteModal
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Record"
        message="Are you sure you want to remove this report? This action cannot be undone."
        itemName={deleteRow ? `${deleteRow.type} Report` : ""}
      />

  <NotificationToast
  isOpen={toast.isOpen}
  type={toast.type === "error" ? "error" : "success"}
  message={toast.message}
  onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
/>
    </Layout>
  );
};

export default Reports;
