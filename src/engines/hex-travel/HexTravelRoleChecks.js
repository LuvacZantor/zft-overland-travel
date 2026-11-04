/** GM-initiated, situational expedition checks.
 * The Guide remains exclusively on the established Start / Continue navigation
 * path. None of these other five checks changes the travel ledger, clock,
 * Exhaustion, Momentum, Threat or supplies. GM adjudicates consequences.
 */
import { MODULE_ID } from "../../constants/module-constants.js";
import { EXPEDITION_PAIRS, EXPEDITION_ROLES } from "./HexTravelRoles.js";

const SKILL_LABELS = Object.freeze({
  sur: "Survival", ath: "Athletics", acr: "Acrobatics", prc: "Perception",
  ste: "Stealth", inv: "Investigation", nat: "Nature", per: "Persuasion",
  ins: "Insight", med: "Medicine"
});
const esc = value => String(value ?? "").replace(/[&<>"']/g, value => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[value]);

export function situationalRoleKeys() {
  return EXPEDITION_PAIRS.flatMap(pair => pair.roles).filter(id => id !== "guide");
}

export function validateSituationalRoleCheck({ role, skill, dc } = {}) {
  const config = EXPEDITION_ROLES[role];
  if (!config || role === "guide" || !situationalRoleKeys().includes(role))
    throw new Error("Choose an assigned situational role. The Guide rolls via Start / Continue.");
  if (!config.skills?.includes(skill))
    throw new Error(`The ${config.name} role does not offer that skill for a situational check.`);
  const score = typeof dc === "string" && dc.trim() === "" ? NaN : Number(dc);
  if (!Number.isSafeInteger(score) || score < 1 || score > 30)
    throw new Error("Role-check DC must be a whole number from 1 to 30.");
  return { role, skill, dc: score, category: EXPEDITION_PAIRS.find(pair => pair.roles.includes(role)).name };
}

function nameForSkill(skill) {
  const localized = CONFIG.DND5E?.skills?.[skill]?.label;
  return (typeof localized === "string" && (game.i18n?.localize?.(localized) ?? localized)) || SKILL_LABELS[skill] || skill;
}
function nativeTotal(value) {
  if (Array.isArray(value)) return value.length ? nativeTotal(value[0]) : null;
  if (!value || typeof value !== "object") return null;
  if (Number.isFinite(value.total)) return value.total;
  if (value.rolls?.length) return nativeTotal(value.rolls);
  return value._total != null && Number.isFinite(Number(value._total)) ? Number(value._total) : null;
}
function resolveRoller(actor) {
  const owner = game.users.players.find(user => user.active && user.character?.uuid === actor.uuid &&
    actor.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER));
  return owner ?? game.users.players.find(user => user.active &&
    actor.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) ?? game.user;
}
function requestDetails(actor, skill, dc, midiVersion) {
  if (foundry.utils.isNewerVersion(midiVersion, "13.0.43")) return {
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

/** Nonblocking GM recovery; a superseded player attempt never saves its result. */
async function requestWithRecovery({ actor, skill, dc, socket, midiVersion, registerPending, unregisterPending, isCurrent }) {
  let roller = resolveRoller(actor);
  let attempt = 0;
  const key = `expedition-role:${actor.uuid}:${skill}`;
  while (true) {
    if (!isCurrent()) throw new Error("Expedition changed before the role check could finish.");
    attempt += 1;
    let choose;
    const decision = new Promise(resolve => { choose = resolve; });
    const token = registerPending({
      key, actorName: actor.name, rollerId: roller.id, rollerName: roller.name,
      label: `${nameForSkill(skill)} · DC ${dc}`, attempt, choose
    });
    // Always handle late rejected promises, even if the GM supersedes them.
    const remote = Promise.resolve().then(() => socket.executeAsUser("rollAbility", roller.id,
      requestDetails(actor, skill, dc, midiVersion)))
      .then(value => ({ type: "result", value }), error => ({ type: "error", error }));
    let outcome;
    try { outcome = await Promise.race([remote, decision]); }
    finally { unregisterPending(key, token); }
    if (!isCurrent()) throw new Error("Expedition changed while the role check was pending.");
    if (outcome?.type === "cancel") return null;
    if (outcome?.type === "resend") continue;
    if (outcome?.type === "gm") { roller = game.user; continue; }
    if (outcome?.type === "error") throw outcome.error;
    const total = nativeTotal(outcome?.value);
    if (total === null) throw new Error(`${actor.name}'s ${nameForSkill(skill)} roll did not return a total. No role result was recorded.`);
    const messageId = (Array.isArray(outcome.value) ? outcome.value[0] : outcome.value)?.messageId;
    if (messageId && game.modules.get("dice-so-nice")?.active && typeof game.dice3d?.waitFor3DAnimationByMessageID === "function") {
      try { await game.dice3d.waitFor3DAnimationByMessageID(messageId); }
      catch (error) { console.warn("[ZFT][HexTravel] Role-check dice animation unavailable", error); }
    }
    return { total, roller };
  }
}

export async function runHexTravelRoleCheck({ actors, assignments, day, epoch, prompt,
  registerPending, unregisterPending, isCurrent, save } = {}) {
  if (!game.user?.isGM) throw new Error("Only a GM can request expedition role checks.");
  if (game.system?.id !== "dnd5e") throw new Error("Expedition role checks require D&D5e.");
  const midi = game.modules.get("midi-qol");
  const socket = globalThis.MidiQOL?.socket?.();
  if (!midi?.active || typeof socket?.executeAsUser !== "function")
    throw new Error("Active Midi-QOL with its remote roll socket is required.");
  const assigned = situationalRoleKeys().filter(role =>
    (actors ?? []).some(actor => actor.uuid === assignments?.[role]));
  if (!assigned.length) {
    ui.notifications.warn("Assign a present Vanguard, Scout, Tracker, Forager, or Coordinator in Expedition Roles first.");
    return null;
  }
  const roleOptions = assigned.map(id => `<option value="${esc(id)}">${esc(EXPEDITION_PAIRS.find(pair => pair.roles.includes(id)).name)} · ${esc(EXPEDITION_ROLES[id].name)}</option>`).join("");
  const input = await prompt({
    window: { title: "Situational Expedition Role Check" }, position: { width: 465 },
    content: `<section class="zft-hex-role-check-form" aria-label="Situational role check setup">
      <p>Request a skill roll only when the expedition faces a meaningful task. The Guide's navigation check remains under Start / Continue.</p>
      <label><span>Assigned role</span><select name="role">${roleOptions}</select></label>
      <label><span>Skill for this task</span><select name="skill"></select></label>
      <label><span>Task DC (1–30)</span><input type="number" name="dc" min="1" max="30" step="1" value="15" required></label>
      <label><span>Task / narrative context (optional)</span><input name="context" type="text" maxlength="160" placeholder="e.g. Spot the patrol at the river crossing"></label>
      <small>Rolled totals are recorded in Expedition Log. The GM determines any consequences; no time, supplies, threat, exhaustion or momentum is changed automatically.</small>
    </section>`,
    render: (_event, dialog) => {
      const root = dialog.element;
      const roleSelect = root.querySelector('select[name="role"]');
      const skillSelect = root.querySelector('select[name="skill"]');
      const updateSkills = () => {
        const role = EXPEDITION_ROLES[roleSelect?.value];
        skillSelect.replaceChildren();
        for (const skill of role?.skills ?? []) {
          const option = document.createElement("option");
          option.value = skill;
          option.textContent = nameForSkill(skill);
          skillSelect.append(option);
        }
      };
      roleSelect.addEventListener("change", updateSkills);
      updateSkills();
    },
    buttons: [
      { action: "roll", label: "Request Role Check", icon: "fas fa-dice-d20", default: true,
        callback: (_event, button) => {
          const fields = button.form?.elements;
          return { role: fields?.namedItem("role")?.value, skill: fields?.namedItem("skill")?.value,
            dc: fields?.namedItem("dc")?.value, context: fields?.namedItem("context")?.value ?? "" };
        } },
      { action: "cancel", label: "Cancel", callback: () => null }
    ], close: () => null
  });
  if (!input) return null;
  const check = validateSituationalRoleCheck(input);
  const actor = (actors ?? []).find(a => a.uuid === assignments?.[check.role]);
  if (!actor || !isCurrent()) throw new Error("Assigned role, attendance or travel day changed before the check.");
  const live = game.settings.get(MODULE_ID, "hexTravelRolePreferences")?.assignments ?? {};
  if (live[check.role] !== actor.uuid) throw new Error("Role assignment changed before the check.");
  const result = await requestWithRecovery({ actor, skill: check.skill, dc: check.dc,
    socket, midiVersion: midi.version, registerPending, unregisterPending, isCurrent });
  if (!result) { console.info("[ZFT][HexTravel]", "Role check canceled. No expedition history was changed."); return null; }
  if (!isCurrent() || game.settings.get(MODULE_ID, "hexTravelRolePreferences")?.assignments?.[check.role] !== actor.uuid)
    throw new Error("Role assignment or expedition changed before saving the result.");
  const entry = {
    id: foundry.utils.randomID(), version: 1, day, epoch, recordedAt: Date.now(),
    category: check.category, role: check.role, roleName: EXPEDITION_ROLES[check.role].name,
    actorUuid: actor.uuid, actorName: actor.name, skill: check.skill, skillName: nameForSkill(check.skill),
    dc: check.dc, total: result.total, passed: result.total >= check.dc,
    context: String(input.context ?? "").trim().slice(0, 160)
  };
  await save(entry);
  console.info("[ZFT][HexTravel]", `${entry.roleName}: ${entry.skillName} ${entry.total} vs DC ${entry.dc} · ${entry.passed ? "Success" : "Failure"}. Recorded in Expedition Log.`);
  return entry;
}
