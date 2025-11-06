import React from "react";
import LoginInput from "./LoginInput";
import LoginButton from "./LoginButton";

export default function LoginCard({
  icon, title, subtitle, email, setEmail, password, setPassword, showPassword, setShowPassword, handleSubmit, isLoading, error,
}) {
  return (
    <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl transition-all">
      <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl transform rotate-1"></div>
      <div className="relative bg-white bg-opacity-10 backdrop-blur-xl rounded-3xl shadow-2xl p-5 sm:p-8 md:p-10 border border-white border-opacity-20">
        <div className="text-center mb-5 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl mb-3 sm:mb-4 shadow-lg">
            {icon}
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black mb-1 sm:mb-2">
            {title}
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm md:text-base">
            {subtitle}
          </p>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 rounded-xl text-red-200 text-sm font-bold animate-pulse">
            {error}
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          <LoginInput
            type="email"
            label="Email Address"
            value={email}
            onChange={setEmail}
            icon="Mail"
            placeholder="admin@example.com"
          />
          <LoginInput
            type="password"
            label="Password"
            value={password}
            onChange={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            icon="Lock"
            placeholder="Enter your password"
          />

          <LoginButton handleSubmit={handleSubmit} isLoading={isLoading} />

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white border-opacity-10 text-center text-xs sm:text-sm text-gray-400">
            Demo credentials: admin@example.com / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
