import React from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react"; // Ensure you have lucide-react or use your own icons

export default function LoginInput({
  type,
  label,
  value,
  onChange,
  icon,
  placeholder,
  showPassword,
  setShowPassword,
}) {
  const isPassword = type === "password";
 
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const renderIcon = () => {
    if (icon === "Mail") return <Mail size={20} />;
    if (icon === "Lock") return <Lock size={20} />;
    return null;
  };

  return (
    <div className="w-full">
      <label className="block text-gray-700 font-medium text-sm mb-2 ml-1">
        {label}
      </label>
      
      <div className="relative group">
        
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors duration-200">
          {renderIcon()}
        </div>

        <input
          type={inputType}
          value={value}
        
          onChange={(e) => onChange(e.target.value)} 
          placeholder={placeholder}
          className="
            w-full
            bg-gray-50 
            text-gray-900 
            /* text-base prevents iOS zoom on focus */
            text-base sm:text-sm 
            placeholder-gray-400
            border border-gray-200 
            rounded-xl 
            /* Larger vertical padding for easier tapping on mobile */
            py-3.5 sm:py-3
            /* Padding left to make room for the icon */
            pl-12 
            /* Padding right to make room for password eye */
            pr-12 
            focus:outline-none 
            focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 
            transition-all duration-200
          "
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="
              absolute right-3 top-1/2 -translate-y-1/2 
              p-2 
              text-gray-400 hover:text-gray-600 
              rounded-full hover:bg-gray-100 
              transition-colors
              cursor-pointer
            "
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}