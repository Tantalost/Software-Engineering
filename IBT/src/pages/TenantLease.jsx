import React, { useState } from 'react';
import { Menu, Home, Ticket, Plus, Bell,  Bus, ChevronDown,SearchCheck, LogOut, Settings, FileText,  ArrowLeftFromLine,  Search, Store, CircleParking, Filter, Calendar, Upload, MoreVertical, Edit2, Trash2, Eye } from 'lucide-react';

const TenantManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Lease');
  const [activeTab, setActiveTab] = useState('permanent');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  const slots = [
    { id: 1, slotNo: 1, referenceNo: 'PKG2024001', name: 'Sarah Johnson', email: 'sarah.johnson@gmail.com', contact: '09171234567', status: 'Paid', type: 'permanent' },
    { id: 2, slotNo: 2, referenceNo: 'PKG2024002', name: 'Michael Chen', email: 'michael.chen@gmail.com', contact: '09182345678', status: 'Paid', type: 'permanent' },
    { id: 3, slotNo: 3, referenceNo: 'PKG2024003', name: 'Emma Williams', email: 'emma.williams@gmail.com', contact: '09193456789', status: 'Pending', type: 'permanent' },
    { id: 4, slotNo: 4, referenceNo: 'PKG2024004', name: 'James Rodriguez', email: 'james.rod@gmail.com', contact: '09204567890', status: 'Paid', type: 'permanent' },
    { id: 5, slotNo: 5, referenceNo: 'PKG2024005', name: 'Olivia Martinez', email: 'olivia.martinez@gmail.com', contact: '09215678901', status: 'Paid', type: 'permanent' },
    { id: 6, slotNo: 6, referenceNo: 'PKG2024006', name: 'David Thompson', email: 'david.thompson@gmail.com', contact: '09226789012', status: 'Overdue', type: 'permanent' },
    { id: 7, slotNo: 7, referenceNo: 'PKG2024007', name: 'Sophia Garcia', email: 'sophia.garcia@gmail.com', contact: '09237890123', status: 'Paid', type: 'night' },
    { id: 8, slotNo: 8, referenceNo: 'PKG2024008', name: 'Daniel Lee', email: 'daniel.lee@gmail.com', contact: '09248901234', status: 'Paid', type: 'night' },
    { id: 9, slotNo: 9, referenceNo: 'PKG2024009', name: 'Isabella Brown', email: 'isabella.brown@gmail.com', contact: '09259012345', status: 'Paid', type: 'permanent' },
    { id: 10, slotNo: 10, referenceNo: 'PKG2024010', name: 'William Davis', email: 'william.davis@gmail.com', contact: '09260123456', status: 'Pending', type: 'permanent' },
    { id: 11, slotNo: 11, referenceNo: 'PKG2024011', name: 'Mia Anderson', email: 'mia.anderson@gmail.com', contact: '09271234567', status: 'Paid', type: 'night' },
    { id: 12, slotNo: 12, referenceNo: 'PKG2024012', name: 'Alexander Wilson', email: 'alex.wilson@gmail.com', contact: '09282345678', status: 'Paid', type: 'permanent' },
  ];

  const filteredSlots = slots.filter(slot => {
    const matchesSearch = slot.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    slot.referenceNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'permanent' ? slot.type === 'permanent' : slot.type === 'night';
    return matchesSearch && matchesTab;
  });

  const totalSlots = 60;
  const availableSlots = 40;
  const nonAvailableSlots = 20;

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

  const getStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

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
        <div className="bg-white/90 border-b border-gray-200 shadow-sm sticky top-0 z-40 backdrop-blur-lg">
          <div className="p-4 lg:px-8 lg:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-all">
                  <Menu size={24} className="text-gray-700" />
                </button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                   Tenants/Lease Management
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-125 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-600 text-base font-semibold mb-3">Total Slots</p>
                    <p className="text-6xl font-extrabold text-gray-900 mb-4">{totalSlots}</p>
                  </div>
                  <div className="w-6 h-6 bg-emerald-400 rounded-full shadow-lg"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-lg">10%</span>
                  <span className="text-gray-500 text-sm font-medium">Today</span>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-200 to-amber-200 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-125 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-600 text-base font-semibold mb-3">Available Slots</p>
                    <p className="text-6xl font-extrabold text-gray-900 mb-4">{availableSlots}</p>
                  </div>
                  <div className="w-6 h-6 bg-yellow-400 rounded-full shadow-lg"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-sm font-bold rounded-lg">10%</span>
                  <span className="text-gray-500 text-sm font-medium">Today</span>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-200 to-rose-200 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-125 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-600 text-base font-semibold mb-3">Non-Available Slots</p>
                    <p className="text-6xl font-extrabold text-gray-900 mb-4">{nonAvailableSlots}</p>
                  </div>
                  <div className="w-6 h-6 bg-red-400 rounded-full shadow-lg"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-bold rounded-lg">10%</span>
                  <span className="text-gray-500 text-sm font-medium">Today</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search Reference No..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="flex items-center space-x-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all">
                  <Filter size={20} className="text-gray-600" />
                  <span className="text-gray-700 font-medium">Filter</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all">
                  <Calendar size={20} className="text-gray-600" />
                  <span className="text-gray-700 font-medium">Date</span>
                </button>
                <div className="flex bg-emerald-100 rounded-xl p-1 border-2 border-emerald-200">
                  <button 
                    onClick={() => setActiveTab('permanent')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      activeTab === 'permanent' 
                        ? 'bg-white text-emerald-700 shadow-md' 
                        : 'text-emerald-600 hover:text-emerald-700'
                    }`}
                  >
                    Permanent
                  </button>
                  <button 
                    onClick={() => setActiveTab('night')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      activeTab === 'night' 
                        ? 'bg-white text-emerald-700 shadow-md' 
                        : 'text-emerald-600 hover:text-emerald-700'
                    }`}
                  >
                    Night Market
                  </button>
                </div>
                <button className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <Upload size={20} />
                  <span className="font-medium">Export</span>
                </button>
                 <button className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <Plus size={20} />
                  <span className="font-medium">New Slot</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100">
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Slot No.</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Reference No.</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Contact No.</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-5 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSlots.map((slot, index) => (
                    <tr key={slot.id} className={`hover:bg-gradient-to-r hover:from-gray-50 hover:to-emerald-50 transition-all duration-200 group ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-5">
                        <span className="font-semibold text-gray-900">{slot.slotNo}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-medium text-gray-700">{slot.referenceNo}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-medium text-gray-800">{slot.name}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-gray-600 text-sm">{slot.email}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-gray-700 font-medium">{slot.contact}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-4 py-2 rounded-full text-xs font-bold ${getStatusColor(slot.status)}`}>
                          {slot.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center">
                          <div className="relative overflow-visible">
                            <button 
                              onClick={() => setActionMenuOpen(actionMenuOpen === slot.id ? null : slot.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                            >
                              <MoreVertical size={18} className="text-gray-600" />
                            </button>
                            
                            {actionMenuOpen === slot.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setActionMenuOpen(null)}
                                ></div>
                                <div className={`absolute right-0 ${slot.id > filteredSlots.length - 2 ? 'bottom-full mb-2' : 'mt-2'} w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200`}>
                                  <button 
                                    className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-blue-50 transition-all group/item"
                                    onClick={() => {
                                      alert('View details for ' + slot.name);
                                      setActionMenuOpen(null);
                                    }}
                                  >
                                    <Eye size={18} className="text-gray-500 group-hover/item:text-blue-600" />
                                    <span className="text-sm font-medium text-gray-700 group-hover/item:text-blue-600">View Details</span>
                                  </button>
                                  <button 
                                    className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-emerald-50 transition-all group/item"
                                    onClick={() => {
                                      alert('Edit slot #' + slot.slotNo);
                                      setActionMenuOpen(null);
                                    }}
                                  >
                                    <Edit2 size={18} className="text-gray-500 group-hover/item:text-emerald-600" />
                                    <span className="text-sm font-medium text-gray-700 group-hover/item:text-emerald-600">Edit Slot</span>
                                  </button>
                                  <button 
                                    className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-red-50 transition-all group/item"
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete slot #' + slot.slotNo + '?')) {
                                        alert('Deleted slot #' + slot.slotNo);
                                      }
                                      setActionMenuOpen(null);
                                    }}
                                  >
                                    <Trash2 size={18} className="text-gray-500 group-hover/item:text-red-600" />
                                    <span className="text-sm font-medium text-gray-700 group-hover/item:text-red-600">Delete Slot</span>
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

          <div className="lg:hidden mt-6 space-y-4">
            {filteredSlots.map((slot) => (
              <div key={slot.id} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Slot No.</p>
                    <p className="text-2xl font-bold text-gray-900">#{slot.slotNo}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(slot.status)}`}>
                      {slot.status}
                    </span>
                    <div className="relative">
                      <button 
                        onClick={() => setActionMenuOpen(actionMenuOpen === slot.id ? null : slot.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <MoreVertical size={18} className="text-gray-600" />
                      </button>
                      
                      {actionMenuOpen === slot.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setActionMenuOpen(null)}
                          ></div>
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-20">
                            <button 
                              className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-blue-50 transition-all group/item"
                              onClick={() => {
                                alert('View details for ' + slot.name);
                                setActionMenuOpen(null);
                              }}
                            >
                              <Eye size={18} className="text-gray-500 group-hover/item:text-blue-600" />
                              <span className="text-sm font-medium text-gray-700 group-hover/item:text-blue-600">View Details</span>
                            </button>
                            <button 
                              className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-emerald-50 transition-all group/item"
                              onClick={() => {
                                alert('Edit slot #' + slot.slotNo);
                                setActionMenuOpen(null);
                              }}
                            >
                              <Edit2 size={18} className="text-gray-500 group-hover/item:text-emerald-600" />
                              <span className="text-sm font-medium text-gray-700 group-hover/item:text-emerald-600">Edit Slot</span>
                            </button>
                            <button 
                              className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-red-50 transition-all group/item"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete slot #' + slot.slotNo + '?')) {
                                  alert('Deleted slot #' + slot.slotNo);
                                }
                                setActionMenuOpen(null);
                              }}
                            >
                              <Trash2 size={18} className="text-gray-500 group-hover/item:text-red-600" />
                              <span className="text-sm font-medium text-gray-700 group-hover/item:text-red-600">Delete Slot</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Reference No.</p>
                    <p className="text-sm font-semibold text-gray-900">{slot.referenceNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Name</p>
                    <p className="text-base font-semibold text-gray-800">{slot.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Email</p>
                      <p className="text-sm text-gray-700 truncate">{slot.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Contact</p>
                      <p className="text-sm font-medium text-gray-800">{slot.contact}</p>
                    </div>
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

export default TenantManagement;