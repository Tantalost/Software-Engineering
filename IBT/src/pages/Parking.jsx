import React, { useState } from 'react';
import { Menu, Home, Lock, Ticket, Bus, MapPin, Headphones, CircleParking,  Calendar, Upload, Search, SearchCheck, Bell, ChevronDown, Download, TrendingUp, Edit2, Trash2, Plus,PhilippinePeso, ArrowLeftFromLine, Eye, Settings, Store, BarChart3, Users, FileText, LogOut, MoreVertical } from 'lucide-react';

const Parking = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [activeMenu, setActiveMenu] = useState('parking');
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  
  const tickets = [
    { id: 1, type: 'Car', price: 30.00, time: '09:30 AM', status: 'active', duration: '2h 15m' },
    { id: 2, type: 'Car', price: 30.00, time: '10:15 AM', status: 'active', duration: '1h 30m' },
    { id: 3, type: 'Car', price: 30.00, time: '08:45 AM', status: 'active', duration: '2h 45m' },
    { id: 4, type: 'Motorcycle', price: 10.00, time: '11:20 AM', status: 'active', duration: '45m' },
    { id: 5, type: 'Motorcycle', price: 10.00, time: '09:00 AM', status: 'active', duration: '2h 30m' },
    { id: 6, type: 'Motorcycle', price: 10.00, time: '10:30 AM', status: 'active', duration: '1h 15m' },
    { id: 7, type: 'Motorcycle', price: 10.00, time: '08:15 AM', status: 'completed', duration: '3h 0m' },
    { id: 8, type: 'Motorcycle', price: 15.00, time: '11:45 AM', status: 'active', duration: '30m' },
    { id: 9, type: 'Car', price: 30.00, time: '07:30 AM', status: 'completed', duration: '4h 15m' },
    { id: 10, type: 'Car', price: 30.00, time: '10:00 AM', status: 'active', duration: '1h 45m' },
  ];

  const motorcycleCount = tickets.filter(t => t.type === 'Motorcycle').length;
  const carCount = tickets.filter(t => t.type === 'Car').length;
  const totalVehicles = tickets.length;
  const totalRevenue = tickets.reduce((sum, t) => sum + t.price, 0);

  const filteredTickets = activeTab === 'all' 
    ? tickets 
    : activeTab === 'cars' 
    ? tickets.filter(t => t.type === 'Car')
    : tickets.filter(t => t.type === 'Motorcycle');

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

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <div 
        className={`hidden lg:flex lg:flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
          sidebarExpanded ? 'lg:w-64' : 'lg:w-20'
        }`}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
            >
              <Menu className="text-white" size={24} />
            </button>
            {sidebarExpanded && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">IBT</h1>
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
            <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">Admin User</p>
                  <p className="text-xs text-gray-500 truncate">admin@gmail.com</p>
                </div>
                <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-all">
                  <LogOut size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
          )}
          {!sidebarExpanded && (
            <div className="mt-4 flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:shadow-lg transition-all">
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
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                    A
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">Admin User</p>
                    <p className="text-xs text-gray-500 truncate">admin@gmail.com</p>
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
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 backdrop-blur-lg bg-opacity-95">
          <div className="p-4 lg:px-8 lg:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-all">
                  <Menu size={24} className="text-gray-700" />
                </button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Parking Management
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button className="hidden sm:flex p-2.5 hover:bg-gray-100 rounded-xl transition-all relative">
                  <Bell size={22} className="text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="hidden md:flex items-center space-x-3 bg-gray-100 rounded-xl px-4 py-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-semibold">
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
            <div className="group bg-gradient-to-br from-white to-red-50 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border border-red-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-red-100 p-3 rounded-2xl">
                    <Ticket className="text-red-600" size={24} />
                  </div>
                  <div className="flex items-center space-x-1 text-green-600 text-sm font-semibold">
                    <TrendingUp size={16} />
                    <span>+8%</span>
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-2">Cars</h3>
                <p className="text-5xl font-extrabold text-gray-900 mb-2">{motorcycleCount}</p>
                <p className="text-gray-400 text-xs">Active today</p>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-white to-blue-50 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-blue-100 p-3 rounded-2xl">
                    <Ticket className="text-blue-600" size={24} />
                  </div>
                  <div className="flex items-center space-x-1 text-green-600 text-sm font-semibold">
                    <TrendingUp size={16} />
                    <span>+12%</span>
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-2">Motorcycles</h3>
                <p className="text-5xl font-extrabold text-gray-900 mb-2">{carCount}</p>
                <p className="text-gray-400 text-xs">Active today</p>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-white to-emerald-50 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border border-emerald-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-emerald-100 p-3 rounded-2xl">
                    <MapPin className="text-emerald-600" size={24} />
                  </div>
                  <div className="flex items-center space-x-1 text-green-600 text-sm font-semibold">
                    <TrendingUp size={16} />
                    <span>+15%</span>
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-2">Total Vehicles</h3>
                <p className="text-5xl font-extrabold text-gray-900 mb-2">{totalVehicles}</p>
                <p className="text-gray-400 text-xs">All time today</p>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16 opacity-10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 text-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-2xl backdrop-blur-sm">
                    <PhilippinePeso className="text-emerald-600" size={24} />
                  </div>
                  <div className="flex items-center space-x-1 text-emerald-100 text-sm font-semibold">
                    <TrendingUp size={16} />
                    <span>+24%</span>
                  </div>
                </div>
                <h3 className="text-emerald-100 text-sm font-medium mb-2">Revenue</h3>
                <p className="text-5xl font-extrabold mb-2">₱{totalRevenue}</p>
                <p className="text-emerald-100 text-xs">Total earnings</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 lg:p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setActiveTab('all')}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === 'all' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Tickets
                </button>
                <button 
                  onClick={() => setActiveTab('cars')}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === 'cars' 
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cars
                </button>
                <button 
                  onClick={() => setActiveTab('motorcycles')}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === 'motorcycles' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Motorcycles
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 lg:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search tickets..." 
                    className="w-full lg:w-75 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              
                <button className="flex items-center space-x-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all">
                  <Calendar size={20} className="text-gray-600" />
                  <span className="text-gray-700 font-medium hidden sm:inline">Date</span>
                </button>
                <button className="flex items-center  px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <Download size={20} />
                  <span className="font-medium"></span>
                </button>
                <button className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <Plus size={20} />
                  <span className="font-medium">New Ticket</span>
                </button>
              </div>
            </div>
          </div>

          <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-visible">
            <div className="overflow-x-auto relative">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-100 to-teal-100">
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Ticket ID</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Vehicle Type</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Entry Time</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-5 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-emerald-50 transition-all duration-200 group">
                      <td className="px-6 py-5">
                        <span className="font-semibold text-gray-900">#{ticket.id.toString().padStart(4, '0')}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            ticket.type === 'Car' 
                              ? 'bg-red-100' 
                              : 'bg-blue-100'
                          }`}>
                            <Ticket className={ticket.type === 'Car' ? 'text-red-600' : 'text-blue-600'} size={20} />
                          </div>
                          <span className="font-medium text-gray-800">{ticket.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-gray-700">{ticket.time}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-gray-700 font-medium">{ticket.duration}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-bold text-emerald-600">₱{ticket.price.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          ticket.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {ticket.status === 'active' ? '● Active' : '● Completed'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center">
                          <div className="relative overflow-visible">
                            <button 
                              onClick={() => setActionMenuOpen(actionMenuOpen === ticket.id ? null : ticket.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                            >
                              <MoreVertical size={18} className="text-gray-600" />
                            </button>
                            
                            {actionMenuOpen === ticket.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setActionMenuOpen(null)}
                                ></div>
                                <div className={`absolute right-0 ${ticket.id > tickets.length - 2 ? 'bottom-full mb-2' : 'mt-2'} w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200`}>
                                  <button 
                                    className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-blue-50 transition-all group/item"
                                    onClick={() => {
                                      alert('View ticket #' + ticket.id);
                                      setActionMenuOpen(null);
                                    }}
                                  >
                                    <Eye size={18} className="text-gray-500 group-hover/item:text-blue-600" />
                                    <span className="text-sm font-medium text-gray-700 group-hover/item:text-blue-600">View Details</span>
                                  </button>
                                  <button 
                                    className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-emerald-50 transition-all group/item"
                                    onClick={() => {
                                      alert('Edit ticket #' + ticket.id);
                                      setActionMenuOpen(null);
                                    }}
                                  >
                                    <Edit2 size={18} className="text-gray-500 group-hover/item:text-emerald-600" />
                                    <span className="text-sm font-medium text-gray-700 group-hover/item:text-emerald-600">Edit Ticket</span>
                                  </button>
                                  <button 
                                    className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-red-50 transition-all group/item"
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete ticket #' + ticket.id + '?')) {
                                        alert('Deleted ticket #' + ticket.id);
                                      }
                                      setActionMenuOpen(null);
                                    }}
                                  >
                                    <Trash2 size={18} className="text-gray-500 group-hover/item:text-red-600" />
                                    <span className="text-sm font-medium text-gray-700 group-hover/item:text-red-600">Delete Ticket</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-4">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      ticket.type === 'Car' 
                        ? 'bg-gradient-to-br from-red-100 to-rose-100' 
                        : 'bg-gradient-to-br from-blue-100 to-blue-100'
                    }`}>
                      <Ticket className={ticket.type === 'Car' ? 'text-red-600' : 'text-blue-600'} size={22} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Ticket No.</p>
                      <p className="text-lg font-bold text-gray-900">#{ticket.id.toString().padStart(4, '0')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      ticket.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ticket.status === 'active' ? '● Active' : '● Completed'}
                    </span>
                    <div className="relative">
                      <button 
                        onClick={() => setActionMenuOpen(actionMenuOpen === ticket.id ? null : ticket.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <MoreVertical size={18} className="text-gray-600" />
                      </button>
                      
                      {actionMenuOpen === ticket.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setActionMenuOpen(null)}
                          ></div>
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-20">
                            <button 
                              className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-blue-50 transition-all group/item"
                              onClick={() => {
                                alert('View ticket #' + ticket.id);
                                setActionMenuOpen(null);
                              }}
                            >
                              <Eye size={18} className="text-gray-500 group-hover/item:text-blue-600" />
                              <span className="text-sm font-medium text-gray-700 group-hover/item:text-blue-600">View Details</span>
                            </button>
                            <button 
                              className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-emerald-50 transition-all group/item"
                              onClick={() => {
                                alert('Edit ticket #' + ticket.id);
                                setActionMenuOpen(null);
                              }}
                            >
                              <Edit2 size={18} className="text-gray-500 group-hover/item:text-emerald-600" />
                              <span className="text-sm font-medium text-gray-700 group-hover/item:text-emerald-600">Edit Ticket</span>
                            </button>
                            <button 
                              className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-red-50 transition-all group/item"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete ticket #' + ticket.id + '?')) {
                                  alert('Deleted ticket #' + ticket.id);
                                }
                                setActionMenuOpen(null);
                              }}
                            >
                              <Trash2 size={18} className="text-gray-500 group-hover/item:text-red-600" />
                              <span className="text-sm font-medium text-gray-700 group-hover/item:text-red-600">Delete Ticket</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Vehicle Type</p>
                    <p className="text-base font-semibold text-gray-800">{ticket.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Entry Time</p>
                    <p className="text-base font-semibold text-gray-800">{ticket.time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Duration</p>
                    <p className="text-base font-semibold text-gray-800">{ticket.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Price</p>
                    <p className="text-xl font-bold text-emerald-600">₱{ticket.price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parking;