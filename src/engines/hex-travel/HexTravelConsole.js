/**
 * Hex Travel Engine expedition interface (V13).
 * Persistent expedition presentation remains independent of the generic Travel Manager.
 * GM publishes a compact world-setting snapshot; player clients render read-only.
 * Each stable card is reconciled individually; the floating window isn't re-rendered.
 */
import { MODULE_ID, MODULE_TITLE } from "../../constants/module-constants.js";
import { launchHexTravel } from "./HexTravelEngine.js";
import { hexTravelD20Total, decorateLegacyHexTravelDice } from "./HexTravelDice.js";
import { HEX_TRAVEL_ACTIVITIES, HEX_TRAVEL_NAVIGATION_SKILL, EXPEDITION_PAIRS, EXPEDITION_ROLES } from "./HexTravelRoles.js";
import { DEFAULT_HEX_DIFFICULTY_PREFERENCES } from "./HexDifficulty.js";
import { DEFAULT_NEW_DAY_PREFERENCES } from "./NewTravelDayPreferences.js";
import { hexHoursForId } from "./HexTravelHourHistory.js";
import { expeditionClockView, formatCalendariaHud, timeLabel } from "./ExpeditionClockDisplay.js";
import { ThemeManager } from "../../theme/ThemeManager.js";
import { ThemeEditor } from "../../theme/ThemeEditor.js";
import { playHexTravelCue } from "./HexTravelAudio.js";
import { registerHexCompletionNoticeSettings, initializeHexCompletionNotices, notifyHexCompletion } from "./HexTravelCompletionNotices.js";

const STATE_KEY = "hexTravelLedger";
const SNAPSHOT_KEY = "hexTravelSnapshot";
const ATTENDANCE_KEY = "hexTravelAttendance";
const UI_KEY = "hexTravelUi";
const DEFAULT_INTERFACE_SCALE = 100;
const interfaceScale = raw => {
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(150, Math.max(60, Math.round(value))) : DEFAULT_INTERFACE_SCALE;
};
const IDENTITY_KEY = "hexTravelIdentity";
const CARDS_KEY = "hexTravelCards";
const SHOW_KEY = "hexTravelShowPlayers";
const ROLE_KEY = "hexTravelRolePreferences";
const HEX_KEY = "hexTravelDisplayProgress";
const DIFFICULTY_PREF_KEY = "hexTravelDifficultyPreferences";
const NEW_DAY_PREF_KEY = "hexTravelNewDayPreferences";
const LOG_KEY = "hexTravelLogVisibility";
const CALENDAR_KEY = "hexTravelCalendar";
// Foundry V13's world calendar is the date authority. Store the displayed
// date once per travel day, so later calendar changes do not rewrite history.
// Keep legacy startDate only as a read-only fallback for pre-upgrade records.
const DEFAULT_CALENDAR = { datesByDay: {} };
function currentFoundryDate() {
  // Calendaria supplies the displayed calendar year (including yearZero).
  // Do not persist raw game.time.components.year: it can be zero while the
  // active Harptos calendar shows 1501 DR.
  const calendaria = globalThis.CALENDARIA?.api;
  if (typeof calendaria?.getCurrentDateTime === "function" && typeof calendaria?.formatDate === "function") {
    try {
      const displayed = calendaria.getCurrentDateTime();
      const formatted = calendaria.formatDate(displayed, "dateLong");
      if (typeof formatted === "string" && formatted.trim()) return formatted.trim();
    } catch (error) { console.warn("[ZFT][HexTravel] Calendaria date unavailable:", error); }
    // Do not silently record an incorrect raw year while Calendaria is active.
    return "";
  }
  const time = game.time;
  const calendar = time?.calendar;
  if (!calendar || !Number.isFinite(time.worldTime)) return "";
  const timestamp = time.worldTime;
  // Compatibility when Calendaria is not installed. Prefer the world's own
  // formatted date, then Simple Calendar's public display representation.
  try {
    const simple = globalThis.SimpleCalendar?.api?.getCurrentDate?.();
    const display = simple?.display;
    if (typeof display?.date === "string" && display.date.trim()) {
      const date = display.date.trim();
      const year = String(display.year ?? simple.year ?? "").trim();
      return year && !date.includes(year) ? `${date}, ${year}` : date;
    }
  } catch (error) { console.warn("[ZFT][HexTravel] Simple Calendar unavailable:", error); }
  try {
    const date = calendar.format(timestamp, "date");
    if (typeof date === "string" && date.trim()) return date.trim();
  } catch (error) { console.warn("[ZFT][HexTravel] Native calendar format unavailable:", error); }
  // Deliberately omit raw year fallback: it is not guaranteed to be the
  // calendar's displayed year, and saved dates must not be fabricated.
  return "";
}
function legacyCalendarDate(day, settings) {
  const raw = String(settings.startDate ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const start = new Date(`${raw}T00:00:00.000Z`);
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0,10) !== raw) return "";
  const offset = Number(day) - Math.max(1, Math.trunc(Number(settings.startDay) || 1));
  if (!Number.isInteger(offset) || Math.abs(offset) > 100000) return "";
  const date = new Date(start.getTime() + offset * 86400000);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0,10) : "";
}
function calendarDate(day) {
  const settings = game.settings.get(MODULE_ID, CALENDAR_KEY) ?? DEFAULT_CALENDAR;
  const key = String(day);
  const stored = settings.datesByDay?.[key];
  if (typeof stored === "string" && stored.trim()) return stored.trim();
  // Only the active day may use a live calendar fallback before its first
  // GM-authored event. Never assign today's date to an earlier travel day.
  const currentDay = Number(game.settings.get("zft-overland-travel", STATE_KEY)?.day ?? 1);
  if (Number(day) === currentDay) return currentFoundryDate() || legacyCalendarDate(day, settings);
  return legacyCalendarDate(day, settings);
}
async function resyncCurrentTravelDate() {
  if (!game.user?.isGM) return false;
  const day = Number(getLedger().day);
  if (!Number.isSafeInteger(day) || day < 1) return false;
  const date = currentFoundryDate();
  if (!date) return false;
  const saved = game.settings.get(MODULE_ID, CALENDAR_KEY) ?? DEFAULT_CALENDAR;
  await game.settings.set(MODULE_ID, CALENDAR_KEY, {
    ...saved, datesByDay: { ...saved.datesByDay, [String(day)]: date }
  });
  return true;
}
async function recordFoundryTravelDay(day) {
  if (!game.user?.isGM || !Number.isSafeInteger(Number(day)) || Number(day) < 1) return;
  const key = String(day);
  const saved = game.settings.get(MODULE_ID, CALENDAR_KEY) ?? DEFAULT_CALENDAR;
  if (saved.datesByDay?.[key]) return;
  const date = currentFoundryDate();
  if (!date) return;
  await game.settings.set(MODULE_ID, CALENDAR_KEY, {
    ...saved, datesByDay: { ...saved.datesByDay, [key]: date }
  });
}
/** The active date remains provisional while Rest Recovery has not yet
 * advanced the clock. Previously recorded expedition-day dates never drift. */
function displayedTravelDayDate(day, snapshot = getSnapshot()) {
  const stored = (game.settings.get(MODULE_ID, CALENDAR_KEY) ?? DEFAULT_CALENDAR).datesByDay?.[String(day)];
  if (typeof stored === "string" && stored.trim()) return stored.trim();
  const current = Number(getLedger().day);
  const live = calendarDate(day);
  if (Number(day) === current && snapshot?.phase === "New travel day awaiting rest") {
    const prior = calendarDate(current - 1);
    if (live && prior && live === prior) return "Date pending Long Rest";
  }
  return live || "Date not recorded";
}
/** Freeze the departing day's real calendar date before any optional bedtime
 * advance. This also preserves zero-travel days for the historical Log. */
export async function preserveDepartingTravelDayDate(day) {
  await recordFoundryTravelDay(day);
}
function dateAndDay(day) {
  const n = Number(day);
  if (!Number.isSafeInteger(n) || n < 1) return "Date not recorded";
  const date = calendarDate(n);
  return `Day ${n}${date ? ` · ${date}` : ""}`;
}
let cardWrites = Promise.resolve();
const queueCardWrite = job => { const next = cardWrites.catch(() => {}).then(job); cardWrites = next; return next; };

let workflowGeneration = 0;
export const hexTravelGeneration = () => workflowGeneration;
export const invalidateHexTravelWorkflows = () => { HexTravelConsole.cancelPendingRolls(); return ++workflowGeneration; };
const DEFAULT_IDENTITY = { name: "Overland Expedition", region: "", world: "" };
const EMPTY_CARDS = { cards: [] };
const DEFAULT_LEDGER = { day: 1, hours: 0, pending: 0, hexes: 0 };
const EMPTY_SNAPSHOT = { phase: "Expedition ready", detail: "", state: null, updatedAt: 0 };

const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);
const num = value => Math.max(0, Number(value) || 0);

export function assignedRoster() {
  const roster = new Map();
  for (const user of game.users.players) {
    const actor = user.character;
    if (actor?.type === "character" && !roster.has(actor.uuid)) roster.set(actor.uuid, actor);
  }
  return [...roster.values()];
}

export function registerHexTravelSettings() {
  registerHexCompletionNoticeSettings();
  // Register the macro's existing ledger for *all* clients so late-joining
  // players can display the latest state without ever running the GM macro.
  if (!game.settings.settings.has(`${MODULE_ID}.${STATE_KEY}`)) {
    game.settings.register(MODULE_ID, STATE_KEY, {
      name: "Hex Travel ledger", scope: "world", config: false,
      type: Object, default: DEFAULT_LEDGER,
      onChange: () => HexTravelConsole.refresh()
    });
  }
  game.settings.register(MODULE_ID, SNAPSHOT_KEY, {
    name: "Hex Travel console status", scope: "world", config: false,
    type: Object, default: EMPTY_SNAPSHOT,
    onChange: () => HexTravelConsole.refresh()
  });
  game.settings.register(MODULE_ID, ATTENDANCE_KEY, {
    name: "Hex Travel present PCs", scope: "world", config: false,
    type: Object, default: { excludedActorUuids: [] },
    onChange: () => HexTravelConsole.refresh()
  });
  game.settings.register(MODULE_ID, IDENTITY_KEY, {
    name: "Expedition display identity", scope: "world", config: false,
    type: Object, default: DEFAULT_IDENTITY,
    onChange: () => HexTravelConsole.refresh()
  });
  game.settings.register(MODULE_ID, CARDS_KEY, {
    name: "Current expedition travel cards", scope: "world", config: false,
    type: Object, default: EMPTY_CARDS,
    onChange: () => HexTravelConsole.refresh()
  });
  game.settings.register(MODULE_ID, ROLE_KEY, {
    name: "Expedition role preferences", scope: "world", config: false,
    type: Object, default: { navigatorUuid: "", secondaryUuid: "", activity: "none", assignments: {} },
    onChange: () => HexTravelConsole.refresh()
  });
  game.settings.register(MODULE_ID, HEX_KEY, {
    name: "Current hex elapsed-time display", scope: "world", config: false,
    type: Object, default: { totalHours: 0, baseHexes: 0 },
    onChange: () => HexTravelConsole.refresh()
  });
  // GM-side UI draft only, never authoritative expedition or travel state.
  game.settings.register(MODULE_ID, DIFFICULTY_PREF_KEY, {
    name: "Last Hex Travel navigation difficulty selections", scope: "client", config: false,
    type: Object, default: DEFAULT_HEX_DIFFICULTY_PREFERENCES
  });
  game.settings.register(MODULE_ID, NEW_DAY_PREF_KEY, {
    name: "Last New Travel Day time and rest choices", scope: "client", config: false,
    type: Object, default: DEFAULT_NEW_DAY_PREFERENCES
  });
  game.settings.register(MODULE_ID, "hexTravelSoundEnabled", {
    name: "Hex Travel audio cues",
    hint: "Optional, GM-only local confirmation sounds for navigation outcomes, Forced March prompts, and completed hexes. Off by default; no player broadcast.",
    scope: "client", config: true, type: Boolean, default: false
  });
  game.settings.register(MODULE_ID, "hexTravelSoundVolume", {
    name: "Hex Travel sound volume",
    hint: "Volume for the optional local Hex Travel cues (0 = silent, 1 = full volume).",
    scope: "client", config: true, type: Number, default: 0.35,
    range: { min: 0, max: 1, step: 0.05 }
  });
  game.settings.register(MODULE_ID, "hexTravelAdvanceWorldTime", {
    name: "Advance world time during Hex Travel",
    hint: "GM-controlled, off by default. Completed travel hours move Foundry world time. Partial hexes and Forced March are recorded once; Rest Recovery remains separately responsible for Long Rests.",
    scope: "world", config: true, type: Boolean, default: false
  });
  game.settings.register(MODULE_ID, CALENDAR_KEY, {
    name: "Foundry world-calendar travel dates", scope: "world", config: false,
    type: Object, default: DEFAULT_CALENDAR,
    onChange: () => HexTravelConsole.refresh()
  });
  game.settings.register(MODULE_ID, LOG_KEY, {
    name: "Expedition log visibility", scope: "world", config: false,
    type: Object, default: { epoch: 0, hiddenHistoryKeys: [], hiddenHourKey: "", recordedDays: [] },
    onChange: () => HexTravelConsole.refresh()
  });
  game.settings.register(MODULE_ID, SHOW_KEY, {
    name: "GM display request", scope: "world", config: false,
    type: Object, default: { requestedAt: 0 },
    onChange: data => { if (!game.user?.isGM && data?.requestedAt) void HexTravelConsole.showWorkspace(); }
  });
  game.settings.register(MODULE_ID, UI_KEY, {
    name: "Overland Travel interface preferences", scope: "client", config: false,
    type: Object, default: { mode: "hidden", left: 160, top: 80, logWidth: 540, logHeight: 650, logHeightManual: false, logDocked: true, logHidden: false, workflowWidth: 405, workflowDocked: true, workflowHidden: false, rosterCollapsed: false, interfaceScale: DEFAULT_INTERFACE_SCALE, interfaceScaleStep: 5 }
  });
}

export function hexTravelIdentity() {
  const stored = game.settings.get(MODULE_ID, IDENTITY_KEY) ?? {};
  return {
    name: (String(stored.name ?? "").trim() || DEFAULT_IDENTITY.name).slice(0, 100),
    region: String(stored.region ?? "").trim().slice(0, 100),
    world: String(stored.world ?? "").trim().slice(0, 100)
  };
}
export function hexTravelLogEpoch() {
  return Number(game.settings.get(MODULE_ID, LOG_KEY)?.epoch ?? 0);
}
export function hexTravelRolePreferences() {
  return game.settings.get(MODULE_ID, ROLE_KEY) ?? { navigatorUuid: "", secondaryUuid: "", activity: "none", assignments: {} };
}
export async function rememberHexTravelRoles(preferences) {
  if (!game.user?.isGM) return;
  await game.settings.set(MODULE_ID, ROLE_KEY, {
    navigatorUuid: String(preferences.navigatorUuid ?? ""),
    secondaryUuid: String(preferences.secondaryUuid ?? ""),
    activity: String(preferences.activity ?? "none"),
    assignments: Object.fromEntries(Object.entries(preferences.assignments ?? {}).filter(([key]) => key in EXPEDITION_ROLES).map(([key,uuid]) => [key,String(uuid ?? "")]))
  });
}

export { notifyHexCompletion };

export { playHexTravelCue };

export async function rememberHexProgress(totalHours, baseHexes) {
  if (!game.user?.isGM) return;
  await game.settings.set(MODULE_ID, HEX_KEY, {
    totalHours: Math.max(0, Number(totalHours) || 0),
    baseHexes: Math.max(0, Number(baseHexes) || 0)
  });
}
export async function publishHexTravelCard(cardId, html, stage = "started", epoch = hexTravelLogEpoch(), metadata = {}) {
  if (!game.user?.isGM) return;
  return queueCardWrite(async () => {
    // A clear invalidates all cards from workflows begun before that clear.
    if (epoch !== hexTravelLogEpoch()) return;
    await recordFoundryTravelDay(Number(metadata.day));
    const settings = game.settings.get(MODULE_ID, CARDS_KEY) ?? EMPTY_CARDS;
    const list = [...(settings.cards ?? [])];
    const previous = list.findIndex(item => item.id === cardId);
    const now = Date.now();
    const earlier = previous >= 0 ? list[previous] : null;
    const incomingDay = Number(metadata.day);
    const day = Number.isSafeInteger(incomingDay) && incomingDay >= 1 ? incomingDay : (earlier?.day ?? null);
    const card = {
      ...earlier, id: cardId, html, stage, updatedAt: now,
      createdAt: earlier?.createdAt ?? now,
      completedAt: stage === "complete" ? (earlier?.completedAt ?? now) : earlier?.completedAt,
      day,
      travelHour: Number.isFinite(Number(metadata.travelHour)) ? Number(metadata.travelHour) : (earlier?.travelHour ?? null),
      difficulty: metadata.difficulty ? foundry.utils.deepClone(metadata.difficulty) : (earlier?.difficulty ?? null),
      navigation: metadata.navigation ? foundry.utils.deepClone(metadata.navigation) : (earlier?.navigation ?? null)
    };
    if (previous >= 0) list[previous] = card;
    else list.push(card);
    await game.settings.set(MODULE_ID, CARDS_KEY, { cards: list.slice(-15) });
  });
}
export async function removeHexTravelCard(cardId, epoch = hexTravelLogEpoch()) {
  if (!game.user?.isGM) return;
  return queueCardWrite(async () => {
    if (epoch !== hexTravelLogEpoch()) return;
    const list = game.settings.get(MODULE_ID, CARDS_KEY)?.cards ?? [];
    await game.settings.set(MODULE_ID, CARDS_KEY, { cards: list.filter(item => item.id !== cardId) });
  });
}
/** Only expedition presentation is cleared. Native Foundry Chat is untouched. */
export async function clearHexTravelExpeditionLog() {
  if (!game.user?.isGM) throw new Error("Only a GM may clear the expedition log.");
  return queueCardWrite(async () => {
    const st = getLedger();
    const old = game.settings.get(MODULE_ID, LOG_KEY) ?? {};
    const hiddenHistoryKeys = new Set(old.hiddenHistoryKeys ?? []);
    for (const h of (st.marchHistory ?? [])) hiddenHistoryKeys.add(`${h.day}:${h.hour}`);
    await game.settings.set(MODULE_ID, LOG_KEY, {
      epoch: Math.max(0, Number(old.epoch) || 0) + 1,
      hiddenHistoryKeys: [...hiddenHistoryKeys],
      hiddenHourKey: `${st.day}:${st.hours}`,
      recordedDays: []
    });
    await game.settings.set(MODULE_ID, CARDS_KEY, { cards: [] });
  });
}
/** Save only days that actually occurred in this expedition. No invented rolls,
 * no fabricated calendar dates, and no automatic world-time advancement.
 * The prior day is recorded on an explicit New Travel Day boundary even if it
 * never produced a travel card or a Forced March entry. */
async function recordExpeditionLogDays(day, phase = "") {
  if (!game.user?.isGM) return;
  const current = Number(day);
  if (!Number.isSafeInteger(current) || current < 1) return;
  const old = game.settings.get(MODULE_ID, LOG_KEY) ?? {};
  const existing = Array.isArray(old.recordedDays) ? old.recordedDays : [];
  const days = new Set(existing.filter(value => Number.isSafeInteger(value) && value >= 1));
  days.add(current);
  if (["New travel day", "New travel day awaiting rest"].includes(phase) && current > 1) days.add(current - 1);
  if (days.size === existing.length && [...days].every(value => existing.includes(value))) return;
  await game.settings.set(MODULE_ID, LOG_KEY, {
    ...old, recordedDays: [...days].sort((a, b) => a - b)
  });
}

/** Called on the GM only. No player privileges or socket endpoints needed. */
export async function publishHexTravelSnapshot(state, phase = "Travel status", detail = "") {
  if (!game.user?.isGM) return;
  // A GM may advance to bedtime, then use Rest Recovery to cross midnight.
  // Keep the new day's calendar date live until the next actual travel event.
  if (phase !== "New travel day awaiting rest") await recordFoundryTravelDay(Number(state?.day));
  await recordExpeditionLogDays(state?.day, phase);
  await game.settings.set(MODULE_ID, SNAPSHOT_KEY, {
    phase, detail, state: foundry.utils.deepClone(state), updatedAt: Date.now()
  });
}

function getLedger() {
  try { return game.settings.get("zft-overland-travel", STATE_KEY) ?? DEFAULT_LEDGER; }
  catch { return DEFAULT_LEDGER; }
}
function getSnapshot() {
  const published = game.settings.get(MODULE_ID, SNAPSHOT_KEY) ?? EMPTY_SNAPSHOT;
  // Before the first console publication, the pre-existing world ledger remains
  // visible to players. The isolated console does not monitor external macros.
  return { ...published, state: published.state ?? getLedger() };
}
function attendanceConfig() {
  return game.settings.get(MODULE_ID, ATTENDANCE_KEY) ?? { excludedActorUuids: [] };
}
export function presentRoster() {
  const excluded = new Set(attendanceConfig().excludedActorUuids ?? []);
  return assignedRoster().filter(actor => !excluded.has(actor.uuid));
}

