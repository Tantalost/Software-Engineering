import React from "react";
import Spinner from "../common/Spinner";

export default function LoginButton({ handleSubmit, isLoading }) {
  return (
    <button
      onClick={handleSubmit}
      disabled={isLoading}
      className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50"
    >
      {isLoading ? <Spinner text="Signing in..." /> : "Sign In"}
    </button>
  );
}
