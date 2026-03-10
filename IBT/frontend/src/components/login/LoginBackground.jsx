import React from "react";

export default function LoginBackground({ children }) {
  const imageUrl = "/terminal-bg.jpg";

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden z-0 bg-emerald-100">
      
      {/* Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${imageUrl})`,
        }}
        aria-hidden="true"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/20 sm:bg-black/15"></div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-300/40 via-transparent to-emerald-200/30"></div>

      {/* Blur Layer */}
      <div className="absolute inset-0 backdrop-blur-[1px] sm:backdrop-blur-[2px]"></div>

      {/* CENTERED CONTENT (Login Card Container) */}
      <div className="relative flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        {children}
      </div>

    </div>
  );
}

