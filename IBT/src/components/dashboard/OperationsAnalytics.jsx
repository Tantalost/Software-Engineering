import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
} from "recharts";
import { Download, RefreshCw } from "lucide-react";

const OperationsAnalytics = () => {
  const chartData = [
    { month: "Jan", tickets: 210, bus: 250, tenants: 260, parking: 220, lostFound: 240 },
    { month: "Feb", tickets: 230, bus: 260, tenants: 150, parking: 180, lostFound: 210 },
    { month: "Mar", tickets: 220, bus: 270, tenants: 250, parking: 150, lostFound: 180 },
    { month: "Apr", tickets: 280, bus: 290, tenants: 200, parking: 200, lostFound: 220 },
    { month: "May", tickets: 260, bus: 280, tenants: 180, parking: 190, lostFound: 200 },
    { month: "Jun", tickets: 290, bus: 300, tenants: 220, parking: 210, lostFound: 230 },
    { month: "Jul", tickets: 270, bus: 290, tenants: 190, parking: 180, lostFound: 210 },
    { month: "Aug", tickets: 300, bus: 320, tenants: 240, parking: 220, lostFound: 250 },
    { month: "Sep", tickets: 280, bus: 310, tenants: 210, parking: 200, lostFound: 230 },
    { month: "Oct", tickets: 310, bus: 330, tenants: 250, parking: 230, lostFound: 260 },
    { month: "Nov", tickets: 290, bus: 320, tenants: 220, parking: 210, lostFound: 240 },
    { month: "Dec", tickets: 320, bus: 350, tenants: 260, parking: 240, lostFound: 270 },
  ];

  const summaryStats = [
    { label: "Tickets", value: "3,380", color: "red", trend: "+12%" },
    { label: "Bus", value: "1,200", color: "orange", trend: "+5%" },
    { label: "Tenants", value: "2,630", color: "green", trend: "+8%" },
    { label: "Parking", value: "2,390", color: "cyan", trend: "+15%" },
    { label: "Lost & Found", value: "2,730", color: "yellow", trend: "+10%" },
  ];

  return (
    <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-xl border-2 border-emerald-400 hover:shadow-2xl transition-all duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Operations Analytics</h3>
        </div>
        <div className="flex items-center space-x-3">
          <select
            className="border border-gray-300 text-gray-700 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all cursor-pointer"
            defaultValue="week"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-all" title="Refresh">
            <RefreshCw size={18} className="text-gray-600 cursor-pointer" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-all" title="Download">
            <Download size={18} className="text-gray-600 cursor-pointer" />
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }} />
          <YAxis tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255,255,255,0.98)",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              boxShadow:
                "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
              padding: "12px 16px",
            }}
          />
          <Legend wrapperStyle={{ paddingTop: "24px" }} iconType="circle" />
          <Area type="monotone" dataKey="tickets" stroke="red" strokeWidth={3} fillOpacity={0.3}  />
          <Area type="monotone" dataKey="bus" stroke="orange" strokeWidth={3} fillOpacity={0.3} />
          <Area type="monotone" dataKey="tenants" stroke="green" strokeWidth={3} fillOpacity={0.3} />
          <Area type="monotone" dataKey="parking" stroke="#22d3ee" strokeWidth={3} fillOpacity={0.3} />
          <Area type="monotone" dataKey="lostFound" stroke="yellow" strokeWidth={3} fillOpacity={0.3} />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-200">
        {summaryStats.map((stat, idx) => (
          <div key={idx} className="text-center flex flex-col items-center justify-center">
            <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">{stat.trend}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperationsAnalytics;
