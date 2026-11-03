/** Foundry/Midi-QOL workflow for the two remaining paired expedition activities.
 * Uses only the frozen context saved on a Hex Travel record. This workflow does
 * not alter travel hours, world time, Exhaustion, Travel Quality, Momentum,
 * Threat, supplies, or Events.
 */
import { MODULE_ID } from "../../constants/module-constants.js";
import { EXPEDITION_ROLES } from "./HexTravelRoles.js";
import { buildRolePhasePlan, buildRolePhaseResolution, EXPEDITION_ROLE_PHASES } from "./HexExpeditionRoleResolution.js";
import { cloneHexRecordStore, saveHexRolePhase } from "./HexTravelRecords.js";

const LEDGER_KEY = "hexTravelLedger";
const PHASE_ORDER = Object.freeze(["reconnaissance", "support"]);
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);
const clone = value => typeof globalThis.structuredClone === "function"
  ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const SKILL_FALLBACK = Object.freeze({
  ath: "Athletics", inv: "Investigation", per: "Persuasion", ste: "Stealth", sur: "Survival"
});
function skillLabel(skill) {
  const raw = globalThis.CONFIG?.DND5E?.skills?.[skill]?.label;
  if (raw) {
    const localized = game.i18n?.localize?.(raw);
    return localized || raw;
  }
  return SKILL_FALLBACK[skill] ?? String(skill ?? "Check").toUpperCase();
}

function ledger() {
  const value = game.settings.get(MODULE_ID, LEDGER_KEY) ?? {};
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Saved Hex Travel ledger is malformed.");
  return clone(value);
}
function recordFrom(value, id) {
  return cloneHexRecordStore(value.hexRecords).records.find(record => record.id === id) ?? null;
}
function unresolved(record, phase) {
  return record?.status !== "interrupted" && record?.phases?.[phase] !== "completed";
}
function availableRecords(value) {
  return cloneHexRecordStore(value.hexRecords).records
    .filter(record => record.status !== "interrupted" && PHASE_ORDER.some(phase => unresolved(record, phase)))
    .sort((a, b) => (b.number ?? 0) - (a.number ?? 0));
}
async function actorFromUuid(uuid) {
  if (!uuid) return null;
  try {
    if (typeof globalThis.fromUuid === "function") {
      const document = await globalThis.fromUuid(uuid);
      if (document?.documentName === "Actor" || document?.type === "character") return document;
    }
  } catch (error) { console.warn("[ZFT][HexTravel] Could not resolve role Actor by UUID", uuid, error); }
  const id = String(uuid).split(".").at(-1);
  return game.actors?.get?.(id) ?? null;
}
function resolveRoller(actor) {
  const owner = game.users.players.find(user => user.active && user.character?.uuid === actor.uuid &&
    actor.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER));
  return owner ?? game.users.players.find(user => user.active &&
    actor.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) ?? game.user;
}
function requestDetails(actor, skill, dc, midiVersion) {
  const modern = foundry.utils.isNewerVersion(midiVersion, "13.0.43");
  if (modern) return {
    saveDetails: {
      actorUuid: actor.uuid, rollType: "skill", rollAbilities: [], rollSkills: [skill], rollTools: [],
      advantage: false, disadvantage: false, isMagicSave: false, isFriendly: true,
      rollDC: dc, saveItemUuid: "", workflowOptions: {}, workflowId: "", itemCardUuid: "", itemId: ""
    },
    displayOptions: { fastForward: false, chatMessage: true, rollMode: "publicroll", showTargetDC: true }
  };
  return {
    targetUuid: actor.uuid, request: "skill", skill, rollDC: dc,
    advantage: false, disadvantage: false,
    options: { fastForward: false, chatMessage: true, rollMode: "publicroll" }
  };
}
function totalFromRemote(value) {
  if (Array.isArray(value)) return value.length ? totalFromRemote(value[0]) : null;
  if (!value || typeof value !== "object") return null;
  if (Number.isFinite(value.total)) return value.total;
  if (value.rolls?.length) return totalFromRemote(value.rolls);
  if (value._total != null && Number.isFinite(Number(value._total))) return Number(value._total);
  return null;
}
async function waitForNativeRollPresentation(value, observedMessageId = null) {
  if (!game.modules.get("dice-so-nice")?.active || typeof game.dice3d?.waitFor3DAnimationByMessageID !== "function") return;
  const first = Array.isArray(value) ? value[0] : value;
  const raw = first?.messageId ?? first?.messageID ?? first?.chatMessageId ?? first?.chatMessage?.id ?? observedMessageId;
  const messageId = typeof raw === "string" ? raw : null;
  if (!messageId || (game.messages?.get && !game.messages.get(messageId))) return;
  try { await game.dice3d.waitFor3DAnimationByMessageID(messageId); }
  catch (error) { console.warn("[ZFT][HexTravel] Role-check dice animation unavailable", error); }
}
function stillAvailable(recordId, phase) {
  const current = recordFrom(ledger(), recordId);
  return !!current && unresolved(current, phase);
}

