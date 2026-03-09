import React from "react";

export default function LoginBackground() {
  const imageUrl = "/terminal-bg.jpg";

  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-emerald-200">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${imageUrl})`,
          opacity: 0.8, 
        }}
        aria-hidden="true"
      />

      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>

      <div className="absolute inset-0 bg-gradient-to-t from-emerald-300/40 via-transparent to-emerald-200/30"></div>
    </div>
  );
}