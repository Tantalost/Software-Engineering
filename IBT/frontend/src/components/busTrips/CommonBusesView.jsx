import React, { useEffect, useMemo, useState } from "react";
import { Bus, Clock, Sparkles, Info } from "lucide-react";

const formatStopType = (stopType, customStopCount) => {
  if (stopType === "Other") {
    if (customStopCount && Number(customStopCount) > 0) {
      return `${customStopCount}-stop`;
    }
    return "Other";
  }
  return stopType || "Regular Trip";
};

/** Parse stored trip time to hour 0–23 (supports 24h and AM/PM). */
function parseTimeToHour(timeStr) {
  if (!timeStr) return null;
  const s = String(timeStr).trim();
  const m = s.match(/(\d{1,2})\s*:\s*(\d{2})/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  if (Number.isNaN(h)) return null;
  const hasAm = /\bam\b/i.test(s);
  const hasPm = /\bpm\b/i.test(s);
  if (hasPm) {
    if (h !== 12) h += 12;
  } else if (hasAm) {
    if (h === 12) h = 0;
  }
  return ((h % 24) + 24) % 24;
}

function formatHourRangeLabel(hour) {
  const start = new Date();
  start.setHours(hour, 0, 0, 0);
  const end = new Date();
  end.setHours(hour + 1, 0, 0, 0);
  const opts = { hour: "numeric", minute: "2-digit" };
  return `${start.toLocaleTimeString("en-US", opts)} – ${end.toLocaleTimeString("en-US", opts)}`;
}

const COMPLETED = ["Departed", "Paid", "Arrived"];

function avgTimeForRecords(list) {
  if (!list.length) return "—";
  let totalMin = 0;
  let n = 0;
  for (const r of list) {
    const h = parseTimeToHour(r.time);
    if (h === null) continue;
    const m = String(r.time).match(/:\s*(\d{2})/);
    const mins = m ? parseInt(m[1], 10) : 0;
    totalMin += h * 60 + mins;
    n += 1;
  }
  if (!n) return "—";
  const avg = Math.round(totalMin / n);
  const hh = Math.floor(avg / 60) % 24;
  const mm = avg % 60;
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/**
 * Top 3 buses for route + hour from historical completed trips.
 * Fills from adjacent hours, then route-wide frequency, if needed.
 */
function computePredictedBuses(records, route, hour, daysBack = 90) {
  if (!route || hour === null || hour === undefined) return [];

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - daysBack);

  const pool = records.filter((r) => {
    if (r.isArchived) return false;
    if (!COMPLETED.includes(r.status)) return false;
    if ((r.route || "").trim() !== route.trim()) return false;
    const d = new Date(r.date);
    if (Number.isNaN(d.getTime()) || d < cutoff) return false;
    return true;
  });

  const plateCompany = (r) => {
    const plate = r.templateNo || r.templateno;
    return plate ? `${plate}|||${r.company || ""}` : null;
  };

  const bump = (map, key, rec, weight) => {
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, {
        key,
        templateNo: rec.templateNo || rec.templateno,
        company: rec.company,
        route: rec.route,
        busType: rec.busType,
        stopType: rec.stopType,
        customStopCount: rec.customStopCount,
        score: 0,
        samples: [],
      });
    }
    const entry = map.get(key);
    entry.score += weight;
    entry.samples.push(rec);
    // Prefer latest metadata
    entry.busType = rec.busType || entry.busType;
    entry.stopType = rec.stopType || entry.stopType;
    entry.customStopCount =
      rec.customStopCount != null ? rec.customStopCount : entry.customStopCount;
  };

  const scored = new Map();

  for (const r of pool) {
    const th = parseTimeToHour(r.time);
    if (th === null) continue;
    const key = plateCompany(r);
    let w = 0;
    if (th === hour) w = 4;
    else if (Math.abs(th - hour) === 1) w = 1.5;
    else if (Math.abs(th - hour) === 2) w = 0.4;
    else w = 0.12;
    bump(scored, key, r, w);
  }

  const used = new Set();
  const out = [];

  const takeSorted = (sourceMap) =>
    [...sourceMap.values()].sort((a, b) => b.score - a.score);

  for (const row of takeSorted(scored)) {
    if (out.length >= 3) break;
    const id = row.key;
    if (used.has(id)) continue;
    used.add(id);
    const hourSamples = row.samples.filter(
      (s) => parseTimeToHour(s.time) === hour,
    );
    const basis = hourSamples.length ? hourSamples : row.samples;
    out.push({
      ...row,
      typicalTime: avgTimeForRecords(basis.slice(0, 20)),
      tripSamples: basis.length,
    });
  }

  return out;
}

/**
 * Inline predictive arrivals board: hourly windows, route, top 3 suggestions, one-click Arrived.
 */
