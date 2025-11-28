import React from "react";
import { useNavigate } from "react-router-dom";
import { FileCheck } from "lucide-react";

const RecentActivity = () => {
  const navigate = useNavigate(); 

  const activities = [
    {
      id: 1,
      message: "New uploaded Bus trip schedule",
      time: "5 mins ago",
      icon: FileCheck,
      type: "success",
      user: "Inspector Lee",
      link: "/buses-trips", 
    },
    {
      id: 2,
      message: "New updates for Parking Fees Report",
      time: "12 mins ago",
      icon: FileCheck,
      type: "warning",
      user: "Parking Attendant",
      link: "/parking",
    },
    {
      id: 3,
      message: "New Tenants/Lease Report",
      time: "28 mins ago",
      icon: FileCheck,
      type: "success",
      user: "Manager Kim",
      link: "/tenant-lease",
    },
  ];

  const typeColors = {
    success: "from-emerald-400 to-teal-400",
    warning: "from-yellow-400 to-orange-400",
    alert: "from-red-400 to-pink-400",
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Recent Activity</h2>
      </div>

      <div className="space-y-3">
        {activities.map((activity, idx) => (
          <div
            key={activity.id}
            onClick={() => navigate(activity.link)} 
            className="flex items-center justify-between py-5 px-6 bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:border-emerald-300 rounded-2xl hover:shadow-md transition-all duration-300 cursor-pointer group"
            style={{}}
          >
            <div className="flex items-center space-x-5 flex-1">
              <div
                className={`w-14 h-14 bg-gradient-to-br ${typeColors[activity.type]} rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <activity.icon className="text-white" size={24} />
              </div>

              <div className="flex-1">
                <p className="text-gray-900 font-semibold text-base mb-1">
                  {activity.message}
                </p>
                <p className="text-gray-500 text-sm">by {activity.user}</p>
              </div>
            </div>

            <span className="text-gray-500 text-sm font-medium ml-4">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
