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
  ChevronDown,
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
  if (normalized === "regularcount") return "Regular Count";
  if (normalized === "studentcount") return "Student Count";
  if (normalized === "seniorcount") return "Senior Count";
  if (normalized === "regular") return "Regular";
  if (normalized === "student") return "Student";
  if (normalized === "senior") return "Senior";
  if (normalized === "missedcount" || normalized === "missedbus") return "Missed Bus";
  if (normalized === "departednow" || normalized === "departedbus") return "Departed Bus";
  if (normalized === "priceamount") return "Price Amount";
  if (normalized === "totalrevenue") return "Total Revenue";

  return String(rawKey).replace(/([A-Z])/g, " $1").trim();
};

const toTitleCaseWords = (value) => {
  const words = String(value || "").trim();
  if (!words) return "-";

  return words
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getExcelColumnLabel = (index) => {
  let n = Number(index) || 1;
  let label = "";

  while (n > 0) {
    const remainder = (n - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    n = Math.floor((n - 1) / 26);
  }

  return label || "A";
};

const normalizeExportKey = (key) =>
  String(key || "").replace(/[\s_-]/g, "").toLowerCase();

const isExportCurrencyField = (key) => {
  const normalized = normalizeExportKey(key);

  if (["totalvehicles", "vehicles", "vehiclecount", "count", "quantity", "qty"].some((term) => normalized.includes(term))) {
    return false;
  }

  return [
    "price",
    "finalprice",
    "baseprice",
    "baserate",
    "amount",
    "revenue",
    "fee",
    "totalrevenue",
    "totalamount",
    "total",
  ].some((term) => normalized.includes(term));
};

const parseExportAmount = (value) => {
  if (value === null || value === undefined || value === "") return NaN;
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;

  const cleaned = String(value).replace(/[^\d.-]/g, "").trim();
  if (!cleaned) return NaN;

  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? NaN : parsed;
};

const formatExportCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const numeric = parseExportAmount(value);
  return Number.isNaN(numeric)
    ? value
    : `Php ${numeric.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
};

const getExportCollectorName = () =>
  localStorage.getItem("authName") || localStorage.getItem("authEmail") || "Admin";

const isBusSingleReport = (report) => {
  const reportType = String(report?.type || "").toLowerCase();
  if (reportType.includes("bus")) return true;

  const rows = Array.isArray(report?.data?.data) ? report.data.data : [];
  if (rows.length === 0) return false;

  const keys = Object.keys(rows[0]).map((key) => normalizeExportKey(key));
  return ["templateno", "arrivaltime", "departuretime", "company", "route"].some((key) => keys.includes(key));
};

const isTerminalSingleReport = (report) => {
  const reportType = String(report?.type || "").toLowerCase();
  if (reportType.includes("terminal")) return true;

  const rows = Array.isArray(report?.data?.data) ? report.data.data : [];
  if (rows.length === 0) return false;

  const keys = Object.keys(rows[0]).map((key) => normalizeExportKey(key));
  return ["ticketno", "passengertype", "time", "date", "price"].every((key) => keys.includes(key));
};

const normalizeTerminalReportRowsForExport = (report) => {
  const sourceRows = Array.isArray(report?.data?.data) ? report.data.data : [];

  return sourceRows.map((row) => ({
    ticketNo: row?.ticketNo || row?.ticketno || "-",
    passengerType: toTitleCaseWords(row?.passengerType || row?.passengertype || "-"),
    date: row?.date || "-",
    time: row?.time || "-",
    price: row?.price ?? row?.amount ?? row?.fee ?? "-",
  }));
};

const normalizeBusReportRowsForExport = (report) => {
  const sourceRows = Array.isArray(report?.data?.data) ? report.data.data : [];

  return sourceRows.map((row) => ({
    busNo:
      row?.templateNo ||
      row?.templateno ||
      row?.plateNumber ||
      row?.busNo ||
      row?.busno ||
      "-",
    company: row?.company || "-",
    route: row?.route || "-",
    arrivalTime: row?.arrivalTime || row?.time || row?.scheduleTime || "-",
    departureTime: row?.departureTime || row?.departure || "-",
    price: row?.price ?? row?.amount ?? row?.fee ?? row?.finalPrice ?? "-",
    status: row?.status || "-",
  }));
};

const getBusPriceAndRevenueMetrics = (report) => {
  const stats = report?.data?.statistics || {};
  const normalizedRows = normalizeBusReportRowsForExport(report);

  const statsPrice = parseExportAmount(
    stats?.priceAmount ?? stats?.price ?? stats?.fee ?? stats?.defaultPrice,
  );

  const rowPrice = normalizedRows
    .map((row) => parseExportAmount(row?.price))
    .find((value) => !Number.isNaN(value) && value > 0);

  const fallbackLocalPrice = parseExportAmount(localStorage.getItem("defaultBusPrice"));

  const priceAmount =
    (!Number.isNaN(statsPrice) && statsPrice > 0 && statsPrice) ||
    (!Number.isNaN(rowPrice) && rowPrice > 0 && rowPrice) ||
    (!Number.isNaN(fallbackLocalPrice) && fallbackLocalPrice > 0 && fallbackLocalPrice) ||
    0;

  const explicitRevenue = parseExportAmount(stats?.totalRevenue ?? stats?.revenue);

  const rowsRevenue = normalizedRows.reduce((sum, row) => {
    const value = parseExportAmount(row?.price);
    if (Number.isNaN(value) || value <= 0) return sum;

    const status = String(row?.status || "").toLowerCase();
    if (!status || status === "-" || status.includes("departed") || status.includes("paid")) {
      return sum + value;
    }

    return sum;
  }, 0);

  const departedCount = normalizedRows.filter((row) => {
    const status = String(row?.status || "").toLowerCase();
    return status.includes("departed") || status.includes("paid");
  }).length;

  const totalRevenue =
    (rowsRevenue > 0 && rowsRevenue) ||
    (!Number.isNaN(explicitRevenue) && explicitRevenue > 0 && explicitRevenue) ||
    (departedCount > 0 ? departedCount * priceAmount : 0);

  return { priceAmount, totalRevenue };
};

const getSingleReportExportDataset = (report) => {
  if (isBusSingleReport(report)) {
    const headers = ["busNo", "company", "route", "arrivalTime", "departureTime"];
    const rows = normalizeBusReportRowsForExport(report);
    return { headers, rows };
  }

  if (isTerminalSingleReport(report)) {
    const headers = ["ticketNo", "passengerType", "date", "time", "price"];
    const rows = normalizeTerminalReportRowsForExport(report);
    return { headers, rows };
  }

  const headers = getSingleReportExportHeaders(report);
  const rows = Array.isArray(report?.data?.data) ? report.data.data : [];
  return { headers, rows };
};

const isParkingSingleReport = (report) => {
  const reportType = String(report?.type || "").toLowerCase();
  if (reportType.includes("parking")) return true;

  const rows = Array.isArray(report?.data?.data) ? report.data.data : [];
  if (rows.length === 0) return false;

  const keys = Object.keys(rows[0]).map((key) => normalizeExportKey(key));
  return ["ticketno", "plateno", "timein", "timeout"].some((key) => keys.includes(key));
};

const getParkingCollectorName = (report) => {
  const stats = report?.data?.statistics || {};
  return stats.collector || stats.collectorName || "-";
};

const getParkingTotalVehicles = (report) => {
  const rows = Array.isArray(report?.data?.data) ? report.data.data : [];
  if (rows.length > 0) return rows.length;

  const totalVehicles = parseExportAmount(report?.data?.statistics?.totalVehicles);
  return Number.isNaN(totalVehicles) ? 0 : totalVehicles;
};

const getParkingTotalRevenue = (report) => {
  const rows = Array.isArray(report?.data?.data) ? report.data.data : [];

  if (rows.length > 0) {
    return rows.reduce((sum, row) => {
      const amount =
        parseExportAmount(row?.finalPrice) ||
        parseExportAmount(row?.total) ||
        parseExportAmount(row?.price) ||
        parseExportAmount(row?.amount) ||
        0;
      return sum + amount;
    }, 0);
  }

  const rawRevenue = report?.data?.statistics?.totalRevenue ?? report?.data?.statistics?.revenue;
  const revenue = parseExportAmount(rawRevenue);
  return Number.isNaN(revenue) ? 0 : revenue;
};

const getSingleReportStatisticEntries = (report) => {
  const stats = report?.data?.statistics || {};
  const isParking = isParkingSingleReport(report);
  const isBus = isBusSingleReport(report);

  const hiddenMetricKeys = new Set(["collectorid", "arrivalslogged", "departureslogged"]);
  const parkingSpecificHiddenKeys = new Set(["collector", "collectorname"]);
  const busSpecificHiddenKeys = new Set(["totalactions", "price", "priceamount", "totalrevenue", "revenue"]);

  let entries = Object.entries(stats).filter(([key]) => {
    const normalized = normalizeExportKey(key);
    if (hiddenMetricKeys.has(normalized)) return false;
    if (isParking && parkingSpecificHiddenKeys.has(normalized)) return false;
    if (isBus && busSpecificHiddenKeys.has(normalized)) return false;
    return true;
  });

  if (isBus) {
    const { priceAmount, totalRevenue } = getBusPriceAndRevenueMetrics(report);
    entries.push(["priceAmount", priceAmount]);
    entries.push(["totalRevenue", totalRevenue]);
    return entries;
  }

  if (!isParking) return entries;

  const totalVehicles = getParkingTotalVehicles(report);
  const totalRevenue = getParkingTotalRevenue(report);
  let hasTotalVehicles = false;
  let hasTotalRevenue = false;

  entries = entries.map(([key, value]) => {
    const normalized = normalizeExportKey(key);

    if (normalized === "totalvehicles") {
      hasTotalVehicles = true;
      return [key, totalVehicles];
    }

    if (normalized === "totalrevenue" || normalized === "revenue") {
      hasTotalRevenue = true;
      return [key, totalRevenue];
    }

    return [key, value];
  });

  if (!hasTotalVehicles) {
    entries.push(["totalVehicles", totalVehicles]);
  }

  if (!hasTotalRevenue) {
    entries.push(["totalRevenue", totalRevenue]);
  }

  return entries;
};

const getSingleReportExportHeaders = (report) => {
  const rows = Array.isArray(report?.data?.data) ? report.data.data : [];
  if (rows.length === 0) return [];

  const isParking = isParkingSingleReport(report);
  const hiddenFields = new Set([
    "reportid",
    "submitted",
    "submittedat",
    "submittedatserver",
    "id",
    "_id",
    "status",
  ]);

  if (isParking) {
    hiddenFields.add("pricingtype");
  }

  const headers = Object.keys(rows[0]).filter(
    (key) => !hiddenFields.has(normalizeExportKey(key)),
  );

  const priorityOrder = [
    "ticketno",
    "plateno",
    "vehicletype",
    "passengertype",
    "timein",
    "timeout",
    "time",
    "date",
    "baserate",
    "baseprice",
    "finalprice",
    "price",
  ];

  headers.sort((a, b) => {
    const aIndex = priorityOrder.indexOf(normalizeExportKey(a));
    const bIndex = priorityOrder.indexOf(normalizeExportKey(b));

    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return headers;
};

const formatSingleReportCellValue = (key, value) => {
  const normalized = normalizeExportKey(key);

  if (value === null || value === undefined || value === "") return "-";

  if (normalized === "passengertype") {
    return toTitleCaseWords(value);
  }

  if (isExportCurrencyField(key)) {
    const parsed = parseExportAmount(value);
    return Number.isNaN(parsed) ? value : formatExportCurrency(parsed);
  }

  if (["time", "timein", "timeout", "arrivaltime", "departuretime", "departure"].includes(normalized)) {
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) {
      return asDate.toLocaleString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  }

  if (normalized === "date") {
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) return asDate.toLocaleDateString();
  }

  return value;
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
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");
  const [showLogModal, setShowLogModal] = useState(false);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const [viewRow, setViewRow] = useState(null);
  const [archiveRow, setArchiveRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const role = localStorage.getItem("authRole") || "superadmin";
  const isSuperAdmin = role === "superadmin";
  const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/reports`;
  const ARCHIVE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:10000"}/api/archives`;

  const parseDateStart = (value) => {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const parseDateEnd = (value) => {
    if (!value) return null;
    const parsed = new Date(`${value}T23:59:59.999`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const isCustomExportRangeActive =
    isSuperAdmin && Boolean(exportDateFrom || exportDateTo);

  const hasInvalidCustomExportRange = () => {
    if (!isCustomExportRangeActive) return false;
    const start = parseDateStart(exportDateFrom);
    const end = parseDateEnd(exportDateTo);
    return Boolean(start && end && start > end);
  };

  const isInCustomExportRange = (dateValue) => {
    if (!isCustomExportRangeActive) return true;

    const candidate = new Date(dateValue);
    if (Number.isNaN(candidate.getTime())) return false;

    const start = parseDateStart(exportDateFrom);
    const end = parseDateEnd(exportDateTo);

    if (start && candidate < start) return false;
    if (end && candidate > end) return false;
    return true;
  };

  const getCustomExportRangeLabel = () => {
    if (!isCustomExportRangeActive) return "";

    const formatDate = (value) => {
      if (!value) return "-";
      const parsed = new Date(`${value}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) return "-";
      return parsed.toLocaleDateString();
    };

    return `${formatDate(exportDateFrom)} to ${formatDate(exportDateTo)}`;
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setRecords(data.map((item) => ({ ...item, id: item._id || item.id })));
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch reports.");
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

  const matchesCurrentSearchAndCategory = (report) => {
    const reportId = String(report.id || report._id || "");
    const reportType = String(report.type || "").toLowerCase();
    const reportAuthor = String(report.author || "").toLowerCase();
    const search = String(searchQuery || "").toLowerCase();

    const matchesSearch =
      !search ||
      reportId.includes(search) ||
      reportType.includes(search) ||
      reportAuthor.includes(search);

    const matchesCategory =
      selectedCategory === "All" || report.type === selectedCategory;

    return matchesSearch && matchesCategory;
  };

  const fetchAllReportsForExport = async () => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch all reports for export");

    const data = await response.json();
    return (Array.isArray(data) ? data : []).map((item) => ({
      ...item,
      id: item._id || item.id,
    }));
  };

  const getOverallExportRows = async () => {
    if (isCustomExportRangeActive) {
      let sourceRows = records;
      try {
        sourceRows = await fetchAllReportsForExport();
      } catch (error) {
        console.error("Fallback to local records for custom export:", error);
      }

      return sourceRows.filter((report) => {
        if (!matchesCurrentSearchAndCategory(report)) return false;
        return isInCustomExportRange(report.createdAt || report.date);
      });
    }

    const hasSearch = Boolean(String(searchQuery || "").trim());
    const isAllCategory = selectedCategory === "All";
    const isAllDate = dateFilterType === "All";

    if (isAllCategory && isAllDate && !hasSearch) {
      try {
        return await fetchAllReportsForExport();
      } catch (error) {
        console.error("Fallback to local records for export:", error);
        return records;
      }
    }

    return filtered;
  };

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
    if (hasInvalidCustomExportRange()) {
      showToast("error", "Invalid export date range. From date must be earlier than To date.");
      return;
    }

    const exportRows = await getOverallExportRows();
    if (exportRows.length === 0) return alert("No records to export.");

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Overall IBT Report");
      worksheet.columns = [{ width: 20 }, { width: 25 }, { width: 25 }, { width: 25 }];

      worksheet.getRow(1).height = 35;
      await addImageToWorksheet(workbook, worksheet, headerImg, 'A1:D4');

      worksheet.addRow([]);
      worksheet.addRow([]);
      worksheet.addRow([]);
      worksheet.addRow([]);
      const titleRow = worksheet.addRow(["OVERALL IBT REPORTS"]);
      const titleRowNumber = titleRow.number;
      worksheet.mergeCells(`A${titleRowNumber}:D${titleRowNumber}`);
      const titleCell = worksheet.getCell(`A${titleRowNumber}`);
      titleCell.font = { bold: true, size: 16, color: { argb: 'FFDC2626' } };
      titleCell.alignment = { horizontal: 'center' };

      const getRevenue = (item) => {
        const rawValue = item.data?.statistics?.totalRevenue ?? item.data?.statistics?.revenue;
        const parsedValue = parseExportAmount(rawValue);
        return Number.isNaN(parsedValue) ? 0 : parsedValue;
      };
      const overallTotalRevenue = exportRows.reduce((sum, item) => sum + getRevenue(item), 0);

      worksheet.addRow([]);
      worksheet.addRow([
        isCustomExportRangeActive
          ? `Date Range: ${getCustomExportRangeLabel()}`
          : `Date: ${new Date().toLocaleDateString()}`,
        '',
        `Collector: ${getExportCollectorName()}`,
        `Status: Completed`,
      ]);
      worksheet.addRow([
        '',
        '',
        '',
        `Overall Total Revenue: ${formatExportCurrency(overallTotalRevenue)}`,
      ]);
      worksheet.addRow([]);

      const headerRow = worksheet.addRow(["Report ID", "Type", "Author", "Revenue"]);
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center' };
      });

      exportRows.forEach((item) => {
        worksheet.addRow([
          item.id ? item.id.substring(0, 8).toUpperCase() : "-",
          item.type || "-",
          item.author || "-",
          formatExportCurrency(getRevenue(item)),
        ]);
      });

      const lastRowNumber = worksheet.lastRow.number + 2;
      worksheet.getRow(lastRowNumber).height = 52.5;
      await addImageToWorksheet(workbook, worksheet, footerImg, `A${lastRowNumber}:D${lastRowNumber + 3}`);

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Overall_IBT_Report_${new Date().toISOString().split("T")[0]}.xlsx`);

      logActivity(role, "EXPORT_OVERALL_EXCEL", "Exported branded Overall Report", "Reports");
    } catch (err) {
      console.error("ExcelJS Overall Export Error:", err);
      alert("Failed to export branded Excel.");
    }
  };

  const handleExportPDF = async () => {
    if (hasInvalidCustomExportRange()) {
      showToast("error", "Invalid export date range. From date must be earlier than To date.");
      return;
    }

    const exportRows = await getOverallExportRows();
    if (exportRows.length === 0) {
      alert("No records to export.");
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerHeight = 24;
    const footerY = pageHeight - footerHeight;

    // HEADER IMAGE
    doc.addImage(headerImg, "PNG", 0, 0, pageWidth, 35);

    // TITLE
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("OVERALL IBT REPORTS", pageWidth / 2, 40, { align: "center" });

    // META DATA
    const authCollector = getExportCollectorName();
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Collector: ${authCollector}`, 15, 50);
    doc.text(
      isCustomExportRangeActive
        ? `Date Range: ${getCustomExportRangeLabel()}`
        : `Date: ${new Date().toLocaleDateString()}`,
      pageWidth - 15,
      50,
      { align: "right" },
    );
    doc.text(`Status: Completed`, pageWidth - 15, 56, { align: "right" });

    const getRevenue = (item) => {
      const rawValue = item.data?.statistics?.totalRevenue ?? item.data?.statistics?.revenue;
      const parsedValue = parseExportAmount(rawValue);
      return Number.isNaN(parsedValue) ? 0 : parsedValue;
    };
    const overallTotalRevenue = exportRows.reduce((sum, item) => sum + getRevenue(item), 0);
    doc.text(`Overall Revenue: ${formatExportCurrency(overallTotalRevenue)}`, pageWidth - 15, 62, {
      align: "right",
    });

    const tableColumn = ["Report ID", "Type", "Author", "Revenue"];
    const tableRows = exportRows.map((item) => {
      const revenue = getRevenue(item);

      return [
        item.id ? item.id.substring(0, 8).toUpperCase() : "-",
        item.type || "-",
        item.author || "-",
        formatExportCurrency(revenue),
      ];
    });

    autoTable(doc, {
      startY: 70,
      head: [tableColumn],
      body: tableRows,
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 15, right: 15, bottom: footerHeight + 6 },
      columnStyles: { 0: { cellWidth: 30 } },
      didDrawPage: () => {
        doc.addImage(footerImg, "PNG", 0, footerY, pageWidth, footerHeight);
      },
    });

    doc.save(`Overall_IBT_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

 
  const handleSingleExportExcel = async (report) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const isParkingReport = isParkingSingleReport(report);
      const isTerminalReport = isTerminalSingleReport(report);
      const collectorName = getParkingCollectorName(report);
      const statsEntries = getSingleReportStatisticEntries(report);

      if (isParkingReport) {
        const ws = workbook.addWorksheet("Parking Report");
        const { headers, rows: exportRows } = getSingleReportExportDataset(report);
        const tableColumnCount = Math.max(headers.length, 5);
        const lastColLabel = getExcelColumnLabel(tableColumnCount);

        headers.forEach((header, index) => {
          const normalized = normalizeExportKey(header);

          if (normalized === "ticketno") {
            ws.getColumn(index + 1).width = 14;
          } else if (normalized === "plateno") {
            ws.getColumn(index + 1).width = 14;
          } else if (["timein", "timeout"].includes(normalized)) {
            ws.getColumn(index + 1).width = 20;
          } else if (isExportCurrencyField(header)) {
            ws.getColumn(index + 1).width = 16;
          } else if (normalized === "duration") {
            ws.getColumn(index + 1).width = 18;
          } else {
            ws.getColumn(index + 1).width = 16;
          }
        });

        ws.getRow(1).height = 35;
        await addImageToWorksheet(workbook, ws, headerImg, `A1:${lastColLabel}4`);

        ws.mergeCells(`A6:${lastColLabel}6`);
        const titleCell = ws.getCell("A6");
        titleCell.value = `${report.type?.toUpperCase() || "PARKING"} REPORT`;
        titleCell.font = { bold: true, size: 14, color: { argb: "FFDC2626" } };
        titleCell.alignment = { horizontal: "center" };

        const reportIdText = report.id ? report.id.substring(0, 8).toUpperCase() : "-";
        const metaRow1 = new Array(tableColumnCount).fill("");
        metaRow1[0] = `Report ID: ${reportIdText}`;
        metaRow1[tableColumnCount - 1] = `Date: ${new Date().toLocaleDateString()}`;
        const firstMetaRow = ws.addRow(metaRow1);
        firstMetaRow.getCell(tableColumnCount).alignment = { horizontal: "right" };

        const metaRow2 = new Array(tableColumnCount).fill("");
        metaRow2[0] = `Operator: ${report.author || "Admin"}`;
        metaRow2[tableColumnCount - 1] = "Status: Completed";
        const secondMetaRow = ws.addRow(metaRow2);
        secondMetaRow.getCell(tableColumnCount).alignment = { horizontal: "right" };

        if (collectorName && collectorName !== "-") {
          const collectorRow = new Array(tableColumnCount).fill("");
          collectorRow[0] = `Collector: ${collectorName}`;
          ws.addRow(collectorRow);
        }

        ws.addRow([]);

        const statsHeaderRow = ws.addRow(["Summary Metric", "Value"]);
        statsHeaderRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } };
          cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
          cell.alignment = { horizontal: "center" };
        });

        statsEntries.forEach(([key, value]) => {
          const formattedValue = isExportCurrencyField(key)
            ? formatExportCurrency(value)
            : value;
          ws.addRow([formatStatisticsLabel(key), formattedValue]);
        });

        ws.addRow([]);
        const detailTitleRowNumber = ws.lastRow.number + 1;
        ws.mergeCells(`A${detailTitleRowNumber}:${lastColLabel}${detailTitleRowNumber}`);
        const detailTitleCell = ws.getCell(`A${detailTitleRowNumber}`);
        detailTitleCell.value = "Detailed Transaction Records";
        detailTitleCell.font = { bold: true, size: 11 };

        const tableHeaderRow = ws.addRow(
          headers.map((h) =>
            String(h)
              .replace(/([A-Z])/g, " $1")
              .replace(/_/g, " ")
              .trim(),
          ),
        );
        tableHeaderRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } };
          cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
          cell.alignment = { horizontal: "center" };
        });

        const centerAlignedHeaders = new Set([
          "ticketno",
          "plateno",
          "status",
          "timein",
          "timeout",
          "date",
        ]);

        exportRows.forEach((row) => {
          const dataRow = ws.addRow(
            headers.map((header) => formatSingleReportCellValue(header, row[header])),
          );

          headers.forEach((header, index) => {
            const normalized = normalizeExportKey(header);
            if (isExportCurrencyField(header)) {
              dataRow.getCell(index + 1).alignment = { horizontal: "right" };
            } else if (centerAlignedHeaders.has(normalized)) {
              dataRow.getCell(index + 1).alignment = { horizontal: "center" };
            }
          });
        });

        const lastRowNumber = ws.lastRow.number + 2;
        ws.getRow(lastRowNumber).height = 52.5;
        await addImageToWorksheet(
          workbook,
          ws,
          footerImg,
          `A${lastRowNumber}:${lastColLabel}${lastRowNumber + 3}`,
        );

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `${report.type}_Report_${report.id?.substring(0, 8) || "report"}.xlsx`);

        logActivity(role, "EXPORT_SINGLE_EXCEL", `Exported branded Single Report for ${report.id}`, "Reports");
        return;
      }

      if (isTerminalReport) {
        const ws = workbook.addWorksheet("Terminal Fee Report");
        const { headers, rows: exportRows } = getSingleReportExportDataset(report);
        ws.columns = [
          { width: 18 },
          { width: 24 },
          { width: 20 },
          { width: 16 },
          { width: 16 },
        ];

        ws.getRow(1).height = 35;
        await addImageToWorksheet(workbook, ws, headerImg, "A1:E4");

        ws.mergeCells("A6:E6");
        const titleCell = ws.getCell("A6");
        titleCell.value = `${report.type?.toUpperCase() || "TERMINAL FEES"} REPORT`;
        titleCell.font = { bold: true, size: 14, color: { argb: "FFDC2626" } };
        titleCell.alignment = { horizontal: "center" };

        const reportDateText = formatReportDate(report.createdAt || report.date);
        const reportIdText = report.id ? report.id.substring(0, 8).toUpperCase() : "-";
        const metaRow1 = ws.addRow([`Report ID: ${reportIdText}`, "", "", "", `Date: ${reportDateText}`]);
        metaRow1.getCell(5).alignment = { horizontal: "right" };

        const metaRow2 = ws.addRow([`Operator: ${report.author || "Admin"}`, "", "", "", "Status: Completed"]);
        metaRow2.getCell(5).alignment = { horizontal: "right" };

        ws.addRow([]);

        const statsHeaderRow = ws.addRow(["Summary Metric", "Value"]);
        statsHeaderRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } };
          cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
          cell.alignment = { horizontal: "center" };
        });

        statsEntries.forEach(([key, value]) => {
          const formattedValue = isExportCurrencyField(key)
            ? formatExportCurrency(value)
            : value;
          ws.addRow([formatStatisticsLabel(key), formattedValue]);
        });

        ws.addRow([]);
        const detailTitleRowNumber = ws.lastRow.number + 1;
        ws.mergeCells(`A${detailTitleRowNumber}:E${detailTitleRowNumber}`);
        const detailTitleCell = ws.getCell(`A${detailTitleRowNumber}`);
        detailTitleCell.value = "Detailed Transaction Records";
        detailTitleCell.font = { bold: true, size: 11 };

        const tableHeaderRow = ws.addRow(
          headers.map((h) =>
            String(h)
              .replace(/([A-Z])/g, " $1")
              .replace(/_/g, " ")
              .trim(),
          ),
        );
        tableHeaderRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } };
          cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
          cell.alignment = { horizontal: "center" };
        });

        exportRows.forEach((row) => {
          const dataRow = ws.addRow(
            headers.map((header) => formatSingleReportCellValue(header, row[header])),
          );

          dataRow.getCell(1).alignment = { horizontal: "center" };
          dataRow.getCell(2).alignment = { horizontal: "center" };
          dataRow.getCell(3).alignment = { horizontal: "center" };
          dataRow.getCell(4).alignment = { horizontal: "center" };
          dataRow.getCell(5).alignment = { horizontal: "right" };
        });

        const lastRowNumber = ws.lastRow.number + 2;
        ws.getRow(lastRowNumber).height = 52.5;
        await addImageToWorksheet(workbook, ws, footerImg, `A${lastRowNumber}:E${lastRowNumber + 3}`);

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `${report.type}_Report_${report.id?.substring(0, 8) || "report"}.xlsx`);

        logActivity(role, "EXPORT_SINGLE_EXCEL", `Exported branded Single Report for ${report.id}`, "Reports");
        return;
      }

    
      const wsSummary = workbook.addWorksheet("Summary");
      wsSummary.getColumn(1).width = 25;
      wsSummary.getColumn(2).width = 30;

     
      wsSummary.getRow(1).height = 35;
      await addImageToWorksheet(workbook, wsSummary, headerImg, 'A1:B4');

      wsSummary.addRow([]); 
      wsSummary.addRow(["REPORT DETAILS"]).font = { bold: true, size: 12 };
      wsSummary.addRow(["ID", report.id]);
      wsSummary.addRow(["Type", report.type]);
      wsSummary.addRow(["Operator", report.author || "Admin"]);
      if (isParkingReport && collectorName && collectorName !== "-") {
        wsSummary.addRow(["Collector", collectorName]);
      }
      wsSummary.addRow(["Date", formatReportDate(report.createdAt || report.date)]);
      wsSummary.addRow([]);

      const statsHeader = wsSummary.addRow(["STATISTICS"]);
      statsHeader.font = { bold: true };

      statsEntries.forEach(([key, value]) => {
        const formattedValue = isExportCurrencyField(key)
          ? formatExportCurrency(value)
          : value;
        wsSummary.addRow([formatStatisticsLabel(key), formattedValue]);
      });
      const lastRowSummary = wsSummary.lastRow.number + 2;
      wsSummary.getRow(lastRowSummary).height = 52.5;
      await addImageToWorksheet(workbook, wsSummary, footerImg, `A${lastRowSummary}:B${lastRowSummary + 3}`);

      if (Array.isArray(report.data?.data) && report.data.data.length > 0) {
        const wsData = workbook.addWorksheet("Data Records");
        const { headers, rows: exportRows } = getSingleReportExportDataset(report);

        const dataHeaderRow = wsData.addRow(
          headers.map((h) =>
            String(h)
              .replace(/([A-Z])/g, " $1")
              .replace(/_/g, " ")
              .trim(),
          ),
        );
        dataHeaderRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        });

        exportRows.forEach((row) => {
          wsData.addRow(
            headers.map((header) => formatSingleReportCellValue(header, row[header])),
          );
        });

        wsData.getRow(1).height = 35;


        wsData.columns.forEach(col => col.width = 20);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `${report.type}_Report_${report.id?.substring(0, 8) || "report"}.xlsx`);

      logActivity(role, "EXPORT_SINGLE_EXCEL", `Exported branded Single Report for ${report.id}`, "Reports");
    } catch (err) {
      console.error("Single Export Error:", err);
      alert("Failed to export individual report.");
    }
  };

  const handleSingleExportPDF = (report) => {
    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerHeight = 24;
    const footerY = pageHeight - footerHeight;
    const isParkingReport = isParkingSingleReport(report);
    const isTerminalReport = isTerminalSingleReport(report);
    const operatorName = report.author || "Admin";
    const collectorName = getParkingCollectorName(report);
    const statsEntries = getSingleReportStatisticEntries(report);

    // HEADER IMAGE
    doc.addImage(headerImg, "PNG", 0, 0, pageWidth, 35);

    // TITLE
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`${report.type?.toUpperCase() || "REPORT"} REPORT`, pageWidth / 2, 40, {
      align: "center",
    });

    // META DATA
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Report ID: ${report.id ? report.id.substring(0, 8).toUpperCase() : "-"}`,
      15,
      50,
    );
    doc.text(`Operator: ${operatorName}`, 15, 56);
    if (isParkingReport && collectorName && collectorName !== "-") {
      doc.text(`Collector: ${collectorName}`, 15, 62);
    }
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 15, 50, {
      align: "right",
    });
    doc.text(`Status: Completed`, pageWidth - 15, 56, { align: "right" });

    let currentY = isParkingReport && collectorName && collectorName !== "-" ? 71 : 65;

    // STATISTICS
    if (statsEntries.length > 0) {
      const statsData = statsEntries
        .map(([k, v]) => [
          formatStatisticsLabel(k),
          isExportCurrencyField(k) ? formatExportCurrency(v) : v,
        ]);

      autoTable(doc, {
        startY: currentY,
        head: [["Summary Metric", "Value"]],
        body: statsData,
        theme: "striped",
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 15, right: 15, bottom: footerHeight + 6 },
        didDrawPage: () => {
          doc.addImage(footerImg, "PNG", 0, footerY, pageWidth, footerHeight);
        },
      });

      currentY = doc.lastAutoTable.finalY + 10;
    }

    // DATA RECORDS
    if (Array.isArray(report.data?.data) && report.data.data.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Detailed Transaction Records", 15, currentY);

      const { headers, rows: exportRows } = getSingleReportExportDataset(report);

      const formattedHeaders = headers.map((h) =>
        String(h)
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .trim()
          .toUpperCase(),
      );

      const rows = exportRows.map((row) =>
        headers.map((header) => formatSingleReportCellValue(header, row[header])),
      );

      autoTable(doc, {
        startY: currentY + 5,
        head: [formattedHeaders],
        body: rows,
        tableWidth: "auto",
        theme: "striped",
        styles: {
          fontSize: 8,
          cellPadding: 4,
          valign: "middle",
          halign: "left",
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: isTerminalReport
          ? {
              0: { cellWidth: 25, halign: "center" },
              1: { cellWidth: 35, halign: "center" },
              2: { cellWidth: 28, halign: "center" },
              3: { cellWidth: 22, halign: "center" },
              4: { cellWidth: 24, halign: "right" },
            }
          : {
              0: { cellWidth: 25 },
            },
        margin: { left: 15, right: 15, bottom: footerHeight + 6 },
        didDrawPage: () => {
          doc.addImage(footerImg, "PNG", 0, footerY, pageWidth, footerHeight);
        },
      });
    } else {
      doc.addImage(footerImg, "PNG", 0, footerY, pageWidth, footerHeight);
    }

    doc.save(`${report.type}_Report_${report.id?.substring(0, 8) || "report"}.pdf`);
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

  const handleConfirmBulkDelete = async () => {
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
      setShowBulkDeleteModal(false); 
      showToast("success", `Successfully archived and deleted ${selectedIds.length} reports.`);
    } catch (error) {
      console.error("Bulk action failed", error);
      showToast("error", "Failed to process some records.");
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
          
          <div className="flex flex-wrap items-end justify-end gap-3 w-full lg:w-auto">
            {isSuperAdmin && (
              <div className="flex items-end gap-2 border border-slate-200 rounded-xl bg-white p-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">From</label>
                  <input
                    type="date"
                    value={exportDateFrom}
                    onChange={(e) => setExportDateFrom(e.target.value)}
                    className="h-9 rounded-lg border border-slate-300 px-2 text-sm text-slate-700"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">To</label>
                  <input
                    type="date"
                    value={exportDateTo}
                    onChange={(e) => setExportDateTo(e.target.value)}
                    className="h-9 rounded-lg border border-slate-300 px-2 text-sm text-slate-700"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setExportDateFrom("");
                    setExportDateTo("");
                  }}
                  className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            )}

             <ExportMenu onExportExcel={handleExportExcel} onExportPDF={handleExportPDF} />
          </div>
        </div>

        {isSuperAdmin && hasInvalidCustomExportRange() && (
          <p className="text-sm text-red-600 -mt-2">
            Invalid range: From date must be earlier than or equal to To date.
          </p>
        )}

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      
          <div className="relative w-full sm:w-64 shrink-0">
          
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Tag size={16} />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="w-full appearance-none pl-10 pr-12 h-[42px] bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer transition-all"
            >
              {["All", "Bus Trips", "Terminal Fees", "Tenant/Lease", "Parking", "Lost & Found"].map((cat) => (
                <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
              ))}
            </select>

            <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none pr-3">
              <div className="border-l border-slate-300 pl-2 h-5 flex items-center justify-center">
                <ChevronDown size={16} className="text-slate-500" />
              </div>
            </div>
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
                <button onClick={() => setShowBulkDeleteModal(true)} title="Bulk Delete" className="rounded-lg p-2 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-200 cursor-pointer transition-colors">
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

      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              Confirm Bulk Delete
            </h3>
            <p className="text-slate-600 mt-2 text-sm">
              Are you sure you want to delete <strong>{selectedIds.length}</strong> reports?
              <br /><br />
              They will be moved to the Archives before deletion.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                disabled={loading}
                className="flex-1 py-2.5 bg-red-600 rounded-lg text-white font-medium hover:bg-red-700 shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? "Deleting..." : "Yes, Delete All"}
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
