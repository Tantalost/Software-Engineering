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
import { Layers } from "lucide-react";

const OperationsAnalytics = ({ data }) => {
  
  const [focusModule, setFocusModule] = useState("all");

  
  const modules = [
    { id: "all", label: "All Operations", color: "#6366f1", icon: <Layers size={14} /> },
    { id: "tickets", label: "Tickets", color: "#EF4444", key: "tickets" },
    { id: "bus", label: "Bus Trips", color: "#EAB308", key: "bus" },
    { id: "tenants", label: "Tenants", color: "#22C55E", key: "tenants" },
    { id: "parking", label: "Parking", color: "#3B82F6", key: "parking" },
  ];

  const formatValue = (value) => {
    return `₱${value.toLocaleString()}`;
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
               <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Operations Analytics</h3>
            <p className="text-sm text-gray-500">
              {focusModule === 'all' ? 'Combined view' : `${focusModule.charAt(0).toUpperCase() + focusModule.slice(1)} view`}
            </p>
          </div>
        </div>

        
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
            tickFormatter={(val) => `₱${val/1000}k`}
            tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }} 
            axisLine={false} tickLine={false} dx={-10}
          />
          <Tooltip content={renderCustomTooltip} cursor={{ fill: 'transparent' }} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>

          
          {modules.filter(m => m.id !== 'all').map((m) => {
            const isVisible = focusModule === 'all' || focusModule === m.id;
            const dataKey = `${m.key}Revenue`;
            
            return (
              <Area 
                key={m.id}
                type="monotone" 
                name={m.label}
                dataKey={dataKey} 
                stroke={m.color} 
                fill={m.color}
                fillOpacity={isVisible ? 0.1 : 0}
                strokeWidth={isVisible ? 3 : 0}  
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