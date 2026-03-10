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

  emailLabel = "Email Address",
  emailPlaceholder = "admin@gmail.com",
  emailIcon = "Mail",
  emailDisabled = false,

  passwordLabel = "Password",
  passwordPlaceholder = "Enter your password",
  passwordIcon = "Lock",
  passwordType = "password",
  showPasswordToggle = true,

  buttonText = "Sign In",
  footer = null,
}) {
  return (
    <div className="flex justify-center items-center w-full px-4 sm:px-6">
      <div
        className="
          relative
          w-full
          sm:w-[600px]
          transition-all duration-300 ease-in-out
        "
      >
        <div
          className="
            relative
            w-full
            sm:w-[600px]
            bg-white/30
            backdrop-blur-xl
            rounded-2xl sm:rounded-3xl
            shadow-2xl shadow-emerald-500/10
            border border-white/20
            px-6 py-8
            sm:px-12 sm:py-12
            lg:px-16 lg:py-14
            animate-fadeIn
          "
        >
          <div className="text-center mb-8 lg:mb-10">
            <div
              className="
                inline-flex items-center justify-center
                w-16 h-16 sm:w-20 sm:h-20
                bg-gradient-to-br from-teal-500 to-emerald-500
                rounded-full mb-4 shadow-md text-white overflow-hidden
              "
            >
              <div className="flex items-center justify-center">{icon}</div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              {title}
            </h1>

            <p className="text-white text-sm sm:text-base lg:text-lg mt-2">
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
                label={emailLabel}
                value={email}
                onChange={setEmail}
                icon={emailIcon}
                placeholder={emailPlaceholder}
                disabled={emailDisabled}
              />

              <LoginInput
                type={passwordType}
                label={passwordLabel}
                value={password}
                onChange={setPassword}
                showPassword={showPasswordToggle ? showPassword : false}
                setShowPassword={
                  showPasswordToggle ? setShowPassword : () => {}
                }
                icon={passwordIcon}
                placeholder={passwordPlaceholder}
              />

              <div className="pt-2 lg:pt-4">
                <LoginButton
                  handleSubmit={handleSubmit}
                  isLoading={isLoading}
                  text={buttonText}
                />
              </div>

              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
