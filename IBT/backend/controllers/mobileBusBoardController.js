import Company from "../models/Company.js";
import BusTrip from "../models/BusTrips.js";
import ScheduleNotArrival from "../models/ScheduleNotArrival.js";
import { getBusScheduleTimes } from "../utils/busScheduleServer.js";

const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Manila";

function toDateKeyInAppTimezone(dateInput) {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
}

/** Same calendar key as `BusesTrips.jsx` getDateKey — matches web admin + ScheduleNotArrival.dateKey. */
export function getDateKey(dateInput) {
  if (!dateInput) return "";
  if (typeof dateInput === "string") {
    const directMatch = dateInput.match(/^(\d{4}-\d{2}-\d{2})/);
    if (directMatch) return directMatch[1];
  }
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  return toDateKeyInAppTimezone(d);
}

function makeRowKey(company, route, scheduleTime, plateNumber) {
  return `${company}|||${route}|||${scheduleTime}|||${plateNumber}`;
}

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

function rankStatus(s) {
  if (s === "Scheduled" || s === "Pending") return 1;
  if (s === "Arrived" || s === "On Fix" || s === "Not Departed") return 2;
  if (s === "Departed" || s === "Paid") return 3;
  return 0;
}

function formatStopType(stopType, customStopCount) {
  if (stopType === "Other") {
    if (customStopCount && Number(customStopCount) > 0) {
      return `${customStopCount}-stop`;
    }
    return "Other";
  }
  return stopType || "Regular Trip";
}

function dispatchDisplayStatus(raw) {
  if (raw === "On Fix") return "To Be Fixed";
  if (raw === "Paid") return "Departed";
  return raw || "";
}

/**
 * GET /api/predefined-schedule/today
 * Read-only predefined schedule rows with status aligned to the web Predefined Schedule board.
 */
export const getPredefinedScheduleToday = async (req, res) => {
  try {
    const todayKey = req.query.dateKey
      ? String(req.query.dateKey).trim()
      : getDateKey(new Date());

    if (!/^\d{4}-\d{2}-\d{2}$/.test(todayKey)) {
      return res.status(400).json({ message: "Invalid dateKey. Use YYYY-MM-DD." });
    }

    const [companies, notArrivalDocs, trips] = await Promise.all([
      Company.find().lean(),
      ScheduleNotArrival.find({ dateKey: todayKey }).lean(),
      BusTrip.find({ isArchived: { $ne: true } }).lean(),
    ]);

    const remarksMap = {};
    notArrivalDocs.forEach((doc) => {
      const rk = makeRowKey(
        doc.company,
        doc.route,
        doc.scheduleTime,
        doc.plateNumber,
      );
      if (String(doc.remark || "").trim()) remarksMap[rk] = String(doc.remark).trim();
    });

    const notArrivePlateCompanyKeys = new Set();
    Object.entries(remarksMap).forEach(([rowKey, text]) => {
      if (!String(text || "").trim()) return;
      const parts = rowKey.split("|||");
      if (parts.length >= 4) notArrivePlateCompanyKeys.add(`${parts[3]}|||${parts[0]}`);
    });

    const todayStatusByPlate = new Map();
    for (const r of trips) {
      if (getDateKey(r.date) !== todayKey) continue;
      const plate = r.templateNo || r.templateno;
      if (!plate) continue;
      const key = `${plate}|||${r.company || ""}`;
      const st = r.status;
      const prev = todayStatusByPlate.get(key);
      if (!prev || rankStatus(st) >= rankStatus(prev)) todayStatusByPlate.set(key, st);
    }

    const now = new Date();
    const focusBucket = (now.getHours() + 1) % 24;
    const dist = (h) => (h - focusBucket + 24) % 24;

    const scheduleRows = [];
    companies.forEach((c) => {
      c.buses?.forEach((b) => {
        if (!b?.route?.trim()) return;
        const times = getBusScheduleTimes(b);
        if (times.length === 0) return;
        times.forEach((schedRaw) => {
          const sched = schedRaw.trim();
          const msm = parseScheduleToMinutesMidnight(sched);
          if (msm === null) return;
          const hourBucket = minutesToHourBucket(msm);
          const rowKey = makeRowKey(c.name, b.route, sched, b.plateNumber);
          scheduleRows.push({
            rowKey,
            company: c.name,
            route: b.route.trim(),
            scheduleTime: sched,
            plateNumber: b.plateNumber,
            busType: b.busType || "Regular",
            stopType: b.stopType || "Regular Trip",
            customStopCount: b.customStopCount ?? null,
            seatingCapacity: b.seatingCapacity ?? null,
            minutesFromMidnight: msm,
            hourBucket,
          });
        });
      });
    });

    scheduleRows.sort((a, b) => {
      const da = dist(a.hourBucket);
      const db = dist(b.hourBucket);
      if (da !== db) return da - db;
      return a.minutesFromMidnight - b.minutesFromMidnight;
    });

    const entries = scheduleRows.map((row) => {
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
      const sameBusNotArriveToday = notArrivePlateCompanyKeys.has(plateKey);

      let status = "scheduled";
      if (markedNotArrive) status = "not_arrived";
      else if (sameBusNotArriveToday) status = "not_arrived";
      else if (loggedToday) status = "arrived";

      return {
        rowKey: row.rowKey,
        company: row.company,
        route: row.route,
        scheduleTime: row.scheduleTime,
        plateNumber: row.plateNumber,
        busType: row.busType,
        stopType: row.stopType,
        customStopCount: row.customStopCount,
        seatingCapacity: row.seatingCapacity,
        timeWindowLabel: formatHourSlotLabel(row.hourBucket),
        hourBucket: row.hourBucket,
        isPrepHourNext: row.hourBucket === focusBucket,
        status,
        notArrivalRemark: remark || "",
        blockedByOtherSlot: Boolean(sameBusNotArriveToday && !markedNotArrive),
      };
    });

    res.status(200).json({
      dateKey: todayKey,
      focusHourBucket: focusBucket,
      entries,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/dispatch-board/today
 * Terminal dispatch rows scheduled today (same rule as web dispatch board default view).
 */
export const getDispatchBoardToday = async (req, res) => {
  try {
    const todayKey = req.query.dateKey
      ? String(req.query.dateKey).trim()
      : getDateKey(new Date());

    if (!/^\d{4}-\d{2}-\d{2}$/.test(todayKey)) {
      return res.status(400).json({ message: "Invalid dateKey. Use YYYY-MM-DD." });
    }

    const trips = await BusTrip.find({ isArchived: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();

    const todayTrips = trips.filter((trip) => getDateKey(trip.date) === todayKey);

    const payload = todayTrips.map((item) => ({
      _id: String(item._id),
      templateNo: item.templateNo || "",
      busType: item.busType || "Regular",
      stopType: item.stopType || "Regular Trip",
      customStopCount: item.customStopCount ?? null,
      stopsLabel: formatStopType(item.stopType, item.customStopCount),
      ticketReferenceNo: item.ticketReferenceNo || "",
      route: item.route || "",
      price: item.price != null ? Number(item.price) : 75,
      seatingCapacity: item.seatingCapacity ?? null,
      parkingEstimation: item.parkingEstimation || "",
      expectedDeparture: item.expectedDeparture || "",
      time: item.time || "",
      departureTime: item.departureTime || "",
      company: item.company || "",
      status: item.status || "",
      displayStatus: dispatchDisplayStatus(item.status),
      date: item.date,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    res.status(200).json({
      dateKey: todayKey,
      trips: payload,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
