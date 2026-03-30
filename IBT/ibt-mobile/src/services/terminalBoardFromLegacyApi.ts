/**
 * When `/predefined-schedule/today` and `/dispatch-board/today` are not deployed (404),
 * builds the same payloads from legacy routes: companies, bustrips, schedule-not-arrivals.
 * Logic mirrors `backend/controllers/mobileBusBoardController.js`.
 */

import type { PredefinedEntry, DispatchTrip } from '../types/terminalBoard.types';

/** Same as web `BusesTrips.jsx` / backend `getDateKey`. */
export function getDateKey(dateInput: string | Date | undefined | null): string {
  if (dateInput == null) return '';
  if (typeof dateInput === 'string') {
    const directMatch = dateInput.match(/^(\d{4}-\d{2}-\d{2})/);
    if (directMatch) return directMatch[1];
  }
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

const TIME_TOKEN = /^\d{1,2}:\d{2}\s*(AM|PM)$/i;

function expandLegacyScheduleString(str: string): string[] {
  const s = String(str).trim();
  if (!s) return [];
  const parts = s
    .split(/\s*,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  const valid = parts.filter((p) => TIME_TOKEN.test(p));
  if (valid.length > 0) return valid;
  return [s];
}

function getBusScheduleTimes(bus: {
  scheduleTimes?: string[];
  scheduleTime?: string;
}): string[] {
  if (!bus) return [];
  const arr = bus.scheduleTimes;
  if (Array.isArray(arr) && arr.length > 0) {
    return arr.map((t) => String(t).trim()).filter(Boolean);
  }
  const legacy = bus.scheduleTime;
  if (legacy != null && String(legacy).trim()) {
    return expandLegacyScheduleString(String(legacy));
  }
  return [];
}

function makeRowKey(company: string, route: string, scheduleTime: string, plateNumber: string): string {
  return `${company}|||${route}|||${scheduleTime}|||${plateNumber}`;
}

function parseScheduleToMinutesMidnight(str: string): number | null {
  if (!str || typeof str !== 'string') return null;
  const m = str.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  if (Number.isNaN(h) || h < 0 || h > 23) return null;
  const mm = Number.isNaN(min) ? 0 : Math.min(59, Math.max(0, min));
  return h * 60 + mm;
}

function minutesToHourBucket(minutesFromMidnight: number | null): number {
  if (minutesFromMidnight == null) return 0;
  return Math.floor(minutesFromMidnight / 60) % 24;
}

function formatHourSlotLabel(hour24: number): string {
  const a = new Date();
  a.setHours(hour24, 0, 0, 0);
  const b = new Date(a.getTime() + 60 * 60 * 1000);
  const o: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${a.toLocaleTimeString('en-US', o)} – ${b.toLocaleTimeString('en-US', o)}`;
}

function rankStatus(s: string): number {
  if (s === 'Scheduled' || s === 'Pending') return 1;
  if (s === 'Arrived' || s === 'On Fix' || s === 'Not Departed') return 2;
  if (s === 'Departed' || s === 'Paid') return 3;
  return 0;
}

function formatStopType(stopType: string | undefined, customStopCount: number | null | undefined): string {
  if (stopType === 'Other') {
    if (customStopCount && Number(customStopCount) > 0) {
      return `${customStopCount}-stop`;
    }
    return 'Other';
  }
  return stopType || 'Regular Trip';
}

function dispatchDisplayStatus(raw: string | undefined): string {
  if (raw === 'On Fix') return 'To Be Fixed';
  if (raw === 'Paid') return 'Departed';
  return raw || '';
}

type CompanyDoc = {
  name: string;
  buses?: Array<{
    plateNumber: string;
    route?: string;
    busType?: string;
    stopType?: string;
    customStopCount?: number | null;
    seatingCapacity?: number | null;
    scheduleTimes?: string[];
    scheduleTime?: string;
  }>;
};

type BusTripDoc = {
  _id: string;
  isArchived?: boolean;
  templateNo?: string;
  templateno?: string;
  company?: string;
  route?: string;
  date?: string | Date;
  status?: string;
  createdAt?: string | Date;
  busType?: string;
  stopType?: string;
  customStopCount?: number | null;
  ticketReferenceNo?: string;
  price?: number;
  seatingCapacity?: number | null;
  parkingEstimation?: string;
  expectedDeparture?: string;
  time?: string;
  departureTime?: string;
};

type NotArrivalDoc = {
  company: string;
  route: string;
  scheduleTime: string;
  plateNumber: string;
  remark?: string;
};

export function buildPredefinedEntries(
  companies: CompanyDoc[],
  trips: BusTripDoc[],
  notArrivalDocs: NotArrivalDoc[],
  todayKey: string
): PredefinedEntry[] {
  const activeTrips = trips.filter((t) => t.isArchived !== true);
  const remarksMap: Record<string, string> = {};
  notArrivalDocs.forEach((doc) => {
    const rk = makeRowKey(doc.company, doc.route, doc.scheduleTime, doc.plateNumber);
    if (String(doc.remark || '').trim()) remarksMap[rk] = String(doc.remark).trim();
  });

  const notArrivePlateCompanyKeys = new Set<string>();
  Object.entries(remarksMap).forEach(([rowKey, text]) => {
    if (!String(text || '').trim()) return;
    const parts = rowKey.split('|||');
    if (parts.length >= 4) notArrivePlateCompanyKeys.add(`${parts[3]}|||${parts[0]}`);
  });

  const todayStatusByPlate = new Map<string, string>();
  for (const r of activeTrips) {
    if (getDateKey(r.date) !== todayKey) continue;
    const plate = r.templateNo || r.templateno;
    if (!plate) continue;
    const key = `${plate}|||${r.company || ''}`;
    const st = r.status || '';
    const prev = todayStatusByPlate.get(key);
    if (!prev || rankStatus(st) >= rankStatus(prev)) todayStatusByPlate.set(key, st);
  }

  const now = new Date();
  const focusBucket = (now.getHours() + 1) % 24;
  const dist = (h: number) => (h - focusBucket + 24) % 24;

  type Row = {
    rowKey: string;
    company: string;
    route: string;
    scheduleTime: string;
    plateNumber: string;
    busType: string;
    stopType: string;
    customStopCount: number | null;
    seatingCapacity: number | null;
    minutesFromMidnight: number;
    hourBucket: number;
  };

  const scheduleRows: Row[] = [];
  companies.forEach((c) => {
    c.buses?.forEach((b) => {
      const routeTrim = b?.route?.trim();
      if (!routeTrim) return;
      const times = getBusScheduleTimes(b);
      if (times.length === 0) return;
      times.forEach((schedRaw) => {
        const sched = schedRaw.trim();
        const msm = parseScheduleToMinutesMidnight(sched);
        if (msm === null) return;
        const hourBucket = minutesToHourBucket(msm);
        const plate = String(b.plateNumber ?? '');
        const rowKey = makeRowKey(c.name, routeTrim, sched, plate);
        scheduleRows.push({
          rowKey,
          company: c.name,
          route: routeTrim,
          scheduleTime: sched,
          plateNumber: plate,
          busType: b.busType || 'Regular',
          stopType: b.stopType || 'Regular Trip',
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

  return scheduleRows.map((row) => {
    const plateKey = `${row.plateNumber}|||${row.company}`;
    const st = todayStatusByPlate.get(plateKey);
    const loggedToday =
      st === 'Arrived' ||
      st === 'On Fix' ||
      st === 'Not Departed' ||
      st === 'Departed' ||
      st === 'Paid';
    const remark = remarksMap[row.rowKey];
    const markedNotArrive = Boolean(remark);
    const sameBusNotArriveToday = notArrivePlateCompanyKeys.has(plateKey);

    let status: PredefinedEntry['status'] = 'scheduled';
    if (markedNotArrive) status = 'not_arrived';
    else if (sameBusNotArriveToday) status = 'not_arrived';
    else if (loggedToday) status = 'arrived';

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
      notArrivalRemark: remark || '',
      blockedByOtherSlot: Boolean(sameBusNotArriveToday && !markedNotArrive),
    };
  });
}

export function buildDispatchTrips(trips: BusTripDoc[], todayKey: string): DispatchTrip[] {
  const active = trips.filter((t) => t.isArchived !== true);
  const todayTrips = active.filter((trip) => getDateKey(trip.createdAt) === todayKey);

  return todayTrips.map((item) => ({
    _id: String(item._id),
    templateNo: item.templateNo || '',
    busType: item.busType || 'Regular',
    stopType: item.stopType || 'Regular Trip',
    customStopCount: item.customStopCount ?? null,
    stopsLabel: formatStopType(item.stopType, item.customStopCount),
    ticketReferenceNo: item.ticketReferenceNo || '',
    route: item.route || '',
    price: item.price != null ? Number(item.price) : 75,
    seatingCapacity: item.seatingCapacity ?? null,
    parkingEstimation: item.parkingEstimation || '',
    expectedDeparture: item.expectedDeparture || '',
    time: item.time || '',
    departureTime: item.departureTime || '',
    company: item.company || '',
    status: item.status || '',
    displayStatus: dispatchDisplayStatus(item.status),
    date: item.date,
    createdAt: item.createdAt,
    updatedAt: undefined,
  }));
}

async function parseJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Fetches companies + bustrips + not-arrivals and builds entries + dispatch trips.
 * Throws if any required request fails.
 */
export async function fetchTerminalBoardFromLegacyApi(apiBase: string): Promise<{
  entries: PredefinedEntry[];
  trips: DispatchTrip[];
  dateKey: string;
}> {
  const todayKey = getDateKey(new Date());
  const [companiesRes, tripsRes, notRes] = await Promise.all([
    fetch(`${apiBase}/companies`),
    fetch(`${apiBase}/bustrips`),
    fetch(`${apiBase}/schedule-not-arrivals?dateKey=${encodeURIComponent(todayKey)}`),
  ]);

  if (!companiesRes.ok) {
    throw new Error(`companies HTTP ${companiesRes.status}`);
  }
  if (!tripsRes.ok) {
    throw new Error(`bustrips HTTP ${tripsRes.status}`);
  }
  if (!notRes.ok) {
    throw new Error(`schedule-not-arrivals HTTP ${notRes.status}`);
  }

  const companies = (await parseJson<CompanyDoc[]>(companiesRes)) || [];
  const trips = (await parseJson<BusTripDoc[]>(tripsRes)) || [];
  const notArrivals = (await parseJson<NotArrivalDoc[]>(notRes)) || [];

  const entries = buildPredefinedEntries(companies, trips, notArrivals, todayKey);
  const dispatchList = buildDispatchTrips(trips, todayKey);

  return { entries, trips: dispatchList, dateKey: todayKey };
}
