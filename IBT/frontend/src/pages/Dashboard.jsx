import React, { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import StatCards from "../components/dashboard/StatCards";
import OperationsAnalytics from "../components/dashboard/OperationsAnalytics";
import SummaryDonut from "../components/dashboard/SummaryDonut";
import RecentActivity from "../components/dashboard/RecentActivity";
import DashboardToolbar from "../components/dashboard/DashboardToolbar";

const Dashboard = () => {
  const [stats, setStats] = useState({
    tickets: 0,
    bus: 0,
    tenants: 0,
    parking: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [donutData, setDonutData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to normalize dates for charting (last 7 days)
  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  // Function to fetch counts from all 4 modules + Reports
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Execute all fetch requests in parallel
      const [ticketsRes, busRes, tenantsRes, parkingRes, reportsRes] = await Promise.all([
        fetch("http://localhost:3000/api/terminal-fees"),
        fetch("http://localhost:3000/api/bustrips"),
        fetch("http://localhost:3000/api/tenants"),
        fetch("http://localhost:3000/api/parking"),
        fetch("http://localhost:3000/api/reports") // Fetch Reports
      ]);

      // Parse JSON (Add safety checks if needed)
      const ticketsData = ticketsRes.ok ? await ticketsRes.json() : [];
      const busData = busRes.ok ? await busRes.json() : [];
      const tenantsData = tenantsRes.ok ? await tenantsRes.json() : [];
      const parkingData = parkingRes.ok ? await parkingRes.json() : [];
      const reportsData = reportsRes.ok ? await reportsRes.json() : [];

      // 1. Update Headliner Stats
      setStats({
        tickets: ticketsData.length,
        bus: busData.length,
        tenants: tenantsData.length,
        parking: parkingData.length
      });

      // 2. Process Summary Donut Data
      setDonutData([
        { name: "Tickets", value: ticketsData.length, color: "#EF4444" }, // Red
        { name: "Bus Trips", value: busData.length, color: "#EAB308" }, // Yellow
        { name: "Tenants", value: tenantsData.length, color: "#22C55E" }, // Green
        { name: "Parking", value: parkingData.length, color: "#3B82F6" }, // Blue
      ]);

      // 3. Process Recent Activity (Now showing Recent Reports)
      const reportActivities = reportsData.map(r => ({
        id: r._id || r.id,
        type: "Report",
        message: `${r.type} Report Submitted`, // e.g. "Bus Trips Report Submitted"
        date: r.createdAt || r.date,
        status: r.status, // e.g. "Submitted"
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600"
      }));

      // Sort by date (newest first) and take top 5
      const sortedActivity = reportActivities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      
      setRecentActivity(sortedActivity);

      // 4. Process Operations Analytics (Volume per day for last 7 days)
      const last7Days = getLast7Days();
      const dailyVolume = last7Days.map(day => {
        // Count items matching this day
        const tCount = ticketsData.filter(i => (i.date || "").startsWith(day)).length;
        const bCount = busData.filter(i => (i.date || "").startsWith(day)).length;
        const pCount = parkingData.filter(i => (i.timeIn || "").startsWith(day)).length;
        
        return {
          name: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
          tickets: tCount,
          bus: bCount,
          parking: pCount,
          total: tCount + bCount + pCount
        };
      });
      
      setAnalyticsData(dailyVolume);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    console.log("Refreshing dashboard data...");
    fetchDashboardData();
  };

  // Map state to the card format
  const liveStats = [
    { 
      label: "Tickets", 
      value: loading ? "..." : stats.tickets.toLocaleString(), 
      change: "+12%", // You can calculate this if you fetch historical data
      subtitle: "Total Issued", 
      color: "red" 
    },
    { 
      label: "Bus Trips", 
      value: loading ? "..." : stats.bus.toLocaleString(), 
      change: "+8%", 
      subtitle: "Total Trips", 
      color: "yellow" 
    },
    { 
      label: "Tenants", 
      value: loading ? "..." : stats.tenants.toLocaleString(), 
      change: "+5%", 
      subtitle: "Active Leases", 
      color: "green" 
    },
    { 
      label: "Parking", 
      value: loading ? "..." : stats.parking.toLocaleString(), 
      change: "+9%", 
      subtitle: "Total Entries", 
      color: "blue" 
    },
  ];
  
  return (
    <Layout title="Dashboard">
      <div className="px-4 pt-0 lg:px-2 lg:pt-0 space-y-8">
        <DashboardToolbar 
          onRefresh={handleRefresh}
          onDownload={() => alert("Downloading CSV...")}
          onFilterChange={({ date, view }) => {
             console.log(`Fetching data for ${view} starting at ${date}`);
             // Future implementation: Pass date params to fetchDashboardData(date)
          }}
        />
        
        <StatCards statsData={liveStats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Passing dynamic data props to child components */}
          <OperationsAnalytics data={analyticsData} loading={loading} />
          <SummaryDonut data={donutData} loading={loading} />
        </div>
        
        {/* Now displays Recent Reports */}
        <RecentActivity data={recentActivity} loading={loading} />
      </div>
    </Layout>
  );
};

export default Dashboard;