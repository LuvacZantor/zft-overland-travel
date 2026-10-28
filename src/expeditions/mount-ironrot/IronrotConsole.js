/**
 * Mount Ironrot Expedition Console (V13).
 * Only Mount Ironrot state is used here. The generic Travel Manager is untouched.
 * GM publishes a compact world-setting snapshot; player clients render read-only.
 * Each stable card is reconciled individually; the floating window isn't re-rendered.
 */
import { MODULE_ID, MODULE_TITLE } from "../../constants/module-constants.js";
import { launchMountIronrot } from "./MountIronrot.js";
import { ironrotD20Total, decorateLegacyIronrotDice } from "./IronrotDice.js";
import { IRONROT_ACTIVITIES, IRONROT_NAVIGATION_SKILL, EXPEDITION_PAIRS, EXPEDITION_ROLES } from "./IronrotRoles.js";
import { ThemeManager } from "../../theme/ThemeManager.js";
import { ThemeEditor } from "../../theme/ThemeEditor.js";

const STATE_KEY = "mountIronrotTravelV45";
const SNAPSHOT_KEY = "ironrotConsoleSnapshot";
const ATTENDANCE_KEY = "ironrotAttendance";
const UI_KEY = "ironrotConsoleUi";
const DEFAULT_INTERFACE_SCALE = 100;
const interfaceScale = raw => {
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(150, Math.max(60, Math.round(value))) : DEFAULT_INTERFACE_SCALE;
};
const IDENTITY_KEY = "ironrotIdentity";
const CARDS_KEY = "ironrotTravelCards";
const SHOW_KEY = "ironrotShowPlayers";
const ROLE_KEY = "ironrotRolePreferences";
const HEX_KEY = "ironrotHexDisplayProgress";
const LOG_KEY = "ironrotLogVisibility";
const CALENDAR_KEY = "ironrotTravelCalendar";
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
    } catch (error) { console.warn("[ZFT][Ironrot] Calendaria date unavailable:", error); }
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
  } catch (error) { console.warn("[ZFT][Ironrot] Simple Calendar unavailable:", error); }
  try {
    const date = calendar.format(timestamp, "date");
    if (typeof date === "string" && date.trim()) return date.trim();
  } catch (error) { console.warn("[ZFT][Ironrot] Native calendar format unavailable:", error); }
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
  const currentDay = Number(game.settings.get("world", STATE_KEY)?.day ?? 1);
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
function dateAndDay(day) {
  const n = Number(day);
  if (!Number.isSafeInteger(n) || n < 1) return "Date not recorded";
  const date = calendarDate(n);
  return `Day ${n}${date ? ` · ${date}` : ""}`;
}
let cardWrites = Promise.resolve();
const queueCardWrite = job => { const next = cardWrites.catch(() => {}).then(job); cardWrites = next; return next; };

let workflowGeneration = 0;
export const ironrotGeneration = () => workflowGeneration;
export const invalidateIronrotWorkflows = () => { IronrotConsole.cancelPendingRolls(); return ++workflowGeneration; };
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

export function registerIronrotSettings() {
  // Register the macro's existing ledger for *all* clients so late-joining
  // players can display the latest state without ever running the GM macro.
  if (!game.settings.settings.has(`world.${STATE_KEY}`)) {
    game.settings.register("world", STATE_KEY, {
      name: "Mount Ironrot travel state", scope: "world", config: false,
      type: Object, default: DEFAULT_LEDGER,
      onChange: () => IronrotConsole.refresh()
    });
  }
  game.settings.register(MODULE_ID, SNAPSHOT_KEY, {
    name: "Mount Ironrot console status", scope: "world", config: false,
    type: Object, default: EMPTY_SNAPSHOT,
    onChange: () => IronrotConsole.refresh()
  });
  game.settings.register(MODULE_ID, ATTENDANCE_KEY, {
    name: "Mount Ironrot present PCs", scope: "world", config: false,
    type: Object, default: { excludedActorUuids: [] },
    onChange: () => IronrotConsole.refresh()
  });
  game.settings.register(MODULE_ID, IDENTITY_KEY, {
    name: "Expedition display identity", scope: "world", config: false,
    type: Object, default: DEFAULT_IDENTITY,
    onChange: () => IronrotConsole.refresh()
  });
  game.settings.register(MODULE_ID, CARDS_KEY, {
    name: "Current expedition travel cards", scope: "world", config: false,
    type: Object, default: EMPTY_CARDS,
    onChange: () => IronrotConsole.refresh()
  });
  game.settings.register(MODULE_ID, ROLE_KEY, {
    name: "Expedition role preferences", scope: "world", config: false,
    type: Object, default: { navigatorUuid: "", secondaryUuid: "", activity: "none", assignments: {} },
    onChange: () => IronrotConsole.refresh()
  });
  game.settings.register(MODULE_ID, HEX_KEY, {
    name: "Current hex elapsed-time display", scope: "world", config: false,
    type: Object, default: { totalHours: 0, baseHexes: 0 },
    onChange: () => IronrotConsole.refresh()
  });
  game.settings.register(MODULE_ID, CALENDAR_KEY, {
    name: "Foundry world-calendar travel dates", scope: "world", config: false,
    type: Object, default: DEFAULT_CALENDAR,
    onChange: () => IronrotConsole.refresh()
  });
  game.settings.register(MODULE_ID, LOG_KEY, {
    name: "Expedition log visibility", scope: "world", config: false,
    type: Object, default: { epoch: 0, hiddenHistoryKeys: [], hiddenHourKey: "", recordedDays: [] },
    onChange: () => IronrotConsole.refresh()
  });
  game.settings.register(MODULE_ID, SHOW_KEY, {
    name: "GM display request", scope: "world", config: false,
    type: Object, default: { requestedAt: 0 },
    onChange: data => { if (!game.user?.isGM && data?.requestedAt) void IronrotConsole.showWorkspace(); }
  });
  game.settings.register(MODULE_ID, UI_KEY, {
    name: "Overland Travel interface preferences", scope: "client", config: false,
    type: Object, default: { mode: "hidden", left: 160, top: 80, logWidth: 540, logHeight: 650, logHeightManual: false, logDocked: true, logHidden: false, workflowWidth: 405, workflowDocked: true, workflowHidden: false, rosterCollapsed: false, interfaceScale: DEFAULT_INTERFACE_SCALE, interfaceScaleStep: 5 }
  });
}

export function ironrotIdentity() {
  const stored = game.settings.get(MODULE_ID, IDENTITY_KEY) ?? {};
  return {
    name: (String(stored.name ?? "").trim() || DEFAULT_IDENTITY.name).slice(0, 100),
    region: String(stored.region ?? "").trim().slice(0, 100),
    world: String(stored.world ?? "").trim().slice(0, 100)
  };
}
export function ironrotLogEpoch() {
  return Number(game.settings.get(MODULE_ID, LOG_KEY)?.epoch ?? 0);
}
export function ironrotRolePreferences() {
  return game.settings.get(MODULE_ID, ROLE_KEY) ?? { navigatorUuid: "", secondaryUuid: "", activity: "none", assignments: {} };
}
export async function rememberIronrotRoles(preferences) {
  if (!game.user?.isGM) return;
  await game.settings.set(MODULE_ID, ROLE_KEY, {
    navigatorUuid: String(preferences.navigatorUuid ?? ""),
    secondaryUuid: String(preferences.secondaryUuid ?? ""),
    activity: String(preferences.activity ?? "none"),
    assignments: Object.fromEntries(Object.entries(preferences.assignments ?? {}).filter(([key]) => key in EXPEDITION_ROLES).map(([key,uuid]) => [key,String(uuid ?? "")]))
  });
}
export async function rememberIronrotHex(totalHours, baseHexes) {
  if (!game.user?.isGM) return;
  await game.settings.set(MODULE_ID, HEX_KEY, {
    totalHours: Math.max(0, Number(totalHours) || 0),
    baseHexes: Math.max(0, Number(baseHexes) || 0)
  });
}
export async function publishIronrotTravelCard(cardId, html, stage = "started", epoch = ironrotLogEpoch(), metadata = {}) {
  if (!game.user?.isGM) return;
  return queueCardWrite(async () => {
    // A clear invalidates all cards from workflows begun before that clear.
    if (epoch !== ironrotLogEpoch()) return;
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
      travelHour: Number.isFinite(Number(metadata.travelHour)) ? Number(metadata.travelHour) : (earlier?.travelHour ?? null)
    };
    if (previous >= 0) list[previous] = card;
    else list.push(card);
    await game.settings.set(MODULE_ID, CARDS_KEY, { cards: list.slice(-15) });
  });
}
export async function removeIronrotTravelCard(cardId, epoch = ironrotLogEpoch()) {
  if (!game.user?.isGM) return;
  return queueCardWrite(async () => {
    if (epoch !== ironrotLogEpoch()) return;
    const list = game.settings.get(MODULE_ID, CARDS_KEY)?.cards ?? [];
    await game.settings.set(MODULE_ID, CARDS_KEY, { cards: list.filter(item => item.id !== cardId) });
  });
}
/** Only expedition presentation is cleared. Native Foundry Chat is untouched. */
export async function clearIronrotExpeditionLog() {
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
  if (phase === "New travel day" && current > 1) days.add(current - 1);
  if (days.size === existing.length && [...days].every(value => existing.includes(value))) return;
  await game.settings.set(MODULE_ID, LOG_KEY, {
    ...old, recordedDays: [...days].sort((a, b) => a - b)
  });
}

/** Called on the GM only. No player privileges or socket endpoints needed. */
export async function publishIronrotSnapshot(state, phase = "Travel status", detail = "") {
  if (!game.user?.isGM) return;
  await recordFoundryTravelDay(Number(state?.day));
  await recordExpeditionLogDays(state?.day, phase);
  await game.settings.set(MODULE_ID, SNAPSHOT_KEY, {
    phase, detail, state: foundry.utils.deepClone(state), updatedAt: Date.now()
  });
}