const stateCard = (key, inner, className = "") => ({ key, html: `<article class="zft-hex-card ${className}" data-hex-card="${esc(key)}">${inner}</article>` });
const spanStat = (label, value, color = "", state = "") => `<div class="zft-hex-stat${state ? ` zft-hex-hours-stat is-${state}` : ""}"><span>${esc(label)}</span><strong ${color ? `class="${color}"` : ""}>${esc(value)}</strong></div>`;

// Roles and skills are shared with the travel engine, including future additions.
const SKILL_ABILITY_FALLBACK = Object.freeze({sur:"wis",prc:"wis",arc:"int",inv:"int",ste:"dex",nat:"int",ath:"str",per:"cha"});
function actorModifier(value) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && value !== null && value !== undefined && value !== "" ? numeric : null;
}
function signed(value) { return value === null ? "—" : `${value >= 0 ? "+" : ""}${value}`; }
function travelSkill(actor, key) {
  const data = actor.system?.skills?.[key] ?? {};
  const modifier = actorModifier(data.total ?? actor.getRollData?.()?.skills?.[key]?.total);
  const configuredLabel = CONFIG.DND5E?.skills?.[key]?.label;
  const label = typeof configuredLabel === "string" ? (game.i18n?.localize?.(configuredLabel) ?? configuredLabel) : ({sur:"Survival",prc:"Perception",arc:"Arcana",inv:"Investigation",ste:"Stealth",nat:"Nature",ath:"Athletics",per:"Persuasion"}[key] ?? key.toUpperCase());
  const ability = String(data.ability ?? CONFIG.DND5E?.skills?.[key]?.ability ?? SKILL_ABILITY_FALLBACK[key] ?? "").toUpperCase();
  return { label, ability, modifier };
}
function readExhaustion(actor) {
  const raw = actor.system?.attributes?.exhaustion;
  const value = Number(typeof raw === "object" ? raw?.value : raw);
  return Number.isFinite(value) ? Math.min(6, Math.max(0, Math.trunc(value))) : 0;
}
// Lock duplicate exhaustion commands while a system update is in flight.
const pendingExhaustionLevels = new Map();
function exhaustionDisplayLevel(actor) {
  // Both the menu and roster must use the SAME Actor instance. Reading from
  // game.actors while the menu uses user.character caused mismatched levels.
  const observed = readExhaustion(actor);
  return observed;
}
/** D&D5e 5.x can retain a separate exhaustion status effect with its own
 * level flag. Reconcile that source and the actor field before declaring success.
 * Never alter any other conditions or custom effects. */
function exhaustionStatusEffects(actor) {
  return [...(actor.effects ?? [])].filter(effect =>
    effect.statuses?.has?.("exhaustion") ||
    effect.getFlag?.("core", "statusId") === "exhaustion" ||
    effect.flags?.core?.statusId === "exhaustion");
}
/** D&D5e 5.2.5 owns the exhaustion ActiveEffect and derives the Actor
 * exhaustion score from that effect. Its Actor._onUpdate starts effect
 * creation/update/deletion asynchronously without awaiting the operation.
 * Observe that native synchronization in either direction instead of making
 * competing ActiveEffect writes from the roster. */
function isNativeExhaustionSettled(actor, level) {
  if (readExhaustion(actor) !== level) return false;
  // D&D5e 5.x uses a fixed ID for its native exhaustion ActiveEffect.
  // Other game-system generations retain the prior Actor-field verification.
  if (game.system?.id !== "dnd5e" || !/^5\./.test(String(game.system.version ?? ""))) return true;
  const effect = actor.effects?.get?.("dnd5eexhaustion0");
  if (level === 0) return !effect;
  const effectLevel = effect?.getFlag?.("dnd5e", "exhaustionLevel") ?? effect?.flags?.dnd5e?.exhaustionLevel;
  return effectLevel === level;
}
async function setExpeditionExhaustion(actor, level) {
  if (!game.user?.isGM || actor.type !== "character" || !Number.isInteger(level) || level < 0 || level > 6)
    throw new Error("Invalid or unauthorized exhaustion adjustment.");
  if (isNativeExhaustionSettled(actor, level)) return level;
  let updateError = null;
  try {
    // Let D&D5e create/update/delete its own effect; never mutate it here.
    await actor.update({ "system.attributes.exhaustion": level });
  } catch (error) { updateError = error; }

  // Foundry 13 + D&D5e 5.2.5 can resolve Actor.update before its effect
  // synchronization completes. This can occur on both 0 -> N and N -> 0.
  // Wait a bounded period without reissuing Actor updates or racing effects.
  for (const delayMs of [0, 60, 120, 200, 350, 500, 750, 1000, 1000, 1000]) {
    if (delayMs) await new Promise(resolve => setTimeout(resolve, delayMs));
    if (isNativeExhaustionSettled(actor, level)) {
      if (updateError) console.warn("[ZFT][HexTravel] Actor persisted exhaustion, but an update hook reported an error", updateError);
      return level;
    }
  }

  const effect = actor.effects?.get?.("dnd5eexhaustion0");
  const observed = readExhaustion(actor);
  const effectLevel = effect?.getFlag?.("dnd5e", "exhaustionLevel") ?? effect?.flags?.dnd5e?.exhaustionLevel;
  console.warn("[ZFT][HexTravel] Exhaustion update not confirmed", {
    actor: actor.uuid, requested: level, observed,
    source: actor._source?.system?.attributes?.exhaustion,
    nativeEffectPresent: !!effect, nativeEffectLevel: effectLevel ?? null,
    otherExhaustionEffects: exhaustionStatusEffects(actor).filter(e => e.id !== "dnd5eexhaustion0")
      .map(e => ({ id: e.id, level: e.flags?.dnd5e?.exhaustionLevel })),
    error: updateError?.message
  });
  throw updateError ?? new Error(`Actor reports Exhaustion ${observed} after update to ${level}`);
}
function exhaustionPenalty(level) {
  if (!level) return "";
  // In legacy-rules worlds use the 2014 exhaustion table.
  let rulesVersion = "2024";
  try {
    if (game.settings.settings.has("dnd5e.rulesVersion")) rulesVersion = String(game.settings.get("dnd5e", "rulesVersion"));
  } catch (error) { console.warn("[ZFT][HexTravel] Exhaustion rules setting unavailable", error); }
  if (/2014|legacy/i.test(rulesVersion)) return ["", "Disadvantage on ability checks", "Speed halved", "Disadvantage on attacks and saves", "HP maximum halved", "Speed reduced to 0", "Death"][level];
  return level >= 6 ? "Death" : `−${level*2} D20 Tests · −${level*5} ft. Speed`;
}
function conSaveBonus(actor) {
  const con = actor.system?.abilities?.con ?? {};
  const save = con.save;
  return actorModifier(typeof save === "object" && save !== null ? save.total ?? save.value : save)
    ?? actorModifier(actor.getRollData?.()?.abilities?.con?.save?.total ?? actor.getRollData?.()?.abilities?.con?.save);
}
/**
 * Presentation-only compact view of a completed dice roll. The stored record
 * retains the original staged HTML; old dev.24/dev.25 cards also render here.
 * Fall back to the original card for unexpected external or legacy markup.
 */
function compactHexTravelHexResult(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  const root = template.content.firstElementChild;
  if (!root?.querySelector("[data-hex-stage-title]")) return html;
  const blocks = [...root.children];
  const heading = blocks.findIndex(block => block.querySelector("[data-hex-stage-title]"));
  const pace = blocks[heading + 1];
  const nav = blocks[heading + 2];
  const secondary = blocks[heading + 3];
  const dice = blocks[heading + 4];
  const total = blocks[heading + 5];
  if (heading < 0 || !pace || !nav || !secondary || !dice || !total ||
      !/TOTAL\s*·\s*ONE HEX/i.test(total.textContent) ||
      !/DICE ROLLED/i.test(dice.textContent) || dice.children.length < 3) return html;
  const timeMatch = total.textContent.match(/(\d+)\s*hours?/i);
  if (!timeMatch) return html;
  const paceLabel = pace.textContent.replace(/^\s*Pace:\s*/i, "").trim();
  const noSecondary = /Secondary\s*·\s*None/i.test(secondary.textContent);
  const diceLabel = dice.children[0].textContent.trim();
  return `<div class="zft-hex-compact-hex">` +
    `<div class="zft-hex-compact-top"><span><i class="fa-solid fa-gauge" aria-hidden="true"></i> ${esc(paceLabel)}</span>` +
    `<strong><i class="fa-regular fa-clock" aria-hidden="true"></i> ${esc(timeMatch[1])}h travel time</strong></div>` +
    `<div class="zft-hex-compact-checks"><div class="zft-hex-compact-check">${nav.innerHTML}</div>` +
    (noSecondary ? `<span class="zft-hex-compact-no-secondary">Secondary · None</span>` :
      `<div class="zft-hex-compact-check zft-hex-compact-secondary">${secondary.innerHTML}</div>`) + `</div>` +
    `<div class="zft-hex-compact-dice"><div class="zft-hex-compact-dice-heading">${esc(diceLabel)}</div>` +
    `<div class="zft-hex-compact-dice-grid"><div class="zft-hex-compact-dice-faces">${dice.children[1].innerHTML}</div>` +
    `<div class="zft-hex-compact-dice-math">${dice.children[2].innerHTML}</div></div></div></div>`;
}


/**
 * Presentation-only two-column breakdown of the existing saved stage card.
 * Reuse the original evaluated d20 and d4 markup rather than reconstructing
 * dice or modifying saved records. Older/nonstandard cards fall back to their
 * complete original HTML, never a fabricated set of results.
 */
function hexTravelColumns(html, outcome) {
  const template = document.createElement("template");
  template.innerHTML = html;
  const root = template.content.firstElementChild;
  const blocks = [...(root?.children ?? [])];
  const heading = blocks.findIndex(block => block.querySelector("[data-hex-stage-title]"));
  if (heading < 0) return `<div class="zft-hex-travel-html">${html}</div>`;
  const pace = blocks[heading + 1];
  const guide = blocks[heading + 2];
  if (!pace || !guide?.children?.length) return `<div class="zft-hex-travel-html">${html}</div>`;

  // Present Guide and Vanguard with the same row anatomy. Work exclusively
  // from the existing evaluated HTML, retaining die artwork, DC and GM ruling;
  // this is never a replacement for the persisted travel record.
  const navigationRow = (source, role, checkLabel) => {
    const metadata = source.children[0]?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const nameAndRoll = source.cloneNode(true);
    nameAndRoll.children[0]?.remove();
    const firstText = [...nameAndRoll.childNodes].find(node => node.nodeType === 3 && node.textContent.trim());
    const nameMatch = firstText?.textContent.match(/^\s*([^·]+?)\s*·\s*/);
    const name = nameMatch?.[1]?.trim() || `${role} awaiting roll`;
    if (nameMatch) firstText.textContent = firstText.textContent.slice(nameMatch[0].length);
    const verdict = [...nameAndRoll.children].find(node => node.matches?.("strong") && /^(?:SUCCESS|FAILURE)$/i.test(node.textContent.trim()));
    const override = [...nameAndRoll.children].find(node => node.matches?.("em") && /GM override/i.test(node.textContent));
    const pending = [...nameAndRoll.children].find(node => node.matches?.("span") && /Pending GM confirmation/i.test(node.textContent));
    const recordedDC = Number(metadata.match(/DC\s*(\d+)/i)?.[1]);
    const shownTotal = Number(nameAndRoll.querySelector(".zft-hex-d20-total > strong")?.textContent?.trim());
    const hasRoll = !!nameAndRoll.querySelector(".zft-hex-d20-total");
    const status = verdict?.textContent?.trim().toUpperCase() ?? (pending || hasRoll ? "PENDING GM" : "AWAITING ROLL");
    const statusClass = verdict ? (/FAILURE/i.test(status) ? "failure" : "success") : "pending";
    const rawClass = hasRoll && Number.isFinite(shownTotal) && Number.isFinite(recordedDC) && recordedDC > 0
      ? (shownTotal >= recordedDC ? "success" : "failure") : statusClass;
    const overridden = !!override;
    verdict?.remove();
    override?.remove();
    pending?.remove();
    // The last separator belonged to the removed verdict or pending note.
    const tail = [...nameAndRoll.childNodes].reverse().find(node => node.nodeType === 3 && node.textContent.trim());
    if (tail) tail.textContent = tail.textContent.replace(/\s*·\s*$/, "");
    const rollHtml = hasRoll ? nameAndRoll.innerHTML.trim()
      : `<span class="zft-hex-hex-awaiting">Not rolled</span>`;
    const original = overridden && rawClass !== statusClass
      ? `<small class="zft-hex-hex-original-result zft-hex-result-${rawClass}">Rolled: ${rawClass === "success" ? "Success" : "Failure"}</small>` : "";
    return `<div class="zft-hex-nav-check" data-hex-navigation-role="${role.toLowerCase()}">
      <div class="zft-hex-nav-check-identity">
        <strong class="zft-hex-nav-check-name">${esc(name)}</strong>
        <span class="zft-hex-nav-check-label">${esc(role)} <span aria-hidden="true">·</span> ${esc(checkLabel)}</span>
      </div>
      <div class="zft-hex-nav-check-roll zft-hex-hex-guide-roll zft-hex-result-${rawClass}">${rollHtml}</div>
      <div class="zft-hex-nav-check-outcome">
        <strong class="zft-hex-nav-check-status ${statusClass}">${esc(status)}</strong>
        ${overridden ? `<small class="zft-hex-nav-check-override">GM override</small>` : ""}${original}
      </div>
    </div>`;
  };
  const guideHtml = navigationRow(guide, "Guide", "Survival (WIS)");
  const navDC = guide.children[0]?.textContent?.match(/DC\s*(\d+)/i)?.[1] ?? null;
  const dice = blocks.find(block => /DICE ROLLED/i.test(block.children?.[0]?.textContent ?? ""));
  const diceHeading = dice?.children?.[0]?.textContent?.replace(/\s+/g," ").trim() ?? "";
  const diceFormula = diceHeading.match(/DICE ROLLED\s*·\s*(.+)/i)?.[1]?.trim() ?? "";
  const diceFaces = dice?.children?.[1]?.innerHTML ?? "";
  const diceMath = dice?.children?.[2]?.innerHTML ?? "";
  const paceText = pace.textContent?.replace(/^\s*Pace:\s*/i," ").replace(/\s+/g," ").trim() ?? "";
  const total = blocks.find(block => /TOTAL\s*·\s*ONE HEX/i.test(block.textContent ?? ""));
  const totalHours = total?.textContent?.match(/(\d+)\s*hours?/i)?.[1] ?? null;
  // Historical Secondary cards retain their original content. Vanguard gets
  // the same compact row as Guide; no saved roll or underlying card is changed.
  const extra = blocks.find(block => /(?:VANGUARD|SECONDARY)\s*·/i.test(block.children?.[0]?.textContent ?? ""));
  const isVanguard = !!extra && /^VANGUARD\s*·/i.test(extra.children?.[0]?.textContent?.trim() ?? "");
  const vanguardHtml = isVanguard ? navigationRow(extra, "Vanguard", "Athletics (STR)") : "";
  const historicalHtml = extra && !isVanguard ? `<div class="zft-hex-hex-extra"><span>${extra.innerHTML}</span></div>` : "";

  // Move the ACTUAL previously rolled d4 faces next to the corresponding
  // saved calculation line. Do not compute, invent, or roll any new values.
  const faceGroups = [...(dice?.children?.[1]?.children ?? [])];
  const facesFor = kind => {
    const match = faceGroups.find(group => kind === "base"
      ? /^Travel\b/i.test(group.textContent.trim())
      : kind === "guide" ? /^Guide delay\b/i.test(group.textContent.trim())
        : /^Vanguard delay\b/i.test(group.textContent.trim()));
    return match ? [...match.querySelectorAll(".zft-hex-die-face")].map(face => face.outerHTML).join("") : "";
  };
  const calculationRows = [...(dice?.children?.[2]?.children ?? [])];
  const rowMarkup = calculationRows.map(row => {
    const label = row.children?.[0]?.innerHTML ?? row.textContent?.trim() ?? "";
    const amount = row.children?.[1]?.innerHTML ?? "";
    const text = row.children?.[0]?.textContent ?? "";
    const type = /Guide navigation delay/i.test(text) ? "guide" :
      /Vanguard obstacle delay/i.test(text) ? "vanguard" : /Base\s*2d4/i.test(text) ? "base" : "pace";
    const faces = type === "pace" ? "" : facesFor(type);
    return `<div class="zft-hex-time-row ${type === "guide" || type === "vanguard" ? "is-delay" : ""}">
      <span class="zft-hex-time-label">${label}</span>
      <span class="zft-hex-time-faces">${faces}</span>
      <strong class="zft-hex-time-hours">${amount}</strong>
    </div>`;
  }).join("");
  // Legacy/nonstandard dice markup falls back to the old calculation and dice
  // presentation instead of silently discarding a recorded die.
  const supportedRows = !dice || (calculationRows.length > 0 && calculationRows.every(row => row.children.length >= 2));
  const travelDetail = dice ? (supportedRows
    ? `<div class="zft-hex-time-rows">${rowMarkup}</div>`
    : `<div class="zft-hex-hex-dice-faces">${diceFaces}</div><div class="zft-hex-hex-dice-math">${diceMath}</div>`) :
    `<div class="zft-hex-hex-dice-pending">Travel dice awaiting GM confirmation</div>`;
  const rollDetail = dice && supportedRows
    ? `<details class="zft-hex-time-original"><summary>Original roll detail <span>${esc(diceFormula)}</span></summary>
        <div class="zft-hex-time-original-content"><div class="zft-hex-hex-dice-faces">${diceFaces}</div>
        <div class="zft-hex-hex-dice-math">${diceMath}</div></div></details>` : "";

  return `<div class="zft-hex-hex-detail zft-hex-travel-report zft-hex-travel-report-compact" aria-label="Navigation, travel dice and duration">
    <section class="zft-hex-time-navigation" aria-label="Navigation checks">
      <div class="zft-hex-time-section-head"><h4><i class="fa-solid fa-compass" aria-hidden="true"></i> Navigation</h4>
        ${navDC ? `<small>DC ${esc(navDC)}</small>` : ""}</div>
      <div class="zft-hex-nav-checks">${guideHtml}${vanguardHtml}</div>${historicalHtml}
    </section>
    <section class="zft-hex-time-summary" aria-label="Travel time and calculation">
      <div class="zft-hex-time-section-head"><h4><i class="fa-solid fa-dice" aria-hidden="true"></i> Travel Time</h4>
        <span class="zft-hex-time-pace">${esc(paceText)}</span></div>
      <div class="zft-hex-time-highlight"><span>ONE HEX · TOTAL TRAVEL</span>
        <strong>${totalHours === null ? "Pending" : `${esc(totalHours)} hours`}</strong></div>
      ${travelDetail}${rollDetail}
    </section>
  </div>`;
}

function expeditionRolesReferenceHtml() {
  const roster = presentRoster();
  return EXPEDITION_PAIRS.map(pair => `<section class="zft-hex-reference-group"><h4>${esc(pair.name)}</h4>${pair.roles.map(key => {
    const role = EXPEDITION_ROLES[key];
    const skill = travelSkill(roster[0] ?? {},role.skill);
    return `<div class="zft-hex-reference-role"><strong>${esc(role.name)}</strong><span>${esc(skill.label)} (${esc(role.ability)})</span><p>${esc(role.tooltip ?? role.purpose)}</p></div>`;
  }).join("")}</section>`).join("");
}

