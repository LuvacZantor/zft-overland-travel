/** GM-client New Travel Day defaults. These are UI choices, not a rest or calendar action. */
export const DEFAULT_NEW_DAY_PREFERENCES = Object.freeze({
  timeTarget: "none", bedHour: 11, bedMinute: 0, bedPeriod: "PM", openRest: false
});
const TARGETS = new Set(["none", "sunrise", "midday", "sunset", "midnight", "custom"]);
export function normalizeNewDayPreferences(raw = {}) {
  const value = raw && typeof raw === "object" ? raw : {};
  const h = Number(value.bedHour), m = Number(value.bedMinute);
  return {
    timeTarget: TARGETS.has(value.timeTarget) ? value.timeTarget : "none",
    bedHour: Number.isInteger(h) && h >= 1 && h <= 12 ? h : 11,
    bedMinute: Number.isInteger(m) && m >= 0 && m <= 55 && m % 5 === 0 ? m : 0,
    bedPeriod: value.bedPeriod === "AM" ? "AM" : "PM",
    openRest: value.openRest === true
  };
}
