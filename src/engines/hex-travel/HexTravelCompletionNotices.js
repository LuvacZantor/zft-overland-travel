/**
 * Hex Travel completion announcements.
 * - A GM publishes each *saved* hex completion through a GM-owned world setting.
 * - Players see only new events while connected, with a 10-second dismissal.
 * - Every GM client retains its own unacknowledged events until dismissed;
 *   local client persistence survives page refresh and never alters the ledger.
 * - The display queue never blocks or mutates a travel roll.
 */
import { MODULE_ID } from "../../constants/module-constants.js";
import { playHexTravelCue } from "./HexTravelAudio.js";

const EVENT_KEY = "hexTravelCompletionEvents";
const ACK_KEY = "hexTravelCompletionAcknowledgements";
const MAX_EVENTS = 32;
const MAX_ACKS = 128;
const EVENT_TIMEOUT = 10000;
const DISMISS_ANIMATION_MS = 600;

let initialized = false;
let observed = new Set();
let displayQueue = [];
let active = null;
let saveQueue = Promise.resolve();
let eventWriteQueue = Promise.resolve();

const safeText = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);
const validEvent = data => data && typeof data.id === "string" && data.id.length > 0 && data.id.length <= 180
  && Number.isSafeInteger(data.number) && data.number > 0 && data.number <= 1000000
  && Number.isFinite(data.hoursToday) && data.hoursToday >= 0 && data.hoursToday <= 100000;
