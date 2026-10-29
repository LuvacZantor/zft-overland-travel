/** One-time, idempotent transition from historical Chapter 4 setting IDs.
 * Original keys remain untouched for rollback; runtime uses only Hex Travel IDs.
 * All old references are confined to this migration adapter. */
import { MODULE_ID } from "../constants/module-constants.js";

const MIGRATIONS = Object.freeze([
  { ns: "world", old: "mountIronrotTravelV45", next: "hexTravelLedger", scope: "world", fallback: { day: 1, hours: 0, pending: 0, hexes: 0 } },
  { ns: MODULE_ID, old: "ironrotConsoleSnapshot", next: "hexTravelSnapshot", scope: "world", fallback: { phase: "Expedition ready", detail: "", state: null, updatedAt: 0 } },
  { ns: MODULE_ID, old: "ironrotAttendance", next: "hexTravelAttendance", scope: "world", fallback: { excludedActorUuids: [] } },
  { ns: MODULE_ID, old: "ironrotIdentity", next: "hexTravelIdentity", scope: "world", fallback: { name: "Overland Expedition", region: "", world: "" } },
  { ns: MODULE_ID, old: "ironrotTravelCards", next: "hexTravelCards", scope: "world", fallback: { cards: [] } },
  { ns: MODULE_ID, old: "ironrotShowPlayers", next: "hexTravelShowPlayers", scope: "world", fallback: { requestedAt: 0 } },
  { ns: MODULE_ID, old: "ironrotRolePreferences", next: "hexTravelRolePreferences", scope: "world", fallback: { navigatorUuid: "", secondaryUuid: "", activity: "none", assignments: {} } },
  { ns: MODULE_ID, old: "ironrotHexDisplayProgress", next: "hexTravelDisplayProgress", scope: "world", fallback: { totalHours: 0, baseHexes: 0 } },
  { ns: MODULE_ID, old: "ironrotLogVisibility", next: "hexTravelLogVisibility", scope: "world", fallback: { epoch: 0, hiddenHistoryKeys: [], hiddenHourKey: "", recordedDays: [] } },
  { ns: MODULE_ID, old: "ironrotTravelCalendar", next: "hexTravelCalendar", scope: "world", fallback: { datesByDay: {} } },
  { ns: MODULE_ID, old: "ironrotConsoleUi", next: "hexTravelUi", scope: "client", fallback: {} }
]);

// Only rewrite framework-owned HTML class/attribute markers in replicated
// presentation fragments. Preserve user content, dice, totals, and record IDs.
export function migrateHexMarkup(value) {
  if (typeof value === "string") return value
    .replaceAll("zft-ironrot-", "zft-hex-travel-")
    .replaceAll("zft-ir-", "zft-hex-")
    .replaceAll("data-ir-", "data-hex-")
    .replaceAll("--zft-ir-", "--zft-hex-");
  if (Array.isArray(value)) return value.map(migrateHexMarkup);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, migrateHexMarkup(entry)]));
  return value;
}

export function registerHexTravelLegacySettings() {
  for (const item of MIGRATIONS) {
    const full = `${item.ns}.${item.old}`;
    if (game.settings.settings.has(full)) continue;
    game.settings.register(item.ns, item.old, {
      name: "Historical Hex Travel setting (migration only)",
      scope: item.scope, config: false, type: Object, default: item.fallback
    });
  }
}

/** Inspect the *saved* setting, not its registered default.
 * Foundry V13 world storage is a Collection of Setting documents (.get),
 * whereas client storage is browser Storage (.getItem). Using .get on the
 * client store stopped ready initialization in 0.4.0-dev.63. */
function hasSavedValue(scope, namespace, key) {
  const storage = game.settings.storage.get(scope);
  if (!storage) throw new Error(`Foundry ${scope} settings storage unavailable`);
  const id = `${namespace}.${key}`;
  if (scope === "client") {
    if (typeof storage.getItem !== "function")
      throw new Error("Foundry client settings storage does not support getItem");
    const saved = storage.getItem(id);
    return saved !== null && saved !== undefined;
  }
  if (scope === "world") {
    if (typeof storage.get !== "function")
      throw new Error("Foundry world settings storage does not support get");
    const saved = storage.get(id);
    return saved !== undefined && saved !== null;
  }
  throw new Error(`Unsupported setting scope: ${scope}`);
}

export async function migrateHexTravelSettings() {
  for (const item of MIGRATIONS) {
    if (item.scope === "world" && !game.user?.isGM) continue;
    try {
      // A completed write from a previous or interrupted migration wins.
      // Do not reset world or client changes on reload.
      if (hasSavedValue(item.scope, MODULE_ID, item.next)) continue;
      if (!hasSavedValue(item.scope, item.ns, item.old)) continue;
      const original = game.settings.get(item.ns, item.old);
      const migrated = migrateHexMarkup(foundry.utils.deepClone(original));
      await game.settings.set(MODULE_ID, item.next, migrated);
      if (!hasSavedValue(item.scope, MODULE_ID, item.next))
        throw new Error(`Migration write was not saved for ${MODULE_ID}.${item.next}`);
      console.info(`[ZFT][HexTravel] Migrated saved ${item.scope} setting: ${item.next}`);
    } catch (error) {
      // A broken client preference must not lock the user out of Hex Travel.
      // The historical client value remains untouched, so migration can retry
      // after the underlying browser storage problem is corrected.
      if (item.scope === "client") {
        console.warn(`[ZFT][HexTravel] Client preference migration deferred: ${item.next}`, error);
        continue;
      }
      // World data is authoritative. Avoid starting an empty expedition when
      // the existing ledger/history could not be migrated correctly.
      throw new Error(`World setting migration failed: ${item.next}`, { cause: error });
    }
  }
}
