import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Settings } from "lucide-react";
import Layout from "../components/layout/Layout";
import StatCards from "../components/dashboard/StatCards";
import OperationsAnalytics from "../components/dashboard/OperationsAnalytics";
import SummaryDonut from "../components/dashboard/SummaryDonut";
import RecentActivity from "../components/dashboard/RecentActivity";
import DashboardToolbar from "../components/dashboard/DashboardToolbar";
import TargetModal from "../components/dashboard/TargetModal";

const Dashboard = () => {
  const navigate = useNavigate();

  // RAW DATA
  const [rawData, setRawData] = useState({
    tickets: [], bus: [], tenants: [], parking: [], reports: []
  });

  const [filterDate, setFilterDate] = useState(new Date());
  const [filterView, setFilterView] = useState("week");

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targets, setTargets] = useState(() => {
    const saved = localStorage.getItem("dashboardTargets");
    return saved ? JSON.parse(saved) : {
      tickets: 5000,
      bus: 4000,
      tenants: 10000,
      parking: 3000
    };
  });

  const handleSaveTargets = (newTargets) => {
    setTargets(newTargets);
    localStorage.setItem("dashboardTargets", JSON.stringify(newTargets));
  };

  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [donutData, setDonutData] = useState([]);
  const [totalQuota, setTotalQuota] = useState(0);
  const [loading, setLoading] = useState(true);

  // Helper: Get Date
  const getItemDate = (item) => {
    if (!item) return null;
    return item.date || item.timeIn || item.entryTime || item.createdAt || item.startDate || item.leaseStart || item.joinedAt;
  };

  // UPDATED: Helper to get Value (Added finalPrice)
  const getSmartValue = (item) => {
    if (!item) return 0;
    // Added 'item.finalPrice' to the start of this list for Parking
    const exactMatch = item.finalPrice || item.amount || item.Amount || item.fee || item.Fee || item.price || item.Price || item.total || item.Total || item.rent || item.Rent || item.monthlyRent || item.leaseAmount || item.cost || item.Cost || item.amountPaid;
    
    if (exactMatch !== undefined && exactMatch !== null) return exactMatch;
    
    // Try to find any key that looks like money
    const keys = Object.keys(item);
    const moneyKey = keys.find(k => /amount|price|fee|cost|rent|total|pay/i.test(k) && !k.toLowerCase().includes("id"));
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
    if (value >= 1000) return `₱${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return `₱${value.toLocaleString()}`;
  };

  // --- EXPORT DATA BUILDER ---
const getExportPayload = () => {
  return {
    meta: {
      view: filterView,
      date: filterDate.toDateString(),
      generatedAt: new Date().toLocaleString(),
    },
    stats,
    donut: donutData,
    analytics: analyticsData,
    activity: recentActivity,
  };
};

  const isDateInView = (dateString, view, anchorDate) => {
    if (!dateString) return false;
    const target = new Date(dateString);
    const anchor = new Date(anchorDate);
    if (isNaN(target.getTime())) return false;

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
    if (view === "month") return target.getMonth() === anchor.getMonth() && target.getFullYear() === anchor.getFullYear();
    if (view === "year") return target.getFullYear() === anchor.getFullYear();
    return false;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, busRes, tenantsRes, parkingRes, reportsRes] = await Promise.all([
        fetch("http://localhost:3000/api/terminal-fees"),
        fetch("http://localhost:3000/api/bustrips"),
        fetch("http://localhost:3000/api/tenants"),
        fetch("http://localhost:3000/api/parking"),
        fetch("http://localhost:3000/api/reports")
      ]);

      const parseResponse = async (res) => {
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json) ? json : (json.data || json.result || []);
      };

      const tickets = await parseResponse(ticketsRes);
      const bus = await parseResponse(busRes);
      const tenants = await parseResponse(tenantsRes);
      const parking = await parseResponse(parkingRes);
      const reports = await parseResponse(reportsRes);
      
      console.log("DASHBOARD DATA:", { tickets, bus, tenants, parking, reports });

      setRawData({ tickets, bus, tenants, parking, reports });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleReportClick = (reportId) => {
    navigate('/reports', { state: { openReportId: reportId } });
  };

  // UPDATED: Helper to Filter for Paid/Active items
  const getPaidItems = (items, category) => {
    if (!items || !items.length) return [];
    
    if (category === 'tickets') return items;

    // UPDATED: Added 'departed' to the list of allowed statuses for Parking
    if (category === 'parking') {
        return items.filter(i => {
            const s = (i.status || "").toLowerCase();
            return ['paid', 'completed', 'active', 'occupied', 'parked', 'pending', 'departed'].includes(s);
        });
    }

    return items.filter(i => {
        const s = (i.status || "").toLowerCase();
        return ['paid', 'completed', 'active'].includes(s);
    });
  };

  useEffect(() => {
    if (loading) return;

    // --- REVENUE STATS CALCULATION ---
    const generateStat = (label, items, color, moduleKey) => {
      // 1. Filter by Date
      const dateFiltered = items.filter(i => isDateInView(getItemDate(i), filterView, filterDate));
      
      // 2. Filter by Status
      const paidItems = getPaidItems(dateFiltered, moduleKey);

      const currentRev = calculateRevenue(paidItems);

      const baseMonthlyTarget = targets[moduleKey] || 0;
      let targetRev = 0;

      if (filterView === "day") targetRev = baseMonthlyTarget / 30;
      else if (filterView === "week") targetRev = baseMonthlyTarget / 4;
      else if (filterView === "month") targetRev = baseMonthlyTarget;
      else if (filterView === "year") targetRev = baseMonthlyTarget * 12;

      const percent = targetRev > 0 ? (currentRev / targetRev) * 100 : 0;

      return {
        label,
        value: formatCurrency(currentRev),
        change: `${percent.toFixed(0)}% of Target`,
        subtitle: `Target: ${formatCurrency(targetRev)}`,
        color
      };
    };

    setStats([
      generateStat("Tickets Revenue", rawData.tickets, "red", "tickets"),
      generateStat("Bus Revenue", rawData.bus, "yellow", "bus"),
      generateStat("Tenants Revenue", rawData.tenants, "green", "tenants"),
      generateStat("Parking Revenue", rawData.parking, "blue", "parking"),
    ]);

    // --- SUMMARY DONUT CALCULATION ---
    const monthlyTotalTarget = Object.values(targets).reduce((a, b) => a + b, 0);
    let scaledQuota = 0;
    if (filterView === "day") scaledQuota = monthlyTotalTarget / 30;
    else if (filterView === "week") scaledQuota = monthlyTotalTarget / 4;
    else if (filterView === "month") scaledQuota = monthlyTotalTarget;
    else if (filterView === "year") scaledQuota = monthlyTotalTarget * 12;

    setTotalQuota(scaledQuota);

    const filteredTickets = getPaidItems(rawData.tickets.filter(i => isDateInView(getItemDate(i), filterView, filterDate)), 'tickets');
    const filteredBus = getPaidItems(rawData.bus.filter(i => isDateInView(getItemDate(i), filterView, filterDate)), 'bus');
    const filteredParking = getPaidItems(rawData.parking.filter(i => isDateInView(getItemDate(i), filterView, filterDate)), 'parking');
    const filteredTenants = getPaidItems(rawData.tenants.filter(i => isDateInView(getItemDate(i), filterView, filterDate)), 'tenants');

    setDonutData([
      { name: "Tickets", value: calculateRevenue(filteredTickets), color: "#EF4444" },
      { name: "Bus", value: calculateRevenue(filteredBus), color: "#EAB308" },
      { name: "Tenants", value: calculateRevenue(filteredTenants), color: "#22C55E" },
      { name: "Parking", value: calculateRevenue(filteredParking), color: "#3B82F6" },
    ]);

    // --- RECENT ACTIVITY ---
    const filteredReports = rawData.reports.filter(r => isDateInView(r.createdAt || r.date, filterView, filterDate));
    const processedActivity = filteredReports
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 5)
      .map(r => ({
        id: r._id || r.id,
        type: r.status === 'Resolved' ? 'success' : 'warning',
        message: `${r.type} Report Submitted`,
        date: r.createdAt || r.date,
        status: r.status,
      }));
    setRecentActivity(processedActivity);

    // --- CHART DATA (REVENUE + VOLUME) ---
    const getChartMetrics = (items, moduleKey, dateMatchFn) => {
        const dateMatched = items.filter(dateMatchFn);
        const paidOnly = getPaidItems(dateMatched, moduleKey);
        return {
            revenue: calculateRevenue(paidOnly),
            volume: paidOnly.length
        };
    };

    let chartPoints = [];
    if (filterView === 'week') {
      const startOfWeek = new Date(filterDate);
      startOfWeek.setDate(filterDate.getDate() - filterDate.getDay());
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        const isMatch = (item) => { const dVal = getItemDate(item); return dVal && dVal.startsWith(dateStr); };
        
        const tickets = getChartMetrics(rawData.tickets, 'tickets', isMatch);
        const bus = getChartMetrics(rawData.bus, 'bus', isMatch);
        const parking = getChartMetrics(rawData.parking, 'parking', isMatch);
        const tenants = getChartMetrics(rawData.tenants, 'tenants', isMatch);

        chartPoints.push({
          name: d.toLocaleDateString('en-US', { weekday: 'short' }),
          ticketsRevenue: tickets.revenue, ticketsVolume: tickets.volume,
          busRevenue: bus.revenue, busVolume: bus.volume,
          parkingRevenue: parking.revenue, parkingVolume: parking.volume,
          tenantsRevenue: tenants.revenue, tenantsVolume: tenants.volume,
        });
      }
    } else if (filterView === 'month') {
      const daysInMonth = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dStr = `${filterDate.getFullYear()}-${String(filterDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isMatch = (item) => { const dVal = getItemDate(item); return dVal && dVal.startsWith(dStr); };
        
        const tickets = getChartMetrics(rawData.tickets, 'tickets', isMatch);
        const bus = getChartMetrics(rawData.bus, 'bus', isMatch);
        const parking = getChartMetrics(rawData.parking, 'parking', isMatch);
        const tenants = getChartMetrics(rawData.tenants, 'tenants', isMatch);

        chartPoints.push({
          name: i.toString(),
          ticketsRevenue: tickets.revenue, ticketsVolume: tickets.volume,
          busRevenue: bus.revenue, busVolume: bus.volume,
          parkingRevenue: parking.revenue, parkingVolume: parking.volume,
          tenantsRevenue: tenants.revenue, tenantsVolume: tenants.volume,
        });
      }
    } else if (filterView === 'year') {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      chartPoints = months.map((m, idx) => {
        const monthFilter = (item) => {
          const dVal = getItemDate(item);
          if (!dVal) return false;
          const d = new Date(dVal);
          return d.getMonth() === idx && d.getFullYear() === filterDate.getFullYear();
        };
        
        const tickets = getChartMetrics(rawData.tickets, 'tickets', monthFilter);
        const bus = getChartMetrics(rawData.bus, 'bus', monthFilter);
        const parking = getChartMetrics(rawData.parking, 'parking', monthFilter);
        const tenants = getChartMetrics(rawData.tenants, 'tenants', monthFilter);

        return {
          name: m,
          ticketsRevenue: tickets.revenue, ticketsVolume: tickets.volume,
          busRevenue: bus.revenue, busVolume: bus.volume,
          parkingRevenue: parking.revenue, parkingVolume: parking.volume,
          tenantsRevenue: tenants.revenue, tenantsVolume: tenants.volume,
        };
      });
    }
    setAnalyticsData(chartPoints);

  }, [rawData, filterDate, filterView, loading, targets]);

  const handleFilterChange = ({ date, view }) => {
    setFilterDate(date);
    setFilterView(view);
  };

  // --- EXPORT TO EXCEL ---
