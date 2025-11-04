import React, { useState } from 'react';
import { ArrowLeftFromLine, Menu, Home, Ticket, Bus, Bell, CircleParking, ChevronDown, LogOut, Settings, SearchCheck, Store, FileText, X, Filter, Calendar, Upload} from 'lucide-react';

const TicketManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState('tickets');
  const [searchQuery, setSearchQuery] = useState('');

  const tickets = [
    { id: 1, ticketNo: 1, passengerType: 'Student', price: 10.00, time: '08:30 AM', date: '2024-11-15' },
    { id: 2, ticketNo: 2, passengerType: 'Student', price: 10.00, time: '08:35 AM', date: '2024-11-15' },
    { id: 3, ticketNo: 3, passengerType: 'Student', price: 10.00, time: '08:42 AM', date: '2024-11-15' },
    { id: 4, ticketNo: 4, passengerType: 'Student', price: 10.00, time: '09:15 AM', date: '2024-11-15' },
    { id: 5, ticketNo: 5, passengerType: 'Student', price: 10.00, time: '09:28 AM', date: '2024-11-15' },
    { id: 6, ticketNo: 6, passengerType: 'Senior Citizen / PWD', price: 10.00, time: '09:45 AM', date: '2024-11-15' },
    { id: 7, ticketNo: 7, passengerType: 'Senior Citizen / PWD', price: 10.00, time: '10:10 AM', date: '2024-11-15' },
    { id: 8, ticketNo: 8, passengerType: 'Regular', price: 15.00, time: '10:25 AM', date: '2024-11-15' },
    { id: 9, ticketNo: 9, passengerType: 'Regular', price: 15.00, time: '10:50 AM', date: '2024-11-15' },
    { id: 10, ticketNo: 10, passengerType: 'Student', price: 10.00, time: '11:15 AM', date: '2024-11-15' },
  ];

  const filteredTickets = tickets.filter(ticket => 
    ticket.ticketNo.toString().includes(searchQuery) || 
    ticket.passengerType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const regularCount = 2;
  const studentCount = 6;
  const seniorCount = 2;
  const overallCount = 10;

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

  const getPassengerTypeColor = (type) => {
    switch(type) {
      case 'Student': return 'text-blue-600 bg-blue-50';
      case 'Senior Citizen / PWD': return 'text-yellow-600 bg-yellow-50';
      case 'Regular': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
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
                   Ticket Management
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
            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-200 to-rose-200 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-125 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-600 text-base font-semibold mb-3">Regular</p>
                    <p className="text-6xl font-extrabold text-gray-900 mb-4">{regularCount.toLocaleString()}</p>
                  </div>
                  <div className="w-6 h-6 bg-red-400 rounded-full shadow-lg"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-lg">10%</span>
                  <span className="text-gray-500 text-sm font-medium">Today</span>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-125 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-600 text-base font-semibold mb-3">Student</p>
                    <p className="text-6xl font-extrabold text-gray-900 mb-4">{studentCount.toLocaleString()}</p>
                  </div>
                  <div className="w-6 h-6 bg-blue-400 rounded-full shadow-lg"></div>
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
                    <p className="text-gray-600 text-base font-semibold mb-3">Senior Citizen / PWD</p>
                    <p className="text-6xl font-extrabold text-gray-900 mb-4">{seniorCount.toLocaleString()}</p>
                  </div>
                  <div className="w-6 h-6 bg-yellow-400 rounded-full shadow-lg"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-lg">10%</span>
                  <span className="text-gray-500 text-sm font-medium">Today</span>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-125 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-600 text-base font-semibold mb-3">Overall</p>
                    <p className="text-6xl font-extrabold text-gray-900 mb-4">{overallCount.toLocaleString()}</p>
                  </div>
                  <div className="w-6 h-6 bg-emerald-400 rounded-full shadow-lg"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-lg">10%</span>
                  <span className="text-gray-500 text-sm font-medium">Today</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 gap-4">
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center space-x-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all">
                  <Calendar size={20} className="text-gray-600" />
                  <span className="text-gray-700 font-medium">Date</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all">
                  <Filter size={20} className="text-gray-600" />
                  <span className="text-gray-700 font-medium">Filter</span>
                </button>
              </div>
              <button className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <Upload size={20} />
                <span className="font-medium">Export</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100">
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Ticket No.</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Passenger Type</th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTickets.map((ticket, index) => (
                    <tr key={ticket.id} className={`hover:bg-gradient-to-r hover:from-gray-50 hover:to-emerald-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-5">
                        <span className="font-semibold text-gray-900">{ticket.ticketNo}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPassengerTypeColor(ticket.passengerType)}`}>
                          {ticket.passengerType}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-gray-900 font-bold">₱{ticket.price.toFixed(2)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:hidden mt-6 space-y-4">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Ticket No.</p>
                    <p className="text-2xl font-bold text-gray-900">#{ticket.ticketNo}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPassengerTypeColor(ticket.passengerType)}`}>
                    {ticket.passengerType}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <p className="text-gray-500 text-sm font-medium">Price</p>
                  <p className="text-2xl font-bold text-gray-900">₱{ticket.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketManagement;