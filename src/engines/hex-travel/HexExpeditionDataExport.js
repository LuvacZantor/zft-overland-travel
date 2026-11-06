/** GM-only read-only expedition history export for audit and later odds analysis.
 * Uses established world settings; it never saves, clears, rerolls or advances a job.
 * Pure snapshot construction is separate from the browser download adapter.
 */
import { MODULE_ID, MODULE_VERSION } from "../../constants/module-constants.js";

export const EXPEDITION_EXPORT_SCHEMA = "zft-expedition-data-v1";
const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const plain = value => value === undefined ? null : JSON.parse(JSON.stringify(value));

/** Preserve exact source records, plus a compact idempotently keyed analysis view.
 * A missing Event roll-selection mode must stay unknown; it is not evidence of
 * an unforced random roll. No history is reconstructed from timestamps.
 */
export function buildExpeditionDataSnapshot({ ledger, travelCards, logVisibility, dashboardSnapshot,
  calendar, identity, displayProgress, moduleVersion = MODULE_VERSION,
  foundryVersion = null, systemId = null, systemVersion = null, worldId = null,
  worldTime = null, exportedAt = new Date().toISOString() } = {}) {
  if (!isObject(ledger)) throw new Error("The saved travel ledger is unavailable.");
  const saved = plain(ledger);
  const store = isObject(saved.hexRecords) ? saved.hexRecords : null;
  const records = Array.isArray(store?.records) ? store.records : [];
  const complications = Array.isArray(store?.complications) ? store.complications : [];
  const byHex = new Map();
  for (const complication of complications) {
    const key = complication?.sourceHexRecordId;
    if (typeof key !== "string" || !key) continue;
    if (!byHex.has(key)) byHex.set(key, []);
    byHex.get(key).push(complication);
  }
  const hexes = records.map(record => ({
    id: record.id, number: record.number, status: record.status,
    start: plain(record.start), completedAt: record.completedAt ?? null,
    pace: plain(record.context?.pace), difficulty: plain(record.context?.difficulty),
    navigation: plain(record.navigation),
    reconnaissance: plain(record.roles?.reconnaissance),
    support: plain(record.roles?.support),
    travelQuality: plain(record.travelQuality), momentum: plain(record.momentum),
    event: plain(record.event), eventResolution: plain(record.eventResolution),
    travel: plain(record.travel), complications: plain(byHex.get(record.id) ?? []),
    // Older Event records do not persist whether a GM forced the d20 result.
    // Never mix these unknown-origin results into an unforced RNG analysis.
    eventRollSelectionMode: record.event?.rollControlMode ?? record.event?.rollMode ?? null
  }));
  const eventsByType = {};
  for (const record of hexes) {
    const type = record.event?.type;
    if (typeof type === "string" && type) eventsByType[type] = (eventsByType[type] ?? 0) + 1;
  }
  const cards = plain(travelCards);
  const savedCardCount = Array.isArray(cards?.cards) ? cards.cards.length : 0;
  return {
    format: EXPEDITION_EXPORT_SCHEMA,
    exportedAt: String(exportedAt),
    source: {
      moduleId: MODULE_ID, moduleVersion: String(moduleVersion),
      foundryVersion, systemId, systemVersion, worldId, worldTime,
      scope: "Saved world state at export time, not a new diagnostic stream"
    },
    statistics: {
      recordedHexes: hexes.length,
      completedHexes: hexes.filter(hex => hex.status === "completed").length,
      interruptedHexes: hexes.filter(hex => hex.status === "interrupted").length,
      eventTypes: eventsByType,
      storedTravelCards: savedCardCount,
      storedComplications: complications.length,
      storedForcedMarchEntries: Array.isArray(saved.marchHistory) ? saved.marchHistory.length : 0,
      unknownEventRollModes: hexes.filter(hex => hex.event && hex.eventRollSelectionMode === null).length
    },
    limitations: [
      "Event die selection modes for older records were not persisted. Unknown does not imply a random roll.",
      "Earlier reroll attempts and transient prompts may not be stored; final outcomes and saved rulings are authoritative.",
      "Stored visual travel cards are capped by the existing module; structured hex records may contain older hexes.",
      "Exported files from later sessions may overlap. Deduplicate hexes by worldId and stable hex id before analysis."
    ],
    hexes,
    savedState: {
      ledger: saved, travelCards: cards,
      logVisibility: plain(logVisibility), dashboardSnapshot: plain(dashboardSnapshot),
      calendar: plain(calendar), identity: plain(identity), displayProgress: plain(displayProgress)
    }
  };
}

/** Read only known module-owned settings on the GM client and download JSON.
 * Do not print records to the developer console or modify any world data.
 */
export function exportExpeditionDataFromFoundry() {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can export expedition data.");
  const read = key => game.settings.get(MODULE_ID, key);
  const data = buildExpeditionDataSnapshot({
    ledger: read("hexTravelLedger"),
    travelCards: read("hexTravelCards"),
    logVisibility: read("hexTravelLogVisibility"),
    dashboardSnapshot: read("hexTravelSnapshot"),
    calendar: read("hexTravelCalendar"),
    identity: read("hexTravelIdentity"),
    displayProgress: read("hexTravelDisplayProgress"),
    moduleVersion: game.modules.get(MODULE_ID)?.version ?? MODULE_VERSION,
    foundryVersion: game.version ?? null,
    systemId: game.system?.id ?? null,
    systemVersion: game.system?.version ?? null,
    worldId: game.world?.id ?? null,
    worldTime: Number.isFinite(Number(game.time?.worldTime)) ? Number(game.time.worldTime) : null
  });
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date(data.exportedAt));
  const field = name => dateParts.find(part => part.type === name)?.value ?? "00";
  const filename = `zft-expedition-data_${field("year")}${field("month")}${field("day")}-${field("hour")}${field("minute")}.json`;
  const json = JSON.stringify(data, null, 2);
  if (typeof globalThis.saveDataToFile === "function") {
    globalThis.saveDataToFile(json, "application/json", filename);
  } else {
    if (typeof globalThis.Blob !== "function" || !globalThis.URL?.createObjectURL || !globalThis.document?.createElement)
      throw new Error("This browser does not support file downloads.");
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    try {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.hidden = true;
      document.body.appendChild(anchor);
      try { anchor.click(); } finally { anchor.remove(); }
    } finally {
      globalThis.setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  }
  return { filename, recordedHexes: data.statistics.recordedHexes };
}