const PredictiveArrivalsBoard = ({
  records,
  companyData,
  getDateKey,
  onConfirmArrival,
}) => {
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedHour, setSelectedHour] = useState(() => new Date().getHours());
  const [confirmingKey, setConfirmingKey] = useState(null);

  const routeOptions = useMemo(() => {
    const set = new Set();
    companyData.forEach((c) => {
      c.buses?.forEach((b) => {
        if (b.route?.trim()) set.add(b.route.trim());
      });
    });
    records.forEach((r) => {
      if (r.route?.trim()) set.add(String(r.route).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [companyData, records]);

  useEffect(() => {
    if (!selectedRoute && routeOptions.length) {
      setSelectedRoute(routeOptions[0]);
    }
  }, [routeOptions, selectedRoute]);

  const predictions = useMemo(
    () => computePredictedBuses(records, selectedRoute, selectedHour),
    [records, selectedRoute, selectedHour],
  );

  const todayKey = getDateKey(new Date());

  const todayStatusByPlate = useMemo(() => {
    const m = new Map();
    for (const r of records) {
      if (getDateKey(r.date) !== todayKey) continue;
      const plate = r.templateNo || r.templateno;
      if (!plate) continue;
      const key = `${plate}|||${r.company || ""}`;
      const st = r.status;
      const prev = m.get(key);
      const rank = (s) => {
        if (s === "Scheduled" || s === "Pending") return 1;
        if (s === "Arrived" || s === "On Fix" || s === "Not Departed") return 2;
        if (s === "Departed" || s === "Paid") return 3;
        return 0;
      };
      if (!prev || rank(st) >= rank(prev)) m.set(key, st);
    }
    return m;
  }, [records, todayKey, getDateKey]);

  const hourOptions = useMemo(() => {
    return Array.from({ length: 24 }, (_, h) => ({
      value: h,
      label: formatHourRangeLabel(h),
    }));
  }, []);

  const handleArrived = async (row) => {
    const key = row.key;
    if (confirmingKey) return;
    setConfirmingKey(key);
    try {
      await onConfirmArrival({
        templateNo: row.templateNo,
        company: row.company,
        route: row.route,
        busType: row.busType,
        stopType: row.stopType,
        customStopCount: row.customStopCount,
      });
    } finally {
      setConfirmingKey(null);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-slate-50/90 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-emerald-100/80 flex flex-wrap items-center gap-3 justify-between bg-white/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
              Predictive arrivals
            </h3>
            <p className="text-xs text-slate-500 hidden sm:block">
              Hourly window + route → top 3 likely buses from past trips. Tap
              Arrived when the bus shows up; skip the rest by doing nothing.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Clock size={14} className="text-emerald-600 shrink-0" />
            <select
              value={selectedHour}
              onChange={(e) => setSelectedHour(Number(e.target.value))}
              className="text-sm font-medium border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-800 max-w-[220px]"
            >
              {hourOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="flex-1 min-w-[160px] text-sm font-medium border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-800"
          >
            {routeOptions.length === 0 ? (
              <option value="">Add company routes first</option>
            ) : (
              routeOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-100 flex items-start gap-2">
        <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
        <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">
          Suggestions use completed trips from the last 90 days for this route
          and time window. Delayed or missing buses need no action—only confirm
          what actually arrives.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500 bg-slate-100/90 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Bus No.</th>
              <th className="px-3 py-2.5 font-semibold">Company</th>
              <th className="px-3 py-2.5 font-semibold hidden sm:table-cell">
                Type / Stop
              </th>
              <th className="px-3 py-2.5 font-semibold hidden md:table-cell">
                Usual time
              </th>
              <th className="px-3 py-2.5 font-semibold text-right">Confirm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {predictions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500 text-sm"
                >
                  No history for this route and hour yet. Once trips complete in
                  this window, predictions appear here.
                </td>
              </tr>
            ) : (
              predictions.map((row) => {
                const st = todayStatusByPlate.get(row.key);
                const arrivedToday =
                  st === "Arrived" ||
                  st === "On Fix" ||
                  st === "Not Departed" ||
                  st === "Departed" ||
                  st === "Paid";
                const busy = confirmingKey === row.key;
                return (
                  <tr key={row.key} className="hover:bg-emerald-50/40">
                    <td className="px-3 py-3">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span
                          className={`inline-flex p-1 rounded-md ${row.busType === "Aircon" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}
                        >
                          <Bus size={14} />
                        </span>
                        {row.templateNo}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 sm:hidden">
                        {formatStopType(row.stopType, row.customStopCount)} ·{" "}
                        {row.typicalTime}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-700 font-medium">
                      {row.company}
                    </td>
                    <td className="px-3 py-3 text-slate-600 hidden sm:table-cell">
                      <div>{row.busType || "Regular"}</div>
                      <div className="text-xs text-slate-500">
                        {formatStopType(row.stopType, row.customStopCount)}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600 hidden md:table-cell">
                      {row.typicalTime}
                      <span className="text-slate-400 text-xs ml-1">
                        ({row.tripSamples} trips)
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {arrivedToday ? (
                        <span className="inline-flex text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                          Logged today
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleArrived(row)}
                          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-2 min-w-[88px] transition-colors"
                        >
                          {busy ? "…" : "Arrived"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PredictiveArrivalsBoard;