async function requestRoleRoll({ recordId, phase, slot, actor, dc, socket, midiVersion, registerPending, unregisterPending }) {
  let roller = resolveRoller(actor);
  let attempt = 0;
  const key = `hex-role:${recordId}:${phase}:${slot.role}:${actor.uuid}`;
  while (true) {
    if (!stillAvailable(recordId, phase)) throw new Error(`${EXPEDITION_ROLE_PHASES[phase].name} changed before the roll completed.`);
    attempt += 1;
    let choose;
    const decision = new Promise(resolve => { choose = resolve; });
    const token = registerPending?.({
      key, actorName: actor.name, rollerId: roller.id, rollerName: roller.name,
      label: `${slot.roleName} · ${skillLabel(slot.skill)} · DC ${dc}`, attempt, choose
    });
    let observedMessageId = null;
    const hookId = typeof Hooks?.on === "function" ? Hooks.on("createChatMessage", message => {
      const author = message?.author?.id;
      if (message?.isRoll && message?.speaker?.actor === actor.id && author === roller.id) observedMessageId = message.id;
    }) : null;
    const remote = Promise.resolve().then(() => socket.executeAsUser("rollAbility", roller.id,
      requestDetails(actor, slot.skill, dc, midiVersion)))
      .then(value => ({ type: "result", value }), error => ({ type: "error", error }));
    let outcome;
    try { outcome = await Promise.race([remote, decision]); }
    finally {
      if (hookId !== null && typeof Hooks?.off === "function") Hooks.off("createChatMessage", hookId);
      unregisterPending?.(key, token);
    }
    if (!stillAvailable(recordId, phase)) throw new Error(`${EXPEDITION_ROLE_PHASES[phase].name} changed while the roll was pending.`);
    if (outcome?.type === "cancel") return null;
    if (outcome?.type === "resend") continue;
    if (outcome?.type === "gm") { roller = game.user; continue; }
    if (outcome?.type === "error") throw outcome.error;
    const total = totalFromRemote(outcome?.value);
    if (total === null) throw new Error(`${actor.name}'s ${slot.roleName} check did not return a usable total.`);
    await waitForNativeRollPresentation(outcome.value, observedMessageId);
    return { total, rollerId: roller.id };
  }
}

async function persistPhase(recordId, phase, resolution) {
  const currentLedger = ledger();
  const currentRecord = recordFrom(currentLedger, recordId);
  if (!currentRecord) throw new Error("The selected hex record no longer exists.");
  if (!unresolved(currentRecord, phase)) throw new Error(`${EXPEDITION_ROLE_PHASES[phase].name} was already resolved by another operation.`);
  const hexRecords = saveHexRolePhase(currentLedger.hexRecords, recordId, phase, resolution);
  await game.settings.set(MODULE_ID, LEDGER_KEY, { ...currentLedger, hexRecords });
}

async function chooseRecord(records, prompt) {
  if (records.length === 1) return records[0];
  const options = records.map(record => {
    const place = [record.context?.identity?.region, record.context?.identity?.world].filter(Boolean).join(" · ");
    const phases = PHASE_ORDER.filter(phase => unresolved(record, phase)).map(phase => EXPEDITION_ROLE_PHASES[phase].name).join(" + ");
    return `<option value="${esc(record.id)}">Hex ${record.number}${place ? ` · ${esc(place)}` : ""} · ${esc(phases)}</option>`;
  }).join("");
  const selected = await prompt({
    window: { title: "Resolve Expedition Role Checks" }, position: { width: 520 },
    content: `<section class="zft-hex-role-select"><p>Select the saved hex whose remaining expedition role checks should be resolved.</p><label><span>Hex record</span><select name="recordId">${options}</select></label><small>The saved party, assignments, and DC from that hex are used. Current role edits do not rewrite history.</small></section>`,
    buttons: [
      { action: "continue", label: "Resolve Role Checks", icon: "fas fa-dice-d20", default: true,
        callback: (_event, button) => button.form.elements.recordId.value },
      { action: "cancel", label: "Cancel", callback: () => null }
    ], close: () => null
  });
  return records.find(record => record.id === selected) ?? null;
}

