/**
 * Mount Ironrot Hex Travel — v4.2 Direct Midi-QOL + Progressive Chat Card
 * Foundry VTT V13 / dnd5e 5.2.x / Midi-QOL v13
 * SCRIPT MACRO. Run as GM; no extra module needed.
 *
 * Midi-QOL socket API: MidiQOL.socket().executeAsUser("rollAbility", userId, args)
 * The designated user's native Midi-integrated skill dialog opens automatically.
 * No chat request or player macro is involved. All rolls are explicitly non-fast-forwarded.
 * Requires a connected user with Owner permission or falls back to the GM.
 *
 * The GM creates a progressive public chat card before requesting skill checks.
 * Each stage creates a NEW card, then removes the prior progress card, so the
 * current stage is the newest chat message. Intermediate cards have NO rolls.
 *
 * One combined Foundry Roll contains 2d4 travel dice and, on navigation
 * failure, an additional 1d4+2. All three d4s appear in the same native
 * dice result, and the card labels each die's purpose. Dice So Nice can animate
 * every die without duplicate separate chat rolls.
 * No duplicate manual game.dice3d.showForRoll calls or extra travel-roll messages.
 * This is a Chapter 4 single-hex travel aid. Secondary action effects are GM adjudicated.
 * Does not advance the Foundry clock or automatically spend resources.
 */
(async () => {
  const DC = 15;
  const LOCK = "__ZRF_IRONROT_DIRECT_MIDI_V4_ACTIVE__"; // Reuse lock with earlier v4 editions.
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

  // A progress card is intentionally RECREATED at each checkpoint. In V13,
  // ChatMessage.update() changes content in place but doesn't bump its order.
  // Creating the newest card first and then deleting the previous one keeps the
  // current journey near the bottom of chat without any custom player module.
  // It does not force-scroll someone who deliberately scrolled away.
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
        `color:#c6bdce;">TRAVEL DICE · Pending both checks and GM confirmation</div>`
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
      flags: { world: { ironrotHexTravelV4_2: {
        version: "4.2", stage: stageInfo.stage, navActor: nav.uuid,
        secondaryActor: secondary?.uuid ?? null, pace: input.pace,
        secondaryActivity: input.activity, ...(options.details ?? {})
      } } }
    });
    const previous = currentCard;
    currentCard = next;
    if (previous) {
      try { await previous.delete(); }
      catch (error) {
        console.warn("Mount Ironrot | Could not remove prior progress card", error);
        ui.notifications.warn("Mount Ironrot could not remove its prior progress card; please delete the older card manually.");
      }
    }
    return next;
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
    if (!decision) { await clearProgress(); return; }
    const success = decision === "roll" ? autoSuccess : decision === "success";
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
    ui.notifications.info(`Mount Ironrot: ${hours} hours to cross the hex.`);
  } catch (error) {
    // No abandoned "in progress" cards when a prompt or calculation fails.
    await clearProgress();
    throw error;
  } finally {
    globalThis[LOCK] = false;
  }
})().catch(err => {
  console.error("Mount Ironrot | v4.2 Progressive Travel", err);
  ui.notifications.error("Mount Ironrot travel stopped. Open F12 for details; unfinished progress card was removed.");
});