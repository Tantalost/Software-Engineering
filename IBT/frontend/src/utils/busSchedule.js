const TIME_TOKEN = /^\d{1,2}:\d{2}\s*(AM|PM)$/i;

function expandLegacyScheduleString(str) {
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

/**
 * Bus schedule: `scheduleTimes` (array), or legacy `scheduleTime` (one time or comma-separated).
 */
export function getBusScheduleTimes(bus) {
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

export function formatBusScheduleDisplay(bus) {
  const times = getBusScheduleTimes(bus);
  return times.length ? times.join(", ") : "";
}
