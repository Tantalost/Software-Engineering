import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import LoginBackground from "../components/login/LoginBackground";
import LoginCard from "../components/login/LoginCard";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      if (email === "admin@example.com" && password === "admin123") {
        localStorage.setItem("isAdminLoggedIn", "true");
        navigate("/dashboard");
      } else {
        setError("Invalid credentials. Please try again.");
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <LoginBackground />
      <LoginCard
        icon={<Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />}
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
      />
    </div>
  );
}