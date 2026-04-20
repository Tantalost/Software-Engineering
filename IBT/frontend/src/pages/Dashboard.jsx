import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import autoTable from "jspdf-autotable";
import { Settings } from "lucide-react";
import headerImg from "../assets/Header.png";
import footerImg from "../assets/FOOTER.png";
import Layout from "../components/layout/Layout";
import StatCards from "../components/dashboard/StatCards";
import OperationsAnalytics from "../components/dashboard/OperationsAnalytics";
import SummaryDonut from "../components/dashboard/SummaryDonut";
import RecentActivity from "../components/dashboard/RecentActivity";
import DashboardToolbar from "../components/dashboard/DashboardToolbar";
import TargetModal from "../components/dashboard/TargetModal";
import NotificationToast from "../components/common/NotificationToast";
import DatePickerInput from "../components/common/DatePickerInput";

const DEFAULT_DASHBOARD_TARGETS = {
  tickets: 5000,
  bus: 4000,
  tenants: 10000,
  parking: 3000,
};

const DASHBOARD_TARGETS_STORAGE_KEY = "dashboardTargets";

const toSafeTargetNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
};

const normalizeDashboardTargets = (value = {}) => ({
  tickets: toSafeTargetNumber(value.tickets, DEFAULT_DASHBOARD_TARGETS.tickets),
  bus: toSafeTargetNumber(value.bus, DEFAULT_DASHBOARD_TARGETS.bus),
  tenants: toSafeTargetNumber(value.tenants, DEFAULT_DASHBOARD_TARGETS.tenants),
  parking: toSafeTargetNumber(value.parking, DEFAULT_DASHBOARD_TARGETS.parking),
});

const readDashboardTargetsFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem(DASHBOARD_TARGETS_STORAGE_KEY);
    if (!saved) return { ...DEFAULT_DASHBOARD_TARGETS };
    return normalizeDashboardTargets(JSON.parse(saved));
  } catch (_error) {
    return { ...DEFAULT_DASHBOARD_TARGETS };
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("authRole") || "superadmin";
  const isSuperAdmin = role === "superadmin";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";

  const [rawData, setRawData] = useState({
    tickets: [],
    bus: [],
    tenants: [],
    parking: [],
    reports: [],
  });

  const [filterDate, setFilterDate] = useState(new Date());
  const [filterView, setFilterView] = useState("week");
  
  // Custom Date Range States
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");
  const [showCustomRange, setShowCustomRange] = useState(false);

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targets, setTargets] = useState(() => readDashboardTargetsFromLocalStorage());

  const [toast, setToast] = useState({
    isOpen: false,
    message: "",
    type: "success",
  });

  const showToast = (type, message) => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, isOpen: false }));
    }, 3000);
  };

  const handleSaveTargets = async (newTargets) => {
    const normalizedTargets = normalizeDashboardTargets(newTargets);
    const token = localStorage.getItem("authToken");

    try {
      if (token) {
        const response = await fetch(`${API_URL}/api/admins/dashboard-targets`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ targets: normalizedTargets }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.message || "Failed to save dashboard targets.");
        }
      }

      setTargets(normalizedTargets);
      localStorage.setItem(
        DASHBOARD_TARGETS_STORAGE_KEY,
        JSON.stringify(normalizedTargets),
      );
      showToast("success", "Revenue targets saved successfully");
      setIsTargetModalOpen(false);
    } catch (error) {
      console.error("Failed to save dashboard targets:", error);
      showToast("error", error.message || "Failed to save dashboard targets.");
    }
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
      console.error("Dashboard branding image failed:", error);
    }
  };

  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [donutData, setDonutData] = useState([]);
  const [totalQuota, setTotalQuota] = useState(0);
  const [loading, setLoading] = useState(true);

  const getItemDate = (item) => {
    if (!item) return null;
    return (
      item.date ||
      item.timeIn ||
      item.entryTime ||
      item.createdAt ||
      item.startDate ||
      item.leaseStart ||
      item.joinedAt
    );
  };

  const getSmartValue = (item) => {
    if (!item) return 0;

    const exactMatch =
      item.finalPrice ||
      item.amount ||
      item.Amount ||
      item.fee ||
      item.Fee ||
      item.price ||
      item.Price ||
      item.total ||
      item.Total ||
      item.rent ||
      item.Rent ||
      item.monthlyRent ||
      item.leaseAmount ||
      item.cost ||
      item.Cost ||
      item.amountPaid;

    if (exactMatch !== undefined && exactMatch !== null) return exactMatch;

    const keys = Object.keys(item);
    const moneyKey = keys.find(
      (k) =>
        /amount|price|fee|cost|rent|total|pay/i.test(k) &&
        !k.toLowerCase().includes("id"),
    );
    return moneyKey ? item[moneyKey] : 0;
  };

  const calculateRevenue = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) return 0;
    return items.reduce((sum, item) => {
      let val = getSmartValue(item);
      const cleanVal = String(val).replace(/[^0-9.-]+/g, "");
      const numberVal = parseFloat(cleanVal);
      return sum + (isNaN(numberVal) ? 0 : numberVal);
    }, 0);
  };

  const formatCurrency = (value) => {
    if (value >= 1000)
      return `₱${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    return `₱${value.toLocaleString()}`;
  };

  const formatRevenueAmount = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const parseFlexibleDate = (value) => {
    if (value === null || value === undefined || value === "") return null;

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : new Date(value);
    }

    if (typeof value === "number") {
      const parsedFromNumber = new Date(value);
      return Number.isNaN(parsedFromNumber.getTime()) ? null : parsedFromNumber;
    }

    const raw = String(value).trim();
    if (!raw) return null;

    const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const dmyMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmyMatch) {
      const [, firstPart, secondPart, yearText] = dmyMatch;
      const first = Number(firstPart);
      const second = Number(secondPart);
      const year = Number(yearText);

      if (first > 12 && second <= 12) {
        return new Date(year, second - 1, first); 
      }
      if (second > 12 && first <= 12) {
        return new Date(year, first - 1, second); 
      }

      const asMdy = new Date(year, first - 1, second);
      if (!Number.isNaN(asMdy.getTime())) return asMdy;

      const asDmy = new Date(year, second - 1, first);
      return Number.isNaN(asDmy.getTime()) ? null : asDmy;
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const parseDateStart = (value) => {
    const parsed = parseFlexibleDate(value);
    if (!parsed) return null;

    const scoped = new Date(parsed);
    scoped.setHours(0, 0, 0, 0);
    return scoped;
  };

  const parseDateEnd = (value) => {
    const parsed = parseFlexibleDate(value);
    if (!parsed) return null;

    const scoped = new Date(parsed);
    scoped.setHours(23, 59, 59, 999);
    return scoped;
  };

  const isCustomExportRangeActive =
    isSuperAdmin && Boolean(exportDateFrom || exportDateTo);

  const hasInvalidCustomExportRange = () => {
    if (!isCustomExportRangeActive) return false;
    const start = parseDateStart(exportDateFrom);
    const end = parseDateEnd(exportDateTo);
    return Boolean(start && end && start > end);
  };

  const isInsideCustomExportRange = (dateValue) => {
    if (!isCustomExportRangeActive) return true;

    const candidate = parseFlexibleDate(dateValue);
    if (!candidate) return false;

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
      const parsed = parseDateStart(value);
      if (!parsed) return "-";
      return parsed.toLocaleDateString();
    };

    return `${formatDate(exportDateFrom)} to ${formatDate(exportDateTo)}`;
  };

  const getTargetForExport = (moduleKey) => {
    const baseMonthlyTarget = targets[moduleKey] || 0;

    if (isCustomExportRangeActive && exportDateFrom && exportDateTo) {
      const start = parseDateStart(exportDateFrom);
      const end = parseDateEnd(exportDateTo);

      if (start && end && start <= end) {
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const dayCount = Math.floor((end - start) / millisecondsPerDay) + 1;
        return (baseMonthlyTarget / 30) * dayCount;
      }
    }

    if (filterView === "day") return baseMonthlyTarget / 30;
    if (filterView === "week") return baseMonthlyTarget / 4;
    if (filterView === "month") return baseMonthlyTarget;
    if (filterView === "year") return baseMonthlyTarget * 12;
    return 0;
  };

  const getExportScopedData = () => {
    if (!isCustomExportRangeActive) {
      return {
        tickets: rawData.tickets.filter((i) =>
          isDateInView(getItemDate(i), filterView, filterDate),
        ),
        bus: rawData.bus.filter((i) =>
          isDateInView(getItemDate(i), filterView, filterDate),
        ),
        tenants: rawData.tenants.filter((i) =>
          isDateInView(getItemDate(i), filterView, filterDate),
        ),
        parking: rawData.parking.filter((i) =>
          isDateInView(getItemDate(i), filterView, filterDate),
        ),
        reports: rawData.reports.filter((r) =>
          isDateInView(r.createdAt || r.date, filterView, filterDate),
        ),
      };
    }

    return {
      tickets: rawData.tickets.filter((i) =>
        isInsideCustomExportRange(getItemDate(i)),
      ),
      bus: rawData.bus.filter((i) => isInsideCustomExportRange(getItemDate(i))),
      tenants: rawData.tenants.filter((i) =>
        isInsideCustomExportRange(getItemDate(i)),
      ),
      parking: rawData.parking.filter((i) =>
        isInsideCustomExportRange(getItemDate(i)),
      ),
      reports: rawData.reports.filter((r) =>
        isInsideCustomExportRange(r.createdAt || r.date),
      ),
    };
  };

  const getExportPayload = () => {
    const scoped = getExportScopedData();
    const formatCurrencyFull = (value) => `₱${formatRevenueAmount(value)}`;

    const ticketsRevenue = calculateRevenue(getPaidItems(scoped.tickets, "tickets"));
    const busRevenue = calculateRevenue(getPaidItems(scoped.bus, "bus"));
    const parkingRevenue = calculateRevenue(getPaidItems(scoped.parking, "parking"));
    const tenantsRevenue = scoped.tenants.reduce((sum, tenant) => {
      const rent = parseFloat(tenant.rentAmount) || 0;
      const util = parseFloat(tenant.utilityAmount) || 0;
      return sum + rent + util;
    }, 0);

    const exportStats = [
      {
        label: "Tickets Revenue",
        rawValue: ticketsRevenue,
        color: "red",
      },
      {
        label: "Bus Revenue",
        rawValue: busRevenue,
        color: "yellow",
      },
      {
        label: "Tenants Revenue",
        rawValue: tenantsRevenue,
        color: "green",
      },
      {
        label: "Parking Revenue",
        rawValue: parkingRevenue,
        color: "blue",
      },
    ].map((item) => {
      const moduleKey = item.label.toLowerCase().split(" ")[0];
      const targetRevenue = getTargetForExport(moduleKey);
      const percent = targetRevenue > 0 ? (item.rawValue / targetRevenue) * 100 : 0;

      return {
        ...item,
        value: formatCurrencyFull(item.rawValue),
        change: `${percent.toFixed(0)}% of Target`,
        subtitle: `Target: ${formatCurrencyFull(targetRevenue)}`,
      };
    });

    const exportDonut = [
      { name: "Tickets", value: ticketsRevenue, color: "#EF4444" },
      { name: "Bus", value: busRevenue, color: "#EAB308" },
      { name: "Tenants", value: tenantsRevenue, color: "#22C55E" },
      { name: "Parking", value: parkingRevenue, color: "#3B82F6" },
    ];

    const exportActivity = scoped.reports
      .sort(
        (a, b) =>
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt),
      )
      .slice(0, 5)
      .map((r) => ({
        id: r._id || r.id,
        type: r.status === "Resolved" ? "success" : "warning",
        message: `${r.type} Report Submitted`,
        date: r.createdAt || r.date,
        status: r.status,
      }));

    return {
      meta: {
        view: isCustomExportRangeActive ? "custom" : filterView,
        date: filterDate.toDateString(),
        generatedAt: new Date().toLocaleString(),
        dateRange: getCustomExportRangeLabel(),
      },
      stats: exportStats,
      donut: exportDonut,
      analytics: analyticsData,
      activity: exportActivity,
    };
  };

  const isDateInView = (dateString, view, anchorDate) => {
    if (!dateString) return false;
    const target = parseFlexibleDate(dateString);
    const anchor = parseFlexibleDate(anchorDate);
    if (!target || !anchor) return false;

    if (view === "day") return target.toDateString() === anchor.toDateString();
    if (view === "week") {
      const start = new Date(anchor);
      start.setDate(anchor.getDate() - anchor.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return target >= start && target <= end;
    }
    if (view === "month")
      return (
        target.getMonth() === anchor.getMonth() &&
        target.getFullYear() === anchor.getFullYear()
      );
    if (view === "year") return target.getFullYear() === anchor.getFullYear();
    return false;
  };

  const fetchDashboardTargets = async () => {
    if (!isSuperAdmin) return;

    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/admins/dashboard-targets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard targets.");
      }

      const payload = await response.json();
      const fetchedTargets = normalizeDashboardTargets(payload?.targets || {});
      setTargets(fetchedTargets);
      localStorage.setItem(
        DASHBOARD_TARGETS_STORAGE_KEY,
        JSON.stringify(fetchedTargets),
      );
    } catch (error) {
      console.error("Failed to fetch dashboard targets:", error);
      const fallbackTargets = readDashboardTargetsFromLocalStorage();
      setTargets(fallbackTargets);
    }
  };

 const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, busRes, tenantsRes, parkingRes, reportsRes] =
        await Promise.all([
          fetch(`${API_URL}/api/terminal-fees`),
          fetch(`${API_URL}/api/bustrips`),
          
          fetch(`${API_URL}/api/tenants?all=true`),
          
          fetch(`${API_URL}/api/parking`),
          fetch(`${API_URL}/api/reports`),
        ]);

      const parseResponse = async (res) => {
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json) ? json : json.data || json.result || [];
      };

      const tickets = await parseResponse(ticketsRes);
      const bus = await parseResponse(busRes);
      const tenants = await parseResponse(tenantsRes);
      const parking = await parseResponse(parkingRes);
      const reports = await parseResponse(reportsRes);

      setRawData({ tickets, bus, tenants, parking, reports });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchDashboardTargets();
  }, []);

  const handleReportClick = (reportId) => {
    navigate("/reports", { state: { openReportId: reportId } });
  };

  const getPaidItems = (items, category) => {
    if (!items || !items.length) return [];

    if (category === "tickets") return items;

    if (category === "parking") {
      return items.filter((i) => {
        const s = (i.status || "").toLowerCase();
        return [
          "paid",
          "completed",
          "active",
          "occupied",
          "parked",
          "pending",
          "departed",
        ].includes(s);
      });
    }

    if (category === "bus") {
      return items.filter((i) => {
        const s = (i.status || "").toLowerCase();
        return ["departed", "paid"].includes(s);
      });
    }

    return items.filter((i) => {
      const s = (i.status || "").toLowerCase();
      return ["paid", "completed", "active"].includes(s);
    });
  };

  const isDashboardDateMatch = (dateValue) => {
    if (isCustomExportRangeActive) {
      return isInsideCustomExportRange(dateValue);
    }

    return isDateInView(dateValue, filterView, filterDate);
  };

  useEffect(() => {
    if (loading) return;

    const generateStat = (label, items, color, moduleKey) => {
      const dateFiltered = items.filter((i) =>
        isDashboardDateMatch(getItemDate(i)),
      );

      let currentRev;
      if (moduleKey === "tenants") {
        currentRev = dateFiltered.reduce((sum, tenant) => {
          const rent = parseFloat(tenant.rentAmount) || 0;
          const util = parseFloat(tenant.utilityAmount) || 0;
          return sum + rent + util;
        }, 0);
      } else {
        const paidItems = getPaidItems(dateFiltered, moduleKey);
        currentRev = calculateRevenue(paidItems);
      }

      const baseMonthlyTarget = targets[moduleKey] || 0;
      let targetRev = getTargetForExport(moduleKey);
      if (!targetRev && baseMonthlyTarget > 0) targetRev = baseMonthlyTarget;

      const percent = targetRev > 0 ? (currentRev / targetRev) * 100 : 0;

      return {
        label,
        value: formatCurrencyFull(currentRev),
        rawValue: currentRev,
        change: `${percent.toFixed(0)}% of Target`,
        subtitle: `Target: ${formatCurrencyFull(targetRev)}`,
        color,
      };
    };

    const formatCurrencyFull = (value) => {
      return `₱${formatRevenueAmount(value)}`;
    };

    setStats([
      generateStat("Tickets Revenue", rawData.tickets, "red", "tickets"),
      generateStat("Bus Revenue", rawData.bus, "yellow", "bus"),
      generateStat("Tenants Revenue", rawData.tenants, "green", "tenants"),
      generateStat("Parking Revenue", rawData.parking, "blue", "parking"),
    ]);

    const scaledQuota = ["tickets", "bus", "tenants", "parking"].reduce(
      (sum, moduleKey) => sum + getTargetForExport(moduleKey),
      0,
    );

    setTotalQuota(scaledQuota);

    const filteredTickets = getPaidItems(
      rawData.tickets.filter((i) =>
        isDashboardDateMatch(getItemDate(i)),
      ),
      "tickets",
    );
    const filteredBus = getPaidItems(
      rawData.bus.filter((i) =>
        isDashboardDateMatch(getItemDate(i)),
      ),
      "bus",
    );
    const filteredParking = getPaidItems(
      rawData.parking.filter((i) =>
        isDashboardDateMatch(getItemDate(i)),
      ),
      "parking",
    );
    const filteredTenants = rawData.tenants.filter((i) =>
      isDashboardDateMatch(getItemDate(i)),
    );

    const tenantsRevenue = filteredTenants.reduce((sum, tenant) => {
      const rent = parseFloat(tenant.rentAmount) || 0;
      const util = parseFloat(tenant.utilityAmount) || 0;
      return sum + rent + util;
    }, 0);

    setDonutData([
      {
        name: "Tickets",
        value: calculateRevenue(filteredTickets),
        color: "#EF4444",
      },
      { name: "Bus", value: calculateRevenue(filteredBus), color: "#EAB308" },
      {
        name: "Tenants",
        value: tenantsRevenue,
        color: "#22C55E",
      },
      {
        name: "Parking",
        value: calculateRevenue(filteredParking),
        color: "#3B82F6",
      },
    ]);

    const filteredReports = rawData.reports.filter((r) =>
      isDashboardDateMatch(r.createdAt || r.date),
    );
    const processedActivity = filteredReports
      .sort(
        (a, b) =>
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt),
      )
      .slice(0, 5)
      .map((r) => ({
        id: r._id || r.id,
        type: r.status === "Resolved" ? "success" : "warning",
        message: `${r.type} Report Submitted`,
        date: r.createdAt || r.date,
        status: r.status,
      }));
    setRecentActivity(processedActivity);

    const getChartMetrics = (items, moduleKey, dateMatchFn) => {
      const dateMatched = items.filter(dateMatchFn);

      if (moduleKey === "tenants") {
        const revenue = dateMatched.reduce((sum, tenant) => {
          const rent = parseFloat(tenant.rentAmount) || 0;
          const util = parseFloat(tenant.utilityAmount) || 0;
          return sum + rent + util;
        }, 0);

        return {
          revenue,
          volume: dateMatched.length,
        };
      }

      const paidOnly = getPaidItems(dateMatched, moduleKey);

      return {
        revenue: calculateRevenue(paidOnly),
        volume: paidOnly.length,
      };
    };

    let chartPoints = [];
    if (isCustomExportRangeActive) {
      const customStart = parseDateStart(exportDateFrom);
      const customEnd = parseDateEnd(exportDateTo);

      if (customStart && customEnd && customStart <= customEnd) {
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const dayCount = Math.floor((customEnd - customStart) / millisecondsPerDay) + 1;

        if (dayCount <= 31) {
          for (let i = 0; i < dayCount; i++) {
            const dayStart = new Date(customStart);
            dayStart.setDate(customStart.getDate() + i);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            const isMatch = (item) => {
              const dVal = getItemDate(item);
              if (!dVal) return false;
              const d = parseFlexibleDate(dVal);
              return Boolean(d) && d >= dayStart && d <= dayEnd;
            };

            const tickets = getChartMetrics(rawData.tickets, "tickets", isMatch);
            const bus = getChartMetrics(rawData.bus, "bus", isMatch);
            const parking = getChartMetrics(rawData.parking, "parking", isMatch);
            const tenants = getChartMetrics(rawData.tenants, "tenants", isMatch);

            chartPoints.push({
              name: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              ticketsRevenue: tickets.revenue,
              ticketsVolume: tickets.volume,
              busRevenue: bus.revenue,
              busVolume: bus.volume,
              parkingRevenue: parking.revenue,
              parkingVolume: parking.volume,
              tenantsRevenue: tenants.revenue,
              tenantsVolume: tenants.volume,
            });
          }
        } else {
          const monthCursor = new Date(customStart.getFullYear(), customStart.getMonth(), 1);
          const monthEnd = new Date(customEnd.getFullYear(), customEnd.getMonth(), 1);

          while (monthCursor <= monthEnd) {
            const fullMonthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1, 0, 0, 0, 0);
            const fullMonthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0, 23, 59, 59, 999);
            const scopedStart = fullMonthStart < customStart ? customStart : fullMonthStart;
            const scopedEnd = fullMonthEnd > customEnd ? customEnd : fullMonthEnd;

            const isMatch = (item) => {
              const dVal = getItemDate(item);
              if (!dVal) return false;
              const d = parseFlexibleDate(dVal);
              return Boolean(d) && d >= scopedStart && d <= scopedEnd;
            };

            const tickets = getChartMetrics(rawData.tickets, "tickets", isMatch);
            const bus = getChartMetrics(rawData.bus, "bus", isMatch);
            const parking = getChartMetrics(rawData.parking, "parking", isMatch);
            const tenants = getChartMetrics(rawData.tenants, "tenants", isMatch);

            chartPoints.push({
              name: monthCursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
              ticketsRevenue: tickets.revenue,
              ticketsVolume: tickets.volume,
              busRevenue: bus.revenue,
              busVolume: bus.volume,
              parkingRevenue: parking.revenue,
              parkingVolume: parking.volume,
              tenantsRevenue: tenants.revenue,
              tenantsVolume: tenants.volume,
            });

            monthCursor.setMonth(monthCursor.getMonth() + 1);
          }
        }
      }
    } else if (filterView === "week") {
      const startOfWeek = new Date(filterDate);
      startOfWeek.setDate(filterDate.getDate() - filterDate.getDay());
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];

        const isMatch = (item) => {
          const dVal = getItemDate(item);
          return dVal && dVal.startsWith(dateStr);
        };

        const tickets = getChartMetrics(rawData.tickets, "tickets", isMatch);
        const bus = getChartMetrics(rawData.bus, "bus", isMatch);
        const parking = getChartMetrics(rawData.parking, "parking", isMatch);
        const tenants = getChartMetrics(rawData.tenants, "tenants", isMatch);

        chartPoints.push({
          name: d.toLocaleDateString("en-US", { weekday: "short" }),
          ticketsRevenue: tickets.revenue,
          ticketsVolume: tickets.volume,
          busRevenue: bus.revenue,
          busVolume: bus.volume,
          parkingRevenue: parking.revenue,
          parkingVolume: parking.volume,
          tenantsRevenue: tenants.revenue,
          tenantsVolume: tenants.volume,
        });
      }
    } else if (filterView === "month") {
      const daysInMonth = new Date(
        filterDate.getFullYear(),
        filterDate.getMonth() + 1,
        0,
      ).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dStr = `${filterDate.getFullYear()}-${String(filterDate.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        const isMatch = (item) => {
          const dVal = getItemDate(item);
          return dVal && dVal.startsWith(dStr);
        };

        const tickets = getChartMetrics(rawData.tickets, "tickets", isMatch);
        const bus = getChartMetrics(rawData.bus, "bus", isMatch);
        const parking = getChartMetrics(rawData.parking, "parking", isMatch);
        const tenants = getChartMetrics(rawData.tenants, "tenants", isMatch);

        chartPoints.push({
          name: i.toString(),
          ticketsRevenue: tickets.revenue,
          ticketsVolume: tickets.volume,
          busRevenue: bus.revenue,
          busVolume: bus.volume,
          parkingRevenue: parking.revenue,
          parkingVolume: parking.volume,
          tenantsRevenue: tenants.revenue,
          tenantsVolume: tenants.volume,
        });
      }
    } else if (filterView === "year") {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      chartPoints = months.map((m, idx) => {
        const monthFilter = (item) => {
          const dVal = getItemDate(item);
          if (!dVal) return false;
          const d = parseFlexibleDate(dVal);
          if (!d) return false;
          return (
            d.getMonth() === idx && d.getFullYear() === filterDate.getFullYear()
          );
        };

        const tickets = getChartMetrics(
          rawData.tickets,
          "tickets",
          monthFilter,
        );
        const bus = getChartMetrics(rawData.bus, "bus", monthFilter);
        const parking = getChartMetrics(
          rawData.parking,
          "parking",
          monthFilter,
        );
        const tenants = getChartMetrics(
          rawData.tenants,
          "tenants",
          monthFilter,
        );

        return {
          name: m,
          ticketsRevenue: tickets.revenue,
          ticketsVolume: tickets.volume,
          busRevenue: bus.revenue,
          busVolume: bus.volume,
          parkingRevenue: parking.revenue,
          parkingVolume: parking.volume,
          tenantsRevenue: tenants.revenue,
          tenantsVolume: tenants.volume,
        };
      });
    }
    setAnalyticsData(chartPoints);
  }, [
    rawData,
    filterDate,
    filterView,
    loading,
    targets,
    exportDateFrom,
    exportDateTo,
    isCustomExportRangeActive,
  ]);

  const handleFilterChange = ({ date, view }) => {
    setFilterDate(date);
    setFilterView(view);
  };

  const exportToPDF = () => {
    try {
      if (hasInvalidCustomExportRange()) {
        showToast("error", "Invalid export date range. From date must be earlier than To date.");
        return;
      }

      const payload = getExportPayload();
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.addImage(headerImg, "PNG", 0, 0, pageWidth, 35);

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("DASHBOARD REPORT", pageWidth / 2, 45, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      doc.text(`Generated: ${payload.meta.generatedAt}`, 15, 55);
      if (payload.meta.dateRange) {
        doc.text(`Export Range: ${payload.meta.dateRange}`, 15, 61);
      }

      autoTable(doc, {
        startY: payload.meta.dateRange ? 69 : 65,
        head: [["Module", "Revenue", "Target", "Progress"]],
        body: payload.stats.map((s) => {
          const moduleKey = s.label.toLowerCase().split(" ")[0];
          const targetVal = getTargetForExport(moduleKey);

          const percentReached =
            targetVal > 0 ? Math.round((s.rawValue / targetVal) * 100) : 0;

          const progressText = `${percentReached}% of Target`;

          return [
            s.label,
            `Php ${formatRevenueAmount(s.rawValue)}`,
            `Php ${formatRevenueAmount(targetVal)}`,
            progressText,
          ];
        }),
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9 },
        margin: { bottom: 20 },
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Revenue Breakdown", 15, finalY);

      autoTable(doc, {
        startY: finalY + 5,
        head: [["Module", "Revenue"]],
        body: payload.donut.map((d) => [
          d.name,
          `Php ${formatRevenueAmount(d.value)}`,
        ]),
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9 },
        margin: { bottom: 35 },
      });

      doc.addImage(footerImg, "PNG", 0, pageHeight - 30, pageWidth, 30);

      doc.save(`Dashboard_Report_${filterView}_${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      showToast("error", "Failed to export PDF. Please try again.");
    }
  };

  const exportToExcel = async () => {
    try {
      if (hasInvalidCustomExportRange()) {
        showToast("error", "Invalid export date range. From date must be earlier than To date.");
        return;
      }

      const payload = getExportPayload();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Dashboard Report");

      worksheet.getRow(1).height = 35; 
      await addImageToWorksheet(workbook, worksheet, headerImg, 'A1:D4');

      worksheet.mergeCells('A6:D6');
      const titleCell = worksheet.getCell('A6');
      titleCell.value = 'DASHBOARD REPORT';
      titleCell.font = { bold: true, size: 14, color: { argb: 'FFDC2626' } };
      titleCell.alignment = { horizontal: 'center' };

      worksheet.getCell('A7').value = `Generated: ${payload.meta.generatedAt}`;
      if (payload.meta.dateRange) {
        worksheet.getCell('A8').value = `Export Range: ${payload.meta.dateRange}`;
      }
      worksheet.addRow([]); 

      const summaryHeaderRow = worksheet.addRow(['REVENUE SUMMARY']);
      summaryHeaderRow.font = { bold: true };

      const tableHeader = worksheet.addRow(['Module', 'Revenue', 'Target', 'Progress']);
      tableHeader.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      });

      payload.stats.forEach((s) => {
        const moduleKey = s.label.toLowerCase().split(" ")[0];
        const targetVal = getTargetForExport(moduleKey);

        const percentReached =
          targetVal > 0 ? Math.round((s.rawValue / targetVal) * 100) : 0;

        worksheet.addRow([
          s.label,
          `Php ${formatRevenueAmount(s.rawValue)}`,
          `Php ${formatRevenueAmount(targetVal)}`,
          `${percentReached}% of Target`,
        ]
        );
      });

      worksheet.addRow([]); 

      const breakdownHeader = worksheet.addRow(['REVENUE BREAKDOWN']);
      breakdownHeader.font = { bold: true };

      const breakdownSubHeader = worksheet.addRow(['Module', 'Revenue']);
      breakdownSubHeader.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      });

      payload.donut.forEach((d) => {
        worksheet.addRow([d.name, `Php ${formatRevenueAmount(d.value)}`]);
      });

      const lastRowNumber = worksheet.lastRow.number + 2;
      worksheet.getRow(lastRowNumber).height = 52.5; 
      await addImageToWorksheet(workbook, worksheet, footerImg, `A${lastRowNumber}:D${lastRowNumber + 3}`);

      worksheet.getColumn(1).width = 35;
      worksheet.getColumn(2).width = 25;
      worksheet.getColumn(3).width = 25;
      worksheet.getColumn(4).width = 25;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `Dashboard_Branded_Report_${filterView}_${Date.now()}.xlsx`);

    } catch (err) {
      console.error("Dashboard ExcelJS export failed:", err);
      alert("Failed to export branded Excel.");
    }
  };

  const handleDownload = (format) => {
    if (format === "pdf") exportToPDF();
    if (format === "excel") exportToExcel();
  };

  return (
    <Layout title="Dashboard" hideMainScrollbar={true}>
      <div className="px-4 py-6 lg:px-8 space-y-10 bg-gray-50 min-h-screen">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div className="flex flex-col gap-3">
 
  <div className="flex flex-row flex-wrap items-center gap-3">
    <DashboardToolbar
      onRefresh={fetchDashboardData}
      onDownload={handleDownload}
      onFilterChange={handleFilterChange}
      loading={loading}
      onSetTargets={() => setIsTargetModalOpen(true)}
    />

    {isSuperAdmin && !showCustomRange && (
      <button
        type="button"
        onClick={() => setShowCustomRange(true)}
        className="h-10 px-4 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center w-fit cursor-pointer"
      >
        Date Range
      </button>
    )}
  </div>

  
  {isSuperAdmin && showCustomRange && (
    <div className="dashboard-custom-range-wrap animate-in fade-in slide-in-from-top-1 duration-200">
    <div className="relative z-40 bg-white border border-gray-200 rounded-xl p-3 shadow-sm w-fit">
      <div className="flex flex-wrap items-end gap-2.5">
        <DatePickerInput
          label="From"
          value={exportDateFrom}
          onChange={(e) => setExportDateFrom(e.target.value)}
          placeholder="dd/mm/yyyy"
          className="min-w-[180px]"
          inputClassName="h-10 rounded-xl border-gray-200 bg-gray-50/80 px-3.5 font-medium text-gray-700 focus:bg-white focus:border-teal-300 focus:ring-teal-300/30"
          calendarClassName="dashboard-range-calendar"
          popperClassName="dashboard-range-popper"
          popperStrategy="fixed"
          popperPlacement="bottom-start"
          portalId="dashboard-datepicker-portal"
        />

        <DatePickerInput
          label="To"
          value={exportDateTo}
          onChange={(e) => setExportDateTo(e.target.value)}
          placeholder="dd/mm/yyyy"
          className="min-w-[180px]"
          inputClassName="h-10 rounded-xl border-gray-200 bg-gray-50/80 px-3.5 font-medium text-gray-700 focus:bg-white focus:border-teal-300 focus:ring-teal-300/30"
          calendarClassName="dashboard-range-calendar"
          popperClassName="dashboard-range-popper"
          popperStrategy="fixed"
          popperPlacement="bottom-start"
          portalId="dashboard-datepicker-portal"
          minDate={parseDateStart(exportDateFrom) || undefined}
        />

        <button
          type="button"
          onClick={() => {
            setExportDateFrom("");
            setExportDateTo("");
          }}
          className="h-10 px-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
        >
          Clear
        </button>
        
        <button
          type="button"
          onClick={() => {
            setShowCustomRange(false);
            setExportDateFrom("");
            setExportDateTo("");
          }}
          className="h-10 px-3 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-all cursor-pointer"
        >
          Close
        </button>
      </div>

      {hasInvalidCustomExportRange() && (
        <p className="mt-2 text-sm text-red-600">
          Invalid range: From date must be earlier than or equal to To date.
        </p>
      )}
    </div>
    </div>
  )}
</div>

          <div className="flex justify-end">
            <button
              onClick={() => setIsTargetModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 
             text-gray-700 text-sm font-medium rounded-lg 
             shadow-sm hover:bg-gray-50 hover:border-teal-300 
             hover:text-teal-600 transition-all"
              title="Set Revenue Targets"
            >
              <Settings size={16} />
              Set Revenue Targets
            </button>
          </div>
        </div>

        <StatCards statsData={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <OperationsAnalytics data={analyticsData} loading={loading} />
          <SummaryDonut data={donutData} quota={totalQuota} loading={loading} />
        </div>

        <RecentActivity
          data={recentActivity}
          loading={loading}
          onItemClick={handleReportClick}
        />

        <TargetModal
          isOpen={isTargetModalOpen}
          onClose={() => setIsTargetModalOpen(false)}
          currentTargets={targets}
          onSave={handleSaveTargets}
        />
      </div>

      <NotificationToast
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
      />
    </Layout>
  );
};

export default Dashboard;