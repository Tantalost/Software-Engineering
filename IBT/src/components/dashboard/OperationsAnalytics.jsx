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
    { label: "Parking", value: "2,390", color: "#22d3ee", trend: "+15%" },
    { label: "Lost & Found", value: "2,730", color: "yellow", trend: "+10%" },
  ];

  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-5 mt-6">
        {payload.map((entry, index) => (
          <li
            key={`item-${index}`}
            className="flex items-center gap-2"
            style={{ fontWeight: 600, fontSize: "13px", color: "black" }}
          >
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: entry.color,
              }}
            ></span>
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };

  const renderCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="rounded-xl shadow-lg border border-gray-200 bg-white p-4"
          style={{ minWidth: "160px" }}
        >
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
              <span className="text-sm text-gray-900 font-semibold">
                {entry.name}: <span className="font-bold">{entry.value}</span>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Operations Analytics</h3>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }} />
          <YAxis tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }} />
          <Tooltip content={renderCustomTooltip} />
          <Legend content={renderCustomLegend} />

          <Area type="monotone" dataKey="tickets" stroke="red" strokeWidth={3} fill="transparent" />
          <Area type="monotone" dataKey="bus" stroke="orange" strokeWidth={3} fill="transparent" />
          <Area type="monotone" dataKey="tenants" stroke="green" strokeWidth={3} fill="transparent" />
          <Area type="monotone" dataKey="parking" stroke="#22d3ee" strokeWidth={3} fill="transparent" />
          <Area type="monotone" dataKey="lostFound" stroke="yellow" strokeWidth={3} fill="transparent" />
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
