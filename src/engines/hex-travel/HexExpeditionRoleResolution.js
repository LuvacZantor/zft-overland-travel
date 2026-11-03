/** Pure paired-role resolution for the Expedition Dashboard.
 * No Foundry, settings, dice, clocks, Momentum, Threat, or event access.
 */
import { EXPEDITION_ROLES } from "./HexTravelRoles.js";

export const EXPEDITION_ROLE_PHASES = Object.freeze({
  reconnaissance: Object.freeze({
    id: "reconnaissance", name: "Reconnaissance", icon: "fa-eye", roles: Object.freeze(["scout", "tracker"])
  }),
  support: Object.freeze({
    id: "support", name: "Expedition Support", icon: "fa-people-group", roles: Object.freeze(["forager", "coordinator"])
  })
});

const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const validDc = value => Number.isSafeInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 30;
const copy = value => typeof globalThis.structuredClone === "function"
  ? structuredClone(value) : JSON.parse(JSON.stringify(value));

function fail(message) { throw new Error(`[ZFT][HexTravel] Expedition roles: ${message}`); }

export function phaseDefinition(phase) {
  const definition = EXPEDITION_ROLE_PHASES[phase];
  if (!definition) fail(`unknown role phase ${String(phase)}.`);
  return definition;
}

/** Build the exact role slots from a saved hex snapshot. Current role settings
 * and current attendance are intentionally ignored.
 */
export function buildRolePhasePlan(record, phase) {
  if (!isObject(record) || !isObject(record.context) || !isObject(record.context.assignments) ||
      !Array.isArray(record.context.party) || !isObject(record.context.difficulty))
    fail("a valid saved hex record is required.");
  const definition = phaseDefinition(phase);
  const dc = Number(record.context.difficulty.dc);
  if (!validDc(dc)) fail(`saved hex ${record.id ?? "?"} has no valid role DC.`);
  const party = new Map(record.context.party
    .filter(entry => isObject(entry) && typeof entry.actorUuid === "string" && entry.actorUuid)
    .map(entry => [entry.actorUuid, entry]));
  const slots = definition.roles.map(roleId => {
    const config = EXPEDITION_ROLES[roleId];
    if (!config) fail(`missing fixed role definition for ${roleId}.`);
    const actorUuid = record.context.assignments[roleId] || null;
    const partyEntry = actorUuid ? party.get(actorUuid) : null;
    return {
      role: roleId,
      roleName: config.name,
      skill: config.skill,
      ability: String(config.ability ?? "").toLowerCase(),
      actorUuid,
      actorName: partyEntry?.name ?? null,
      status: !actorUuid ? "unassigned" : partyEntry ? "ready" : "absent"
    };
  });
  return { phase, name: definition.name, dc, recordId: record.id, recordNumber: record.number, slots: copy(slots) };
}

export function rolePairGrade(results = []) {
  const checked = results.filter(result => result?.status === "checked");
  if (!checked.length) return "unassigned";
  const successes = checked.filter(result => result.success === true).length;
  if (successes >= 2) return "strong";
  if (successes === 1) return "partial";
  return "failure";
}

/** Merge rolled/effective outcomes into the saved slot plan. A GM override is
 * represented by ruling=success/failure while the original rolledSuccess stays.
 */
export function buildRolePhaseResolution(plan, rolled = {}, rulings = {}, now = Date.now()) {
  if (!isObject(plan) || !Array.isArray(plan.slots) || !validDc(plan.dc)) fail("valid role phase plan required.");
  if (!Number.isSafeInteger(Number(now)) || Number(now) < 0) fail("resolution timestamp must be a nonnegative integer.");
  const results = plan.slots.map(slot => {
    if (slot.status !== "ready") return { ...copy(slot), total: null, rolledSuccess: null, ruling: null, success: null };
    const raw = rolled[slot.role];
    const total = Number(raw?.total ?? raw);
    if (!Number.isFinite(total)) fail(`${slot.roleName} roll did not return a numeric total.`);
    const rolledSuccess = total >= plan.dc;
    const ruling = rulings[slot.role] ?? "roll";
    if (!["roll", "success", "failure"].includes(ruling)) fail(`invalid GM ruling for ${slot.roleName}.`);
    const success = ruling === "roll" ? rolledSuccess : ruling === "success";
    return {
      ...copy(slot), status: "checked", total, margin: total - plan.dc,
      rolledSuccess, ruling, success,
      rollerId: typeof raw?.rollerId === "string" ? raw.rollerId : null
    };
  });
  return {
    schema: 1,
    phase: plan.phase,
    name: plan.name,
    dc: Number(plan.dc),
    resolvedAt: Number(now),
    grade: rolePairGrade(results),
    results
  };
}
