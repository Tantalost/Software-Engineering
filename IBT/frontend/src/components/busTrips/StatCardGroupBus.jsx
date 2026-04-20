import React, { useEffect, useRef, useState } from "react";
import StatCard from "../tenants/StatCard";
import {
  formatTwoDecimalAmount,
} from "../../utils/currencyDisplay";
import {
  Bus,
  CalendarClock,
  CheckCircle,
  MapPin,
  PhilippinePeso,
  AlertTriangle,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const StatCardGroupBus = ({
  totalTrips,
  predefinedSchedules,
  arrivedTrips,
  paidTrips,
  maintenanceTrips,
  totalRevenue,
  missedTrips,
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
  }, [
    totalTrips,
    predefinedSchedules,
    arrivedTrips,
    paidTrips,
    maintenanceTrips,
    totalRevenue,
    missedTrips,
  ]);

  useEffect(() => {
    const handleResize = () => updateScrollState();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollStats = (direction) => {
    if (!statsScrollRef.current) return;
    statsScrollRef.current.scrollBy({
      left: direction * 280,
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
          aria-label="Scroll stat cards left"
        >
          <ChevronLeft size={16} />
        </button>

        <div
          ref={statsScrollRef}
          onScroll={updateScrollState}
          className="stats-scroll-area flex overflow-x-auto gap-4 pb-2 w-full snap-x scroll-smooth"
        >
          <div className="min-w-[180px] sm:min-w-[220px] flex-shrink-0 snap-start">
            <StatCard title="Total Trips" value={totalTrips} icon={Bus} color="cyan" />
          </div>

          <div className="min-w-[180px] sm:min-w-[220px] flex-shrink-0 snap-start">
            <StatCard title="Predefined Schedule" value={predefinedSchedules} icon={CalendarClock} color="orange" />
          </div>

          <div className="min-w-[180px] sm:min-w-[220px] flex-shrink-0 snap-start">
            <StatCard title="Arrived" value={arrivedTrips} icon={MapPin} color="purple" />
          </div>

          <div className="min-w-[180px] sm:min-w-[220px] flex-shrink-0 snap-start">
            <StatCard title="Departed" value={paidTrips} icon={CheckCircle} color="emerald" />
          </div>

          <div className="min-w-[180px] sm:min-w-[220px] flex-shrink-0 snap-start">
            <StatCard title="Under Maintenance" value={maintenanceTrips || 0} icon={Wrench} color="red" />
          </div>

          <div className="min-w-[180px] sm:min-w-[220px] flex-shrink-0 snap-start">
            <StatCard title="Missed Buses" value={missedTrips || 0} icon={AlertTriangle} color="orange" />
          </div>

          <div className="min-w-[180px] sm:min-w-[220px] flex-shrink-0 snap-start">
            <StatCard 
              title="Revenue" 
              value={formatTwoDecimalAmount(totalRevenue)} 
              icon={PhilippinePeso} 
              color="orange" 
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollStats(1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
          aria-label="Scroll stat cards right"
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

export default StatCardGroupBus;