function getLedger() {
  try { return game.settings.get("world", STATE_KEY) ?? DEFAULT_LEDGER; }
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

const stateCard = (key, inner, className = "") => ({ key, html: `<article class="zft-ir-card ${className}" data-ir-card="${esc(key)}">${inner}</article>` });
const spanStat = (label, value, color = "", state = "") => `<div class="zft-ir-stat${state ? ` zft-ir-hours-stat is-${state}` : ""}"><span>${esc(label)}</span><strong ${color ? `class="${color}"` : ""}>${esc(value)}</strong></div>`;

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
/** In 5.x the canonical actor field is also reflected by the system's
 * exhaustion condition. Leave creation/deletion of that system effect to
 * D&D5e, not two independent ZFT writes which collide with Change Log hooks.
 * Never swallow an update failure when the requested level was not persisted. */
async function setExpeditionExhaustion(actor, level) {
  if (!game.user?.isGM || actor.type !== "character" || !Number.isInteger(level) || level < 0 || level > 6)
    throw new Error("Invalid or unauthorized exhaustion adjustment.");
  if (readExhaustion(actor) === level) return level;
  let updateError = null;
  try {
    // The D&D5e system is responsible for the condition. Do not call
    // toggleStatusEffect or create an ActiveEffect with a fixed system ID.
    await actor.update({ "system.attributes.exhaustion": level });
  } catch (error) { updateError = error; }
  let observed = readExhaustion(actor);
  if (observed === level) {
    // A third-party hook can throw after the Actor has actually been changed.
    // Only report success if the local actor state is now correct.
    if (updateError) console.warn("[ZFT][Ironrot] Actor persisted exhaustion, but an update hook reported an error", updateError);
    return observed;
  }
  // An existing 5.x exhaustion condition may restore the previous level.
  // Reconcile only its level flag; never fabricate a duplicate system effect.
  const effects = exhaustionStatusEffects(actor);
  if (effects.length === 1) {
    try {
      if (level > 0) {
        await effects[0].update({ "flags.dnd5e.exhaustionLevel": level });
      } else {
        // Remove only the identified existing exhaustion condition on level 0.
        await effects[0].delete();
      }
      await actor.update({ "system.attributes.exhaustion": level });
    } catch (error) { updateError = error; }
    observed = readExhaustion(actor);
  }
  if (observed !== level) {
    console.warn("[ZFT][Ironrot] Exhaustion update not confirmed", {
      actor: actor.uuid, requested: level, observed,
      source: actor._source?.system?.attributes?.exhaustion,
      effects: exhaustionStatusEffects(actor).map(e => ({ id:e.id, level:e.flags?.dnd5e?.exhaustionLevel })),
      error: updateError?.message
    });
    throw updateError ?? new Error(`Actor reports Exhaustion ${observed} after update to ${level}`);
  }
  if (updateError) console.warn("[ZFT][Ironrot] Exhaustion corrected after hook warning", updateError);
  return observed;
}

function exhaustionPenalty(level) {
  if (!level) return "";
  // In legacy-rules worlds use the 2014 exhaustion table.
  let rulesVersion = "2024";
  try {
    if (game.settings.settings.has("dnd5e.rulesVersion")) rulesVersion = String(game.settings.get("dnd5e", "rulesVersion"));
  } catch (error) { console.warn("[ZFT][Ironrot] Exhaustion rules setting unavailable", error); }
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
function compactIronrotHexResult(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  const root = template.content.firstElementChild;
  if (!root?.querySelector("[data-ir-stage-title]")) return html;
  const blocks = [...root.children];
  const heading = blocks.findIndex(block => block.querySelector("[data-ir-stage-title]"));
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
  return `<div class="zft-ir-compact-hex">` +
    `<div class="zft-ir-compact-top"><span><i class="fa-solid fa-gauge" aria-hidden="true"></i> ${esc(paceLabel)}</span>` +
    `<strong><i class="fa-regular fa-clock" aria-hidden="true"></i> ${esc(timeMatch[1])}h travel time</strong></div>` +
    `<div class="zft-ir-compact-checks"><div class="zft-ir-compact-check">${nav.innerHTML}</div>` +
    (noSecondary ? `<span class="zft-ir-compact-no-secondary">Secondary · None</span>` :
      `<div class="zft-ir-compact-check zft-ir-compact-secondary">${secondary.innerHTML}</div>`) + `</div>` +
    `<div class="zft-ir-compact-dice"><div class="zft-ir-compact-dice-heading">${esc(diceLabel)}</div>` +
    `<div class="zft-ir-compact-dice-grid"><div class="zft-ir-compact-dice-faces">${dice.children[1].innerHTML}</div>` +
    `<div class="zft-ir-compact-dice-math">${dice.children[2].innerHTML}</div></div></div></div>`;
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
  const heading = blocks.findIndex(block => block.querySelector("[data-ir-stage-title]"));
  if (heading < 0) return `<div class="zft-ir-travel-html">${html}</div>`;
  const pace = blocks[heading + 1];
  const guide = blocks[heading + 2];
  if (!pace || !guide?.children?.length) return `<div class="zft-ir-travel-html">${html}</div>`;

  const statusClass = /failure/i.test(outcome) ? "failure" : /success/i.test(outcome) ? "success" : "pending";
  const metadata = guide.children[0]?.textContent?.replace(/\s+/g, " ").trim() ?? "Guide · Wisdom (Survival)";
  const nameAndRoll = guide.cloneNode(true);
  nameAndRoll.children[0]?.remove();
  let guideName = "Guide awaiting roll";
  // The first direct text node in the original Guide card holds the actor name.
  // Only strip the name when the delimiter is present; leave every other result
  // node (including the actual d20 icon and any GM override note) intact.
  const firstText = [...nameAndRoll.childNodes].find(node => node.nodeType === 3 && node.textContent.trim());
  const nameMatch = firstText?.textContent.match(/^\s*([^·]+?)\s*·\s*/);
  if (nameMatch) {
    guideName = nameMatch[1].trim();
    firstText.textContent = firstText.textContent.slice(nameMatch[0].length);
  }
  const outcomeEl = [...nameAndRoll.children].find(node => node.matches?.("strong") && /SUCCESS|FAILURE/i.test(node.textContent));
  const overrideEl = [...nameAndRoll.children].find(node => node.matches?.("em") && /GM override/i.test(node.textContent));
  const statusText = outcomeEl?.textContent?.trim() ?? (/success/i.test(outcome) ? "SUCCESS" : /failure/i.test(outcome) ? "FAILURE" : "AWAITING RULING");
  const overrideText = overrideEl?.textContent?.trim() ?? "";
  const shownTotal = Number(nameAndRoll.querySelector(".zft-ir-d20-total > strong")?.textContent?.trim());
  const recordedDC = Number(metadata.match(/DC\s*(\d+)/i)?.[1]);
  const rawClass = Number.isFinite(shownTotal) && Number.isFinite(recordedDC) && recordedDC > 0
    ? (shownTotal >= recordedDC ? "success" : "failure") : statusClass;
  const rawVsFinal = rawClass !== statusClass && (rawClass === "success" || rawClass === "failure") && overrideText
    ? `<span class="zft-ir-hex-original-result zft-ir-result-${rawClass}">Original roll: ${rawClass === "success" ? "Success" : "Failure"}</span>` : "";
  outcomeEl?.remove();
  overrideEl?.remove();
  // Keep the original rolled d20 and DC comparison, but not the separator
  // that previously introduced the now-separated outcome label.
  const trailingText = [...nameAndRoll.childNodes].reverse().find(node => node.nodeType === 3 && node.textContent.trim());
  if (trailingText) trailingText.textContent = trailingText.textContent.replace(/\s*·\s*$/, "");
  // The d20 graphic shows a CHECK TOTAL, not a raw die face. Enlarge its
  // existing system-owned die icon to match the visual prominence of d4 faces.
  const guideRollHtml = nameAndRoll.innerHTML.trim() || '<span class="zft-ir-hex-awaiting">Navigation roll pending</span>';

  const dice = blocks.find(block => /DICE ROLLED/i.test(block.children?.[0]?.textContent ?? ""));
  const diceHeading = dice?.children?.[0]?.textContent?.replace(/\s+/g," ").trim() ?? "";
  const diceFormula = diceHeading.match(/DICE ROLLED\s*·\s*(.+)/i)?.[1]?.trim() ?? "";
  const diceFaces = dice?.children?.[1]?.innerHTML ?? "";
  const diceMath = dice?.children?.[2]?.innerHTML ?? "";
  const paceText = pace.textContent?.replace(/^\s*Pace:\s*/i," ").replace(/\s+/g," ").trim() ?? "";
  const total = blocks.find(block => /TOTAL\s*·\s*ONE HEX/i.test(block.textContent ?? ""));
  const totalHours = total?.textContent?.match(/(\d+)\s*hours?/i)?.[1] ?? null;
  // An optional secondary legacy check still belongs to this saved hex. Show
  // it in Navigation rather than silently omitting part of the original data.
  const extra = blocks.find(block => /SECONDARY\s*·/i.test(block.children?.[0]?.textContent ?? ""));
  const extraHtml = extra ? `<div class="zft-ir-hex-extra"><span>${extra.innerHTML}</span></div>` : "";

  return `<div class="zft-ir-hex-detail zft-ir-travel-report" aria-label="Navigation, travel dice and duration">
    <div class="zft-ir-hex-detail-grid">
      <section class="zft-ir-hex-detail-nav" aria-label="Navigation check">
        <h4><i class="fa-solid fa-compass" aria-hidden="true"></i> Navigation</h4>
        <div class="zft-ir-hex-nav-line">
          <div class="zft-ir-hex-nav-info">
            <div class="zft-ir-hex-guide-meta">${esc(metadata)}</div>
            <div class="zft-ir-hex-guide-name zft-ir-result-${rawClass}">${esc(guideName)}</div>
          </div>
          <div class="zft-ir-hex-nav-result">
            <div class="zft-ir-hex-guide-roll zft-ir-result-${rawClass}">${guideRollHtml}</div>
            <div class="zft-ir-hex-guide-status ${statusClass}">${esc(statusText)}${overrideText ? `<small>${esc(overrideText)}</small>` : ""}</div>
            ${rawVsFinal}
          </div>
        </div>
        ${extraHtml}
      </section>
      <section class="zft-ir-hex-detail-dice" aria-label="Travel dice and adjustments">
        <h4><i class="fa-solid fa-dice" aria-hidden="true"></i> Travel Dice</h4>
        <div class="zft-ir-hex-dice-line">
          <div class="zft-ir-hex-dice-info">
            <div class="zft-ir-hex-pace">Pace: <strong>${esc(paceText)}</strong></div>
            ${dice ? `<div class="zft-ir-hex-dice-formula">${esc(diceFormula)}</div>` : ""}
          </div>
          ${dice ? `<div class="zft-ir-hex-dice-faces">${diceFaces}</div>`
            : `<div class="zft-ir-hex-dice-pending">Travel dice awaiting GM confirmation</div>`}
        </div>
      </section>
    </div>
    ${dice ? `<div class="zft-ir-hex-detail-bottom" aria-label="Travel calculations and total time">
      <div class="zft-ir-hex-detail-math" aria-label="Travel-hour calculation">
        <span class="zft-ir-hex-math-title">TRAVEL HOURS</span>
        <div class="zft-ir-hex-dice-math">${diceMath}</div>
      </div>
      ${totalHours !== null ? `<div class="zft-ir-hex-detail-total"><span>TOTAL · ONE HEX</span><strong>${esc(totalHours)} hours</strong></div>` : `<div class="zft-ir-hex-detail-total zft-ir-hex-total-pending"><span>TOTAL · ONE HEX</span><strong>Pending</strong></div>`}
    </div>` : ""}
  </div>`;
}

function expeditionRolesReferenceHtml() {
  const roster = presentRoster();
  return EXPEDITION_PAIRS.map(pair => `<section class="zft-ir-reference-group"><h4>${esc(pair.name)}</h4>${pair.roles.map(key => {
    const role = EXPEDITION_ROLES[key];
    const skill = travelSkill(roster[0] ?? {},role.skill);
    return `<div class="zft-ir-reference-role"><strong>${esc(role.name)}</strong><span>${esc(skill.label)} (${esc(role.ability)})</span><p>${esc(role.tooltip ?? role.purpose)}</p></div>`;
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
  const next = pending ? (safeRemaining ? `Next: ${Math.min(safeRemaining, pending)} safe travel hour(s)` : `Next: Forced March · Hour ${nextHour} · CON DC ${10 + nextHour - 8}`) : "Next: Choose a new hex";
  const hoursStatus = forced > 0 ? "red" : safeRemaining === 0 ? "amber" : "green";
  const safeStatus = safeRemaining === 0 ? "amber" : "green";
  const nextStatus = forced > 0 ? "is-forced" : safeRemaining === 0 && pending > 0 ? "is-warning" : "is-neutral";
  cards.push(stateCard("overview", `
    <div class="zft-ir-stats">${spanStat("DAY", Math.max(1, num(s.day)))}${spanStat("HOURS TODAY", `${hours}/8`, hoursStatus, forced > 0 ? "forced" : safeRemaining === 0 ? "limit" : "safe")}${spanStat("HEXES", num(s.hexes))}</div>
    <div class="zft-ir-progress-label zft-ir-safe-label ${safeStatus}"><span>Safe travel hours</span><strong>${safe}/8h</strong></div>
    <div class="zft-ir-progress zft-ir-safe-progress ${hoursStatus}"><div style="width:${Math.round(safe / 8 * 100)}%"></div></div>
    ${hexValid ? `<div class="zft-ir-progress-label zft-ir-hex-label"><span>Current hex progress</span><strong>${spent}/${total}h</strong></div><div class="zft-ir-progress zft-ir-hex-progress"><div style="width:${total ? Math.round(spent / total * 100) : 0}%"></div></div>` : ""}
    <div class="zft-ir-progress-grid">
      <span>Traveled today <strong>${hours}h</strong></span>
      <span class="zft-ir-safe-remaining ${safeStatus}">Safe time left <strong>${safeRemaining}h</strong></span>
      <span class="zft-ir-forced-hours ${forced > 0 ? "red" : ""}">Forced travel <strong>${forced}h</strong></span>
      <span>Current hex spent <strong>${spent === null ? (pending ? "Not recorded" : "—") : `${spent}h`}</strong></span>
    </div>
    <div class="zft-ir-next-step ${nextStatus}">${esc(next)}</div>`));
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
    const decorated = decorateLegacyIronrotDice(record.html);
    const outcome = record.html.includes(">SUCCESS</strong>") ? "Navigation success"
      : record.html.includes(">FAILURE</strong>") ? "Navigation failure" : "Navigation resolved";
    return { id: String(record.id), record, decorated, outcome,
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
  for (const item of hexRecords) ensureHex(item.day, item);
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
  const holdLatestMarch = ["Forced march decision", "Hour resolved", "Hex completed"].includes(String(snapshot.phase ?? ""));
  const renderMarch = ({ entry }) => {
    const holdOpen = holdLatestMarch && entry === latestMarch && entry.day === today && Number(entry.hour) === num(s.hours);

    const rows = (entry.results ?? []).map(result => {
      const tone = !Number.isFinite(result.total) ? "pending" : result.passed ? "success" : "failure";
      const label = tone === "pending" ? "Unresolved" : result.passed ? "Passed" : "Failed";
      const recordedOutcome = String(result.outcome ?? "GM resolved");
      const rulingTone = /Exhaustion \+1/i.test(recordedOutcome) ? "failure" : /accepted|waived/i.test(recordedOutcome) ? "success" : "pending";
      return `<div class="zft-ir-result-row zft-ir-march-result-grid"><strong class="zft-ir-march-character zft-ir-result-${tone}">${esc(result.name)}</strong>` +
        `<span class="zft-ir-march-check zft-ir-result-${tone}">${Number.isFinite(result.total) ? ironrotD20Total(result.total) : "—"}</span>` +
        `<span class="zft-ir-march-verdict zft-ir-result-${tone}">${label}</span>` +
        `<small class="zft-ir-march-outcome zft-ir-result-${rulingTone}">${num(result.rerolls) ? `Rerolled ×${num(result.rerolls)} · ` : ""}${esc(recordedOutcome)}</small></div>`;
    }).join("");
    const failed = (entry.results ?? []).filter(result => result.passed === false).length;
    const resultCount = (entry.results ?? []).length;
    const compact = failed
      ? `${resultCount} saves · <span class="zft-ir-result-failure">${failed} failed</span>`
      : `<span class="zft-ir-result-success">${resultCount} saves accepted</span>`;
    const full = `<div class="zft-ir-march-full"><div class="zft-ir-card-title">Forced March · Hour ${esc(entry.hour)} · CON DC ${esc(entry.dc)}</div>${rows || "<p>No entries</p>"}</div>`;
    return stateCard(`history:${entry.day}:${entry.hour}`,
      `<details class="zft-ir-log-history zft-ir-history-march zft-ir-march-event" data-ir-history data-ir-march-key="${esc(`${entry.day}:${entry.hour}:${entry.recordedAt ?? 0}`)}" ${holdOpen ? 'open data-ir-march-held="true"' : ''}><summary class="zft-ir-march-event-head"><span class="zft-ir-march-title"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Forced March · Hour ${esc(entry.hour)}</span><span class="zft-ir-march-status zft-ir-march-status-completed">Completed</span><span class="zft-ir-march-event-meta">CON DC ${esc(entry.dc)} · ${compact}</span></summary>${full}</details>`, "zft-ir-march-card").html;
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
    if (stage === "navigation") return "Navigation Complete · Awaiting Next Check";
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
    const header = isCurrent ? `${hexLabel} · In progress` : hexItem.complete ? `${hexLabel} · Completed` : continued ? `${hexLabel} · Continued travel` : `${hexLabel} · In progress`;
    // A revision changes only when the hex record or travel progress changes.
    // Opening and closing a window or refreshing a player view does not change it.
    const revision = [record.updatedAt ?? 0, record.stage, isCurrent ? `${hours}:${pending}` : "completed",
      ...marches.map(item => `${item.entry.day}:${item.entry.hour}:${item.entry.recordedAt ?? 0}`)].join(":");
    const time = hexItem.rolledHours ? `${hexItem.rolledHours}h total` : "Travel time unavailable";
    const remaining = isCurrent ? `<strong class="zft-ir-history-remaining">${num(s.pending)}h left</strong>` : "";
    const liveStatus = isCurrent ? `<span class="zft-ir-hex-workflow-status" role="status"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> <span>${esc(activeHexStatus(record))}</span></span>` : "";
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
      ? `<div class="zft-ir-hex-event-heading"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Forced March checks</div>` : "";
    const currentProgress = isCurrent && hexValid
      ? (() => { const total = num(game.settings.get(MODULE_ID, HEX_KEY)?.totalHours); const spent = total-num(s.pending);
        return `<div class="zft-ir-hex-progress-line"><span>Hex progress</span><strong>${spent}/${total}h</strong></div><div class="zft-ir-hex-progress-bar"><div style="width:${total ? Math.round(spent/total*100) : 0}%"></div></div>`; })() : "";
    const childCount = marches.length ? `<small class="zft-ir-hex-collapsed-count">${marches.length} Forced March ${marches.length === 1 ? "check" : "checks"}</small>` : "";
    return stateCard(`hex:${id}:day:${segmentDay ?? "undated"}`,
      `<details class="zft-ir-log-history zft-ir-hex-section ${isCurrent ? "zft-ir-hex-active" : ""} ${hexItem.complete ? "zft-ir-hex-complete" : ""}" data-ir-history data-ir-hex-revision="${esc(revision)}" data-ir-hex-latest="${isLatest ? "true" : "false"}" ${defaultOpen ? "open" : ""}><summary><span class="zft-ir-hex-head-main"><span class="zft-ir-history-label"><i class="fa-solid ${isCurrent ? "fa-hourglass-half" : "fa-map-location-dot"}" aria-hidden="true"></i> ${esc(header)}</span><span class="zft-ir-hex-header-meta">${remaining}${childCount}</span></span>${liveStatus}</summary><div class="zft-ir-hex-contents">${currentProgress}<div class="zft-ir-hex-roll-container">${rolls}</div><div class="zft-ir-hex-events" data-ir-hex-events="${esc(id)}">${marchHeading}${marchHtml}</div></div></details>`,
      "zft-ir-hex-card zft-ir-hex-parent-card").html;
  };

  const groupedLog = [...days.values()].sort((a,b) => (b.day ?? -1) - (a.day ?? -1)).map(group => {
    const day = group.day;
    const current = day === today;
    const stopped = ["Travel stopped","Travel paused"].includes(snapshot.phase);
    const open = current;
    const ordered = [...group.hexes.values()].sort((a,b) => b.hexItem.at - a.hexItem.at);
    const hexHtml = ordered.map(segment => renderHex(day, segment)).join("");
    const legacyHtml = group.legacyMarch.length
      ? `<section class="zft-ir-legacy-marches" aria-label="Historical Forced March checks without recorded hex association"><div class="zft-ir-legacy-label"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> Earlier Forced March checks <small>Hex association not recorded</small></div>${[...group.legacyMarch].sort((a,b) => b.entry.hour-a.entry.hour).map(renderMarch).join("")}</section>` : "";
    const events = hexHtml + legacyHtml || `<div class="zft-ir-day-empty-note"><i class="fa-solid fa-book-open" aria-hidden="true"></i><span><strong>No travel recorded</strong><small>${day === today ? "Travel activity will appear here." : "0 hours traveled · 0 hexes completed · 0 Forced March checks"}</small></span></div>`;
    const numMarches = group.legacyMarch.length + ordered.reduce((n,item)=>n+item.marches.length,0);
    // Display distinct completed/in-progress counts, rather than calling an
    // unfinished hex a completed one. Continued hex segments retain their ID.
    const inProgress = ordered.filter(({hexItem}) =>
      !hexItem.complete || (day === today && num(s.pending) > 0 &&
        (hexItem.id === activeHexId || hexItem.id === legacyVisibleCurrentId))).length;
    const completed = ordered.length - inProgress;
    const count = [completed ? `${completed} completed` : "", inProgress ? `${inProgress} in progress` : "",
      !ordered.length ? "0 hexes" : "", `${numMarches} Forced March ${numMarches === 1 ? "check" : "checks"}`].filter(Boolean).join(" · ");
    const status = current ? (stopped ? "Stopped / Paused" : "Current Day") : "Earlier Day";
    return stateCard(`day:${day ?? "undated"}`, `<details class="zft-ir-day-group" data-ir-day-group="${esc(day ?? "undated")}" ${open ? "open" : ""}><summary><span class="zft-ir-day-group-label"><i class="fa-solid fa-calendar-days" aria-hidden="true"></i> ${esc(day === null ? "Undated earlier travel" : dateAndDay(day))} <small>${esc(status)}</small></span><span class="zft-ir-day-group-count">${esc(count)}</span></summary><div class="zft-ir-day-group-events">${events}</div></details>`, "zft-ir-day-group-card");
  });
  const currentDayKey = `day:${today}`;
  const roster = presentRoster();
  const roles = ironrotRolePreferences();
  const rosterHtml = roster.map(actor => {
    const assignment = Object.entries(roles.assignments ?? {}).find(([key, uuid]) => EXPEDITION_ROLES[key] && uuid === actor.uuid);
    const legacyNavigator = actor.uuid === roles.navigatorUuid;
    const legacyActivity = actor.uuid === roles.secondaryUuid && roles.activity !== "none" ? IRONROT_ACTIVITIES[roles.activity] : null;
    const definedRole = assignment ? EXPEDITION_ROLES[assignment[0]] : null;
    const assigned = definedRole?.name ?? (legacyNavigator ? "Guide" : (legacyActivity ? `Secondary · ${legacyActivity.name}` : "Available"));
    const skillKey = definedRole?.skill ?? (legacyNavigator ? IRONROT_NAVIGATION_SKILL : legacyActivity?.skill ?? null);
    const check = skillKey ? travelSkill(actor, skillKey) : null;
    const checkInfo = check ? `<span class="zft-ir-member-skill" title="Assigned expedition check">${esc(check.label)}${check.ability ? ` (${esc(check.ability)})` : ""} <strong>${esc(signed(check.modifier))}</strong></span>` : "";
    const con = conSaveBonus(actor);
    const portrait = actor.img ? `<img src="${esc(actor.img)}" loading="lazy" alt="">` : `<i class="fa-solid fa-user" aria-hidden="true"></i>`;
    // The immediate GM correction is held until the actor's replicated state catches up.
    const exhaustion = exhaustionDisplayLevel(actor);
    const penalty = exhaustionPenalty(exhaustion);
    const penaltyParts = penalty.split(/\s*·\s*/);
    const status = exhaustion ? `<span class="zft-ir-member-exhaustion"><span class="zft-ir-member-condition">Exhaustion ${exhaustion}</span><small class="zft-ir-member-penalty">${penaltyParts.map(part => `<span>${esc(part)}</span>`).join("")}</small></span>` : "";
    const description = definedRole?.tooltip ?? definedRole?.purpose ?? "";
    const roleLabel = definedRole
      ? `<small class="zft-ir-role-tooltip" tabindex="0" aria-label="${esc(assigned)}: ${esc(description)}"><span>${esc(assigned)}</span> <i class="fa-solid fa-circle-info" aria-hidden="true"></i><span class="zft-ir-role-tooltip-pop" role="tooltip">${esc(description)}<em>Primary check: ${esc(check?.label ?? "Ability check")} (${esc(definedRole.ability)})</em></span></small>`
      : `<small>${esc(assigned)}</small>`;
    return `<div class="zft-ir-party-member zft-ir-roster-refined" data-ir-party-actor="${esc(actor.uuid)}"><span class="zft-ir-portrait" data-ir-actor-sheet="${esc(actor.uuid)}" title="Double-click to open character sheet" role="button" tabindex="0" aria-label="Open ${esc(actor.name)} character sheet">${portrait}</span><span class="zft-ir-member-info"><span class="zft-ir-member-heading"><strong>${esc(actor.name)}</strong>${status}</span>${roleLabel}<span class="zft-ir-member-bonuses">${checkInfo}<span class="zft-ir-member-con" title="Constitution saving throw bonus">CON Save <strong>${esc(signed(con))}</strong></span></span></span></div>`;
  }).join("");
  const rosterCollapsed = game.settings.get(MODULE_ID, UI_KEY)?.rosterCollapsed === true;
  cards.push(stateCard("party", `<div class="zft-ir-roster-header"><div class="zft-ir-card-title">Expedition Roster · ${roster.length}</div><div class="zft-ir-roster-header-actions"><button type="button" class="zft-ir-roster-toggle" data-ir-action="roster-toggle" aria-expanded="${!rosterCollapsed}" aria-controls="zft-ir-roster-members" aria-label="${rosterCollapsed ? "Expand" : "Collapse"} Expedition Roster" title="${rosterCollapsed ? "Expand" : "Collapse"} Expedition Roster"><i class="fa-solid fa-angles-${rosterCollapsed ? "down" : "up"}" aria-hidden="true"></i></button><button type="button" class="zft-ir-roles-open" data-ir-action="roles-reference" aria-label="Open expedition roles reference"><i class="fa-solid fa-book-open" aria-hidden="true"></i> Roles</button></div></div><div id="zft-ir-roster-members" class="zft-ir-party-list" ${rosterCollapsed ? "hidden" : ""}>${rosterHtml || "No party members selected"}</div>`));

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
      const check = hasRoll && !rerollPending ? ironrotD20Total(value) : `<span class="zft-ir-march-no-roll">${rerollPending ? "↻" : "—"}</span>`;
      const verdict = rerollPending ? "Rerolling" : hasRoll ? (value >= dc ? "Passed" : "Failed") : "Pending";
      const explanation = rerollPending
        ? `Reroll requested · ${hasRoll ? `previous result ${esc(value)}` : "awaiting result"}`
        : `${rerolls ? `Rerolled ×${rerolls} · ` : ""}${esc(outcome)}`;
      activeSaveCards.push(stateCard(`save:${actor.uuid}`, `<div class="zft-ir-live-save-row zft-ir-march-result-grid"><strong class="zft-ir-march-character zft-ir-result-${color === "green" ? "success" : color === "red" ? "failure" : "pending"}">${esc(actor.name)}</strong><span class="zft-ir-march-check zft-ir-result-${color === "green" ? "success" : color === "red" ? "failure" : "pending"}">${check}</span><span class="zft-ir-march-verdict ${color}">${verdict}</span><small>${explanation}</small></div>`));
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
      const active = `<section class="zft-ir-live-section" aria-label="${esc(activityLabel)}">${activeSaveCards.map(card => card.html).join("")}</section>`;
      // Only an explicitly linked active hex owns the pending action. Legacy
      // state with no ID shows it at day level without claiming a false link.
      const target = activeHexId ? `<div class="zft-ir-hex-events" data-ir-hex-events="${esc(activeHexId)}">` : null;
      if (target && group.html.includes(target)) {
        const heading = `<div class="zft-ir-hex-event-heading"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Forced March checks</div>`;
        const withHeading = target + heading;
        group.html = group.html.includes(withHeading)
          ? group.html.replace(withHeading, `${withHeading}${active}`)
          : group.html.replace(target, `${target}${heading}${active}`);
      } else group.html = group.html.replace('<div class="zft-ir-day-group-events">', `<div class="zft-ir-day-group-events">${active}`);
    }
  }
  // Only the overview and roster remain top-level dashboard cards.
  return [...cards, ...groupedLog];
}

function syncCards(container, cards, dayOverrides = null, historyOverrides = null) {
  const existing = new Map([...container.children].map(node => [node.dataset.irCard, node]));
  const desired = new Set(cards.map(card => card.key));
  for (const [i, card] of cards.entries()) {
    let node = existing.get(card.key);
    if (!node || node.dataset.irMarkup !== card.html) {
      const template = document.createElement("template");
      template.innerHTML = card.html;
      const replacement = template.content.firstElementChild;
      replacement.dataset.irMarkup = card.html;
      if (card.key.startsWith("day:") && dayOverrides?.has(card.key)) {
        const dayDetail = replacement.querySelector("details[data-ir-day-group]");
        if (dayDetail) dayDetail.open = dayOverrides.get(card.key);
      }
      // Preserve manual expansion of earlier checks when the day card rerenders.
      // A newly processed latest check auto-opens until Continue / Pause; then
      // its held open state is explicitly cleared in the shared render.
      if (node) {
        const oldMarches = new Map([...node.querySelectorAll("details[data-ir-march-key]")].map(el => [el.dataset.irMarchKey, el]));
        for (const fresh of replacement.querySelectorAll("details[data-ir-march-key]")) {
          const previous = oldMarches.get(fresh.dataset.irMarchKey);
          if (!previous) continue;
          if (fresh.hasAttribute("data-ir-march-held")) fresh.open = true;
          else if (previous.hasAttribute("data-ir-march-held")) fresh.open = false;
          else fresh.open = previous.open;
        }
      }
      // A recorded result reopens the latest hex with its full two-column
      // navigation and dice result; ordinary refreshes preserve manual state.
      const latestNew = replacement.querySelector('.zft-ir-hex-section[data-ir-hex-latest="true"]');
      const latestOld = node?.querySelector('.zft-ir-hex-section[data-ir-hex-latest="true"]');
      if (latestNew && latestOld && historyOverrides &&
          latestNew.dataset.irHexRevision !== latestOld.dataset.irHexRevision) {
        const latestKey = latestNew.closest("[data-ir-card]")?.dataset.irCard;
        if (latestKey) {
          historyOverrides.delete(latestKey);
        }
      }
      // The current day's latest completed event opens automatically. Only a
      // user's explicit summary click overrides that default on later renders.
      for (const detail of replacement.querySelectorAll("[data-ir-card] > details[data-ir-history]")) {
        const cardKey = detail.closest("[data-ir-card]")?.dataset.irCard;
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
  logHasRendered = false;
  logResizeActive = false;
  dayOpenOverrides = new Map();
  historyOpenOverrides = new Map();
  pendingRolls = new Map();
  lastDayState = null;
  scrollingFromCode = false;
  rollWindowOcclusions = new Map();
  rollWindowVisibility = new Map();
  // Expedition panes only compete with one another. Native Foundry dialogs,
  // character sheets, and module popups keep their own window stacking.
  paneOrder = ["zft-ironrot-workflow-window", "zft-ironrot-console", "zft-ironrot-log"];
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
      if (candidate.closest("#zft-ironrot-console, #zft-ironrot-log, #zft-ironrot-workflow-window, #zft-ir-roles-popout, #zft-overland-theme-window, #zft-ir-scale-window")) continue;
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
    const scaleWindow = document.getElementById("zft-ir-scale-window");
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
      this.themeEditor?.window, document.getElementById("zft-ir-roles-popout")].filter(Boolean)) {
      pane.style.setProperty("--zft-ir-ui-scale", factor);
    }
    // Late-mounted ZFT popouts inherit only our scoped scale property.
    document.documentElement.style.setProperty("--zft-zot-interface-scale", factor);
    this.refreshScaleWindow();
  }
  // This separate editor never inherits --zft-ir-ui-scale. It is intentionally
  // not docked, not part of the dashboard subtree, and never transformed.
  refreshScaleWindow() {
    const popup = document.getElementById("zft-ir-scale-window");
    if (!popup) return;
    const percent = interfaceScale(this.previewInterfaceScale ?? this.state.interfaceScale);
    const label = popup.querySelector("[data-ir-interface-scale-value]");
    if (label) label.textContent = `${percent}%`;
    const step = [1, 5, 10].includes(Number(this.state.interfaceScaleStep)) ? Number(this.state.interfaceScaleStep) : 5;
    // Read a freshly chosen increment from the popup first; client settings
    // persistence may still be resolving when the next +/- click arrives.
    const chosen = popup.querySelector('[data-ir-scale-step][aria-pressed="true"]');
    const selectedStep = chosen ? Number(chosen.dataset.irScaleStep) : step;
    for (const button of popup.querySelectorAll("[data-ir-scale-step]")) {
      const active = Number(button.dataset.irScaleStep) === selectedStep;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    const stepLabel = popup.querySelector("[data-ir-scale-step-value]");
    if (stepLabel) stepLabel.textContent = `${selectedStep}%`;
    for (const button of popup.querySelectorAll('[data-ir-action="scale-adjust"]')) {
      button.disabled = Number(button.dataset.irScaleDirection) < 0 ? percent <= 60 : percent >= 150;
    }
  }
  toggleScaleWindow() {
    const existing = document.getElementById("zft-ir-scale-window");
    if (existing) { existing.remove(); return; }
    const popup = document.createElement("section");
    popup.id = "zft-ir-scale-window";
    popup.className = "zft-ir-scale-window";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-label", "ZFT Interface Scale");
    popup.innerHTML = `
      <header class="zft-ir-scale-window-head" data-ir-scale-drag>
        <strong><i class="fa-solid fa-sliders" aria-hidden="true"></i> Interface Scale</strong>
        <button type="button" data-ir-action="scale-close" aria-label="Close Interface Scale"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
      </header>
      <div class="zft-ir-scale-window-body">
        <div class="zft-ir-scale-heading"><span>Scale of ZFT windows</span><output data-ir-interface-scale-value aria-live="polite">100%</output></div>
        <div class="zft-ir-scale-control-row">
          <div class="zft-ir-scale-step-picker" role="group" aria-label="Scale adjustment increment">
            <button type="button" data-ir-action="scale-step" data-ir-scale-step="1" aria-pressed="false" title="Adjust by 1 percent">1</button>
            <button type="button" data-ir-action="scale-step" data-ir-scale-step="5" aria-pressed="false" title="Adjust by 5 percent">5</button>
            <button type="button" data-ir-action="scale-step" data-ir-scale-step="10" aria-pressed="false" title="Adjust by 10 percent">10</button>
          </div>
          <div class="zft-ir-scale-adjust" role="group" aria-label="Change interface scale">
            <button type="button" data-ir-action="scale-adjust" data-ir-scale-direction="-1" aria-label="Decrease interface scale by selected increment"><i class="fa-solid fa-minus" aria-hidden="true"></i></button>
            <button type="button" data-ir-action="scale-adjust" data-ir-scale-direction="1" aria-label="Increase interface scale by selected increment"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>
          </div>
        </div>
        <div class="zft-ir-scale-foot"><span>Increment: <strong data-ir-scale-step-value>5%</strong></span><button type="button" data-ir-action="scale-reset" title="Reset interface scale to 100%">Reset</button></div>
        <p class="zft-ir-scale-help">60% to 150% · This client only</p>
      </div>`;
    document.body.appendChild(popup);
    const anchor = this.element?.getBoundingClientRect();
    popup.style.left = `${Math.max(8, Math.min(window.innerWidth - popup.offsetWidth - 8, (anchor?.left ?? 100) + 80))}px`;
    popup.style.top = `${Math.max(8, Math.min(window.innerHeight - popup.offsetHeight - 8, (anchor?.top ?? 100) + 55))}px`;
    ThemeManager.apply();
    this.updateExpeditionLayers();
    const selected = [1,5,10].includes(Number(this.state.interfaceScaleStep)) ? Number(this.state.interfaceScaleStep) : 5;
    const initial = popup.querySelector(`[data-ir-scale-step="${selected}"]`);
    if (initial) initial.setAttribute("aria-pressed", "true");
    this.refreshScaleWindow();
    popup.addEventListener("pointerdown", () => this.updateExpeditionLayers(), {passive:true});
    popup.addEventListener("click", event => {
      const button = event.target.closest("button[data-ir-action]");
      if (!button) return;
      const action = button.dataset.irAction;
      if (action === "scale-close") { popup.remove(); return; }
      if (action === "scale-step") {
        const step = Number(button.dataset.irScaleStep);
        if (![1,5,10].includes(step)) return;
        for (const choice of popup.querySelectorAll("[data-ir-scale-step]")) {
          const active = Number(choice.dataset.irScaleStep) === step;
          choice.classList.toggle("is-active",active);
          choice.setAttribute("aria-pressed",String(active));
        }
        this.refreshScaleWindow();
        void this.remember({interfaceScaleStep:step});
      } else if (action === "scale-adjust") {
        const direction = Number(button.dataset.irScaleDirection);
        if (![-1,1].includes(direction)) return;
        const step = Number(popup.querySelector('[data-ir-scale-step][aria-pressed="true"]')?.dataset.irScaleStep) || 5;
        const percent = this.changeInterfaceScale(interfaceScale(this.previewInterfaceScale ?? this.state.interfaceScale) + direction * step);
        void this.remember({interfaceScale:percent});
      } else if (action === "scale-reset") {
        this.changeInterfaceScale(DEFAULT_INTERFACE_SCALE);
        void this.remember({interfaceScale:DEFAULT_INTERFACE_SCALE});
      }
    });
    const header = popup.querySelector("[data-ir-scale-drag]");
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
    const scroller = node.querySelector(".zft-ir-scroll");
    const feed = node.querySelector("[data-ir-cards]");
    const head = node.querySelector(".zft-ir-log-head");
    if (!scroller || !feed || !head) return;
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
    const desired = Math.ceil(head.offsetHeight + feed.scrollHeight + pad + 4);
    node.style.height = `${Math.min(room, Math.max(minimum, desired))}px`;
  }
  fitDashboardToViewport() {
    if (!this.element) return;
    const top = this.element.getBoundingClientRect().top;
    const available = Math.max(220, Math.floor((window.innerHeight - top - 12) / this.displayScale()));
    this.element.style.setProperty("--zft-ir-available-height", `${available}px`);
  }
  scrollToLatest() {
    const scroller = this.logElement?.querySelector(".zft-ir-scroll");
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
    const control = this.logElement?.querySelector("[data-ir-log-action='latest']");
    if (control) control.hidden = this.followLatest;
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
    if (mode === "hidden") { this.themeEditor?.cancel(); document.getElementById("zft-ir-scale-window")?.remove(); if (this.panel) this.togglePanel(this.panel); }
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
  onReady() {
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
    const saved = this.state;
    const node = document.createElement("section");
    node.id = "zft-ironrot-console";
    node.setAttribute("aria-label", `${MODULE_TITLE} Expedition Dashboard`);
    node.dataset.mode = "expanded";
    node.style.left = `${Math.max(0, Math.min(num(saved.left), window.innerWidth - 80))}px`;
    node.style.top = `${Math.max(0, Math.min(num(saved.top), window.innerHeight - 45))}px`;
    node.innerHTML = `
      <header class="zft-ir-head" data-ir-drag>
        <i class="fa-solid fa-mountain" aria-hidden="true"></i>
        <span class="zft-ir-title" data-ir-title>${esc(MODULE_TITLE)}<small>Expedition Dashboard</small></span>
        <button type="button" data-ir-action="scale" title="Interface scale" aria-label="Adjust ZFT interface scale" aria-haspopup="dialog" aria-controls="zft-ir-scale-window"><i class="fa-solid fa-sliders" aria-hidden="true"></i></button>
        <button type="button" data-ir-action="theme" title="Interface color themes" aria-label="Customize interface colors"><i class="fa-solid fa-palette"></i></button>
        <button type="button" data-ir-action="log-visibility" title="Toggle Expedition Log"><i class="fa-solid fa-scroll"></i></button>
        <button type="button" data-ir-action="bubble" title="Collapse to floating button" aria-label="Collapse"><i class="fa-solid fa-minimize"></i></button>
        <button type="button" data-ir-action="hidden" title="Close dashboard and log" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
      </header>
      <button type="button" class="zft-ir-restore" data-ir-action="expanded" title="Expand expedition" aria-label="Expand expedition"><i class="fa-solid fa-mountain"></i></button>
      <div class="zft-ir-body"><aside class="zft-ir-dashboard" aria-label="Expedition dashboard">
          <div class="zft-ir-expedition-context" data-ir-expedition-context></div>
          <div class="zft-ir-dashboard-summary" data-ir-summary-cards></div>
          <div class="zft-ir-dashboard-content">
            <div class="zft-ir-dashboard-status" data-ir-dashboard-cards></div>
            ${game.user.isGM ? `
              <section class="zft-ir-gm"><div class="zft-ir-gm-title"><i class="fa-solid fa-dice-d20"></i> GM Expedition Controls</div>
                <div class="zft-ir-actions">
                  <button type="button" data-ir-action="travel"><i class="fa-solid fa-route"></i> Start / Continue</button>
                  <button type="button" data-ir-action="day"><i class="fa-solid fa-sun"></i> New Travel Day</button>
                  <button type="button" data-ir-action="roles"><i class="fa-solid fa-user-gear"></i> Expedition Roles</button>
                  <button type="button" data-ir-action="attendance"><i class="fa-solid fa-users"></i> Party Attendance</button>
                  <button type="button" data-ir-action="manage"><i class="fa-solid fa-book-open"></i> Edit Travel Ledger</button>
                  <button type="button" data-ir-action="show-players"><i class="fa-solid fa-display"></i> Show to Players</button>
                  <button type="button" data-ir-action="reset" class="zft-ir-danger"><i class="fa-solid fa-rotate-left"></i> Reset Travel</button>
                  <button type="button" data-ir-action="clear-log" class="zft-ir-danger"><i class="fa-solid fa-trash"></i> Clear Expedition Log</button>
                </div><div class="zft-ir-pending-rolls" data-ir-pending-rolls hidden></div><div class="zft-ir-attendance-editor" data-ir-editor hidden></div>
              </section>` : ""}
          </div></aside></div>`;
    const logNode = document.createElement("section");
    logNode.id = "zft-ironrot-log";
    logNode.setAttribute("aria-label", "Expedition log window");
    logNode.innerHTML = `
      <header class="zft-ir-log-head" data-ir-log-drag>
        <i class="fa-solid fa-scroll"></i><span>Expedition Log</span>
        <button type="button" data-ir-log-action="latest" class="zft-ir-jump-latest" title="Jump to newest expedition result" hidden><i class="fa-solid fa-arrow-up"></i> Latest</button>
        <button type="button" data-ir-log-action="dock" title="Dock or undock log"><i class="fa-solid fa-link"></i> <span data-ir-dock-label>Undock</span></button>
        <button type="button" data-ir-log-action="hide" title="Hide log"><i class="fa-solid fa-xmark"></i></button>
      </header>
      <div class="zft-ir-scroll" tabindex="0" aria-label="Scrollable expedition travel history"><div class="zft-ir-log-feed" data-ir-cards role="log" aria-label="Expedition travel history"></div></div>
      <div class="zft-ir-log-resize" data-ir-resize-log title="Drag to resize expedition log" aria-label="Resize expedition log"><i class="fa-solid fa-up-right-and-down-left-from-center"></i></div>`;
    if (game.user.isGM) {
      const content = node.querySelector(".zft-ir-dashboard-content");
      const gm = content.querySelector(".zft-ir-gm");
      const summary = node.querySelector("[data-ir-summary-cards]");
      // Three independent columns: GM controls (left), dashboard (middle), log (right).
      // The GM element moves into the controls column below after it is created.
      content.prepend(summary);
    }
    const workflowNode = game.user.isGM ? document.createElement("section") : null;
    if (workflowNode) {
      workflowNode.id = "zft-ironrot-workflow-window";
      workflowNode.setAttribute("aria-label", "GM Expedition Controls and inline decisions");
      workflowNode.hidden = true;
      workflowNode.innerHTML = `<header class="zft-ir-workflow-head" data-ir-workflow-drag>
        <i class="fa-solid fa-dice-d20" aria-hidden="true"></i><span>GM Expedition Controls</span>
        <button type="button" data-ir-workflow-action="dock" title="Dock or undock GM Controls to Dashboard"><i class="fa-solid fa-link" aria-hidden="true"></i> <span data-ir-workflow-dock-label>Undock</span></button>
      </header><div class="zft-ir-workflow-content">
        <section class="zft-ir-workflow" data-ir-workflow aria-label="Active GM decision" hidden></section>
      </div>`;
      const controls = node.querySelector(".zft-ir-gm");
      workflowNode.querySelector(".zft-ir-workflow-content").prepend(controls);
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
      workflowNode.querySelector("[data-ir-workflow-drag]").addEventListener("pointerdown", event => this.startDragWorkflow(event));
      workflowNode.querySelector("[data-ir-workflow-action='dock']").addEventListener("click", event => void this.toggleWorkflowDock(event));
      // Inline workflow actions and editor buttons use the same delegated
      // handler as the original dashboard GM controls.
      workflowNode.addEventListener("click", event => this.click(event));
    }
    node.addEventListener("contextmenu", event => {
      if (!game.user?.isGM) return;
      const row = event.target.closest("[data-ir-party-actor]");
      if (!row || !node.contains(row)) return;
      event.preventDefault();
      this.showExhaustionMenu(row.dataset.irPartyActor,event.clientX,event.clientY);
    });
    node.addEventListener("dblclick", event => this.openPartyActorSheet(event));
    node.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (!event.target.closest("[data-ir-actor-sheet]")) return;
      event.preventDefault();
      void this.openPartyActorSheet(event);
    });
    node.addEventListener("click", event => this.click(event));

    logNode.addEventListener("click", event => this.logClick(event));
    const scroller = logNode.querySelector(".zft-ir-scroll");
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
      const daySummary = event.target.closest(".zft-ir-day-group > summary");
      if (daySummary) {
        const detail = daySummary.parentElement;
        const key = detail.closest("[data-ir-card]")?.dataset.irCard;
        if (key) requestAnimationFrame(() => { this.dayOpenOverrides.set(key, detail.open); this.sizeLogToContent(); });
        this.followLatest = false;
        this.updateLatestButton();
      }
      const historySummary = event.target.closest(".zft-ir-log-history > summary");
      if (historySummary) {
        const detail = historySummary.parentElement;
        const key = detail.closest("[data-ir-card]")?.dataset.irCard;
        this.followLatest = false;
        this.updateLatestButton();
        requestAnimationFrame(() => {
          if (key) this.historyOpenOverrides.set(key, detail.open);
          this.sizeLogToContent();
        });
      }
    });
    node.querySelector("[data-ir-drag]").addEventListener("pointerdown", event => this.startDrag(event));
    node.querySelector("[data-ir-action='expanded']").addEventListener("pointerdown", event => this.startDrag(event, true));
    logNode.querySelector("[data-ir-log-drag]").addEventListener("pointerdown", event => this.startDragLog(event));
    logNode.querySelector("[data-ir-resize-log]").addEventListener("pointerdown", event => this.startResizeLog(event));
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
    const label = log.querySelector("[data-ir-dock-label]");
    if (label) label.textContent = cfg.logDocked === false ? "Dock" : "Undock";
  }
  /** Match the former inline panel: grow with content; scroll only at viewport edge. */
  constrainWorkflowHeight() {
    const node = this.workflowElement;
    if (!node || node.hidden) return;
    const top = node.getBoundingClientRect().top;
    const available = Math.max(120, (window.innerHeight - top - 12) / this.displayScale());
    node.style.setProperty("--zft-ir-workflow-height-cap", `${Math.floor(available)}px`);
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
    const label = node.querySelector("[data-ir-workflow-dock-label]");
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
        const label = node.querySelector("[data-ir-workflow-dock-label]");
        if(label)label.textContent="Dock";
        node.dataset.docked="false";
        void this.remember({workflowDocked:false,workflowLeft:node.offsetLeft,workflowTop:node.offsetTop});
      }
    };
    document.addEventListener("pointermove",move);document.addEventListener("pointerup",stop);document.addEventListener("pointercancel",stop);
  }
  async logClick(event) {
    const button = event.target.closest("button[data-ir-log-action]");
    if (!button || !this.logElement?.contains(button)) return;
    if (button.dataset.irLogAction === "latest") {
      this.followLatest = true;
      this.scrollToLatest();
      this.updateLatestButton();
    } else if (button.dataset.irLogAction === "hide") {
      this.logElement.hidden = true;
      await this.remember({ logHidden: true });
    } else if (button.dataset.irLogAction === "dock") {
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
      const label = node.querySelector("[data-ir-dock-label]");
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
  refresh() {
    if (!this.element || !this.logElement) return;
    this.closeExhaustionMenu();
    const summary = this.element.querySelector("[data-ir-summary-cards]");
    const dashboard = this.element.querySelector("[data-ir-dashboard-cards]");
    const log = this.logElement.querySelector("[data-ir-cards]");
    if (!summary || !dashboard || !log) return;
    const identity = ironrotIdentity();
    const title = this.element.querySelector("[data-ir-title]");
    if (title) title.innerHTML = `${esc(MODULE_TITLE)}<small>Expedition Dashboard</small>`;
    const context = this.element.querySelector("[data-ir-expedition-context]");
    if (context) {
      const regionText = identity.region || "Region not set";
      const campaignText = identity.world ? `<span class="zft-ir-context-world"><i class="fa-solid fa-globe" aria-hidden="true"></i> ${esc(identity.world)}</span>` : "";
      const eyebrow = identity.name === DEFAULT_IDENTITY.name ? "Current Expedition" : identity.name;
      context.innerHTML = `<span class="zft-ir-context-details"><span class="zft-ir-context-eyebrow">${esc(eyebrow)}</span><strong><i class="fa-solid fa-map-location-dot" aria-hidden="true"></i> ${esc(regionText)}</strong>${campaignText}</span>${game.user.isGM ? `<button type="button" data-ir-action="identity" title="Edit expedition location"><i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> Edit</button>` : ""}`;
    }
    const snapshot = getSnapshot();
    const currentDayState = String(snapshot.state?.day ?? 1);
    if (this.lastDayState !== null && this.lastDayState !== currentDayState) {
      this.dayOpenOverrides.delete(`day:${currentDayState}`);
    }
    this.lastDayState = currentDayState;
    const cards = makeCards(snapshot);
    const scroller = this.logElement.querySelector(".zft-ir-scroll");
    const previousScroll = scroller.scrollTop;
    const previousHeight = scroller.scrollHeight;
    const scrollerTop = scroller.getBoundingClientRect().top;
    const anchor = !this.followLatest ? [...log.children].find(node => node.getBoundingClientRect().bottom > scrollerTop + 1) : null;
    const anchorKey = anchor?.dataset.irCard;
    const anchorOffset = anchor ? anchor.getBoundingClientRect().top - scrollerTop : 0;
    syncCards(summary, cards.filter(card => card.key === "overview"));
    syncCards(dashboard, cards.filter(card => card.key === "party"));
    syncCards(log, cards.filter(card => !["overview", "party"].includes(card.key)), this.dayOpenOverrides, this.historyOpenOverrides);
    // Change identity labels in the view without changing saved card HTML.
    for (const heading of log.querySelectorAll("[data-ir-stage-title]")) heading.textContent = "Hex Travel";
    const place = [identity.region, identity.world].filter(Boolean).join(" · ");
    for (const label of log.querySelectorAll("[data-ir-stage-location]")) {
      label.textContent = place;
      label.style.display = place ? "" : "none";
    }
    if (this.followLatest) this.scrollToLatest();
    else {
      const anchorNow = [...log.children].find(node => node.dataset.irCard === anchorKey);
      if (anchorNow) scroller.scrollTop += anchorNow.getBoundingClientRect().top - scroller.getBoundingClientRect().top - anchorOffset;
      else scroller.scrollTop = Math.max(0, previousScroll + scroller.scrollHeight - previousHeight);
    }
    this.updateLatestButton();
    this.sizeLogToContent();
    this.logHasRendered = true;
    // The independent role editor owns its own inputs. An unrelated dashboard
    // refresh must never destroy unsaved assignments in that pop-out.
    if (this.panel && this.panel !== "roles" && !this.workflowElement?.querySelector("[data-ir-editor] input")) this.renderPanel();
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
   * Mount Ironrot party-CON request. Never touch global interface z-indices,
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
      } catch (error) { console.warn("[ZFT][Ironrot] Could not position expedition roll dialog", error); }
    });
  }
  /** DialogV2.wait-compatible GM decisions in a separate movable window. */
  prompt(options) {
    const host = this.workflowElement?.querySelector("[data-ir-workflow]");
    if (!game.user?.isGM || !host) return foundry.applications.api.DialogV2.wait(options);
    if (this.pendingPrompt) return Promise.reject(new Error("Another GM expedition prompt is still active."));
    host.hidden = false;
    host.replaceChildren();
    this.positionWorkflow();
    if (this.element?.dataset.mode === "expanded") this.workflowElement.hidden = false;
    this.constrainWorkflowHeight();
    const form = document.createElement("form");
    form.className = "zft-ir-prompt-form";
    form.noValidate = true;
    const heading = document.createElement("h3");
    heading.className = "zft-ir-prompt-title";
    heading.textContent = options.window?.title ?? "Expedition Decision";
    form.append(heading);
    const content = document.createElement("div");
    content.className = "zft-ir-prompt-content";
    // The original day/forced-march prompts carry legacy inline blue panel
    // colors. Harmonize their surface with GM Controls without changing data.
    const stageTitle = String(options.window?.title ?? "");
    if (/Start New Travel Day|Forced March/.test(stageTitle)) content.classList.add("zft-ir-gm-decision-content");
    if (/Hex Travel|Navigation Ruling|Roll$|Edit Saved|Manage Saved/.test(stageTitle))
      content.classList.add("zft-ir-travel-stage-content");
    content.innerHTML = options.content ?? "";
    const actions = document.createElement("div");
    actions.className = "zft-ir-prompt-actions";
    // The adjudication dialog gets a paired, two-line footer; other GM
    // decisions keep the shared standard action layout.
    const isForcedRuling = /Party CON DC/i.test(String(options.window?.title ?? ""));
    const isForcedHourChoice = /Forced March · Hour/i.test(String(options.window?.title ?? ""));
    if (isForcedRuling) actions.classList.add("zft-ir-forced-decision-actions");
    if (isForcedHourChoice) actions.classList.add("zft-ir-march-choice-actions");
    const defs = options.buttons ?? [];
    for (const option of defs) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.action = option.action ?? "";
      button.dataset.irPromptAction = option.action ?? "";
      if (option.default) button.classList.add("zft-ir-prompt-default");
      if (option.action === "reset" || option.action === "exhaust") button.classList.add("zft-ir-danger");
      if (option.icon) { const icon = document.createElement("i"); icon.className = option.icon; button.append(icon, " "); }
      if (isForcedRuling && ["apply", "pause"].includes(option.action)) {
        // Keep accessible labels and all existing DialogV2 callback/action wiring.
        button.setAttribute("aria-label", option.label ?? option.action);
        const primary = document.createElement("span");
        primary.className = "zft-ir-action-primary";
        primary.textContent = option.action === "apply" ? "Process Party" : "Pause / Exit";
        const secondary = document.createElement("span");
        secondary.className = "zft-ir-action-secondary";
        secondary.textContent = option.action === "apply" ? "Decisions" : "Saves Progress";
        button.append(primary, secondary);
      } else if (isForcedHourChoice && ["continue", "cancel"].includes(option.action)) {
        button.setAttribute("aria-label", option.label ?? option.action);
        const primary = document.createElement("span");
        primary.className = "zft-ir-action-primary";
        primary.textContent = option.action === "continue" ? "Continue" : "Pause / Exit";
        const secondary = document.createElement("span");
        secondary.className = "zft-ir-action-secondary";
        secondary.textContent = option.action === "continue" ? `Hour ${String(options.window?.title ?? "").match(/Hour (\d+)/)?.[1] ?? ""}` : "Save Progress";
        button.append(primary, secondary);
      } else button.append(document.createTextNode(option.label ?? option.action ?? "Continue"));
      actions.append(button);
    }
    if (!defs.some(option => /cancel|pause|exit|stop/i.test(`${option.action ?? ""} ${option.label ?? ""}`))) {
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.dataset.irPromptCancel = "true";
      cancel.textContent = "Cancel / Exit";
      actions.append(cancel);
    }
    if (isForcedRuling) {
      const refreshRulingRow = (select) => {
        const row = select.closest("[data-ir-ruling-row]");
        if (!row) return;
        const current = Number(row.dataset.irCurrentExhaustion) || 0;
        const outcome = select.value;
        row.classList.remove("ruling-exhaust", "ruling-accept", "ruling-neutral");
        row.classList.add(outcome === "exhaust" ? "ruling-exhaust" : outcome === "accept" ? "ruling-accept" : "ruling-neutral");
        const projected = outcome === "exhaust" ? Math.min(6, current + 1) : current;
        row.querySelector("[data-ir-projected-exhaustion]").textContent =
          outcome === "exhaust" ? `${current} → ${projected}` : String(current);
        row.querySelector(".zft-ir-gm-ruling-exhaustion")?.classList.toggle("has-exhaustion", projected > 0);
      };
      content.addEventListener("change", event => {
        if (event.target.matches("[data-ir-gm-ruling-select]")) refreshRulingRow(event.target);
      });
      for (const select of content.querySelectorAll("[data-ir-gm-ruling-select]")) refreshRulingRow(select);
    }
    // Workflow-specific actions belong after the decision form and review list.
    // This preserves the existing buttons, callbacks and cancellation logic.
    form.append(content, actions);
    host.append(form);
    this.constrainWorkflowHeight();
    const dialogLike = { element: host };
    try { options.render?.(null, dialogLike); }
    catch (error) {
      console.error("[ZFT][Ironrot] GM prompt render failed", error);
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
      this.pendingPrompt = { close: () => finish(typeof options.close === "function" ? options.close() : null) };
      actions.addEventListener("click", async event => {
        if (event.target.closest("button[data-ir-prompt-cancel]")) {
          event.preventDefault();
          this.pendingPrompt?.close();
          return;
        }
        const button = event.target.closest("button[data-ir-prompt-action]");
        if (!button || !active) return;
        event.preventDefault();
        const option = defs.find(item => item.action === button.dataset.irPromptAction);
        if (!option) return;
        button.disabled = true;
        try { finish(await option.callback?.(event, button)); }
        catch (error) {
          console.error("[ZFT][Ironrot] Inline GM prompt failed", error);
          ui.notifications.error(`Expedition prompt: ${error.message}`);
          button.disabled = false;
        }
      });
      form.addEventListener("submit", event => {
        event.preventDefault();
        const preferred = actions.querySelector(".zft-ir-prompt-default") ?? actions.querySelector("button");
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
    const editor = this.workflowElement?.querySelector("[data-ir-editor]");
    if (!editor) return;
    editor.hidden = !this.panel;
    editor.replaceChildren();
    if (this.panel) this.renderPanel();
    this.constrainWorkflowHeight();
  }
  renderPanel() {
    const editor = this.workflowElement?.querySelector("[data-ir-editor]");
    if (!editor || !this.panel) return;
    const st = getLedger();
    editor.dataset.irPanel = this.panel;
    const buttons = (save, label="Save") => `<div class="zft-ir-actions"><button type="button" data-ir-action="${save}">${label}</button><button type="button" data-ir-action="panel-cancel">Cancel</button></div>`;
    if (this.panel === "roles") {
      const roster = presentRoster();
      const current = ironrotRolePreferences();
      const existing = { ...(current.assignments ?? {}) };
      // Older worlds stored only navigator and secondary assignments.
      if (!existing.guide && current.navigatorUuid) existing.guide = current.navigatorUuid;
      const oldSecondary = { scout: "scout", conceal: "scout", investigate: "tracker", nature: "forager", arcane: "tracker" }[current.activity];
      if (oldSecondary && !existing[oldSecondary]) existing[oldSecondary] = current.secondaryUuid;
      const sections = EXPEDITION_PAIRS.map(pair => `<fieldset class="zft-ir-role-pair"><legend>${esc(pair.name)}</legend>${pair.roles.map(key => {
        const role = EXPEDITION_ROLES[key];
        const options = `<option value="">Unassigned</option>` + roster.map(actor => `<option value="${esc(actor.uuid)}" ${existing[key] === actor.uuid ? "selected" : ""}>${esc(actor.name)}</option>`).join("");
        return `<label><strong class="zft-ir-role-assignment-name">${esc(role.name)}</strong><span class="zft-ir-role-assignment-skill">${esc(travelSkill(roster[0] ?? {},role.skill).label)} (${esc(role.ability)})</span><select data-ir-expedition-role="${esc(key)}">${options}</select></label>`;
      }).join("")}</fieldset>`).join("");
      editor.innerHTML = `<div class="zft-ir-card-title">Expedition Roles</div>
        <p>One role per character. Unassigned roles may be left empty.</p>
        <div class="zft-ir-roles-scroll"><div class="zft-ir-fields zft-ir-roles-fields">${sections}</div></div>
        ${buttons("roles-save", "Save Expedition Roles")}`;
      const roleSelects = [...editor.querySelectorAll("select[data-ir-expedition-role]")];
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
            option.classList.toggle("zft-ir-role-unavailable", option.disabled);
            option.title = option.disabled ? "Already assigned to another expedition role" : "";
          }
        }
      };
      for (const select of roleSelects) select.addEventListener("change", refreshRoleOptions);
      refreshRoleOptions();
    } else if (this.panel === "attendance") {
      const excluded = new Set(attendanceConfig().excludedActorUuids ?? []);
      const options = assignedRoster().map(actor => `<label><input type="checkbox" data-ir-actor="${esc(actor.uuid)}" ${excluded.has(actor.uuid) ? "" : "checked"}> <span>${esc(actor.name)}</span></label>`).join("");
      editor.innerHTML = `<div class="zft-ir-card-title"><i class="fa-solid fa-users" aria-hidden="true"></i> Party Attendance</div><p>Offline assigned PCs remain eligible.</p><div class="zft-ir-members">${options || "No assigned PCs."}</div>${buttons("attendance-save", "Save Attendance")}`;
    } else if (this.panel === "manage") {
      editor.innerHTML = `<div class="zft-ir-card-title"><i class="fa-solid fa-book-open" aria-hidden="true"></i> Edit Travel Ledger</div>
        <div class="zft-ir-fields zft-ir-ledger-fields">
          <label><span>Expedition Day</span><input name="day" type="number" min="1" step="1" value="${num(st.day)}"></label>
          <label><span>Hours Today</span><input name="hours" type="number" min="0" step="1" value="${num(st.hours)}"></label>
          <label><span>Unfinished Hex Hours</span><input name="pending" type="number" min="0" step="1" value="${num(st.pending)}"></label>
          <label><span>Completed Hexes</span><input name="hexes" type="number" min="0" step="1" value="${num(st.hexes)}"></label>
        </div><p class="zft-ir-editor-warning"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Saving clears hourly roll history and Forced March checkpoints.</p>
        ${buttons("manage-save", "Save Ledger")}`;
    } else if (this.panel === "reset") {
      editor.innerHTML = `<div class="zft-ir-reset-inline"><div class="zft-ir-card-title red"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Reset Travel</div><p>Clear all saved travel hours, hexes, pending time, forced-march rulings, and current expedition results. This cannot be undone. Actor Exhaustion is not changed.</p><label>Type RESET to confirm<input name="confirmation" type="text" autocomplete="off" placeholder="RESET"></label></div>${buttons("reset-save", "Permanently Reset")}`;
      editor.querySelector("[data-ir-action='reset-save']")?.classList.add("zft-ir-danger");
    } else if (this.panel === "identity") {
      const id = ironrotIdentity();
      editor.innerHTML = `<div class="zft-ir-card-title"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Expedition Details</div>
      <p>Set the travel location so it is prominent in the dashboard and travel logs.</p>
      <div class="zft-ir-fields zft-ir-identity-fields">
        <label class="zft-ir-region-field">Region / Location<input name="region" type="text" maxlength="100" placeholder="Where is the party traveling?" value="${esc(id.region)}"></label>
        <label>Expedition Name<input name="name" type="text" maxlength="100" value="${esc(id.name)}"></label>
        <label>Campaign / World<input name="world" type="text" maxlength="100" value="${esc(id.world)}"></label>
      </div>
      ${buttons("identity-save", "Save Expedition Details")}
      <div class="zft-ir-calendar-check"><strong>Foundry calendar</strong><span>${esc(currentFoundryDate() || "Date unavailable")}</span>
      <p>Dates come from the active calendar and remain recorded for past days. If this day's date was captured with an incorrect year in an earlier build, synchronize only the current day.</p>
      <button type="button" data-ir-action="sync-date"><i class="fa-solid fa-calendar-check"></i> Re-sync Current Travel Date</button></div>`;
    } else if (this.panel === "clear-log") {
      editor.innerHTML = `<div class="zft-ir-reset-inline"><div class="zft-ir-card-title red"><i class="fa-solid fa-trash" aria-hidden="true"></i> Clear Expedition Log</div><p>This permanently removes expedition result cards from the GM and player log windows, including saved visual history. It does not delete Foundry Chat messages, change travel hours, or alter effects.</p><label>Type CLEAR LOG to confirm<input name="confirmation" type="text" autocomplete="off" placeholder="CLEAR LOG"></label></div>${buttons("clear-log-save", "Clear Expedition Log")}`;
      editor.querySelector("[data-ir-action='clear-log-save']")?.classList.add("zft-ir-danger");
    }
  }
  openRolesReference() {
    const existing = document.getElementById("zft-ir-roles-popout");
    if (existing) { existing.remove(); return; }
    const windowEl = document.createElement("section");
    windowEl.id = "zft-ir-roles-popout";
    windowEl.className = "zft-ir-roles-popout";
    windowEl.innerHTML = `<header class="zft-ir-roles-popout-header"><strong><i class="fa-solid fa-book-open"></i> Expedition Roles</strong><button type="button" aria-label="Close role reference"><i class="fa-solid fa-xmark"></i></button></header><div class="zft-ir-roles-popout-body">${expeditionRolesReferenceHtml()}</div>`;
    document.body.append(windowEl);
    windowEl.style.setProperty("--zft-ir-ui-scale", String(this.displayScale()));
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
    menu.className = "zft-ir-exhaustion-menu";
    menu.setAttribute("role", "menu");
    menu.innerHTML = `<div class="zft-ir-exhaustion-menu-head">Set Exhaustion · ${esc(actor.name)}${isPending ? " · Saving…" : ""}</div>` +
      Array.from({length:7},(_,i) => `<button type="button" role="menuitemradio" aria-checked="${i === current}" data-ir-level="${i}" ${isPending ? "disabled" : ""}>${i===current ? "✓ " : ""}Level ${i}${i===0 ? " · None" : ""}</button>`).join("");
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
      const button = event.target.closest("button[data-ir-level]");
      if(!button || !game.user?.isGM || pendingExhaustionLevels.has(actor.uuid))return;
      const level = Number(button.dataset.irLevel);
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
        console.error("[ZFT][Ironrot] Exhaustion correction failed",error);
        ui.notifications.error(`Could not adjust exhaustion for ${actor.name}.`);
      }
    });
    menu.querySelector(`[data-ir-level="${current}"]`)?.focus();
  }
  async openPartyActorSheet(event) {
    const portrait = event.target.closest?.("[data-ir-actor-sheet]");
    if (!portrait || !this.element?.contains(portrait)) return;
    // Restrict this to currently present characters, not arbitrary UUID input.
    const actor = presentRoster().find(a => a.uuid === portrait.dataset.irActorSheet);
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
      console.error("[ZFT][Ironrot] Opening character sheet failed", error);
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
    const container = this.workflowElement?.querySelector("[data-ir-pending-rolls]");
    if (!container) return;
    const pending = [...this.pendingRolls.values()];
    container.hidden = pending.length === 0;
    const sharedLabel = pending.every(item => item.label === pending[0]?.label) ? pending[0]?.label : null;
    const sentTo = [...new Set(pending.map(item => item.rollerName))];
    const subhead = [sharedLabel, sentTo.length === 1 ? `Sent to ${sentTo[0]}` : null].filter(Boolean).join(" · ");
    container.innerHTML = `<div class="zft-ir-pending-group">
      <div class="zft-ir-pending-head"><strong><i class="fa-solid fa-dice-d20" aria-hidden="true"></i> Pending Player Rolls</strong><span>${pending.length} awaiting</span></div>
      ${subhead ? `<div class="zft-ir-pending-context">${esc(subhead)}</div>` : ""}
      <div class="zft-ir-pending-rows">${pending.map(({ key, actorName, label, rollerName, attempt }) => `
        <div class="zft-ir-pending-roll" data-ir-pending-key="${esc(key)}">
          <div class="zft-ir-pending-identity"><strong title="${esc(actorName)}">${esc(actorName)}</strong><small title="Sent to ${esc(rollerName)} · Attempt ${Number(attempt)}">${sharedLabel ? "Awaiting player" : esc(label)} · Attempt ${Number(attempt)}</small></div>
          <div class="zft-ir-pending-roll-actions" role="group" aria-label="Roll recovery for ${esc(actorName)}">
            <button type="button" data-ir-roll-recovery="resend" data-ir-key="${esc(key)}" title="Resend Prompt · ${esc(actorName)}" aria-label="Resend Prompt for ${esc(actorName)}"><i class="fa-solid fa-paper-plane" aria-hidden="true"></i></button>
            <button type="button" data-ir-roll-recovery="gm" data-ir-key="${esc(key)}" title="Roll as GM · ${esc(actorName)}" aria-label="Roll as GM for ${esc(actorName)}"><i class="fa-solid fa-dice-d20" aria-hidden="true"></i></button>
            <button type="button" data-ir-roll-recovery="cancel" data-ir-key="${esc(key)}" title="Cancel Request · ${esc(actorName)}" aria-label="Cancel Request for ${esc(actorName)}"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
          </div>
        </div>`).join("")}</div>
      <div class="zft-ir-pending-legend" aria-label="Pending roll action legend">
        <span><i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Resend Prompt</span>
        <span><i class="fa-solid fa-dice-d20" aria-hidden="true"></i> Roll as GM</span>
        <span><i class="fa-solid fa-xmark" aria-hidden="true"></i> Cancel Request</span>
      </div>
      <div class="zft-ir-pending-help">Resend if a player reconnects. Actions affect only their row.</div>
    </div>`;
    this.constrainWorkflowHeight();
  }
  handleRollRecovery(event) {
    const button = event.target.closest("button[data-ir-roll-recovery]");
    if (!button || !this.workflowElement?.contains(button) || !game.user?.isGM) return false;
    event.preventDefault();
    const entry = this.pendingRolls.get(button.dataset.irKey);
    if (!entry) return true;
    const action = button.dataset.irRollRecovery;
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
    if (event.target.closest('[data-ir-action="roles-reference"]')) {
      this.openRolesReference();
      return;
    }
    if (this.handleRollRecovery(event)) return;
    const button = event.target.closest("button[data-ir-action]");
    if (!button || !(this.element?.contains(button) || this.workflowElement?.contains(button) || false)) return;
    const action = button.dataset.irAction;
    if (action === "roster-toggle") {
      const collapsed = button.getAttribute("aria-expanded") === "true";
      const list = this.element?.querySelector("#zft-ir-roster-members");
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
    const editor = this.workflowElement?.querySelector("[data-ir-editor]");
    if (["roles", "attendance", "manage", "reset", "identity", "clear-log"].includes(action)) return this.togglePanel(action);
    if (action === "panel-cancel") return this.togglePanel(this.panel);
    if (action === "sync-date") {
      try {
        if (await resyncCurrentTravelDate()) {
          ui.notifications.info("Current travel day's date updated from the active Foundry calendar. Earlier days are unchanged.");
          this.renderPanel();
          this.refresh();
        } else ui.notifications.warn("The active Foundry calendar did not provide a usable date.");
      } catch (error) { console.error("[ZFT][Ironrot] Date sync failed", error); ui.notifications.error(error.message); }
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
          const selections = [...editor.querySelectorAll("select[data-ir-expedition-role]")];
          const assignments = Object.fromEntries(selections.map(select => [select.dataset.irExpeditionRole, select.value]));
          const filled = Object.values(assignments).filter(Boolean);
          if (!assignments.guide || !roster.some(actor => actor.uuid === assignments.guide))
            return ui.notifications.warn("Select an attending Guide.");
          if (new Set(filled).size !== filled.length)
            return ui.notifications.warn("Each character may hold only one expedition role.");
          if (filled.some(uuid => !roster.some(actor => actor.uuid === uuid)))
            return ui.notifications.warn("Assigned characters must be present.");
          // Retain the legacy secondary setting only when its existing PC remains
          // assigned to an expedition role. Do not invent unsupported roll mappings.
          const previous = ironrotRolePreferences();
          const keepSecondary = filled.includes(previous.secondaryUuid) && previous.secondaryUuid !== assignments.guide &&
            IRONROT_ACTIVITIES[previous.activity] && previous.activity !== "none";
          await rememberIronrotRoles({
            navigatorUuid: assignments.guide,
            secondaryUuid: keepSecondary ? previous.secondaryUuid : "",
            activity: keepSecondary ? previous.activity : "none",
            assignments
          });
          ui.notifications.info("Expedition roles saved. Assigned roles appear in the party list.");
        } else if (action === "attendance-save") {
          const state = getLedger();
          if ((state.hourResolved?.length ?? 0) || Object.keys(state.hourRolls ?? {}).length) return ui.notifications.warn("Resolve the active forced-march hour before changing attendance.");
          const checked = [...editor.querySelectorAll("input[data-ir-actor]:checked")].map(input => input.dataset.irActor);
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
          invalidateIronrotWorkflows();
          this.dismissPrompt();
          this.activeTravelTicket += 1;
          this.travelActive = false;
          const state = { ...values, activeHexCardId: null, hourResolved: [], hourRolls: {}, hourDecisions: {}, hourOutcomes: {}, hourRerolls: {}, marchHistory: [] };
          await game.settings.set("world", STATE_KEY, state);
          await game.settings.set(MODULE_ID, HEX_KEY, { totalHours: 0, baseHexes: 0 });
          await publishIronrotSnapshot(state, "Ledger corrected", "GM manually corrected expedition progress.");
          ui.notifications.info("Travel ledger updated.");
        } else if (action === "reset-save") {
          if (editor.querySelector("input[name='confirmation']")?.value.trim() !== "RESET") return ui.notifications.warn("Type RESET exactly to confirm.");
          // Invalidate any suspended GM rolls/dialogs BEFORE writing the reset.
          invalidateIronrotWorkflows();
          this.dismissPrompt();
          this.activeTravelTicket += 1;
          this.travelActive = false;
          const state = { ...DEFAULT_LEDGER, activeHexCardId: null, hourResolved: [], hourRolls: {}, hourDecisions: {}, hourOutcomes: {}, hourRerolls: {}, marchHistory: [] };
          await game.settings.set("world", STATE_KEY, state);
          await game.settings.set(MODULE_ID, CARDS_KEY, EMPTY_CARDS);
          // A new expedition gets fresh Foundry calendar dates, not stale dates
          // recorded during the previous expedition.
          await game.settings.set(MODULE_ID, CALENDAR_KEY, { datesByDay: {} });
          await game.settings.set(MODULE_ID, HEX_KEY, { totalHours: 0, baseHexes: 0 });
          await game.settings.set(MODULE_ID, LOG_KEY, { epoch: ironrotLogEpoch() + 1, hiddenHistoryKeys: [], hiddenHourKey: "", recordedDays: [] });
          await publishIronrotSnapshot(state, "Travel reset", "Expedition travel statistics were reset by the GM.");
          ui.notifications.info("Expedition travel and result cards reset. Actor Exhaustion unchanged.");
        } else if (action === "identity-save") {
          const read = key => editor.querySelector(`input[name='${key}']`)?.value.trim() ?? "";
          await game.settings.set(MODULE_ID, IDENTITY_KEY, { name: (read("name") || DEFAULT_IDENTITY.name).slice(0,100), region: read("region").slice(0,100), world: read("world").slice(0,100) });
          ui.notifications.info("Expedition identity saved. Travel dates are read from Foundry's calendar.");
        } else if (action === "clear-log-save") {
          if (editor.querySelector("input[name='confirmation']")?.value.trim() !== "CLEAR LOG") return ui.notifications.warn("Type CLEAR LOG exactly to confirm expedition log clearing.");
          await clearIronrotExpeditionLog();
          ui.notifications.info("Expedition Log cleared for all GM and player clients. Foundry Chat and travel ledger preserved.");
        }
        this.panel = null;
        editor.hidden = true;
        editor.replaceChildren();
        this.refresh();
      } catch (error) {
        console.error("[ZFT][Ironrot] GM console update failed", error);
        ui.notifications.error(`Expedition action failed: ${error.message}`);
      } finally { this.busy = false; }
      return;
    }
    if (["travel", "day"].includes(action)) {
      if (this.travelActive) return ui.notifications.warn("Another expedition travel action is already awaiting GM input.");
      this.travelActive = true;
      const ticket = ++this.activeTravelTicket;
      try { await launchMountIronrot({ action }); }
      catch (error) { console.error("[ZFT][Ironrot] Travel action failed", error); }
      finally { if (ticket === this.activeTravelTicket) this.travelActive = false; }
    }
  }
}

export const IronrotConsole = new ExpeditionConsole();