const exportToExcel = () => {
  try {
    const payload = getExportPayload();
    const wb = XLSX.utils.book_new();

    // --- Stats Sheet ---
    const statsSheet = XLSX.utils.json_to_sheet(
      payload.stats.map(s => ({
        Module: s.label,
        Revenue: Number(String(s.value).replace(/[^0-9.-]+/g, "")),
        Target: Number(String(s.subtitle).replace(/[^0-9.-]+/g, "")),
        Progress: s.change,
      }))
    );
    XLSX.utils.book_append_sheet(wb, statsSheet, "Revenue Summary");

    // --- Donut Sheet ---
    const donutSheet = XLSX.utils.json_to_sheet(
      payload.donut.map(d => ({
        Module: d.name,
        Revenue: d.value,
      }))
    );
    XLSX.utils.book_append_sheet(wb, donutSheet, "Revenue Breakdown");

    // --- Analytics Sheet ---
    const analyticsSheet = XLSX.utils.json_to_sheet(payload.analytics);
    XLSX.utils.book_append_sheet(wb, analyticsSheet, "Trends");

    // --- Recent Activity Sheet ---
    const activitySheet = XLSX.utils.json_to_sheet(
      payload.activity.map(a => ({
        Message: a.message,
        Status: a.status,
        Date: a.date ? new Date(a.date).toLocaleString() : "",
      }))
    );
    XLSX.utils.book_append_sheet(wb, activitySheet, "Recent Activity");

    // --- Save Excel file ---
    XLSX.writeFile(wb, `Dashboard_Report_${filterView}_${Date.now()}.xlsx`);

    console.log("Excel exported successfully!");
  } catch (err) {
    console.error("Excel export failed:", err);
  }
};


  const handleDownload = (format) => {
  if (format === "pdf") exportToPDF();
  if (format === "excel") exportToExcel();
};


  return (
    <Layout title="Dashboard">
      <div className="px-4 pt-0 lg:px-2 lg:pt-0 space-y-6">

        {/* --- FILTERS + TARGETS ALIGNMENT --- */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          {/* Left: Filters + Download */}
          <DashboardToolbar
            onRefresh={fetchDashboardData}
            onDownload={handleDownload}
            onFilterChange={handleFilterChange}
            loading={loading}
            onSetTargets={() => setIsTargetModalOpen(true)}
          />

          {/* Right: Set Targets Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setIsTargetModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-full shadow-sm hover:bg-gray-50 hover:text-teal-600 transition-colors cursor-pointer"
              title="Set Revenue Targets"
            >
              <Settings size={14} />
              Set Targets
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
    </Layout>
  );
};

export default Dashboard;
