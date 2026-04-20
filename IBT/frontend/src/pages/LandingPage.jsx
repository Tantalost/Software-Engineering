import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Download, QrCode, X } from 'lucide-react';
import LOGO from "../assets/LOGO.png";
import adsPhone from "../assets/ads_phone.png";
import newAppImg from "../assets/New_application.png";
import busTripsImg from "../assets/bus_trips.png";
import lostFoundImg from "../assets/lost_found.png";
import ibtBg from "../assets/ibt_bg.png";
import scanImage from '../assets/Scan.png';

const LandingPage = () => {
  const scrollRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const bottomImages = [
    {
      src: newAppImg,
      alt: 'Stall Application',
      title: 'Stall Application',
      subtitle: 'Submit and track tenant applications online.'
    },
    {
      src: busTripsImg,
      alt: 'Bus Trips',
      title: 'Live Bus Trips',
      subtitle: 'View departures, arrivals, and route activity in real-time.'
    },
    {
      src: lostFoundImg,
      alt: 'Lost and Found',
      title: 'Lost and Found',
      subtitle: 'Report, verify, and recover items through one dashboard.'
    }
  ];

  const phoneFeatureCards = [
    {
      text: '24/7 Live Monitoring',
      positionClass: 'top-20 left-1 sm:-left-20 animate-float-delay',
      toneClass: 'border-emerald-200/35 bg-emerald-300/15 text-emerald-50'
    },
    {
      text: 'Instant Smart Alerts',
      positionClass: 'top-75 left-1 sm:-left-28 -translate-y-1/2 animate-float',
      toneClass: 'border-cyan-200/35 bg-cyan-300/15 text-cyan-50'
    },
    {
      text: 'Unified Terminal Services',
      positionClass: 'top-47 right-1 sm:-right-26 animate-float-delay',
      toneClass: 'border-white/30 bg-white/15 text-slate-50'
    }
  ];

  useEffect(() => {
    const cardStep = 348;
    const autoScroll = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollTo({ left: scrollLeft + cardStep, behavior: 'smooth' });
        }
      }
    }, 3200);

    return () => clearInterval(autoScroll);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#071823] text-slate-100 selection:bg-emerald-300/40">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.2),transparent_38%),radial-gradient(circle_at_78%_18%,rgba(56,189,248,0.24),transparent_36%),linear-gradient(165deg,#071823_0%,#0B2535_48%,#0A1220_100%)]"
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${ibtBg})` }}
      />
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

      <header className="relative z-30">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur">
              <img src={LOGO} alt="IBT Logo" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <p className="text-[0.63rem] uppercase tracking-[0.28em] text-emerald-200/90">Integrated Terminal Platform</p>
              <h1 className="text-sm font-semibold text-white sm:text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Integrated Bus Terminal ZC
              </h1>
            </div>
          </div>

          <Link
            to="/login"
            className="rounded-full border border-emerald-300/50 bg-emerald-400/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-300/20"
          >
            Login Portal
          </Link>
        </div>
      </header>

      <main className="relative z-20 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-8 px-5 py-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,372px)] lg:items-start lg:gap-6 lg:py-6 pb-8">
        <section className="min-w-0 flex flex-col justify-center">
          <div>
            <span className="inline-flex rounded-full border border-emerald-200/35 bg-emerald-300/10 px-4 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.23em] text-emerald-100">
              Terminal Operations, Simplified
            </span>

            <h2
              className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.03] text-white sm:text-4xl lg:text-[3.3rem]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Real-time bus intelligence for passengers, tenants, and terminal staff.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200/85 sm:text-base">
              IBT centralizes trip tracking, stall applications, and service updates in one reliable platform so everyone can make faster, better decisions.
            </p>

            <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => setIsModalOpen(true)}
                className="group inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] text-slate-900 shadow-[0_12px_35px_rgba(16,185,129,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:ring-offset-2"
              >
                <Download size={16} />
                Download App
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/12 bg-slate-900/35 p-4 shadow-[0_20px_60px_rgba(2,8,23,0.35)] backdrop-blur-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-cyan-100/85">What You Can Do Online</p>
            </div>

            <div
              ref={scrollRef}
              className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1"
            >
              {bottomImages.map((img) => (
                <article
                  key={img.title}
                  className="group relative h-[216px] min-w-[336px] snap-start overflow-hidden rounded-2xl border border-white/20 bg-slate-900/35"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/35 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3.5">
                    <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {img.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-200/90">{img.subtitle}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column (Phone Mockup & Alerts) */}
        <section className="relative min-w-0 lg:self-start mt-10 lg:mt-6 flex flex-col items-center lg:items-end">
          <div className="relative w-full max-w-[352px]">
            
            <div className="animate-float absolute -top-3 left-3 z-20 rounded-2xl border border-white/30 bg-white/15 px-3.5 py-1.5 backdrop-blur-md">
              <p className="text-[0.62rem] uppercase tracking-[0.2em] text-emerald-100/90">Trip Alert</p>
              <p className="mt-0.5 text-xs font-semibold text-white">New Arrival at Platform 4</p>
            </div>

            <div className="pointer-events-none absolute inset-0 z-20">
              {phoneFeatureCards.map((item) => (
                <div
                  key={item.text}
                  className={`absolute max-w-[150px] rounded-xl border px-3 py-2 shadow-[0_10px_28px_rgba(2,8,23,0.35)] backdrop-blur-md ${item.positionClass} ${item.toneClass}`}
                >
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Changed: Removed max-h constraint on the image container so it looks normal on mobile */}
            <div className="relative w-full max-w-[352px] rounded-[2.1rem] border border-white/20 bg-gradient-to-b from-cyan-200/15 to-emerald-300/10 p-2.5 shadow-[0_30px_70px_rgba(8,47,73,0.45)] sm:p-2.5">
              <div className="rounded-[1.6rem] border border-white/15 bg-slate-950/45 p-1.5 backdrop-blur sm:p-1.5">
                <img
                  src={adsPhone}
                  alt="IBT mobile app interface"
                  className="w-full h-auto object-contain drop-shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
                />
              </div>
            </div>

          </div>
        </section>
      </main>

      <footer className="relative z-20 mt-auto border-t border-white/10 bg-slate-950/40 py-3 text-center">
        <p className="px-4 text-[0.6rem] uppercase tracking-[0.2em] text-slate-300/70">
          © 2026 CYNERGYOPS. All rights reserved. Privacy Policy. Terms.
        </p>
      </footer>

      {isModalOpen && (
        <div
          className="animate-overlay fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="animate-modal relative flex w-full max-w-sm flex-col items-center rounded-3xl border border-white/20 bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-800"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>

            <h3
              className="mt-2 text-center text-2xl font-semibold uppercase tracking-tight text-emerald-800"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Scan to Download
            </h3>
            <p className="mb-6 text-center text-sm font-medium text-gray-500">
              Available on Android devices
            </p>

            <div className="mb-6 flex h-64 w-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 shadow-inner">
              <img
                src={scanImage}
                alt="App QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold uppercase tracking-wider text-gray-800 transition-colors hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        /* Fonts are loaded globally in index.html and applied via src/index.css */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Global font-family moved to src/index.css for consistent production loading */

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes floatCard {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        .animate-overlay {
          animation: fadeIn 0.2s ease-out forwards;
        }

        .animate-modal {
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-float {
          animation: floatCard 3s ease-in-out infinite;
        }

        .animate-float-delay {
          animation: floatCard 3.2s ease-in-out infinite 0.6s;
        }

        @media (max-width: 1024px) {
          .animate-float,
          .animate-float-delay {
            animation-duration: 2.4s;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;