import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import LOGO from "../assets/LOGO.png";
import adsPhone from "../assets/ads_phone.png";
import newAppImg from "../assets/New_application.png";
import busTripsImg from "../assets/bus_trips.png";
import lostFoundImg from "../assets/lost_found.png";
// Import the new background image
import ibtBg from "../assets/ibt_bg.png";

const LandingPage = () => {
  const scrollRef = useRef(null);

  const bottomImages = [
    { src: newAppImg, alt: 'Stall Application' },
    { src: busTripsImg, alt: 'Bus Trips' },
    { src: lostFoundImg, alt: 'Lost and Found' }
  ];

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 220 : scrollLeft + 220;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div
      className="h-screen w-full flex flex-col font-sans overflow-hidden relative selection:bg-green-200 bg-sky-300" // Added light blue base (bg-sky-100)
    >
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-60 bg-cover bg-center bg-no-repeat blur-sm scale-105"
        style={{ backgroundImage: `url(${ibtBg})` }}
      />

      {/* Header - Ensure relative and z-index to stay above background */}
      <header className="flex justify-between items-center px-6 md:px-12 py-1 relative z-50">
        <div className="flex items-center space-x-2">
          <img src={LOGO} alt="IBT Logo" className="h-8 w-8 object-contain drop-shadow-sm" />
          <h1 className="text- font-black text-gray-700 tracking-tight">Integrated Bus Terminal ZC</h1>
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
            <button className="bg-[#00a86b] hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-lg font-black uppercase transition-all duration-200 hover:scale-95 tracking-widest shadow-lg border-1 border-green">
              Download App
            </button>

            <div className="bg-white p-3 w-[72px] h-[72px] rounded-2xl shadow-lg flex-shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 21 21" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="7" height="7" fill="none" stroke="#111" strokeWidth="1"/>
                <rect x="2.5" y="2.5" width="4" height="4" fill="#111"/>
                <rect x="13" y="1" width="7" height="7" fill="none" stroke="#111" strokeWidth="1"/>
                <rect x="14.5" y="2.5" width="4" height="4" fill="#111"/>
                <rect x="1" y="13" width="7" height="7" fill="none" stroke="#111" strokeWidth="1"/>
                <rect x="2.5" y="14.5" width="4" height="4" fill="#111"/>
                <rect x="9" y="1" width="1" height="1" fill="#111"/><rect x="11" y="1" width="1" height="1" fill="#111"/>
                <rect x="9" y="3" width="2" height="1" fill="#111"/><rect x="11" y="3" width="1" height="1" fill="#111"/>
                <rect x="9" y="5" width="1" height="1" fill="#111"/><rect x="11" y="5" width="2" height="1" fill="#111"/>
                <rect x="9" y="7" width="3" height="1" fill="#111"/>
                <rect x="1" y="9" width="2" height="1" fill="#111"/><rect x="4" y="9" width="1" height="1" fill="#111"/>
                <rect x="6" y="9" width="2" height="1" fill="#111"/><rect x="9" y="9" width="1" height="1" fill="#111"/>
                <rect x="11" y="9" width="2" height="1" fill="#111"/><rect x="14" y="9" width="1" height="1" fill="#111"/>
                <rect x="16" y="9" width="2" height="1" fill="#111"/><rect x="19" y="9" width="1" height="1" fill="#111"/>
                <rect x="1" y="11" width="1" height="1" fill="#111"/><rect x="3" y="11" width="2" height="1" fill="#111"/>
                <rect x="7" y="11" width="1" height="1" fill="#111"/><rect x="9" y="11" width="2" height="1" fill="#111"/>
                <rect x="13" y="11" width="2" height="1" fill="#111"/><rect x="17" y="11" width="3" height="1" fill="#111"/>
                <rect x="9" y="13" width="1" height="1" fill="#111"/><rect x="11" y="13" width="2" height="1" fill="#111"/>
                <rect x="15" y="13" width="1" height="1" fill="#111"/><rect x="17" y="13" width="3" height="1" fill="#111"/>
                <rect x="9" y="15" width="3" height="1" fill="#111"/><rect x="13" y="15" width="1" height="1" fill="#111"/>
                <rect x="16" y="15" width="2" height="1" fill="#111"/>
                <rect x="9" y="17" width="1" height="1" fill="#111"/><rect x="12" y="17" width="2" height="1" fill="#111"/>
                <rect x="15" y="17" width="1" height="1" fill="#111"/><rect x="17" y="17" width="3" height="1" fill="#111"/>
                <rect x="9" y="19" width="2" height="1" fill="#111"/><rect x="13" y="19" width="1" height="1" fill="#111"/>
                <rect x="16" y="19" width="4" height="1" fill="#111"/>
              </svg>
            </div>
          </div>

          {/* Feature Scroller */}
          <div className="w-full">
            <p className="text-[12px] text-white-100 font-black italic mb-4 uppercase tracking-[0.1em] opacity-80">
              Process Stall Application Online!
            </p>

            <div className="relative flex items-center px-5">
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 z-40 bg-white p-2 rounded-full shadow-xl hover:scale-110 transition-transform border border-green-100"
              >
                <ChevronLeft size={18} className="text-green-700" />
              </button>

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

              <button
                onClick={() => scroll('right')}
                className="absolute right-0 z-40 bg-white p-2 rounded-full shadow-xl hover:scale-110 transition-transform border border-green-100"
              >
                <ChevronRight size={18} className="text-green-700" />
              </button>
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

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default LandingPage;