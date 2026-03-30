import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Bus, Clock, Info, ListOrdered, Undo2, X } from "lucide-react";
import { getBusScheduleTimes } from "../../utils/busSchedule.js";

const SCHEDULE_NOT_ARRIVAL_API = `${
  import.meta.env.VITE_API_URL || "http://localhost:10000"
}/api/schedule-not-arrivals`;

function parseScheduleToMinutesMidnight(str) {
  if (!str || typeof str !== "string") return null;
  const m = str.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  if (Number.isNaN(h) || h < 0 || h > 23) return null;
  const mm = Number.isNaN(min) ? 0 : Math.min(59, Math.max(0, min));
  return h * 60 + mm;
}

function minutesToHourBucket(minutesFromMidnight) {
  if (minutesFromMidnight == null) return 0;
  return Math.floor(minutesFromMidnight / 60) % 24;
}

function formatHourSlotLabel(hour24) {
  const a = new Date();
  a.setHours(hour24, 0, 0, 0);
  const b = new Date(a.getTime() + 60 * 60 * 1000);
  const o = { hour: "numeric", minute: "2-digit" };
  return `${a.toLocaleTimeString("en-US", o)} – ${b.toLocaleTimeString("en-US", o)}`;
}

function makeRowKey(company, route, scheduleTime, plateNumber) {
  return `${company}|||${route}|||${scheduleTime}|||${plateNumber}`;
}

function docToRowKey(doc) {
  return makeRowKey(
    doc.company,
    doc.route,
    doc.scheduleTime,
    doc.plateNumber,
  );
}

