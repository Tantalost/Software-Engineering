import React from "react";
import { FileCheck } from "lucide-react"; 

const RecentActivity = ({ data = [], onItemClick }) => {
  const typeColors = {
    success: "from-emerald-400 to-teal-400",
    alert: "from-red-400 to-pink-400",
  };
  const limitedData = data.slice(0, 3);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Recent Reports</h2>
      </div>
      <div className="space-y-3">
        {limitedData.length === 0 ? <p className="text-gray-500">No recent activity.</p> : null}
        
        {limitedData.map((activity, idx) => {
          const Icon = activity.icon || FileCheck; 
          const colorClass = typeColors[activity.type] || typeColors.success;
          
          return (
            <div
              key={activity.id || idx}
              onClick={() => onItemClick && onItemClick(activity.id)}
              className="flex items-center justify-between py-5 px-6 bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:border-emerald-300 rounded-2xl hover:shadow-md transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center space-x-5 flex-1">
                <div className={`w-14 h-14 bg-gradient-to-br ${colorClass} rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="text-white" size={24} />
                </div>

                <div className="flex-1">
                  <p className="text-gray-900 font-semibold text-base mb-1">
                    {activity.message}
                  </p>
                  <p className="text-gray-500 text-sm">Status: {activity.status}</p>
                </div>
              </div>

              <span className="text-gray-500 text-sm font-medium ml-4">
                {new Date(activity.date).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;