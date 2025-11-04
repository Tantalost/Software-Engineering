import React, { useState } from 'react';
import { Menu, Home, Ticket, CircleParking, Store, SearchCheck, Bell, ChevronDown, LogOut, Settings, FileText, Bus, Clock, ArrowLeftFromLine, Search, Calendar, Upload, Eye, Edit, Trash2, Plus } from 'lucide-react';

const BusManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState('routes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('All Companies');

  const busSchedules = [
    { id: 1, templateNo: 'BT-2024-001', route: 'Pagadian', time: '6:00 AM - 12:00 PM', status: 'Active', paymentStatus: 'Paid', capacity: 45, company: 'Dindo' },
    { id: 2, templateNo: 'BT-2024-002', route: 'Dipolog', time: '7:30 AM - 10:00 AM', status: 'Active', paymentStatus: 'Pending', capacity: 45, company: 'Dindo' },
    { id: 3, templateNo: 'BT-2024-003', route: 'Pagadian', time: '8:00 AM - 2:30 PM', status: 'Active', paymentStatus: 'Paid', capacity: 40, company: 'Alga' },
    { id: 4, templateNo: 'BT-2024-004', route: 'Dipolog', time: '9:00 AM - 11:30 AM', status: 'Active', paymentStatus: 'Paid', capacity: 40, company: 'Alga' },
    { id: 5, templateNo: 'BT-2024-005', route: 'Dipolog', time: '10:00 AM - 4:00 PM', status: 'Delayed', paymentStatus: 'Pending', capacity: 45, company: 'Dindo' },
    { id: 6, templateNo: 'BT-2024-006', route: 'Pagadian', time: '7:00 AM - 3:00 PM', status: 'Active', paymentStatus: 'Paid', capacity: 40, company: 'Alga' },
    { id: 7, templateNo: 'BT-2024-007', route: 'Cagayan', time: '1:00 PM - 4:00 PM', status: 'Active', paymentStatus: 'Pending', capacity: 40, company: 'Ceres' },
    { id: 8, templateNo: 'BT-2024-008', route: 'Siocon', time: '5:00 AM - 8:00 AM', status: 'Active', paymentStatus: 'Paid', capacity: 35, company: 'Lizamae' },
    { id: 9, templateNo: 'BT-2024-009', route: 'Bukidnon', time: '8:00 PM - 6:00 AM', status: 'Active', paymentStatus: 'Paid', capacity: 40, company: 'Ceres' },
    { id: 10, templateNo: 'BT-2024-010', route: 'Pagadian', time: '6:30 AM - 4:30 PM', status: 'Active', paymentStatus: 'Pending', capacity: 45, company: 'Dindo' },
  ];

  const filteredSchedules = busSchedules.filter(schedule => 
    (schedule.templateNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
     schedule.route.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedCompany === 'All Companies' || schedule.company === selectedCompany)
  );

  const companies = ['All Companies', 'Alga', 'Ceres', 'Dindo', 'Lizamae'];

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
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700';
      case 'Delayed': return 'bg-red-100 text-red-700';
      case 'Cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch(paymentStatus) {
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
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
                    <ArrowLeftFromLine size={24} className="text-gray-600" />
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
                    Bus Management
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
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search Bus Template No..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="flex items-center space-x-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all">
                  <Calendar size={20} className="text-gray-600" />
                  <span className="text-gray-700 font-medium">Date</span>
                </button>
                
                <div className="relative">
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="appearance-none px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all text-gray-700 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {companies.map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                </div>

                <button className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <Plus size={20} />
                  <span className="font-medium">Add New</span>
                </button>

                <button className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <Upload size={20} />
                  <span className="font-medium">Export</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100">
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Bus Template No.</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Route</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-5 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">Payment Status</th>
                    <th className="px-6 py-5 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSchedules.map((schedule, index) => (
                    <tr key={schedule.id} className={`hover:bg-gradient-to-r hover:from-gray-50 hover:to-emerald-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-5">
                        <span className="font-semibold text-gray-900">{schedule.templateNo}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                          <Bus size={18} className="text-emerald-600" />
                          <span className="font-medium text-gray-800">{schedule.route}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                          <Clock size={18} className="text-gray-500" />
                          <span className="text-gray-700 font-medium">{schedule.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getPaymentStatusColor(schedule.paymentStatus)}`}>
                            {schedule.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            className="p-2 hover:bg-blue-50 rounded-lg transition-all group"
                            title="View Details"
                          >
                            <Eye size={18} className="text-blue-600 group-hover:scale-110 transition-transform" />
                          </button>
                          <button 
                            className="p-2 hover:bg-emerald-50 rounded-lg transition-all group"
                            title="Edit"
                          >
                            <Edit size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                          </button>
                          <button 
                            className="p-2 hover:bg-red-50 rounded-lg transition-all group"
                            title="Delete"
                          >
                            <Trash2 size={18} className="text-red-600 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:hidden mt-6 space-y-4">
            {filteredSchedules.map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Bus Template No.</p>
                    <p className="text-lg font-bold text-gray-900">{schedule.templateNo}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(schedule.status)}`}>
                      {schedule.status}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getPaymentStatusColor(schedule.paymentStatus)}`}>
                      {schedule.paymentStatus}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Route</p>
                    <div className="flex items-center space-x-2">
                      <Bus size={18} className="text-emerald-600" />
                      <p className="text-base font-semibold text-gray-800">{schedule.route}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Schedule Time</p>
                    <div className="flex items-center space-x-2">
                      <Clock size={18} className="text-gray-500" />
                      <p className="text-sm font-medium text-gray-700">{schedule.time}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Company</p>
                      <p className="text-sm font-semibold text-gray-800">{schedule.company}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Capacity</p>
                      <p className="text-sm font-semibold text-gray-800">{schedule.capacity} seats</p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
                    <button 
                      className="p-2.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                      title="View"
                    >
                      <Eye size={18} className="text-blue-600" />
                    </button>
                    <button 
                      className="p-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit size={18} className="text-emerald-600" />
                    </button>
                    <button 
                      className="p-2.5 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
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

export default BusManagement;