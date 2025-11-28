import React from "react";
import Layout from "../components/layout/Layout";
import StatCards from "../components/dashboard/StatCards";
import OperationsAnalytics from "../components/dashboard/OperationsAnalytics";
import SummaryDonut from "../components/dashboard/SummaryDonut";
import RecentActivity from "../components/dashboard/RecentActivity";
import DashboardToolbar from "../components/dashboard/DashboardToolbar";

const Dashboard = () => {
  const liveStats = [
    { label: "Tickets", value: "6,420", change: "+12%", subtitle: "From last month", color: "red" },
    { label: "Bus", value: "5,950", change: "+8%", subtitle: "From last month", color: "yellow" },
    { label: "Tenants/Lease", value: "4,830", change: "+5%", subtitle: "From last month", color: "green" },
    { label: "Parking", value: "7,120", change: "+9%", subtitle: "From last month", color: "blue" },
  ];

  const handleRefresh = () => {
  console.log("Refreshing data...");
};
  
  return (
    <Layout title="Dashboard">
      <div className="px-4 pt-0 lg:px-2 lg:pt-0 space-y-8">
        <DashboardToolbar 
          onRefresh={handleRefresh}
          onDownload={() => alert("Downloading CSV...")}
          onFilterChange={({ date, view }) => {
          console.log(`Fetching data for ${view} starting at ${date}`);
          }}
        />
        <StatCards statsData={liveStats} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <OperationsAnalytics />
          <SummaryDonut />
        </div>
        <RecentActivity />
      </div>
    </Layout>
  );
};

export default Dashboard;