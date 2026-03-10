import React from "react";
import { Mail, Lock, Eye, EyeOff, KeyRound } from "lucide-react";

export default function LoginInput({
  type,
  label,
  value,
  onChange,
  icon,
  placeholder,
  showPassword,
  setShowPassword,
  disabled = false,
}) {
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const renderIcon = () => {
    if (icon === "Mail") return <Mail className="w-5 h-5 sm:w-5 sm:h-5" />;
    if (icon === "Lock") return <Lock className="w-5 h-5 sm:w-5 sm:h-5" />;
    if (icon === "Key") return <KeyRound className="w-5 h-5 sm:w-5 sm:h-5" />;
    return null;
  };

  return (
    <div className="w-full">
      
      {/* Label */}
      <label className="block text-white font-medium text-sm sm:text-base mb-2 ml-1">
        {label}
      </label>

      <div className="relative group">

        {/* Left Icon */}
        <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors duration-200">
          {renderIcon()}
        </div>

        {/* Input */}
        <input
          type={inputType}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="
            w-full
            bg-gray-50
            text-gray-900
            text-sm sm:text-base
            placeholder-gray-400
            border border-gray-200
            rounded-xl
            py-3 sm:py-3.5
            pl-10 sm:pl-12
            pr-10 sm:pr-12
            focus:outline-none
            focus:ring-2 focus:ring-teal-500/20
            focus:border-teal-500
            transition-all duration-200
          "
        />

        {/* Password Toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="
              absolute right-2 sm:right-3 top-1/2 -translate-y-1/2
              p-2
              text-gray-400 hover:text-gray-600
              rounded-full hover:bg-gray-100
              transition-colors
              cursor-pointer
            "
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}