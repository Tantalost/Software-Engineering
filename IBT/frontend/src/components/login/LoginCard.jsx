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
    <div className="flex justify-center items-center w-full p-4 sm:p-6">
      <div
        className="
          relative 
          w-full 
          max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl
          transition-all duration-300 ease-in-out"
      >
        <div
          className="
            relative
            w-150 
            bg-white
            rounded-2xl sm:rounded-3xl 
            shadow-xl 
            border border-gray-100
            px-6 py-8 sm:px-12 sm:py-12 lg:px-16 lg:py-14
          "
        >
          <div className="text-center mb-8 lg:mb-10">
            <div
              className="
                inline-flex items-center justify-center 
                w-16 h-16 sm:w-20 sm:h-20 
                bg-gradient-to-br from-teal-500 to-emerald-500 
                rounded-full mb-4 shadow-md text-white overflow-hidden"
            >
              <div className="flex items-center justify-center">
                 {icon}
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">
              {title}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base lg:text-lg mt-2">
              {subtitle}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium text-center animate-pulse">
              {error}
            </div>
          )}

          <div className="w-full">
            <div className="space-y-4 sm:space-y-5 lg:space-y-6">
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
              <div className="pt-2 lg:pt-4">
                <LoginButton
                  handleSubmit={handleSubmit}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}