import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // <--- 1. Import useNavigate
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Layout from "../components/layout/Layout";
import StatCards from "../components/dashboard/StatCards";
import OperationsAnalytics from "../components/dashboard/OperationsAnalytics";
import SummaryDonut from "../components/dashboard/SummaryDonut";
import RecentActivity from "../components/dashboard/RecentActivity";
import DashboardToolbar from "../components/dashboard/DashboardToolbar";

const Dashboard = () => {
  const navigate = useNavigate(); // <--- 2. Initialize Hook

  // 1. Raw Data State
  const [rawData, setRawData] = useState({
    tickets: [],
    bus: [],
    tenants: [],
    parking: [],
    reports: []
  });

  // 2. Filter State
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterView, setFilterView] = useState("week");

  // 3. Display Data State
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [donutData, setDonutData] = useState([]);
  const [totalQuota, setTotalQuota] = useState(0); 
  const [loading, setLoading] = useState(true);

  // --- HELPER 1: Get Date from ANY Item ---
  const getItemDate = (item) => {
    if (!item) return null;
    return (
      item.date || 
      item.timeIn || 
      item.createdAt || 
      item.startDate ||   
      item.leaseStart ||  
      item.joinedAt       
    );
  };

  // --- HELPER 2: Smart Revenue Finder ---
  const getSmartValue = (item) => {
    if (!item) return 0;
    
    // Check known keys first
    const exactMatch = 
      item.amount || item.Amount || 
      item.fee || item.Fee || 
      item.price || item.Price || 
      item.total || item.Total ||
      item.rent || item.Rent || item.monthlyRent ||
      item.leaseAmount || item.cost || item.Cost || item.amountPaid;

    if (exactMatch !== undefined && exactMatch !== null) return exactMatch;

    // Search keys for money-related words
    const keys = Object.keys(item);
    const moneyKey = keys.find(k => 
      /amount|price|fee|cost|rent|total|pay/i.test(k) && 
      !k.toLowerCase().includes("id")
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

  // --- HELPER 3: Currency Formatter (6K format) ---
  const formatCurrency = (value) => {
    if (value >= 1000) {
      return `₱${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    return `₱${value.toLocaleString()}`;
  };

  // --- HELPER 4: Target Quota Calculator ---
  const calculateQuota = (moduleName, view, date) => {
    const dailyTargets = {
        tickets: 5000,  
        bus: 4000,      
        tenants: 10000, 
        parking: 3000   
    };

    const base = dailyTargets[moduleName] || 2000;
    
    if (view === 'day') return base;
    if (view === 'week') return base * 7;
    if (view === 'month') {
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        return base * daysInMonth;
    }
    if (view === 'year') {
        return base * 365;
    }
    return base;
  };

  // --- HELPER 5: Date Logic ---
  const isDateInView = (dateString, view, anchorDate) => {
    if (!dateString) return false;
    const target = new Date(dateString);
    const anchor = new Date(anchorDate);

    if (isNaN(target.getTime())) return false; 

    if (view === "day") {
      return target.toDateString() === anchor.toDateString();
    }
    if (view === "week") {
      const start = new Date(anchor);
      start.setDate(anchor.getDate() - anchor.getDay());
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
      return target >= start && target <= end;
    }
    if (view === "month") {
      return target.getMonth() === anchor.getMonth() && target.getFullYear() === anchor.getFullYear();
    }
    if (view === "year") {
      return target.getFullYear() === anchor.getFullYear();
    }
    return false;
  };

  // --- FETCH DATA ---
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

  // --- 6. NAVIGATION HANDLER ---
  const handleReportClick = (reportId) => {
    // Navigate to reports page, passing the report ID in the "state"
    // Your Reports component must check location.state.openReportId to trigger the modal
    navigate('/reports', { state: { openReportId: reportId } });
  };

  // --- PROCESS DATA ---
  useEffect(() => {
    if (loading) return;

    // 1. Generate Stat Cards
    const generateStat = (label, items, color, moduleKey) => {
      const currentItems = items.filter(i => isDateInView(getItemDate(i), filterView, filterDate));
      const currentRev = calculateRevenue(currentItems);
      const targetRev = calculateQuota(moduleKey, filterView, filterDate);

      let percent = 0;
      if (targetRev > 0) {
        percent = ((currentRev - targetRev) / targetRev) * 100;
      }

      const sign = percent >= 0 ? "+" : "";
      const changeLabel = `${sign}${percent.toFixed(1)}%`;

      return {
        label,
        value: formatCurrency(currentRev),
        change: changeLabel,
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

    // 2. Donut Data
    const filteredTickets = rawData.tickets.filter(i => isDateInView(getItemDate(i), filterView, filterDate));
    const filteredBus = rawData.bus.filter(i => isDateInView(getItemDate(i), filterView, filterDate));
    const filteredParking = rawData.parking.filter(i => isDateInView(getItemDate(i), filterView, filterDate));
    const filteredTenants = rawData.tenants.filter(i => isDateInView(getItemDate(i), filterView, filterDate));

    const calculatedTotalQuota = 
        calculateQuota("tickets", filterView, filterDate) +
        calculateQuota("bus", filterView, filterDate) +
        calculateQuota("tenants", filterView, filterDate) +
        calculateQuota("parking", filterView, filterDate);
    
    setTotalQuota(calculatedTotalQuota);

    setDonutData([
      { name: "Tickets", value: calculateRevenue(filteredTickets), color: "#EF4444" },
      { name: "Bus", value: calculateRevenue(filteredBus), color: "#EAB308" },
      { name: "Tenants", value: calculateRevenue(filteredTenants), color: "#22C55E" },
      { name: "Parking", value: calculateRevenue(filteredParking), color: "#3B82F6" },
    ]);

    // 3. Recent Activity (Ensuring ID is passed correctly)
    const filteredReports = rawData.reports.filter(r => isDateInView(r.createdAt || r.date, filterView, filterDate));
    const processedActivity = filteredReports
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 5)
      .map(r => ({
        id: r._id || r.id, // Ensure ID is present
        type: r.status === 'Resolved' ? 'success' : 'warning',
        message: `${r.type} Report Submitted`,
        date: r.createdAt || r.date,
        status: r.status,
      }));
    setRecentActivity(processedActivity);

    // 4. Analytics Chart Data
    let chartPoints = [];
    
    // --- WEEK VIEW ---
    if (filterView === 'week') {
       const startOfWeek = new Date(filterDate);
       startOfWeek.setDate(filterDate.getDate() - filterDate.getDay());
       
       for(let i=0; i<7; i++) {
         const d = new Date(startOfWeek);
         d.setDate(startOfWeek.getDate() + i);
         const dateStr = d.toISOString().split('T')[0];
         
         const isMatch = (item) => {
             const dVal = getItemDate(item);
             return dVal && dVal.startsWith(dateStr);
         };

         const dayTickets = rawData.tickets.filter(isMatch);
         const dayBus = rawData.bus.filter(isMatch);
         const dayParking = rawData.parking.filter(isMatch);
         const dayTenants = rawData.tenants.filter(isMatch);

         chartPoints.push({
           name: d.toLocaleDateString('en-US', { weekday: 'short' }),
           ticketsRevenue: calculateRevenue(dayTickets),
           busRevenue: calculateRevenue(dayBus),
           parkingRevenue: calculateRevenue(dayParking),
           tenantsRevenue: calculateRevenue(dayTenants),
           ticketsVolume: dayTickets.length,
           busVolume: dayBus.length,
           parkingVolume: dayParking.length,
           tenantsVolume: dayTenants.length,
         });
       }
    } 
    // --- MONTH VIEW ---
    else if (filterView === 'month') {
        const daysInMonth = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0).getDate();
        for(let i=1; i<=daysInMonth; i++) {
            const dStr = `${filterDate.getFullYear()}-${String(filterDate.getMonth()+1).padStart(2, '0')}-${String(i).padStart(2,'0')}`;
            const isMatch = (item) => {
                const dVal = getItemDate(item);
                return dVal && dVal.startsWith(dStr);
            };

            const dayTickets = rawData.tickets.filter(isMatch);
            const dayBus = rawData.bus.filter(isMatch);
            const dayParking = rawData.parking.filter(isMatch);
            const dayTenants = rawData.tenants.filter(isMatch);

            chartPoints.push({
                name: i.toString(),
                ticketsRevenue: calculateRevenue(dayTickets),
                busRevenue: calculateRevenue(dayBus),
                parkingRevenue: calculateRevenue(dayParking),
                tenantsRevenue: calculateRevenue(dayTenants),
                ticketsVolume: dayTickets.length,
                busVolume: dayBus.length,
                parkingVolume: dayParking.length,
                tenantsVolume: dayTenants.length,
            });
        }
    }
    // --- YEAR VIEW ---
    else if (filterView === 'year') {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      chartPoints = months.map((m, idx) => {
        const monthFilter = (item) => {
            const dVal = getItemDate(item);
            if(!dVal) return false;
            const d = new Date(dVal);
            return d.getMonth() === idx && d.getFullYear() === filterDate.getFullYear();
        };

        const mTickets = rawData.tickets.filter(monthFilter);
        const mBus = rawData.bus.filter(monthFilter);
        const mParking = rawData.parking.filter(monthFilter);
        const mTenants = rawData.tenants.filter(monthFilter);

        return {
          name: m,
          ticketsRevenue: calculateRevenue(mTickets),
          busRevenue: calculateRevenue(mBus),
          parkingRevenue: calculateRevenue(mParking),
          tenantsRevenue: calculateRevenue(mTenants),
          ticketsVolume: mTickets.length,
          busVolume: mBus.length,
          parkingVolume: mParking.length,
          tenantsVolume: mTenants.length,
        };
      });
    }

    setAnalyticsData(chartPoints);

  }, [rawData, filterDate, filterView, loading]);

  const handleFilterChange = ({ date, view }) => {
     setFilterDate(date);
     setFilterView(view);
  };

  // ... (Keeping your existing handleDownload function exactly as is - removed for brevity but keep it in your file) ...
   const handleDownload = (format) => {
    if (format === 'csv') {
      const headers = ["Date/Label", "Tickets Rev", "Bus Rev", "Parking Rev", "Tenants Rev", "Total Rev"];
      
      const rows = analyticsData.map(row => {
        const total = (row.ticketsRevenue || 0) + (row.busRevenue || 0) + (row.parkingRevenue || 0) + (row.tenantsRevenue || 0);
        return [
          row.name, 
          row.ticketsRevenue || 0,
          row.busRevenue || 0,
          row.parkingRevenue || 0,
          row.tenantsRevenue || 0,
          total
        ];
      });

      const summaryRows = [
        ["--- SUMMARY REPORT ---"],
        [`Generated: ${new Date().toLocaleString()}`],
        ["Category", "Revenue", "Target Status"],
        ...stats.map(s => [s.label, s.value, s.change]),
        ["----------------------"],
        [""] 
      ];

      const csvContent = [
        ...summaryRows.map(e => e.join(",")),
        headers.join(","),
        ...rows.map(e => e.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `dashboard_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } 
    else if (format === 'pdf') {
      const doc = new jsPDF();
      
      const primaryColor = [16, 185, 129]; 
      const lightBg = [236, 253, 245];    
      const slateDark = [30, 41, 59];     
      const slateLight = [100, 116, 139]; 

      doc.setFontSize(18);
      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.text("EXECUTIVE OPERATIONS REPORT", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(...slateLight);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
      
      doc.setDrawColor(...slateLight);
      doc.setLineWidth(0.1);
      doc.line(14, 30, 196, 30);

      doc.setFontSize(10);
      doc.setTextColor(...slateDark);
      doc.text(`Period View: ${filterView.toUpperCase()}`, 14, 40);
      doc.text(`Anchor Date: ${filterDate.toLocaleDateString()}`, 14, 46);

      const allRevenue = donutData.reduce((acc, curr) => acc + curr.value, 0);
      
      doc.setFillColor(...lightBg);
      doc.setDrawColor(...primaryColor);
      doc.roundedRect(130, 35, 66, 20, 2, 2, "FD");

      doc.setFontSize(9);
      doc.setTextColor(...slateLight);
      doc.text("TOTAL PERIOD REVENUE", 135, 41);
      
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.text(`P ${allRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})}`, 135, 49);

      const summaryCols = ["Revenue Stream", "Actual Revenue", "Target Status"];
      const summaryRows = stats.map(s => [
        s.label.replace(" Revenue", ""), 
        s.value,
        s.change.includes("+") ? `Above Target (${s.change})` : `Below Target (${s.change})`
      ]);

      autoTable(doc, {
        startY: 60,
        head: [summaryCols],
        body: summaryRows,
        theme: 'grid',
        headStyles: { fillColor: slateDark, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
            0: { fontStyle: 'bold' },
            1: { halign: 'right' },
            2: { halign: 'right' }
        }
      });

      doc.setFontSize(12);
      doc.setTextColor(...slateDark);
      doc.text("Detailed Revenue Breakdown", 14, doc.lastAutoTable.finalY + 12);

      const detailCols = ["Date/Period", "Tickets", "Bus", "Parking", "Tenants", "Total"];
      
      let grandTotal = 0;
      const detailRows = analyticsData.map(row => {
        const rowTotal = (row.ticketsRevenue || 0) + (row.busRevenue || 0) + (row.parkingRevenue || 0) + (row.tenantsRevenue || 0);
        grandTotal += rowTotal;
        return [
          row.name,
          `P ${(row.ticketsRevenue || 0).toLocaleString()}`,
          `P ${(row.busRevenue || 0).toLocaleString()}`,
          `P ${(row.parkingRevenue || 0).toLocaleString()}`,
          `P ${(row.tenantsRevenue || 0).toLocaleString()}`,
          `P ${rowTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`
        ];
      });

      detailRows.push([
        "GRAND TOTAL", 
        "", "", "", "", 
        `P ${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        head: [detailCols],
        body: detailRows,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: primaryColor, halign: 'center' },
        columnStyles: {
            0: { fontStyle: 'bold' },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold', textColor: slateDark }
        },
        didParseCell: function (data) {
            if (data.row.index === detailRows.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [241, 245, 249];
            }
        }
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: "right" });
        doc.text("Confidential Executive Report", 14, 290);
      }

      doc.save(`executive_report_${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };


  return (
    <Layout title="Dashboard">
      <div className="px-4 pt-0 lg:px-2 lg:pt-0 space-y-8">
        <DashboardToolbar 
          onRefresh={fetchDashboardData} 
          onDownload={handleDownload}    
          onFilterChange={handleFilterChange}
          loading={loading}              
        />
        
        <StatCards statsData={stats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <OperationsAnalytics data={analyticsData} loading={loading} />
          <SummaryDonut data={donutData} quota={totalQuota} loading={loading} />
        </div>
        
        {/* Pass the click handler to RecentActivity */}
        <RecentActivity 
            data={recentActivity} 
            loading={loading} 
            onItemClick={handleReportClick} // <--- 3. PASS THE HANDLER
        />

      </div>
    </Layout>
  );
};

export default Dashboard;