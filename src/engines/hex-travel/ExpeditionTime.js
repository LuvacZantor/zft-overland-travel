/** Optional expedition time management. No calendar or rest module is required. */
export const CLOCK_DESTINATIONS = Object.freeze(["none", "sunrise", "midday", "sunset", "midnight", "custom"]);

/** Calculates only the idle-time jump to the next occurrence, never rest duration. */
export function nextClockTarget(destination, {
  hour, minute = 0, ampm = "PM", currentHour, currentMinute = 0,
  sunrise = null, sunset = null, hoursPerDay = 24, minutesPerHour = 60
} = {}) {
  if (!CLOCK_DESTINATIONS.includes(destination)) throw new Error("Unknown time destination.");
  if (destination === "none") return { seconds: 0, targetHour: null, nextDay: false };
  if (hoursPerDay !== 24 || minutesPerHour !== 60) {
    throw new Error("Bedtime selection requires a standard 24-hour day and 60-minute hours.");
  }
  let targetHour;
  if (destination === "sunrise" || destination === "sunset") {
    targetHour = Number(destination === "sunrise" ? sunrise : sunset);
    if ((destination === "sunrise" ? sunrise : sunset) == null || !Number.isFinite(targetHour) || targetHour < 0 || targetHour >= 24)
      throw new Error(`${destination === "sunrise" ? "Sunrise" : "Sunset"} is unavailable in the active calendar.`);
  } else if (destination === "midday") targetHour = 12;
  else if (destination === "midnight") targetHour = 0;
  else {
    const h = Number(hour), m = Number(minute);
    if (!Number.isInteger(h) || h < 1 || h > 12 || !Number.isInteger(m) || m < 0 || m > 59 || !["AM","PM"].includes(ampm))
      throw new Error("Choose a valid custom time and AM/PM period.");
    targetHour = (h % 12) + (ampm === "PM" ? 12 : 0) + m / 60;
  }
  const ch = Number(currentHour), cm = Number(currentMinute);
  if (!Number.isInteger(ch) || ch < 0 || ch >= 24 || !Number.isInteger(cm) || cm < 0 || cm >= 60)
    throw new Error("The current Foundry calendar time is unavailable.");
  const current = ch * 3600 + cm * 60;
  const target = Math.round(targetHour * 3600);
  const nextDay = target <= current;
  return { seconds: target - current + (nextDay ? 86400 : 0), targetHour, nextDay };
}

export function clockText(hourDecimal) {
  if (hourDecimal == null || !Number.isFinite(hourDecimal)) return "—";
  let mins = Math.round(hourDecimal * 60) % 1440;
  if (mins < 0) mins += 1440;
  const hour24 = Math.floor(mins / 60);
  return `${String(hour24 % 12 || 12)}:${String(mins % 60).padStart(2, "0")} ${hour24 < 12 ? "AM" : "PM"}`;
}

export function readExpeditionClock(gameObj = game, calendaria = globalThis.CALENDARIA?.api) {
  const components = gameObj.time?.components ?? {};
  const days = calendaria?.calendar?.days ?? gameObj.time?.calendar?.days ?? {};
  return {
    currentHour: components.hour, currentMinute: components.minute,
    hoursPerDay: days.hoursPerDay ?? 24, minutesPerHour: days.minutesPerHour ?? 60,
    sunrise: typeof calendaria?.getSunrise === "function" ? calendaria.getSunrise() : null,
    sunset: typeof calendaria?.getSunset === "function" ? calendaria.getSunset() : null
  };
}

/** Single authoritative clock mutation; a successful result must change worldTime. */
export async function advanceExpeditionClock(destination, options = {}, gameObj = game, calendaria = globalThis.CALENDARIA?.api) {
  if (!gameObj.user?.isGM) throw new Error("Only a GM can advance expedition time.");
  const value = nextClockTarget(destination, { ...readExpeditionClock(gameObj, calendaria), ...options });
  if (!value.seconds) return value;
  const before = gameObj.time.worldTime;
  if (!Number.isFinite(before)) throw new Error("Foundry world time is unavailable.");
  if (gameObj.modules?.get?.("calendaria")?.active && typeof calendaria?.advanceTime === "function") {
    await calendaria.advanceTime(value.seconds);
  } else if (typeof gameObj.time.advance === "function") {
    await gameObj.time.advance(value.seconds);
  } else throw new Error("No supported world-time advancement API is available.");
  if (!Number.isFinite(gameObj.time.worldTime) || gameObj.time.worldTime < before + value.seconds - 1)
    throw new Error("World time did not reach the requested bedtime. The expedition day was not started.");
  return value;
}

export function hasRestRecovery(gameObj = game) {
  return Boolean(gameObj.modules?.get?.("rest-recovery")?.active && typeof gameObj.restrecovery?.renderPromptRestInterface === "function");
}

/** Opens the provider's configuration; it never directly alters Actor resources. */
export async function openPartyRestRecovery(gameObj = game) {
  if (!gameObj.user?.isGM || !hasRestRecovery(gameObj)) throw new Error("Rest Recovery 5e is not available for the GM.");
  const application = await gameObj.restrecovery.renderPromptRestInterface();
  if (!application) throw new Error("Rest Recovery did not open its GM rest interface.");
  return application;
}

/** Move only newly committed travel hours, never total rolled hex duration or rest time. */
export async function advanceTravelClockHours(hours, gameObj = game, calendaria = globalThis.CALENDARIA?.api) {
  if (!gameObj.user?.isGM) throw new Error("Only a GM can advance expedition time.");
  if (!Number.isSafeInteger(hours) || hours < 1 || hours > 24) throw new Error("Travel hours must be 1–24 whole hours.");
  const seconds = hours * 3600;
  const before = Number(gameObj.time?.worldTime);
  if (!Number.isFinite(before)) throw new Error("Foundry world time is unavailable.");
  if (gameObj.modules?.get?.("calendaria")?.active && typeof calendaria?.advanceTime === "function")
    await calendaria.advanceTime(seconds);
  else if (typeof gameObj.time?.advance === "function") await gameObj.time.advance(seconds);
  else throw new Error("No world-time advancement API is available.");
  if (!Number.isFinite(gameObj.time?.worldTime) || gameObj.time.worldTime < before + seconds - 1)
    throw new Error("The Foundry clock did not advance the expected travel duration.");
  return { before, after: gameObj.time.worldTime, seconds };
}
