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

const Dashboard = () => {
  const navigate = useNavigate();

  const [rawData, setRawData] = useState({
    tickets: [],
    bus: [],
    tenants: [],
    parking: [],
    reports: [],
  });

  const [filterDate, setFilterDate] = useState(new Date());
  const [filterView, setFilterView] = useState("week");

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targets, setTargets] = useState(() => {
    const saved = localStorage.getItem("dashboardTargets");
    return saved
      ? JSON.parse(saved)
      : {
        tickets: 5000,
        bus: 4000,
        tenants: 10000,
        parking: 3000,
      };
  });

  const [toast, setToast] = useState({
    isOpen: false,
    message: "",
    type: "success",
  });

  const handleSaveTargets = (newTargets) => {
    setTargets(newTargets);
    localStorage.setItem("dashboardTargets", JSON.stringify(newTargets));

    setToast({
      isOpen: true,
      message: "Revenue targets saved successfully",
      type: "success",
    });

    setIsTargetModalOpen(false);

    setTimeout(() => {
      setToast((prev) => ({ ...prev, isOpen: false }));
    }, 3000);
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
    if (view === "month")
      return (
        target.getMonth() === anchor.getMonth() &&
        target.getFullYear() === anchor.getFullYear()
      );
    if (view === "year") return target.getFullYear() === anchor.getFullYear();
    return false;
  };

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, busRes, tenantsRes, parkingRes, reportsRes] =
        await Promise.all([
          fetch(`${API_URL}/api/terminal-fees`),
          fetch(`${API_URL}/api/bustrips`),
          fetch(`${API_URL}/api/tenants`),
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

      console.log("DASHBOARD DATA:", {
        tickets,
        bus,
        tenants,
        parking,
        reports,
      });

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

    return items.filter((i) => {
      const s = (i.status || "").toLowerCase();
      return ["paid", "completed", "active"].includes(s);
    });
  };

  useEffect(() => {
    if (loading) return;

    const generateStat = (label, items, color, moduleKey) => {
      const dateFiltered = items.filter((i) =>
        isDateInView(getItemDate(i), filterView, filterDate),
      );

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
        value: formatCurrencyFull(currentRev),
        rawValue: currentRev,
        change: `${percent.toFixed(0)}% of Target`,
        subtitle: `Target: ${formatCurrencyFull(targetRev)}`,
        color,
      };
    };

    const formatCurrencyFull = (value) => {
      return `₱${Number(value).toLocaleString()}`;
    };

    setStats([
      generateStat("Tickets Revenue", rawData.tickets, "red", "tickets"),
      generateStat("Bus Revenue", rawData.bus, "yellow", "bus"),
      generateStat("Tenants Revenue", rawData.tenants, "green", "tenants"),
      generateStat("Parking Revenue", rawData.parking, "blue", "parking"),
    ]);

    const monthlyTotalTarget = Object.values(targets).reduce(
      (a, b) => a + b,
      0,
    );
    let scaledQuota = 0;
    if (filterView === "day") scaledQuota = monthlyTotalTarget / 30;
    else if (filterView === "week") scaledQuota = monthlyTotalTarget / 4;
    else if (filterView === "month") scaledQuota = monthlyTotalTarget;
    else if (filterView === "year") scaledQuota = monthlyTotalTarget * 12;

    setTotalQuota(scaledQuota);

    const filteredTickets = getPaidItems(
      rawData.tickets.filter((i) =>
        isDateInView(getItemDate(i), filterView, filterDate),
      ),
      "tickets",
    );
    const filteredBus = getPaidItems(
      rawData.bus.filter((i) =>
        isDateInView(getItemDate(i), filterView, filterDate),
      ),
      "bus",
    );
    const filteredParking = getPaidItems(
      rawData.parking.filter((i) =>
        isDateInView(getItemDate(i), filterView, filterDate),
      ),
      "parking",
    );
    const filteredTenants = getPaidItems(
      rawData.tenants.filter((i) =>
        isDateInView(getItemDate(i), filterView, filterDate),
      ),
      "tenants",
    );

    setDonutData([
      {
        name: "Tickets",
        value: calculateRevenue(filteredTickets),
        color: "#EF4444",
      },
      { name: "Bus", value: calculateRevenue(filteredBus), color: "#EAB308" },
      {
        name: "Tenants",
        value: calculateRevenue(filteredTenants),
        color: "#22C55E",
      },
      {
        name: "Parking",
        value: calculateRevenue(filteredParking),
        color: "#3B82F6",
      },
    ]);

    const filteredReports = rawData.reports.filter((r) =>
      isDateInView(r.createdAt || r.date, filterView, filterDate),
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
      const paidOnly = getPaidItems(dateMatched, moduleKey);
      return {
        revenue: calculateRevenue(paidOnly),
        volume: paidOnly.length,
      };
    };

    let chartPoints = [];
    if (filterView === "week") {
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
          const d = new Date(dVal);
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
  }, [rawData, filterDate, filterView, loading, targets]);

  const handleFilterChange = ({ date, view }) => {
    setFilterDate(date);
    setFilterView(view);
  };

  const exportToPDF = () => {
    try {
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

      autoTable(doc, {
        startY: 65,
        head: [["Module", "Revenue", "Target", "Progress"]],
        body: payload.stats.map((s) => {
          const moduleKey = s.label.toLowerCase().split(" ")[0];
          const baseMonthlyTarget = targets[moduleKey] || 0;

          let targetVal = 0;
          if (filterView === "day") targetVal = baseMonthlyTarget / 30;
          else if (filterView === "week") targetVal = baseMonthlyTarget / 4;
          else if (filterView === "month") targetVal = baseMonthlyTarget;
          else if (filterView === "year") targetVal = baseMonthlyTarget * 12;

          const percentReached =
            targetVal > 0 ? Math.round((s.rawValue / targetVal) * 100) : 0;

          const progressText = `${percentReached}% of Target`;

          return [
            s.label,
            `Php ${Number(s.rawValue).toLocaleString()}`,
            `Php ${Math.round(targetVal).toLocaleString()}`,
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
          `Php ${d.value.toLocaleString()}`,
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

  // --- EXPORT TO EXCEL (USING EXCELJS) ---
  // --- BRANDED EXPORT TO EXCEL (USING EXCELJS) ---
  const exportToExcel = async () => {
    try {
      const payload = getExportPayload();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Dashboard Report");

      // 1. BRANDED HEADER (-1/8 height adjustment)
      worksheet.getRow(1).height = 35; // Reduced from base points
      await addImageToWorksheet(workbook, worksheet, headerImg, 'A1:D4');

      // 2. Report Title & Metadata (Positioned after header)
      worksheet.mergeCells('A6:D6');
      const titleCell = worksheet.getCell('A6');
      titleCell.value = 'DASHBOARD REPORT';
      titleCell.font = { bold: true, size: 14, color: { argb: 'FFDC2626' } };
      titleCell.alignment = { horizontal: 'center' };

      worksheet.getCell('A7').value = `Generated: ${payload.meta.generatedAt}`;
      worksheet.addRow([]); // Spacer

      // 3. Revenue Summary Section
      const summaryHeaderRow = worksheet.addRow(['REVENUE SUMMARY']);
      summaryHeaderRow.font = { bold: true };

      const tableHeader = worksheet.addRow(['Module', 'Revenue', 'Target', 'Progress']);
      tableHeader.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      });

      payload.stats.forEach((s) => {
        const moduleKey = s.label.toLowerCase().split(" ")[0];
        const baseMonthlyTarget = targets[moduleKey] || 0;

        let targetVal = 0;
        if (filterView === "day") targetVal = baseMonthlyTarget / 30;
        else if (filterView === "week") targetVal = baseMonthlyTarget / 4;
        else if (filterView === "month") targetVal = baseMonthlyTarget;
        else if (filterView === "year") targetVal = baseMonthlyTarget * 12;

        const percentReached =
          targetVal > 0 ? Math.round((s.rawValue / targetVal) * 100) : 0;

        worksheet.addRow([
          s.label,
          `Php ${Number(s.rawValue).toLocaleString()}`,
          `Php ${Math.round(targetVal).toLocaleString()}`,
          `${percentReached}% of Target`,
        ]
        );
      });

      worksheet.addRow([]); // Spacer

      // 4. Revenue Breakdown Section
      const breakdownHeader = worksheet.addRow(['REVENUE BREAKDOWN']);
      breakdownHeader.font = { bold: true };

      const breakdownSubHeader = worksheet.addRow(['Module', 'Revenue']);
      breakdownSubHeader.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      });

      payload.donut.forEach((d) => {
        worksheet.addRow([d.name, `Php ${d.value.toLocaleString()}`]);
      });

      // 5. BRANDED FOOTER (-1/8 height adjustment)
      const lastRowNumber = worksheet.lastRow.number + 2;
      worksheet.getRow(lastRowNumber).height = 52.5; // Reduced from base points
      await addImageToWorksheet(workbook, worksheet, footerImg, `A${lastRowNumber}:D${lastRowNumber + 3}`);

      // 6. Column Widths for readability
      worksheet.getColumn(1).width = 35;
      worksheet.getColumn(2).width = 25;
      worksheet.getColumn(3).width = 25;
      worksheet.getColumn(4).width = 25;

      // 7. Write and Save
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
    <Layout title="Dashboard">
      <div className="px-4 py-6 lg:px-8 space-y-10 bg-gray-50 min-h-screen">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <DashboardToolbar
            onRefresh={fetchDashboardData}
            onDownload={handleDownload}
            onFilterChange={handleFilterChange}
            loading={loading}
            onSetTargets={() => setIsTargetModalOpen(true)}
          />

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