const normalizedEvent = data => ({
  id: data.id, number: data.number, hoursToday: data.hoursToday
});
function worldEvents() {
  try { return game.settings.get(MODULE_ID, EVENT_KEY)?.events ?? []; }
  catch { return []; }
}
function localAcknowledgements() {
  try { return game.settings.get(MODULE_ID, ACK_KEY) ?? { pending: [], acknowledged: [] }; }
  catch { return { pending: [], acknowledged: [] }; }
}
function persistAcknowledgements(change) {
  // Serialize async client settings updates: a fast second hex completion and
  // a dismissal must not overwrite one another.
  saveQueue = saveQueue.catch(() => {}).then(async () => {
    const old = localAcknowledgements();
    const next = change({
      pending: Array.isArray(old.pending) ? old.pending : [],
      acknowledged: Array.isArray(old.acknowledged) ? old.acknowledged : []
    });
    await game.settings.set(MODULE_ID, ACK_KEY, next);
  }).catch(error => console.warn("[ZFT][HexTravel] Completion acknowledgement could not be saved:", error));
  return saveQueue;
}
function enqueue(event, { restored = false } = {}) {
  if (active?.event.id === event.id || displayQueue.some(e => e.id === event.id)) return;
  displayQueue.push(event);
  if (game.user?.isGM && !restored) {
    void persistAcknowledgements(old => {
      if (old.acknowledged.includes(event.id) || old.pending.some(e => e.id === event.id)) return old;
      return { ...old, pending: [...old.pending, event].slice(-MAX_EVENTS) };
    });
    playHexTravelCue("hexComplete");
  }
  showNext();
}
function inheritTheme(toast) {
  const source = document.getElementById("zft-hex-travel-console");
  if (!source || typeof getComputedStyle !== "function") return;
  const style = getComputedStyle(source);
  for (const token of ["header", "panel", "border", "success", "text", "heading", "muted"]) {
    const value = style.getPropertyValue(`--zft-theme-${token}`).trim();
    if (value) toast.style.setProperty(`--zft-theme-${token}`, value);
  }
}
function showNext() {
  if (active || !displayQueue.length) return;
  const event = displayQueue.shift();
  if (!event) return;
  const gm = !!game.user?.isGM;
  const toast = document.createElement("aside");
  toast.id = "zft-hex-completion-toast";
  toast.className = "zft-hex-completion-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.dataset.recipient = gm ? "gm" : "player";
  const title = `Hex ${event.number} Complete!`;
  const message = gm
    ? (event.hoursToday >= 8
      ? "Move the party marker to the next hex. All 8 safe travel hours are used; continuing today may require Forced March."
      : "Move the party marker to the next hex, then choose a new hex to continue traveling.")
    : "The party has finished traveling through this hex.";
  const footer = gm ? "Expedition progress saved · Dismiss when ready" : "Expedition progress saved";
  toast.innerHTML = `<i class="fa-solid fa-circle-check" aria-hidden="true"></i>`
    + `<div><strong>${safeText(title)}</strong><span>${safeText(message)}</span><small>${safeText(footer)}</small></div>`;
  inheritTheme(toast);
  document.body.append(toast);
  active = { event, toast, closing: false, timer: null, exitTimer: null };
  const record = active;
  const dismiss = () => {
    if (record.closing) return;
    record.closing = true;
    if (record.timer) clearTimeout(record.timer);
    if (gm) void persistAcknowledgements(old => ({
      pending: old.pending.filter(e => e.id !== event.id),
      acknowledged: [...new Set([...old.acknowledged, event.id])].slice(-MAX_ACKS)
    }));
    toast.classList.add("is-dismissing");
    record.exitTimer = setTimeout(() => {
      toast.remove();
      if (active === record) active = null;
      showNext();
    }, DISMISS_ANIMATION_MS);
  };
  toast.tabIndex = 0;
  toast.setAttribute("aria-label", `${title}. Click or press Enter to dismiss.`);
  toast.addEventListener("click", dismiss);
  toast.addEventListener("keydown", event => {
    if (["Enter", " ", "Escape"].includes(event.key)) {
      event.preventDefault(); dismiss();
    }
  });
  if (!gm) record.timer = setTimeout(dismiss, EVENT_TIMEOUT);
}
function deliverEvent(event) {
  if (!validEvent(event)) return;
  if (observed.has(event.id)) return;
  observed.add(event.id);
  if (observed.size > MAX_ACKS) observed.delete(observed.values().next().value);
  if (game.user?.isGM && localAcknowledgements().acknowledged?.includes(event.id)) return;
  enqueue(normalizedEvent(event));
}
function observeWorldEvents(data) {
  for (const event of (Array.isArray(data?.events) ? data.events : [])) deliverEvent(event);
}
export function registerHexCompletionNoticeSettings() {
  game.settings.register(MODULE_ID, EVENT_KEY, {
    name: "Saved hex completion announcements", scope: "world", config: false,
    type: Object, default: { events: [] }, onChange: observeWorldEvents
  });
  game.settings.register(MODULE_ID, ACK_KEY, {
    name: "Unacknowledged hex completion reminders", scope: "client", config: false,
    type: Object, default: { pending: [], acknowledged: [] }
  });
}
export function initializeHexCompletionNotices() {
  if (initialized) return;
  initialized = true;
  // Events already in the world are historical, not new player alerts.
  observed = new Set(worldEvents().map(e => e?.id).filter(Boolean));
  if (!game.user?.isGM) return;
  for (const event of localAcknowledgements().pending ?? []) {
    if (!validEvent(event)) continue;
    enqueue(normalizedEvent(event), { restored: true });
  }
}
/** Trigger only from the GM's final committed-hex checkpoint. */
export function notifyHexCompletion({ id, number, hoursToday } = {}) {
  if (!game.user?.isGM || typeof id !== "string" || !id) return;
  const hexNumber = Number(number);
  if (!Number.isSafeInteger(hexNumber) || hexNumber < 1) return;
  const event = {
    id: `${Number(game.settings.get(MODULE_ID, "hexTravelLogVisibility")?.epoch || 0)}:${id}`,
    number: hexNumber,
    hoursToday: Number(hoursToday) || 0
  };
  if (!validEvent(event)) return;
  // Never re-broadcast one saved hex. This setting is GM-owned, so a player
  // cannot forge a completion announcement through a peer socket.
  if (worldEvents().some(previous => previous.id === event.id) || observed.has(event.id)) return;
  // Serial world writes protect two fast hex completions from replacing one
  // another in the same authoritative event list.
  eventWriteQueue = eventWriteQueue.catch(() => {}).then(async () => {
    if (worldEvents().some(previous => previous.id === event.id) || observed.has(event.id)) return;
    try {
      await game.settings.set(MODULE_ID, EVENT_KEY, {
        events: [...worldEvents(), event].slice(-MAX_EVENTS)
      });
      // Some environments notify remote clients but not the writing client.
      deliverEvent(event);
      console.info(`[ZFT][HexTravel] ✅ Hex ${hexNumber} completion broadcast to connected clients.`);
    } catch (error) {
      console.warn("[ZFT][HexTravel] Failed to publish hex completion; showing local GM reminder:", error);
      deliverEvent(event);
    }
  });
}
