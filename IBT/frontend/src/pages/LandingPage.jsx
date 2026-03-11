import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, X } from 'lucide-react'; // Removed Chevrons
import LOGO from "../assets/LOGO.png";
import adsPhone from "../assets/ads_phone.png";
import newAppImg from "../assets/New_application.png";
import busTripsImg from "../assets/bus_trips.png";
import lostFoundImg from "../assets/lost_found.png";
import ibtBg from "../assets/ibt_bg.png";

const LandingPage = () => {
  const scrollRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const bottomImages = [
    { src: newAppImg, alt: 'Stall Application' },
    { src: busTripsImg, alt: 'Bus Trips' },
    { src: lostFoundImg, alt: 'Lost and Found' }
  ];

  // Auto-scroll logic
  useEffect(() => {
    const autoScroll = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        
        // If we've reached the end of the scroll container (with a 10px buffer for rounding)
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          // Smoothly scroll back to the start
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Scroll right by 256px (w-60 is 240px + 16px space-x-4 gap)
          scrollRef.current.scrollTo({ left: scrollLeft + 256, behavior: 'smooth' });
        }
      }
    }, 3000); // Changes every 3 seconds

    // Cleanup interval on unmount
    return () => clearInterval(autoScroll);
  }, []);

  return (
    <div
      className="h-screen w-full flex flex-col font-sans overflow-hidden relative selection:bg-green-200 bg-sky-300"
    >
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-60 bg-cover bg-center bg-no-repeat blur-sm scale-105"
        style={{ backgroundImage: `url(${ibtBg})` }}
      />

      {/* Header */}
      <header className="flex justify-between items-center px-6 md:px-12 py-1 relative z-50">
        <div className="flex items-center space-x-2">
          <img src={LOGO} alt="IBT Logo" className="h-8 w-8 object-contain drop-shadow-sm" />
          <h1 className="font-black text-gray-700 tracking-tight">Integrated Bus Terminal ZC</h1>
        </div>
        <Link
          to="/login"
          className="px-4 py-1 border-[2px] border-emerald-500 text-emerald-800 rounded-full font-black text-sm hover:bg-emerald-500 hover:text-white transition-all duration-300 shadow-md uppercase tracking-wider"
        >
          Login
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center relative z-10 overflow-hidden px-4 md:px-15 lg:px-35">

        {/* Left Side */}
        <div className="flex flex-col justify-center space-y-9 z-20 w-1000 max-w-[52%]">

          {/* Headline */}
          <div className="transform -skew-x-3">
            <h2 className="text-5xl md:text-6xl font-black italic text-green-800 leading-[0.90] tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,0.1)]"
            style={{ WebkitTextStroke: '0.5px white' }}
            >
              GET BUS TRIPS UPDATE
            </h2>
            <h2 className="text-5xl md:text-6xl font-black italic text-green-00 leading-[0.90] tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,0.1)]" style={{ WebkitTextStroke: '0.5px white' }}>
              in REAL-TIME
            </h2>
          </div>

          {/* CTA */}
          <div className="flex items-center space-x-5">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#00a86b] hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-lg font-black uppercase transition-all duration-200 hover:scale-95 tracking-widest shadow-lg border-1 border-green"
            >
              Download App
            </button>
          </div>

          {/* Auto-Scroller */}
          <div className="w-full">
            <p className="text-[12px] text-white font-black italic mb-4 uppercase tracking-[0.1em] opacity-80">
              Process Stall Application Online!
            </p>

            <div className="relative flex items-center px-5">
              <div
                ref={scrollRef}
                className="flex overflow-x-auto space-x-4 pb-2 no-scrollbar snap-x scroll-smooth w-full"
              >
                {bottomImages.map((img, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-60 h-40 rounded-2xl overflow-hidden shadow-xl snap-center border-4 border-white transition-transform hover:scale-95 cursor-pointer"
                  >
                    <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Phone */}
        <div className="absolute right-0 top-0 bottom-0 w-[48%] flex items-center justify-center z-10 pointer-events-none">
          <div className="absolute top-[18%] left-[10%] z-30 animate-bounce pointer-events-auto">
            <div className="bg-[#00a86b] text-white text-xs font-black px-4 py-2 rounded-full shadow-[0_5px_20px_rgba(0,168,107,0.5)] border-2 border-white whitespace-nowrap uppercase tracking-wider">
              🚀 New Trip Has Arrived
            </div>
          </div>

          <div className="absolute bottom-[16%] right-[30%] z-80">
            <div className="bg-white rounded-full w-30 h-30 flex items-center justify-center shadow-2xl border-[4px] border-emerald-400">
              <Clock size={100} className="text-emerald-800" />
            </div>
          </div>

          <img
            src={adsPhone}
            alt="Mobile App"
            className="h-[86vh] w-auto object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.25)]"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-green-900 text-green-100 py-3 text-center text-[10px] tracking-[0.3em] font-black z-50 border-t border-green-700">
        <p className="opacity-70">© 2026 CYNERGYOPS. ALL RIGHTS RESERVED. | PRIVACY POLICY | TERMS</p>
      </footer>

      {/* QR Code Modal Overlay */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full relative flex flex-col items-center animate-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl font-black text-green-800 mb-1 uppercase tracking-tight text-center mt-2">
              Scan to Download
            </h3>
            <p className="text-gray-500 text-sm text-center mb-6 font-medium">
              Available on Android
            </p>
            
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-300 w-64 h-64 flex items-center justify-center mb-6 shadow-inner">
              <img 
                src="QRNew.png" 
                alt="App QR Code" 
                className="w-full h-full object-contain"
              />
            </div>
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors uppercase tracking-wider text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-overlay {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-modal {
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;