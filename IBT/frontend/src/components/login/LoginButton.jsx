import React from "react";

export default function LoginButton({ handleSubmit, isLoading, text = "Sign In" }) {
  return (
    <button
      onClick={handleSubmit}
      disabled={isLoading}
      className={`
        w-full 
        relative 
        flex items-center justify-center
        py-3.5 px-4 
        rounded-xl 
        text-white font-bold text-lg sm:text-base tracking-wide
        bg-gradient-to-r from-teal-500 to-emerald-600 
        hover:from-teal-600 hover:to-emerald-700 
        shadow-lg shadow-teal-500/30
        transition-all duration-200 
        transform 
        active:scale-[0.98] 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500
        disabled:opacity-70 
        disabled:cursor-not-allowed 
        disabled:shadow-none
      `}
    >
      {isLoading ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </>
      ) : (
        text
      )}
    </button>
  );
}