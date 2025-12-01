import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  Line, 
} from "recharts";
import { PhilippinePeso, BarChart3 } from "lucide-react";

const OperationsAnalytics = ({ data }) => {
  const [viewMode, setViewMode] = useState("revenue"); // 'revenue' or 'volume'

  // 1. Add 'tenants' to keys
  const keys = {
    tickets: viewMode === "revenue" ? "ticketsRevenue" : "ticketsVolume",
    bus: viewMode === "revenue" ? "busRevenue" : "busVolume",
    parking: viewMode === "revenue" ? "parkingRevenue" : "parkingVolume",
    tenants: viewMode === "revenue" ? "tenantsRevenue" : "tenantsVolume",
  };

  const formatValue = (value) => {
    if (viewMode === "revenue") {
      return `₱${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  const renderCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl shadow-lg border border-gray-200 bg-white p-4" style={{ minWidth: "180px" }}>
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={`tooltip-${index}`} className="flex items-center gap-2 mb-1">
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: entry.color,
                }}
              ></span>
              <span className="text-sm text-gray-600 font-medium capitalize">
                {entry.name}: 
              </span>
              <span className="text-sm font-bold text-gray-900 ml-auto">
                {formatValue(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-xl border-2 border-emerald-400 hover:shadow-2xl transition-all duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Operations Analytics</h3>
          <p className="text-sm text-gray-500">
            Showing {viewMode === "revenue" ? "total earnings" : "transaction volume"} per day
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("revenue")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              viewMode === "revenue"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <PhilippinePeso size={16} />
            Revenue
          </button>
          <button
            onClick={() => setViewMode("volume")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              viewMode === "volume"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <BarChart3 size={16} />
            Volume
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }} 
            axisLine={false} tickLine={false} dy={10}
          />
          <YAxis 
            tickFormatter={(val) => viewMode === 'revenue' ? `₱${val/1000}k` : val}
            tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }} 
            axisLine={false} tickLine={false} dx={-10}
          />
          <Tooltip content={renderCustomTooltip} cursor={{ fill: 'transparent' }} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>

          {/* Tickets (Red Area) */}
          <Area 
            type="monotone" 
            name="Tickets"
            dataKey={keys.tickets} 
            stroke="#EF4444" 
            fill="url(#colorRevenue)" 
            fillOpacity={1}
            strokeWidth={3} 
          />
          
          {/* Tenants (Green Area) - ADDED THIS */}
          <Area 
            type="monotone" 
            name="Tenants"
            dataKey={keys.tenants} 
            stroke="#22C55E" 
            fill="url(#colorTenants)"
            fillOpacity={1}
            strokeWidth={3} 
          />

          {/* Bus (Yellow Line) */}
          <Area 
            type="monotone" 
            name="Bus Trips"
            dataKey={keys.bus} 
            stroke="#EAB308" 
            strokeWidth={3} 
            fill="transparent"
          />
          
          {/* Parking (Blue Line) */}
          <Area 
            type="monotone" 
            name="Parking"
            dataKey={keys.parking} 
            stroke="#3B82F6" 
            strokeWidth={3} 
            fill="transparent"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OperationsAnalytics;