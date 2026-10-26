/**
 * Mount Ironrot Hex Travel — v4.13 Compact Expedition Status & Forced-March History
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
 * Does not advance the Foundry clock or automatically spend Fate/Inspiration.
 */
(async () => {
  const DC = 15;
  const LOCK = "__ZRF_IRONROT_DIRECT_MIDI_V4_ACTIVE__"; // Reuse lock with earlier v4 editions.
  const PACES = {
    fast:   { name: "Fast",   multiplier: 0.75, percent: "75%",  color: "#b7d2cf" },
    normal: { name: "Normal", multiplier: 1.00, percent: "100%", color: "#e6d4bb" },
    slow:   { name: "Slow",   multiplier: 1.50, percent: "150%", color: "#d7bee6" }
  };
  // World-scoped, GM-managed party travel state survives macro runs and Foundry restarts.
  const STATE_KEY = "mountIronrotTravelV45"; // Retain v4.5 key for seamless upgrade.
  if (!game.settings.settings.has(`world.${STATE_KEY}`)) {
    game.settings.register("world", STATE_KEY, {
      name: "Mount Ironrot travel state", scope: "world", config: false,
      type: Object, default: { day: 1, hours: 0, pending: 0, hexes: 0 }
    });
  }
  const loadState = () => {
    const value = game.settings.get("world", STATE_KEY) ?? {};
    return {
      day: Math.max(1, Number(value.day) || 1),
      hours: Math.max(0, Number(value.hours) || 0),
      pending: Math.max(0, Number(value.pending) || 0),
      hourResolved: Array.isArray(value.hourResolved) ? value.hourResolved : [],
      hourRolls: value.hourRolls && typeof value.hourRolls === "object" ? value.hourRolls : {},
      hourDecisions: value.hourDecisions && typeof value.hourDecisions === "object" ? value.hourDecisions : {},
      hourOutcomes: value.hourOutcomes && typeof value.hourOutcomes === "object" ? value.hourOutcomes : {},
      hourRerolls: value.hourRerolls && typeof value.hourRerolls === "object" ? value.hourRerolls : {},
      marchHistory: Array.isArray(value.marchHistory) ? value.marchHistory : [],
      hexes: Math.max(0, Number(value.hexes) || 0)
    };
  };
  const saveState = async state => game.settings.set("world", STATE_KEY, state);
  const ACTIONS = {
    none: { name: "None", skill: null },
    scout: { name: "Scout Ahead", skill: "prc" },
    arcane: { name: "Arcane Survey", skill: "arc" },
    investigate: { name: "Investigate Route", skill: "inv" },
    conceal: { name: "Conceal Party", skill: "ste" },
    nature: { name: "Environmental Assessment", skill: "nat" }
  };
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const warn = text => ui.notifications.warn(text);
  const Dialog = foundry.applications.api.DialogV2;
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


  if (!game.user.isGM) return warn("Mount Ironrot travel must be started by a GM.");
  if (game.system.id !== "dnd5e") return warn("Mount Ironrot travel requires the D&D 5e system.");
  const midiModule = game.modules.get("midi-qol");
  if (!midiModule?.active || typeof globalThis.MidiQOL?.socket !== "function") {
    return warn("This macro requires active Midi-QOL with its socket API.");
  }
  const midiSocket = MidiQOL.socket();
  if (typeof midiSocket?.executeAsUser !== "function") {
    return warn("Midi-QOL's remote roll socket API is unavailable. No travel was started.");
  }
  if (globalThis[LOCK]) return warn("An Ironrot travel roll is already in progress on this GM client.");

  // Main campaign roster is supplied exclusively by User / Player Configuration.
  // Offline players remain in the roster; their character can be rolled by a GM.
  const roster = new Map();
  for (const user of game.users.players) {
    const actor = user.character;
    if (!actor || actor.type !== "character") continue;
    if (!roster.has(actor.uuid)) roster.set(actor.uuid, { actor, assignments: [] });
    roster.get(actor.uuid).assignments.push(user);
  }
  const actors = [...roster.values()].map(entry => entry.actor);
  if (!actors.length) return warn("No PCs are assigned in Player Configuration.");

  // Public expedition status is a single replaceable chat message, not a HUD.
  // Replacing a message puts it at the end of chat. It cannot remain permanently
  // visible if other people chat or manually scroll away.
  const PUBLIC_FLAG = "mountIronrotExpeditionStatusV49";
  const PUB = { bg: "#1C2633", panel: "#293747", rule: "#46596A", text: "#F2E7D8",
    muted: "#B7C8D3", blue: "#91C3DB", copper: "#D6A66B", green: "#89C9B3",
    red: "#DF9295", violet: "#BCA5DC" };
  let statusQueue = Promise.resolve();
  const statusCards = () => game.messages.contents.filter(m => m.getFlag("world", PUBLIC_FLAG));
  const statusBox = (name, value, color) => `<div style="background:${PUB.panel};border:1px solid ${PUB.rule};border-radius:5px;padding:5px 3px;min-width:0;text-align:center;">` +
    `<div style="font:600 9px/1.3 sans-serif;letter-spacing:.25px;color:${PUB.muted};">${esc(name)}</div>` +
    `<div style="font:bold 17px/1.35 sans-serif;color:${color};">${esc(value)}</div></div>`;
  function saveRows(state, dc) {
    return actors.map(actor => {
      const id = actor.uuid;
      const done = (state.hourResolved ?? []).includes(id);
      const total = state.hourRolls?.[id];
      const hasRoll = Number.isFinite(total);
      const ruling = state.hourOutcomes?.[id];
      const rerolls = Number(state.hourRerolls?.[id] ?? 0);
      const result = !hasRoll ? "Awaiting roll" : `${total} · ${total >= dc ? "Passed" : "Failed"}${rerolls ? ` · reroll ×${rerolls}` : ""}`;
      const outcome = done ? (ruling ?? "GM resolved") : "Awaiting GM ruling";
      const color = !hasRoll ? PUB.copper : total >= dc ? PUB.green : PUB.red;
      return `<div style="border-top:1px solid ${PUB.rule};padding:5px 0;min-width:0;">`+
        `<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:2px 6px;align-items:baseline;">`+
        `<strong style="font-size:12px;color:${PUB.text};overflow-wrap:anywhere;">${esc(actor.name)}</strong>`+
        `<span style="font-size:11px;color:${color};">${esc(result)}</span></div>`+
        `<div style="font-size:10px;color:${done ? PUB.green : PUB.muted};">${esc(outcome)}</div></div>`;
    }).join("");
  }
  // Only render current travel-day results. Prior days remain in stored ledger history.
  function pastResults(state) {
    const history = Array.isArray(state.marchHistory) ? state.marchHistory : [];
    if (!history.length) return "";
    const today = history.filter(h => h.day === state.day);
    const makeHour = h => `<div style="border-top:1px solid ${PUB.rule};padding-top:6px;margin-top:6px;">`+
      `<div style="font-size:11px;color:${PUB.copper};font-weight:700;">Hour ${esc(h.hour)} · CON DC ${esc(h.dc)}</div>`+
      `${(h.results ?? []).map(r => `<div style="padding:4px 0;border-bottom:1px solid #334454;">`+
        `<div style="display:flex;justify-content:space-between;gap:5px;flex-wrap:wrap;font-size:11px;">`+
        `<strong style="color:${PUB.text};overflow-wrap:anywhere;">${esc(r.name)}</strong>`+
        `<span style="color:${r.passed ? PUB.green : PUB.red};">${Number.isFinite(r.total) ? esc(r.total) : "—"} · ${r.passed ? "Passed" : "Failed"}${r.rerolls ? ` · reroll ×${esc(r.rerolls)}` : ""}</span></div>`+
        `<div style="color:${PUB.muted};font-size:10px;">${esc(r.outcome ?? "GM resolved")}</div></div>`).join("")}</div>`;
    return `<div style="border-top:1px solid ${PUB.rule};padding-top:6px;">`+
      `<strong style="font-size:11px;color:${PUB.text};">Forced March Results · Day ${esc(state.day)}</strong>`+
      (today.length ? today.map(makeHour).join("") : `<div style="font-size:10px;color:${PUB.muted};">No completed forced-march hours today.</div>`) +
      `</div>`;
  }
  // Completed-hour summaries are derived from saved history, not from the
  // transient hour-roll checkpoint (which is cleared after each full hour).
  function lastHourSummary(state) {
    const latest = (state.marchHistory ?? []).filter(h => h.day === state.day).at(-1);
    if (!latest) return null;
    const affected = (latest.results ?? []).filter(r => /Exhaustion \+1/.test(r.outcome ?? ""));
    const summary = affected.length
      ? affected.map(r => `${r.name} gained 1 Exhaustion`).join(" · ")
      : "No Exhaustion gained";
    return `Hour ${latest.hour} complete · ${summary}`;
  }
  function currentStatus(state, phase, detail) {
    const rolled = actors.filter(a => Number.isFinite(state.hourRolls?.[a.uuid])).length;
    const resolved = actors.filter(a => (state.hourResolved ?? []).includes(a.uuid)).length;
    if (phase === "Saving throws") return `${rolled} of ${actors.length} CON saves received · Hour ${state.hours + 1}`;
    if (phase === "Rerolling") return detail || `CON reroll pending · Hour ${state.hours + 1}`;
    if (phase === "GM review") {
      if (detail && /reroll/i.test(detail)) return detail;
      return `${resolved} of ${actors.length} rulings resolved · Hour ${state.hours + 1}`;
    }
    if (phase === "Forced march") return `Preparing forced-march hour ${state.hours + 1}`;
    if (phase === "Hour resolved") return `Hour ${state.hours + 1} saves adjudicated · Updating travel ledger`;
    if (phase === "Travel reset" || phase === "Ledger corrected" || phase === "New travel day") return detail;
    if (phase === "Travel stopped") return `Travel stopped · ${state.pending} hour(s) carried forward to the next travel day`;
    const last = lastHourSummary(state);
    if (last && /Completed forced-march hour/.test(detail ?? "")) return last;
    if (!state.pending && phase === "Hex completed") return last ? `${last} · Hex completed` : `Hex completed · ${state.hexes} total`;
    return detail || last || (state.pending ? "Travel in progress" : "Expedition ready");
  }
  function statusHtml(state, phase="Travel status", detail="") {
    const safe = Math.min(8, state.hours);
    const forced = Math.max(0, state.hours - 8);
    const activeHour = state.hours + 1;
    const hasSaves = phase === "Saving throws" || phase === "GM review" || phase === "Rerolling" ||
      !!(state.hourResolved?.length || Object.keys(state.hourRolls ?? {}).length);
    const dc = 10 + activeHour - 8;
    const banner = hasSaves ? `<div style="background:#3A342C;border-left:3px solid ${PUB.copper};padding:5px 7px;border-radius:3px;color:${PUB.copper};font-size:11px;">Forced march · Hour ${activeHour} · CON DC ${dc}</div>` : "";
    return `<div style="background:${PUB.bg};color:${PUB.text};padding:9px;border:1px solid ${PUB.rule};border-top:3px solid ${PUB.copper};border-radius:6px;display:grid;gap:7px;min-width:0;overflow-wrap:break-word;">` +
      `<div style="display:flex;justify-content:space-between;gap:5px;align-items:center;flex-wrap:wrap;"><strong style="font-size:14px;color:${PUB.text};">Mount Ironrot · Expedition</strong><span style="color:${PUB.blue};font-size:10px;">${esc(phase)}</span></div>` +
      `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;">${statusBox("DAY", state.day, PUB.blue)}${statusBox("HOURS", `${state.hours}/8`, forced ? PUB.copper : PUB.green)}${statusBox("TOTAL HEXES",state.hexes,PUB.text)}</div>` +
      `<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:3px 7px;font-size:11px;"><span>Safe: <b style="color:${PUB.green};">${safe}h</b> · Forced: <b style="color:${PUB.copper};">${forced}h</b></span><span>Hex remaining: <b style="color:${PUB.copper};">${state.pending}h</b></span></div>` +
      `<div style="height:6px;background:#42505F;border-radius:6px;overflow:hidden;"><div style="height:100%;width:${Math.round(safe/8*100)}%;background:${PUB.green};"></div></div>` +
      banner + (hasSaves ? `<div><strong style="font-size:11px;color:${PUB.text};">Current Hour · Party CON Saves</strong>${saveRows(state,dc)}</div>` : "") +
      pastResults(state) +
      `<div style="border-top:1px solid ${PUB.rule};padding-top:6px;font-size:10px;color:${PUB.muted};">${esc(currentStatus(state, phase, detail))}</div>` + `</div>`;
  }
  async function replaceStatus(state, phase="Travel status", detail="") {
    const content = statusHtml(state, phase, detail);
    // Keep prior card visible until the replacement was created successfully.
    const next = await ChatMessage.create({speaker: ChatMessage.getSpeaker({alias:"Mount Ironrot Travel"}), content,
      flags: {world: {[PUBLIC_FLAG]: true}}});
    for (const old of statusCards()) {
      if (old.id === next.id) continue;
      try { await old.delete(); }
      catch(e) { console.warn("Mount Ironrot | Old status card not removed", e); }
    }
    return next;
  }
  function publishStatus(state, phase, detail="") {
    // Serialize concurrent save completions so an older card cannot win the race.
    statusQueue = statusQueue.catch(e => console.warn("Mount Ironrot | Prior status update failed",e))
      .then(() => replaceStatus(state, phase, detail));
    return statusQueue;
  }
  // A single GM uses this tool. All keys are in the existing world setting.
  let travelState = loadState();
  async function manageLedger(state) {
    const result = await Dialog.wait({
      window: { title: "Mount Ironrot | Manage Saved Travel" },
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
      await saveState({ day: result.day, hours: result.hours, pending: result.pending, hexes: result.hexes, hourResolved: [], hourRolls: {}, hourDecisions: {}, hourOutcomes: {}, hourRerolls: {}, marchHistory: [] });
      await publishStatus(loadState(), "Ledger corrected", "GM manually updated the travel ledger.");
      ui.notifications.info("Mount Ironrot travel ledger corrected. Run macro again to continue.");
      return;
    }
    const confirmation = await Dialog.wait({
      window: { title: "Mount Ironrot | Confirm Full Reset" },
      position: { width: 480 },
      render: colorButtons,
      content: `<p><strong style="color:${UI.red};">Erase the complete saved Mount Ironrot travel ledger?</strong></p><p>This resets Day to 1, hours to 0, unfinished hex to 0, completed hexes to 0, and clears all stored hourly rolls, completed forced-march history, pending decisions, and resolution checkpoints. This cannot be undone from the macro. It does not change character Exhaustion.</p><p>Type <strong>RESET</strong> to confirm:</p><input name="confirmation" type="text" autocomplete="off">`,
      buttons: [
        { action: "reset", label: "Permanently Reset", callback: (_event, button) => button.form.elements.confirmation.value.trim() },
        { action: "cancel", label: "Cancel", default: true, callback: () => null }
      ], close: () => null
    });
    if (confirmation !== "RESET") return warn("Full travel reset canceled. No data changed.");
    await saveState({ day: 1, hours: 0, pending: 0, hexes: 0, hourResolved: [], hourRolls: {}, hourDecisions: {}, hourOutcomes: {}, hourRerolls: {}, marchHistory: [] });
    await publishStatus(loadState(), "Travel reset", "Expedition travel statistics were reset by the GM.");
    ui.notifications.info("Mount Ironrot stored travel stats fully reset to Day 1.");
  }
  let travelMenu = await Dialog.wait({
    window: { title: "Mount Ironrot | Daily Travel Ledger" },
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
  if (travelMenu === "manage") { await manageLedger(travelState); return; }
  if (travelMenu === "day") {
    if (travelState.hourResolved.length || Object.keys(travelState.hourRolls).length) {
      return warn("Resolve or reset the in-progress CON saves before starting the next day.");
    }
    const newDayConfirmed = await Dialog.wait({
      window: { title: "Mount Ironrot | Start New Travel Day" },
      render: colorButtons,
      position: { width: 455 },
      content: `<div style="background:${UI.panel};color:#eeeaf1;padding:10px;display:grid;gap:9px;">` +
        `<div style="display:flex;gap:7px;">${stat("CURRENT DAY", travelState.day, UI.blue)}${stat("NEW DAY", travelState.day + 1, UI.green)}</div>` +
        `<p>Begin the next travel day? Today’s ${tint(`${travelState.hours} travel hour(s)`, UI.amber)} reset to zero. ` +
        `${tint(`${travelState.pending} unfinished hex hour(s)`, UI.blue)} remain available to resume.</p>` +
        `<small>This does not advance the Foundry clock or automatically grant a rest.</small></div>`,
      buttons: [
        { action: "day", label: "Start New Travel Day", default: true, callback: () => true },
        { action: "cancel", label: "Cancel", callback: () => false }
      ], close: () => false
    });
    if (!newDayConfirmed) {
      ui.notifications.info("Mount Ironrot: New travel day canceled. Ledger unchanged.");
      return;
    }
    travelState = { ...travelState, day: travelState.day + 1, hours: 0, hourResolved: [], hourRolls: {}, hourDecisions: {}, hourOutcomes: {} };
    await saveState(travelState);
    await publishStatus(travelState, "New travel day", "Daily travel hours reset. The GM handles rests and game time.");
    ui.notifications.info(`Mount Ironrot: Day ${travelState.day} started. Continue traveling in this session.`);
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

  const actorOptions = actors.map(a => `<option value="${esc(a.uuid)}">${esc(a.name)}</option>`).join("");
  // A navigator may not also take the optional secondary activity.
  // Keep that PC out of the secondary dropdown rather than showing an invalid choice.
  const secondaryOptions = navigatorUuid => actors
    .filter(actor => actor.uuid !== navigatorUuid)
    .map(actor => `<option value="${esc(actor.uuid)}">${esc(actor.name)}</option>`)
    .join("");
  const activityOptions = Object.entries(ACTIONS).map(([id, info]) =>
    `<option value="${esc(id)}" ${id !== "none" && actors.length < 2 ? "disabled" : ""}>${esc(info.name)}${info.skill ? ` (${esc(CONFIG.DND5E.skills[info.skill]?.label ?? info.skill)})` : ""}</option>`
  ).join("");
  const initialNav = actors[0];
  const initialSecondary = actors.find(a => a.uuid !== initialNav.uuid) ?? initialNav;

  // Persist the complete untraveled segment before any hour is processed.
  // Checkpoint each adjudicated PC to avoid repeated Exhaustion on rerun.
  async function reportLedger(state, label) {
    await publishStatus(state, state.pending ? "Travel in progress" : "Hex completed", label);
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
      return totalFromRemote(await midiSocket.executeAsUser("rollAbility", roller.id, args));
    } catch (error) {
      console.error("Mount Ironrot | CON save request failed", error);
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
    const pendingActors = actors.filter(actor => !resolved.has(actor.uuid));
    const missingRolls = pendingActors.filter(actor => !(actor.uuid in state.hourRolls));
    if (missingRolls.length) {
      await publishStatus(state, "Saving throws", `Hour ${hour}: waiting for party Constitution saves.`);
      // Save each finished roll immediately, even if a later player cancels.
      await Promise.all(missingRolls.map(async actor => {
        const total = await conSave(actor, dc);
        state.hourRolls[actor.uuid] = total;
        await publishStatus(state, "Saving throws", `${actor.name} submitted a Constitution save.`);
      }));
      await saveState(state);
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
        const selected = !done && ["choose", "accept", "exhaust"].includes(state.hourDecisions[id])
          ? state.hourDecisions[id] : (hasRoll && !failed ? "accept" : "choose");
        const choices = [
          ["choose", "Choose action"], ["accept", hasRoll && !failed ? "Accept success" : "Accept / waive Exhaustion"],
          ["exhaust", "Apply +1 Exhaustion"], ["reroll", "Reroll CON"]
        ];
        const decision = done ? `<span style="color:${UI.green};">Saved</span>` :
          `<select name="decision-${esc(id)}">${choices.map(([v, label]) =>
            `<option value="${v}" ${v === selected ? "selected" : ""}>${label}</option>`).join("")}</select>`;
        const rollColor = done ? UI.blue : !hasRoll ? UI.amber : failed ? UI.red : UI.green;
        const exhaustionColor = oldEx > 0 ? UI.red : UI.muted;
        return `<tr style="border-bottom:1px solid ${UI.border};"><td style="padding:7px 4px;">${esc(actor.name)}</td>` +
          `<td style="padding:7px 4px;color:${rollColor};font-weight:600;">${hasRoll ? total : "—"} (${verdict})</td>` +
          `<td style="padding:7px 4px;color:${exhaustionColor};">${oldEx}${!done && selected === "exhaust" ? ` → ${Math.min(6,oldEx+1)}` : ""}</td>` +
          `<td style="padding:7px 4px;">${decision}</td></tr>`;
      }).join("");
      await publishStatus(state, "GM review", `Hour ${hour}: waiting for GM rulings.`);
      const answer = await Dialog.wait({
        window: { title: `Mount Ironrot | Day ${state.day} · Hour ${hour} · Party CON DC ${dc}` },
        render: colorButtons,
        position: { width: 760 },
        content: `<div style="background:#232b32;color:#eeeaf1;padding:10px;display:grid;gap:9px;">
          <div style="display:flex;gap:7px;flex-wrap:wrap;">${stat("DAY", state.day, UI.blue)}${stat("TRAVEL HOUR", hour, UI.blue)}${stat("CON SAVE DC", dc, UI.amber)}</div>
          <div>All PCs are shown here. Select a ruling for each unresolved PC. Rerolls are processed together, then this panel reopens with updated totals. Other selected decisions are preserved.</div>
          <div style="overflow-x:auto"><table style="width:100%"><thead><tr><th>Character</th><th>Roll</th><th>Exhaustion</th><th>Decision</th></tr></thead><tbody>${rows}</tbody></table></div>
          <small>Fate Coins and Inspiration are handled manually. Applying +1 updates the character sheet; confirmed rulings are saved to the world ledger. No time advances until all PCs have been resolved.</small>
        </div>`,
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
        await Promise.all(rerolls.map(async actor => {
          state.hourRolls[actor.uuid] = await conSave(actor, dc);
          state.hourRerolls[actor.uuid] = (state.hourRerolls[actor.uuid] ?? 0) + 1;
          // The rerolled character must receive a fresh ruling on the new total.
          delete state.hourDecisions[actor.uuid];
        }));
        await publishStatus(state, "GM review", "Reroll results received; GM is reviewing the party.");
        continue;
      }
      for (const actor of unresolved) {
        const decision = selections[actor.uuid];
        if (decision === "exhaust") {
          const current = Number(foundry.utils.getProperty(actor, "system.attributes.exhaustion")) || 0;
          const next = Math.min(6, current + 1);
          if (current >= 6) { warn(`${actor.name} already has 6 levels of Exhaustion; GM must resolve manually.`); return false; }
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
      day: state.day, hour, dc,
      results: actors.map(actor => ({
        uuid: actor.uuid, name: actor.name,
        total: Number.isFinite(state.hourRolls?.[actor.uuid]) ? state.hourRolls[actor.uuid] : null,
        passed: Number.isFinite(state.hourRolls?.[actor.uuid]) && state.hourRolls[actor.uuid] >= dc,
        rerolls: state.hourRerolls?.[actor.uuid] ?? 0,
        outcome: state.hourOutcomes?.[actor.uuid] ?? "GM resolved"
      }))
    });
    state.hours += 1;
    state.pending -= 1;
    state.hourResolved = [];
    state.hourRolls = {};
    state.hourDecisions = {};
    state.hourOutcomes = {};
    state.hourRerolls = {};
    if (state.pending === 0) state.hexes += 1;
    await saveState(state);
    await reportLedger(state, `Completed forced-march hour ${hour}, DC ${dc}.`);
    return true;
  }

  async function finishTravel(hours, existingState, isResume) {
    // On a new hex, persist all rolled hours immediately. On resume, those
    // hours are already recorded as unfinished, and MUST NOT be appended again.
    const state = { ...existingState };
    if (!isResume) {
      state.pending = hours;
      state.hourResolved = [];
      state.hourRolls = {};
    state.hourDecisions = {};
      state.hourOutcomes = {};
      state.hourRerolls = {};
      await saveState(state);
    }
    if (!state.pending) return true;
    await publishStatus(state, "Travel in progress", "Crossing the current hex.");

    const safe = Math.min(state.pending, Math.max(0, 8 - state.hours));
    if (safe > 0) {
      state.hours += safe;
      state.pending -= safe;
      if (state.pending === 0) state.hexes += 1;
      await saveState(state);
      await reportLedger(state, `${safe} safe travel hour(s) completed.`);
    }

    while (state.pending > 0) {
      const nextHour = state.hours + 1;
      const dc = 10 + nextHour - 8;
      const inProgress = (Array.isArray(state.hourResolved) && state.hourResolved.length > 0) || Object.keys(state.hourRolls ?? {}).length > 0;
      const choice = inProgress ? "continue" : await Dialog.wait({
        window: { title: `Mount Ironrot | Forced March · Hour ${nextHour}` },
        render: colorButtons,
        position: { width: 455 },
        content: `<div style="padding:10px;background:#232b32;color:#eeeaf1;display:grid;gap:8px;">
          <div style="display:flex;gap:7px;flex-wrap:wrap;">${stat("DAY", state.day, UI.blue)}${stat("NEXT HOUR", nextHour, UI.blue)}${stat("CON SAVE DC", dc, UI.amber)}</div>
          <div>Today completed: ${tint(`${state.hours} h`, state.hours >= 8 ? UI.amber : UI.green)} · Remaining in hex: ${tint(`${state.pending} h`, UI.amber)}</div>
          <div>Continue for ${tint(`hour ${nextHour}`, UI.blue)}? Every PC makes a ${tint(`CON save DC ${dc}`, UI.amber)} at the end of the hour.</div>
          <small>Stop and carry ${state.pending} unfinished hour(s) to the following day, or advance one hour and resolve saves. You will be prompted again for the next hour.</small>
        </div>`,
        buttons: [
          { action: "continue", label: `Continue Hour ${nextHour}`, default: true, callback: () => "continue" },
          { action: "store", label: "Stop · Carry to Next Day", callback: () => "store" },
          { action: "cancel", label: "Cancel / Exit", callback: () => "cancel" }
        ], close: () => "cancel"
      });
      if (choice === "cancel" || !choice) {
        ui.notifications.info(`Mount Ironrot: Prompt canceled. Ledger preserved on Day ${state.day}; ${state.pending} hour(s) remain in this hex.`);
        return false;
      }
      if (choice === "store") {
        await publishStatus(state, "Travel stopped", `Party stops on Day ${state.day}; ${state.pending} hour(s) deferred.`);
        ui.notifications.info(`Mount Ironrot: ${state.pending} unfinished hour(s) saved. Start next day when ready.`);
        return true;
      }
      await publishStatus(state, "Forced march", `Party chose to continue hour ${nextHour}.`);
      if (!(await forcedHour(state))) {
        ui.notifications.warn(`Mount Ironrot: Hour ${nextHour} paused. Resume the macro to finish unresolved CON saves before traveling further.`);
        return false;
      }
    }
    ui.notifications.info(`Mount Ironrot: hex complete; Day ${state.day} travel ${state.hours} hours.`);
    return true;
  }

  if (resuming) {
    globalThis[LOCK] = true;
    try { await finishTravel(travelState.pending, travelState, true); }
    finally { globalThis[LOCK] = false; }
    return;
  }

  const input = await Dialog.wait({
    window: { title: "Mount Ironrot | Hex Travel" },
    position: { width: 440 },
    content: `<div style="background:#232b32;border-left:4px solid #9984aa;border-radius:5px;padding:10px;color:#eeeaf1;display:grid;gap:7px;">
      <div style="font-size:11px;letter-spacing:1.1px;color:#d6c4e0;">MOUNT IRONROT · ONE HEX</div>
      <label style="display:grid;grid-template-columns:90px 1fr;gap:6px;align-items:center;">Pace
        <select name="pace"><option value="fast">Fast (75%)</option><option selected value="normal">Normal (100%)</option><option value="slow">Slow (150%)</option></select></label>
      <label style="display:grid;grid-template-columns:90px 1fr;gap:6px;align-items:center;">Navigator
        <select name="navigator">${actorOptions}</select></label>
      <label style="display:grid;grid-template-columns:90px 1fr;gap:6px;align-items:center;">Rolls on
        <select name="navRoller">${rollerOptions(initialNav)}</select></label>
      <div style="border-top:1px solid #4f515d;margin-top:2px;"></div>
      <label style="display:grid;grid-template-columns:90px 1fr;gap:6px;align-items:center;">Secondary
        <select name="activity">${activityOptions}</select></label>
      <label data-ironrot-secondary style="display:none;grid-template-columns:90px 1fr;gap:6px;align-items:center;">Secondary PC
        <select name="secondary">${secondaryOptions(initialNav.uuid)}</select></label>
      <label data-ironrot-secondary style="display:none;grid-template-columns:90px 1fr;gap:6px;align-items:center;">Rolls on
        <select name="secRoller">${rollerOptions(initialSecondary)}</select></label>
      <div data-ironrot-secondary style="display:none;font-size:11px;color:#cdb9d7;">The secondary PC must be different from the navigator. The same user may roll for either PC if authorized.</div>
      <div style="font-size:11px;color:#bac9cb;">Midi-QOL prompts the roller directly. No time roll until checks finish.</div>
    </div>`,
    render: (event, dialog) => {
      colorButtons(event, dialog);
      const form = dialog.element.querySelector("form");
      if (!form) return;
      const f = form.elements;
      const sync = () => {
        const navigator = roster.get(f.navigator.value)?.actor;
        if (navigator) {
          const prior = f.navRoller.value;
          f.navRoller.innerHTML = rollerOptions(navigator);
          if ([...f.navRoller.options].some(o => o.value === prior)) f.navRoller.value = prior;
        }
        // Always filter out the navigator when building the secondary PC list.
        // Preserve the GM's secondary selection where it is still eligible.
        const priorSecondary = f.secondary.value;
        f.secondary.innerHTML = secondaryOptions(f.navigator.value);
        if ([...f.secondary.options].some(option => option.value === priorSecondary)) {
          f.secondary.value = priorSecondary;
        }
        if (f.activity.value !== "none" && !f.secondary.options.length) f.activity.value = "none";
        const active = f.activity.value !== "none";
        for (const row of form.querySelectorAll("[data-ironrot-secondary]")) {
          row.style.display = active ? "grid" : "none";
        }
        if (active) {
          const secondary = roster.get(f.secondary.value)?.actor;
          if (secondary) {
            const prior = f.secRoller.value;
            f.secRoller.innerHTML = rollerOptions(secondary);
            if ([...f.secRoller.options].some(o => o.value === prior)) f.secRoller.value = prior;
          }
        }
      };
      for (const fieldName of ["navigator", "activity", "secondary"]) f[fieldName].addEventListener("change", sync);
      sync();
    },
    buttons: [
      { action: "start", label: "Prompt Rolls", icon: "fas fa-dice-d20", default: true,
        callback: (event, button) => {
          const f = button.form.elements;
          return { pace: f.pace.value, nav: f.navigator.value, navRoller: f.navRoller.value,
            activity: f.activity.value, secondary: f.secondary.value, secRoller: f.secRoller.value };
        } },
      { action: "cancel", label: "Cancel", callback: () => null }
    ], close: () => null
  });
  if (!input) return;
  const pace = PACES[input.pace];
  const action = ACTIONS[input.activity];
  const nav = roster.get(input.nav)?.actor;
  const secondary = input.activity === "none" ? null : roster.get(input.secondary)?.actor;
  const navRoller = nav && resolveRoller(nav, input.navRoller);
  const secRoller = secondary && resolveRoller(secondary, input.secRoller);
  if (!pace || !action || !nav || !navRoller || (secondary && !secRoller)) {
    return warn("Invalid selection or the selected roller is not online / lacks Owner permission.");
  }
  if (secondary?.uuid === nav.uuid) return warn("The navigator cannot take the secondary activity. Select another character or None.");

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
      let failure;
      try {
        returned = await midiSocket.executeAsUser("rollAbility", currentRoller.id,
          midiRequest(actor, skill, isNavigation));
      } catch (err) {
        failure = err;
        console.error("Mount Ironrot | Midi remote roll error", err);
      }
      const total = totalFromRemote(returned);
      if (total !== null) return { total, roller: currentRoller };
      const choice = await Dialog.wait({
        window: { title: `Mount Ironrot | ${actor.name} Roll` },
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
  let currentCard = null;
  const smallBox = (label, body, shade = "#303a43") =>
    `<div style="background:${shade};border-radius:4px;padding:7px 8px;font-size:12px;">` +
    `<div style="font-size:10px;letter-spacing:.5px;color:#c9c5d5;margin-bottom:3px;">${esc(label).toUpperCase()}</div>${body}</div>`;
  const diceChips = (values, penalty=false) => values.map(face =>
    `<span style="display:inline-block;min-width:24px;text-align:center;padding:3px 5px;margin:0 2px;` +
    `border:1px solid ${penalty ? "#be8b87" : "#9380a5"};border-radius:5px;` +
    `background:${penalty ? "#68434a" : "#494153"};color:#fff;font-weight:700;` +
    `font-size:14px;line-height:18px;">${esc(face)}</span>`).join("");

  function renderStage({ stage, navResult=null, secResult=null, success=null,
                         decision=null, dice=null }) {
    const status = {
      started: "NAVIGATION PENDING",
      navigation: secondary ? "SECONDARY PENDING" : "GM REVIEW PENDING",
      secondary: "GM REVIEW PENDING",
      rolling: "ROLLING TRAVEL DICE",
      complete: "TRAVEL COMPLETE"
    }[stage];
    const navStatus = navResult
      ? `<strong>${navResult.total}</strong> vs DC ${DC} · ` +
        (success === null ? `<span style="color:#dec7e5;">Pending GM confirmation</span>`
          : `<strong style="color:${success ? "#b5ddc3" : "#efb3a4"};">${success ? "SUCCESS" : "FAILURE"}</strong>` +
            (decision !== "roll" ? ` <em style="font-size:11px;">(GM override)</em>` : ""))
      : `<span style="color:#c2b9ca;">Awaiting ${esc(navRoller.name)}'s roll</span>`;
    const navBlock = smallBox("Navigation · Wisdom (Survival) · DC 15",
      `${esc(nav.name)} · ${navStatus}`);
    const secBlock = !secondary
      ? `<div style="font-size:11px;color:#b9bec9;">Secondary · None</div>`
      : smallBox(`Secondary · ${action.name} · ${CONFIG.DND5E.skills[action.skill]?.label ?? action.skill}`,
        `${esc(secondary.name)} · ${secResult ? `<strong>${secResult.total}</strong> <span style="color:#b9bec9;">(GM adjudicates)</span>`
        : `<span style="color:#c2b9ca;">${navResult ? "Awaiting" : "Queued for"} ${esc(secRoller.name)}'s roll</span>`}`);
    const travelBlock = !dice
      ? `<div style="border:1px solid #5b5166;background:#302b39;border-radius:5px;padding:8px;font-size:12px;` +
        `color:#c6bdce;">TRAVEL DICE · ${stage === "rolling" ?
          `Rolling ${success ? "2d4" : "2d4 + 1d4 + 2"} …` : "Pending both checks and GM confirmation"}</div>`
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
      `<div style="font-size:10px;letter-spacing:1.2px;color:#cfbfd9;">THE MOURNLAND · EBERRON</div>` +
      `<div style="display:flex;justify-content:space-between;align-items:center;gap:5px;flex-wrap:wrap;">` +
      `<strong style="font-size:15px;color:#f3ebf7;">Mount Ironrot · Hex Travel</strong>` +
      `<span style="font-size:9px;color:${stage === "complete" ? "#b5ddc3" : "#dfcbe9"};` +
      `background:#393342;border:1px solid #71617e;border-radius:4px;padding:3px 5px;">${status}</span></div>` +
      `<div style="font-size:12px;">Pace: <strong style="color:${pace.color};">${pace.name} (${pace.percent})</strong></div>` +
      navBlock + secBlock + travelBlock + `</div>`;
  }

  async function publishStage(stageInfo, options={}) {
    const next = await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ alias: "Mount Ironrot Travel" }),
      content: renderStage(stageInfo),
      // Only the completed card is a native Roll message. This triggers one
      // Dice So Nice animation and avoids animating the same dice repeatedly.
      style: options.roll ? CONST.CHAT_MESSAGE_STYLES.ROLL : CONST.CHAT_MESSAGE_STYLES.OTHER,
      ...(options.roll ? { rolls: [options.roll] } : {}),
      flags: { world: { ironrotHexTravelV4_6: {
        version: "4.6", stage: stageInfo.stage, navActor: nav.uuid,
        secondaryActor: secondary?.uuid ?? null, pace: input.pace,
        secondaryActivity: input.activity, ...(options.details ?? {})
      } } }
    });
    const previous = currentCard;
    currentCard = next;
    if (previous) {
      // Dice So Nice normally hides a new roll chat card until its 3D dice
      // settle. Await its public completion API BEFORE removing the old card.
      // This preserves a visible progress card throughout the final animation.
      if (options.roll && game.modules.get("dice-so-nice")?.active &&
          typeof game.dice3d?.waitFor3DAnimationByMessageID === "function") {
        try {
          await game.dice3d.waitFor3DAnimationByMessageID(next.id);
        } catch (error) {
          // A dice animation error must not erase the completed journey.
          console.warn("Mount Ironrot | Dice So Nice wait failed", error);
        }
      }
      try { await previous.delete(); }
      catch (error) {
        console.warn("Mount Ironrot | Could not remove prior progress card", error);
        ui.notifications.warn("Mount Ironrot could not remove its prior progress card; please delete the older card manually.");
      }
    }
    return next;
  }
  async function setRollingStage(stageInfo) {
    // Update the EXISTING non-roll progress card in place, without posting
    // another message or animating any dice. It remains on screen while the
    // final native-roll message is hidden during Dice So Nice playback.
    if (!currentCard) return;
    await currentCard.update({
      content: renderStage({ ...stageInfo, stage: "rolling" }),
      "flags.world.ironrotHexTravelV4_6.stage": "rolling"
    });
  }
  async function clearProgress() {
    if (!currentCard) return;
    const prior = currentCard;
    currentCard = null;
    try { await prior.delete(); }
    catch (error) { console.warn("Mount Ironrot | Could not remove canceled progress card", error); }
  }

  globalThis[LOCK] = true;
  try {
    await publishStage({ stage: "started" });
    const navResult = await rollWithRetry(nav, navRoller, "sur", true);
    if (!navResult) { await clearProgress(); return; }
    await publishStage({ stage: "navigation", navResult });
    let secResult = null;
    if (secondary) {
      secResult = await rollWithRetry(secondary, secRoller, action.skill, false);
      if (!secResult) { await clearProgress(); return; }
      await publishStage({ stage: "secondary", navResult, secResult });
    }
    const autoSuccess = navResult.total >= DC;
    const decision = await Dialog.wait({
      window: { title: "Mount Ironrot | Navigation Ruling" },
      render: colorButtons,
      position: { width: 380 },
      content: `<div style="padding:9px;background:#252d35;color:#efe9f1;border-left:3px solid #ac91bc;display:grid;gap:8px;">
        <div><strong>${esc(nav.name)}</strong> · Survival ${tint(navResult.total, autoSuccess ? UI.green : UI.red)} vs ${tint(`DC ${DC}`, UI.amber)} · ${tint(autoSuccess ? "SUCCESS" : "FAILURE", autoSuccess ? UI.green : UI.red)}</div>
        ${secondary ? `<div style="font-size:12px;">${esc(secondary.name)} · ${esc(action.name)} <strong>${secResult.total}</strong> (GM adjudicates)</div>` : ""}
        <label>Navigation outcome
          <select name="ruling"><option value="roll">Use roll (${autoSuccess ? "Success" : "Failure"})</option>
          <option value="success">Override: Success</option><option value="failure">Override: Failure</option></select></label>
        <small>Travel time is rolled only when you confirm.</small>
      </div>`,
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
      throw new Error("Unexpected Mount Ironrot dice terms. Expected 2d4 + (optional) 1d4+2.");
    }
    const base = baseDice.reduce((sum, face) => sum + face, 0);
    const delay = success ? 0 : lostDie[0] + 2;
    const adjusted = Math.ceil(base * pace.multiplier);
    const hours = adjusted + delay;
    await publishStage({ stage: "complete", navResult, secResult, success, decision,
      dice: { baseDice, lostDie, base, adjusted, delay, hours } },
      { roll: travelRoll, details: {
        navigator: nav.name, navigationTotal: navResult.total, navigationSuccess: success,
        base, delay, totalHours: hours, secondaryTotal: secResult?.total ?? null
      } });
    await finishTravel(hours, travelState, false);
  } catch (error) {
    // No abandoned "in progress" cards when a prompt or calculation fails.
    await clearProgress();
    throw error;
  } finally {
    globalThis[LOCK] = false;
  }
})().catch(err => {
  console.error("Mount Ironrot | v4.13 Hourly Forced March", err);
  ui.notifications.error("Mount Ironrot travel stopped. Open F12 for details; unfinished progress card was removed.");
});