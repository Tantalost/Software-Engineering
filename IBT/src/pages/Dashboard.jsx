import React, { useState } from 'react';
import { Menu, Home, Bell, CreditCard, Bus, Ticket, HelpCircle, MapPin, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function IBTDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState('Dashboard');

  const lineData = [
    { name: 'Figma', 2020: 300, 2021: 250, 2022: 230 },
    { name: 'Sketch', 2020: 210, 2021: 260, 2022: 95 },
    { name: 'XD', 2020: 100, 2021: 150, 2022: 100 },
    { name: 'PS', 2020: 240, 2021: 230, 2022: 95 },
    { name: 'AI', 2020: 240, 2021: 240, 2022: 150 },
    { name: 'CorelD RAW', 2020: 300, 2021: 260, 2022: 145 },
    { name: 'InDesign', 2020: 250, 2021: 210, 2022: 130 },
    { name: 'Canva', 2020: 250, 2021: 250, 2022: 180 },
    { name: 'Webflow', 2020: 280, 2021: 255, 2022: 155 },
    { name: 'Affinity', 2020: 240, 2021: 215, 2022: 135 },
    { name: 'Marker RAW', 2020: 300, 2021: 240, 2022: 190 },
    { name: 'Figma', 2020: 270, 2021: 210, 2022: 150 }
  ];

  const donutData = [
    { name: 'Red', value: 25 },
    { name: 'Yellow', value: 12.5 },
    { name: 'Blue', value: 12.5 },
    { name: 'Green', value: 50 }
  ];

  const COLORS = ['#EF4444', '#FCD34D', '#3B82F6', '#10B981'];

  const recentActivities = [
    { message: 'Update message', time: '5 mins ago', opacity: 0.3 },
    { message: 'Update Message', time: '5 mins ago', opacity: 0.7 },
    { message: 'Update Message', time: '5 mins ago', opacity: 0.5 },
    { message: 'Update Message', time: '5 mins ago', opacity: 1 }
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

        <div className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 space-y-6">
        
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Label</div>
                      <div className="text-4xl font-bold text-gray-900">5,768</div>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                          10%
                        </span>
                        <span className="text-sm text-gray-600">From last month</span>
                      </div>
                    </div>
                    <div className="w-3 h-3 bg-green-400 rounded-full mt-1"></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    
              <div className="lg:col-span-2 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl p-1">
                <div className="bg-white rounded-xl p-6 h-full">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="2020" 
                        stroke="#A78BFA" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="2021" 
                        stroke="#FB7185" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="2022" 
                        stroke="#38BDF8" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Title</h3>
                <div className="grid grid-cols-2 gap-2 text-sm mb-6">
                  <div>Title</div>
                  <div>Title</div>
                  <div>Title</div>
                  <div>Title</div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx={100}
                          cy={100}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={0}
                          dataKey="value"
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900 bg-white rounded-full w-24 h-24 flex items-center justify-center">
                        50%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-4">Summary</div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Recent Activity
              </h3>
              <div className="space-y-1">
                {recentActivities.map((activity, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-12 h-12 rounded-full flex-shrink-0"
                        style={{ 
                          backgroundColor: `rgba(74, 222, 128, ${activity.opacity})`
                        }}
                      ></div>
                      <span className="text-gray-900 text-lg">{activity.message}</span>
                    </div>
                    <span className="text-gray-600 text-sm">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}