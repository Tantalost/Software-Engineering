import React, { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";

export default function RecoveryCodeBadge() {
  const [count, setCount] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Only fetch if the logged-in user is a superadmin
    const role = localStorage.getItem("authRole");
    if (role !== "superadmin") return;

    const fetchCount = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/api/admins/recovery-codes/count`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setCount(data.count);
        }
      } catch (err) {
        console.error("Failed to fetch recovery code count", err);
      }
    };

    fetchCount();
  }, []);

  // Don't render anything if it's not a superadmin or data hasn't loaded
  if (count === null) return null;

  // Determine badge styling based on remaining codes
  let badgeColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
  let Icon = ShieldCheck;
  
  if (count <= 1) {
    badgeColor = "bg-red-100 text-red-700 border-red-200 animate-pulse";
    Icon = ShieldAlert;
  } else if (count <= 3) {
    badgeColor = "bg-amber-100 text-amber-700 border-amber-200";
    Icon = ShieldAlert;
  }

  return (
    <div 
      onClick={() => navigate('/employee-management')}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition-all hover:opacity-80 shadow-sm ${badgeColor}`}
      title="Remaining Recovery Codes"
    >
      <Icon size={14} />
      <span>{count} Codes Left</span>
    </div>
  );
}