function makeCards(snapshot) {
  const s = snapshot.state ?? DEFAULT_LEDGER;
  const hours = num(s.hours);
  const pending = num(s.pending);
  const cards = [];
  const activeSaveCards = [];
  const safe = Math.min(8, hours);
  const nextHour = hours + 1;
  const safeRemaining = Math.max(0, 8 - hours);
  const forced = Math.max(0, hours - 8);
  const total = num(game.settings.get(MODULE_ID, HEX_KEY)?.totalHours);
  const hexProgress = game.settings.get(MODULE_ID, HEX_KEY) ?? {};
  const hexValid = pending > 0 && total >= pending && num(hexProgress.baseHexes) === num(s.hexes);
  const spent = hexValid ? total - pending : null;
  const safeAvailable = Math.min(safeRemaining, pending);
  const next = pending
    ? safeRemaining
      ? `Next: Continue the current hex. ${safeAvailable} ${safeAvailable === 1 ? "safe travel hour" : "safe travel hours"} available${pending > safeRemaining ? " before Forced March begins" : " to finish the hex"}.`
      : `Next: Continue Forced March (travel hour ${nextHour}; Constitution save DC ${10 + nextHour - 8}).`
    : "Next: Choose a New Hex or Start a New Travel Day";
  const hoursStatus = forced > 0 ? "red" : safeRemaining === 0 ? "amber" : "green";
  const safeStatus = safeRemaining === 0 ? "amber" : "green";
  const nextStatus = forced > 0 ? "is-forced" : safeRemaining === 0 && pending > 0 ? "is-warning" : "is-neutral";
  cards.push(stateCard("overview", `
    <div class="zft-hex-stats zft-hex-stats-overview" aria-label="Current expedition travel summary">
      ${spanStat("DAY", Math.max(1, num(s.day)))}
      ${spanStat("TRAVEL HOURS TODAY", `${hours}h`, hoursStatus, forced > 0 ? "forced" : safeRemaining === 0 ? "limit" : "safe")}
      ${spanStat("HEXES COMPLETE", num(s.hexes))}
      ${spanStat("TRAVEL HOURS LEFT", pending > 0 ? `${pending}h` : "—", pending > 0 ? "amber" : "")}
    </div>
    <div class="zft-hex-progress-label zft-hex-safe-label ${safeStatus}"><span>Safe travel hours</span><strong>${safe}/8h</strong></div>
    <div class="zft-hex-progress zft-hex-safe-progress ${hoursStatus}"><div style="width:${Math.round(safe / 8 * 100)}%"></div></div>
    ${hexValid ? `<div class="zft-hex-progress-label zft-hex-hex-label"><span>Current hex progress</span><strong>${spent}/${total}h</strong></div><div class="zft-hex-progress zft-hex-hex-progress"><div style="width:${total ? Math.round(spent / total * 100) : 0}%"></div></div>` : ""}
    <div class="zft-hex-next-step ${nextStatus}"><span class="zft-hex-next-label">NEXT</span><span class="zft-hex-next-instruction">${esc(next.replace(/^Next:\s*/, ""))}</span></div>
    <div class="zft-hex-time-brief" data-hex-time-brief>
      <span data-hex-sun-row><i class="fa-solid fa-sun" aria-hidden="true"></i> <span data-hex-live-sun>Daylight information is unavailable.</span></span>
      <span data-hex-eta-row hidden><i class="fa-solid fa-hourglass-end" aria-hidden="true"></i> <span data-hex-live-eta></span></span>
      <small data-hex-live-night hidden></small>
    </div>`));
  // Summary already states remaining hours and next action. No duplicate status panel.
  // A day owns hex segments, each hex owns its explicitly associated checks.
  // Existing records remain unchanged. Historical saves with no hexId stay in
  // a clearly identified day-level legacy section; timestamps are NOT proof of
  // which hex was traveled when the save was rolled.
  const travelCards = game.settings.get(MODULE_ID, CARDS_KEY)?.cards ?? [];
  const visibility = game.settings.get(MODULE_ID, LOG_KEY) ?? {};
  const hiddenHistory = new Set(visibility.hiddenHistoryKeys ?? []);
  const hexRecords = travelCards.filter(record => record?.id && record?.html).map(record => {
    const day = Number(record.day);
    const decorated = decorateLegacyHexTravelDice(record.html);
    const outcome = record.html.includes(">SUCCESS</strong>") ? "Navigation success"
      : record.html.includes(">FAILURE</strong>") ? "Navigation failure" : "Navigation resolved";
    return { id: String(record.id), record, decorated, outcome,
      tracked: hexHoursForId(s.hexHourSegments, String(record.id)),
      day: Number.isSafeInteger(day) && day > 0 ? day : null,
      at: Number(record.completedAt ?? record.updatedAt) || 0,
      rolledHours: record.html.match(/>(\d+) hours<\/div>/)?.[1],
      complete: record.stage === "complete" };
  });
  const numberedHexes = [...hexRecords].sort((a, b) =>
    (Number(a.record.createdAt) || Number(a.record.updatedAt) || 0) -
    (Number(b.record.createdAt) || Number(b.record.updatedAt) || 0) ||
    hexRecords.indexOf(a) - hexRecords.indexOf(b));
  const retainedCompletions = numberedHexes.filter(item => item.complete).length;
  const earlierCompletions = Math.max(0, num(s.hexes) - retainedCompletions);
  const hexNumberById = new Map(numberedHexes.map((item, index) => [item.id, earlierCompletions + index + 1]));
  const hexById = new Map(hexRecords.map(item => [item.id, item]));
  const linkedMarch = [];
  const legacyMarch = [];
  for (const entry of (Array.isArray(s.marchHistory) ? s.marchHistory : [])) {
    if (hiddenHistory.has(`${entry.day}:${entry.hour}`)) continue;
    const day = Number(entry.day);
    const validDay = Number.isSafeInteger(day) && day > 0 ? day : null;
    const record = entry.hexId ? hexById.get(String(entry.hexId)) : null;
    const item = { entry, day: validDay, at: Number(entry.recordedAt) || 0 };
    if (record) linkedMarch.push({ ...item, hexId: record.id });
    else legacyMarch.push(item);
  }
  const today = Math.max(1, Number(s.day) || 1);
  const activeHexId = num(s.pending) > 0 && s.activeHexCardId && hexById.has(String(s.activeHexCardId))
    ? String(s.activeHexCardId) : null;
  const newestHex = [...hexRecords].sort((a,b) => b.at - a.at)[0];
  // Old ledgers had no explicit active-hex ID. Preserve the original current
  // hex label for display only; never attach old saves to it implicitly.
  const legacyVisibleCurrentId = !activeHexId && num(s.pending) > 0 && newestHex?.complete
    ? newestHex.id : null;
  const days = new Map();
  const ensureDay = day => {
    const key = day === null ? "undated" : String(day);
    if (!days.has(key)) days.set(key, { day, hexes: new Map(), legacyMarch: [] });
    return days.get(key);
  };
  const ensureHex = (day, hexItem) => {
    const group = ensureDay(day);
    if (!group.hexes.has(hexItem.id)) group.hexes.set(hexItem.id, { hexItem, marches: [] });
    return group.hexes.get(hexItem.id);
  };
  for (const item of hexRecords) {
    ensureHex(item.day, item);
    // Subsequent travel days retain the same hex ID, even once completed.
    for (const segment of item.tracked.days) if (segment.day !== item.day) ensureHex(segment.day, item);
  }
  for (const item of linkedMarch) ensureHex(item.day, hexById.get(item.hexId)).marches.push(item);
  for (const item of legacyMarch) ensureDay(item.day).legacyMarch.push(item);
  // Explicitly observed days remain in the log even when no travel card or
  // Forced March check exists. Preserve only actual registered days; never
  // infer gaps or synthesize travel activity for skipped ledger day numbers.
  for (const loggedDay of (Array.isArray(visibility.recordedDays) ? visibility.recordedDays : [])) {
    if (Number.isSafeInteger(loggedDay) && loggedDay >= 1 && loggedDay <= today) ensureDay(loggedDay);
  }
  // A hex can span travel days. In that case each day's log shows its segment,
  // with a link to the SAME saved hex record, not a fabricated second hex.
  if (activeHexId) ensureHex(today, hexById.get(activeHexId));
  else if (legacyVisibleCurrentId) ensureHex(today, hexById.get(legacyVisibleCurrentId));
  ensureDay(today);

  const latestMarch = [...linkedMarch, ...legacyMarch].sort((a,b) => (b.entry.recordedAt ?? 0) - (a.entry.recordedAt ?? 0))[0]?.entry;
  // A resolved hour is relevant only while the hex still has travel remaining.
  // Never leave a finished hex's last Forced March detail auto-expanded.
  // While a new hour is being adjudicated, the live save rows supersede the
  // previous completed hour and all historical details stay collapsed.
  const holdLatestMarch = num(s.pending) > 0 && String(snapshot.phase ?? "") === "Hour resolved";
  const renderMarch = ({ entry }) => {
    const holdOpen = holdLatestMarch && entry === latestMarch && entry.day === today && Number(entry.hour) === num(s.hours);

    const rows = (entry.results ?? []).map(result => {
      const tone = !Number.isFinite(result.total) ? "pending" : result.passed ? "success" : "failure";
      const label = tone === "pending" ? "Unresolved" : result.passed ? "Passed" : "Failed";
      const recordedOutcome = String(result.outcome ?? "GM resolved");
      const rulingTone = /Exhaustion \+1/i.test(recordedOutcome) ? "failure" : /accepted|waived/i.test(recordedOutcome) ? "success" : "pending";
      return `<div class="zft-hex-result-row zft-hex-march-result-grid"><strong class="zft-hex-march-character zft-hex-result-${tone}">${esc(result.name)}</strong>` +
        `<span class="zft-hex-march-check zft-hex-result-${tone}">${Number.isFinite(result.total) ? hexTravelD20Total(result.total) : "—"}</span>` +
        `<span class="zft-hex-march-verdict zft-hex-result-${tone}">${label}</span>` +
        `<small class="zft-hex-march-outcome zft-hex-result-${rulingTone}">${num(result.rerolls) ? `Rerolled ×${num(result.rerolls)} · ` : ""}${esc(recordedOutcome)}</small></div>`;
    }).join("");
    const failed = (entry.results ?? []).filter(result => result.passed === false).length;
    const resultCount = (entry.results ?? []).length;
    const compact = failed
      ? `${resultCount} saves · <span class="zft-hex-result-failure">${failed} failed</span>`
      : `<span class="zft-hex-result-success">${resultCount} saves accepted</span>`;
    const full = `<div class="zft-hex-march-full"><div class="zft-hex-card-title">Forced March · Hour ${esc(entry.hour)} · CON DC ${esc(entry.dc)}</div>${rows || "<p>No entries</p>"}</div>`;
    return stateCard(`history:${entry.day}:${entry.hour}`,
      `<details class="zft-hex-log-history zft-hex-history-march zft-hex-march-event" data-hex-history data-hex-march-key="${esc(`${entry.day}:${entry.hour}:${entry.recordedAt ?? 0}`)}" ${holdOpen ? 'open data-hex-march-held="true"' : ''}><summary class="zft-hex-march-event-head"><span class="zft-hex-march-title"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Forced March · Hour ${esc(entry.hour)}</span><span class="zft-hex-march-status zft-hex-march-status-completed">Completed</span><span class="zft-hex-march-event-meta">CON DC ${esc(entry.dc)} · ${compact}</span></summary>${full}</details>`, "zft-hex-march-card").html;
  };
  // Read-only progress label: derive the active workflow from existing public
  // phase + staged hex record. Never create a second state machine.
  const activeHexStatus = (record) => {
    const phase = String(snapshot.phase ?? "");
    const hour = hours + 1;
    if (phase === "Forced march decision") return `Awaiting GM Decision · Forced March Hour ${hour}`;
    if (phase === "GM review") return `Awaiting GM Rulings · Forced March Hour ${hour}`;
    if (phase === "Saving throws") return `Awaiting CON Saves · Forced March Hour ${hour}`;
    if (phase === "Rerolling") return `Awaiting CON Rerolls · Hour ${hour}`;
    if (phase === "Forced march") return `Forced March In Progress · Hour ${hour}`;
    const stage = String(record?.stage ?? "");
    if (stage === "started") return "Awaiting Navigation Roll";
    if (stage === "navigation") return "Navigation Checks Complete · Awaiting GM Ruling";
    if (stage === "secondary") return "Awaiting GM Navigation Ruling";
    if (stage === "rolling") return "Awaiting Travel Dice";
    if (stage === "complete" && pending > 0) return "Ready to Continue Travel";
    return "Travel In Progress";
  };
  const renderHex = (segmentDay, { hexItem, marches }) => {
    const { record, day: startingDay, outcome, id } = hexItem;
    const isCurrent = (id === activeHexId || id === legacyVisibleCurrentId) && segmentDay === today && num(s.pending) > 0;
    const isLatest = newestHex?.id === id && segmentDay === today;
    const defaultOpen = isCurrent || isLatest;
    const continued = segmentDay !== startingDay;
    const number = hexNumberById.get(id);
    const hexLabel = number ? `Hex ${number}` : "Hex";
    const travelDays = hexItem.tracked.days;
    const lastTravelDay = travelDays.length ? travelDays[travelDays.length - 1].day : startingDay;
    const earlierDaySegment = segmentDay < lastTravelDay || (segmentDay !== today && id === activeHexId);
    const header = isCurrent ? `${hexLabel} · In progress` : earlierDaySegment ? `${hexLabel} · Continued next day` : hexItem.complete ? `${hexLabel} · Completed` : continued ? `${hexLabel} · Continued travel` : `${hexLabel} · In progress`;
    const rolledHours = Number(hexItem.rolledHours);
    const validRollHours = Number.isSafeInteger(rolledHours) && rolledHours > 0;
    const tracked = hexItem.tracked;
    const fullyTracked = validRollHours && tracked.total === rolledHours;
    const activeSpent = isCurrent && validRollHours && rolledHours >= pending ? rolledHours - pending : null;
    const hourHeading = isCurrent && activeSpent !== null ? `${activeSpent}/${rolledHours}h traveled` :
      fullyTracked ? `${tracked.total}h traveled` :
      validRollHours && hexItem.complete ? `${rolledHours}h travel duration` :
      tracked.total ? `${tracked.total}h recorded` : "";
    const hourHeadingHtml = hourHeading ? `<strong class="zft-hex-hex-hours-head">${esc(hourHeading)}</strong>` : "";
    // A revision changes only when the hex record or travel progress changes.
    // Opening and closing a window or refreshing a player view does not change it.
    const revision = [record.updatedAt ?? 0, record.stage, isCurrent ? `${hours}:${pending}` : "completed",
      ...tracked.days.map(part => `${part.day}:${part.hours}`),
      ...marches.map(item => `${item.entry.day}:${item.entry.hour}:${item.entry.recordedAt ?? 0}`)].join(":");
    const time = hexItem.rolledHours ? `${hexItem.rolledHours}h total` : "Travel time unavailable";
    const liveStatus = isCurrent ? `<span class="zft-hex-hex-workflow-status" role="status"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> <span>${esc(activeHexStatus(record))}</span></span>` : "";
    // Show the latest navigation result immediately, including the GM ruling
    // stage before travel dice exist. Earlier hexes remain closed by default.
    // syncCards honors a deliberate manual toggle until NEW recorded results
    // supersede that choice for this hex.
    // Hex expands directly into the complete two-column presentation. The
    // evaluated dice, GM outcome, pace and total come from the saved card.
    // No duplicate skim rows or second click for the latest hex.
    const rolls = hexTravelColumns(hexItem.decorated, outcome);
    const marchHtml = [...marches].sort((a,b) => b.entry.hour - a.entry.hour).map(renderMarch).join("");
    const hasLiveMarch = isCurrent && hours >= 8 && ["Forced march decision", "Forced march", "Saving throws", "Rerolling", "GM review"].includes(String(snapshot.phase ?? ""));
    const marchHeading = marches.length || hasLiveMarch
      ? `<div class="zft-hex-hex-event-heading"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Forced March checks</div>` : "";
    const childCount = marches.length ? `<small class="zft-hex-hex-collapsed-count">${marches.length} Forced March ${marches.length === 1 ? "check" : "checks"}</small>` : "";
    const split = travelDays.length > 1 ? `<div class="zft-hex-hex-day-breakdown" aria-label="Travel hours by expedition day"><strong>Travel hours by day</strong>${travelDays.map((part,index) => {
      const remaining = validRollHours ? Math.max(0, rolledHours - travelDays.slice(0,index+1).reduce((sum,row)=>sum+row.hours,0)) : null;
      const tail = fullyTracked && index === travelDays.length-1 ? " · Hex completed" :
        fullyTracked && remaining > 0 ? ` · ${remaining}h remained unfinished` : "";
      return `<span><span>Day ${esc(part.day)}</span><span>${esc(part.hours)}h traveled${esc(tail)}</span></span>`;
    }).join("")}${!fullyTracked ? `<small>Earlier hours were not recorded by travel day.</small>` : ""}</div>` : "";
    const legacyTotalNote = !fullyTracked && validRollHours && tracked.total > 0 ? `<div class="zft-hex-hex-day-breakdown is-legacy"><small>${esc(tracked.total)}h recorded by day. Earlier hours are not allocated to a day.</small></div>` : "";
    const priorTracked = tracked.days.filter(part => part.day < today).reduce((sum,part)=>sum+part.hours,0);
    const carriedHours = validRollHours && isCurrent && startingDay !== null && startingDay < today && priorTracked > 0
      ? Math.max(0, rolledHours - priorTracked) : null;
    const carryNote = carriedHours > 0 ? `<div class="zft-hex-hex-day-breakdown is-carried"><small>${esc(carriedHours)}h of unfinished travel carried into Day ${esc(today)}. ${esc(pending)}h still remaining.</small></div>` : "";
    return stateCard(`hex:${id}:day:${segmentDay ?? "undated"}`,
      `<details class="zft-hex-log-history zft-hex-hex-section ${isCurrent ? "zft-hex-hex-active" : ""} ${hexItem.complete ? "zft-hex-hex-complete" : ""}" data-hex-history data-hex-hex-revision="${esc(revision)}" data-hex-hex-latest="${isLatest ? "true" : "false"}" ${defaultOpen ? "open" : ""}><summary><span class="zft-hex-hex-head-main"><span class="zft-hex-history-label"><i class="fa-solid ${isCurrent ? "fa-hourglass-half" : "fa-map-location-dot"}" aria-hidden="true"></i> ${esc(header)}</span><span class="zft-hex-hex-header-meta">${hourHeadingHtml}${childCount}</span></span>${liveStatus}</summary><div class="zft-hex-hex-contents">${split}${carryNote}${legacyTotalNote}<div class="zft-hex-hex-roll-container">${rolls}</div><div class="zft-hex-hex-events" data-hex-hex-events="${esc(id)}">${marchHeading}${marchHtml}</div></div></details>`,
      "zft-hex-hex-card zft-hex-hex-parent-card").html;
  };

  const groupedLog = [...days.values()].sort((a,b) => (b.day ?? -1) - (a.day ?? -1)).map(group => {
    const day = group.day;
    const current = day === today;
    const stopped = ["Travel stopped","Travel paused"].includes(snapshot.phase);
    const open = current;
    const ordered = [...group.hexes.values()].sort((a,b) => b.hexItem.at - a.hexItem.at);
    const hexHtml = ordered.map(segment => renderHex(day, segment)).join("");
    const legacyHtml = group.legacyMarch.length
      ? `<section class="zft-hex-legacy-marches" aria-label="Historical Forced March checks without recorded hex association"><div class="zft-hex-legacy-label"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> Earlier Forced March checks <small>Hex association not recorded</small></div>${[...group.legacyMarch].sort((a,b) => b.entry.hour-a.entry.hour).map(renderMarch).join("")}</section>` : "";
    const events = hexHtml + legacyHtml || `<div class="zft-hex-day-empty-note"><i class="fa-solid fa-book-open" aria-hidden="true"></i><span><strong>No travel recorded</strong><small>${day === today ? "Travel activity will appear here." : "0 hours traveled · 0 hexes completed · 0 Forced March checks"}</small></span></div>`;
    const numMarches = group.legacyMarch.length + ordered.reduce((n,item)=>n+item.marches.length,0);
    // Display distinct completed/in-progress counts, rather than calling an
    // unfinished hex a completed one. Continued hex segments retain their ID.
    const inProgress = ordered.filter(({hexItem}) =>
      !hexItem.complete || (hexItem.tracked.days.some(part => part.day > day)) || (day === today && num(s.pending) > 0 &&
        (hexItem.id === activeHexId || hexItem.id === legacyVisibleCurrentId))).length;
    const completed = ordered.length - inProgress;
    const count = `<span title="Hexes completed during this travel day"><i class="fa-solid fa-circle-check" aria-hidden="true"></i><strong>${completed}</strong><small>${completed === 1 ? "Hex Completed" : "Hexes Completed"}</small></span>` +
      `<span title="Hexes in progress during this travel day"><i class="fa-solid fa-hourglass-half" aria-hidden="true"></i><strong>${inProgress}</strong><small>${inProgress === 1 ? "Hex in Progress" : "Hexes in Progress"}</small></span>` +
      `<span title="Constitution saving throw checks recorded for Forced March"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i><strong>${numMarches}</strong><small>Forced March ${numMarches === 1 ? "Check" : "Checks"}</small></span>`;
    const status = current ? (stopped ? "Stopped / Paused" : "Current Day") : "Earlier Day";
    return stateCard(`day:${day ?? "undated"}`, `<details class="zft-hex-day-group" data-hex-day-group="${esc(day ?? "undated")}" ${open ? "open" : ""}><summary><span class="zft-hex-day-group-label"><i class="fa-solid fa-calendar-days" aria-hidden="true"></i><strong class="zft-hex-day-index">${esc(day === null ? "Earlier Travel" : `Day ${day}`)}</strong><span class="zft-hex-day-calendar">${esc(day === null ? "Date not recorded" : displayedTravelDayDate(day, snapshot))}</span><small>${esc(status)}</small></span><span class="zft-hex-day-group-count" aria-label="Travel day summary">${count}</span></summary><div class="zft-hex-day-group-events">${events}</div></details>`, "zft-hex-day-group-card");
  });
  const currentDayKey = `day:${today}`;
  const roster = presentRoster();
  const roles = hexTravelRolePreferences();
  const rosterHtml = roster.map(actor => {
    const assignment = Object.entries(roles.assignments ?? {}).find(([key, uuid]) => EXPEDITION_ROLES[key] && uuid === actor.uuid);
    const legacyNavigator = actor.uuid === roles.navigatorUuid;
    const legacyActivity = actor.uuid === roles.secondaryUuid && roles.activity !== "none" ? HEX_TRAVEL_ACTIVITIES[roles.activity] : null;
    const definedRole = assignment ? EXPEDITION_ROLES[assignment[0]] : null;
    const assigned = definedRole?.name ?? (legacyNavigator ? "Guide" : (legacyActivity ? `Secondary · ${legacyActivity.name}` : "Available"));
    const skillKey = definedRole?.skill ?? (legacyNavigator ? HEX_TRAVEL_NAVIGATION_SKILL : legacyActivity?.skill ?? null);
    const check = skillKey ? travelSkill(actor, skillKey) : null;
    const checkInfo = check ? `<span class="zft-hex-member-skill" title="Assigned expedition check">${esc(check.label)}${check.ability ? ` (${esc(check.ability)})` : ""} <strong>${esc(signed(check.modifier))}</strong></span>` : "";
    const con = conSaveBonus(actor);
    const portrait = actor.img ? `<img src="${esc(actor.img)}" loading="lazy" alt="">` : `<i class="fa-solid fa-user" aria-hidden="true"></i>`;
    // The immediate GM correction is held until the actor's replicated state catches up.
    const exhaustion = exhaustionDisplayLevel(actor);
    const penalty = exhaustionPenalty(exhaustion);
    const penaltyParts = penalty.split(/\s*·\s*/);
    const status = exhaustion ? `<span class="zft-hex-member-exhaustion"><span class="zft-hex-member-condition">Exhaustion ${exhaustion}</span><small class="zft-hex-member-penalty">${penaltyParts.map(part => `<span>${esc(part)}</span>`).join("")}</small></span>` : "";
    const description = definedRole?.tooltip ?? definedRole?.purpose ?? "";
    const roleLabel = definedRole
      ? `<small class="zft-hex-role-tooltip" tabindex="0" aria-label="${esc(assigned)}: ${esc(description)}"><span>${esc(assigned)}</span> <i class="fa-solid fa-circle-info" aria-hidden="true"></i><span class="zft-hex-role-tooltip-pop" role="tooltip">${esc(description)}<em>Primary check: ${esc(check?.label ?? "Ability check")} (${esc(definedRole.ability)})</em></span></small>`
      : `<small>${esc(assigned)}</small>`;
    return `<div class="zft-hex-party-member zft-hex-roster-refined" data-hex-party-actor="${esc(actor.uuid)}"><span class="zft-hex-portrait" data-hex-actor-sheet="${esc(actor.uuid)}" title="Double-click to open character sheet" role="button" tabindex="0" aria-label="Open ${esc(actor.name)} character sheet">${portrait}</span><span class="zft-hex-member-info"><span class="zft-hex-member-heading"><strong>${esc(actor.name)}</strong>${status}</span>${roleLabel}<span class="zft-hex-member-bonuses">${checkInfo}<span class="zft-hex-member-con" title="Constitution saving throw bonus">CON Save <strong>${esc(signed(con))}</strong></span></span></span></div>`;
  }).join("");
  const rosterCollapsed = game.settings.get(MODULE_ID, UI_KEY)?.rosterCollapsed === true;
  cards.push(stateCard("party", `<div class="zft-hex-roster-header"><div class="zft-hex-card-title">Expedition Roster · ${roster.length}</div><div class="zft-hex-roster-header-actions"><button type="button" class="zft-hex-roster-toggle" data-hex-action="roster-toggle" aria-expanded="${!rosterCollapsed}" aria-controls="zft-hex-roster-members" aria-label="${rosterCollapsed ? "Expand" : "Collapse"} Expedition Roster" title="${rosterCollapsed ? "Expand" : "Collapse"} Expedition Roster"><i class="fa-solid fa-angles-${rosterCollapsed ? "down" : "up"}" aria-hidden="true"></i></button><button type="button" class="zft-hex-roles-open" data-hex-action="roles-reference" aria-label="Open expedition roles reference"><i class="fa-solid fa-book-open" aria-hidden="true"></i> Roles</button></div></div><div id="zft-hex-roster-members" class="zft-hex-party-list" ${rosterCollapsed ? "hidden" : ""}>${rosterHtml || "No party members selected"}</div>`));

  // Public forced-march briefing appears before the GM confirms continuing.
  // All clients use the same world snapshot; only the GM gets action controls.
  // An archived forced hour is represented solely by the completed timeline.
  const marchPhase = String(snapshot.phase ?? "");
  // A pending decision is already visible in the current hex header and GM
  // Dashboard. Avoid a second, redundant Forced March event card below it.
  const rolls = s.hourRolls ?? {};
  const outcomes = s.hourOutcomes ?? {};
  const resolved = new Set(s.hourResolved ?? []);
  const hasSaves = ["Saving throws", "GM review", "Rerolling", "Forced march", "Hour resolved"].includes(snapshot.phase) || Object.keys(rolls).length > 0 || resolved.size > 0;
  if (hasSaves && visibility.hiddenHourKey !== `${s.day}:${s.hours}`) {
    const hour = hours + 1;
    const dc = 10 + hour - 8;
    // Pending save rows use the existing "Forced March checks" section header.
    for (const actor of roster) {
      const value = rolls[actor.uuid];
      const hasRoll = Number.isFinite(value);
      const rerollPending = (s.hourRerollPending ?? []).includes(actor.uuid);
      const outcome = resolved.has(actor.uuid) ? (outcomes[actor.uuid] || "GM resolved") : hasRoll ? "Awaiting GM ruling" : "Awaiting roll";
      const color = rerollPending || !hasRoll ? "amber" : value >= dc ? "green" : "red";
      const rerolls = num(s.hourRerolls?.[actor.uuid]);
      const check = hasRoll && !rerollPending ? hexTravelD20Total(value) : `<span class="zft-hex-march-no-roll">${rerollPending ? "↻" : "—"}</span>`;
      const verdict = rerollPending ? "Rerolling" : hasRoll ? (value >= dc ? "Passed" : "Failed") : "Pending";
      const explanation = rerollPending
        ? `Reroll requested · ${hasRoll ? `previous result ${esc(value)}` : "awaiting result"}`
        : `${rerolls ? `Rerolled ×${rerolls} · ` : ""}${esc(outcome)}`;
      activeSaveCards.push(stateCard(`save:${actor.uuid}`, `<div class="zft-hex-live-save-row zft-hex-march-result-grid"><strong class="zft-hex-march-character zft-hex-result-${color === "green" ? "success" : color === "red" ? "failure" : "pending"}">${esc(actor.name)}</strong><span class="zft-hex-march-check zft-hex-result-${color === "green" ? "success" : color === "red" ? "failure" : "pending"}">${check}</span><span class="zft-hex-march-verdict ${color}">${verdict}</span><small>${explanation}</small></div>`));
    }
  }
  // Display the live Forced March briefing and per-PC results INSIDE their
  // owning travel day. It is presentation-only: the persistent timeline, rolls,
  // events, and world settings retain their existing schema and order.
  if (activeSaveCards.length) {
    const currentIndex = groupedLog.findIndex(card => card.key === currentDayKey);
    if (currentIndex !== -1) {
      const group = groupedLog[currentIndex];
      const activityLabel = marchPhase === "Forced march decision" ? "GM decision pending"
        : marchPhase === "GM review" ? "GM rulings pending" : "Forced March in progress";
      const active = `<section class="zft-hex-live-section" aria-label="${esc(activityLabel)}">${activeSaveCards.map(card => card.html).join("")}</section>`;
      // Only an explicitly linked active hex owns the pending action. Legacy
      // state with no ID shows it at day level without claiming a false link.
      const target = activeHexId ? `<div class="zft-hex-hex-events" data-hex-hex-events="${esc(activeHexId)}">` : null;
      if (target && group.html.includes(target)) {
        const heading = `<div class="zft-hex-hex-event-heading"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Forced March checks</div>`;
        const withHeading = target + heading;
        group.html = group.html.includes(withHeading)
          ? group.html.replace(withHeading, `${withHeading}${active}`)
          : group.html.replace(target, `${target}${heading}${active}`);
      } else group.html = group.html.replace('<div class="zft-hex-day-group-events">', `<div class="zft-hex-day-group-events">${active}`);
    }
  }
  // Only the overview and roster remain top-level dashboard cards.
  return [...cards, ...groupedLog];
}

