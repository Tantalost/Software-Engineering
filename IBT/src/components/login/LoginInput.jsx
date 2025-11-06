import React from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginInput({
  type, label, value, onChange, placeholder, icon, showPassword, setShowPassword,
}) {
  const Icon = icon === "Mail" ? Mail : Lock;

  return (
    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        <input
          type={type === "password" && showPassword ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 sm:pl-11 pr-10 py-2 sm:py-3 
            bg-white border border-gray-300 rounded-xl 
            text-black placeholder-gray-500 
            focus:outline-none focus:ring-2 focus:ring-emerald-500 
            text-sm sm:text-base"
          placeholder={placeholder}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