function reviewRows(plan, rolls) {
  return plan.slots.map(slot => {
    if (slot.status === "unassigned") return `<div class="zft-hex-role-ruling-row is-unavailable"><div><strong>${esc(slot.roleName)}</strong><span>Unassigned for this hex</span></div><span class="zft-hex-role-ruling-empty">No check</span></div>`;
    if (slot.status === "absent") return `<div class="zft-hex-role-ruling-row is-unavailable"><div><strong>${esc(slot.roleName)}</strong><span>Assigned character was not present when this hex started</span></div><span class="zft-hex-role-ruling-empty">No check</span></div>`;
    const roll = rolls[slot.role];
    const passed = Number(roll?.total) >= plan.dc;
    return `<div class="zft-hex-role-ruling-row" data-hex-role-ruling-row="${esc(slot.role)}">
      <div class="zft-hex-role-ruling-identity"><strong>${esc(slot.actorName)} · ${esc(slot.roleName)}</strong><span>${esc(skillLabel(slot.skill))} ${Number(roll.total)} vs DC ${plan.dc} · Rolled ${passed ? "Success" : "Failure"}</span></div>
      <select name="ruling-${esc(slot.role)}" aria-label="GM ruling for ${esc(slot.roleName)}">
        <option value="roll">Use Roll (${passed ? "Success" : "Failure"})</option>
        <option value="success">Count as Success</option>
        <option value="failure">Count as Failure</option>
      </select></div>`;
  }).join("");
}

async function resolvePhase(recordId, phase, prompt, registerPending, unregisterPending) {
  const current = recordFrom(ledger(), recordId);
  if (!current || !unresolved(current, phase)) return false;
  const plan = buildRolePhasePlan(current, phase);
  const ready = plan.slots.filter(slot => slot.status === "ready");
  const actors = new Map();
  for (const slot of ready) {
    const actor = await actorFromUuid(slot.actorUuid);
    if (!actor || actor.type !== "character") throw new Error(`${slot.actorName ?? slot.roleName} is no longer available as a D&D5e character Actor.`);
    actors.set(slot.role, actor);
  }
  const midi = game.modules.get("midi-qol");
  const socket = globalThis.MidiQOL?.socket?.();
  if (ready.length && (!midi?.active || typeof socket?.executeAsUser !== "function"))
    throw new Error("Active Midi-QOL with its remote roll socket is required for expedition role checks.");

  const rolls = {};
  if (ready.length) {
    const outcomes = await Promise.all(ready.map(async slot => ({
      role: slot.role,
      result: await requestRoleRoll({ recordId, phase, slot, actor: actors.get(slot.role), dc: plan.dc,
        socket, midiVersion: midi.version, registerPending, unregisterPending })
    })));
    if (outcomes.some(outcome => !outcome.result)) {
      ui.notifications.info(`${plan.name} canceled. No ${plan.name} result was saved.`);
      return false;
    }
    for (const outcome of outcomes) rolls[outcome.role] = outcome.result;
  }

  if (!stillAvailable(recordId, phase)) throw new Error(`${plan.name} changed before GM review.`);
  let rulings = {};
  if (ready.length) {
    const answer = await prompt({
      window: { title: `${plan.name} Ruling` }, position: { width: 690 },
      content: `<section class="zft-hex-role-review"><div class="zft-hex-role-review-heading"><strong>Hex ${plan.recordNumber} · ${esc(plan.name)}</strong><span>Role DC ${plan.dc}</span></div><p>Review each native skill roll. GM overrides affect the saved effective outcome but never replace the original total.</p><div class="zft-hex-role-ruling-list">${reviewRows(plan, rolls)}</div></section>`,
      buttons: [
        { action: "confirm", label: "Save Role Results", icon: "fas fa-check", default: true,
          callback: (_event, button) => Object.fromEntries(ready.map(slot => [slot.role, button.form.elements[`ruling-${slot.role}`].value])) },
        { action: "cancel", label: "Cancel", callback: () => null }
      ], close: () => null
    });
    if (!answer) {
      ui.notifications.info(`${plan.name} review canceled. No ${plan.name} result was saved.`);
      return false;
    }
    rulings = answer;
  }
  const resolution = buildRolePhaseResolution(plan, rolls, rulings, Date.now());
  await persistPhase(recordId, phase, resolution);
  ui.notifications.info(`Hex ${plan.recordNumber} ${plan.name}: ${resolution.grade === "strong" ? "Strong" : resolution.grade === "partial" ? "Partial" : resolution.grade === "failure" ? "Failed" : "No assigned checks"}. Saved to Expedition Roles.`);
  return true;
}

/** Resolve every still-pending paired activity for one selected saved hex. */
export async function resolveHexTravelRolePhases({ prompt, registerPending, unregisterPending } = {}) {
  if (!game.user?.isGM) throw new Error("Only a GM can resolve expedition role checks.");
  if (game.system?.id !== "dnd5e") throw new Error("Expedition role checks require D&D5e.");
  if (typeof prompt !== "function") throw new Error("Expedition GM prompt service is unavailable.");
  const records = availableRecords(ledger());
  if (!records.length) {
    ui.notifications.info("No saved hex is waiting for Reconnaissance or Expedition Support.");
    return null;
  }
  const record = await chooseRecord(records, prompt);
  if (!record) return null;
  let saved = 0;
  for (const phase of PHASE_ORDER) {
    if (!unresolved(recordFrom(ledger(), record.id), phase)) continue;
    if (!await resolvePhase(record.id, phase, prompt, registerPending, unregisterPending)) break;
    saved += 1;
  }
  return { recordId: record.id, recordNumber: record.number, saved };
}