function syncCards(container, cards, dayOverrides = null, historyOverrides = null) {
  const existing = new Map([...container.children].map(node => [node.dataset.hexCard, node]));
  const desired = new Set(cards.map(card => card.key));
  for (const [i, card] of cards.entries()) {
    let node = existing.get(card.key);
    if (!node || node.dataset.hexMarkup !== card.html) {
      const template = document.createElement("template");
      template.innerHTML = card.html;
      const replacement = template.content.firstElementChild;
      replacement.dataset.hexMarkup = card.html;
      if (card.key.startsWith("day:") && dayOverrides?.has(card.key)) {
        const dayDetail = replacement.querySelector("details[data-hex-day-group]");
        if (dayDetail) dayDetail.open = dayOverrides.get(card.key);
      }
      // Preserve manual historical review only between changes of travel
      // progress. refresh() owns the single-current-hour auto-open lifecycle.
      if (node) {
        const oldMarches = new Map([...node.querySelectorAll("details[data-hex-march-key]")].map(el => [el.dataset.hexMarchKey, el]));
        for (const fresh of replacement.querySelectorAll("details[data-hex-march-key]")) {
          const previous = oldMarches.get(fresh.dataset.hexMarchKey);
          if (!previous) continue;
          if (fresh.hasAttribute("data-hex-march-held")) fresh.open = true;
          else if (previous.hasAttribute("data-hex-march-held")) fresh.open = false;
          else fresh.open = previous.open;
        }
      }
      // A recorded result reopens the latest hex with its full two-column
      // navigation and dice result; ordinary refreshes preserve manual state.
      const latestNew = replacement.querySelector('.zft-hex-hex-section[data-hex-hex-latest="true"]');
      const latestOld = node?.querySelector('.zft-hex-hex-section[data-hex-hex-latest="true"]');
      if (latestNew && latestOld && historyOverrides &&
          latestNew.dataset.hexHexRevision !== latestOld.dataset.hexHexRevision) {
        const latestKey = latestNew.closest("[data-hex-card]")?.dataset.hexCard;
        if (latestKey) {
          historyOverrides.delete(latestKey);
        }
      }
      // The current day's latest completed event opens automatically. Only a
      // user's explicit summary click overrides that default on later renders.
      for (const detail of replacement.querySelectorAll("[data-hex-card] > details[data-hex-history]")) {
        const cardKey = detail.closest("[data-hex-card]")?.dataset.hexCard;
        if (cardKey && historyOverrides?.has(cardKey)) detail.open = historyOverrides.get(cardKey);
      }
      if (node) node.replaceWith(replacement);
      node = replacement;
    }
    if (container.children[i] !== node) container.insertBefore(node, container.children[i] ?? null);
  }
  for (const [key, node] of existing.entries()) if (!desired.has(key)) node.remove();
}

class ExpeditionConsole {
  element = null;
  logElement = null;
  workflowElement = null;
  panel = null;
  busy = false;
  travelActive = false;
  activeTravelTicket = 0;
  dragMoved = false;
  followLatest = true;
  activeLogTab = "travel";
  travelTabScroll = 0;
  logHasRendered = false;
  logResizeActive = false;
  dayOpenOverrides = new Map();
  historyOpenOverrides = new Map();
  pendingRolls = new Map();
  lastDayState = null;
  lastMarchTimelineState = null;
  lastDisplaySecond = null;
  lastDetailMinute = null;
  clockHook = null;
  calendariaClockHooks = [];
  scrollingFromCode = false;
  rollWindowOcclusions = new Map();
  rollWindowVisibility = new Map();
  // Expedition panes only compete with one another. Native Foundry dialogs,
  // character sheets, and module popups keep their own window stacking.
  paneOrder = ["zft-hex-travel-workflow-window", "zft-hex-travel-console", "zft-hex-travel-log"];
  paneBaseZ = 70;

  updateExpeditionLayers() {
    // Foundry V13's ApplicationV2 manages normal windows itself. Do not invoke
    // bringToFront() on other applications or modify #interface / #ui-left.
    // Adapt down if a third-party/native dialog has a smaller z-index than the
    // usual Foundry window layer. Never boost our panes above normal apps.
    const candidates = document.querySelectorAll(
      ".application, .window-app, dialog[open]"
    );
    let nativeMin = Infinity;
    for (const candidate of candidates) {
      if (candidate.closest("#zft-hex-travel-console, #zft-hex-travel-log, #zft-hex-travel-workflow-window, #zft-hex-roles-popout, #zft-overland-theme-window, #zft-hex-scale-window")) continue;
      if (candidate.hidden || candidate.getAttribute("aria-hidden") === "true") continue;
      const style = getComputedStyle(candidate);
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (!Number.isFinite(Number.parseFloat(style.zIndex))) continue;
      if (style.position !== "absolute" && style.position !== "fixed") continue;
      const rect = candidate.getBoundingClientRect();
      if (rect.width < 120 || rect.height < 80) continue;
      const z = Number.parseFloat(style.zIndex);
      if (z > 4) nativeMin = Math.min(nativeMin, z);
    }
    this.paneBaseZ = Number.isFinite(nativeMin) ? Math.max(1, Math.min(70, Math.floor(nativeMin) - 4)) : 70;
    for (const [i, id] of this.paneOrder.entries()) {
      const pane = document.getElementById(id);
      if (pane) pane.style.zIndex = String(this.paneBaseZ + i);
    }
    // The independent color editor is above our three panes, but below Foundry
    // and third-party application dialogs. Do not change any native z-index.
    const themeWindow = document.getElementById('zft-overland-theme-window');
    if (themeWindow) themeWindow.style.zIndex = String(this.paneBaseZ + this.paneOrder.length);
    const scaleWindow = document.getElementById("zft-hex-scale-window");
    if (scaleWindow) scaleWindow.style.zIndex = String(this.paneBaseZ + this.paneOrder.length + 1);
  }

  focusExpeditionPane(pane) {
    if (!pane || !this.paneOrder.includes(pane.id)) return;
    this.paneOrder = [...this.paneOrder.filter(id => id !== pane.id), pane.id];
    this.updateExpeditionLayers();
  }

  onOtherApplicationRendered() {
    // Rendering can assign an application's final position and z-index after
    // render hooks fire. One frame later is enough; no document-wide observer,
    // event interception, or transparent click-blocking overlay is installed.
    requestAnimationFrame(() => this.updateExpeditionLayers());
  }

