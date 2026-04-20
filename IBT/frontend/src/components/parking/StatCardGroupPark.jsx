import React, { useEffect, useRef, useState } from "react";
import StatCard from "../tenants/StatCard";
import {
  Car,
  Bike,
  Bus,
  CarFront,
  PhilippinePesoIcon,
  MapPin,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const StatCardGroupPark = ({
  cars,
  motorcycles,
  jeeps,
  parked,
  departed,
  totalVehicles,
  totalRevenue,
}) => {
  const statsScrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);
  const OBLONG_TRACK_WIDTH = 112;
  const OBLONG_THUMB_WIDTH = 36;

  const updateScrollState = () => {
    if (!statsScrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = statsScrollRef.current;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);

    setIsScrollable(maxScroll > 0);
    setScrollProgress(maxScroll === 0 ? 0 : scrollLeft / maxScroll);
  };

  useEffect(() => {
    updateScrollState();
  }, [cars, motorcycles, jeeps, parked, departed, totalVehicles, totalRevenue]);

  useEffect(() => {
    const handleResize = () => updateScrollState();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollStats = (direction) => {
    const container = statsScrollRef.current;
    if (!container) return;

    const targetLeft = direction > 0 ? container.scrollWidth : 0;
    container.scrollTo({
      left: targetLeft,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full mb-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => scrollStats(-1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
          aria-label="Scroll parking stat cards left"
        >
          <ChevronLeft size={16} />
        </button>

        <div
          ref={statsScrollRef}
          onScroll={updateScrollState}
          className="stats-scroll-area flex overflow-x-auto gap-4 pb-2 w-full snap-x scroll-smooth"
        >
          <div className="min-w-[240px] shrink-0 snap-start">
            <StatCard icon={Car} title="4 Wheels" value={cars} color="cyan" />
          </div>
          <div className="min-w-[240px] shrink-0 snap-start">
            <StatCard icon={Bike} title="2 Wheels" value={motorcycles} color="orange" />
          </div>
          <div className="min-w-[240px] shrink-0 snap-start">
            <StatCard icon={Bus} title="Jeeps" value={jeeps} color="green" />
          </div>

          <div className="min-w-[240px] shrink-0 snap-start">
            <StatCard icon={MapPin} title="Parked" value={parked} color="blue" />
          </div>
          <div className="min-w-[240px] shrink-0 snap-start">
            <StatCard icon={LogOut} title="Departed" value={departed} color="slate" />
          </div>

          <div className="min-w-[240px] shrink-0 snap-start">
            <StatCard icon={CarFront} title="Total Vehicles" value={totalVehicles} color="black" />
          </div>
          <div className="min-w-[240px] shrink-0 snap-start">
            <StatCard
              icon={PhilippinePesoIcon}
              value={`₱${(totalRevenue || 0).toFixed(2)}`}
              title="Revenue"
              color="emerald"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollStats(1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
          aria-label="Scroll parking stat cards right"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {isScrollable && (
        <div className="mt-1 flex justify-center">
          <div
            className="h-2 rounded-full bg-emerald-900/35"
            style={{ width: `${OBLONG_TRACK_WIDTH}px` }}
          >
            <div
              className="h-2 rounded-full bg-gradient-to-r from-emerald-200 to-green-400 transition-transform duration-100 ease-out"
              style={{
                width: `${OBLONG_THUMB_WIDTH}px`,
                transform: `translateX(${scrollProgress * (OBLONG_TRACK_WIDTH - OBLONG_THUMB_WIDTH)}px)`,
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        .stats-scroll-area {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .stats-scroll-area::-webkit-scrollbar {
          display: none;
        }
      `}</style>

    </div>
  );
};

export default StatCardGroupPark;