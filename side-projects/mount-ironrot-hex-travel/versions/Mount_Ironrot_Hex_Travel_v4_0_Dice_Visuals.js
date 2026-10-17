/**
 * Mount Ironrot Hex Travel — v4 Direct Midi-QOL + Visible Travel Dice
 * Foundry VTT V13 / dnd5e 5.2.x / Midi-QOL v13
 * SCRIPT MACRO. Run as GM; no extra module needed.
 *
 * Midi-QOL socket API: MidiQOL.socket().executeAsUser("rollAbility", userId, args)
 * The designated user's native Midi-integrated skill dialog opens automatically.
 * No chat request or player macro is involved. All rolls are explicitly non-fast-forwarded.
 * Requires a connected user with Owner permission or falls back to the GM.
 *
 * The 2d4 travel dice and failed-navigation 1d4+2 penalty are real evaluated
 * Roll objects attached to ONE public ChatMessage. This triggers ordinary
 * Foundry roll display and Dice So Nice animations (when that module is active).
 * No duplicate manual game.dice3d.showForRoll calls or extra chat-roll messages.
 * This is a Chapter 4 single-hex travel aid. Secondary action effects are GM adjudicated.
 * Does not advance the Foundry clock or automatically spend resources.
 */
(async () => {
  const DC = 15;
  const LOCK = "__ZRF_IRONROT_DIRECT_MIDI_V4_ACTIVE__";
  const PACES = {
    fast:   { name: "Fast",   multiplier: 0.75, percent: "75%",  color: "#b7d2cf" },
    normal: { name: "Normal", multiplier: 1.00, percent: "100%", color: "#e6d4bb" },
    slow:   { name: "Slow",   multiplier: 1.50, percent: "150%", color: "#d7bee6" }
  };
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
  const activityOptions = Object.entries(ACTIONS).map(([id, info]) =>
    `<option value="${esc(id)}">${esc(info.name)}${info.skill ? ` (${esc(CONFIG.DND5E.skills[info.skill]?.label ?? info.skill)})` : ""}</option>`
  ).join("");
  const initialNav = actors[0];
  const initialSecondary = actors.find(a => a.uuid !== initialNav.uuid) ?? initialNav;

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
      <label data-ironrot-secondary style="display:none;grid-template-columns:90px 1fr;gap:6px;align-items:center;">Character
        <select name="secondary">${actors.map(a => `<option value="${esc(a.uuid)}" ${a.uuid === initialSecondary.uuid ? "selected" : ""}>${esc(a.name)}</option>`).join("")}</select></label>
      <label data-ironrot-secondary style="display:none;grid-template-columns:90px 1fr;gap:6px;align-items:center;">Rolls on
        <select name="secRoller">${rollerOptions(initialSecondary)}</select></label>
      <div style="font-size:11px;color:#bac9cb;">Midi-QOL prompts the roller directly. No time roll until checks finish.</div>
    </div>`,
    render: (event, dialog) => {
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
        if (f.activity.value !== "none" && actors.length < 2) f.activity.value = "none";
        if (f.activity.value !== "none" && f.secondary.value === f.navigator.value) {
          f.secondary.value = actors.find(a => a.uuid !== f.navigator.value)?.uuid ?? f.secondary.value;
        }
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
        position: { width: 385 },
        content: `<p>The ${esc(CONFIG.DND5E.skills[skill]?.label ?? skill)} roll for <strong>${esc(actor.name)}</strong> did not return a usable total${failure ? " (an error occurred)" : " (it may have been canceled)"}.</p><p>No travel time has been rolled.</p>`,
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

  globalThis[LOCK] = true;
  try {
    const navResult = await rollWithRetry(nav, navRoller, "sur", true);
    if (!navResult) return;
    let secResult = null;
    if (secondary) {
      secResult = await rollWithRetry(secondary, secRoller, action.skill, false);
      if (!secResult) return;
    }
    const autoSuccess = navResult.total >= DC;
    const decision = await Dialog.wait({
      window: { title: "Mount Ironrot | Navigation Ruling" },
      position: { width: 380 },
      content: `<div style="padding:9px;background:#252d35;color:#efe9f1;border-left:3px solid #ac91bc;display:grid;gap:8px;">
        <div><strong>${esc(nav.name)}</strong> · Survival <strong>${navResult.total}</strong> vs DC ${DC} · <strong>${autoSuccess ? "Success" : "Failure"}</strong></div>
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
    if (!decision) return;
    const success = decision === "roll" ? autoSuccess : decision === "success";
    const baseRoll = await new Roll("2d4").evaluate();
    const delayRoll = success ? null : await new Roll("1d4+2").evaluate();
    const adjusted = Math.ceil(baseRoll.total * pace.multiplier);
    const delay = delayRoll?.total ?? 0;
    const hours = adjusted + delay;
    // Faces come from the ACTUALLY evaluated roll, never from a new random number.
    // Showing these on the card gives everyone an auditable dice breakdown.
    const diceFaces = roll => roll.dice.flatMap(die => die.results
      .filter(result => result.active !== false && result.discarded !== true)
      .map(result => Number(result.result)));
    const diceChips = roll => diceFaces(roll).map(face =>
      `<span style="display:inline-block;min-width:24px;text-align:center;padding:3px 5px;margin:0 2px;` +
      `border:1px solid #9380a5;border-radius:5px;background:#494153;color:#fff;font-weight:700;` +
      `font-size:14px;line-height:18px;">${esc(face)}</span>`).join("");
    const baseFaces = diceChips(baseRoll);
    const delayFaces = delayRoll ? diceChips(delayRoll) : "";
    const secondaryLine = secondary ? `<div style="background:#313b45;border-radius:4px;padding:6px 8px;margin-bottom:7px;font-size:12px;">
      <span style="font-size:10px;letter-spacing:.5px;color:#bbcbd2;">SECONDARY · ${esc(action.name).toUpperCase()}</span><br>
      ${esc(secondary.name)} · ${esc(CONFIG.DND5E.skills[action.skill]?.label ?? action.skill)} · <strong>${secResult.total}</strong> <span style="color:#bbcbd2;">(DM adjudicates)</span></div>` : "";
    const card = `<div style="background:#222930;color:#eeeef0;border:1px solid #66727b;border-top:4px solid #a38ab6;border-radius:6px;padding:10px 12px;font-family:inherit;">
      <div style="font-size:10px;letter-spacing:1.2px;color:#cfbfd9;">THE MOURNLAND · EBERRON</div>
      <div style="font-size:16px;font-weight:700;color:#f3ebf7;margin:3px 0 8px;">Mount Ironrot · Hex Travel</div>
      <div style="background:#303a43;border-radius:4px;padding:7px 8px;margin-bottom:7px;font-size:12px;">
        <span style="font-size:10px;color:#bfcdd2;">NAVIGATION · DC 15 SURVIVAL</span><br>
        ${esc(nav.name)} · <strong style="color:${success ? "#b5ddc3" : "#efb3a4"};">${success ? "SUCCESS" : "FAILURE"}</strong> · ${navResult.total}${decision !== "roll" ? " <em>(GM override)</em>" : ""}</div>
      ${secondaryLine}
      <div style="font-size:12px;padding-bottom:5px;">Pace: <strong style="color:${pace.color};">${pace.name} (${pace.percent})</strong></div>
      <div style="border:1px solid #52606d;background:#2b3440;border-radius:5px;padding:7px 8px;">
        <div style="color:#ccbdd6;font-size:10px;letter-spacing:1px;margin-bottom:5px;">TRAVEL DICE · 2d4</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:7px;">
          <span>${baseFaces}</span>
          <strong style="font-size:16px;color:#fff;">${baseRoll.total} h</strong>
        </div>
        <div style="margin-top:6px;font-size:12px;display:flex;justify-content:space-between;gap:8px;">
          <span>${pace.name} pace (${pace.percent}), rounded up</span><strong>${adjusted} h</strong>
        </div>
      </div>
      ${delayRoll ? `<div style="border:1px solid #805e67;background:#3b3037;border-radius:5px;padding:7px 8px;margin-top:6px;">
        <div style="color:#e9bdb9;font-size:10px;letter-spacing:1px;margin-bottom:5px;">LOST IN THE MIST · 1d4 + 2</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:7px;">
          <span>${delayFaces} <span style="color:#e9c9c0;font-weight:700;">+ 2</span></span>
          <strong style="font-size:16px;color:#f6c9bf;">+${delay} h</strong>
        </div>
      </div>` : `<div style="color:#b4d8bf;font-size:11px;margin-top:6px;">Navigation succeeded · no delay dice.</div>`}
      <div style="background:#393342;border:1px solid #746580;border-radius:4px;text-align:center;margin-top:7px;padding:7px;">
        <div style="color:#d1c4da;font-size:10px;letter-spacing:1px;">TOTAL · ONE HEX</div>
        <div style="font-size:23px;color:white;font-weight:700;">${hours} hours</div></div></div>`;
    // Make this a genuine Foundry ROLL message. Dice So Nice automatically
    // sees roll data on public chat messages and animates the d4s for everyone
    // whose dice visibility settings allow it. Do not manually call showForRoll:
    // that would play the dice twice.
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ alias: "Mount Ironrot Travel" }),
      content: card,
      style: CONST.CHAT_MESSAGE_STYLES.ROLL,
      rolls: delayRoll ? [baseRoll, delayRoll] : [baseRoll],
      flags: { world: { ironrotHexTravelDirectV4Dice: {
        navActor: nav.uuid, navigator: nav.name, pace: input.pace,
        navigationTotal: navResult.total, navigationSuccess: success,
        base: baseRoll.total, delay, totalHours: hours,
        secondaryActor: secondary?.uuid ?? null, secondaryActivity: input.activity,
        secondaryTotal: secResult?.total ?? null
      } } }
    });
    ui.notifications.info(`Mount Ironrot: ${hours} hours to cross the hex.`);
  } finally {
    globalThis[LOCK] = false;
  }
})().catch(err => {
  console.error("Mount Ironrot | Midi Direct Roll", err);
  ui.notifications.error("Mount Ironrot travel stopped. Open F12 for details; no completed travel card was posted.");
});