  get state() {
    return game.settings.get(MODULE_ID, UI_KEY) ?? { mode: "hidden", left: 160, top: 80, logWidth: 540, logHeight: 650, logHeightManual: false, logDocked: true, logHidden: false, workflowWidth: 405, workflowDocked: true, workflowHidden: false };
  }
  async remember(override) { await game.settings.set(MODULE_ID, UI_KEY, { ...this.state, ...override }); }
  // Scale entire module panes as visual units from the upper left. Never
  // apply CSS zoom to a child: zoom reflows text in a fixed-width window.
  // Transform keeps the original internal layout and changes rendered size.
  displayScale() { return interfaceScale(this.previewInterfaceScale ?? this.state.interfaceScale) / 100; }
  applyDisplayScale(settings = this.state) {
    const percent = interfaceScale(settings?.interfaceScale);
    const factor = String(percent / 100);
    for (const pane of [this.element, this.workflowElement, this.logElement,
      this.themeEditor?.window, document.getElementById("zft-hex-roles-popout")].filter(Boolean)) {
      pane.style.setProperty("--zft-hex-ui-scale", factor);
    }
    // Late-mounted ZFT popouts inherit only our scoped scale property.
    document.documentElement.style.setProperty("--zft-zot-interface-scale", factor);
    this.refreshScaleWindow();
  }
  // This separate editor never inherits --zft-hex-ui-scale. It is intentionally
  // not docked, not part of the dashboard subtree, and never transformed.
  refreshScaleWindow() {
    const popup = document.getElementById("zft-hex-scale-window");
    if (!popup) return;
    const percent = interfaceScale(this.previewInterfaceScale ?? this.state.interfaceScale);
    const label = popup.querySelector("[data-hex-interface-scale-value]");
    if (label) label.textContent = `${percent}%`;
    const step = [1, 5, 10].includes(Number(this.state.interfaceScaleStep)) ? Number(this.state.interfaceScaleStep) : 5;
    // Read a freshly chosen increment from the popup first; client settings
    // persistence may still be resolving when the next +/- click arrives.
    const chosen = popup.querySelector('[data-hex-scale-step][aria-pressed="true"]');
    const selectedStep = chosen ? Number(chosen.dataset.hexScaleStep) : step;
    for (const button of popup.querySelectorAll("[data-hex-scale-step]")) {
      const active = Number(button.dataset.hexScaleStep) === selectedStep;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    const stepLabel = popup.querySelector("[data-hex-scale-step-value]");
    if (stepLabel) stepLabel.textContent = `${selectedStep}%`;
    for (const button of popup.querySelectorAll('[data-hex-action="scale-adjust"]')) {
      button.disabled = Number(button.dataset.hexScaleDirection) < 0 ? percent <= 60 : percent >= 150;
    }
  }
  toggleScaleWindow() {
    const existing = document.getElementById("zft-hex-scale-window");
    if (existing) { existing.remove(); return; }
    const popup = document.createElement("section");
    popup.id = "zft-hex-scale-window";
    popup.className = "zft-hex-scale-window";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-label", "ZFT Interface Scale");
    popup.innerHTML = `
      <header class="zft-hex-scale-window-head" data-hex-scale-drag>
        <strong><i class="fa-solid fa-sliders" aria-hidden="true"></i> Interface Scale</strong>
        <button type="button" data-hex-action="scale-close" aria-label="Close Interface Scale"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
      </header>
      <div class="zft-hex-scale-window-body">
        <div class="zft-hex-scale-heading"><span>Scale of ZFT windows</span><output data-hex-interface-scale-value aria-live="polite">100%</output></div>
        <div class="zft-hex-scale-control-row">
          <div class="zft-hex-scale-step-picker" role="group" aria-label="Scale adjustment increment">
            <button type="button" data-hex-action="scale-step" data-hex-scale-step="1" aria-pressed="false" title="Adjust by 1 percent">1</button>
            <button type="button" data-hex-action="scale-step" data-hex-scale-step="5" aria-pressed="false" title="Adjust by 5 percent">5</button>
            <button type="button" data-hex-action="scale-step" data-hex-scale-step="10" aria-pressed="false" title="Adjust by 10 percent">10</button>
          </div>
          <div class="zft-hex-scale-adjust" role="group" aria-label="Change interface scale">
            <button type="button" data-hex-action="scale-adjust" data-hex-scale-direction="-1" aria-label="Decrease interface scale by selected increment"><i class="fa-solid fa-minus" aria-hidden="true"></i></button>
            <button type="button" data-hex-action="scale-adjust" data-hex-scale-direction="1" aria-label="Increase interface scale by selected increment"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>
          </div>
        </div>
        <div class="zft-hex-scale-foot"><span>Increment: <strong data-hex-scale-step-value>5%</strong></span><button type="button" data-hex-action="scale-reset" title="Reset interface scale to 100%">Reset</button></div>
        <p class="zft-hex-scale-help">60% to 150% · This client only</p>
      </div>`;
    document.body.appendChild(popup);
    const anchor = this.element?.getBoundingClientRect();
    popup.style.left = `${Math.max(8, Math.min(window.innerWidth - popup.offsetWidth - 8, (anchor?.left ?? 100) + 80))}px`;
    popup.style.top = `${Math.max(8, Math.min(window.innerHeight - popup.offsetHeight - 8, (anchor?.top ?? 100) + 55))}px`;
    ThemeManager.apply();
    this.updateExpeditionLayers();
    const selected = [1,5,10].includes(Number(this.state.interfaceScaleStep)) ? Number(this.state.interfaceScaleStep) : 5;
    const initial = popup.querySelector(`[data-hex-scale-step="${selected}"]`);
    if (initial) initial.setAttribute("aria-pressed", "true");
    this.refreshScaleWindow();
    popup.addEventListener("pointerdown", () => this.updateExpeditionLayers(), {passive:true});
    popup.addEventListener("click", event => {
      const button = event.target.closest("button[data-hex-action]");
      if (!button) return;
      const action = button.dataset.hexAction;
      if (action === "scale-close") { popup.remove(); return; }
      if (action === "scale-step") {
        const step = Number(button.dataset.hexScaleStep);
        if (![1,5,10].includes(step)) return;
        for (const choice of popup.querySelectorAll("[data-hex-scale-step]")) {
          const active = Number(choice.dataset.hexScaleStep) === step;
          choice.classList.toggle("is-active",active);
          choice.setAttribute("aria-pressed",String(active));
        }
        this.refreshScaleWindow();
        void this.remember({interfaceScaleStep:step});
      } else if (action === "scale-adjust") {
        const direction = Number(button.dataset.hexScaleDirection);
        if (![-1,1].includes(direction)) return;
        const step = Number(popup.querySelector('[data-hex-scale-step][aria-pressed="true"]')?.dataset.hexScaleStep) || 5;
        const percent = this.changeInterfaceScale(interfaceScale(this.previewInterfaceScale ?? this.state.interfaceScale) + direction * step);
        void this.remember({interfaceScale:percent});
      } else if (action === "scale-reset") {
        this.changeInterfaceScale(DEFAULT_INTERFACE_SCALE);
        void this.remember({interfaceScale:DEFAULT_INTERFACE_SCALE});
      }
    });
    const header = popup.querySelector("[data-hex-scale-drag]");
    header.addEventListener("pointerdown", event => {
      if (event.button !== 0 || event.target.closest("button")) return;
      const x = event.clientX, y = event.clientY, left = popup.offsetLeft, top = popup.offsetTop;
      const move = e => {
        popup.style.left = `${Math.max(0, Math.min(window.innerWidth - popup.offsetWidth, left + e.clientX - x))}px`;
        popup.style.top = `${Math.max(0, Math.min(window.innerHeight - popup.offsetHeight, top + e.clientY - y))}px`;
      };
      const end = () => { document.removeEventListener("pointermove",move);document.removeEventListener("pointerup",end); };
      document.addEventListener("pointermove",move);document.addEventListener("pointerup",end,{once:true});
      event.preventDefault();
    });
  }
  // Keep the visible GM group origin fixed while changing scale. For players,
  // the Dashboard itself is the origin. Undocked panes remain independent.
  reflowScaledDock(anchor = null) {
    if (!this.element) return;
    const cfg = this.state;
    if (anchor && this.workflowElement && !this.workflowElement.hidden && cfg.workflowDocked !== false) {
      const left = anchor.x + this.workflowElement.getBoundingClientRect().width + 6;
      const top = anchor.y;
      this.element.style.left = `${Math.round(left)}px`;
      this.element.style.top = `${Math.round(top)}px`;
    }
    // Docked panes use the new transformed bounding rectangles, not offsetWidth.
    this.positionWorkflow();
    this.positionLog();
    this.fitDashboardToViewport();
    this.sizeLogToContent();
  }
  changeInterfaceScale(value) {
    const percent = interfaceScale(value);
    const workflow = this.workflowElement;
    const anchor = workflow && !workflow.hidden && this.state.workflowDocked !== false
      ? { x: workflow.getBoundingClientRect().left, y: workflow.getBoundingClientRect().top }
      : null;
    this.previewInterfaceScale = percent;
    this.applyDisplayScale({ interfaceScale: percent });
    this.reflowScaledDock(anchor);
    return percent;
  }
  /** Automatic log height follows rendered history until the GM/player resizes it.
   * Legacy 650px was a default, not evidence of a deliberate user resize.
   * Legacy non-default saved heights are treated as deliberate preferences.
   * Never mutate world ledger, log visibility, or remembered window placement.
   */
  logHeightIsManual() {
    const cfg = this.state;
    if (typeof cfg.logHeightManual === "boolean") return cfg.logHeightManual;
    const legacy = Number(cfg.logHeight ?? cfg.height);
    return Number.isFinite(legacy) && legacy > 0 && legacy !== 650;
  }
  sizeLogToContent() {
    const node = this.logElement;
    if (!node || node.hidden || this.logResizeActive) return;
    const scroller = node.querySelector(`[data-hex-log-panel="${this.activeLogTab}"]`);
    const feed = this.activeLogTab === "travel" ? node.querySelector("[data-hex-cards]") : scroller?.firstElementChild;
    const head = node.querySelector(".zft-hex-log-head");
    const tabs = node.querySelector(".zft-hex-log-tabs");
    if (!scroller || !feed || !head || !tabs) return;
    const factor = this.displayScale();
    const room = Math.max(160, Math.floor((window.innerHeight - node.getBoundingClientRect().top - 8) / factor));
    const minimum = Math.min(205, room);
    if (this.logHeightIsManual()) {
      const saved = Number(this.state.logHeight ?? this.state.height) || 650;
      node.style.height = `${Math.min(room, Math.max(minimum, saved))}px`;
      return;
    }
    const style = getComputedStyle(scroller);
    const pad = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    const desired = Math.ceil(head.offsetHeight + tabs.offsetHeight + feed.scrollHeight + pad + 4);
    node.style.height = `${Math.min(room, Math.max(minimum, desired))}px`;
  }
  fitDashboardToViewport() {
    if (!this.element) return;
    const top = this.element.getBoundingClientRect().top;
    const available = Math.max(220, Math.floor((window.innerHeight - top - 12) / this.displayScale()));
    this.element.style.setProperty("--zft-hex-available-height", `${available}px`);
  }
  scrollToLatest() {
    if (this.activeLogTab !== "travel") return;
    const scroller = this.logElement?.querySelector('[data-hex-log-panel="travel"]');
    if (!scroller || this.logElement?.hidden) return;
    this.scrollingFromCode = true;
    scroller.scrollTop = 0;
    requestAnimationFrame(() => {
      scroller.scrollTop = 0;
      this.scrollingFromCode = false;
      this.updateLatestButton();
    });
  }
  updateLatestButton() {
    const control = this.logElement?.querySelector("[data-hex-log-action='latest']");
    if (control) control.hidden = this.activeLogTab !== "travel" || this.followLatest;
  }
  /** Presentation-only tab selection; never changes expedition state or travel cards. */
  selectLogTab(tab) {
    if (!["travel", "roles", "events"].includes(tab) || !this.logElement) return;
    if (this.activeLogTab === "travel" && tab !== "travel") {
      this.travelTabScroll = this.logElement.querySelector('[data-hex-log-panel="travel"]')?.scrollTop ?? 0;
    }
    this.activeLogTab = tab;
    for (const button of this.logElement.querySelectorAll("[data-hex-log-tab]")) {
      const active = button.dataset.hexLogTab === tab;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    }
    for (const pane of this.logElement.querySelectorAll("[data-hex-log-panel]")) {
      pane.hidden = pane.dataset.hexLogPanel !== tab;
    }
    this.updateLatestButton();
    this.sizeLogToContent();
    if (tab === "travel") {
      if (this.followLatest) this.scrollToLatest();
      else this.logElement.querySelector('[data-hex-log-panel="travel"]').scrollTop = this.travelTabScroll;
    }
  }
  toggle() { return this.setMode(this.element?.dataset.mode === "expanded" ? "hidden" : "expanded"); }
  async showWorkspace() {
    await this.remember({ logHidden: false });
    await this.setMode("expanded");
    if (this.logElement) this.logElement.hidden = false;
    this.sizeLogToContent();
    if (this.followLatest) this.scrollToLatest();
  }
  async setMode(mode) {
    if (!["hidden", "expanded", "bubble"].includes(mode)) return;
    if (mode === "hidden") { this.themeEditor?.cancel(); document.getElementById("zft-hex-scale-window")?.remove(); if (this.panel) this.togglePanel(this.panel); }
    if (mode !== "hidden") this.mount();
    if (this.element) {
      this.element.dataset.mode = mode;
      this.element.hidden = mode === "hidden";
      if (mode === "expanded") this.refresh();
    }
    if (this.logElement) this.logElement.hidden = mode !== "expanded" || !!this.state.logHidden;
    if (mode === "expanded") {
      this.fitDashboardToViewport();
      this.positionLog();
      this.sizeLogToContent();
      if (this.followLatest) this.scrollToLatest();
    }
    if (this.workflowElement) this.workflowElement.hidden = mode !== "expanded";
    if (mode === "expanded") {
      this.fitColumnsToViewport();
      this.positionLog();
      this.positionWorkflow();
    }
    await this.remember({ mode });
  }
  /** Update only the active Log date, never rewriting recorded history or
   * rebuilding / reopening any day card. */
  updateActiveDayCalendarLabel() {
    if (!this.logElement?.isConnected) return;
    const day = Number(getLedger().day);
    const active = this.logElement.querySelector(`[data-hex-day-group="${day}"] .zft-hex-day-calendar`);
    if (!active) return;
    const label = displayedTravelDayDate(day);
    if (active.textContent !== label) active.textContent = label;
  }
  onReady() {
    initializeHexCompletionNotices();
    // World time changes can originate from Calendaria, Rest Recovery, or any GM.
    // Update the clock and provisional current-day date without rebuilding the Log.
    if (this.clockHook == null && typeof Hooks?.on === "function") {
      this.clockHook = Hooks.on("updateWorldTime", () => this.updateClockReadout(true));
      // Calendaria's visual clock may run ahead of committed worldTime. Use its
      // published predicted timestamp, never calculate a second clock.
      this.calendariaClockHooks = [
        ["calendaria.visualTick", data => this.updateClockReadout(false, data?.predictedWorldTime)],
        ["calendaria.clockStartStop", () => this.updateClockReadout(true)],
        ["calendaria.clockUpdate", () => this.updateClockReadout(true)],
        ["calendaria.displayFormatsChanged", () => this.updateClockReadout(true)],
        ["calendaria.calendarSwitched", () => this.updateClockReadout(true)],
        ["calendaria.worldTimeUpdated", () => this.updateClockReadout(true)]
      ].map(([event, fn]) => [event, Hooks.on(event, fn)]);
    }
    window.addEventListener("resize", () => {
      this.fitColumnsToViewport();
      this.fitDashboardToViewport();
      this.positionLog();
      this.sizeLogToContent();
      this.positionWorkflow();
    });
    const saved = this.state;
    if (saved.mode !== "hidden") {
      this.mount();
      this.element.dataset.mode = saved.mode === "bar" ? "bubble" : saved.mode;
      this.logElement.hidden = saved.mode !== "expanded" || !!saved.logHidden;
      if (this.workflowElement) this.workflowElement.hidden = saved.mode !== "expanded";
      this.fitColumnsToViewport();
      this.positionLog();
      this.positionWorkflow();
      this.refresh();
    }
  }
  mount() {
    if (this.element?.isConnected && this.logElement?.isConnected && (!game.user.isGM || this.workflowElement?.isConnected)) return;
    this.activeLogTab = "travel";
    this.travelTabScroll = 0;
    const saved = this.state;
    const node = document.createElement("section");
    node.id = "zft-hex-travel-console";
    node.setAttribute("aria-label", `${MODULE_TITLE} Expedition Dashboard`);
    node.dataset.mode = "expanded";
    node.style.left = `${Math.max(0, Math.min(num(saved.left), window.innerWidth - 80))}px`;
    node.style.top = `${Math.max(0, Math.min(num(saved.top), window.innerHeight - 45))}px`;
    node.innerHTML = `
      <header class="zft-hex-head" data-hex-drag>
        <i class="fa-solid fa-mountain" aria-hidden="true"></i>
        <span class="zft-hex-title" data-hex-title>${esc(MODULE_TITLE)}<small>Expedition Dashboard</small></span>
        <button type="button" data-hex-action="scale" title="Interface scale" aria-label="Adjust ZFT interface scale" aria-haspopup="dialog" aria-controls="zft-hex-scale-window"><i class="fa-solid fa-sliders" aria-hidden="true"></i></button>
        <button type="button" data-hex-action="theme" title="Interface color themes" aria-label="Customize interface colors"><i class="fa-solid fa-palette"></i></button>
        <button type="button" data-hex-action="log-visibility" title="Toggle Expedition Log"><i class="fa-solid fa-scroll"></i></button>
        <button type="button" data-hex-action="bubble" title="Collapse to floating button" aria-label="Collapse"><i class="fa-solid fa-minimize"></i></button>
        <button type="button" data-hex-action="hidden" title="Close dashboard and log" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
      </header>
      <button type="button" class="zft-hex-restore" data-hex-action="expanded" title="Expand expedition" aria-label="Expand expedition"><i class="fa-solid fa-mountain"></i></button>
      <div class="zft-hex-body"><aside class="zft-hex-dashboard" aria-label="Expedition dashboard">
          <div class="zft-hex-expedition-context" data-hex-expedition-context></div>
          <div class="zft-hex-dashboard-summary" data-hex-summary-cards></div>
          <div class="zft-hex-dashboard-content">
            <div class="zft-hex-dashboard-status" data-hex-dashboard-cards></div>
            ${game.user.isGM ? `
              <section class="zft-hex-gm"><div class="zft-hex-gm-title"><i class="fa-solid fa-dice-d20"></i> GM Expedition Controls</div>
                <div class="zft-hex-actions">
                  <button type="button" data-hex-action="travel"><i class="fa-solid fa-route"></i> Start / Continue</button>
                  <button type="button" data-hex-action="day"><i class="fa-solid fa-sun"></i> New Travel Day</button>
                  <button type="button" data-hex-action="roles"><i class="fa-solid fa-user-gear"></i> Expedition Roles</button>
                  <button type="button" data-hex-action="attendance"><i class="fa-solid fa-users"></i> Party Attendance</button>
                  <button type="button" data-hex-action="manage"><i class="fa-solid fa-book-open"></i> Edit Travel Ledger</button>
                  <button type="button" data-hex-action="show-players"><i class="fa-solid fa-display"></i> Show to Players</button>
                  <button type="button" data-hex-action="reset" class="zft-hex-danger"><i class="fa-solid fa-rotate-left"></i> Reset Travel</button>
                  <button type="button" data-hex-action="clear-log" class="zft-hex-danger"><i class="fa-solid fa-trash"></i> Clear Expedition Log</button>
                </div><div class="zft-hex-pending-rolls" data-hex-pending-rolls hidden></div><div class="zft-hex-attendance-editor" data-hex-editor hidden></div>
              </section>` : ""}
          </div></aside></div>`;
    const logNode = document.createElement("section");
    logNode.id = "zft-hex-travel-log";
    logNode.setAttribute("aria-label", "Expedition log window");
    logNode.innerHTML = `
      <header class="zft-hex-log-head" data-hex-log-drag>
        <i class="fa-solid fa-scroll"></i><span>Expedition Log</span>
        <button type="button" data-hex-log-action="latest" class="zft-hex-jump-latest" title="Jump to newest expedition result" hidden><i class="fa-solid fa-arrow-up"></i> Latest</button>
        <button type="button" data-hex-log-action="dock" title="Dock or undock log"><i class="fa-solid fa-link"></i> <span data-hex-dock-label>Undock</span></button>
        <button type="button" data-hex-log-action="hide" title="Hide log"><i class="fa-solid fa-xmark"></i></button>
      </header>
      <nav class="zft-hex-log-tabs" role="tablist" aria-label="Expedition log sections">
        <button type="button" role="tab" id="zft-hex-tab-travel" data-hex-log-tab="travel" aria-controls="zft-hex-panel-travel" aria-selected="true" tabindex="0"><i class="fa-solid fa-route" aria-hidden="true"></i> Travel</button>
        <button type="button" role="tab" id="zft-hex-tab-roles" data-hex-log-tab="roles" aria-controls="zft-hex-panel-roles" aria-selected="false" tabindex="-1"><i class="fa-solid fa-users" aria-hidden="true"></i> Roles</button>
        <button type="button" role="tab" id="zft-hex-tab-events" data-hex-log-tab="events" aria-controls="zft-hex-panel-events" aria-selected="false" tabindex="-1"><i class="fa-solid fa-map" aria-hidden="true"></i> Events</button>
      </nav>
      <div class="zft-hex-scroll" id="zft-hex-panel-travel" role="tabpanel" aria-labelledby="zft-hex-tab-travel" data-hex-log-panel="travel" tabindex="0" aria-label="Scrollable expedition travel history"><div class="zft-hex-log-feed" data-hex-cards role="log" aria-label="Expedition travel history"></div></div>
      <div class="zft-hex-scroll" id="zft-hex-panel-roles" role="tabpanel" aria-labelledby="zft-hex-tab-roles" data-hex-log-panel="roles" tabindex="0" hidden><div class="zft-hex-log-placeholder"><i class="fa-solid fa-users" aria-hidden="true"></i><strong>Expedition Roles</strong><p>Navigation, Reconnaissance, and Expedition Support results will appear here after their resolution rules are designed.</p><small>Placeholder only. No additional rolls or history are recorded.</small></div></div>
      <div class="zft-hex-scroll" id="zft-hex-panel-events" role="tabpanel" aria-labelledby="zft-hex-tab-events" data-hex-log-panel="events" tabindex="0" hidden><div class="zft-hex-log-placeholder"><i class="fa-solid fa-map" aria-hidden="true"></i><strong>Expedition Events</strong><p>Travel Quality, Momentum, Discoveries, Complications, Threat, and Encounters will appear here when their engines are integrated.</p><small>Placeholder only. The existing travel history is unchanged.</small></div></div>
      <div class="zft-hex-log-resize" data-hex-resize-log title="Drag to resize expedition log" aria-label="Resize expedition log"><i class="fa-solid fa-up-right-and-down-left-from-center"></i></div>`;
    if (game.user.isGM) {
      const content = node.querySelector(".zft-hex-dashboard-content");
      const gm = content.querySelector(".zft-hex-gm");
      const summary = node.querySelector("[data-hex-summary-cards]");
      // Three independent columns: GM controls (left), dashboard (middle), log (right).
      // The GM element moves into the controls column below after it is created.
      content.prepend(summary);
    }
    const workflowNode = game.user.isGM ? document.createElement("section") : null;
    if (workflowNode) {
      workflowNode.id = "zft-hex-travel-workflow-window";
      workflowNode.setAttribute("aria-label", "GM Expedition Controls and inline decisions");
      workflowNode.hidden = true;
      workflowNode.innerHTML = `<header class="zft-hex-workflow-head" data-hex-workflow-drag>
        <i class="fa-solid fa-dice-d20" aria-hidden="true"></i><span>GM Expedition Controls</span>
        <button type="button" data-hex-workflow-action="dock" title="Dock or undock GM Controls to Dashboard"><i class="fa-solid fa-link" aria-hidden="true"></i> <span data-hex-workflow-dock-label>Undock</span></button>
      </header><div class="zft-hex-workflow-content">
        <section class="zft-hex-workflow" data-hex-workflow aria-label="Active GM decision" hidden></section>
      </div>`;
      const controls = node.querySelector(".zft-hex-gm");
      workflowNode.querySelector(".zft-hex-workflow-content").prepend(controls);
    }
    document.body.append(node, logNode);
    if (workflowNode) document.body.append(workflowNode);
    for (const pane of [node, logNode, workflowNode].filter(Boolean)) {
      pane.addEventListener("pointerdown", () => this.focusExpeditionPane(pane), { passive: true });
    }
    this.updateExpeditionLayers();
    this.element = node;
    this.logElement = logNode;
    this.workflowElement = workflowNode;
    this.themeEditor = new ThemeEditor(node, () => this.updateExpeditionLayers());
    ThemeManager.apply();
    this.fitDashboardToViewport();
    const migratedWidth = num(saved.logWidth) || Math.max(430, num(saved.width) - 365) || 540;
    // The content-aware height is computed after the first render. A non-default
    // legacy height (or new explicit resize) is restored by sizeLogToContent().
    logNode.style.width = `${Math.min(Math.max(330, migratedWidth), Math.max(330, window.innerWidth - 8))}px`;
    logNode.style.height = "205px";
    if (workflowNode) {
      // GM Controls behaves like the former in-dashboard section: its width is
      // stable, and its height is determined entirely by visible content.
      // Never restore old dev.15 manual resize dimensions on this client.
      workflowNode.style.width = `${Math.min(405, Math.max(300, window.innerWidth - 16))}px`;
      workflowNode.style.height = "auto";
      workflowNode.querySelector("[data-hex-workflow-drag]").addEventListener("pointerdown", event => this.startDragWorkflow(event));
      workflowNode.querySelector("[data-hex-workflow-action='dock']").addEventListener("click", event => void this.toggleWorkflowDock(event));
      // Inline workflow actions and editor buttons use the same delegated
      // handler as the original dashboard GM controls.
      workflowNode.addEventListener("click", event => this.click(event));
    }
    node.addEventListener("contextmenu", event => {
      if (!game.user?.isGM) return;
      const row = event.target.closest("[data-hex-party-actor]");
      if (!row || !node.contains(row)) return;
      event.preventDefault();
      this.showExhaustionMenu(row.dataset.hexPartyActor,event.clientX,event.clientY);
    });
    node.addEventListener("dblclick", event => this.openPartyActorSheet(event));
    node.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (!event.target.closest("[data-hex-actor-sheet]")) return;
      event.preventDefault();
      void this.openPartyActorSheet(event);
    });
    node.addEventListener("click", event => this.click(event));

