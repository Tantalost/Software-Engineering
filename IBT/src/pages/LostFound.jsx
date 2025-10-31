import React, { useState } from 'react';
import { Menu, X, Search, Filter, Calendar, Upload, Home, Bell, CreditCard, Bus, Ticket, HelpCircle, MapPin, ChevronDown } from 'lucide-react';

export default function IBTSlotManagement() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Permanent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMenuItem, setSelectedMenuItem] = useState('Lost and Found');

  // Sample data - Lost and Found items
  const slots = [
    { trackingNo: '2025-0001', description: 'Aqua Flask', dateTime: '2025-09-25 : 01:45 am', status: 'Unclaimed' },
    { trackingNo: '2025-0002', description: 'Bag', dateTime: '2025-09-25 : 05:00 pm', status: 'Unclaimed' },
    { trackingNo: '2025-0003', description: 'Headphone', dateTime: '2025-09-25 : 03:00 pm', status: 'Unclaimed' },
    { trackingNo: '2025-0004', description: 'Iphone 6 plus', dateTime: '2025-09-25 : 12:28 pm', status: 'Unclaimed' },
    { trackingNo: '2025-0005', description: 'Wallet', dateTime: '2025-09-25 : 11:58 am', status: 'Claimed' },
    { trackingNo: '2025-0006', description: 'Tumbler', dateTime: '2025-09-25 : 9:58 am', status: 'Claimed' },
    { trackingNo: '2025-0007', description: 'Pouch - Pink', dateTime: '2025-09-25 : 8:46 am', status: 'Claimed' },
    { trackingNo: '2025-0008', description: 'Shoes - Nike', dateTime: '2025-09-25 : 8:06 am', status: 'Unclaimed' }
  ];

  const menuItems = [
    { icon: Bell, label: 'Notifications', path: 'notifications' },
    { icon: Home, label: 'Dashboard', path: 'dashboard' },
    { icon: CreditCard, label: 'Payments', path: 'payments' },
    { icon: Bus, label: 'Bus and Trips', path: 'bus-trips' },
    { icon: Ticket, label: 'Terminal Fees', path: 'terminal-fees' },
    { icon: HelpCircle, label: 'Lost and Found', path: 'lost-found' },
    { icon: MapPin, label: 'Parking', path: 'parking' },
    { icon: HelpCircle, label: 'Support', path: 'support' },
  ];

  const filteredSlots = slots.filter(slot =>
    slot.trackingNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    slot.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lostItems = slots.filter(s => s.status === 'Unclaimed').length;
  const foundItems = slots.filter(s => s.status === 'Claimed').length;
  const totalItems = slots.length;

  return (
    <div className="flex h-screen bg-gray-50">
      
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-green-400 to-green-500 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
     
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-gray-800">IBT</div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-800 hover:text-gray-900"
            >
             
            </button>
          </div>

          <nav className="flex-1 px-3 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => setSelectedMenuItem(item.label)}
                className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors ${
                  selectedMenuItem === item.label
                    ? 'bg-green-600 text-white'
                    : 'text-gray-800 hover:bg-green-600 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-green-600">
            <button className="flex items-center w-full px-4 py-3 text-gray-800 hover:bg-green-600 hover:text-white rounded-lg transition-colors">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                <span className="text-gray-800 font-semibold">A</span>
              </div>
              <span className="font-medium flex-1 text-left">Admin User</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

    
      <div className="flex-1 flex flex-col overflow-hidden">
       
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-xl font-bold text-gray-800">IBT</div>
          <div className="w-6" /> 
        </div>

       
        <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Lost Items</div>
                  <div className="text-4xl font-bold text-gray-900">{lostItems}</div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-600">Today</span>
                  </div>
                </div>
                <div className="w-3 h-3 bg-red-400 rounded-full mt-1"></div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Found Items</div>
                  <div className="text-4xl font-bold text-gray-900">{foundItems}</div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-600">Today</span>
                  </div>
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full mt-1"></div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Items</div>
                  <div className="text-4xl font-bold text-gray-900">{totalItems}</div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-600">Today</span>
                  </div>
                </div>
                <div className="w-3 h-3 bg-green-600 rounded-full mt-1"></div>
              </div>
            </div>
          </div>
        </div>

        
        <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
           
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search Tracking No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
              <button className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Calendar className="w-4 h-4 mr-2" />
                Date
              </button>
              <button className="flex items-center justify-center p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                <Upload className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        
        <div className="flex-1 overflow-auto p-4 lg:p-6">
         
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-green-400">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Tracking No.
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSlots.map((slot) => (
                  <tr key={slot.trackingNo} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {slot.trackingNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {slot.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {slot.dateTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-4 py-2 inline-flex text-sm font-medium rounded-md ${
                        slot.status === 'Claimed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {slot.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        
          <div className="md:hidden space-y-4">
            {filteredSlots.map((slot) => (
              <div key={slot.trackingNo} className="bg-white rounded-lg shadow p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">
                    {slot.trackingNo}
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-md ${
                    slot.status === 'Claimed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {slot.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="text-gray-900 font-medium">{slot.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date & Time:</span>
                    <span className="text-gray-900 font-medium text-right">
                      {slot.dateTime}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}