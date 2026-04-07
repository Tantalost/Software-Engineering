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

  const [step, setStep] = useState("LOGIN"); 
  const [showResetButton, setShowResetButton] = useState(false);

  const [otp, setOtp] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false); 
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login";
  }, []);

  const handleSuccessfulLogin = (admin, token) => {
    const role = admin.role;
    const name = admin.name || roleNames[role] || "Admin";

    localStorage.setItem("isAdminLoggedIn", "true");
    localStorage.setItem("authToken", token); 
    localStorage.setItem("authRole", role);
    localStorage.setItem("authName", name);
    localStorage.setItem("authAdminId", admin.id || admin._id || "");
    localStorage.setItem("authEmail", admin.email);
    localStorage.setItem("authShift", admin.assignedShift || "");

    const routes = { 
      parking: "/parking", 
      lostfound: "/lost-found", 
      bus: "/buses-trips", 
      ticket: "/tickets", 
      lease: "/tenant-lease",
      superadmin: "/dashboard" 
    };
    navigate(routes[role] || "/dashboard");
  };

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
        // CHANGED: Show the recovery options whenever an error occurs
        setShowResetButton(true); 
        return;
      }

      if (data.requiresOtp === false && data.token && data.admin) {
        handleSuccessfulLogin(data.admin, data.token);
      } else if (data.requiresOtp) {
        setStep("2FA_OTP");
        setOtp("");
        setUseRecoveryCode(false); 
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

  const handle2FAOtpSubmit = async (e) => {
    e.preventDefault();
    const cleanedOtp = String(otp || "").trim();
    if (!cleanedOtp) return setError(`Please enter the ${useRecoveryCode ? "recovery code" : "OTP"}.`);

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admins/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: cleanedOtp, isRecoveryCode: useRecoveryCode }),
      });
      const data = await res.json();

      if (!res.ok) return setError(data.message || "Failed to verify code.");

      handleSuccessfulLogin(data.admin, data.token);
    } catch (err) {
      console.error("Verification error:", err);
      setError("Failed to verify code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordTrigger = async () => {
    if (!email) return setError("Please enter your email first to reset your password.");
    
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
      setOtp(""); 
    } catch (err) {
      setError("Failed to verify reset code.");
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleBackToLogin = () => {
    setStep("LOGIN");
    setOtp("");
    setNewPassword("");
    setError("");
    setSuccessMsg("");
    setUseRecoveryCode(false);
  };

  const handleResendOtp = async () => {
    handleCredentialsSubmit();
    setSuccessMsg("A new OTP has been sent to your email.");
  };

  const getSubmitHandler = () => {
    if (step === "LOGIN") return handleCredentialsSubmit;
    if (step === "2FA_OTP") return handle2FAOtpSubmit;
    if (step === "FORGOT_OTP") return handleResetOtpSubmit;
    if (step === "RESET_PASSWORD") return handleNewPasswordSubmit;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/70 hover:text-white bg-white/10 px-4 py-2 rounded-lg backdrop-blur-md border border-white/20 transition-all"
      >
        ← Back to Home
      </button>
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
              // CHANGED: Displays BOTH buttons cleanly alongside each other only after an error
              showResetButton && (
                <div className="flex items-center justify-between pt-4 px-2 mt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleForgotPasswordTrigger}
                    disabled={isLoading}
                    className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!email) return setError("Please enter your email first to use a recovery code.");
                      setUseRecoveryCode(true);
                      setStep("2FA_OTP");
                      setError("");
                      setSuccessMsg("");
                    }}
                    disabled={isLoading}
                    className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Forgot Email?
                  </button>
                </div>
              )
            }
          />
        )}

        {step === "2FA_OTP" && (
          <LoginCard
            icon={<img src={LOGO} alt="Logo" className="w-full h-full object-contain" />}
            title={useRecoveryCode ? "Recovery Login" : "OTP Verification"}
            subtitle={successMsg || (useRecoveryCode ? "Enter one of your emergency recovery codes" : "Enter the OTP sent to your email to complete login")}
            email={email} setEmail={setEmail} emailDisabled={true}
            password={otp} setPassword={setOtp} passwordType="text"
            passwordLabel={useRecoveryCode ? "Recovery Code" : "One-time password (OTP)"}
            passwordPlaceholder={useRecoveryCode ? "e.g., a1b2c3d4" : "Enter 6-digit code"} 
            passwordIcon="Key"
            showPassword={false} setShowPassword={() => { }} showPasswordToggle={false}
            handleSubmit={handle2FAOtpSubmit} isLoading={isLoading} error={error}
            buttonText={useRecoveryCode ? "Verify Recovery Code" : "Verify OTP"}
            footer={
              // CHANGED: Removed the toggle from here completely
              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={handleBackToLogin} disabled={isLoading} className="text-sm font-semibold text-white hover:text-emerald-500 transition-colors cursor-pointer">Back</button>
                {!useRecoveryCode && (
                   <button type="button" onClick={handleResendOtp} disabled={isLoading} className="text-sm font-semibold text-white hover:text-emerald-500 transition-colors cursor-pointer">Resend OTP</button>
                )}
              </div>
            }
          />
        )}

        {step === "FORGOT_OTP" && (
          <LoginCard
            icon={<img src={LOGO} alt="Logo" className="w-full h-full object-contain" />}
            title="Password Reset"
            subtitle={successMsg || "Enter the 6-digit code sent to your email"}
            email={email} setEmail={setEmail} emailDisabled={true}
            password={otp} setPassword={setOtp} passwordType="text"
            passwordLabel="Reset Code (OTP)" passwordPlaceholder="Enter 6-digit code" passwordIcon="Key"
            showPassword={false} setShowPassword={() => { }} showPasswordToggle={false}
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