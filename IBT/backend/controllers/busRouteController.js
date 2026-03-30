import BusTrip from "../models/BusTrips.js";
import ScheduleNotArrival from "../models/ScheduleNotArrival.js";

function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function tripDateKey(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return "";
  return localDateKey(d);
}

/** "8:00 AM" -> "08:00" for mobile time display */
function scheduleTimeTo24h(str) {
  if (!str || typeof str !== "string") return "00:00";
  const m = str.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return "00:00";
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

export const getBusRoutes = async (req, res) => {
  try {
    const trips = await BusTrip.find({
      $or: [{ isArchived: false }, { isArchived: { $exists: false } }],
    }).sort({ date: 1, time: 1 });

    const dateKey = req.query.dateKey || localDateKey();
    const notArrivals = await ScheduleNotArrival.find({ dateKey }).lean();

    const activeKey = (templateNo, company, dKey) =>
      `${String(templateNo || "").trim()}|${String(company || "").trim()}|${dKey}`;

    const covered = new Set();
    for (const t of trips) {
      const dk = tripDateKey(t.date);
      if (dk !== dateKey) continue;
      covered.add(activeKey(t.templateNo, t.company, dk));
    }

    const synthetic = notArrivals
      .filter((n) => {
        const k = activeKey(n.plateNumber, n.company, n.dateKey);
        return !covered.has(k);
      })
      .map((n) => ({
        _id: `not-arrival-${n._id}`,
        templateNo: n.plateNumber,
        route: n.route,
        time: scheduleTimeTo24h(n.scheduleTime),
        date: new Date(dateKey + "T12:00:00"),
        company: n.company,
        status: "Not Arriving",
        busType: "Regular",
        notArrivalRemark: n.remark || "",
        isScheduleNotArrival: true,
        price: 0,
      }));

    res.json([...trips, ...synthetic]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