    logNode.addEventListener("click", event => this.logClick(event));
    logNode.addEventListener("keydown", event => {
      const current = event.target.closest("[data-hex-log-tab]");
      if (!current || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const tabs = [...logNode.querySelectorAll("[data-hex-log-tab]")];
      const index = tabs.indexOf(current);
      if (index < 0) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      this.selectLogTab(tabs[next].dataset.hexLogTab);
      tabs[next].focus();
    });
    const scroller = logNode.querySelector('[data-hex-log-panel="travel"]');
    // Only user-initiated scrolling updates follow mode. Programmatic scroll
    // or content reflow must not turn follow mode off behind the user's back.
    let scrollIntent = false;
    scroller.addEventListener("wheel", event => { scrollIntent = true; }, { passive: true });
    scroller.addEventListener("touchstart", () => { scrollIntent = true; }, { passive: true });
    scroller.addEventListener("pointerdown", () => { scrollIntent = true; });
    scroller.addEventListener("keydown", event => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) scrollIntent = true;
    });
    scroller.addEventListener("scroll", () => {
      if (this.scrollingFromCode || !scrollIntent) return;
      this.followLatest = scroller.scrollTop <= 40;
      this.updateLatestButton();
    }, { passive: true });
    logNode.addEventListener("click", event => {
      const daySummary = event.target.closest(".zft-hex-day-group > summary");
      if (daySummary) {
        const detail = daySummary.parentElement;
        const key = detail.closest("[data-hex-card]")?.dataset.hexCard;
        if (key) requestAnimationFrame(() => { this.dayOpenOverrides.set(key, detail.open); this.sizeLogToContent(); });
        this.followLatest = false;
        this.updateLatestButton();
      }
      const historySummary = event.target.closest(".zft-hex-log-history > summary");
      if (historySummary) {
        const detail = historySummary.parentElement;
        const key = detail.closest("[data-hex-card]")?.dataset.hexCard;
        this.followLatest = false;
        this.updateLatestButton();
        requestAnimationFrame(() => {
          if (detail.matches("details[data-hex-march-key]") && detail.open) {
            // Accordion behavior across all day/hex groups: only one Forced
            // March history entry can be expanded at any time, even when the
            // GM manually opens an earlier completed hour for inspection.
            for (const other of this.logElement.querySelectorAll("details[data-hex-march-key][open]")) {
              if (other !== detail) other.open = false;
            }
          }
          if (key) this.historyOpenOverrides.set(key, detail.open);
          this.sizeLogToContent();
        });
      }
    });
    node.querySelector("[data-hex-drag]").addEventListener("pointerdown", event => this.startDrag(event));
    node.querySelector("[data-hex-action='expanded']").addEventListener("pointerdown", event => this.startDrag(event, true));
    logNode.querySelector("[data-hex-log-drag]").addEventListener("pointerdown", event => this.startDragLog(event));
    logNode.querySelector("[data-hex-resize-log]").addEventListener("pointerdown", event => this.startResizeLog(event));
    logNode.hidden = !!saved.logHidden;
    this.applyDisplayScale(saved);
    this.fitColumnsToViewport();
    this.positionLog();
    this.positionWorkflow();
    this.refresh();
    if (this.followLatest) this.scrollToLatest();
  }
  fitColumnsToViewport() {
    if (!this.element || !this.workflowElement || this.element.dataset.mode !== "expanded") return;
    if (this.state.workflowDocked === false) return;
    const controlsWidth = this.workflowElement.getBoundingClientRect().width || 405;
    const dashboardWidth = this.element.getBoundingClientRect().width || 375;
    const logWidth = this.logElement && !this.logElement.hidden && this.state.logDocked !== false
      ? this.logElement.getBoundingClientRect().width : 0;
    const gap = 6;
    const total = controlsWidth + dashboardWidth + gap + (logWidth ? logWidth + gap : 0);
    const maxAnchor = Math.max(8, window.innerWidth - total - 8);
    // Keep the docked group visible when it fits. If it cannot fit, preserve
    // the chosen scale instead of compressing the windows' text and controls.
    const currentAnchor = this.element.offsetLeft - controlsWidth - gap;
    const anchor = total <= window.innerWidth - 16
      ? Math.max(8, Math.min(currentAnchor, maxAnchor))
      : Math.max(8, currentAnchor);
    this.element.style.left = `${Math.round(anchor + controlsWidth + gap)}px`;
  }
  positionLog() {
    if (!this.element || !this.logElement) return;
    const cfg = this.state;
    const log = this.logElement;
    if (cfg.logDocked === false) {
      log.dataset.docked = "false";
      log.style.left = `${Math.max(0, Math.min(num(cfg.logLeft ?? 550), Math.max(0, window.innerWidth - 80)))}px`;
      log.style.top = `${Math.max(0, Math.min(num(cfg.logTop ?? 80), Math.max(0, window.innerHeight - 40)))}px`;
    } else {
      log.dataset.docked = "true";
      const rect = this.element.getBoundingClientRect();
      const atRight = rect.right + 5;
      // Keep both usable on narrow screens. Allow rightward overflow only when
      // there is no alternative, without altering the dashboard width.
      log.style.left = `${Math.round(atRight)}px`;
      log.style.top = `${Math.round(rect.top)}px`;
    }
    const label = log.querySelector("[data-hex-dock-label]");
    if (label) label.textContent = cfg.logDocked === false ? "Dock" : "Undock";
  }
  /** Match the former inline panel: grow with content; scroll only at viewport edge. */
  constrainWorkflowHeight() {
    const node = this.workflowElement;
    if (!node || node.hidden) return;
    const top = node.getBoundingClientRect().top;
    const available = Math.max(120, (window.innerHeight - top - 12) / this.displayScale());
    node.style.setProperty("--zft-hex-workflow-height-cap", `${Math.floor(available)}px`);
    // Clear even an inline height retained by a previous module build.
    node.style.height = "auto";
  }
  positionWorkflow() {
    if (!this.workflowElement || !this.element) return;
    const cfg = this.state;
    const node = this.workflowElement;
    if (cfg.workflowDocked === false) {
      // Once undocked, movement is independent of Dashboard position.
      const left = Number.isFinite(Number(cfg.workflowLeft)) ? num(cfg.workflowLeft) : node.offsetLeft;
      const top = Number.isFinite(Number(cfg.workflowTop)) ? num(cfg.workflowTop) : node.offsetTop;
      node.style.left = `${Math.max(0, Math.min(left, window.innerWidth - 80))}px`;
      node.style.top = `${Math.max(0, Math.min(top, window.innerHeight - 40))}px`;
    } else {
      const dash = this.element.getBoundingClientRect();
      const width = node.getBoundingClientRect().width || 405;
      node.style.left = `${Math.round(dash.left - width - 6)}px`;
      node.style.top = `${Math.max(8, Math.min(Math.round(dash.top), window.innerHeight - 80))}px`;
    }
    const label = node.querySelector("[data-hex-workflow-dock-label]");
    if (label) label.textContent = cfg.workflowDocked === false ? "Dock" : "Undock";
    node.dataset.docked = cfg.workflowDocked === false ? "false" : "true";
    this.constrainWorkflowHeight();
  }
  async toggleWorkflowDock(event) {
    event.preventDefault();
    event.stopPropagation();
    const node = this.workflowElement;
    if (!node) return;
    const docking = this.state.workflowDocked === false;
    const override = docking ? { workflowDocked: true } : {
      workflowDocked: false,
      workflowLeft: node.offsetLeft,
      workflowTop: node.offsetTop
    };
    await this.remember(override);
    if (docking) this.fitColumnsToViewport();
    this.positionWorkflow();
    if (docking && this.state.logDocked !== false) this.positionLog();
  }
  startDragWorkflow(event) {
    if (event.button !== 0 || event.target.closest("button") || !this.workflowElement) return;
    const node = this.workflowElement;
    const initial = {x:event.clientX,y:event.clientY,left:node.offsetLeft,top:node.offsetTop};
    let moved = false;
    const move = ev => {
      if (Math.abs(ev.clientX-initial.x)+Math.abs(ev.clientY-initial.y)>5) moved=true;
      node.style.left=`${Math.max(0,Math.min(initial.left+ev.clientX-initial.x,window.innerWidth-80))}px`;
      node.style.top=`${Math.max(0,Math.min(initial.top+ev.clientY-initial.y,window.innerHeight-40))}px`;
      this.constrainWorkflowHeight();
    };
    const stop = () => {
      document.removeEventListener("pointermove",move);document.removeEventListener("pointerup",stop);document.removeEventListener("pointercancel",stop);
      if(moved) {
        const label = node.querySelector("[data-hex-workflow-dock-label]");
        if(label)label.textContent="Dock";
        node.dataset.docked="false";
        void this.remember({workflowDocked:false,workflowLeft:node.offsetLeft,workflowTop:node.offsetTop});
      }
    };
    document.addEventListener("pointermove",move);document.addEventListener("pointerup",stop);document.addEventListener("pointercancel",stop);
  }
  async logClick(event) {
    const tab = event.target.closest("button[data-hex-log-tab]");
    if (tab && this.logElement?.contains(tab)) return void this.selectLogTab(tab.dataset.hexLogTab);
    const button = event.target.closest("button[data-hex-log-action]");
    if (!button || !this.logElement?.contains(button)) return;
    if (button.dataset.hexLogAction === "latest") {
      this.followLatest = true;
      this.scrollToLatest();
      this.updateLatestButton();
    } else if (button.dataset.hexLogAction === "hide") {
      this.logElement.hidden = true;
      await this.remember({ logHidden: true });
    } else if (button.dataset.hexLogAction === "dock") {
      const logDocked = this.state.logDocked === false;
      await this.remember({ logDocked });
      this.positionLog();
    }
  }
  async toggleLogVisibility() {
    this.mount();
    const show = !!this.logElement.hidden;
    this.logElement.hidden = !show;
    await this.remember({ logHidden: !show });
    if (show) {
      this.positionLog();
      this.sizeLogToContent();
      if (this.followLatest) this.scrollToLatest();
    }
  }
  startDrag(event, fromBubble = false) {
    if (event.button !== 0 || (!fromBubble && event.target.closest("button"))) return;
    const node = this.element;
    if (!node) return;
    const origin = { x: event.clientX, y: event.clientY, left: node.offsetLeft, top: node.offsetTop };
    this.dragMoved = false;
    const move = ev => {
      if (Math.abs(ev.clientX - origin.x) + Math.abs(ev.clientY - origin.y) > 6) this.dragMoved = true;
      node.style.left = `${Math.max(0, Math.min(origin.left + ev.clientX - origin.x, window.innerWidth - 80))}px`;
      node.style.top = `${Math.max(0, Math.min(origin.top + ev.clientY - origin.y, window.innerHeight - 35))}px`;
      this.fitColumnsToViewport();
      this.fitDashboardToViewport();
      if (this.state.logDocked !== false) this.positionLog();
      if (this.state.workflowDocked !== false) this.positionWorkflow();
    };
    const stop = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", stop);
      document.removeEventListener("pointercancel", stop);
      void this.remember({ left: node.offsetLeft, top: node.offsetTop });
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", stop);
    document.addEventListener("pointercancel", stop);
  }
  startDragLog(event) {
    if (event.button !== 0 || event.target.closest("button") || !this.logElement) return;
    const node = this.logElement;
    const o = { x:event.clientX, y:event.clientY, left: node.offsetLeft, top: node.offsetTop };
    let moved = false;
    const move = ev => {
      if (Math.abs(ev.clientX - o.x) + Math.abs(ev.clientY - o.y) > 5) moved = true;
      node.style.left = `${Math.max(0, Math.min(o.left + ev.clientX - o.x, window.innerWidth - 80))}px`;
      node.style.top = `${Math.max(0, Math.min(o.top + ev.clientY - o.y, window.innerHeight - 40))}px`;
    };
    const stop = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", stop);
      document.removeEventListener("pointercancel", stop);
      if (moved) void this.remember({ logDocked: false, logLeft: node.offsetLeft, logTop: node.offsetTop });
      const label = node.querySelector("[data-hex-dock-label]");
      if (moved && label) { label.textContent = "Dock"; node.dataset.docked = "false"; }
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", stop);
    document.addEventListener("pointercancel", stop);
  }
  startResizeLog(event) {
    if (event.button !== 0 || !this.logElement) return;
    event.preventDefault(); event.stopPropagation();
    const node = this.logElement;
    const rect = node.getBoundingClientRect();
    const origin = { x:event.clientX, y:event.clientY, width:node.offsetWidth, height:node.offsetHeight };
    let resized = false;
    this.logResizeActive = true;
    const move = ev => {
      if (Math.abs(ev.clientX - origin.x) + Math.abs(ev.clientY - origin.y) > 3) resized = true;
      const factor = this.displayScale();
      const maxW = Math.max(330, (window.innerWidth - node.offsetLeft - 8) / factor);
      const maxH = Math.max(205, (window.innerHeight - node.offsetTop - 8) / factor);
      node.style.width = `${Math.round(Math.min(maxW, Math.max(330, origin.width + (ev.clientX - origin.x) / factor)))}px`;
      node.style.height = `${Math.round(Math.min(maxH, Math.max(205, origin.height + (ev.clientY - origin.y) / factor)))}px`;
    };
    const stop = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", stop);
      document.removeEventListener("pointercancel", stop);
      this.logResizeActive = false;
      if (resized) void this.remember({
        logWidth: Math.round(node.offsetWidth), logHeight: Math.round(node.offsetHeight), logHeightManual: true
      });
      else this.sizeLogToContent();
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", stop);
    document.addEventListener("pointercancel", stop);
  }
  updateClockReadout(force = false, predictedWorldTime = null) {
    if (!this.element?.isConnected || this.element.hidden) return;
    const time = game.time;
    const timestamp = Number.isFinite(predictedWorldTime) ? predictedWorldTime : time?.worldTime;
    if (!Number.isFinite(timestamp)) return;
    const displaySecond = Math.floor(timestamp);
    if (!force && displaySecond === this.lastDisplaySecond) return;
    this.lastDisplaySecond = displaySecond;
    const calendaria = game.modules?.get?.("calendaria")?.active ? globalThis.CALENDARIA?.api : null;
    let components;
    try { components = time?.calendar?.timeToComponents?.(timestamp) ?? time?.components ?? {}; }
    catch { components = time?.components ?? {}; }
    const set = (selector, value) => {
      const target = this.element.querySelector(selector);
      if (target && target.textContent !== value) target.textContent = value;
    };
    let displayFormats = null;
    if (calendaria) {
      try { displayFormats = game.settings.get("calendaria", "displayFormats"); } catch { /* Older Calendaria settings */ }
    }
    // Mirror the configured HUD time, including seconds when enabled.
    // Calendaria owns clock speed, paused state and display preferences.
    const displayTime = formatCalendariaHud({api:calendaria, components, displayFormats, isGM:!!game.user?.isGM}) ||
      timeLabel(components.hour, components.minute, components.second ?? 0);
    set("[data-hex-live-time]", displayTime);
    const displayMinute = Math.floor(timestamp / 60);
    if (!force && displayMinute === this.lastDetailMinute) return;
    this.lastDetailMinute = displayMinute;
    this.updateActiveDayCalendarLabel();
    let date = currentFoundryDate();
    if (calendaria) date = formatCalendariaHud({api:calendaria, components, displayFormats, isGM:!!game.user?.isGM, location:"hudDate"}) || date;
    set("[data-hex-live-date]", date || "Current date unavailable");
    let sunrise = null, sunset = null;
    try {
      if (typeof calendaria?.getSunrise === "function") sunrise = calendaria.getSunrise();
      if (typeof calendaria?.getSunset === "function") sunset = calendaria.getSunset();
    } catch (error) { console.warn("[ZFT][HexTravel] Daylight information unavailable:", error); }
    const days = time?.calendar?.days ?? {};
    const state = getSnapshot().state ?? DEFAULT_LEDGER;
    const displayProgress = game.settings.get(MODULE_ID, HEX_KEY) ?? {};
    const remaining = num(state.pending);
    const validRemaining = remaining > 0 && Number(displayProgress.totalHours) >= remaining &&
      num(displayProgress.baseHexes) === num(state.hexes);
    const view = expeditionClockView({
      hour:components.hour, minute:components.minute,
      sunrise, sunset, remainingHours:validRemaining ? remaining : null,
      hoursPerDay:days.hoursPerDay ?? 24,
      minutesPerHour:days.minutesPerHour ?? 60
    });
    set("[data-hex-live-sun]", view.daylight);
    set("[data-hex-live-eta]", view.eta);
    const etaRow = this.element.querySelector("[data-hex-eta-row]");
    if (etaRow) etaRow.hidden = !view.eta;
    const note = this.element.querySelector("[data-hex-live-night]");
    if (note) {
      note.hidden = !view.nightNote;
      if (view.nightNote) note.textContent = view.nightNote;
    }
  }

  refresh() {
    if (!this.element || !this.logElement) return;
    this.closeExhaustionMenu();
    const summary = this.element.querySelector("[data-hex-summary-cards]");
    const dashboard = this.element.querySelector("[data-hex-dashboard-cards]");
    const log = this.logElement.querySelector("[data-hex-cards]");
    if (!summary || !dashboard || !log) return;
    const identity = hexTravelIdentity();
    const title = this.element.querySelector("[data-hex-title]");
    if (title) title.innerHTML = `${esc(MODULE_TITLE)}<small>Expedition Dashboard</small>`;
    const context = this.element.querySelector("[data-hex-expedition-context]");
    if (context) {
      const regionText = identity.region || "Region not set";
      const campaignText = identity.world ? `<span class="zft-hex-context-world"><i class="fa-solid fa-globe" aria-hidden="true"></i> ${esc(identity.world)}</span>` : "";
      const eyebrow = identity.name === DEFAULT_IDENTITY.name ? "Current Expedition" : identity.name;
      context.innerHTML = `<span class="zft-hex-context-details"><span class="zft-hex-context-eyebrow">${esc(eyebrow)}</span><strong><i class="fa-solid fa-map-location-dot" aria-hidden="true"></i> ${esc(regionText)}</strong>${campaignText}</span>` +
        `<span class="zft-hex-context-clock"><strong class="zft-hex-current-time" data-hex-live-time>—</strong><small data-hex-live-date>Date unavailable</small>${game.user.isGM ? `<button type="button" data-hex-action="identity" title="Edit expedition location"><i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> Edit</button>` : ""}</span>`;
    }
    const snapshot = getSnapshot();
    const currentDayState = String(snapshot.state?.day ?? 1);
    const changedDay = this.lastDayState !== null && this.lastDayState !== currentDayState;
    const previousDay = this.lastDayState;
    if (changedDay) {
      // A successful New Travel Day publishes the new ledger/snapshot. Collapse
      // the old day even if a GM manually left it open. A canceled dialog does
      // not publish a new day and cannot reach this branch.
      this.dayOpenOverrides.set(`day:${previousDay}`, false);
      this.dayOpenOverrides.set(`day:${currentDayState}`, true);
      this.followLatest = true;
    }
    this.lastDayState = currentDayState;
    const cards = makeCards(snapshot);
    const scroller = this.logElement.querySelector('[data-hex-log-panel="travel"]');
    const travelVisible = this.activeLogTab === "travel";
    const previousScroll = scroller.scrollTop;
    const previousHeight = scroller.scrollHeight;
    const scrollerTop = travelVisible ? scroller.getBoundingClientRect().top : 0;
    const anchor = travelVisible && !this.followLatest ? [...log.children].find(node => node.getBoundingClientRect().bottom > scrollerTop + 1) : null;
    const anchorKey = anchor?.dataset.hexCard;
    const anchorOffset = anchor ? anchor.getBoundingClientRect().top - scrollerTop : 0;
    syncCards(summary, cards.filter(card => card.key === "overview"));
    this.updateClockReadout(true);
    syncCards(dashboard, cards.filter(card => card.key === "party"));
    syncCards(log, cards.filter(card => !["overview", "party"].includes(card.key)), this.dayOpenOverrides, this.historyOpenOverrides);
    // When a new hour begins or travel completes, collapse the prior hour,
    // regardless of saved DOM expansion state. A newly resolved active hour
    // alone may auto-open. Ordinary refreshes preserve deliberate manual
    // inspection, but never allow several Forced March records to remain open.
    const marchHistory = Array.isArray(snapshot.state?.marchHistory) ? snapshot.state.marchHistory : [];
    const lastMarch = marchHistory[marchHistory.length - 1];
    const marchTimelineState = [snapshot.state?.day, snapshot.state?.hours, snapshot.state?.pending,
      snapshot.phase, marchHistory.length, lastMarch?.recordedAt ?? ""].join(":");
    if (this.lastMarchTimelineState !== marchTimelineState) {
      for (const detail of log.querySelectorAll("details[data-hex-march-key]")) {
        detail.open = detail.hasAttribute("data-hex-march-held");
      }
      this.lastMarchTimelineState = marchTimelineState;
    }
    // Defensive accordion reconciliation when a card is rebuilt while the
    // timeline has not changed (including reopening older travel days).
    const expandedMarches = [...log.querySelectorAll("details[data-hex-march-key][open]")];
    if (expandedMarches.length > 1) {
      const preferred = expandedMarches.find(d => d.hasAttribute("data-hex-march-held")) ?? expandedMarches[0];
      for (const detail of expandedMarches) if (detail !== preferred) detail.open = false;
    }
    if (changedDay) {
      // Explicitly synchronize <details> state even when a card's markup did
      // not change and syncCards retained the existing node.
      for (const dayElement of log.querySelectorAll("details[data-hex-day-group]")) {
        const key = `day:${dayElement.dataset.hexDayGroup}`;
        if (this.dayOpenOverrides.has(key)) dayElement.open = this.dayOpenOverrides.get(key);
      }
    }
    // Change identity labels in the view without changing saved card HTML.
    for (const heading of log.querySelectorAll("[data-hex-stage-title]")) heading.textContent = "Hex Travel";
    const place = [identity.region, identity.world].filter(Boolean).join(" · ");
    for (const label of log.querySelectorAll("[data-hex-stage-location]")) {
      label.textContent = place;
      label.style.display = place ? "" : "none";
    }
    if (!travelVisible) {
      // The Travel feed remains mounted but hidden. Do not derive scroll
      // anchors from its zero-sized geometry while another tab is selected.
    } else if (this.followLatest) this.scrollToLatest();
    else {
      const anchorNow = [...log.children].find(node => node.dataset.hexCard === anchorKey);
      if (anchorNow) scroller.scrollTop += anchorNow.getBoundingClientRect().top - scroller.getBoundingClientRect().top - anchorOffset;
      else scroller.scrollTop = Math.max(0, previousScroll + scroller.scrollHeight - previousHeight);
    }
    this.updateLatestButton();
    this.sizeLogToContent();
    this.logHasRendered = true;
    // The independent role editor owns its own inputs. An unrelated dashboard
    // refresh must never destroy unsaved assignments in that pop-out.
    if (this.panel && this.panel !== "roles" && !this.workflowElement?.querySelector("[data-hex-editor] input")) this.renderPanel();
  }
  /** Restore only the local module windows hidden for a particular native roll. */
  restoreExpeditionRollDialog(application) {
    const targets = this.rollWindowOcclusions.get(application);
    if (!targets) return;
    this.rollWindowOcclusions.delete(application);
    for (const target of targets) {
      const record = this.rollWindowVisibility.get(target);
      if (!record) continue;
      if (--record.count === 0) {
        target.style.visibility = record.original;
        this.rollWindowVisibility.delete(target);
      }
    }
  }
  temporarilyRevealRollDialog(application, frame) {
    if (this.rollWindowOcclusions.has(application)) return;
    const r = frame.getBoundingClientRect();
    const overlapping = [this.element, this.logElement, this.workflowElement].filter(node => {
      if (!node || node.hidden) return false;
      const b = node.getBoundingClientRect();
      return r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top;
    });
    if (!overlapping.length) return;
    this.rollWindowOcclusions.set(application, overlapping);
    for (const target of overlapping) {
      const existing = this.rollWindowVisibility.get(target);
      if (existing) existing.count++;
      else {
        this.rollWindowVisibility.set(target, { original: target.style.visibility, count: 1 });
        target.style.visibility = "hidden";
      }
    }
  }
  /**
   * Position only a native saving-throw application rendered during an active
   * Hex Travel party-CON request. Never touch global interface z-indices,
   * block pointer events, or change the application's form/roll callbacks.
   */
  positionExpeditionRollDialog(application, element) {
    if (!this.element || !this.logElement || this.element.hidden) return;
    const snapshot = getSnapshot();
    if (snapshot.phase !== "Saving throws") return;
    const hour = num(snapshot.state?.hours) + 1;
    if (hour <= 8 || num(snapshot.state?.pending) === 0) return;
    const title = String(application?.window?.title ?? element?.querySelector?.(".window-title")?.textContent ?? "");
    if (!/saving throw/i.test(title)) return;
    const text = String(element?.textContent ?? "").slice(0, 3500);
    // Requiring an assigned party member's name prevents unrelated saving
    // throws triggered in the same session from being repositioned.
    if (!presentRoster().some(actor => text.includes(actor.name) || title.includes(actor.name))) return;
    requestAnimationFrame(() => {
      const frame = application?.element;
      if (!frame?.isConnected || !this.logElement || this.logElement.hidden) return;
      // Never move the prompt again after the player has manually dragged it.
      if (frame.dataset.zftIrPositioned === "true") return;
      const log = this.logElement.getBoundingClientRect();
      const width = Math.max(300, frame.getBoundingClientRect().width || 380);
      const height = Math.max(220, frame.getBoundingClientRect().height || 400);
      const margin = 12;
      let left = Math.round(log.right + margin);
      let top = Math.round(Math.max(8, Math.min(log.top, window.innerHeight - height - 8)));
      if (left + width > window.innerWidth - 8) {
        // No space beside the log. Try the left. Otherwise keep Foundry's
        // native position and locally conceal only the module window(s) that
        // would block this roll; closeApplicationV2 restores them afterward.
        const leftOfDashboard = this.element.getBoundingClientRect().left - width - margin;
        if (leftOfDashboard < 8) {
          this.temporarilyRevealRollDialog(application, frame);
          frame.dataset.zftIrPositioned = "true";
          return;
        }
        left = Math.round(leftOfDashboard);
      }
      try {
        application.setPosition?.({ left, top });
        frame.dataset.zftIrPositioned = "true";
      } catch (error) { console.warn("[ZFT][HexTravel] Could not position expedition roll dialog", error); }
    });
  }
  /** DialogV2.wait-compatible GM decisions in a separate movable window. */
  prompt(options) {
    const host = this.workflowElement?.querySelector("[data-hex-workflow]");
    if (!game.user?.isGM || !host) return foundry.applications.api.DialogV2.wait(options);
    if (this.pendingPrompt) return Promise.reject(new Error("Another GM expedition prompt is still active."));
    host.hidden = false;
    host.replaceChildren();
    this.positionWorkflow();
    if (this.element?.dataset.mode === "expanded") this.workflowElement.hidden = false;
    this.constrainWorkflowHeight();
    const form = document.createElement("form");
    form.className = "zft-hex-prompt-form";
    form.noValidate = true;
    const heading = document.createElement("h3");
    heading.className = "zft-hex-prompt-title";
    heading.textContent = options.window?.title ?? "Expedition Decision";
    form.append(heading);
    const content = document.createElement("div");
    content.className = "zft-hex-prompt-content";
    // The original day/forced-march prompts carry legacy inline blue panel
    // colors. Harmonize their surface with GM Controls without changing data.
    const stageTitle = String(options.window?.title ?? "");
    // dev.60: style only these two paired-action GM workflows.
    if (/Hex Travel/i.test(stageTitle)) form.classList.add("zft-hex-compact-hex-form");
    if (/Start New Travel Day/i.test(stageTitle)) form.classList.add("zft-hex-new-day-form");
    if (/Start New Travel Day|Forced March/.test(stageTitle)) content.classList.add("zft-hex-gm-decision-content");
    if (/Hex Travel|Navigation Ruling|Roll$|Edit Saved|Manage Saved/.test(stageTitle))
      content.classList.add("zft-hex-travel-stage-content");
    content.innerHTML = options.content ?? "";
    const actions = document.createElement("div");
    actions.className = "zft-hex-prompt-actions";
    // The adjudication dialog gets a paired, two-line footer; other GM
    // decisions keep the shared standard action layout.
    const isForcedRuling = /Party CON DC/i.test(String(options.window?.title ?? ""));
    const isForcedHourChoice = /Forced March · Hour/i.test(String(options.window?.title ?? ""));
    if (isForcedRuling) actions.classList.add("zft-hex-forced-decision-actions");
    if (isForcedHourChoice) actions.classList.add("zft-hex-march-choice-actions");
    const defs = options.buttons ?? [];
    for (const option of defs) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.action = option.action ?? "";
      button.dataset.hexPromptAction = option.action ?? "";
      if (option.default) button.classList.add("zft-hex-prompt-default");
      if (option.action === "reset" || option.action === "exhaust") button.classList.add("zft-hex-danger");
      if (option.icon) { const icon = document.createElement("i"); icon.className = option.icon; button.append(icon, " "); }
      if (isForcedRuling && ["apply", "pause"].includes(option.action)) {
        // Keep accessible labels and all existing DialogV2 callback/action wiring.
        button.setAttribute("aria-label", option.label ?? option.action);
        const primary = document.createElement("span");
        primary.className = "zft-hex-action-primary";
        primary.textContent = option.action === "apply" ? "Process Party" : "Pause / Exit";
        const secondary = document.createElement("span");
        secondary.className = "zft-hex-action-secondary";
        secondary.textContent = option.action === "apply" ? "Decisions" : "Saves Progress";
        button.append(primary, secondary);
      } else if (isForcedHourChoice && ["continue", "cancel"].includes(option.action)) {
        button.setAttribute("aria-label", option.label ?? option.action);
        const primary = document.createElement("span");
        primary.className = "zft-hex-action-primary";
        primary.textContent = option.action === "continue" ? "Continue" : "Pause / Exit";
        const secondary = document.createElement("span");
        secondary.className = "zft-hex-action-secondary";
        secondary.textContent = option.action === "continue" ? `Hour ${String(options.window?.title ?? "").match(/Hour (\d+)/)?.[1] ?? ""}` : "Save Progress";
        button.append(primary, secondary);
      } else button.append(document.createTextNode(option.label ?? option.action ?? "Continue"));
      actions.append(button);
    }
    if (!defs.some(option => /cancel|pause|exit|stop/i.test(`${option.action ?? ""} ${option.label ?? ""}`))) {
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.dataset.hexPromptCancel = "true";
      cancel.textContent = "Cancel / Exit";
      actions.append(cancel);
    }
    if (isForcedRuling) {
      const refreshRulingRow = (select) => {
        const row = select.closest("[data-hex-ruling-row]");
        if (!row) return;
        const current = Number(row.dataset.hexCurrentExhaustion) || 0;
        const outcome = select.value;
        row.classList.remove("ruling-exhaust", "ruling-accept", "ruling-neutral");
        row.classList.add(outcome === "exhaust" ? "ruling-exhaust" : outcome === "accept" ? "ruling-accept" : "ruling-neutral");
        const projected = outcome === "exhaust" ? Math.min(6, current + 1) : current;
        row.querySelector("[data-hex-projected-exhaustion]").textContent =
          outcome === "exhaust" ? `${current} → ${projected}` : String(current);
        row.querySelector(".zft-hex-gm-ruling-exhaustion")?.classList.toggle("has-exhaustion", projected > 0);
      };
      content.addEventListener("change", event => {
        if (event.target.matches("[data-hex-gm-ruling-select]")) refreshRulingRow(event.target);
      });
      for (const select of content.querySelectorAll("[data-hex-gm-ruling-select]")) refreshRulingRow(select);
    }
    // Workflow-specific actions belong after the decision form and review list.
    // This preserves the existing buttons, callbacks and cancellation logic.
    form.append(content, actions);
    host.append(form);
    this.constrainWorkflowHeight();
    const dialogLike = { element: host };
    try { options.render?.(null, dialogLike); }
    catch (error) {
      console.error("[ZFT][HexTravel] GM prompt render failed", error);
      host.hidden = true;
      host.replaceChildren();
      return Promise.reject(error);
    }
    // Never scroll the dashboard or map when a GM workflow opens.
    return new Promise(resolve => {
      let active = true;
      const finish = value => {
        if (!active) return;
        active = false;
        this.pendingPrompt = null;
        host.hidden = true;
        host.replaceChildren();
        resolve(value);
      };
      this.pendingPrompt = {
        // Only explicit, pre-commit GM setup prompts may be closed by clicking
        // their owning toolbar button again. Other prompts remain protected.
        toggleKey: options.toggleKey === "travel" || options.toggleKey === "day" ? options.toggleKey : null,
        committing: false,
        close: () => finish(typeof options.close === "function" ? options.close() : null)
      };
      actions.addEventListener("click", async event => {
        if (event.target.closest("button[data-hex-prompt-cancel]")) {
          event.preventDefault();
          this.pendingPrompt?.close();
          return;
        }
        const button = event.target.closest("button[data-hex-prompt-action]");
        if (!button || !active) return;
        event.preventDefault();
        const option = defs.find(item => item.action === button.dataset.hexPromptAction);
        if (!option) return;
        button.disabled = true;
        if (this.pendingPrompt) this.pendingPrompt.committing = true;
        try { finish(await option.callback?.(event, button)); }
        catch (error) {
          if (this.pendingPrompt) this.pendingPrompt.committing = false;
          console.error("[ZFT][HexTravel] Inline GM prompt failed", error);
          ui.notifications.error(`Expedition prompt: ${error.message}`);
          button.disabled = false;
        }
      });
      form.addEventListener("submit", event => {
        event.preventDefault();
        const preferred = actions.querySelector(".zft-hex-prompt-default") ?? actions.querySelector("button");
        preferred?.click();
      });
      form.addEventListener("keydown", event => {
        if (event.key === "Escape") { event.preventDefault(); this.pendingPrompt?.close(); }
      });
    });
  }
  dismissPrompt() { this.pendingPrompt?.close(); }
  togglePanel(mode) {
    if (this.panel === mode) this.panel = null;
    else this.panel = mode;
    const editor = this.workflowElement?.querySelector("[data-hex-editor]");
    if (!editor) return;
    editor.hidden = !this.panel;
    editor.replaceChildren();
    if (this.panel) this.renderPanel();
    this.constrainWorkflowHeight();
  }
  renderPanel() {
    const editor = this.workflowElement?.querySelector("[data-hex-editor]");
    if (!editor || !this.panel) return;
    const st = getLedger();
    editor.dataset.hexPanel = this.panel;
    const buttons = (save, label="Save") => `<div class="zft-hex-actions"><button type="button" data-hex-action="${save}">${label}</button><button type="button" data-hex-action="panel-cancel">Cancel</button></div>`;
    if (this.panel === "roles") {
      const roster = presentRoster();
      const current = hexTravelRolePreferences();
      const existing = { ...(current.assignments ?? {}) };
      // Older worlds stored only navigator and secondary assignments.
      if (!existing.guide && current.navigatorUuid) existing.guide = current.navigatorUuid;
      const oldSecondary = { scout: "scout", conceal: "scout", investigate: "tracker", nature: "forager", arcane: "tracker" }[current.activity];
      if (oldSecondary && !existing[oldSecondary]) existing[oldSecondary] = current.secondaryUuid;
      const sections = EXPEDITION_PAIRS.map(pair => `<fieldset class="zft-hex-role-pair"><legend>${esc(pair.name)}</legend>${pair.roles.map(key => {
        const role = EXPEDITION_ROLES[key];
        const options = `<option value="">Unassigned</option>` + roster.map(actor => `<option value="${esc(actor.uuid)}" ${existing[key] === actor.uuid ? "selected" : ""}>${esc(actor.name)}</option>`).join("");
        return `<label><strong class="zft-hex-role-assignment-name">${esc(role.name)}</strong><span class="zft-hex-role-assignment-skill">${esc(travelSkill(roster[0] ?? {},role.skill).label)} (${esc(role.ability)})</span><select data-hex-expedition-role="${esc(key)}">${options}</select></label>`;
      }).join("")}</fieldset>`).join("");
      editor.innerHTML = `<div class="zft-hex-card-title">Expedition Roles</div>
        <p>One role per character. Unassigned roles may be left empty.</p>
        <div class="zft-hex-roles-scroll"><div class="zft-hex-fields zft-hex-roles-fields">${sections}</div></div>
        ${buttons("roles-save", "Save Expedition Roles")}`;
      const roleSelects = [...editor.querySelectorAll("select[data-hex-expedition-role]")];
      // Every character can be assigned to just one role. Disable assigned PCs
      // in the other dropdowns immediately; saving still validates the rule.
      const refreshRoleOptions = () => {
        const taken = new Set();
        for (const select of roleSelects) {
          if (select.value && taken.has(select.value)) select.value = "";
          if (select.value) taken.add(select.value);
        }
        for (const select of roleSelects) {
          const others = new Set(roleSelects.filter(other => other !== select).map(other => other.value).filter(Boolean));
          for (const option of select.options) {
            option.disabled = !!option.value && others.has(option.value);
            option.classList.toggle("zft-hex-role-unavailable", option.disabled);
            option.title = option.disabled ? "Already assigned to another expedition role" : "";
          }
        }
      };
      for (const select of roleSelects) select.addEventListener("change", refreshRoleOptions);
      refreshRoleOptions();
    } else if (this.panel === "attendance") {
      const excluded = new Set(attendanceConfig().excludedActorUuids ?? []);
      const options = assignedRoster().map(actor => `<label><input type="checkbox" data-hex-actor="${esc(actor.uuid)}" ${excluded.has(actor.uuid) ? "" : "checked"}> <span>${esc(actor.name)}</span></label>`).join("");
      editor.innerHTML = `<div class="zft-hex-card-title"><i class="fa-solid fa-users" aria-hidden="true"></i> Party Attendance</div><p>Offline assigned PCs remain eligible.</p><div class="zft-hex-members">${options || "No assigned PCs."}</div>${buttons("attendance-save", "Save Attendance")}`;
    } else if (this.panel === "manage") {
      editor.innerHTML = `<div class="zft-hex-card-title"><i class="fa-solid fa-book-open" aria-hidden="true"></i> Edit Travel Ledger</div>
        <div class="zft-hex-fields zft-hex-ledger-fields">
          <label><span>Expedition Day</span><input name="day" type="number" min="1" step="1" value="${num(st.day)}"></label>
          <label><span>Hours Today</span><input name="hours" type="number" min="0" step="1" value="${num(st.hours)}"></label>
          <label><span>Unfinished Hex Hours</span><input name="pending" type="number" min="0" step="1" value="${num(st.pending)}"></label>
          <label><span>Completed Hexes</span><input name="hexes" type="number" min="0" step="1" value="${num(st.hexes)}"></label>
        </div><p class="zft-hex-editor-warning"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Saving clears hourly roll history and Forced March checkpoints.</p>
        ${buttons("manage-save", "Save Ledger")}`;
    } else if (this.panel === "reset") {
      editor.innerHTML = `<div class="zft-hex-reset-inline"><div class="zft-hex-card-title red"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Reset Travel</div><p>Clear all saved travel hours, hexes, pending time, forced-march rulings, and current expedition results. This cannot be undone. Actor Exhaustion is not changed.</p><label>Type RESET to confirm<input name="confirmation" type="text" autocomplete="off" placeholder="RESET"></label></div>${buttons("reset-save", "Permanently Reset")}`;
      editor.querySelector("[data-hex-action='reset-save']")?.classList.add("zft-hex-danger");
    } else if (this.panel === "identity") {
      const id = hexTravelIdentity();
      editor.innerHTML = `<div class="zft-hex-card-title"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Expedition Details</div>
      <p>Set the travel location so it is prominent in the dashboard and travel logs.</p>
      <div class="zft-hex-fields zft-hex-identity-fields">
        <label class="zft-hex-region-field">Region / Location<input name="region" type="text" maxlength="100" placeholder="Where is the party traveling?" value="${esc(id.region)}"></label>
        <label>Expedition Name<input name="name" type="text" maxlength="100" value="${esc(id.name)}"></label>
        <label>Campaign / World<input name="world" type="text" maxlength="100" value="${esc(id.world)}"></label>
      </div>
      ${buttons("identity-save", "Save Expedition Details")}
      <div class="zft-hex-calendar-check"><strong>Foundry calendar</strong><span>${esc(currentFoundryDate() || "Date unavailable")}</span>
      <p>Dates come from the active calendar and remain recorded for past days. If this day's date was captured with an incorrect year in an earlier build, synchronize only the current day.</p>
      <button type="button" data-hex-action="sync-date"><i class="fa-solid fa-calendar-check"></i> Re-sync Current Travel Date</button></div>`;
    } else if (this.panel === "clear-log") {
      editor.innerHTML = `<div class="zft-hex-reset-inline"><div class="zft-hex-card-title red"><i class="fa-solid fa-trash" aria-hidden="true"></i> Clear Expedition Log</div><p>This permanently removes expedition result cards from the GM and player log windows, including saved visual history. It does not delete Foundry Chat messages, change travel hours, or alter effects.</p><label>Type CLEAR LOG to confirm<input name="confirmation" type="text" autocomplete="off" placeholder="CLEAR LOG"></label></div>${buttons("clear-log-save", "Clear Expedition Log")}`;
      editor.querySelector("[data-hex-action='clear-log-save']")?.classList.add("zft-hex-danger");
    }
  }
  openRolesReference() {
    const existing = document.getElementById("zft-hex-roles-popout");
    if (existing) { existing.remove(); return; }
    const windowEl = document.createElement("section");
    windowEl.id = "zft-hex-roles-popout";
    windowEl.className = "zft-hex-roles-popout";
    windowEl.innerHTML = `<header class="zft-hex-roles-popout-header"><strong><i class="fa-solid fa-book-open"></i> Expedition Roles</strong><button type="button" aria-label="Close role reference"><i class="fa-solid fa-xmark"></i></button></header><div class="zft-hex-roles-popout-body">${expeditionRolesReferenceHtml()}</div>`;
    document.body.append(windowEl);
    windowEl.style.setProperty("--zft-hex-ui-scale", String(this.displayScale()));
    const bounds = this.element?.getBoundingClientRect();
    windowEl.style.left = `${Math.min(Math.max(8, (bounds?.right ?? 200) + 10), Math.max(8, window.innerWidth - windowEl.offsetWidth - 8))}px`;
    windowEl.style.top = `${Math.min(Math.max(8, bounds?.top ?? 80), Math.max(8, window.innerHeight - windowEl.offsetHeight - 8))}px`;
    windowEl.querySelector("header button").addEventListener("click", () => windowEl.remove());
    const header = windowEl.querySelector("header");
    header.addEventListener("pointerdown", event => {
      if (event.button !== 0 || event.target.closest("button")) return;
      const x0=event.clientX,y0=event.clientY,left=windowEl.offsetLeft,top=windowEl.offsetTop;
      const move = e => {
        windowEl.style.left = `${Math.max(0,Math.min(window.innerWidth-windowEl.offsetWidth,left+e.clientX-x0))}px`;
        windowEl.style.top = `${Math.max(0,Math.min(window.innerHeight-windowEl.offsetHeight,top+e.clientY-y0))}px`;
      };
      const stop=()=>{document.removeEventListener("pointermove",move);document.removeEventListener("pointerup",stop)};
      document.addEventListener("pointermove",move);document.addEventListener("pointerup",stop,{once:true});
      event.preventDefault();
    });
  }
  closeExhaustionMenu() {
    this.exhaustionMenu?._closeController?.abort();
    this.exhaustionMenu?.remove();
    this.exhaustionMenu = null;
  }
  showExhaustionMenu(uuid, x, y) {
    if (!game.user?.isGM) return;
    const actor = presentRoster().find(pc => pc.uuid === uuid);
    if (!actor) return;
    this.closeExhaustionMenu();
    const current = exhaustionDisplayLevel(actor);
    const isPending = pendingExhaustionLevels.has(actor.uuid);
    const menu = document.createElement("div");
    menu.className = "zft-hex-exhaustion-menu";
    menu.setAttribute("role", "menu");
    menu.innerHTML = `<div class="zft-hex-exhaustion-menu-head">Set Exhaustion · ${esc(actor.name)}${isPending ? " · Saving…" : ""}</div>` +
      Array.from({length:7},(_,i) => `<button type="button" role="menuitemradio" aria-checked="${i === current}" data-hex-level="${i}" ${isPending ? "disabled" : ""}>${i===current ? "✓ " : ""}Level ${i}${i===0 ? " · None" : ""}</button>`).join("");
    document.body.append(menu);
    this.exhaustionMenu = menu;
    const rect = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(4,Math.min(x,window.innerWidth-rect.width-4))}px`;
    menu.style.top = `${Math.max(4,Math.min(y,window.innerHeight-rect.height-4))}px`;
    const controller = new AbortController();
    menu._closeController = controller;
    document.addEventListener("pointerdown",event => {if(!menu.contains(event.target))this.closeExhaustionMenu();},{capture:true,signal:controller.signal});
    document.addEventListener("keydown",event => {if(event.key === "Escape")this.closeExhaustionMenu();},{signal:controller.signal});
    menu.addEventListener("click",async event => {
      const button = event.target.closest("button[data-hex-level]");
      if(!button || !game.user?.isGM || pendingExhaustionLevels.has(actor.uuid))return;
      const level = Number(button.dataset.hexLevel);
      if(!Number.isInteger(level)||level<0||level>6)return;
      this.closeExhaustionMenu();
      try {
        pendingExhaustionLevels.set(actor.uuid,level);
        // No optimistic level. Display only the stored actor value until the
        // full system update has been confirmed.
        await setExpeditionExhaustion(actor, level);
        pendingExhaustionLevels.delete(actor.uuid);
        this.refresh();
        ui.notifications.info(`${actor.name}: Exhaustion set to ${level}.`);
      } catch(error) {
        pendingExhaustionLevels.delete(actor.uuid);
        this.refresh();
        console.error("[ZFT][HexTravel] Exhaustion correction failed",error);
        ui.notifications.error(`Could not adjust exhaustion for ${actor.name}.`);
      }
    });
    menu.querySelector(`[data-hex-level="${current}"]`)?.focus();
  }
  async openPartyActorSheet(event) {
    const portrait = event.target.closest?.("[data-hex-actor-sheet]");
    if (!portrait || !this.element?.contains(portrait)) return;
    // Restrict this to currently present characters, not arbitrary UUID input.
    const actor = presentRoster().find(a => a.uuid === portrait.dataset.hexActorSheet);
    if (!actor) return;
    const level = CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED;
    if (!game.user.isGM && !actor.testUserPermission(game.user, level)) {
      return ui.notifications.warn(`You don't have permission to view ${actor.name}'s sheet.`);
    }
    try {
      const sheet = actor.sheet;
      if (!sheet) return ui.notifications.warn(`${actor.name} has no available character sheet.`);
      if (sheet instanceof foundry.applications.api.ApplicationV2) await sheet.render({ force: true });
      else await sheet.render(true);
    } catch (error) {
      console.error("[ZFT][HexTravel] Opening character sheet failed", error);
      ui.notifications.error(`Could not open ${actor.name}'s character sheet.`);
    }
  }
  /** GM-only, local pending socket attempts; not a new world setting. */
  registerPendingRoll(info) {
    if (!game.user?.isGM || typeof info.choose !== "function") return null;
    const token = Symbol(info.key);
    this.pendingRolls.set(info.key, { ...info, token });
    this.renderPendingRolls();
    return token;
  }
  unregisterPendingRoll(key, token) {
    if (token && this.pendingRolls.get(key)?.token === token) {
      this.pendingRolls.delete(key);
      this.renderPendingRolls();
    }
  }
  cancelPendingRolls() {
    for (const item of this.pendingRolls.values()) item.choose({ type: "cancel" });
    this.pendingRolls.clear();
    this.renderPendingRolls();
  }
  renderPendingRolls() {
    const container = this.workflowElement?.querySelector("[data-hex-pending-rolls]");
    if (!container) return;
    const pending = [...this.pendingRolls.values()];
    container.hidden = pending.length === 0;
    const sharedLabel = pending.every(item => item.label === pending[0]?.label) ? pending[0]?.label : null;
    const sentTo = [...new Set(pending.map(item => item.rollerName))];
    const subhead = [sharedLabel, sentTo.length === 1 ? `Sent to ${sentTo[0]}` : null].filter(Boolean).join(" · ");
    container.innerHTML = `<div class="zft-hex-pending-group">
      <div class="zft-hex-pending-head"><strong><i class="fa-solid fa-dice-d20" aria-hidden="true"></i> Pending Player Rolls</strong><span>${pending.length} awaiting</span></div>
      ${subhead ? `<div class="zft-hex-pending-context">${esc(subhead)}</div>` : ""}
      <div class="zft-hex-pending-rows">${pending.map(({ key, actorName, label, rollerName, attempt }) => `
        <div class="zft-hex-pending-roll" data-hex-pending-key="${esc(key)}">
          <div class="zft-hex-pending-identity"><strong title="${esc(actorName)}">${esc(actorName)}</strong><small title="Sent to ${esc(rollerName)} · Attempt ${Number(attempt)}">${sharedLabel ? "Awaiting player" : esc(label)} · Attempt ${Number(attempt)}</small></div>
          <div class="zft-hex-pending-roll-actions" role="group" aria-label="Roll recovery for ${esc(actorName)}">
            <button type="button" data-hex-roll-recovery="resend" data-hex-key="${esc(key)}" title="Resend Prompt · ${esc(actorName)}" aria-label="Resend Prompt for ${esc(actorName)}"><i class="fa-solid fa-paper-plane" aria-hidden="true"></i></button>
            <button type="button" data-hex-roll-recovery="gm" data-hex-key="${esc(key)}" title="Roll as GM · ${esc(actorName)}" aria-label="Roll as GM for ${esc(actorName)}"><i class="fa-solid fa-dice-d20" aria-hidden="true"></i></button>
            <button type="button" data-hex-roll-recovery="cancel" data-hex-key="${esc(key)}" title="Cancel Request · ${esc(actorName)}" aria-label="Cancel Request for ${esc(actorName)}"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
          </div>
        </div>`).join("")}</div>
      <div class="zft-hex-pending-legend" aria-label="Pending roll action legend">
        <span><i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Resend Prompt</span>
        <span><i class="fa-solid fa-dice-d20" aria-hidden="true"></i> Roll as GM</span>
        <span><i class="fa-solid fa-xmark" aria-hidden="true"></i> Cancel Request</span>
      </div>
      <div class="zft-hex-pending-help">Resend if a player reconnects. Actions affect only their row.</div>
    </div>`;
    this.constrainWorkflowHeight();
  }
  handleRollRecovery(event) {
    const button = event.target.closest("button[data-hex-roll-recovery]");
    if (!button || !this.workflowElement?.contains(button) || !game.user?.isGM) return false;
    event.preventDefault();
    const entry = this.pendingRolls.get(button.dataset.hexKey);
    if (!entry) return true;
    const action = button.dataset.hexRollRecovery;
    if (!['resend', 'gm', 'cancel'].includes(action)) return true;
    if (action === 'resend' && entry.rollerId !== game.user.id && !game.users.get(entry.rollerId)?.active) {
      ui.notifications.warn(`${entry.rollerName} is not connected. Wait for reconnection or choose Roll as GM.`);
      return true;
    }
    if (action === 'resend') ui.notifications.info('New roll prompt requested. If the earlier dialog appears after reconnection, close it without rolling.');
    entry.choose({ type: action });
    return true;
  }
  async click(event) {
    if (event.target.closest('[data-hex-action="roles-reference"]')) {
      this.openRolesReference();
      return;
    }
    if (this.handleRollRecovery(event)) return;
    const button = event.target.closest("button[data-hex-action]");
    if (!button || !(this.element?.contains(button) || this.workflowElement?.contains(button) || false)) return;
    const action = button.dataset.hexAction;
    if (action === "roster-toggle") {
      const collapsed = button.getAttribute("aria-expanded") === "true";
      const list = this.element?.querySelector("#zft-hex-roster-members");
      if (list) list.hidden = collapsed;
      button.setAttribute("aria-expanded", String(!collapsed));
      const chevron = button.querySelector("i");
      if (chevron) chevron.className = `fa-solid fa-angles-${collapsed ? "down" : "up"}`;
      button.title = `${collapsed ? "Expand" : "Collapse"} Expedition Roster`;
      button.setAttribute("aria-label", button.title);
      void this.remember({ rosterCollapsed: collapsed });
      return;
    }
    if (action === "scale") { this.toggleScaleWindow(); return; }
    if (action === "expanded" && this.dragMoved) { this.dragMoved = false; return; }
    if (["expanded", "bubble", "hidden"].includes(action)) return void this.setMode(action);
    if (action === "log-visibility") return void this.toggleLogVisibility();
    if (!game.user?.isGM) return;
    // Allow a GM to open Reset while an older travel prompt is awaiting input.
    // Save/Reset themselves are still serialized via this.busy.
    if (this.busy) return;
    const editor = this.workflowElement?.querySelector("[data-hex-editor]");
    if (["roles", "attendance", "manage", "reset", "identity", "clear-log"].includes(action)) return this.togglePanel(action);
    if (action === "panel-cancel") return this.togglePanel(this.panel);
    if (action === "sync-date") {
      try {
        if (await resyncCurrentTravelDate()) {
          ui.notifications.info("Current travel day's date updated from the active Foundry calendar. Earlier days are unchanged.");
          this.renderPanel();
          this.refresh();
        } else ui.notifications.warn("The active Foundry calendar did not provide a usable date.");
      } catch (error) { console.error("[ZFT][HexTravel] Date sync failed", error); ui.notifications.error(error.message); }
      return;
    }
    if (action === "show-players") {
      const online = game.users.players.filter(u => u.active).length;
      if (!online) return ui.notifications.warn("No connected players to notify.");
      await game.settings.set(MODULE_ID, SHOW_KEY, { requestedAt: Date.now(), by: game.user.id });
      return ui.notifications.info(`Requested expedition console for ${online} connected player(s).`);
    }
    if (["roles-save", "attendance-save", "manage-save", "reset-save", "identity-save", "clear-log-save"].includes(action)) {
      this.busy = true;
      try {
        if (action === "roles-save") {
          if (this.travelActive) return ui.notifications.warn("Finish or cancel the active travel workflow before changing roles.");
          const state = getLedger();
          if (Number(state.pending) > 0 || (state.hourResolved?.length ?? 0) || Object.keys(state.hourRolls ?? {}).length)
            return ui.notifications.warn("Finish the current hex or forced-march resolution before changing roles.");
          const roster = presentRoster();
          const selections = [...editor.querySelectorAll("select[data-hex-expedition-role]")];
          const assignments = Object.fromEntries(selections.map(select => [select.dataset.hexExpeditionRole, select.value]));
          const filled = Object.values(assignments).filter(Boolean);
          if (!assignments.guide || !roster.some(actor => actor.uuid === assignments.guide))
            return ui.notifications.warn("Select an attending Guide.");
          if (new Set(filled).size !== filled.length)
            return ui.notifications.warn("Each character may hold only one expedition role.");
          if (filled.some(uuid => !roster.some(actor => actor.uuid === uuid)))
            return ui.notifications.warn("Assigned characters must be present.");
          // Retain the legacy secondary setting only when its existing PC remains
          // assigned to an expedition role. Do not invent unsupported roll mappings.
          const previous = hexTravelRolePreferences();
          const keepSecondary = filled.includes(previous.secondaryUuid) && previous.secondaryUuid !== assignments.guide &&
            HEX_TRAVEL_ACTIVITIES[previous.activity] && previous.activity !== "none";
          await rememberHexTravelRoles({
            navigatorUuid: assignments.guide,
            secondaryUuid: keepSecondary ? previous.secondaryUuid : "",
            activity: keepSecondary ? previous.activity : "none",
            assignments
          });
          ui.notifications.info("Expedition roles saved. Assigned roles appear in the party list.");
        } else if (action === "attendance-save") {
          const state = getLedger();
          if ((state.hourResolved?.length ?? 0) || Object.keys(state.hourRolls ?? {}).length) return ui.notifications.warn("Resolve the active forced-march hour before changing attendance.");
          const checked = [...editor.querySelectorAll("input[data-hex-actor]:checked")].map(input => input.dataset.hexActor);
          if (!checked.length) return ui.notifications.warn("Select at least one present party member.");
          await game.settings.set(MODULE_ID, ATTENDANCE_KEY, { excludedActorUuids: assignedRoster().filter(a => !checked.includes(a.uuid)).map(a => a.uuid) });
          ui.notifications.info(`Expedition attendance saved: ${checked.length} present PC(s).`);
        } else if (action === "manage-save") {
          const values = {};
          for (const key of ["day", "hours", "pending", "hexes"]) {
            const raw = editor.querySelector(`input[name='${key}']`)?.value;
            const v = Number(raw);
            if (!raw?.trim() || !Number.isSafeInteger(v) || v < (key === "day" ? 1 : 0)) return ui.notifications.warn(`Invalid value for ${key}.`);
            values[key] = v;
          }
          invalidateHexTravelWorkflows();
          this.dismissPrompt();
          this.activeTravelTicket += 1;
          this.travelActive = false;
          const state = { ...values, hexHourSegments: getLedger().hexHourSegments ?? [], activeHexCardId: null, hourResolved: [], hourRolls: {}, hourDecisions: {}, hourOutcomes: {}, hourRerolls: {}, marchHistory: [] };
          await game.settings.set("zft-overland-travel", STATE_KEY, state);
          await game.settings.set(MODULE_ID, HEX_KEY, { totalHours: 0, baseHexes: 0 });
          await publishHexTravelSnapshot(state, "Ledger corrected", "GM manually corrected expedition progress.");
          ui.notifications.info("Travel ledger updated.");
        } else if (action === "reset-save") {
          if (editor.querySelector("input[name='confirmation']")?.value.trim() !== "RESET") return ui.notifications.warn("Type RESET exactly to confirm.");
          // Invalidate any suspended GM rolls/dialogs BEFORE writing the reset.
          invalidateHexTravelWorkflows();
          this.dismissPrompt();
          this.activeTravelTicket += 1;
          this.travelActive = false;
          const state = { ...DEFAULT_LEDGER, activeHexCardId: null, hourResolved: [], hourRolls: {}, hourDecisions: {}, hourOutcomes: {}, hourRerolls: {}, marchHistory: [] };
          await game.settings.set("zft-overland-travel", STATE_KEY, state);
          await game.settings.set(MODULE_ID, CARDS_KEY, EMPTY_CARDS);
          // A new expedition gets fresh Foundry calendar dates, not stale dates
          // recorded during the previous expedition.
          await game.settings.set(MODULE_ID, CALENDAR_KEY, { datesByDay: {} });
          await game.settings.set(MODULE_ID, HEX_KEY, { totalHours: 0, baseHexes: 0 });
          await game.settings.set(MODULE_ID, LOG_KEY, { epoch: hexTravelLogEpoch() + 1, hiddenHistoryKeys: [], hiddenHourKey: "", recordedDays: [] });
          await publishHexTravelSnapshot(state, "Travel reset", "Expedition travel statistics were reset by the GM.");
          ui.notifications.info("Expedition travel and result cards reset. Actor Exhaustion unchanged.");
        } else if (action === "identity-save") {
          const read = key => editor.querySelector(`input[name='${key}']`)?.value.trim() ?? "";
          await game.settings.set(MODULE_ID, IDENTITY_KEY, { name: (read("name") || DEFAULT_IDENTITY.name).slice(0,100), region: read("region").slice(0,100), world: read("world").slice(0,100) });
          ui.notifications.info("Expedition identity saved. Travel dates are read from Foundry's calendar.");
        } else if (action === "clear-log-save") {
          if (editor.querySelector("input[name='confirmation']")?.value.trim() !== "CLEAR LOG") return ui.notifications.warn("Type CLEAR LOG exactly to confirm expedition log clearing.");
          await clearHexTravelExpeditionLog();
          ui.notifications.info("Expedition Log cleared for all GM and player clients. Foundry Chat and travel ledger preserved.");
        }
        this.panel = null;
        editor.hidden = true;
        editor.replaceChildren();
        this.refresh();
      } catch (error) {
        console.error("[ZFT][HexTravel] GM console update failed", error);
        ui.notifications.error(`Expedition action failed: ${error.message}`);
      } finally { this.busy = false; }
      return;
    }
    if (["travel", "day"].includes(action)) {
      if (this.travelActive) {
        // A second click toggles off its own pre-roll/confirmation panel,
        // exactly like the other GM editors. Never terminate a submitted
        // decision, in-flight roll, or Forced March operation.
        if (this.pendingPrompt?.toggleKey === action && !this.pendingPrompt.committing) {
          this.dismissPrompt();
          return;
        }
        return ui.notifications.warn("Another expedition travel action is already awaiting GM input.");
      }
      this.travelActive = true;
      const ticket = ++this.activeTravelTicket;
      try { await launchHexTravel({ action }); }
      catch (error) { console.error("[ZFT][HexTravel] Travel action failed", error); }
      finally { if (ticket === this.activeTravelTicket) this.travelActive = false; }
    }
  }
}

export const HexTravelConsole = new ExpeditionConsole();
