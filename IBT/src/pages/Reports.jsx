import React, { useState } from 'react';
import { Menu, Home, Ticket, Bus, Bell, CircleParking, ChevronDown, LogOut, Settings, SearchCheck, Store, FileText, ArrowLeftFromLine, Search, Filter, Plus, Eye, Edit, Trash2, Calendar } from 'lucide-react';

// Sidebar Component
const Sidebar = ({ sidebarExpanded, setSidebarExpanded, activeMenu, setActiveMenu }) => {
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
  );
};

// Mobile Sidebar Component
const MobileSidebar = ({ sidebarOpen, setSidebarOpen, activeMenu, setActiveMenu }) => {
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

  if (!sidebarOpen) return null;

  return (
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
  );
};

// Topbar Component
const Topbar = ({ setSidebarOpen, title }) => {
  return (
    <div className="bg-white/90 border-b border-gray-200 shadow-sm sticky top-0 z-40 backdrop-blur-lg">
      <div className="p-4 lg:px-8 lg:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-all">
              <Menu size={24} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                {title}
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
  );
};

// Main Report Management Component
const ReportManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState('reports');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const reports = [
    { id: 'RPT-001', type: 'Financial Report', status: 'Completed', date: '2024-11-01', author: 'John Doe', progress: 100 },
    { id: 'RPT-002', type: 'Quarterly Review', status: 'In Progress', date: '2024-11-02', author: 'Jane Smith', progress: 65 },
    { id: 'RPT-003', type: 'Financial Report', status: 'Completed', date: '2024-11-03', author: 'Mike Johnson', progress: 100 },
    { id: 'RPT-004', type: 'Annual Summary', status: 'Pending', date: '2024-11-04', author: 'Sarah Williams', progress: 20 },
    { id: 'RPT-005', type: 'Financial Report', status: 'Completed', date: '2024-11-05', author: 'David Brown', progress: 100 },
    { id: 'RPT-006', type: 'Quarterly Review', status: 'In Progress', date: '2024-10-28', author: 'Emily Davis', progress: 45 },
    { id: 'RPT-007', type: 'Quarterly Review', status: 'Completed', date: '2024-11-01', author: 'Chris Wilson', progress: 100 },
    { id: 'RPT-008', type: 'Financial Report', status: 'Completed', date: '2024-11-02', author: 'Lisa Anderson', progress: 100 },
  ];

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-600 border border-emerald-200';
      case 'In Progress':
        return 'bg-blue-500/10 text-blue-600 border border-blue-200';
      case 'Pending':
        return 'bg-amber-500/10 text-amber-600 border border-amber-200';
      default:
        return 'bg-gray-500/10 text-gray-600 border border-gray-200';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || report.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <Sidebar 
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />
      
      <MobileSidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />

      <div className="flex-1 overflow-auto">
        <Topbar 
          setSidebarOpen={setSidebarOpen}
          title="Report Management"
        />

        {/* Main Content */}
        <div className="p-4 lg:p-8">
          {/* Search and Actions Bar */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports, authors, IDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all duration-300"
                />
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center space-x-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-300 border border-gray-200">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Date</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-300 border border-gray-200">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">Filter</span>
                </button>
                <button className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-semibold hidden sm:inline">New Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="flex space-x-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100 inline-flex">
              {['All', 'Completed', 'In Progress', 'Pending'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    selectedFilter === filter
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100">
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Report ID</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReports.map((report, index) => (
                    <tr key={index} className={`hover:bg-gradient-to-r hover:from-gray-50 hover:to-emerald-50 transition-all duration-200 group ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-5">
                        <span className="font-semibold text-gray-900">{report.id}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-gray-700">{report.type}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{report.author.split(' ').map(n => n[0]).join('')}</span>
                          </div>
                          <span className="text-sm text-gray-700">{report.author}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusStyle(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${report.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600">{report.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-gray-600">{report.date}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                          <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                          <button className="p-2 hover:bg-emerald-50 rounded-lg transition-colors duration-200">
                            <Edit className="w-4 h-4 text-emerald-600" />
                          </button>
                          <button className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-200">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredReports.map((report, index) => (
                <div key={index} className="p-5 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm font-bold">{report.author.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{report.id}</p>
                        <p className="text-xs text-gray-500">{report.author}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                      <button className="p-2 hover:bg-emerald-50 rounded-lg transition-colors duration-200">
                        <Edit className="w-4 h-4 text-emerald-600" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-200">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{report.type}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusStyle(report.status)}`}>
                      {report.status}
                    </span>
                    <span className="text-xs text-gray-500">{report.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${report.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-600">{report.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportManagement;