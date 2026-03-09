import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LOGO from "../assets/LOGO.png"; 
import LoginBackground from "../components/login/LoginBackground";
import LoginCard from "../components/login/LoginCard";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";

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
  const [successMsg, setSuccessMsg] = useState("");
  
  // Multi-step navigation state
  const [step, setStep] = useState("LOGIN"); // 'LOGIN', '2FA_OTP', 'FORGOT_OTP', 'RESET_PASSWORD'
  const [showResetButton, setShowResetButton] = useState(false);
  
  // OTP and Reset States
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login";
  }, []);

  // --- 1. LOGIN HANDLER ---
  const handleCredentialsSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) return setError("Please enter your email and password.");
    
    setError("");
    setSuccessMsg("");
    setIsLoading(true);
    setShowResetButton(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admins/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials.");
        // Detection: Show forgot password if backend flags it as a superadmin
        if (data.showReset) setShowResetButton(true);
        return;
      }

      if (data.requiresOtp) {
        setStep("2FA_OTP");
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

  // --- 2. 2FA OTP HANDLER ---
  const handle2FAOtpSubmit = async (e) => {
    e.preventDefault();
    const cleanedOtp = String(otp || "").trim();
    if (!cleanedOtp) return setError("Please enter the OTP.");
    
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admins/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: cleanedOtp }),
      });
      const data = await res.json();

      if (!res.ok) return setError(data.message || "Failed to verify OTP.");

      const { admin } = data;
      const role = admin.role;
      const name = admin.name || roleNames[role] || "Admin";

      localStorage.setItem("isAdminLoggedIn", "true");
      localStorage.setItem("authRole", role);
      localStorage.setItem("authName", name);
      localStorage.setItem("authEmail", admin.email);

      const routes = { parking: "/parking", lostfound: "/lost-found", bus: "/buses-trips", ticket: "/tickets", lease: "/tenant-lease" };
      navigate(routes[role] || "/dashboard");

    } catch (err) {
      console.error("OTP error:", err);
      setError("Failed to verify OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. TRIGGER FORGOT PASSWORD ---
  const handleForgotPasswordTrigger = async () => {
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admins/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) return setError(data.message || "Failed to trigger reset.");
      
      setSuccessMsg("Reset code sent to your email.");
      setStep("FORGOT_OTP");
      setOtp("");
    } catch (err) {
      setError("System error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. VERIFY RESET OTP ---
  const handleResetOtpSubmit = async (e) => {
    e.preventDefault();
    const cleanedOtp = String(otp || "").trim();
    if (!cleanedOtp) return setError("Please enter the reset code.");
    
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admins/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: cleanedOtp }),
      });
      const data = await res.json();

      if (!res.ok) return setError(data.message || "Invalid or expired OTP.");

      setResetToken(data.resetToken);
      setSuccessMsg("OTP Verified. Please enter your new password.");
      setStep("RESET_PASSWORD");
      setOtp(""); // Clear OTP
    } catch (err) {
      setError("Failed to verify reset code.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 5. EXECUTE PASSWORD RESET ---
  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) return setError("Please enter a new password.");
    
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admins/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetToken, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) return setError(data.message || "Failed to reset password.");

      setSuccessMsg("Password updated successfully! You can now log in.");
      setStep("LOGIN");
      setPassword("");
      setNewPassword("");
      setShowResetButton(false);
    } catch (err) {
      setError("Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- UTILS ---
  const handleBackToLogin = () => {
    setStep("LOGIN");
    setOtp("");
    setNewPassword("");
    setError("");
    setSuccessMsg("");
  };

  const handleResendOtp = async () => {
    // Re-trigger the standard login flow to send a new 2FA OTP
    handleCredentialsSubmit();
    setSuccessMsg("A new OTP has been sent to your email.");
  };

  // Determine active submit handler based on step
  const getSubmitHandler = () => {
    if (step === "LOGIN") return handleCredentialsSubmit;
    if (step === "2FA_OTP") return handle2FAOtpSubmit;
    if (step === "FORGOT_OTP") return handleResetOtpSubmit;
    if (step === "RESET_PASSWORD") return handleNewPasswordSubmit;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <LoginBackground />
      <form onSubmit={getSubmitHandler()} className="z-10 relative">
        
        {step === "LOGIN" && (
          <LoginCard 
            icon={<img src={LOGO} alt="Logo" className="w-full h-full object-contain" />}
            title="Admin Portal"
            subtitle={successMsg || "Sign in to access your dashboard"}
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            showPassword={showPassword} setShowPassword={setShowPassword}
            handleSubmit={handleCredentialsSubmit}
            isLoading={isLoading}
            error={error}
            buttonText="Login"
            footer={
              showResetButton && (
                <div className="flex justify-center pt-2">
                  <button 
                    type="button" 
                    onClick={handleForgotPasswordTrigger} 
                    disabled={isLoading} 
                    className="text-sm font-semibold text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              )
            }
          />
        )}

        {step === "2FA_OTP" && (
          <LoginCard 
            icon={<img src={LOGO} alt="Logo" className="w-full h-full object-contain cursor-pointer" />}
            title="OTP Verification" 
            subtitle={successMsg || "Enter the OTP sent to your email to complete login"}
            email={email} setEmail={setEmail} emailDisabled={true}
            password={otp} setPassword={setOtp} passwordType="text"
            passwordLabel="One-time password (OTP)" passwordPlaceholder="Enter 6-digit code" passwordIcon="Key"
            showPassword={false} setShowPassword={() => {}} showPasswordToggle={false}
            handleSubmit={handle2FAOtpSubmit} isLoading={isLoading} error={error}
            buttonText="Verify OTP"
            footer={
              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={handleBackToLogin} disabled={isLoading} className="text-sm font-semibold text-white hover:text-emerald-500 transition-colors cursor-pointer">Back</button>
                <button type="button" onClick={handleResendOtp} disabled={isLoading} className="text-sm font-semibold text-white hover:text-emerald-500 transition-colors cursor-pointer">Resend OTP</button>
              </div>
            }
          />
        )}

        {step === "FORGOT_OTP" && (
          <LoginCard 
            icon={<img src={LOGO} alt="Logo" className="w-full h-full object-contain cursor-pointer" />}
            title="Password Reset" 
            subtitle={successMsg || "Enter the 6-digit code sent to your email"}
            email={email} setEmail={setEmail} emailDisabled={true}
            password={otp} setPassword={setOtp} passwordType="text"
            passwordLabel="Reset Code (OTP)" passwordPlaceholder="Enter 6-digit code" passwordIcon="Key"
            showPassword={false} setShowPassword={() => {}} showPasswordToggle={false}
            handleSubmit={handleResetOtpSubmit} isLoading={isLoading} error={error}
            buttonText="Verify Code"
            footer={
              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={handleBackToLogin} disabled={isLoading} className="text-sm font-semibold text-white hover:text-emerald-500 transition-colors cursor-pointer">Back to Login</button>
                <button type="button" onClick={handleForgotPasswordTrigger} disabled={isLoading} className="text-sm font-semibold text-white hover:text-emerald-500 transition-colors cursor-pointer">Resend Code</button>
              </div>
            }
          />
        )}

        {step === "RESET_PASSWORD" && (
          <LoginCard 
            icon={<img src={LOGO} alt="Logo" className="w-full h-full object-contain" />}
            title="Create New Password" 
            subtitle={successMsg || "Your OTP was verified. Please enter a new password."}
            email={email} setEmail={setEmail} emailDisabled={true}
            password={newPassword} setPassword={setNewPassword}
            passwordLabel="New Password" passwordPlaceholder="Enter new password"
            showPassword={showPassword} setShowPassword={setShowPassword}
            handleSubmit={handleNewPasswordSubmit} isLoading={isLoading} error={error}
            buttonText="Update Password"
            footer={
              <div className="flex justify-center pt-2">
                <button type="button" onClick={handleBackToLogin} disabled={isLoading} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Cancel</button>
              </div>
            }
          />
        )}

      </form>
    </div>
  );
}