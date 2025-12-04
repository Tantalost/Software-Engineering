import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Settings } from "lucide-react"; 

// Components
import Layout from "../components/layout/Layout";
import StatCards from "../components/dashboard/StatCards";
import OperationsAnalytics from "../components/dashboard/OperationsAnalytics";
import SummaryDonut from "../components/dashboard/SummaryDonut";
import RecentActivity from "../components/dashboard/RecentActivity";
import DashboardToolbar from "../components/dashboard/DashboardToolbar";
import TargetModal from "../components/dashboard/TargetModal"; 

const Dashboard = () => {
  const navigate = useNavigate();

  // 1. Raw Data State
  const [rawData, setRawData] = useState({
    tickets: [], bus: [], tenants: [], parking: [], reports: []
  });

  // 2. Filter State
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterView, setFilterView] = useState("week");

  // --- Target State ---
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targets, setTargets] = useState(() => {
    const saved = localStorage.getItem("dashboardTargets");
    // Default values (You can change these to higher numbers if they are now Total Period targets)
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

  // 3. Display Data State
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [donutData, setDonutData] = useState([]);
  const [totalQuota, setTotalQuota] = useState(0); 
  const [loading, setLoading] = useState(true);

  // --- HELPER 1: Get Date ---
  const getItemDate = (item) => {
    if (!item) return null;
    return item.date || item.timeIn || item.createdAt || item.startDate || item.leaseStart || item.joinedAt;
  };

  // --- HELPER 2: Smart Revenue Finder ---
  const getSmartValue = (item) => {
    if (!item) return 0;
    const exactMatch = item.amount || item.Amount || item.fee || item.Fee || item.price || item.Price || item.total || item.Total || item.rent || item.Rent || item.monthlyRent || item.leaseAmount || item.cost || item.Cost || item.amountPaid;
    if (exactMatch !== undefined && exactMatch !== null) return exactMatch;
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

  // --- HELPER 3: Currency Formatter ---
  const formatCurrency = (value) => {
    if (value >= 1000) return `₱${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return `₱${value.toLocaleString()}`;
  };

  // --- UPDATED HELPER 4: Target Quota Calculator ---
  // FIXED: Removed multiplication. Returns the exact number you set in the modal.
  const calculateQuota = (moduleName) => {
    return targets[moduleName] || 0;
  };

  // --- HELPER 5: Date Logic ---
  const isDateInView = (dateString, view, anchorDate) => {
    if (!dateString) return false;
    const target = new Date(dateString);
    const anchor = new Date(anchorDate);
    if (isNaN(target.getTime())) return false; 

    if (view === "day") return target.toDateString() === anchor.toDateString();
    if (view === "week") {
      const start = new Date(anchor);
      start.setDate(anchor.getDate() - anchor.getDay());
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
      return target >= start && target <= end;
    }
    if (view === "month") return target.getMonth() === anchor.getMonth() && target.getFullYear() === anchor.getFullYear();
    if (view === "year") return target.getFullYear() === anchor.getFullYear();
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

  const handleReportClick = (reportId) => {
    navigate('/reports', { state: { openReportId: reportId } });
  };

  // --- PROCESS DATA ---
  useEffect(() => {
    if (loading) return;

    // 1. Generate Stat Cards
    const generateStat = (label, items, color, moduleKey) => {
      const currentItems = items.filter(i => isDateInView(getItemDate(i), filterView, filterDate));
      const currentRev = calculateRevenue(currentItems);
      
      // Pass moduleKey only. No view/date needed since we want the exact value.
      const targetRev = calculateQuota(moduleKey); 

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

    // Calculate total quota as sum of inputs
    const calculatedTotalQuota = 
        calculateQuota("tickets") +
        calculateQuota("bus") +
        calculateQuota("tenants") +
        calculateQuota("parking");
    
    setTotalQuota(calculatedTotalQuota);

    setDonutData([
      { name: "Tickets", value: calculateRevenue(filteredTickets), color: "#EF4444" },
      { name: "Bus", value: calculateRevenue(filteredBus), color: "#EAB308" },
      { name: "Tenants", value: calculateRevenue(filteredTenants), color: "#22C55E" },
      { name: "Parking", value: calculateRevenue(filteredParking), color: "#3B82F6" },
    ]);

    // 3. Recent Activity
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

    // 4. Analytics Chart Data
    let chartPoints = [];
    if (filterView === 'week') {
       const startOfWeek = new Date(filterDate);
       startOfWeek.setDate(filterDate.getDate() - filterDate.getDay());
       for(let i=0; i<7; i++) {
         const d = new Date(startOfWeek);
         d.setDate(startOfWeek.getDate() + i);
         const dateStr = d.toISOString().split('T')[0];
         const isMatch = (item) => { const dVal = getItemDate(item); return dVal && dVal.startsWith(dateStr); };
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
         });
       }
    } else if (filterView === 'month') {
        const daysInMonth = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0).getDate();
        for(let i=1; i<=daysInMonth; i++) {
            const dStr = `${filterDate.getFullYear()}-${String(filterDate.getMonth()+1).padStart(2, '0')}-${String(i).padStart(2,'0')}`;
            const isMatch = (item) => { const dVal = getItemDate(item); return dVal && dVal.startsWith(dStr); };
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
            });
        }
    } else if (filterView === 'year') {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      chartPoints = months.map((m, idx) => {
        const monthFilter = (item) => { const dVal = getItemDate(item); if(!dVal) return false; const d = new Date(dVal); return d.getMonth() === idx && d.getFullYear() === filterDate.getFullYear(); };
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
        };
      });
    }
    setAnalyticsData(chartPoints);

  }, [rawData, filterDate, filterView, loading, targets]);

  const handleFilterChange = ({ date, view }) => {
     setFilterDate(date);
     setFilterView(view);
  };

  const handleDownload = (format) => {
      // (This logic remains the same)
      if (format === 'csv') {
          // ... 
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

        <div className="flex justify-end -mb-6 relative z-10">
          <button 
            onClick={() => setIsTargetModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-full shadow-sm hover:bg-gray-50 hover:text-teal-600 transition-colors"
          >
            <Settings size={14} />
            Set Targets
          </button>
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