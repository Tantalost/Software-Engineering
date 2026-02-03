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
} from "recharts";
import { PhilippinePeso, BarChart3, Layers } from "lucide-react";

const OperationsAnalytics = ({ data }) => {
  const [viewMode, setViewMode] = useState("revenue");
  // New state to manage the separate view for each operation
  const [focusModule, setFocusModule] = useState("all");

  // Centralized configuration for each operation module
  const modules = [
    { id: "all", label: "All Operations", color: "#6366f1", icon: <Layers size={14} /> },
    { id: "tickets", label: "Tickets", color: "#EF4444", key: "tickets" },
    { id: "bus", label: "Bus Trips", color: "#EAB308", key: "bus" },
    { id: "tenants", label: "Tenants", color: "#22C55E", key: "tenants" },
    { id: "parking", label: "Parking", color: "#3B82F6", key: "parking" },
  ];

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
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></span>
              <span className="text-sm text-gray-600 font-medium">
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
      <div className="flex flex-col gap-6 mb-8">
        {/* Header and Revenue/Volume Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Operations Analytics</h3>
            <p className="text-sm text-gray-500">
              {focusModule === 'all' ? 'Combined view' : `${focusModule.charAt(0).toUpperCase() + focusModule.slice(1)} view`} — {viewMode}
            </p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("revenue")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                viewMode === "revenue" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <PhilippinePeso size={16} /> Revenue
            </button>
            <button
              onClick={() => setViewMode("volume")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                viewMode === "volume" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <BarChart3 size={16} /> Volume
            </button>
          </div>
        </div>

        {/* Module Selection Pills: This is the new part for separate views */}
        <div className="flex flex-wrap gap-2">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => setFocusModule(m.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                focusModule === m.id 
                ? "bg-gray-900 text-white border-gray-900 shadow-md" 
                : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600"
              }`}
            >
              {m.icon && m.icon}
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

          {/* Dynamic rendering of Areas based on focusModule */}
          {modules.filter(m => m.id !== 'all').map((m) => {
            const isVisible = focusModule === 'all' || focusModule === m.id;
            const dataKey = `${m.key}${viewMode === 'revenue' ? 'Revenue' : 'Volume'}`;
            
            return (
              <Area 
                key={m.id}
                type="monotone" 
                name={m.label}
                dataKey={dataKey} 
                stroke={m.color} 
                fill={m.color}
                fillOpacity={isVisible ? 0.1 : 0} // Hide fill if not focused
                strokeWidth={isVisible ? 3 : 0}    // Hide stroke if not focused
                dot={isVisible ? { r: 4, fill: m.color } : false}
                activeDot={isVisible}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OperationsAnalytics;