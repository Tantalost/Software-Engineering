import React from "react";
import LoginInput from "./LoginInput";
import LoginButton from "./LoginButton";

export default function LoginCard({
  icon,
  title,
  subtitle,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  handleSubmit,
  isLoading,
  error,
}) {
  return (
    <div
      className="relative w-full 
      max-w-xl sm:max-w-2xl md:max-w-3xl 
      mx-6 sm:mx-10 lg:mx-20 
      transition-all"
    >

      {/* Main Card */}
      <div
        className="
          relative 
          bg-white/100     
          rounded-3xl 
          shadow-xl 
          border border-white/30
          px-10 sm:px-14 md:px-16 
          py-8 sm:py-10 md:py-12
          "
          
      >
        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center 
            w-14 h-14 sm:w-16 sm:h-16 
            bg-gradient-to-br from-teal-500 to-emerald-500 
            rounded-2xl mb-4 shadow-md">
            {icon}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {title}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">
            {subtitle}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-400 rounded-xl text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Inputs */}
        <div className="mx-auto w-full max-w-md">
          <div className="space-y-5">
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

            <LoginButton
              handleSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
