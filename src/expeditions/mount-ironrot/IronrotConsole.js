/**
 * Mount Ironrot Expedition Console (V13).
 * Only Mount Ironrot state is used here. The generic Travel Manager is untouched.
 * GM publishes a compact world-setting snapshot; player clients render read-only.
 * Each stable card is reconciled individually; the floating window isn't re-rendered.
 */
import { MODULE_ID, MODULE_TITLE } from "../../constants/module-constants.js";
import { launchMountIronrot } from "./MountIronrot.js";
import { ironrotD20Total, decorateLegacyIronrotDice } from "./IronrotDice.js";
import { IRONROT_ACTIVITIES, IRONROT_NAVIGATION_SKILL } from "./IronrotRoles.js";
import { ThemeManager } from "../../theme/ThemeManager.js";
import { ThemeEditor } from "../../theme/ThemeEditor.js";

const STATE_KEY = "mountIronrotTravelV45";
const SNAPSHOT_KEY = "ironrotConsoleSnapshot";
const ATTENDANCE_KEY = "ironrotAttendance";
const UI_KEY = "ironrotConsoleUi";
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
    type: Object, default: { navigatorUuid: "", secondaryUuid: "", activity: "none" },
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
    type: Object, default: { epoch: 0, hiddenHistoryKeys: [], hiddenHourKey: "" },
    onChange: () => IronrotConsole.refresh()
  });
  game.settings.register(MODULE_ID, SHOW_KEY, {
    name: "GM display request", scope: "world", config: false,
    type: Object, default: { requestedAt: 0 },
    onChange: data => { if (!game.user?.isGM && data?.requestedAt) void IronrotConsole.showWorkspace(); }
  });
  game.settings.register(MODULE_ID, UI_KEY, {
    name: "Mount Ironrot console layout", scope: "client", config: false,
    type: Object, default: { mode: "hidden", left: 160, top: 80, logWidth: 540, logHeight: 650, logHeightManual: false, logDocked: true, logHidden: false, workflowWidth: 405, workflowDocked: true, workflowHidden: false }
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
  return game.settings.get(MODULE_ID, ROLE_KEY) ?? { navigatorUuid: "", secondaryUuid: "", activity: "none" };
}
export async function rememberIronrotRoles(preferences) {
  if (!game.user?.isGM) return;
  await game.settings.set(MODULE_ID, ROLE_KEY, {
    navigatorUuid: String(preferences.navigatorUuid ?? ""),
    secondaryUuid: String(preferences.secondaryUuid ?? ""),
    activity: String(preferences.activity ?? "none")
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
      hiddenHourKey: `${st.day}:${st.hours}`
    });
    await game.settings.set(MODULE_ID, CARDS_KEY, { cards: [] });
  });
}
/** Called on the GM only. No player privileges or socket endpoints needed. */
export async function publishIronrotSnapshot(state, phase = "Travel status", detail = "") {
  if (!game.user?.isGM) return;
  await recordFoundryTravelDay(Number(state?.day));
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
const spanStat = (label, value, color = "") => `<div class="zft-ir-stat"><span>${esc(label)}</span><strong ${color ? `class="${color}"` : ""}>${esc(value)}</strong></div>`;

// Roles and skills are shared with the travel engine, including future additions.
const SKILL_ABILITY_FALLBACK = Object.freeze({sur:"wis",prc:"wis",arc:"int",inv:"int",ste:"dex",nat:"int"});
function actorModifier(value) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && value !== null && value !== undefined && value !== "" ? numeric : null;
}
function signed(value) { return value === null ? "—" : `${value >= 0 ? "+" : ""}${value}`; }
function travelSkill(actor, key) {
  const data = actor.system?.skills?.[key] ?? {};
  const modifier = actorModifier(data.total ?? actor.getRollData?.()?.skills?.[key]?.total);
  const configuredLabel = CONFIG.DND5E?.skills?.[key]?.label;
  const label = typeof configuredLabel === "string" ? (game.i18n?.localize?.(configuredLabel) ?? configuredLabel) : ({sur:"Survival",prc:"Perception",arc:"Arcana",inv:"Investigation",ste:"Stealth",nat:"Nature"}[key] ?? key.toUpperCase());
  const ability = String(data.ability ?? CONFIG.DND5E?.skills?.[key]?.ability ?? SKILL_ABILITY_FALLBACK[key] ?? "").toUpperCase();
  return { label, ability, modifier };
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
  cards.push(stateCard("overview", `
    <div class="zft-ir-stats">${spanStat("DAY", Math.max(1, num(s.day)))}${spanStat("HOURS TODAY", `${hours}/8`, hours > 8 ? "amber" : "green")}${spanStat("HEXES", num(s.hexes))}</div>
    <div class="zft-ir-progress-label"><span>Safe travel hours</span><strong>${safe}/8h</strong></div>
    <div class="zft-ir-progress"><div style="width:${Math.round(safe / 8 * 100)}%"></div></div>
    ${hexValid ? `<div class="zft-ir-progress-label"><span>Current hex progress</span><strong>${spent}/${total}h</strong></div><div class="zft-ir-progress zft-ir-hex-progress"><div style="width:${total ? Math.round(spent / total * 100) : 0}%"></div></div>` : ""}
    <div class="zft-ir-progress-grid">
      <span>Traveled today <strong>${hours}h</strong></span>
      <span>Safe time left <strong>${safeRemaining}h</strong></span>
      <span>Forced travel <strong>${forced}h</strong></span>
      <span>Current hex left <strong>${pending}h</strong></span>
      <span>Current hex spent <strong>${spent === null ? (pending ? "Not recorded" : "—") : `${spent}h`}</strong></span>
      <span>Completed hexes <strong>${num(s.hexes)}</strong></span>
    </div>
    <div class="zft-ir-next-step">${esc(next)}</div>`));
  // Summary already states remaining hours and next action. No duplicate status panel.
  // One timeline for ALL expedition event types. Saved hex HTML and saved
  // march history remain untouched. The previous design reversed two separate
  // lists, incorrectly placing recent Forced March events below old hexes.
  const travelCards = game.settings.get(MODULE_ID, CARDS_KEY)?.cards ?? [];
  const visibility = game.settings.get(MODULE_ID, LOG_KEY) ?? {};
  const hiddenHistory = new Set(visibility.hiddenHistoryKeys ?? []);
  const timeline = [];
  const marchEvents = (Array.isArray(s.marchHistory) ? s.marchHistory : [])
    .filter(h => !hiddenHistory.has(`${h.day}:${h.hour}`));
  for (const record of travelCards) {
    if (!record?.id || !record?.html) continue;
    const complete = record.stage === "complete";
    const rolledHours = record.html.match(/>(\d+) hours<\/div>/)?.[1];
    const outcome = record.html.includes(">SUCCESS</strong>") ? "Navigation success"
      : record.html.includes(">FAILURE</strong>") ? "Navigation failure" : "Navigation resolved";
    timeline.push({ kind: "hex", key: `hex:${record.id}`, record,
      day: Number.isSafeInteger(record.day) && record.day > 0 ? record.day : null,
      at: Number(record.completedAt ?? record.updatedAt) || 0,
      complete, outcome, rolledHours });
  }
  for (const entry of marchEvents) {
    const day = Number(entry.day);
    timeline.push({ kind: "march", key: `history:${entry.day}:${entry.hour}`, entry,
      day: Number.isSafeInteger(day) && day >= 1 ? day : null,
      at: Number(entry.recordedAt) || 0,
      complete: true });
  }
  // Dated events sort by recorded travel day, then actual completion time.
  // Older records without a recorded day/date remain in Undated History rather
  // than being incorrectly assigned today's date. Legacy march records retain
  // their stored day and hour, without inventing timestamps.
  timeline.sort((a,b) => {
    if (a.day !== b.day) return (b.day ?? -1) - (a.day ?? -1);
    if (a.at && b.at && a.at !== b.at) return b.at - a.at;
    if (a.at !== b.at) return b.at - a.at;
    if (a.kind === "march" && b.kind === "march") return num(b.entry.hour) - num(a.entry.hour);
    return a.kind === "march" ? -1 : b.kind === "march" ? 1 : 0;
  });
  // The 'complete' stage of a travel card means the *dice roll* finished,
  // not that the party crossed the hex. The ledger marks a hex counted as soon
  // as its hours are resolved. Keep the latest recorded hex on the current day
  // identified as current until another hex starts (or a new day begins).
  // When hours remain, the active hex can also span a travel-day boundary.
  const newestHex = timeline.find(item => item.kind === "hex");
  const activeHexKey = newestHex?.complete &&
    (newestHex.day === num(s.day) || num(s.pending) > 0) ? newestHex.key : null;
  const newestCurrentCompletedEventKey = timeline.find(item => item.day === num(s.day) && item.complete)?.key ?? null;
  const logCards = [];
  let lastDay = Symbol("initial");
  for (const item of timeline) {
    if (lastDay !== item.day) {
      const label = item.day === null ? "Undated earlier travel" : `${dateAndDay(item.day)}${item.day === num(s.day) ? " · Current Day" : ""}`;
      logCards.push(stateCard(`day:${item.day ?? "undated"}`, `<div class="zft-ir-day-divider"><i class="fa-solid fa-calendar-days" aria-hidden="true"></i> ${esc(label)}</div>`, "zft-ir-day-card"));
      lastDay = item.day;
    }
    if (item.kind === "hex") {
      const record = item.record;
      const decorated = decorateLegacyIronrotDice(record.html);
      // A day's header owns its date. Do not repeat it in each hex card.
      const dateTag = item.day === null ? `<div class="zft-ir-hex-date">Date not recorded</div>` : "";
      const resultClass = item.outcome === "Navigation failure" ? "zft-ir-history-failed" : "zft-ir-history-success";
      const isCurrentHex = item.complete && item.key === activeHexKey;
      const hasUnspentHours = isCurrentHex && num(s.pending) > 0;
      const eventLabel = isCurrentHex ? "Current hex · In progress" : "Hex completed";
      const eventIcon = isCurrentHex ? "fa-hourglass-half" : "fa-circle-check";
      const timeSummary = item.rolledHours
        ? (isCurrentHex ? `${item.rolledHours}h recorded` : `${item.rolledHours}h total`)
        : "Travel time unavailable";
      const summary = `${timeSummary} · ${item.outcome}`;
      const remaining = hasUnspentHours ? `<span class="zft-ir-history-remaining">${num(s.pending)}h remaining</span>` : "";
      // The log view can be redesigned without touching the world-setting HTML,
      // dice rolls, or historic expedition snapshots.
      const resultHtml = item.complete ? compactIronrotHexResult(decorated) : decorated;
      logCards.push(stateCard(item.key, item.complete
        ? `<details class="zft-ir-log-history ${resultClass} ${isCurrentHex ? "zft-ir-history-current" : ""}" data-ir-history ${item.key === newestCurrentCompletedEventKey ? "open" : ""}><summary><span class="zft-ir-history-label"><i class="fa-solid ${eventIcon}" aria-hidden="true"></i> ${esc(eventLabel)}</span><span class="zft-ir-history-summary">${esc(summary)}${remaining}</span></summary><div class="zft-ir-travel-html">${dateTag}${resultHtml}</div></details>`
        : `<div class="zft-ir-travel-html">${dateTag}${decorated}</div>`, "zft-ir-hex-card"));
    } else {
      const entry = item.entry;
      const rows = (entry.results ?? []).map(result => `<div class="zft-ir-result-row"><strong>${esc(result.name)}</strong><span class="${result.passed ? "green" : "red"}">${Number.isFinite(result.total) ? ironrotD20Total(result.total) : "—"} · ${result.passed ? "Passed" : "Failed"}${num(result.rerolls) ? ` · Rerolled ×${num(result.rerolls)}` : ""}</span><small>${esc(result.outcome ?? "GM resolved")}</small></div>`).join("");
      const full = `<div class="zft-ir-march-full"><div class="zft-ir-card-title">Completed Forced March · Hour ${esc(entry.hour)} · CON DC ${esc(entry.dc)}</div>${rows || "<p>No entries</p>"}</div>`;
      const results = Array.isArray(entry.results) ? entry.results : [];
      const failed = results.filter(result => result.passed === false).length;
      const compactResult = failed ? `${results.length} saves · ${failed} failed` : `${results.length} saves accepted`;
      logCards.push(stateCard(item.key,
        `<details class="zft-ir-log-history zft-ir-history-march" data-ir-history ${item.key === newestCurrentCompletedEventKey ? "open" : ""}><summary><span class="zft-ir-history-label"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Forced March completed · Hour ${esc(entry.hour)}</span><strong>DC ${esc(entry.dc)} · ${esc(compactResult)}</strong></summary>${full}</details>`, "zft-ir-march-card"));
    }
  }

  // Keep dates and event order in one timeline, but collapse completed days
  // rather than leaving long lists of old hexes at full height. The current
  // day automatically collapses after Stop and re-expands on same-day resume.
  const groupedLog = [];
  let dayGroup = null;
  const flushGroup = () => {
    if (!dayGroup) return;
    const day = dayGroup.day;
    const isCurrent = day !== null && day === Number(s.day);
    const stopped = ["Travel stopped", "Travel paused"].includes(snapshot.phase);
    const initiallyOpen = isCurrent && !stopped;
    const dayLabel = day === null ? "Undated earlier travel" : dateAndDay(day);
    const status = isCurrent ? (stopped ? "Stopped / Paused" : "Current Day") : "Earlier Day";
    const summary = `${dayGroup.hexes} hex${dayGroup.hexes === 1 ? "" : "es"} · ${dayGroup.marches} forced march`;
    groupedLog.push(stateCard(dayGroup.key, `<details class="zft-ir-day-group" data-ir-day-group="${esc(day ?? "undated")}" ${initiallyOpen ? "open" : ""}><summary><span class="zft-ir-day-group-label"><i class="fa-solid fa-calendar-days" aria-hidden="true"></i> ${esc(dayLabel)} <small>${esc(status)}</small></span><span class="zft-ir-day-group-count">${esc(summary)}</span></summary><div class="zft-ir-day-group-events">${dayGroup.events.join("")}</div></details>`, "zft-ir-day-group-card"));
    dayGroup = null;
  };
  for (const card of logCards) {
    if (card.key.startsWith("day:")) {
      flushGroup();
      const raw = card.key.slice(4);
      dayGroup = { key: card.key, day: raw === "undated" ? null : Number(raw), events: [], hexes: 0, marches: 0 };
    } else if (dayGroup) {
      dayGroup.events.push(card.html);
      if (card.key.startsWith("hex:")) dayGroup.hexes++;
      if (card.key.startsWith("history:")) dayGroup.marches++;
    }
  }
  flushGroup();
  // An active new travel day must be visible even before its first result.
  // Without this, the log can show Day 4 while the dashboard reads Day 5.
  const currentDayKey = `day:${Math.max(1, Number(s.day) || 1)}`;
  if (!groupedLog.some(card => card.key === currentDayKey)) {
    const stopped = ["Travel stopped", "Travel paused"].includes(snapshot.phase);
    const dayTitle = dateAndDay(s.day);
    const emptyHint = game.user?.isGM
      ? "No travel activity recorded for this day yet."
      : "No travel activity has been recorded for this day yet.";
    groupedLog.unshift(stateCard(currentDayKey,
      `<details class="zft-ir-day-group zft-ir-day-empty" data-ir-day-group="${esc(s.day)}" ${stopped ? "" : "open"}><summary><span class="zft-ir-day-group-label"><i class="fa-solid fa-calendar-days" aria-hidden="true"></i> ${esc(dayTitle)} <small>${stopped ? "Stopped / Paused" : "Current Day"}</small></span><span class="zft-ir-day-group-count">0 events</span></summary><div class="zft-ir-day-group-events"><div class="zft-ir-day-empty-note"><i class="fa-solid fa-book-open" aria-hidden="true"></i><span><strong>No travel events recorded</strong><small>${esc(emptyHint)}</small></span></div></div></details>`,
      "zft-ir-day-group-card"));
  }
  const roster = presentRoster();
  const roles = ironrotRolePreferences();
  const rosterHtml = roster.map(actor => {
    const navigator = actor.uuid === roles.navigatorUuid;
    const activity = actor.uuid === roles.secondaryUuid && roles.activity !== "none" ? IRONROT_ACTIVITIES[roles.activity] : null;
    const assigned = navigator ? "Navigator" : (activity ? `Secondary · ${activity.name}` : "Available");
    const skillKey = navigator ? IRONROT_NAVIGATION_SKILL : activity?.skill ?? null;
    const check = skillKey ? travelSkill(actor, skillKey) : null;
    const checkInfo = check ? `<span class="zft-ir-member-skill" title="Assigned expedition check">${esc(check.label)}${check.ability ? ` (${esc(check.ability)})` : ""} <strong>${esc(signed(check.modifier))}</strong></span>` : "";
    const con = conSaveBonus(actor);
    const portrait = actor.img ? `<img src="${esc(actor.img)}" loading="lazy" alt="">` : `<i class="fa-solid fa-user" aria-hidden="true"></i>`;
    const rawExhaustion = actor.system?.attributes?.exhaustion;
    const exhaustion = Number(typeof rawExhaustion === "object" ? rawExhaustion?.value : rawExhaustion);
    const status = Number.isFinite(exhaustion) && exhaustion > 0
      ? `<span class="zft-ir-member-condition">Exhaustion ${Math.trunc(exhaustion)}</span>` : "";
    return `<div class="zft-ir-party-member"><span class="zft-ir-portrait" data-ir-actor-sheet="${esc(actor.uuid)}" title="Double-click to open character sheet" role="button" tabindex="0" aria-label="Open ${esc(actor.name)} character sheet">${portrait}</span><span class="zft-ir-member-info"><strong>${esc(actor.name)}</strong><small>${esc(assigned)}</small><span class="zft-ir-member-bonuses">${checkInfo}<span class="zft-ir-member-con" title="Constitution saving throw bonus">CON Save <strong>${esc(signed(con))}</strong></span></span></span>${status}</div>`;
  }).join("");
  cards.push(stateCard("party", `<div class="zft-ir-card-title">Present Party · ${roster.length}</div><div class="zft-ir-party-list">${rosterHtml || "No party members selected"}</div>`));

  // Public forced-march briefing appears before the GM confirms continuing.
  // All clients use the same world snapshot; only the GM gets action controls.
  // An archived forced hour is represented solely by the completed timeline.
  const marchPhase = String(snapshot.phase ?? "");
  const forcedBriefingPhases = new Set(["Forced march decision", "Forced march", "Saving throws", "Rerolling", "GM review"]);
  const showBriefing = pending > 0 && hours >= 8 &&
    forcedBriefingPhases.has(marchPhase) && visibility.hiddenHourKey !== `${s.day}:${s.hours}`;
  if (showBriefing) {
    const hour = hours + 1;
    const dc = 10 + hour - 8;
    const isDecision = marchPhase === "Forced march decision";
    const isReview = marchPhase === "GM review";
    const isReroll = marchPhase === "Rerolling";
    const status = isDecision ? "Awaiting GM decision"
      : isReview ? "Awaiting GM rulings"
      : isReroll ? "Reroll in progress" : "Constitution saves required";
    const statusClass = isDecision ? "zft-ir-briefing-decision"
      : isReview ? "zft-ir-briefing-review" : "zft-ir-briefing-rolling";
    const description = isDecision
      ? `The party has completed ${hours} hour(s) of travel today. The GM is deciding whether to continue into hour ${hour} or stop for the day.`
      : isReview ? "The party's saving throws have been submitted. The GM is reviewing the results and deciding the outcomes."
      : isReroll ? "One or more characters are rerolling Constitution saves. Awaiting replacement results."
      : `The party is pushing beyond 8 hours of normal travel. A Constitution saving throw is required at the end of hour ${hour}.`;
    activeSaveCards.push(stateCard("forced-briefing", `
      <section class="zft-ir-forced-briefing ${statusClass}" aria-label="Forced March information">
        <div class="zft-ir-forced-briefing-head"><strong><i class="fa-solid fa-person-hiking" aria-hidden="true"></i> Forced March · Hour ${hour}</strong><span class="zft-ir-forced-stage">${esc(status)}</span></div>
        <div class="zft-ir-forced-briefing-date">${esc(dateAndDay(s.day))}</div>
        <div class="zft-ir-forced-briefing-stats"><span>Travel today <strong>${hours}h</strong></span><span>Current hex left <strong>${pending}h</strong></span><span>CON save <strong>DC ${dc}</strong></span></div>
        <p>${esc(description)}</p>
        <div class="zft-ir-forced-briefing-warning"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Failed save: 1 level of Exhaustion.</div>
      </section>`, "zft-ir-forced-briefing-card"));
  }
  const rolls = s.hourRolls ?? {};
  const outcomes = s.hourOutcomes ?? {};
  const resolved = new Set(s.hourResolved ?? []);
  const hasSaves = ["Saving throws", "GM review", "Rerolling", "Forced march", "Hour resolved"].includes(snapshot.phase) || Object.keys(rolls).length > 0 || resolved.size > 0;
  if (hasSaves && visibility.hiddenHourKey !== `${s.day}:${s.hours}`) {
    const hour = hours + 1;
    const dc = 10 + hour - 8;
    if (!showBriefing) activeSaveCards.push(stateCard("forced-header", `<div class="zft-ir-card-title">Forced March · Hour ${hour} · CON DC ${dc}</div><small>${esc(dateAndDay(s.day))}</small>`));
    for (const actor of roster) {
      const value = rolls[actor.uuid];
      const hasRoll = Number.isFinite(value);
      const rerollPending = (s.hourRerollPending ?? []).includes(actor.uuid);
      const outcome = resolved.has(actor.uuid) ? (outcomes[actor.uuid] || "GM resolved") : hasRoll ? "Awaiting GM ruling" : "Awaiting roll";
      const color = rerollPending || !hasRoll ? "amber" : value >= dc ? "green" : "red";
      const rerolls = num(s.hourRerolls?.[actor.uuid]);
      const result = rerollPending ? "Rerolling · awaiting d20" : hasRoll ? `${ironrotD20Total(value)} · ${value >= dc ? "Passed" : "Failed"}` : "Pending";
      const explanation = rerollPending
        ? `Reroll requested · ${hasRoll ? `previous result ${esc(value)}` : "awaiting result"}`
        : `${rerolls ? `Rerolled ×${rerolls} · ` : ""}${esc(outcome)}`;
      activeSaveCards.push(stateCard(`save:${actor.uuid}`, `<div class="zft-ir-result"><strong>${esc(actor.name)}</strong><span class="${color}">${result}</span></div><p>${explanation}</p>`));
    }
  }
  // Active party rolls stay grouped and first. Reverse *entry groups*, never
  // individual character results inside a group or the saved world history.
  return [...cards, ...activeSaveCards, ...groupedLog];
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
      if (candidate.closest("#zft-ironrot-console, #zft-ironrot-log, #zft-ironrot-workflow-window, #zft-overland-theme-window")) continue;
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
  // Display scaling is suspended until the expedition layout is accepted.
  // Ignore legacy per-client slider values without mutating other UI preferences.
  applyDisplayScale() {
    this.element?.style.setProperty("--zft-ir-dashboard-scale", "1");
    this.workflowElement?.style.setProperty("--zft-ir-dashboard-scale", "1");
    this.logElement?.style.setProperty("--zft-ir-log-scale", "1");
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
    const room = Math.max(160, Math.floor(window.innerHeight - node.getBoundingClientRect().top - 8));
    const minimum = Math.min(205, room);
    if (this.logHeightIsManual()) {
      const saved = Number(this.state.logHeight ?? this.state.height) || 650;
      node.style.height = `${Math.min(room, Math.max(minimum, saved))}px`;
      return;
    }
    const style = getComputedStyle(scroller);
    const pad = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    const desired = Math.ceil(head.getBoundingClientRect().height + feed.scrollHeight + pad + 4);
    node.style.height = `${Math.min(room, Math.max(minimum, desired))}px`;
  }
  fitDashboardToViewport() {
    if (!this.element) return;
    const top = this.element.getBoundingClientRect().top;
    const available = Math.max(220, Math.floor(window.innerHeight - top - 12));
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
    if (mode === "hidden") this.themeEditor?.cancel();
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
                  <button type="button" data-ir-action="roles"><i class="fa-solid fa-user-gear"></i> Party Roles</button>
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
    if (this.state.workflowDocked === false) return; // honor deliberately undocked controls
    const controlsWidth = this.workflowElement.getBoundingClientRect().width || 405;
    const dashboardWidth = this.element.getBoundingClientRect().width || 375;
    const logWidth = this.logElement && !this.logElement.hidden && this.state.logDocked !== false
      ? this.logElement.getBoundingClientRect().width : 0;
    const gap = 6;
    const minimum = controlsWidth + gap + 8;
    const maximum = window.innerWidth - dashboardWidth - (logWidth ? logWidth + gap : 0) - 8;
    // Move the entire three-column workspace into view when it fits.
    // Smaller screens retain independently scrollable columns; never change
    // Foundry global UI positioning or block clicks outside our own windows.
    if (maximum >= minimum) {
      const current = this.element.offsetLeft;
      this.element.style.left = `${Math.round(Math.max(minimum, Math.min(current, maximum)))}px`;
    }
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
      log.style.left = `${Math.round(Math.min(atRight, Math.max(0, window.innerWidth - 80)))}px`;
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
    const available = Math.max(120, window.innerHeight - top - 12);
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
      node.style.left = `${Math.max(8, Math.round(dash.left - width - 6))}px`;
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
    const origin = { x:event.clientX, y:event.clientY, width:rect.width, height:rect.height };
    let resized = false;
    this.logResizeActive = true;
    const move = ev => {
      if (Math.abs(ev.clientX - origin.x) + Math.abs(ev.clientY - origin.y) > 3) resized = true;
      const maxW = Math.max(330, window.innerWidth - node.offsetLeft - 8);
      const maxH = Math.max(205, window.innerHeight - node.offsetTop - 8);
      node.style.width = `${Math.round(Math.min(maxW, Math.max(330, origin.width + ev.clientX - origin.x)))}px`;
      node.style.height = `${Math.round(Math.min(maxH, Math.max(205, origin.height + ev.clientY - origin.y)))}px`;
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
    const currentDayState = `${snapshot.state?.day ?? 1}:${["Travel stopped", "Travel paused"].includes(snapshot.phase) ? "stopped" : "active"}`;
    if (this.lastDayState && this.lastDayState !== currentDayState) {
      this.dayOpenOverrides.delete(`day:${snapshot.state?.day ?? 1}`);
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
    if (this.panel && !this.workflowElement?.querySelector("[data-ir-editor] input")) this.renderPanel();
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
    content.innerHTML = options.content ?? "";
    const actions = document.createElement("div");
    actions.className = "zft-ir-prompt-actions";
    const defs = options.buttons ?? [];
    for (const option of defs) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.action = option.action ?? "";
      button.dataset.irPromptAction = option.action ?? "";
      if (option.default) button.classList.add("zft-ir-prompt-default");
      if (option.action === "reset" || option.action === "exhaust") button.classList.add("zft-ir-danger");
      if (option.icon) { const icon = document.createElement("i"); icon.className = option.icon; button.append(icon, " "); }
      button.append(document.createTextNode(option.label ?? option.action ?? "Continue"));
      actions.append(button);
    }
    if (!defs.some(option => /cancel|pause|exit|stop/i.test(`${option.action ?? ""} ${option.label ?? ""}`))) {
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.dataset.irPromptCancel = "true";
      cancel.textContent = "Cancel / Exit";
      actions.append(cancel);
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
  }
  renderPanel() {
    const editor = this.workflowElement?.querySelector("[data-ir-editor]");
    if (!editor || !this.panel) return;
    const st = getLedger();
    const buttons = (save, label="Save") => `<div class="zft-ir-actions"><button type="button" data-ir-action="${save}">${label}</button><button type="button" data-ir-action="panel-cancel">Cancel</button></div>`;
    if (this.panel === "roles") {
      const roster = presentRoster();
      const current = ironrotRolePreferences();
      const currentNav = roster.find(actor => actor.uuid === current.navigatorUuid)?.uuid ?? "";
      const currentActivity = IRONROT_ACTIVITIES[current.activity] ? current.activity : "none";
      const currentSecondary = roster.find(actor => actor.uuid === current.secondaryUuid && actor.uuid !== currentNav)?.uuid ?? "";
      const navOptions = `<option value="">Choose Navigator</option>` + roster.map(actor => `<option value="${esc(actor.uuid)}" ${actor.uuid === currentNav ? "selected" : ""}>${esc(actor.name)}</option>`).join("");
      const secondaryOptions = `<option value="">Choose Secondary PC</option>` + roster.map(actor => `<option value="${esc(actor.uuid)}" ${actor.uuid === currentSecondary ? "selected" : ""}>${esc(actor.name)}</option>`).join("");
      const activityOptions = Object.entries(IRONROT_ACTIVITIES).map(([key,info]) => `<option value="${esc(key)}" ${key === currentActivity ? "selected" : ""}>${esc(info.name)}${info.skill ? ` · ${esc(travelSkill(roster[0] ?? {}, info.skill).label)}` : ""}</option>`).join("");
      editor.innerHTML = `<div class="zft-ir-card-title">Party Role Assignments</div>
        <p>Save once for the expedition. Start / Continue reuses these roles for each new hex.</p>
        <div class="zft-ir-fields zft-ir-roles-fields">
          <label>Navigator<select name="roleNavigator">${navOptions}</select></label>
          <label>Secondary Activity<select name="roleActivity">${activityOptions}</select></label>
          <label data-ir-role-secondary>Secondary Character<select name="roleSecondary">${secondaryOptions}</select></label>
        </div>
        <p class="zft-ir-role-note">The Navigator uses Survival (WIS). Secondary checks depend on the activity. The same character cannot hold both roles. Offline assigned PCs remain selectable when present.</p>
        ${buttons("roles-save", "Save Party Roles")}`;
      const nav = editor.querySelector("select[name='roleNavigator']");
      const activity = editor.querySelector("select[name='roleActivity']");
      const secondary = editor.querySelector("select[name='roleSecondary']");
      const row = editor.querySelector("[data-ir-role-secondary]");
      const sync = () => {
        const chosenNav = nav.value;
        for (const option of secondary.options) {
          option.disabled = !!chosenNav && option.value === chosenNav;
        }
        if (secondary.value === chosenNav) secondary.value = "";
        row.hidden = activity.value === "none";
        secondary.disabled = activity.value === "none";
      };
      nav.addEventListener("change", sync);
      activity.addEventListener("change", sync);
      sync();
    } else if (this.panel === "attendance") {
      const excluded = new Set(attendanceConfig().excludedActorUuids ?? []);
      const options = assignedRoster().map(actor => `<label><input type="checkbox" data-ir-actor="${esc(actor.uuid)}" ${excluded.has(actor.uuid) ? "" : "checked"}> <span>${esc(actor.name)}</span></label>`).join("");
      editor.innerHTML = `<div class="zft-ir-card-title">Choose Present Party Members</div><p>Offline assigned PCs remain eligible.</p><div class="zft-ir-members">${options || "No assigned PCs."}</div>${buttons("attendance-save", "Save Attendance")}`;
    } else if (this.panel === "manage") {
      editor.innerHTML = `<div class="zft-ir-card-title">Edit Travel Ledger</div><p>Saving a manual correction clears hourly roll history and forced-march checkpoints.</p><div class="zft-ir-fields">
      <label>Expedition Day<input name="day" type="number" min="1" step="1" value="${num(st.day)}"></label>
      <label>Hours Today<input name="hours" type="number" min="0" step="1" value="${num(st.hours)}"></label>
      <label>Unfinished Hex Hours<input name="pending" type="number" min="0" step="1" value="${num(st.pending)}"></label>
      <label>Completed Hexes<input name="hexes" type="number" min="0" step="1" value="${num(st.hexes)}"></label></div>${buttons("manage-save", "Save Ledger")}`;
    } else if (this.panel === "reset") {
      editor.innerHTML = `<div class="zft-ir-reset-inline"><div class="zft-ir-card-title red"><i class="fa-solid fa-triangle-exclamation"></i> Permanent Expedition Reset</div><p>Clear all saved travel hours, hexes, pending time, forced-march rulings, and current expedition results. This cannot be undone. Actor Exhaustion is not changed.</p><label>Type RESET to confirm<input name="confirmation" type="text" autocomplete="off" placeholder="RESET"></label></div>${buttons("reset-save", "Permanently Reset")}`;
      editor.querySelector("[data-ir-action='reset-save']")?.classList.add("zft-ir-danger");
    } else if (this.panel === "identity") {
      const id = ironrotIdentity();
      editor.innerHTML = `<div class="zft-ir-card-title">Region &amp; Expedition Details</div>
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
      editor.innerHTML = `<div class="zft-ir-reset-inline"><div class="zft-ir-card-title red">Clear Expedition Log for Everyone</div><p>This permanently removes expedition result cards from the GM and player log windows, including saved visual history. It does not delete Foundry Chat messages, change travel hours, or alter effects.</p><label>Type CLEAR LOG to confirm<input name="confirmation" type="text" autocomplete="off" placeholder="CLEAR LOG"></label></div>${buttons("clear-log-save", "Clear Expedition Log")}`;
      editor.querySelector("[data-ir-action='clear-log-save']")?.classList.add("zft-ir-danger");
    }
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
    container.innerHTML = pending.map(({ key, actorName, label, rollerName, attempt }) => `
      <div class="zft-ir-pending-roll" data-ir-pending-key="${esc(key)}">
        <div class="zft-ir-pending-roll-title"><i class="fa-solid fa-rotate" aria-hidden="true"></i> Awaiting ${esc(actorName)} · ${esc(label)}</div>
        <div class="zft-ir-pending-roll-note">Sent to ${esc(rollerName)} · Attempt ${Number(attempt)}. If the player reloaded, resend after they reconnect.</div>
        <div class="zft-ir-pending-roll-actions">
          <button type="button" data-ir-roll-recovery="resend" data-ir-key="${esc(key)}"><i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Resend Prompt</button>
          <button type="button" data-ir-roll-recovery="gm" data-ir-key="${esc(key)}">Roll as GM</button>
          <button type="button" data-ir-roll-recovery="cancel" data-ir-key="${esc(key)}">Cancel Request</button>
        </div>
      </div>`).join("");
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
    if (this.handleRollRecovery(event)) return;
    const button = event.target.closest("button[data-ir-action]");
    if (!button || !(this.element?.contains(button) || this.workflowElement?.contains(button))) return;
    const action = button.dataset.irAction;
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
          const nav = editor.querySelector("select[name='roleNavigator']")?.value ?? "";
          const activity = editor.querySelector("select[name='roleActivity']")?.value ?? "none";
          const secondary = editor.querySelector("select[name='roleSecondary']")?.value ?? "";
          if (!roster.some(actor => actor.uuid === nav)) return ui.notifications.warn("Select an attending Navigator.");
          if (!IRONROT_ACTIVITIES[activity]) return ui.notifications.warn("Select a supported secondary activity.");
          if (activity !== "none" && (!roster.some(actor => actor.uuid === secondary) || secondary === nav))
            return ui.notifications.warn("Select a different attending PC for the secondary activity.");
          await rememberIronrotRoles({ navigatorUuid: nav, secondaryUuid: activity === "none" ? "" : secondary, activity });
          ui.notifications.info("Party roles saved for subsequent hexes. Start / Continue will use these assignments.");
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
          const state = { ...values, hourResolved: [], hourRolls: {}, hourDecisions: {}, hourOutcomes: {}, hourRerolls: {}, marchHistory: [] };
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
          const state = { ...DEFAULT_LEDGER, hourResolved: [], hourRolls: {}, hourDecisions: {}, hourOutcomes: {}, hourRerolls: {}, marchHistory: [] };
          await game.settings.set("world", STATE_KEY, state);
          await game.settings.set(MODULE_ID, CARDS_KEY, EMPTY_CARDS);
          // A new expedition gets fresh Foundry calendar dates, not stale dates
          // recorded during the previous expedition.
          await game.settings.set(MODULE_ID, CALENDAR_KEY, { datesByDay: {} });
          await game.settings.set(MODULE_ID, HEX_KEY, { totalHours: 0, baseHexes: 0 });
          await game.settings.set(MODULE_ID, LOG_KEY, { epoch: ironrotLogEpoch() + 1, hiddenHistoryKeys: [], hiddenHourKey: "" });
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
