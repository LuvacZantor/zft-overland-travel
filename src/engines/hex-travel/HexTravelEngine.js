/** Hex Travel 4.13, independent of the generic travel engine.
 * The historical Chapter 4 source is preserved separately and unchanged.
 * This function is invoked only from the GM toolbar action.
 */
import { hexTravelDieFace, hexTravelD20Total } from "./HexTravelDice.js";
import { HEX_TRAVEL_ACTIVITIES, HEX_TRAVEL_NAVIGATION_SKILL } from "./HexTravelRoles.js";
import { hexNavigationDifficulty, TERRAIN_CHOICES, DANGER_CHOICES, normalizeHexDifficultyPreferences } from "./HexDifficulty.js";
import { nextClockTarget, readExpeditionClock, clockText, advanceExpeditionClock, advanceTravelClockHours, hasRestRecovery, openPartyRestRecovery } from "./ExpeditionTime.js";
import { normalizeNewDayPreferences } from "./NewTravelDayPreferences.js";
import { appendHexHours } from "./HexTravelHourHistory.js";
import { planHexTravelResume } from "./HexTravelResume.js";

const DIFFICULTY_PREF_KEY = "hexTravelDifficultyPreferences";
const CLOCK_SYNC_KEY = "hexTravelAdvanceWorldTime";
const NEW_DAY_PREF_KEY = "hexTravelNewDayPreferences";
let newDayPreferenceCache = null;
let newDayPreferenceWrites = Promise.resolve();
function getNewDayPreferences() {
  return normalizeNewDayPreferences(newDayPreferenceCache ?? game.settings.get("zft-overland-travel", NEW_DAY_PREF_KEY));
}
function rememberNewDayPreferences(raw) {
  const next = normalizeNewDayPreferences(raw);
  if (JSON.stringify(next) === JSON.stringify(getNewDayPreferences())) return newDayPreferenceWrites;
  newDayPreferenceCache = next;
  const write = newDayPreferenceWrites.catch(() => {}).then(() => game.settings.set("zft-overland-travel", NEW_DAY_PREF_KEY, next));
  newDayPreferenceWrites = write.catch(error => {
    console.warn("[ZFT][HexTravel] New Travel Day preferences could not be saved; the expedition is unaffected.", error);
    // Do not leave a permanently stale client-side cache when storage fails.
    newDayPreferenceCache = null;
  });
  return newDayPreferenceWrites;
}

// Keep the latest draft in memory until queued client-setting writes complete.
// This prevents a fast close/reopen from restoring a stale preference.
let difficultyDraftCache = null;
let difficultyDraftWrites = Promise.resolve();
function getDifficultyDraft() {
  return normalizeHexDifficultyPreferences(difficultyDraftCache ?? game.settings.get("zft-overland-travel", DIFFICULTY_PREF_KEY));
}
function rememberDifficultyDraft(raw) {
  const next = normalizeHexDifficultyPreferences(raw);
  if (JSON.stringify(next) === JSON.stringify(getDifficultyDraft())) return difficultyDraftWrites;
  difficultyDraftCache = next;
  const write = difficultyDraftWrites.catch(() => {}).then(() => game.settings.set("zft-overland-travel", DIFFICULTY_PREF_KEY, next));
  difficultyDraftWrites = write.catch(error => {
    console.warn("[ZFT][HexTravel] Difficulty preference could not be saved; current hex is unaffected.", error);
  });
  return difficultyDraftWrites;
}

