import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    document.title = "Login";
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      try {
        const key = "ibt_admins";
        const raw = localStorage.getItem(key);
        if (!raw) {
          localStorage.setItem(key, JSON.stringify([
            { id: 1, email: "admin@example.com", password: "admin123", role: "superadmin" },
            { id: 2, email: "parkingadmin@example.com", password: "parking123", role: "parking" },
            { id: 3, email: "lostfoundadmin@example.com", password: "lostfound123", role: "lostfound" },
          ]));
        }
      } catch { }

      try {
        const admins = JSON.parse(localStorage.getItem("ibt_admins")) || [];
        const found = admins.find((a) => a.email === email && a.password === password);
        if (found) {
          localStorage.setItem("isAdminLoggedIn", "true");
          localStorage.setItem("authRole", found.role);
          navigate(found.role === "parking" ? "/parking" : found.role === "lostfound" ? "/lost-found" : "/dashboard");
        } else {
          setError("Invalid credentials. Please try again.");
        }
      } catch {
        setError("Login system error. Please try again.");
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