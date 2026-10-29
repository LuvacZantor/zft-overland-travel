/** Read-only expedition clock and daylight presentation. No timers or state writes. */
export function timeLabel(hour, minute = 0, second = null) {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) return "—";
  if (second !== null && (!Number.isInteger(second) || second < 0 || second > 59)) return "—";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")}${second === null ? "" : `:${String(second).padStart(2, "0")}`} ${hour < 12 ? "AM" : "PM"}`;
}
function duration(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) return "an unknown amount of time";
  const total = Math.round(minutes);
  const h = Math.floor(total / 60), m = total % 60;
  if (h && m) return `${h} ${h === 1 ? "hour" : "hours"}, ${m} ${m === 1 ? "minute" : "minutes"}`;
  if (h) return `${h} ${h === 1 ? "hour" : "hours"}`;
  return `${m} ${m === 1 ? "minute" : "minutes"}`;
}
/** Follow Calendaria HUD's per-role formatting using its public formatDate API. */
export function formatCalendariaHud({api, components, displayFormats, isGM = false, location = "hudTime"} = {}) {
  if (typeof api?.formatDate !== "function" || !components || !Number.isFinite(components.hour)) return "";
  try {
    const calendar = typeof api.getActiveCalendar === "function" ? api.getActiveCalendar() : null;
    const localSettings = displayFormats?.[location];
    let format = (isGM ? localSettings?.gm : localSettings?.player) ||
      (location === "hudTime" ? "time24" : "ordinal");
    if (format === "calendarDefault") format = calendar?.dateFormats?.[location === "hudTime" ? "time" : "long"] ||
      (location === "hudTime" ? "time24" : "dateLong");
    const pub = {
      ...components,
      year: Number(components.year ?? 0) + Number(calendar?.years?.yearZero ?? 0),
      month: Number(components.month ?? 0) + 1,
      day: Number(components.dayOfMonth ?? 0) + 1
    };
    const result = api.formatDate(pub, format);
    return typeof result === "string" ? result.trim() : "";
  } catch { return ""; }
}
/** Daylight labels and travel estimates are informative, not commands or penalties. */
export function expeditionClockView({hour, minute = 0, sunrise = null, sunset = null,
  remainingHours = null, hoursPerDay = 24, minutesPerHour = 60} = {}) {
  const clock = timeLabel(hour, minute);
  if (clock === "—") return {clock, daylight:"Daylight information is unavailable.", eta:"", nightNote:""};
  const hours = Number(remainingHours);
  const active = remainingHours != null && Number.isSafeInteger(hours) && hours > 0 && hours <= 1000;
  if (hoursPerDay !== 24 || minutesPerHour !== 60) return {
    clock, daylight:"Daylight information is unavailable for this calendar.",
    eta:active ? "Estimated arrival is unavailable for this calendar." : "", nightNote:""
  };
  const now = hour * 60 + minute;
  const rise = typeof sunrise === "number" && Number.isFinite(sunrise) && sunrise >= 0 && sunrise < 24 ? Math.round(sunrise * 60) : null;
  const set = typeof sunset === "number" && Number.isFinite(sunset) && sunset >= 0 && sunset < 24 ? Math.round(sunset * 60) : null;
  const daylightValid = rise !== null && set !== null && rise < set;
  let daylight = "Daylight information is unavailable.";
  if (daylightValid) {
    if (now < rise) daylight = `Sunrise is at ${timeLabel(Math.floor(rise / 60), rise % 60)} (in ${duration(rise - now)}).`;
    else if (now < set) daylight = `Sunset is at ${timeLabel(Math.floor(set / 60), set % 60)} (in ${duration(set - now)}).`;
    else daylight = `Sunset was at ${timeLabel(Math.floor(set / 60), set % 60)} (${duration(now - set)} ago).`;
  }
  if (!active) return {clock, daylight, eta:"", nightNote:""};
  const target = now + hours * 60;
  const dayOffset = Math.floor(target / 1440);
  const minutes = target % 1440;
  const arrival = timeLabel(Math.floor(minutes / 60), minutes % 60);
  const when = dayOffset === 0 ? "today" : dayOffset === 1 ? "tomorrow" : `in ${dayOffset} days`;
  const crossesDark = daylightValid && (now >= set || target > set || now < rise);
  const nightNote = crossesDark ? "Continuing this hex may require travel after dark. No automatic penalty applies." : "";
  return {clock, daylight, eta:`Estimated arrival: ${arrival} ${when} (${duration(hours * 60)} of travel remaining).`, nightNote};
}
