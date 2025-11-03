import React, { useState } from 'react';
import { Menu, Home, Bus, Lock, Ticket, Store, CircleParking, SearchCheck, Headphones, Bell, ChevronDown, TrendingUp, LogOut, Settings, BarChart3, Users, FileText, Activity,  ArrowLeftFromLine, CheckCircle, AlertCircle, UserPlus, CreditCard, FileCheck, Download, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart } from 'recharts';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState('home');

  const chartData = [
    { month: 'Jan', tickets: 210, bus: 250, tenants: 260, parking: 220, lostFound: 240, revenue: 48000 },
    { month: 'Feb', tickets: 230, bus: 260, tenants: 150, parking: 180, lostFound: 210, revenue: 52000 },
    { month: 'Mar', tickets: 220, bus: 270, tenants: 250, parking: 150, lostFound: 180, revenue: 45000 },
    { month: 'Apr', tickets: 280, bus: 290, tenants: 200, parking: 200, lostFound: 220, revenue: 58000 },
    { month: 'May', tickets: 260, bus: 280, tenants: 180, parking: 190, lostFound: 200, revenue: 54000 },
    { month: 'Jun', tickets: 290, bus: 300, tenants: 220, parking: 210, lostFound: 230, revenue: 62000 },
    { month: 'Jul', tickets: 270, bus: 290, tenants: 190, parking: 180, lostFound: 210, revenue: 56000 },
    { month: 'Aug', tickets: 300, bus: 320, tenants: 240, parking: 220, lostFound: 250, revenue: 68000 },
    { month: 'Sep', tickets: 280, bus: 310, tenants: 210, parking: 200, lostFound: 230, revenue: 60000 },
    { month: 'Oct', tickets: 310, bus: 330, tenants: 250, parking: 230, lostFound: 260, revenue: 72000 },
    { month: 'Nov', tickets: 290, bus: 320, tenants: 220, parking: 210, lostFound: 240, revenue: 64000 },
    { month: 'Dec', tickets: 320, bus: 350, tenants: 260, parking: 240, lostFound: 270, revenue: 75000 },
  ];

  const options = ['Weekly', 'Monthly', 'Yearly'];

  const activities = [
    { 
      id: 1, 
      message: 'New uploaded Bus trip schedule', 
      time: '5 mins ago',
      icon: FileCheck,
      type: 'success',
      user: 'Inspector Lee'
    },
    { 
      id: 2, 
      message: 'Parking ticket issued for vehicle XYZ-1234', 
      time: '12 mins ago',
      icon: Ticket,
      type: 'warning',
      user: 'Parking Attendant'
    },
    { 
      id: 3, 
      message: 'Monthly payment received - Slot #1', 
      time: '28 mins ago',
      icon: CreditCard,
      type: 'success',
      user: 'Admin'
    },
    { 
      id: 4, 
      message: 'New uploaded Terminal Fee report', 
      time: '5 mins ago',
      icon: FileCheck,
      type: 'success',
      user: 'Terminal Manager'
    },
  ];

  const stats = [
    {
      label: 'Tickets',
      value: '5,768',
      change: '+10%',
      subtitle: 'From last month',
      color: 'red'
    },

    {
      label: 'Bus',
      value: '5,768',
      change: '+10%',
      subtitle: 'From last month',
      color: 'yellow'
    },
    {
      label: 'Tenants/Lease',
      value: '5,768',
      change: '+10%',
      subtitle: 'From last month',
      color: 'green'
    },
    {
      label: 'Parking',
      value: '5,768',
      change: '+10%',
      subtitle: 'From last month',
      color: 'blue'
    },
  ];

  const colorMap = {
  red: {
    bgLight: "bg-red-100",
    bgMedium: "bg-red-200",
    bgStrong: "bg-red-300",
    bgCircle: "bg-red-400",
    text: "text-red-700",
  },
  yellow: {
    bgLight: "bg-yellow-100",
    bgMedium: "bg-yellow-200",
    bgStrong: "bg-yellow-300",
    bgCircle: "bg-yellow-400",
    text: "text-yellow-700",
  },
  green: {
    bgLight: "bg-green-100",
    bgMedium: "bg-green-200",
    bgStrong: "bg-green-300",
    bgCircle: "bg-green-400",
    text: "text-green-700",
  },
  blue: {
    bgLight: "bg-blue-100",
    bgMedium: "bg-blue-200",
    bgStrong: "bg-blue-300",
    bgCircle: "bg-blue-400",
    text: "text-blue-700",
  },
};


  const menuItems = [
    { id: 'home', icon: Home, label: 'Dashboard' },
    { id: 'Bus Trips', icon: Bus, label: 'Bus Trips' },
    { id: 'tickets', icon: Ticket, label: 'Tickets' },
    { id: 'Lease', icon: Store, label: 'Tenants/Lease' },
    { id: 'parking', icon: CircleParking, label: 'Parking' },
    { id: 'Lost and Found', icon: SearchCheck, label: 'Lost and Found' },
    { id: 'reports', icon: FileText, label: 'Reports' },
   
  ];

  const bottomMenuItems = [
    { id: 'settings', icon: Settings, label: 'Settings' },
   
  ];

  const circumference = 2 * Math.PI * 80;
  const donutData = [
    { label: 'Tickets', value: '25%', color: 'red', percent: 25 },
    { label: 'Bus', value: '25%', color: 'orange', percent: 25 },
    { label: 'Tents/Lease', value: '20%', color: 'green', percent: 20 },
    { label: 'Parking', value: '30%', color: '#3b82f6', percent: 30 },
    { label: 'Lost and Found', value: '25%', color: 'yellow', percent: 25 },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div 
        className={`hidden lg:flex lg:flex-col bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ${
          sidebarExpanded ? 'lg:w-64' : 'lg:w-20'
        }`}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <Menu className="text-white" size={24} />
            </button>
            {sidebarExpanded && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent whitespace-nowrap">IBT</h1>
                <p className="text-xs text-gray-500 whitespace-nowrap">Management System</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center ${sidebarExpanded ? 'space-x-3' : 'justify-center'} px-4 py-3 rounded-xl transition-all duration-200 group ${
                  activeMenu === item.id
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={!sidebarExpanded ? item.label : ''}
              >
                <item.icon 
                  size={20} 
                  className={activeMenu === item.id ? 'text-emerald-600' : 'text-gray-500 group-hover:text-gray-700'}
                />
                {sidebarExpanded && (
                  <>
                    <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                    {activeMenu === item.id && (
                      <div className="ml-auto w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 p-3 space-y-1">
          {bottomMenuItems.map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center ${sidebarExpanded ? 'space-x-3' : 'justify-center'} px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group`}
              title={!sidebarExpanded ? item.label : ''}
            >
              <item.icon size={20} className="text-gray-500 group-hover:text-gray-700" />
              {sidebarExpanded && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
          
          {sidebarExpanded && (
            <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">Admin User</p>
                  <p className="text-xs text-gray-500 truncate">admin@building.com</p>
                </div>
                <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-all">
                  <LogOut size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
          )}
          {!sidebarExpanded && (
            <div className="mt-4 flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                A
              </div>
            </div>
          )}
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <div className="w-80 h-full bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                  <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                      <ArrowLeftFromLine  size={24} className="text-gray-600" />
                  </button>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">IBT</h1>
                  <p className="text-xs text-gray-500">Management System</p>
                </div>
              </div>                          
            </div>

            <div className="overflow-y-auto py-4 px-3" style={{height: 'calc(100vh - 200px)'}}>
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveMenu(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeMenu === item.id
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon size={20} className={activeMenu === item.id ? 'text-emerald-600' : 'text-gray-500'} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-1">
                {bottomMenuItems.map((item) => (
                  <button
                    key={item.id}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-200"
                  >
                    <item.icon size={20} className="text-gray-500" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 p-4">
              <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                    A
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">Admin User</p>
                    <p className="text-xs text-gray-500 truncate">admin@building.com</p>
                  </div>
                  <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-all">
                    <LogOut size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <div className="bg-white/90 border-b border-gray-200 shadow-sm sticky top-0 z-40 backdrop-blur-lg">
          <div className="p-4 lg:px-8 lg:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-all">
                  <Menu size={24} className="text-gray-700" />
                </button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Dashboard
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button className="hidden sm:flex p-2.5 hover:bg-gray-100 rounded-xl transition-all relative">
                  <Bell size={22} className="text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="hidden md:flex items-center space-x-3 bg-gray-100 rounded-xl px-4 py-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    A
                  </div>
                  <span className="text-sm font-medium text-gray-700">Admin</span>
                  <ChevronDown size={18} className="text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {stats.map((stat, idx) => {
          const color = colorMap[stat.color];
          return (
         <div
           key={idx}
           className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
        <div
          className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${color.bgMedium} ${color.bgStrong} rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-125 transition-transform duration-700`}></div>
        <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
              <p className="text-gray-600 text-base font-semibold mb-3">
                {stat.label}
              </p>
              <p className="text-6xl font-extrabold text-gray-900 mb-4">
                {stat.value}
              </p>
            </div>
            <div className={`w-6 h-6 ${color.bgCircle} rounded-full shadow-lg`}></div>
          </div>
          <div className="flex items-center space-x-3">
            <span
              className={`px-3 py-1.5 ${color.bgLight} ${color.text} text-sm font-bold rounded-lg`}>
              {stat.change}
            </span>
            <span className="text-gray-500 text-sm font-medium">{stat.subtitle}</span>
          </div>
          </div>
          </div>
          );
          })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-xl border-2 border-emerald-400 hover:shadow-2xl transition-all duration-500">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Operations Analytics</h3>
                  <p className="text-sm text-gray-500 mt-1">Year-over-year performance trends</p>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    className="border border-gray-300 text-gray-700 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    defaultValue="week">
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-all" title="Refresh">
                    <RefreshCw size={18} className="text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-all" title="Download">
                    <Download size={18} className="text-gray-600" />
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={500}>
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorParking" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLostFound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }} 
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }} 
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '16px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      padding: '12px 16px'
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: '8px', color: '#111827' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '24px' }}
                    iconType="circle"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tickets" 
                    name="Tickets"
                    stroke="red" 
                    strokeWidth={3} 
                    fill="url(#colorTickets)"
                    dot={{ r: 4, fill: 'red', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: 'red', strokeWidth: 3, stroke: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="bus" 
                    name="Bus"
                    stroke="orange" 
                    strokeWidth={3} 
                    fill="url(#colorBus)"
                    dot={{ r: 4, fill: 'orange', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: 'orange', strokeWidth: 3, stroke: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tenants" 
                    name="Tenants"
                    stroke="green" 
                    strokeWidth={3} 
                    fill="url(#colorTenants)"
                    dot={{ r: 4, fill: 'green', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: 'green', strokeWidth: 3, stroke: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="parking" 
                    name="Parking"
                    stroke="#22d3ee" 
                    strokeWidth={3} 
                    fill="url(#colorParking)"
                    dot={{ r: 4, fill: '#22d3ee', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#22d3ee', strokeWidth: 3, stroke: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="lostFound" 
                    name="Lost & Found"
                    stroke="yellow" 
                    strokeWidth={3} 
                    fill="url(#colorLostFound)"
                    dot={{ r: 4, fill: 'yellow', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: 'yellow', strokeWidth: 3, stroke: '#fff' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-200">
                {[
                 { label: 'Tickets', value: '3,380', color: 'red', trend: '+12%' },
                 { label: 'Bus', value: '1,200', color: 'orange', trend: '+5%' },
                 { label: 'Tenants', value: '2,630', color: 'green', trend: '+8%' },
                 { label: 'Parking', value: '2,390', color: 'cyan', trend: '+15%' },
                 { label: 'Lost & Found', value: '2,730', color: 'yellow', trend: '+10%' }
                ].map((stat, idx) => (
                <div key={idx} className="text-center flex flex-col items-center justify-center">
                  <p className="text-xs text-gray-500 font-medium mb-1 break-words text-center">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">{stat.trend}</p>
                </div>
                ))}
              </div>

            </div>

            <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),_transparent_50%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(0,0,0,0.05),_transparent_50%)]"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-white text-2xl font-bold flex items-center">
                    Summary
                  </h3>
                  <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                    <span className="text-white text-xs font-bold">Live Data</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {donutData.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="text-white bg-white/15 backdrop-blur-md rounded-2xl p-4 hover:bg-white/25 transition-all cursor-pointer border border-white/20 hover:scale-105 transform duration-300"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full shadow-lg" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <p className="text-xs font-semibold opacity-90">{item.label}</p>
                      </div>
                      <p className="font-extrabold text-2xl">{item.value}</p>
                      <div className="w-full bg-white/20 h-1 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-1000"
                          style={{ width: item.value }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-col items-center mt-8">
                  <div className="relative">
                    <svg className="w-56 h-56 transform -rotate-90 drop-shadow-2xl">
                      <circle
                        cx="112"
                        cy="112"
                        r="85"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="32"
                      />
                
                      {donutData.map((segment, idx) => {
                        const offset = donutData.slice(0, idx).reduce((acc, s) => acc + s.percent, 0);
                        const dashArray = `${(segment.percent / 100) * circumference} ${circumference}`;
                        const dashOffset = -((offset / 100) * circumference);
                        
                        return (
                          <circle
                            key={idx}
                            cx="112"
                            cy="112"
                            r="85"
                            fill="none"
                            stroke={segment.color}
                            strokeWidth="32"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            className="transition-all duration-500 hover:opacity-90 cursor-pointer"
                            style={{
                              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))'
                            }}
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center bg-white rounded-full w-40 h-40 flex flex-col items-center justify-center shadow-2xl border-4 border-white/50">
                        <p className="text-6xl font-extrabold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">50%</p>
                        <p className="text-xs text-gray-500 font-bold mt-1">Overall</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 px-8 py-3 bg-white/25 backdrop-blur-md rounded-2xl shadow-xl border border-white/30">
                    <p className="text-white text-base font-bold">Distribution Overview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Recent Activity</h2>
              <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-all">View all</button>
            </div>
            <div className="space-y-3">
              {activities.map((activity, idx) => {
                const typeColors = {
                  success: 'from-emerald-400 to-teal-400',
                  warning: 'from-yellow-400 to-orange-400',
                  alert: 'from-red-400 to-pink-400'
                };
                
                return (
                  <div 
                    key={activity.id} 
                    className="flex items-center justify-between py-5 px-6 bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:border-emerald-300 rounded-2xl hover:shadow-md transition-all duration-300 cursor-pointer group"
                    style={{ opacity: 0.4 + (idx * 0.15) }}
                  >
                    <div className="flex items-center space-x-5 flex-1">
                      <div className={`w-14 h-14 bg-gradient-to-br ${typeColors[activity.type]} rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <activity.icon className="text-white" size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-semibold text-base mb-1">{activity.message}</p>
                        <p className="text-gray-500 text-sm">by {activity.user}</p>
                      </div>
                    </div>
                    <span className="text-gray-500 text-sm font-medium ml-4">{activity.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;