function formatBoardDateLabel(dateKey) {
  if (!dateKey) return "";
  const d = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * All company buses with schedule + route, sorted so the next clock hour
 * (current + 1) is listed first — prep window one hour ahead.
 */
const PredefinedArrivalsBoard = ({
  records,
  companyData,
  getDateKey,
  onConfirmArrival,
  onNotify,
}) => {
  const getDateKeyRef = useRef(getDateKey);
  useEffect(() => {
    getDateKeyRef.current = getDateKey;
  });

  const [now, setNow] = useState(() => new Date());
  /** Calendar day this board uses — advances at local midnight / on resume so rows and remarks reset for the new day. */
  const [boardDateKey, setBoardDateKey] = useState(() =>
    getDateKey(new Date()),
  );
  const [arriveRow, setArriveRow] = useState(null);
  const [arrivePlateInput, setArrivePlateInput] = useState("");
  const [notArriveRow, setNotArriveRow] = useState(null);
  const [notArriveRemark, setNotArriveRemark] = useState("");
  const [confirmingKey, setConfirmingKey] = useState(null);
  const [remarksMap, setRemarksMap] = useState({});
  const [notArriveSaving, setNotArriveSaving] = useState(false);
  const [undoingKey, setUndoingKey] = useState(null);

  const syncBoardDateFromClock = useCallback(() => {
    const k = getDateKeyRef.current(new Date());
    if (!k) return;
    setBoardDateKey((prev) => (prev !== k ? k : prev));
  }, []);

  useEffect(() => {
    syncBoardDateFromClock();
  }, [syncBoardDateFromClock]);

  useEffect(() => {
    const onResume = () => syncBoardDateFromClock();
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);
    return () => {
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);
    };
  }, [syncBoardDateFromClock]);

  const refreshNotArrivals = useCallback(async () => {
    try {
      const res = await fetch(
        `${SCHEDULE_NOT_ARRIVAL_API}?dateKey=${encodeURIComponent(boardDateKey)}`,
      );
      if (!res.ok) return;
      const rows = await res.json();
      const map = {};
      rows.forEach((doc) => {
        const rk = docToRowKey(doc);
        if (doc.remark) map[rk] = doc.remark;
      });
      setRemarksMap(map);
    } catch {
      /* ignore */
    }
  }, [boardDateKey]);

  useEffect(() => {
    setRemarksMap({});
    setArriveRow(null);
    setArrivePlateInput("");
    setNotArriveRow(null);
    setNotArriveRemark("");
    setConfirmingKey(null);
    setUndoingKey(null);
    refreshNotArrivals();
  }, [boardDateKey, refreshNotArrivals]);

  /** Any row with a saved remark blocks Arrive for every row with the same plate + company today. */
  const notArrivePlateCompanyKeys = useMemo(() => {
    const s = new Set();
    Object.entries(remarksMap).forEach(([rowKey, text]) => {
      if (!String(text || "").trim()) return;
      const parts = rowKey.split("|||");
      if (parts.length >= 4) s.add(`${parts[3]}|||${parts[0]}`);
    });
    return s;
  }, [remarksMap]);

  useEffect(() => {
    const t = setInterval(() => {
      setNow(new Date());
      syncBoardDateFromClock();
    }, 30000);
    return () => clearInterval(t);
  }, [syncBoardDateFromClock]);

  const focusBucket = (now.getHours() + 1) % 24;

  const scheduleRows = useMemo(() => {
    const out = [];
    companyData.forEach((c) => {
      c.buses?.forEach((b) => {
        if (!b?.route?.trim()) return;
        const times = getBusScheduleTimes(b);
        if (times.length === 0) return;
        times.forEach((schedRaw) => {
          const sched = schedRaw.trim();
          const msm = parseScheduleToMinutesMidnight(sched);
          if (msm === null) return;
          const hourBucket = minutesToHourBucket(msm);
          out.push({
            rowKey: makeRowKey(c.name, b.route, sched, b.plateNumber),
            company: c.name,
            route: b.route.trim(),
            scheduleTime: sched,
            plateNumber: b.plateNumber,
            busType: b.busType || "Regular",
            stopType: b.stopType || "Regular Trip",
            customStopCount: b.customStopCount,
            seatingCapacity: b.seatingCapacity ?? null,
            minutesFromMidnight: msm,
            hourBucket,
          });
        });
      });
    });

    const dist = (h) => (h - focusBucket + 24) % 24;
    out.sort((a, b) => {
      const da = dist(a.hourBucket);
      const db = dist(b.hourBucket);
      if (da !== db) return da - db;
      return a.minutesFromMidnight - b.minutesFromMidnight;
    });
    return out;
  }, [companyData, focusBucket]);

  const todayStatusByPlate = useMemo(() => {
    const m = new Map();
    for (const r of records) {
      if (getDateKey(r.date) !== boardDateKey) continue;
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
  }, [records, boardDateKey, getDateKey]);

  const openArrive = (row) => {
    setArriveRow(row);
    setArrivePlateInput(row.plateNumber || "");
  };

  const arrivalBusy =
    arriveRow && confirmingKey && confirmingKey === arriveRow.rowKey;

  const submitArrive = async () => {
    if (!arriveRow) return;
    const plate = arrivePlateInput.trim();
    if (!plate) return;

    const companyBuses = companyData.find(
      (c) => c.name === arriveRow.company,
    )?.buses;
    const validPlate = companyBuses?.some((b) => b.plateNumber === plate);
    if (!validPlate) {
      onNotify?.(
        "error",
        `Bus number "${plate}" is not registered under ${arriveRow.company}.`,
      );
      return;
    }

    const busMeta = companyBuses.find((b) => b.plateNumber === plate);
    setConfirmingKey(arriveRow.rowKey);
    try {
      await onConfirmArrival({
        templateNo: plate,
        company: arriveRow.company,
        route: busMeta?.route?.trim() || arriveRow.route,
        busType: busMeta?.busType || arriveRow.busType,
        stopType: busMeta?.stopType || arriveRow.stopType,
        customStopCount: busMeta?.customStopCount ?? arriveRow.customStopCount,
        seatingCapacity:
          busMeta?.seatingCapacity ?? arriveRow.seatingCapacity ?? null,
      });
      setArriveRow(null);
      setArrivePlateInput("");
    } finally {
      setConfirmingKey(null);
    }
  };

  const submitNotArrive = async () => {
    if (!notArriveRow) return;
    const trimmed = notArriveRemark.trim();
    if (!trimmed) {
      onNotify?.("error", "Please enter a remark (e.g. Maintenance).");
      return;
    }
    setNotArriveSaving(true);
    try {
      const res = await fetch(SCHEDULE_NOT_ARRIVAL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: boardDateKey,
          company: notArriveRow.company,
          route: notArriveRow.route,
          scheduleTime: notArriveRow.scheduleTime,
          plateNumber: notArriveRow.plateNumber,
          remark: trimmed,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        onNotify?.(
          "error",
          err.message || "Could not save. Try again.",
        );
        return;
      }
      setRemarksMap((prev) => ({
        ...prev,
        [notArriveRow.rowKey]: trimmed,
      }));
      setNotArriveRow(null);
      setNotArriveRemark("");
      onNotify?.(
        "success",
        "Recorded as not arriving. It will not appear on the dispatch board; mobile schedules will update on refresh.",
      );
    } catch {
      onNotify?.("error", "Network error saving remark.");
    } finally {
      setNotArriveSaving(false);
    }
  };

  const openNotArrive = (row) => {
    setNotArriveRow(row);
    setNotArriveRemark(remarksMap[row.rowKey] || "");
  };

  const undoNotArrival = async (row) => {
    const params = new URLSearchParams({
      dateKey: boardDateKey,
      company: row.company,
      route: row.route,
      scheduleTime: row.scheduleTime,
      plateNumber: String(row.plateNumber ?? ""),
    });
    setUndoingKey(row.rowKey);
    try {
      const res = await fetch(`${SCHEDULE_NOT_ARRIVAL_API}?${params}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        onNotify?.(
          "error",
          err.message || "Could not undo. Try again.",
        );
        return;
      }
      await refreshNotArrivals();
      onNotify?.(
        "success",
        "Not arrival removed. You can mark Arrive or Not Arrive again.",
      );
    } catch {
      onNotify?.("error", "Network error.");
    } finally {
      setUndoingKey(null);
    }
  };

  const modalLayer =
    typeof document !== "undefined" ? document.body : null;

  return (
    <div className="relative w-full rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/90 via-white to-emerald-50/30 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-start gap-3 justify-between bg-white/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-xl bg-slate-800 text-white shrink-0">
            <ListOrdered size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
              Predefined Schedule
            </h3>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              Operating day:{" "}
              <span className="text-slate-900">
                {formatBoardDateLabel(boardDateKey)}
              </span>
              <span className="text-slate-400 font-normal">
                {" "}
                — remarks and “on board” apply to this day only; the board
                resets at the next calendar day.
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <Clock size={12} className="inline shrink-0 text-emerald-600" />
              <span>
                Now{" "}
                <strong className="text-slate-700">
                  {now.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </strong>
                — next hour{" "}
                <strong className="text-emerald-700">
                  {formatHourSlotLabel(focusBucket)}
                </strong>{" "}
                is pinned to the top (1 hr prep). Earlier slots follow in order
                through end of day.
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[min(70vh,520px)] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500 bg-slate-100/90 border-b border-slate-200 sticky top-0 z-[1] shadow-sm">
            <tr>
              <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                Scheduled time
              </th>
              <th className="px-3 py-2.5 font-semibold min-w-[140px]">Route</th>
              <th className="px-3 py-2.5 font-semibold">Company</th>
              <th className="px-3 py-2.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {scheduleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-slate-500 text-sm"
                >
                  No predefined buses yet. Add buses with{" "}
                  <strong>Schedule time</strong> and <strong>route</strong> in{" "}
                  <strong>Manage Companies</strong>.
                </td>
              </tr>
            ) : (
              scheduleRows.map((row) => {
                const isPrepHour = row.hourBucket === focusBucket;
                const plateKey = `${row.plateNumber}|||${row.company}`;
                const st = todayStatusByPlate.get(plateKey);
                const loggedToday =
                  st === "Arrived" ||
                  st === "On Fix" ||
                  st === "Not Departed" ||
                  st === "Departed" ||
                  st === "Paid";
                const remark = remarksMap[row.rowKey];
                const markedNotArrive = Boolean(remark);
                const sameBusNotArriveToday =
                  notArrivePlateCompanyKeys.has(plateKey);
                const busy = confirmingKey === row.rowKey;

                return (
                  <tr
                    key={row.rowKey}
                    className={`transition-colors ${
                      isPrepHour
                        ? "bg-emerald-50/90 ring-1 ring-inset ring-emerald-200"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span
                          className={`inline-flex p-1 rounded-md ${row.busType === "Aircon" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}
                        >
                          <Bus size={14} />
                        </span>
                        {row.scheduleTime}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 font-medium">
                        Window: {formatHourSlotLabel(row.hourBucket)}
                        {isPrepHour && (
                          <span className="ml-1.5 text-emerald-700 font-semibold">
                            · Next hour prep
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-800 font-medium">
                      {row.route}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{row.company}</td>
                    <td className="px-3 py-3 text-right align-top">
                      <div className="flex flex-col sm:flex-row gap-2 justify-end items-stretch sm:items-center">
                        {remark && (
                          <span className="text-[10px] text-left sm:text-right text-amber-800 bg-amber-100 px-2 py-1 rounded-md max-w-[200px] sm:max-w-none">
                            <span className="font-semibold">Remark:</span>{" "}
                            {remark}
                          </span>
                        )}
                        {loggedToday ? (
                          <span className="inline-flex text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1.5 rounded-lg justify-center">
                            On board today
                          </span>
                        ) : sameBusNotArriveToday ? (
                          <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                            <span className="inline-flex text-xs font-semibold text-slate-700 bg-slate-200 px-2.5 py-1.5 rounded-lg">
                              Not arriving today
                            </span>
                            {markedNotArrive ? (
                              <div className="flex flex-wrap gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => openNotArrive(row)}
                                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium px-2.5 py-1.5"
                                >
                                  Edit remark
                                </button>
                                <button
                                  type="button"
                                  disabled={undoingKey === row.rowKey}
                                  onClick={() => undoNotArrival(row)}
                                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-medium px-2.5 py-1.5 disabled:opacity-60"
                                  title="Remove this not-arrival for today"
                                >
                                  <Undo2 size={14} aria-hidden />
                                  {undoingKey === row.rowKey ? "…" : "Undo"}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 text-left sm:text-right max-w-[220px]">
                                Same bus marked on another route today—Arrive is
                                disabled for all its trips.
                              </span>
                            )}
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => openArrive(row)}
                              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-2 transition-colors"
                            >
                              {busy ? "…" : "Arrive"}
                            </button>
                            <button
                              type="button"
                              onClick={() => openNotArrive(row)}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 transition-colors"
                            >
                              Not Arrive
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {arriveRow &&
        modalLayer &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95"
              role="dialog"
              aria-modal="true"
              aria-labelledby="arrive-dialog-title"
            >
              <div className="flex justify-between items-start mb-4">
                <h4
                  id="arrive-dialog-title"
                  className="text-lg font-bold text-slate-800"
                >
                  Confirm bus number
                </h4>
                <button
                  type="button"
                  onClick={() => setArriveRow(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                <strong>{arriveRow.company}</strong> · {arriveRow.route}
                <br />
                <span className="text-slate-500">
                  Scheduled {arriveRow.scheduleTime}
                </span>
              </p>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Bus number
              </label>
              <input
                type="text"
                autoFocus
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-mono font-semibold mb-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={arrivePlateInput}
                onChange={(e) => setArrivePlateInput(e.target.value)}
                placeholder="Plate / bus no."
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setArriveRow(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!arrivePlateInput.trim() || arrivalBusy}
                  onClick={submitArrive}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
                >
                  Log arrival
                </button>
              </div>
            </div>
          </div>,
          modalLayer,
        )}

      {notArriveRow &&
        modalLayer &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-bold text-slate-800">Not arriving</h4>
                <button
                  type="button"
                  onClick={() => setNotArriveRow(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                {notArriveRow.company} · {notArriveRow.route} ·{" "}
                {notArriveRow.scheduleTime}
              </p>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Remarks
              </label>
              <textarea
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[100px] mb-4 focus:ring-2 focus:ring-slate-400 outline-none resize-y"
                placeholder="e.g. Maintenance, rerouted, cancelled"
                value={notArriveRemark}
                onChange={(e) => setNotArriveRemark(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNotArriveRow(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={notArriveSaving}
                  onClick={submitNotArrive}
                  className="px-4 py-2 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-800 rounded-lg disabled:opacity-60"
                >
                  {notArriveSaving ? "Saving…" : "Save remark"}
                </button>
              </div>
            </div>
          </div>,
          modalLayer,
        )}
    </div>
  );
};

export default PredefinedArrivalsBoard;