export function launchHexTravel({ action: requestedAction = "menu" } = {}) {
/**
 * Hex Travel Engine — expedition navigation, hours, and Forced March
 * Foundry VTT V13 / dnd5e 5.2.x / Midi-QOL v13
 * SCRIPT MACRO. Run as GM; no extra module needed.
 *
 * Midi-QOL socket API: MidiQOL.socket().executeAsUser("rollAbility", userId, args)
 * The designated user's native Midi-integrated skill dialog opens automatically.
 * No chat request or player macro is involved. All rolls are explicitly non-fast-forwarded.
 * Requires a connected user with Owner permission or falls back to the GM.
 *
 * The GM creates a progressive public chat card before requesting skill checks.
 * At navigation/secondary checkpoints, a NEW card replaces the old one.
 * During the final travel dice animation the old progress card remains visible.
 * Only when Dice So Nice has finished and the completed card is visible do
 * we remove the preceding card, avoiding a temporary gap in the chat feed.
 * Intermediate cards have NO rolls.
 *
 * One combined Foundry Roll contains 2d4 travel dice and, on navigation
 * failure, an additional 1d4+2. All three d4s appear in the same native
 * dice result, and the card labels each die's purpose. Dice So Nice can animate
 * every die without duplicate separate chat rolls.
 * No duplicate manual game.dice3d.showForRoll calls or extra travel-roll messages.
 * This is a Chapter 4 single-hex travel aid. The secondary-PC menu excludes
 * the selected navigator and updates live when the navigator changes.
 * Secondary action effects are GM adjudicated.
 * Tracks party travel time in a world setting; the GM advances days manually.
 * 2024 extended travel: CON save at end of each hour beyond eight, DC 10 + hour past eight.
 * All CON saves are requested together; one GM panel adjudicates the party.
 * GM can edit the complete travel ledger or reset its stored state.
 * Optional GM-controlled travel-hour clock synchronization; no automatic rest or Fate/Inspiration.
 */
return (async () => {
  const launchEpoch = globalThis.ZFTHexTravelConsole?.generation?.() ?? 0;
  const launchLogEpoch = globalThis.ZFTHexTravelConsole?.logEpoch?.() ?? 0;
  const ensureCurrent = () => {
    if ((globalThis.ZFTHexTravelConsole?.generation?.() ?? 0) !== launchEpoch) {
      const error = new Error("Expedition changed while a previous travel operation was suspended.");
      error.name = "HexTravelWorkflowCanceled";
      throw error;
    }
  };
  const identity = () => globalThis.ZFTHexTravelConsole?.identity?.() ?? {name:"Overland Expedition",region:"",world:""};
  let navigationDifficulty = { mode: "custom", dc: 15, terrainId: null, regionDanger: null, baseDC: null, modifier: null, description: "" };
  let DC = navigationDifficulty.dc;
  const LOCK = "__ZFT_HEX_TRAVEL_WORKFLOW_ACTIVE__";
  const PACES = {
    fast:   { name: "Fast",   multiplier: 0.75, percent: "75%",  color: "#b7d2cf" },
    normal: { name: "Normal", multiplier: 1.00, percent: "100%", color: "#e6d4bb" },
    slow:   { name: "Slow",   multiplier: 1.50, percent: "150%", color: "#d7bee6" }
  };
  // World-scoped, GM-managed party travel state survives macro runs and Foundry restarts.
  const STATE_KEY = "hexTravelLedger"; // Migrated from the original Chapter 4 ledger without data loss.
  if (!game.settings.settings.has(`zft-overland-travel.${STATE_KEY}`)) {
    game.settings.register("zft-overland-travel", STATE_KEY, {
      name: "Hex Travel ledger", scope: "world", config: false,
      type: Object, default: { day: 1, hours: 0, pending: 0, hexes: 0 }
    });
  }
  const loadState = () => {
    const value = game.settings.get("zft-overland-travel", STATE_KEY) ?? {};
    return {
      day: Math.max(1, Number(value.day) || 1),
      hours: Math.max(0, Number(value.hours) || 0),
      pending: Math.max(0, Number(value.pending) || 0),
      // dev.41 stored the stable hex-card ID, but omitted it from this
      // hydration path. Losing it on Start/Continue or New Travel Day caused
      // subsequent Forced March checks to be archived as unlinked history.
      // Keep an absent/invalid ID absent rather than inferring one from time.
      activeHexCardId: typeof value.activeHexCardId === "string" && value.activeHexCardId.length
        ? value.activeHexCardId : null,
      hourResolved: Array.isArray(value.hourResolved) ? value.hourResolved : [],
      hourRolls: value.hourRolls && typeof value.hourRolls === "object" ? value.hourRolls : {},
      hourDecisions: value.hourDecisions && typeof value.hourDecisions === "object" ? value.hourDecisions : {},
      hourOutcomes: value.hourOutcomes && typeof value.hourOutcomes === "object" ? value.hourOutcomes : {},
      hourRerolls: value.hourRerolls && typeof value.hourRerolls === "object" ? value.hourRerolls : {},
      hourRerollPending: Array.isArray(value.hourRerollPending) ? value.hourRerollPending : [],
      marchHistory: Array.isArray(value.marchHistory) ? value.marchHistory : [],
      hexHourSegments: Array.isArray(value.hexHourSegments) ? value.hexHourSegments : [],
      clockSyncPending: value.clockSyncPending && typeof value.clockSyncPending === "object" ? value.clockSyncPending : null,
      hexes: Math.max(0, Number(value.hexes) || 0)
    };
  };
  const saveState = async state => { ensureCurrent(); return game.settings.set("zft-overland-travel", STATE_KEY, state); };
  // Both the travel ledger and Foundry clock are independently persisted. A
  // durable pending checkpoint prevents replaying an already-issued time jump
  // following refresh, failed settings writes, or a suspended workflow.
  const clockSyncEnabled = () => Boolean(game.settings.get("zft-overland-travel", CLOCK_SYNC_KEY));
  let clockSettingWrite = Promise.resolve();
  const clockPending = state => Boolean(state.clockSyncPending);
  const commitTravelHours = async (state, count) => {
    ensureCurrent();
    if (clockPending(state)) throw new Error("An earlier travel clock update needs GM reconciliation before more travel hours can be recorded.");
    if (!clockSyncEnabled() || count <= 0) { await saveState(state); return; }
    const before = Number(game.time?.worldTime);
    if (!Number.isFinite(before)) throw new Error("Foundry world time is unavailable; no new travel hours were saved.");
    state.clockSyncPending = { before, seconds: count * 3600, day: state.day, travelHour: state.hours };
    await saveState(state); // Ledger hours AND pending transaction are checkpointed together.
    try {
      await advanceTravelClockHours(count);
      ensureCurrent();
      state.clockSyncPending = null;
      await saveState(state);
      console.info(`[ZFT][HexTravel] ✅ Advanced world time ${count} travel hour(s), Day ${state.day}, hour ${state.hours}.`);
    } catch (error) {
      // Do not replay a jump speculatively. A subsequent invocation offers
      // explicit reconciliation. Actor rulings and travel hours stay saved.
      console.error("[ZFT][HexTravel] ❌ Clock update needs reconciliation; travel hours are saved.", error);
      throw new Error(`Travel hours saved, but world-clock synchronization needs GM review: ${error.message}`);
    }
  };
  const reconcileTravelClock = async state => {
    const pending = state.clockSyncPending;
    if (!pending) return true;
    const current = Number(game.time?.worldTime);
    const before = Number(pending.before);
    const seconds = Number(pending.seconds);
    if (!Number.isFinite(current) || !Number.isFinite(before) || !Number.isSafeInteger(seconds) || seconds <= 0)
      return warn("Hex Travel clock checkpoint is invalid. Inspect the saved ledger before resuming."), false;
    const elapsed = Math.round((current - before)/60)/60;
    const action = await promptWait({
      window: { title: "Reconcile Hex Travel Clock" },
      position: { width: 470 }, render: colorButtons,
      content: `<section class="zft-hex-clock-reconcile"><strong>Unfinished world-clock update</strong><p>The ledger already recorded ${esc(seconds/3600)} travel hour(s) on Day ${esc(pending.day)}. The requested clock jump may have completed before the previous session stopped.</p><p>World time moved approximately <strong>${esc(elapsed)}h</strong> since the checkpoint. Review the clock before choosing; no automatic replay will occur.</p></section>`,
      buttons: [
        { action: "save", label: "Clock Already Accounted For", callback: () => "accounted" },
        { action: "retry", label: "Advance Missing Hours", callback: () => "retry" },
        { action: "cancel", label: "Cancel", callback: () => null }
      ], close: () => null
    });
    if (!action) return false;
    // Another GM may have reconciled while this dialog was open.
    const latest = loadState().clockSyncPending;
    if (!latest || latest.before !== pending.before || latest.seconds !== pending.seconds || latest.day !== pending.day || latest.travelHour !== pending.travelHour)
      return warn("The saved clock checkpoint changed while this dialog was open. Reopen Hex Travel to review the current state."), false;
    if (action === "retry") {
      // Re-read world time after the dialog. If any other operation moved it,
      // even while the GM was deciding, refuse to speculate or double-advance.
      const now = Number(game.time?.worldTime);
      if (!Number.isFinite(now) || Math.abs(now - before) > 1) return warn("World time has changed since the saved checkpoint. Check the clock and choose 'Clock Already Accounted For' after adjusting it manually."), false;
      try { await advanceTravelClockHours(seconds/3600); }
      catch (error) { return warn(`Clock update failed: ${error.message}`), false; }
    }
    state.clockSyncPending = null;
    await saveState(state);
    return true;
  };
  const ACTIONS = HEX_TRAVEL_ACTIVITIES;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const warn = text => ui.notifications.warn(text);
  const Dialog = foundry.applications.api.DialogV2;
  // Render all GM workflow decisions inline beneath the fixed expedition dashboard.
  const promptWait = options => globalThis.ZFTHexTravelConsole?.prompt?.(options) ?? Dialog.wait(options);
  // Single, consistent semantic palette for Foundry dialogs.
  const UI = {
    blue: "#92B9D2", green: "#88C7B1", amber: "#DFB978",
    red: "#DF8E91", purple: "#B8A0D5", muted: "#BFC9D2",
    panel: "#242C37", border: "#56677A"
  };
  const tint = (value, color, label = "") => `<strong style="color:${color};">${esc(value)}</strong>${label}`;
  const stat = (label, value, color) => `<div style="padding:7px 9px;background:#2D3948;border:1px solid ${color};border-radius:5px;text-align:center;flex:1;min-width:90px;">` +
    `<div style="font-size:10px;color:${UI.muted};letter-spacing:.5px;">${esc(label)}</div><div style="font-size:19px;font-weight:700;color:${color};">${esc(value)}</div></div>`;
  // Highlight footer actions without changing DialogV2 behavior or callbacks.
  function colorButtons(_event, dialog) {
    const shades = { travel: UI.green, continue: UI.green, confirm: UI.green, apply: UI.green,
      save: UI.green, day: UI.blue, manage: UI.blue, retry: UI.purple, gm: UI.blue,
      store: UI.amber, pause: UI.amber, reset: UI.red, cancel: UI.muted, start: UI.green };
    for (const button of dialog.element.querySelectorAll('button[data-action]')) {
      const color = shades[button.dataset.action];
      if (!color) continue;
      button.style.border = `1px solid ${color}`;
      button.style.color = color;
      button.style.fontWeight = "600";
    }
  }


  if (!game.user.isGM) return warn("Overland Travel must be started by a GM.");
  if (game.system.id !== "dnd5e") return warn("Overland Travel requires the D&D 5e system.");
  const midiModule = game.modules.get("midi-qol");
  if (!midiModule?.active || typeof globalThis.MidiQOL?.socket !== "function") {
    return warn("This macro requires active Midi-QOL with its socket API.");
  }
  const midiSocket = MidiQOL.socket();
  if (typeof midiSocket?.executeAsUser !== "function") {
    return warn("Midi-QOL's remote roll socket API is unavailable. No travel was started.");
  }
  // A reset invalidates the old generation, allowing a fresh workflow even
  // while a suspended legacy dialog remains open. Its callbacks cannot write.
  const locked = globalThis[LOCK];
  if (locked === true || locked?.generation === launchEpoch) return warn("An expedition travel roll is already in progress on this GM client.");

  // Main campaign roster is still discovered from Player Configuration, including
  // offline players. Optional, GM-saved attendance excludes only absent PCs.
  // It does not change Foundry User -> Character assignments.
  const roster = new Map();
  for (const user of game.users.players) {
    const actor = user.character;
    if (!actor || actor.type !== "character") continue;
    if (!roster.has(actor.uuid)) roster.set(actor.uuid, { actor, assignments: [] });
    roster.get(actor.uuid).assignments.push(user);
  }
  const attendance = game.settings.get("zft-overland-travel", "hexTravelAttendance");
  const excluded = new Set(attendance?.excludedActorUuids ?? []);
  const actors = [...roster.values()].map(entry => entry.actor).filter(actor => !excluded.has(actor.uuid));
  if (!actors.length) return warn("No present PCs selected. Open Party Attendance in the Expedition Console.");

  // The floating console owns presentation. No custom ChatMessage output.
  // Keep status updates serialized so older result snapshots cannot race ahead.
  let statusQueue = Promise.resolve();
  function publishStatus(state, phase, detail="") {
    // Serialize concurrent save completions so an older card cannot win the race.
    statusQueue = statusQueue.catch(e => console.warn("Hex Travel | Prior status update failed",e))
      .then(async () => {
        // Console is the sole custom status destination. Preserve native Midi
        // chat roll messages, but never generate expedition status chat cards.
        ensureCurrent();
        await globalThis.ZFTHexTravelConsole?.publish?.(state, phase, detail);
      });
    return statusQueue;
  }
  // A single GM uses this tool. All keys are in the existing world setting.
  let travelState = loadState();
  async function manageLedger(state) {
    const result = requestedAction === "reset" ? { mode: "reset" } : await promptWait({
      window: { title: `${identity().name} | Manage Saved Travel` },
      render: colorButtons,
      position: { width: 465 },
      content: `<div style="display:grid;gap:9px;padding:10px;background:#232b32;color:#eeeaf1;">
        <strong><span style="color:${UI.blue};">Edit saved expedition state</span></strong>
        <label>Expedition day <input type="number" name="day" min="1" step="1" value="${state.day}"></label>
        <label>Hours completed today <input type="number" name="hours" min="0" step="1" value="${state.hours}"></label>
        <label>Hours remaining in current hex <input type="number" name="pending" min="0" step="1" value="${state.pending}"></label>
        <label>Hexes completed <input type="number" name="hexes" min="0" step="1" value="${state.hexes}"></label>
        <small>Editing clears an in-progress hour's roll checkpoints. If any Exhaustion has already been applied, review character sheets separately. Reset clears all macro travel data but does not remove Exhaustion or restore Fate Coins/Inspiration.</small>
      </div>`,
      buttons: [
        { action: "save", label: "Save Corrections", default: true, callback: (_event, button) => {
          const f = button.form.elements;
          const read = (name, min) => { const v = Number(f[name].value); return Number.isSafeInteger(v) && v >= min ? v : null; };
          return { mode: "save", day: read("day", 1), hours: read("hours", 0), pending: read("pending", 0), hexes: read("hexes", 0) };
        } },
        { action: "reset", label: "Reset All Travel Data", callback: () => ({ mode: "reset" }) },
        { action: "cancel", label: "Cancel", callback: () => null }
      ], close: () => null
    });
    if (!result) return;
    if (result.mode === "save") {
      if ([result.day, result.hours, result.pending, result.hexes].some(v => v === null)) {
        return warn("Enter valid whole numbers. Day must be at least 1; all other values must be zero or greater.");
      }
      await saveState({ day: result.day, hours: result.hours, pending: result.pending, hexes: result.hexes, hexHourSegments: state.hexHourSegments, hourResolved: [], hourRolls: {}, hourDecisions: {}, hourOutcomes: {}, hourRerolls: {}, marchHistory: [] });
      await publishStatus(loadState(), "Ledger corrected", "GM manually updated the travel ledger.");
      ui.notifications.info("Overland Travel ledger corrected. Run macro again to continue.");
      return;
    }
    const confirmation = await promptWait({
      window: { title: `${identity().name} | Confirm Full Reset` },
      position: { width: 480 },
      render: colorButtons,
      content: `<div class="zft-hex-reset-confirm"><h3><i class="fa-solid fa-triangle-exclamation"></i> Permanent Expedition Reset</h3><p><strong style="color:${UI.red};">Erase the complete saved Overland Travel ledger?</strong></p><p>This resets Day to 1, hours to 0, unfinished hex to 0, completed hexes to 0, and clears all stored hourly rolls, completed forced-march history, pending decisions, and resolution checkpoints. <strong>This cannot be undone.</strong> It does not change character Exhaustion.</p><label>Type <strong style="color:${UI.amber};">RESET</strong> to confirm:<input name="confirmation" type="text" autocomplete="off"></label></div>`,
      buttons: [
        { action: "reset", label: "Permanently Reset", callback: (_event, button) => button.form.elements.confirmation.value.trim() },
        { action: "cancel", label: "Cancel", default: true, callback: () => null }
      ], close: () => null
    });
    if (confirmation !== "RESET") return warn("Full travel reset canceled. No data changed.");
    await saveState({ day: 1, hours: 0, pending: 0, hexes: 0, hourResolved: [], hourRolls: {}, hourDecisions: {}, hourOutcomes: {}, hourRerolls: {}, marchHistory: [] });
    await publishStatus(loadState(), "Travel reset", "Expedition travel statistics were reset by the GM.");
    ui.notifications.info("Overland Travel statistics fully reset to Day 1.");
  }
  // The GM Console exposes these top-level actions. Keep the familiar daily
  // ledger dialog available for legacy/script callers using action="menu".
  let travelMenu = ["travel", "day", "manage", "reset"].includes(requestedAction) ? requestedAction : await promptWait({
    window: { title: `${identity().name} | Daily Travel Ledger` },
    render: colorButtons,
    position: { width: 470 },
    content: `<div style="display:grid;gap:7px;padding:10px;background:#232b32;color:#eeeaf1;">
      <div style="display:flex;gap:7px;flex-wrap:wrap;">${stat("TRAVEL DAY", travelState.day, UI.blue)}${stat("HOURS TODAY", `${travelState.hours} / 8`, travelState.hours > 8 ? UI.amber : UI.green)}${stat("UNFINISHED HEX", `${travelState.pending} h`, travelState.pending ? UI.amber : UI.green)}</div>
      <div>Completed hexes: ${tint(travelState.hexes, UI.blue)}</div>
      <small>Manage Saved Travel allows corrections or a complete reset. Start New Travel Day resets today’s hours without removing unfinished hex travel.</small>
    </div>`,
    buttons: [
      { action: "travel", label: travelState.pending ? "Resume Unfinished Hex" : "Travel New Hex", default: true, callback: () => "travel" },
      { action: "day", label: "Start New Travel Day", callback: () => "day" },
      { action: "manage", label: "Manage / Reset", callback: () => "manage" },
      { action: "cancel", label: "Cancel", callback: () => null }
    ], close: () => null
  });
  if (!travelMenu) return;
  // Resolve an interrupted clock transaction before any further time-changing
  // operation, including manual ledger correction. An explicit full Reset
  // remains available as the existing destructive recovery path.
  if (travelMenu !== "reset" && !(await reconcileTravelClock(travelState))) return;
  if (travelMenu === "manage" || travelMenu === "reset") { await manageLedger(travelState); return; }
  if (travelMenu === "day") {
    if (travelState.hourResolved.length || Object.keys(travelState.hourRolls).length) {
      return warn("Resolve or reset the in-progress CON saves before starting the next day.");
    }
    // The expedition day and Foundry clock remain separate decisions. Idle time
    // to bedtime is moved before Rest Recovery is opened; ZFT never simulates
    // the duration of a Long Rest or applies healing/exhaustion itself.
    const restAvailable = hasRestRecovery();
    const currentClock = readExpeditionClock();
    const dayPreferences = getNewDayPreferences();
    const dayTarget = (dayPreferences.timeTarget === "sunrise" && currentClock.sunrise == null) || (dayPreferences.timeTarget === "sunset" && currentClock.sunset == null)
      ? "none" : dayPreferences.timeTarget;
    let captureNewDayPreferences = () => {};
    const hourOptions = Array.from({ length: 12 }, (_, i) => `<option value="${i+1}" ${dayPreferences.bedHour === i+1 ? "selected" : ""}>${i+1}</option>`).join("");
    const minuteOptions = Array.from({ length: 12 }, (_, i) => `<option value="${i*5}" ${dayPreferences.bedMinute === i*5 ? "selected" : ""}>${String(i*5).padStart(2,"0")}</option>`).join("");
    const newDayConfirmed = await promptWait({
      toggleKey: "day",
      window: { title: "Start New Travel Day" },
      render: (_event, dialog) => {
        colorButtons(_event, dialog);
        const form = dialog.element.querySelector(".zft-hex-new-day-form");
        if (!form) return;
        const target = form.querySelector('[name="timeTarget"]');
        const custom = form.querySelector('[data-hex-bedtime-custom]');
        const preview = form.querySelector('[data-hex-time-preview]');
        captureNewDayPreferences = () => {
          const f = form.elements;
          void rememberNewDayPreferences({
            timeTarget: f.timeTarget.value,
            bedHour: f.bedHour.value, bedMinute: f.bedMinute.value, bedPeriod: f.bedPeriod.value,
            // An unavailable optional integration must not erase the prior GM selection.
            openRest: restAvailable ? f.openRest.checked : dayPreferences.openRest
          });
        };
        const refresh = () => {
          custom.hidden = target.value !== "custom";
          if (target.value === "none") {
            preview.textContent = "World clock remains unchanged.";
            preview.classList.remove("has-next-day");
            return;
          }
          try {
            const fields = form.elements;
            const result = nextClockTarget(target.value, {
              ...readExpeditionClock(), hour: fields.bedHour.value,
              minute: fields.bedMinute.value, ampm: fields.bedPeriod.value
            });
            const parts = [];
            const hours = Math.floor(result.seconds / 3600);
            const minutes = Math.round((result.seconds % 3600)/60);
            if (hours) parts.push(`${hours}h`);
            if (minutes) parts.push(`${minutes}m`);
            preview.replaceChildren(document.createTextNode(`Advance ${parts.join(" ") || "0m"} to ${clockText(result.targetHour)}.`));
            preview.classList.toggle("has-next-day", !!result.nextDay);
            if (result.nextDay) {
              const note = document.createElement("span");
              note.className = "zft-hex-day-next-calendar";
              note.textContent = "(next calendar day)";
              preview.append(note);
            }
          } catch (error) { preview.textContent = error.message; }
        };
        form.querySelectorAll('[name="timeTarget"], [name="bedHour"], [name="bedMinute"], [name="bedPeriod"], [name="openRest"]').forEach(field => {
          field.addEventListener("change", () => { refresh(); captureNewDayPreferences(); });
        });
        refresh();
      },
      position: { width: 455 },
      content: `<section class="zft-hex-day-setup">` +
        `<div class="zft-hex-day-transition">` +
          `<div class="zft-hex-day-stat"><small>CURRENT DAY</small><strong>${travelState.day}</strong></div>` +
          `<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>` +
          `<div class="zft-hex-day-stat next"><small>NEXT DAY</small><strong>${travelState.day+1}</strong></div>` +
        `</div>` +
        `<div class="zft-hex-day-summary">` +
          `<div class="zft-hex-day-hours-reset"><small>DAILY TRAVEL HOURS RESET</small><strong><span>${travelState.hours}h used on Day ${travelState.day}</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i><span class="zft-hex-day-hours-new">0h on Day ${travelState.day+1}</span></strong><small>Only today's travel counter resets. Past hours remain recorded.</small></div>` +
          `<div class="zft-hex-day-hex-carry"><small>UNFINISHED HEX</small><strong>${travelState.pending > 0 ? `${travelState.pending}h remaining` : "None"}</strong><small>${travelState.pending > 0 ? "This hex continues on the next travel day." : "No unfinished hex to carry forward."}</small></div>` +
        `</div>` +
        `<div class="zft-hex-day-time">` +
          `<label for="zft-hex-bedtime-target"><i class="fa-solid fa-clock" aria-hidden="true"></i> Advance world time before resting</label>` +
          `<small>Current time: ${Number.isInteger(currentClock.currentHour) ? esc(clockText(currentClock.currentHour + (currentClock.currentMinute||0)/60)) : "Unavailable"}</small>` +
          `<select id="zft-hex-bedtime-target" name="timeTarget">` +
            `<option value="none" ${dayTarget === "none" ? "selected" : ""}>Do not advance world time</option>` +
            `<option value="sunrise" ${currentClock.sunrise == null ? "disabled" : ""} ${dayTarget === "sunrise" ? "selected" : ""}>Next sunrise</option>` +
            `<option value="midday" ${dayTarget === "midday" ? "selected" : ""}>Next midday</option>` +
            `<option value="sunset" ${currentClock.sunset == null ? "disabled" : ""} ${dayTarget === "sunset" ? "selected" : ""}>Next sunset</option>` +
            `<option value="midnight" ${dayTarget === "midnight" ? "selected" : ""}>Next midnight</option>` +
            `<option value="custom" ${dayTarget === "custom" ? "selected" : ""}>Custom bedtime</option>` +
          `</select>` +
          `<div class="zft-hex-day-custom" data-hex-bedtime-custom hidden>` +
            `<label>Hour <select name="bedHour">${hourOptions}</select></label>` +
            `<label>Minute <select name="bedMinute">${minuteOptions}</select></label>` +
            `<label>Period <select name="bedPeriod"><option value="AM" ${dayPreferences.bedPeriod === "AM" ? "selected" : ""}>AM</option><option value="PM" ${dayPreferences.bedPeriod === "PM" ? "selected" : ""}>PM</option></select></label>` +
          `</div>` +
          `<small data-hex-time-preview>World clock remains unchanged.</small>` +
        `</div>` +
        `<div class="zft-hex-day-rest">` +
          `<input id="zft-hex-new-day-rest" type="checkbox" name="openRest" ${restAvailable ? (dayPreferences.openRest ? "checked" : "") : "disabled"}>` +
          `<label for="zft-hex-new-day-rest" class="zft-hex-day-rest-copy"><strong>Open Rest Recovery for a Long Rest</strong>` +
          `<small>${restAvailable ? "After the time jump, choose Long Rest and party members in Rest Recovery." : "Optional Rest Recovery 5e module is not active."}</small></label></div>` +
        `<small class="zft-hex-day-note">Rest Recovery handles recovery and any rest duration; ZFT never adds another 8 hours.</small>` +
      `</section>`,
      buttons: [
        { action: "day", label: `Begin Day ${travelState.day+1}`, default: true, callback: (_event, button) => {
          const f = button.form.elements;
          const choice = f.timeTarget.value;
          // Validate before any persistent state or world-clock change.
          nextClockTarget(choice, { ...readExpeditionClock(), hour: f.bedHour.value, minute: f.bedMinute.value, ampm: f.bedPeriod.value });
          if (f.openRest.checked && !hasRestRecovery()) throw new Error("Rest Recovery is not active.");
          captureNewDayPreferences();
          return { choice, hour: f.bedHour.value, minute: f.bedMinute.value, ampm: f.bedPeriod.value, openRest: f.openRest.checked };
        } },
        { action: "cancel", label: "Cancel", callback: () => { captureNewDayPreferences(); return null; } }
      ], close: () => { captureNewDayPreferences(); return null; }
    });
    await newDayPreferenceWrites;
    if (!newDayConfirmed) return; // Silent cancellation: neither clock nor ledger changes.
    // Preserve the existing day's date before ZFT optionally advances to bedtime.
    // This is essential even when the day contained no completed hex.
    await globalThis.ZFTHexTravelConsole?.preserveDayDate?.(travelState.day);
    try {
      await advanceExpeditionClock(newDayConfirmed.choice, {
        hour: newDayConfirmed.hour, minute: newDayConfirmed.minute, ampm: newDayConfirmed.ampm
      });
    } catch (error) {
      console.error("[ZFT][HexTravel] New travel day time advance failed; ledger unchanged.", error);
      ui.notifications.error(`New Travel Day: ${error.message}`);
      return;
    }
    // The old day and in-progress hex remain in the ledger. Foundry time may
    // have changed, but Rest Recovery may still need to advance through sleep.
    travelState = { ...travelState, day: travelState.day + 1, hours: 0, hourResolved: [], hourRolls: {}, hourDecisions: {}, hourOutcomes: {} };
    await saveState(travelState);
    await publishStatus(travelState, newDayConfirmed.openRest ? "New travel day awaiting rest" : "New travel day",
      newDayConfirmed.openRest ? "Daily hours reset. Rest Recovery is handling the Long Rest." : "Daily travel hours reset; unfinished hex preserved.");
    if (newDayConfirmed.openRest) {
      try {
        await openPartyRestRecovery();
        ui.notifications.info(`Overland Travel: Day ${travelState.day} started. Complete the Long Rest in Rest Recovery.`);
      } catch (error) {
        console.error("[ZFT][HexTravel] Rest Recovery could not open; travel day preserved.", error);
        ui.notifications.error(`Day ${travelState.day} started, but Rest Recovery could not open: ${error.message}`);
      }
      return; // Do not open a new Guide-roll form over Rest Recovery.
    }
    ui.notifications.info(`Overland Travel: Day ${travelState.day} started. Continue traveling in this session.`);
    travelMenu = "travel";
  }
  const resuming = travelState.pending > 0;
  const isOwner = (actor, user) => user.isGM || actor.testUserPermission(user, "OWNER");
  const eligiblePlayers = actor => game.users.players.filter(user => user.active && isOwner(actor, user));
  const resolveRoller = (actor, choice) => {
    if (choice === "gm") return game.user;
    if (choice !== "auto") {
      const user = game.users.get(choice);
      return user?.active && isOwner(actor, user) ? user : null;
    }
    const assigned = roster.get(actor.uuid)?.assignments ?? [];
    return assigned.find(user => user.active && isOwner(actor, user))
      ?? eligiblePlayers(actor)[0]
      ?? game.user;
  };
  const rollerOptions = actor => `<option value="auto">Auto: assigned player, then Owner, then GM</option>`
    + `<option value="gm">GM (me)</option>`
    + eligiblePlayers(actor).map(u => `<option value="${esc(u.id)}">${esc(u.name)}</option>`).join("");

  // Expedition roles are assigned exclusively through GM Expedition Roles.
  // The existing guide's Survival roll continues to determine hex duration.
  const rolePrefs = globalThis.ZFTHexTravelConsole?.rolePreferences?.() ?? {};
  const assignments = rolePrefs.assignments ?? {};
  const guideUuid = assignments.guide || rolePrefs.navigatorUuid || "";
  const guideActor = actors.find(actor => actor.uuid === guideUuid);
  if (!resuming && !guideActor)
    return warn("Assign a present Guide in Expedition Roles before starting travel.");
  const expeditionGroups = [
    ["Navigation", [["Guide", "guide", "Survival (WIS)"], ["Tracker", "tracker", "Investigation (INT)"]]],
    ["Reconnaissance", [["Scout", "scout", "Stealth (DEX)"], ["Vanguard", "vanguard", "Athletics (STR)"]]],
    ["Expedition Support", [["Forager", "forager", "Survival (WIS)"], ["Coordinator", "coordinator", "Persuasion (CHA)"]]]
  ];
  // One theme-aware, gently raised surface per paired activity. Portraits
  // identify the actual assigned PC; only the Guide is currently rolled.
  const groupIcon = {Navigation:"fa-compass", Reconnaissance:"fa-eye", "Expedition Support":"fa-people-group"};
  const expeditionSummary = expeditionGroups.map(([heading, roles]) =>
    `<section class="zft-hex-travel-role-group" aria-label="${esc(heading)} roles">` +
    `<h4><i class="fa-solid ${groupIcon[heading]}" aria-hidden="true"></i> ${esc(heading)}</h4>` +
    roles.map(([label,key,skill]) => {
      const actor = actors.find(a => a.uuid === (assignments[key] || (key === "guide" ? guideUuid : "")));
      const portrait = actor?.img ? `<img class="zft-hex-travel-role-portrait" src="${esc(actor.img)}" alt="" loading="lazy">`
        : `<span class="zft-hex-travel-role-portrait zft-hex-travel-role-empty"><i class="fa-solid fa-user" aria-hidden="true"></i></span>`;
      return `<div class="zft-hex-travel-role-line${key === "guide" ? " is-guide" : ""}">` +
        `${portrait}<div class="zft-hex-travel-role-identity"><span class="zft-hex-travel-role-label">${esc(label)}${key === "guide" ? ' <i class="fa-solid fa-dice-d20" title="Active Navigation roll" aria-label="Active Navigation roll"></i>' : ""}</span>` +
        `<strong>${actor ? esc(actor.name) : "Unassigned"}</strong></div><small>${esc(skill)}</small></div>`;
    }).join("") + `</section>`
  ).join("");

  // Persist the complete untraveled segment before any hour is processed.
  // Checkpoint each adjudicated PC to avoid repeated Exhaustion on rerun.
  async function reportLedger(state, label) {
    await publishStatus(state, state.pending ? "Travel in progress" : "Hex completed", label);
  }

  // A player reconnecting may leave socketlib's first executeAsUser promise
  // unresolved indefinitely. The GM must be able to explicitly supersede it
  // without canceling the hex or rolling travel time again. No automatic retry:
  // a previous prompt might still resolve on the reconnecting client.
  async function recoverableRemoteRoll(actor, initialRoller, makeArgs, label, keySuffix) {
    let roller = initialRoller;
    let attempt = 0;
    const key = `${keySuffix}:${actor.uuid}`;
    while (true) {
      ensureCurrent();
      attempt += 1;
      let resolveChoice;
      const choice = new Promise(resolve => { resolveChoice = resolve; });
      const recoveryToken = globalThis.ZFTHexTravelConsole?.registerPendingRoll?.({
        key, actorName: actor.name, label, rollerId: roller.id,
        rollerName: roller.name, attempt, choose: resolveChoice
      });
      // Both fulfillment and rejection are handled for abandoned promises.
      // Never apply the result from an attempt superseded by the GM.
      // Capture only the awaited actor's native roll message on this GM client;
      // Midi versions that omit message IDs can still expose one via the hook.
      let observedMessageId = null;
      const rollHook = typeof Hooks?.on === "function" ? Hooks.on("createChatMessage", message => {
        const author = message?.author?.id;
        if (message?.isRoll && message?.speaker?.actor === actor.id && author === roller.id)
          observedMessageId = message.id;
      }) : null;
      const remote = Promise.resolve().then(() => {
        ensureCurrent();
        return midiSocket.executeAsUser("rollAbility", roller.id, makeArgs());
      }).then(value => ({ type: "result", value }), error => ({ type: "error", error }));
      let result;
      try { result = await Promise.race([remote, choice]); }
      finally {
        if (rollHook !== null) Hooks.off("createChatMessage", rollHook);
        globalThis.ZFTHexTravelConsole?.unregisterPendingRoll?.(key, recoveryToken);
      }
      ensureCurrent();
      if (result?.type === "resend") continue;
      if (result?.type === "gm") { roller = game.user; continue; }
      if (result?.type === "cancel") return { cancelled: true };
      if (result?.type === "error") return { error: result.error };
      return { value: result?.value, roller, observedMessageId };
    }
  }

  async function conSave(actor, dc) {
    const modern = foundry.utils.isNewerVersion(midiModule.version, "13.0.43");
    const args = modern ? {
      saveDetails: {
        actorUuid: actor.uuid, rollType: "save", rollAbilities: ["con"],
        rollSkills: [], rollTools: [], advantage: false, disadvantage: false,
        isMagicSave: false, isFriendly: true, rollDC: dc,
        saveItemUuid: "", workflowOptions: {}, workflowId: "", itemCardUuid: "", itemId: ""
      },
      displayOptions: { fastForward: false, chatMessage: true,
        rollMode: "publicroll", showTargetDC: true }
    } : {
      targetUuid: actor.uuid, request: "save", ability: "con", rollDC: dc,
      advantage: false, disadvantage: false,
      options: { fastForward: false, chatMessage: true, rollMode: "publicroll" }
    };
    try {
      const roller = resolveRoller(actor, "auto");
      const request = await recoverableRemoteRoll(actor, roller, () => args,
        `CON saving throw · DC ${dc}`, `con:${travelState.day}:${travelState.hours + 1}`);
      if (request.cancelled) return null;
      if (request.error) throw request.error;
      await waitForNativeRollPresentation(request.value, request.observedMessageId);
      return totalFromRemote(request.value);
    } catch (error) {
      if (error?.name === "HexTravelWorkflowCanceled") throw error;
      console.error("Hex Travel | CON save request failed", error);
      return null;
    }
  }

  // All players roll at once; one GM dialog reviews and resolves the whole party.
  // Roll results survive a pause; the GM can reroll individual actors without
  // requesting fresh rolls from everyone. Exhaustion updates are checkpointed.
  async function forcedHour(state) {
    const hour = state.hours + 1;
    const dc = 10 + hour - 8;
    let resolved = new Set(state.hourResolved ?? []);
    state.hourRolls ??= {};
    state.hourDecisions ??= {};
    state.hourOutcomes ??= {};
    state.hourRerolls ??= {};
    state.hourRerollPending ??= [];
    // A persisted in-flight reroll cannot still be running after a GM has
    // resumed this workflow. Keep the previous result, allow a fresh request.
    if (state.hourRerollPending.length) {
      state.hourRerollPending = [];
      await saveState(state);
      await publishStatus(state, "GM review", "Interrupted reroll. GM may request the reroll again.");
    }
    const pendingActors = actors.filter(actor => !resolved.has(actor.uuid));
    const missingRolls = pendingActors.filter(actor => !Number.isFinite(state.hourRolls[actor.uuid]));
    if (missingRolls.length) {
      await publishStatus(state, "Saving throws", `Hour ${hour}: waiting for party Constitution saves.`);
      // Serialize completed results in the existing ledger; a stalled or
      // canceled player's roll never overwrites a previously accepted result.
      let checkpoint = Promise.resolve();
      await Promise.all(missingRolls.map(async actor => {
        const total = await conSave(actor, dc);
        if (!Number.isFinite(total)) return;
        checkpoint = checkpoint.then(async () => {
          state.hourRolls[actor.uuid] = total;
          await saveState(state);
          await publishStatus(state, "Saving throws", `${actor.name} submitted a Constitution save.`);
        });
        await checkpoint;
      }));
    }
    while (resolved.size < actors.length) {
      const unresolved = actors.filter(a => !resolved.has(a.uuid));
      const options = unresolved.map(a => `<option value="${esc(a.uuid)}">${esc(a.name)}</option>`).join("");
      const rows = actors.map(actor => {
        const id = actor.uuid;
        const done = resolved.has(id);
        const total = state.hourRolls[id];
        const hasRoll = Number.isFinite(total);
        const failed = hasRoll && total < dc;
        const oldEx = Number(foundry.utils.getProperty(actor, "system.attributes.exhaustion")) || 0;
        const verdict = done ? "Resolved" : hasRoll ? (failed ? "Failed" : "Passed") : "No result";
        // Default only NEW unresolved rulings. Preserve deliberate GM choices
        // saved before a pause or another character's reroll.
        const selected = !done && ["choose", "accept", "exhaust"].includes(state.hourDecisions[id])
          ? state.hourDecisions[id] : !hasRoll ? "choose" : failed ? "exhaust" : "accept";
        const choices = hasRoll ? [
          ["choose", "Choose action"], ["accept", failed ? "Accept / waive Exhaustion" : "Accept success"],
          ["exhaust", "Apply +1 Exhaustion"], ["reroll", "Reroll CON"]
        ] : [["choose", "No result · choose a response"], ["reroll", "Request CON roll"]];
        const decision = done ? `<span class="zft-hex-gm-saved">Saved</span>` :
          `<select name="decision-${esc(id)}" aria-label="GM ruling for ${esc(actor.name)}" data-hex-gm-ruling-select>${choices.map(([v, label]) =>
            `<option value="${v}" class="zft-hex-ruling-option-${v === "exhaust" ? "exhaust" : v === "accept" ? "accept" : "neutral"}" ${v === selected ? "selected" : ""}>${label}</option>`).join("")}</select>`;
        const verdictClass = !hasRoll ? "pending" : failed ? "failed" : "passed";
        const rulingClass = selected === "exhaust" ? "ruling-exhaust" : selected === "accept" ? "ruling-accept" : "ruling-neutral";
        const projected = !done && selected === "exhaust" ? Math.min(6,oldEx+1) : oldEx;
        return `<div class="zft-hex-gm-ruling-row ${rulingClass}" data-hex-current-exhaustion="${oldEx}" data-hex-ruling-row>` +
          `<div class="zft-hex-gm-ruling-identity"><strong class="zft-hex-gm-ruling-name ${verdictClass}">${esc(actor.name)}</strong>` +
          `<span class="zft-hex-gm-ruling-roll ${verdictClass}">${hasRoll ? total : "—"} · ${verdict}</span></div>` +
          `<div class="zft-hex-gm-ruling-exhaustion ${projected > 0 ? "has-exhaustion" : ""}"><small>Exhaustion</small><strong data-hex-projected-exhaustion>${oldEx}${!done && selected === "exhaust" ? ` → ${Math.min(6,oldEx+1)}` : ""}</strong></div>` +
          `<div class="zft-hex-gm-ruling-choice">${decision}</div></div>`;
      }).join("");
      await publishStatus(state, "GM review", `Hour ${hour}: waiting for GM rulings.`);
      const answer = await promptWait({
        window: { title: `${identity().name} | Day ${state.day} · Hour ${hour} · Party CON DC ${dc}` },
        render: colorButtons,
        position: { width: 760 },
        content: `<section class="zft-hex-march-review">
          <div class="zft-hex-march-review-heading"><strong>Forced March · Hour ${hour}</strong><span>Day ${state.day} · CON DC ${dc} · ${actors.length} saves</span></div>
          <p class="zft-hex-march-review-note">Review each character's save and choose a GM ruling. Rerolls retain other decisions.</p>
          <div class="zft-hex-gm-ruling-head" aria-hidden="true"><span>Character / Save</span><span>Exhaustion</span><span>GM Ruling</span></div>
          <div class="zft-hex-gm-ruling-list" aria-label="Party Constitution save rulings">${rows}</div>
          <small class="zft-hex-march-review-footnote" title="Fate Coins and Inspiration are managed manually. Exhaustion updates the actor only when party decisions are confirmed. No travel time advances until the whole party is resolved.">Fate Coins / Inspiration: manual · No exhaustion applied until processed.</small>
        </section>`,
        buttons: [
          { action: "apply", label: "Process Party Decisions", default: true, callback: (_event,button) => {
            const f = button.form.elements;
            return { action: "apply", decisions: Object.fromEntries(unresolved.map(actor => [actor.uuid, f[`decision-${actor.uuid}`]?.value ?? "choose"])) };
          } },
          { action: "pause", label: "Cancel / Pause (Save Progress)", callback: () => ({ action: "pause" }) }
        ], close: () => ({ action: "pause" })
      });
      if (!answer || answer.action === "pause") {
        await saveState(state);
        return false;
      }
      const selections = answer.decisions;
      // Preserve other characters' choices while selected rerolls are pending.
      // Nothing is applied until the GM confirms a complete no-reroll batch.
      for (const actor of unresolved) {
        state.hourDecisions[actor.uuid] = selections[actor.uuid] === "reroll" ? "choose" : selections[actor.uuid];
      }
      await saveState(state);
      const rerolls = unresolved.filter(a => selections[a.uuid] === "reroll");
      if (!rerolls.length && Object.values(selections).some(v => v === "choose")) {
        warn("Select a decision for every unresolved character before processing.");
        continue;
      }
      // Process requested rerolls first. Persist other selections, but do not
      // apply exhaustion or finalize anyone until the rerolls are reviewed.
      if (rerolls.length) {
        // Persist and broadcast the in-flight state *before* opening remote
        // Midi-QOL roll prompts, so every client sees "Rerolling" immediately.
        state.hourRerollPending = rerolls.map(actor => actor.uuid);
        await saveState(state);
        await publishStatus(state, "Rerolling", `${rerolls.map(actor => actor.name).join(", ")} rerolling CON for hour ${hour}.`);
        // Concurrent remote requests are fine, but persist their completed
        // results in one world-setting update to avoid last-writer races.
        const results = await Promise.all(rerolls.map(async actor => ({ actor, total: await conSave(actor, dc) })));
        for (const { actor, total } of results) {
          // A disconnected/canceled reroll does NOT erase a prior save or
          // count as a reroll. GM can select Reroll CON again in review.
          if (!Number.isFinite(total)) continue;
          state.hourRolls[actor.uuid] = total;
          state.hourRerolls[actor.uuid] = (state.hourRerolls[actor.uuid] ?? 0) + 1;
          delete state.hourDecisions[actor.uuid];
        }
        state.hourRerollPending = [];
        await saveState(state);
        await publishStatus(state, "GM review", "Reroll results received; GM is reviewing the party.");
        continue;
      }
      for (const actor of unresolved) {
        const decision = selections[actor.uuid];
        if (decision === "exhaust") {
          const current = Number(foundry.utils.getProperty(actor, "system.attributes.exhaustion")) || 0;
          const next = Math.min(6, current + 1);
          if (current >= 6) { warn(`${actor.name} already has 6 levels of Exhaustion; GM must resolve manually.`); return false; }
          ensureCurrent(); // Reset must not permit a stale GM ruling to alter a PC.
          await actor.update({ "system.attributes.exhaustion": next });
          // The public status card records this result; preserve native save-roll messages.
        }
        state.hourOutcomes[actor.uuid] = decision === "exhaust" ? `Exhaustion +1 (now ${foundry.utils.getProperty(actor, "system.attributes.exhaustion")})` : "GM accepted";
        resolved.add(actor.uuid);
        delete state.hourDecisions[actor.uuid];
        state.hourResolved = [...resolved];
        await saveState(state);
        await publishStatus(state, "GM review", `${actor.name} resolved for hour ${hour}.`);
      }
    }
    await publishStatus(state, "Hour resolved", `All Constitution saves for hour ${hour} have been adjudicated.`);
    // Archive reviewed results before clearing the transient hour checkpoint.
    state.marchHistory ??= [];
    state.marchHistory.push({
      day: state.day, hour, dc, recordedAt: Date.now(),
      // A stored hex ID is the authoritative association. Never infer the
      // owning hex from an old entry's date, hour, or timestamp.
      ...(state.activeHexCardId ? { hexId: state.activeHexCardId } : {}),
      results: actors.map(actor => ({
        uuid: actor.uuid, name: actor.name,
        total: Number.isFinite(state.hourRolls?.[actor.uuid]) ? state.hourRolls[actor.uuid] : null,
        passed: Number.isFinite(state.hourRolls?.[actor.uuid]) && state.hourRolls[actor.uuid] >= dc,
        rerolls: state.hourRerolls?.[actor.uuid] ?? 0,
        outcome: state.hourOutcomes?.[actor.uuid] ?? "GM resolved"
      }))
    });
    const committedHexId = state.activeHexCardId;
    state.hexHourSegments = appendHexHours(state.hexHourSegments, committedHexId, state.day, 1);
    state.hours += 1;
    state.pending -= 1;
    state.hourResolved = [];
    state.hourRolls = {};
    state.hourDecisions = {};
    state.hourOutcomes = {};
    state.hourRerolls = {};
    state.hourRerollPending = [];
    if (state.pending === 0) {
      state.hexes += 1;
      state.activeHexCardId = null;
    }
    await commitTravelHours(state, 1);
    await reportLedger(state, `Completed forced-march hour ${hour}, DC ${dc}.`);
    return true;
  }

  async function finishTravel(hours, existingState, isResume) {
    // On a new hex, persist all rolled hours immediately. On resume, those
    // hours are already recorded as unfinished, and MUST NOT be appended again.
    const state = { ...existingState };
    // Keep the stable ID even after the final hour clears activeHexCardId.
    let completedHexId = state.activeHexCardId;
    if (!isResume) {
      ensureCurrent();
      await globalThis.ZFTHexTravelConsole?.hexStarted?.(hours, state.hexes);
      // Only a newly rolled hex gets an ID. Legacy unfinished travel with no
      // saved ID remains unassociated rather than being linked by guesswork.
      state.activeHexCardId = hexCardId;
      completedHexId = hexCardId;
      state.pending = hours;
      state.hourResolved = [];
      state.hourRolls = {};
    state.hourDecisions = {};
      state.hourOutcomes = {};
      state.hourRerolls = {};
      state.hourRerollPending = [];
      await saveState(state);
    }
    if (!state.pending) return true;
    await publishStatus(state, "Travel in progress", "Crossing the current hex.");

    const safe = Math.min(state.pending, Math.max(0, 8 - state.hours));
    if (safe > 0) {
      state.hexHourSegments = appendHexHours(state.hexHourSegments, state.activeHexCardId, state.day, safe);
      state.hours += safe;
      state.pending -= safe;
      if (state.pending === 0) {
        state.hexes += 1;
        state.activeHexCardId = null;
      }
      await commitTravelHours(state, safe);
      await reportLedger(state, `${safe} safe travel hour(s) completed.`);
    }

    while (state.pending > 0) {
      const nextHour = state.hours + 1;
      const dc = 10 + nextHour - 8;
      const inProgress = (Array.isArray(state.hourResolved) && state.hourResolved.length > 0) || Object.keys(state.hourRolls ?? {}).length > 0;
      // Tell every connected expedition client *before* the GM decides.
      // A separate public log briefing will update as the hour progresses.
      if (!inProgress) {
        await publishStatus(state, "Forced march decision", `Hour ${nextHour}: GM deciding whether to continue (CON DC ${dc}).`);
        globalThis.ZFTHexTravelConsole?.cue?.("forcedMarch");
      }
      const choice = inProgress ? "continue" : await promptWait({
        window: { title: `Forced March · Hour ${nextHour}` },
        render: colorButtons,
        position: { width: 440 },
        content: `<div class="zft-hex-forced-choice" role="group" aria-label="Forced March decision">
          <div class="zft-hex-forced-choice-stats">
            <span><small>TRAVELED</small><strong>${state.hours}h</strong></span>
            <span><small>HEX LEFT</small><strong>${state.pending}h</strong></span>
            <span class="zft-hex-forced-choice-dc"><small>CON SAVE</small><strong>DC ${dc}</strong></span>
          </div>
          <p>Continue into hour ${nextHour}? Each character makes a CON save at the end of the hour.</p>
        </div>`,
        buttons: [
          { action: "continue", label: `Continue Hour ${nextHour}`, default: true, callback: () => "continue" },
          { action: "cancel", label: "Cancel / Exit", callback: () => "cancel" }
        ], close: () => "cancel"
      });
      if (choice === "cancel" || !choice) {
        await publishStatus(state, "Travel paused", `GM paused on Day ${state.day}; ${state.pending} unfinished hour(s) preserved.`);
        ui.notifications.info(`Overland Travel: Travel paused. Ledger preserved on Day ${state.day}; ${state.pending} hour(s) remain in this hex.`);
        return false;
      }
      if (choice === "store") {
        await publishStatus(state, "Travel stopped", `Party stops on Day ${state.day}; ${state.pending} hour(s) deferred.`);
        ui.notifications.info(`Overland Travel: ${state.pending} unfinished hour(s) saved. Start next day when ready.`);
        return true;
      }
      await publishStatus(state, "Forced march", `Party chose to continue hour ${nextHour}.`);
      if (!(await forcedHour(state))) {
        ui.notifications.warn(`Overland Travel: Hour ${nextHour} paused. Resume the macro to finish unresolved CON saves before traveling further.`);
        return false;
      }
    }
    // A hex is complete only after every safe/Forced March hour is committed,
    // including its save checkpoint. Stage 'complete' alone means dice rolled.
    if (state.pending === 0) {
      globalThis.ZFTHexTravelConsole?.hexCompleted?.({ id: completedHexId || `legacy:${state.day}:${state.hexes}`, number: state.hexes, hoursToday: state.hours });
    }
    return true;
  }

  if (resuming) {
    // A click on Start / Continue must not spend unfinished travel hours.
    // In particular, beginning another travel day preserves the hex but does
    // not authorize the next safe-hour batch or its world-clock advancement.
    const plan = planHexTravelResume(travelState);
    // Keep this snapshot for a post-dialog check. Another GM or a reset may
    // change the ledger while the first GM is reading the confirmation.
    const beforeConfirmation = JSON.stringify(travelState);
    const approved = await promptWait({
      toggleKey: "travel",
      window: { title: `Continue Traveling Through Hex ${plan.hexNumber}?` },
      position: { width: 440 }, render: colorButtons,
      content: `<section class="zft-hex-resume-confirm" aria-label="Unfinished hex travel confirmation">
        <p>Hex ${esc(plan.hexNumber)} has <strong>${esc(plan.pending)} ${plan.pending === 1 ? "hour" : "hours"} of travel remaining</strong>.</p>
        <div class="zft-hex-resume-stats">
          <span><small>HEX TRAVEL REMAINING</small><strong>${esc(plan.pending)}h</strong></span>
          <span><small>SAFE HOURS AVAILABLE TODAY</small><strong>${esc(plan.safeAvailable)}h</strong></span>
        </div>
        <p class="zft-hex-resume-outcome">${esc(plan.description)}</p>
        <p class="zft-hex-resume-cancel-note">Cancel leaves the saved hex, travel hours, and world time unchanged. You can continue later.</p>
      </section>`,
      buttons: [
        { action: "continue", label: "Continue Traveling", default: true, callback: () => true },
        { action: "cancel", label: "Cancel", callback: () => false }
      ], close: () => false
    });
    if (!approved) return;
    ensureCurrent();
    const currentState = loadState();
    if (JSON.stringify(currentState) !== beforeConfirmation) {
      warn("Travel progress changed while the confirmation was open. Open Start / Continue again to review the latest hours.");
      return;
    }
    globalThis[LOCK] = { generation: launchEpoch };
    try { await finishTravel(currentState.pending, currentState, true); }
    finally { if (globalThis[LOCK]?.generation === launchEpoch) globalThis[LOCK] = null; }
    return;
  }

  const priorDifficulty = getDifficultyDraft();
  let captureDifficultyDraft = () => {};
  const input = await promptWait({
    // Toggle only the pre-roll setup; never cancel in-flight Guide or CON rolls.
    toggleKey: "travel",
    window: { title: "Hex Travel" },
    position: { width: 440 },
    content: `<section class="zft-hex-travel-stage zft-hex-hex-setup">
      <div class="zft-hex-difficulty" data-hex-difficulty>
        <div class="zft-hex-difficulty-heading"><strong>Navigation Difficulty</strong><small>Current Hex</small></div>
        <fieldset class="zft-hex-difficulty-method"><legend class="zft-hex-visually-hidden">Difficulty Method</legend>
          <div class="zft-hex-difficulty-method-options">
            <label><input type="radio" name="dcMode" value="custom" ${priorDifficulty.mode === "custom" ? "checked" : ""}><span>Custom DC</span></label>
            <label><input type="radio" name="dcMode" value="terrainDanger" ${priorDifficulty.mode === "terrainDanger" ? "checked" : ""}><span>Terrain + Danger</span></label>
          </div>
        </fieldset>
        <div class="zft-hex-difficulty-fields" data-hex-dc-custom>
          <label><span>Navigation DC</span><input type="number" name="customDC" min="1" max="30" step="1" value="${priorDifficulty.customDC}" required></label>
          <label><span>Terrain description (optional)</span><input type="text" name="terrainDescription" maxlength="100" value="${esc(priorDifficulty.terrainDescription)}" placeholder="e.g. Ruined mountain pass"></label>
        </div>
        <div class="zft-hex-difficulty-fields" data-hex-dc-terrain hidden>
          <label><span>Terrain</span><select name="terrainId">${TERRAIN_CHOICES.map(o => `<option value="${o.id}" ${o.id === priorDifficulty.terrainId ? "selected" : ""}>${esc(o.name)} · DC ${o.baseDC}</option>`).join("")}</select></label>
          <label><span>Region Danger</span><select name="regionDanger">${DANGER_CHOICES.map(o => `<option value="${o.id}" ${o.id === priorDifficulty.regionDanger ? "selected" : ""}>${esc(o.name)} · ${o.modifier >= 0 ? "+" : ""}${o.modifier}</option>`).join("")}</select></label>
        </div>
      </div>
      <div class="zft-hex-setup-summary">
        <div class="zft-hex-difficulty-preview" role="status" aria-live="polite">
          <div class="zft-hex-difficulty-preview-label"><span>Navigation DC</span><small data-hex-dc-detail>GM specified for this hex</small></div>
          <strong data-hex-dc-preview>${priorDifficulty.customDC}</strong>
        </div>
        <label class="zft-hex-clock-toggle" title="When enabled, committed travel hours advance Foundry world time. This changes the existing GM world setting.">
          <input type="checkbox" name="advanceWorldTime" ${clockSyncEnabled() ? "checked" : ""}><span><i class="fa-solid fa-clock" aria-hidden="true"></i> Advance World Clock</span>
        </label>
      </div>
      <label class="zft-hex-travel-pace"><span>Pace</span>
        <select name="pace"><option value="fast">Fast (75%)</option><option selected value="normal">Normal (100%)</option><option value="slow">Slow (150%)</option></select></label>
      <div class="zft-hex-travel-role-groups">${expeditionSummary}</div>
      <label class="zft-hex-travel-roller"><span>Guide roll requested from</span>
        <select name="navRoller">${rollerOptions(guideActor)}</select></label>
      <p class="zft-hex-travel-help" title="Other paired expedition checks are not yet executed; established Guide navigation and hex-time rules remain unchanged.">Guide sets navigation and hex travel time. Edit assignments in Expedition Roles.</p>
    </section>`,
    render: (event, dialog) => {
      colorButtons(event, dialog);
      const root = dialog.element;
      const clockBox = root.querySelector('[name="advanceWorldTime"]');
      if (clockBox) clockBox.addEventListener("change", () => {
        const desired = clockBox.checked;
        clockBox.disabled = true;
        clockSettingWrite = clockSettingWrite.catch(() => {}).then(() => game.settings.set("zft-overland-travel", CLOCK_SYNC_KEY, desired))
          .catch(error => {
            clockBox.checked = clockSyncEnabled();
            ui.notifications.error(`Could not update the travel world clock setting: ${error.message}`);
          }).finally(() => { clockBox.disabled = false; });
      });
      const selectedMode = () => root.querySelector('input[name="dcMode"]:checked')?.value ?? "custom";
      captureDifficultyDraft = () => {
        const fields = root.querySelector('form')?.elements ?? root.querySelector('[name="pace"]')?.form?.elements;
        if (!fields) return;
        const savedCustom = getDifficultyDraft().customDC;
        const rawCustom = fields.customDC.value.trim();
        const custom = Number(rawCustom);
        void rememberDifficultyDraft({
          mode: selectedMode(),
          // Never replace a valid custom selection with a partial/invalid edit.
          customDC: rawCustom && Number.isSafeInteger(custom) && custom >= 1 && custom <= 30 ? custom : savedCustom,
          terrainId: fields.terrainId.value, regionDanger: fields.regionDanger.value,
          terrainDescription: fields.terrainDescription.value
        });
      };
      const custom = root.querySelector('[data-hex-dc-custom]');
      const terrain = root.querySelector('[data-hex-dc-terrain]');
      const preview = root.querySelector('[data-hex-dc-preview]');
      const details = root.querySelector('[data-hex-dc-detail]');
      const update = () => {
        const computed = selectedMode() === "terrainDanger";
        if (custom) custom.hidden = computed;
        if (terrain) terrain.hidden = !computed;
        if (root.querySelector('[name="customDC"]')) root.querySelector('[name="customDC"]').required = !computed;
        const fields = root.querySelector('form')?.elements ?? root.querySelector('[name="pace"]')?.form?.elements;
        if (!fields || !preview) return;
        try {
          const choice = hexNavigationDifficulty({
            mode: computed ? "terrainDanger" : "custom",
            dc: fields.customDC.value,
            description: fields.terrainDescription.value,
            terrainId: fields.terrainId.value,
            regionDanger: fields.regionDanger.value
          });
          preview.textContent = String(choice.dc);
          if (details) {
            const terrainName = TERRAIN_CHOICES.find(item => item.id === choice.terrainId)?.name ?? "Terrain";
            const dangerName = DANGER_CHOICES.find(item => item.id === choice.regionDanger)?.name ?? "Danger";
            details.textContent = computed
              ? `${terrainName} (${choice.baseDC}) + ${dangerName} (${choice.modifier >= 0 ? "+" : ""}${choice.modifier})`
              : "GM specified for this hex";
          }
        } catch {
          preview.textContent = "—";
          if (details) details.textContent = "Enter a valid DC from 1 to 30";
        }
      };
      for (const field of root.querySelectorAll('[name="dcMode"], [name="customDC"], [name="terrainId"], [name="regionDanger"], [name="terrainDescription"]')) {
        field.addEventListener("input", update);
        field.addEventListener("change", () => { update(); captureDifficultyDraft(); });
      }
      update();
    },
    buttons: [
      { action: "start", label: "Prompt Guide Roll", icon: "fas fa-dice-d20", default: true,
        callback: (event, button) => {
          captureDifficultyDraft();
          return {
          pace: button.form.elements.pace.value,
          navRoller: button.form.elements.navRoller.value,
          dcMode: button.form.elements.dcMode.value,
          customDC: button.form.elements.customDC.value,
          terrainId: button.form.elements.terrainId.value,
          regionDanger: button.form.elements.regionDanger.value,
          terrainDescription: button.form.elements.terrainDescription.value
          };
        } },
      { action: "cancel", label: "Cancel", callback: () => { captureDifficultyDraft(); return null; } }
    ], close: () => { captureDifficultyDraft(); return null; }
  });
  await clockSettingWrite;
  if (!input) return;
  try {
    navigationDifficulty = hexNavigationDifficulty({
      mode: input.dcMode,
      dc: input.customDC,
      terrainId: input.terrainId,
      regionDanger: input.regionDanger,
      description: input.terrainDescription
    });
    DC = navigationDifficulty.dc;
  } catch (error) {
    return warn(`Hex navigation difficulty invalid: ${error.message}`);
  }
  const pace = PACES[input.pace];
  // Preserve the current dice pipeline's 'none' secondary action, but eliminate
  // legacy secondary-role prompts and prevent overwriting Expedition Roles.
  const action = ACTIONS.none;
  const nav = guideActor;
  const secondary = null;
  const navRoller = resolveRoller(nav, input.navRoller);
  const secRoller = null;
  if (!pace || !navRoller)
    return warn("Invalid pace or the selected Guide roller is offline / lacks Owner permission.");
  ensureCurrent();

  // For the navigation skill check, environmental disadvantage is always present.
  // At slow pace Survival advantage cancels it. The native Midi dialog remains editable.
  function paceModes(skill, navigation) {
    return {
      advantage: input.pace === "slow" && ["sur", "prc"].includes(skill),
      disadvantage: !!navigation || (input.pace === "fast" && ["sur", "prc", "ste"].includes(skill))
        || (input.pace === "normal" && skill === "ste")
    };
  }

  // Midi-QOL v13 registers rollAbility as a socketlib operation. This is NOT a
  // contestedRoll, and it is NOT a chat request; the player receives the actual
  // MIDI-configured skill dialog immediately. Supports pre/post 13.0.44 data shapes.
  const modern = foundry.utils.isNewerVersion(midiModule.version, "13.0.43");
  function midiRequest(actor, skill, navigation) {
    const modes = paceModes(skill, navigation);
    if (modern) {
      return {
        saveDetails: {
          actorUuid: actor.uuid,
          rollType: "skill", rollAbilities: [], rollSkills: [skill], rollTools: [],
          advantage: modes.advantage, disadvantage: modes.disadvantage,
          isMagicSave: false, isFriendly: true,
          rollDC: navigation ? DC : 0, saveItemUuid: "",
          workflowOptions: {}, workflowId: "", itemCardUuid: "", itemId: ""
        },
        displayOptions: {
          fastForward: false, chatMessage: true, rollMode: "publicroll",
          showTargetDC: navigation
        }
      };
    }
    return {
      targetUuid: actor.uuid,
      request: "skill", skill,
      advantage: modes.advantage, disadvantage: modes.disadvantage,
      rollDC: navigation ? DC : 0,
      options: { fastForward: false, chatMessage: true, rollMode: "publicroll" }
    };
  }

  // Midi-QOL owns native roll/chat presentation. If its socket result provides
  // a message identifier, wait for that Dice So Nice animation before sharing
  // a total in the ZFT world snapshot. Do not guess an unrelated chat message.
  async function waitForNativeRollPresentation(value, observedMessageId = null) {
    if (!game.modules.get("dice-so-nice")?.active || typeof game.dice3d?.waitFor3DAnimationByMessageID !== "function") return;
    const first = Array.isArray(value) ? value[0] : value;
    const raw = first?.messageId ?? first?.messageID ?? first?.chatMessageId ?? first?.chatMessage?.id ?? observedMessageId;
    const messageId = typeof raw === "string" ? raw : null;
    if (!messageId || !game.messages?.get(messageId)) return;
    try { await game.dice3d.waitFor3DAnimationByMessageID(messageId); }
    catch (error) { console.warn("Hex Travel | Native dice animation failed", error); }
    ensureCurrent();
  }

  function totalFromRemote(value) {
    if (Array.isArray(value)) return value.length ? totalFromRemote(value[0]) : null;
    if (!value || typeof value !== "object") return null;
    if (Number.isFinite(value.total)) return value.total;
    if (value.rolls?.length) return totalFromRemote(value.rolls);
    // Midi / socketlib may return a serialized Roll object.
    if (value._total != null && Number.isFinite(Number(value._total))) return Number(value._total);
    return null;
  }

  async function rollWithRetry(actor, roller, skill, isNavigation) {
    let currentRoller = roller;
    while (true) {
      let returned;
      let observedMessageId = null;
      let failure;
      try {
        const request = await recoverableRemoteRoll(actor, currentRoller,
          () => midiRequest(actor, skill, isNavigation),
          `${isNavigation ? "Navigation" : "Secondary"} · ${CONFIG.DND5E.skills[skill]?.label ?? skill}`,
          isNavigation ? "navigation" : "secondary");
        if (request.cancelled) return null;
        returned = request.value;
        observedMessageId = request.observedMessageId;
        currentRoller = request.roller ?? currentRoller;
        if (request.error) throw request.error;
      } catch (err) {
        if (err?.name === "HexTravelWorkflowCanceled") throw err;
        failure = err;
        console.error("Hex Travel | Midi remote roll error", err);
      }
      const total = totalFromRemote(returned);
      if (total !== null) {
        await waitForNativeRollPresentation(returned, observedMessageId);
        return { total, roller: currentRoller };
      }
      const choice = await promptWait({
        window: { title: `${identity().name} | ${actor.name} Roll` },
        render: colorButtons,
        position: { width: 385 },
        content: `<div style="background:#232b32;color:#eeeaf1;padding:10px;border-left:4px solid ${UI.amber};"><p>The ${esc(CONFIG.DND5E.skills[skill]?.label ?? skill)} roll for <strong>${esc(actor.name)}</strong> did not return a usable total${failure ? " (an error occurred)" : " (it may have been canceled)"}.</p><p style="color:${UI.amber};">No travel time has been rolled.</p></div>`,
        buttons: [
          { action: "retry", label: "Retry Player", default: true, callback: () => "retry" },
          { action: "gm", label: "Roll as GM", callback: () => "gm" },
          { action: "cancel", label: "Cancel Travel", callback: () => "cancel" }
        ], close: () => "cancel"
      });
      if (choice === "cancel") return null;
      if (choice === "gm") currentRoller = game.user;
      if (!currentRoller.active && currentRoller !== game.user) currentRoller = game.user;
    }
  }

  // A progress card is intentionally RECREATED at each checkpoint. In V13,
  // ChatMessage.update() changes content in place but doesn't bump its order.
  // Creating the newest card keeps the journey near the bottom of chat.
  // Dice So Nice hides new roll cards while animating. During the FINAL roll,
  // retain the old progress card until the 3D animation finishes, and only then
  // delete it. The progress card therefore remains visible throughout the roll.
  // This doesn't force-scroll players who intentionally scrolled away.
  const hexCardId = foundry.utils.randomID();
  let currentCard = null;
  const smallBox = (label, body, shade = "#303a43") =>
    `<div style="background:${shade};border-radius:4px;padding:7px 8px;font-size:12px;">` +
    `<div style="font-size:10px;letter-spacing:.5px;color:#c9c5d5;margin-bottom:3px;">${esc(label).toUpperCase()}</div>${body}</div>`;
  const diceChips = (values, penalty=false) => values.map(face =>
    hexTravelDieFace(face, 4, { penalty })).join(" ");

  function renderStage({ stage, navResult=null, secResult=null, success=null,
                         decision=null, dice=null }) {
    const status = {
      started: "NAVIGATION PENDING",
      navigation: secondary ? "SECONDARY PENDING" : "GM REVIEW PENDING",
      secondary: "GM REVIEW PENDING",
      rolling: "ROLLING TRAVEL DICE",
      complete: "TRAVEL TIME ROLLED"
    }[stage];
    const navStatus = navResult
      ? `${hexTravelD20Total(navResult.total)} vs DC ${DC} · ` +
        (success === null ? `<span style="color:#dec7e5;">Pending GM confirmation</span>`
          : `<strong class="zft-hex-roll-outcome zft-hex-result-${success ? "success" : "failure"}">${success ? "SUCCESS" : "FAILURE"}</strong>` +
            (decision !== "roll" ? ` <em style="font-size:11px;">(GM override)</em>` : ""))
      : `<span style="color:#c2b9ca;">Awaiting ${esc(navRoller.name)}'s roll</span>`;
    const navBlock = smallBox(`Guide · Wisdom (Survival) · DC ${DC}`,
      `${esc(nav.name)} · ${navStatus}`);
    const secBlock = !secondary
      ? ``
      : smallBox(`Secondary · ${action.name} · ${CONFIG.DND5E.skills[action.skill]?.label ?? action.skill}`,
        `${esc(secondary.name)} · ${secResult ? `${hexTravelD20Total(secResult.total)} <span style="color:#b9bec9;">(GM adjudicates)</span>`
        : `<span style="color:#c2b9ca;">${navResult ? "Awaiting" : "Queued for"} ${esc(secRoller.name)}'s roll</span>`}`);
    const travelBlock = !dice
      ? `<div style="border:1px solid #5b5166;background:#302b39;border-radius:5px;padding:8px;font-size:12px;` +
        `color:#c6bdce;">TRAVEL DICE · ${stage === "rolling" ?
          `Rolling ${success ? "2d4" : "2d4 + 1d4 + 2"} …` : "Pending Guide check and GM confirmation"}</div>`
      : `<div style="border:1px solid #746580;background:#302b39;border-radius:5px;padding:8px;">` +
          `<div style="font-size:10px;letter-spacing:1px;color:#e3cee9;margin-bottom:5px;">DICE ROLLED · ${success ? "2d4" : "2d4 + 1d4 + 2"}</div>` +
          `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;font-size:11px;">` +
          `<span style="white-space:nowrap;">Travel ${diceChips(dice.baseDice)}</span>` +
          (success ? "" : `<span style="white-space:nowrap;">Delay ${diceChips(dice.lostDie,true)} <strong style="color:#f0c9c4;">+ 2</strong></span>`) +
          `</div><div style="border-top:1px solid #62576d;margin-top:7px;padding-top:6px;display:grid;gap:3px;font-size:12px;">` +
          `<div style="display:flex;justify-content:space-between;"><span>Base 2d4</span><strong>${dice.base} h</strong></div>` +
          `<div style="display:flex;justify-content:space-between;"><span>${pace.name} (${pace.percent}), rounded up</span><strong>${dice.adjusted} h</strong></div>` +
          (success ? "" : `<div style="display:flex;justify-content:space-between;color:#efc3bd;"><span>Navigation delay · 1d4+2</span><strong>+${dice.delay} h</strong></div>`) +
          `</div></div>` +
          `<div style="background:#393342;border:1px solid #746580;border-radius:4px;` +
            `text-align:center;margin-top:7px;padding:7px;">` +
          `<div style="color:#d1c4da;font-size:10px;letter-spacing:1px;">TOTAL · ONE HEX</div>` +
          `<div style="font-size:23px;color:white;font-weight:700;">${dice.hours} hours</div></div>`;
    return `<div style="background:#222930;color:#eeeef0;border:1px solid #66727b;` +
      `border-top:4px solid #a38ab6;border-radius:6px;padding:10px 12px;font-family:inherit;display:grid;gap:7px;">` +
      `<div data-hex-stage-location style="font-size:10px;letter-spacing:1.2px;color:#cfbfd9;${[identity().region, identity().world].some(Boolean) ? "" : "display:none;"}">${esc([identity().region, identity().world].filter(Boolean).join(" · "))}</div>` +
      `<div style="display:flex;justify-content:space-between;align-items:center;gap:5px;flex-wrap:wrap;">` +
      `<strong data-hex-stage-title style="font-size:15px;color:#f3ebf7;">${esc(identity().name)} · Hex Travel</strong>` +
      `<span style="font-size:9px;color:${stage === "complete" ? "#b5ddc3" : "#dfcbe9"};` +
      `background:#393342;border:1px solid #71617e;border-radius:4px;padding:3px 5px;">${status}</span></div>` +
      `<div style="font-size:12px;">Pace: <strong style="color:${pace.color};">${pace.name} (${pace.percent})</strong></div>` +
      navBlock + secBlock + travelBlock + `</div>`;
  }

  async function publishStage(stageInfo, options={}) {
    ensureCurrent();
    // The evaluated result is private until the presentation animation finishes.
    // With Dice So Nice disabled/unavailable, evaluated rolls publish immediately.
    // Never duplicate dice in chat or ask the player to roll a second time.
    if (options.roll && game.modules.get("dice-so-nice")?.active && typeof game.dice3d?.showForRoll === "function") {
      try { await game.dice3d.showForRoll(options.roll, game.user, true); }
      catch (error) { console.warn("Hex Travel | Dice So Nice animation failed", error); }
      ensureCurrent();
    }
    // The progress card remains at "Rolling…" for all clients during animation.
    await globalThis.ZFTHexTravelConsole?.stage?.(hexCardId, renderStage(stageInfo), stageInfo.stage, launchLogEpoch, { day: travelState.day, travelHour: travelState.hours, difficulty: navigationDifficulty });
    currentCard = hexCardId;
    ensureCurrent();
  }
  async function setRollingStage(stageInfo) {
    if (!currentCard) return;
    ensureCurrent();
    await globalThis.ZFTHexTravelConsole?.stage?.(hexCardId, renderStage({ ...stageInfo, stage: "rolling" }), "rolling", launchLogEpoch);
  }
  async function clearProgress() {
    if (!currentCard) return;
    currentCard = null;
    // A reset already wiped all cards. Don't let an old async workflow mutate them.
    if ((globalThis.ZFTHexTravelConsole?.generation?.() ?? 0) !== launchEpoch) return;
    await globalThis.ZFTHexTravelConsole?.removeStage?.(hexCardId, launchLogEpoch);
  }

  globalThis[LOCK] = { generation: launchEpoch };
  let travelTimeRolled = false;
  try {
    await publishStage({ stage: "started" });
    const navResult = await rollWithRetry(nav, navRoller, HEX_TRAVEL_NAVIGATION_SKILL, true);
    if (!navResult) { await clearProgress(); return; }
    await publishStage({ stage: "navigation", navResult });
    let secResult = null;
    if (secondary) {
      secResult = await rollWithRetry(secondary, secRoller, action.skill, false);
      if (!secResult) { await clearProgress(); return; }
      await publishStage({ stage: "secondary", navResult, secResult });
    }
    const autoSuccess = navResult.total >= DC;
    const decision = await promptWait({
      window: { title: `${identity().name} | Navigation Ruling` },
      render: (event, dialog) => {
        colorButtons(event, dialog);
        const select = dialog.element.querySelector('select[name="ruling"]');
        const preview = dialog.element.querySelector('[data-hex-final-navigation]');
        const update = () => {
          if (!select || !preview) return;
          const actual = select.value === "roll";
          const finalSuccess = actual ? autoSuccess : select.value === "success";
          preview.className = `zft-hex-navigation-final ${finalSuccess ? "is-success" : "is-failure"}`;
          preview.textContent = `${finalSuccess ? "Success" : "Failure"}${actual ? " · matches roll" : " · GM override"}`;
          select.classList.toggle("is-success",finalSuccess);
          select.classList.toggle("is-failure",!finalSuccess);
        };
        select?.addEventListener("change",update);
        update();
      },
      position: { width: 380 },
      content: `<section class="zft-hex-travel-stage zft-hex-navigation-ruling">
        <div class="zft-hex-navigation-result"><strong class="zft-hex-result-${autoSuccess ? "success" : "failure"}">${esc(nav.name)}</strong><span class="zft-hex-navigation-roll zft-hex-result-${autoSuccess ? "success" : "failure"}">Survival ${hexTravelD20Total(navResult.total)} vs <strong>DC ${DC}</strong></span><strong class="zft-hex-navigation-verdict ${autoSuccess ? "is-success" : "is-failure"}">ROLLED ${autoSuccess ? "SUCCESS" : "FAILURE"}</strong></div>
        ${secondary ? `<div class="zft-hex-navigation-secondary">${esc(secondary.name)} · ${esc(action.name)} ${hexTravelD20Total(secResult.total)} (GM adjudicates)</div>` : ""}
        <label class="zft-hex-travel-roller"><span>Navigation outcome</span>
          <select name="ruling"><option value="roll">Use roll (${autoSuccess ? "Success" : "Failure"})</option>
          <option class="zft-hex-result-success" value="success">Override: Success</option><option class="zft-hex-result-failure" value="failure">Override: Failure</option></select></label>
        <div class="zft-hex-navigation-final-line">Final navigation outcome: <strong data-hex-final-navigation class="zft-hex-navigation-final ${autoSuccess ? "is-success" : "is-failure"}">${autoSuccess ? "Success" : "Failure"} · matches roll</strong></div>
        <small class="zft-hex-travel-help">Travel time is rolled only when you confirm.</small>
      </section>`,
      buttons: [
        { action: "confirm", label: "Roll Travel Time", icon: "fas fa-dice", default: true,
          callback: (event, button) => button.form.elements.ruling.value },
        { action: "cancel", label: "Cancel Travel", callback: () => null }
      ], close: () => null
    });
    if (!decision) { await clearProgress(); return; }
    const success = decision === "roll" ? autoSuccess : decision === "success";
    await setRollingStage({ navResult, secResult, success, decision });
    // One combined Foundry roll reveals all 3d4 on failure, 2d4 on success.
    const travelRoll = await new Roll(success ? "2d4" : "2d4 + 1d4 + 2").evaluate();
    const faces = die => (die?.results ?? [])
      .filter(result => result.active !== false && result.discarded !== true)
      .map(result => Number(result.result));
    const baseDice = faces(travelRoll.dice[0]);
    const lostDie = success ? [] : faces(travelRoll.dice[1]);
    if (baseDice.length !== 2 || (!success && lostDie.length !== 1)) {
      throw new Error("Unexpected Hex Travel dice terms. Expected 2d4 + (optional) 1d4+2.");
    }
    const base = baseDice.reduce((sum, face) => sum + face, 0);
    const delay = success ? 0 : lostDie[0] + 2;
    const adjusted = Math.ceil(base * pace.multiplier);
    const hours = adjusted + delay;
    await publishStage({ stage: "complete", navResult, secResult, success, decision,
      dice: { baseDice, lostDie, base, adjusted, delay, hours } },
      { roll: travelRoll, details: {
        navigator: nav.name, navigationTotal: navResult.total, navigationSuccess: success,
        navigationDC: DC, difficulty: navigationDifficulty,
        base, delay, totalHours: hours, secondaryTotal: secResult?.total ?? null
      } });
    travelTimeRolled = true;
    // Audio acknowledges the saved navigation outcome; no cue on a canceled
    // decision or an uncommitted dice workflow.
    globalThis.ZFTHexTravelConsole?.cue?.(success ? "navigationSuccess" : "navigationFailure");
    await finishTravel(hours, travelState, false);
  } catch (error) {
    // Once dice have been rolled and a travel ledger might have been saved,
    // never erase the history card because a world-clock update failed.
    if (!travelTimeRolled) await clearProgress();
    throw error;
  } finally {
    if (globalThis[LOCK]?.generation === launchEpoch) globalThis[LOCK] = null;
  }
})().catch(err => {
  if (err?.name === "HexTravelWorkflowCanceled") return;
  console.error("[ZFT][HexTravel] ❌ Travel workflow failed", err);
  ui.notifications.error("Overland Travel stopped. Open F12 for details; unfinished progress card was removed.");
});
}
