import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LOGO from "../assets/LOGO.png"; 
import LoginBackground from "../components/login/LoginBackground";
import LoginCard from "../components/login/LoginCard";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const roleNames = {
  superadmin: "Super Admin",
  parking: "Parking Admin",
  lostfound: "Lost & Found Admin",
  ticket: "Ticket Admin",
  bus: "Bus Admin",
  lease: "Lease Admin",
};

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login";
  }, []);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admins/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials. Please try again.");
        return;
      }

      if (data.requiresOtp) {
        setIsOtpStep(true);
        setOtp("");
      } else {
        setError("Unexpected response from server.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login system error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const cleanedOtp = String(otp || "").trim();
    if (!cleanedOtp) {
      setError("Please enter the OTP sent to your email.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admins/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: cleanedOtp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to verify OTP.");
        return;
      }

      const { admin } = data;
      const role = admin.role;
      const name = admin.name || roleNames[role] || "Admin";

      localStorage.setItem("isAdminLoggedIn", "true");
      localStorage.setItem("authRole", role);
      localStorage.setItem("authName", name);
      localStorage.setItem("authEmail", admin.email);

      if (role === "parking") {
        navigate("/parking");
      } else if (role === "lostfound") {
        navigate("/lost-found");
      } else if (role === "bus") {
        navigate("/buses-trips");
      } else if (role === "ticket") {
        navigate("/tickets");
      } else if (role === "lease") {
        navigate("/tenant-lease");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsOtpStep(false);
    setOtp("");
    setError("");
  };

  const handleResendOtp = async () => {
    if (!email || !password) {
      setError("Please enter your email and password to resend OTP.");
      setIsOtpStep(false);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admins/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to resend OTP.");
        return;
      }

      // Stay on OTP step; OTP re-issued by backend
      setIsOtpStep(true);
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = isOtpStep ? handleOtpSubmit : handleCredentialsSubmit;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <LoginBackground />
      <form onSubmit={handleSubmit}>
        {!isOtpStep ? (
          <LoginCard 
            icon={
              <img 
                src={LOGO} 
                alt="Logo" 
                className="w-full h-full object-contain" 
              />
            }
            title="Admin Portal"
            subtitle="Sign in to access your dashboard"
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            buttonText="Continue"
          />
        ) : (
          <LoginCard 
            icon={
              <img 
                src={LOGO} 
                alt="Logo" 
                className="w-full h-full object-contain" 
              />
            }
            title="OTP Verification"
            subtitle="Enter the OTP sent to your email to complete login"
            email={email}
            setEmail={setEmail}
            emailDisabled={true}
            password={otp}
            setPassword={setOtp}
            showPassword={false}
            setShowPassword={() => {}}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            passwordType="text"
            passwordLabel="One-time password (OTP)"
            passwordPlaceholder="Enter 6-digit code"
            passwordIcon="Key"
            showPasswordToggle={false}
            buttonText="Verify OTP"
            footer={
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  disabled={isLoading}
                  className="text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-sm font-semibold text-teal-700 hover:text-teal-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Resend OTP
                </button>
              </div>
            }
          />
        )}
      </form>
    </div>
  );
}