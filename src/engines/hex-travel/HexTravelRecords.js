/** Shared records for newly committed Hex Travel sequences.
 * These helpers only copy/update supplied data. The existing travel ledger owns
 * persistence; they never roll dice, advance time, or infer historical results.
 */
import { MODULE_ID, MODULE_VERSION } from "../../constants/module-constants.js";
import { expeditionMomentumFromStore, isEventResolutionComplete } from "./HexExpeditionOutcome.js";
import { cloneThreats } from "./HexThreatState.js";

const SCHEMA = 1;
const LEDGER_KEY = "hexTravelLedger";
const STATUSES = new Set(["inProgress", "completed", "interrupted"]);
const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const isCount = (value, minimum = 0) => Number.isSafeInteger(value) && value >= minimum;
const copy = value => typeof globalThis.structuredClone === "function"
  ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const fail = message => { throw new Error(`[ZFT][HexTravel] Saved hex records: ${message}`); };
const validId = value => typeof value === "string" && value.trim().length > 0;
function timestamp(value) {
  if (!isCount(value)) fail("record timestamp must be a nonnegative integer.");
  return value;
}

/** Missing records are an untouched legacy ledger, not a migration request.
 * Unknown fields are retained; an incompatible schema must never be reset.
 */
export function cloneHexRecordStore(value) {
  if (value === undefined || value === null) return { schema: SCHEMA, records: [] };
  if (!isObject(value) || value.schema !== SCHEMA || !Array.isArray(value.records))
    fail("unsupported or malformed store; expected schema 1 and a records array.");
  const ids = new Set();
  for (const record of value.records) {
    if (!isObject(record) || record.schema !== SCHEMA || !validId(record.id) || ids.has(record.id))
      fail("unsupported, malformed, or duplicate sequence record.");
    ids.add(record.id);
    if (!isCount(record.number, 1) || !isCount(record.createdAt) ||
        !(record.completedAt === null || isCount(record.completedAt)) ||
        !isObject(record.start) || !isCount(record.start.day, 1) || !isCount(record.start.hour) ||
        !isObject(record.context) || !isObject(record.context.identity) ||
        !isObject(record.context.difficulty) || !Array.isArray(record.context.party) ||
        !isObject(record.context.assignments) || !isObject(record.navigation) ||
        !STATUSES.has(record.status) || !isObject(record.travel) ||
        record.travel.status !== record.status || !isObject(record.travel.dice) ||
        !isCount(record.travel.rolledHours, 1) || !isCount(record.travel.committedHours) ||
        !isCount(record.travel.remainingHours) || !Array.isArray(record.travel.segments) ||
        !isObject(record.phases) || record.phases.travel !== record.status)
      fail(`malformed sequence ${record.id}; existing data was not changed.`);
    for (const segment of record.travel.segments) {
      if (!isObject(segment) || !isCount(segment.day, 1) || !isCount(segment.hours, 1))
        fail(`malformed committed-hour segment in sequence ${record.id}.`);
    }
    if (record.corrections !== undefined && !Array.isArray(record.corrections))
      fail(`malformed ledger corrections in sequence ${record.id}.`);
  }
  return copy(value);
}

/** Called at the existing first pending-hours checkpoint, after GM review and
 * travel dice. A repeated ID never overwrites the sequence's original context.
 */
export function startHexRecord(records, {
  id, number, day, hour, identity, difficulty, pace, party, assignments,
  navigation, dice, now = Date.now()
} = {}) {
  const store = cloneHexRecordStore(records);
  if (!validId(id)) fail("new sequence requires its saved hex ID.");
  if (store.records.some(record => record.id === id)) return store;
  if (!isCount(number, 1) || !isCount(day, 1) || !isCount(hour) ||
      !isObject(identity) || !isObject(difficulty) ||
      !(isObject(pace) || (typeof pace === "string" && pace.length)) ||
      !Array.isArray(party) || !isObject(assignments) || !isObject(navigation) ||
      !isObject(dice) || !isCount(dice.hours, 1))
    fail("new sequence requires valid finalized context and travel dice.");
  const createdAt = timestamp(now);
  store.records.push({
    schema: SCHEMA, id, number, createdAt, completedAt: null,
    start: { day, hour },
    context: copy({ identity, difficulty, pace, party, assignments }),
    navigation: copy(navigation),
    travel: {
      rolledHours: dice.hours, dice: copy(dice), committedHours: 0,
      remainingHours: dice.hours, segments: [], status: "inProgress"
    },
    status: "inProgress",
    phases: {
      navigation: "completed", travel: "inProgress",
      reconnaissance: "pending", support: "pending",
      travelQuality: "pending", momentum: "pending", event: "pending", eventResolution: "pending"
    }
  });
  return store;
}

/** Copies only hours already committed in this exact sequence's hour history.
 * The caller supplies the ID captured before completion clears the active ID.
 * Missing legacy records remain missing; completed/interrupted records are final.
 */
export function syncHexRecordProgress(records, ledger, id, now = Date.now()) {
  const store = cloneHexRecordStore(records);
  const record = store.records.find(entry => entry.id === id);
  if (!record || record.status !== "inProgress") return store;
  if (!isObject(ledger) || !isCount(ledger.pending) ||
      (ledger.hexHourSegments !== undefined && !Array.isArray(ledger.hexHourSegments)))
    fail("cannot synchronize progress from an invalid travel ledger.");
  // Another active sequence's pending hours cannot describe this sequence.
  if (ledger.activeHexCardId && ledger.activeHexCardId !== id) return store;
  const byDay = new Map();
  for (const segment of ledger.hexHourSegments ?? []) {
    if (segment?.hexId !== id) continue;
    if (!isCount(segment.day, 1) || !isCount(segment.hours, 1))
      fail(`invalid committed-hour history for sequence ${id}.`);
    const hours = (byDay.get(segment.day) ?? 0) + segment.hours;
    if (!isCount(hours)) fail(`committed-hour history exceeds the supported range for ${id}.`);
    byDay.set(segment.day, hours);
  }
  const segments = [...byDay].sort(([a], [b]) => a - b).map(([day, hours]) => ({ day, hours }));
  const committedHours = segments.reduce((total, segment) => total + segment.hours, 0);
  if (!isCount(committedHours)) fail(`committed hours exceed the supported range for ${id}.`);
  const completed = ledger.pending === 0 && committedHours >= record.travel.rolledHours;
  const status = completed ? "completed" : "inProgress";
  record.travel = { ...record.travel, committedHours, remainingHours: ledger.pending, segments, status };
  record.status = status;
  record.phases = { ...record.phases, travel: status };
  if (completed) record.completedAt = timestamp(now);
  return store;
}

/** Save one completed paired-role phase without touching travel hours or any
 * later expedition engine. Existing dev.87 records may still say
 * notImplemented; that value is accepted as the pre-integration pending state.
 */
export function saveHexRolePhase(records, id, phase, resolution) {
  const store = cloneHexRecordStore(records);
  if (!validId(id)) fail("role resolution requires a saved sequence ID.");
  if (!["reconnaissance", "support"].includes(phase)) fail(`unsupported role phase ${String(phase)}.`);
  if (!isObject(resolution) || resolution.phase !== phase || resolution.schema !== 1 ||
      !isCount(resolution.resolvedAt) || !isCount(resolution.dc, 1) || !Array.isArray(resolution.results))
    fail(`invalid ${phase} resolution.`);
  const record = store.records.find(entry => entry.id === id);
  if (!record) fail(`sequence ${id} does not exist.`);
  if (record.status === "interrupted") fail(`sequence ${id} was interrupted by a ledger correction.`);
  const state = record.phases?.[phase];
  if (state === "completed") fail(`${phase} is already completed for sequence ${id}.`);
  if (!["pending", "notImplemented", undefined, null].includes(state))
    fail(`${phase} is not available for sequence ${id}.`);
  record.roles = { ...(isObject(record.roles) ? record.roles : {}), [phase]: copy(resolution) };
  record.phases = { ...record.phases, [phase]: "completed" };
  return store;
}

/** Save the deterministic Travel Quality -> Momentum preparation stage.
 * This deliberately stops before the Event d20. The store-level Momentum
 * value remains the only persistent Momentum owner for staged Hex Travel.
 */
export function saveHexExpeditionPreparation(records, id, preparation) {
  const store = cloneHexRecordStore(records);
  if (!validId(id)) fail("expedition preparation requires a saved sequence ID.");
  if (!isObject(preparation) || preparation.schema !== 1 || preparation.recordId !== id ||
      !isCount(preparation.resolvedAt) || !isObject(preparation.travelQuality) || !isObject(preparation.momentum))
    fail("invalid Expedition preparation.");
  const record = store.records.find(entry => entry.id === id);
  if (!record) fail(`sequence ${id} does not exist.`);
  if (record.status === "interrupted") fail(`sequence ${id} was interrupted by a ledger correction.`);
  if (record.phases?.reconnaissance !== "completed" || record.phases?.support !== "completed")
    fail(`sequence ${id} must finish Reconnaissance and Expedition Support first.`);
  if (record.phases?.travelQuality === "completed" || record.phases?.momentum === "completed" || record.travelQuality || record.momentum)
    fail(`Travel Quality and Momentum are already completed for sequence ${id}.`);
  if (record.phases?.event === "completed" || record.event) fail(`Event is already completed for sequence ${id}.`);
  const currentMomentum = expeditionMomentumFromStore(store);
  if (preparation.momentum.before !== currentMomentum)
    fail(`Momentum changed before sequence ${id} could save its Travel Quality result.`);
  record.travelQuality = copy(preparation.travelQuality);
  record.momentum = copy(preparation.momentum);
  record.expeditionPreparedAt = preparation.resolvedAt;
  record.phases = { ...record.phases, travelQuality: "completed", momentum: "completed" };
  store.momentum = preparation.momentum.after;
  return store;
}

/** Save the explicit GM Event-roll stage after Travel Quality and Momentum. */
export function saveHexExpeditionEvent(records, id, eventOutcome) {
  const store = cloneHexRecordStore(records);
  if (!validId(id)) fail("Event roll requires a saved sequence ID.");
  if (!isObject(eventOutcome) || eventOutcome.schema !== 1 || eventOutcome.recordId !== id ||
      !isCount(eventOutcome.resolvedAt) || !isObject(eventOutcome.event) || !isObject(eventOutcome.eventResolution))
    fail("invalid Expedition Event result.");
  const record = store.records.find(entry => entry.id === id);
  if (!record) fail(`sequence ${id} does not exist.`);
  if (record.status === "interrupted") fail(`sequence ${id} was interrupted by a ledger correction.`);
  if (record.phases?.travelQuality !== "completed" || record.phases?.momentum !== "completed" ||
      !isObject(record.travelQuality) || !isObject(record.momentum))
    fail(`sequence ${id} must finish Travel Quality and Momentum first.`);
  if (record.phases?.event === "completed" || record.event) fail(`Event is already completed for sequence ${id}.`);
  const currentMomentum = expeditionMomentumFromStore(store);
  if (record.momentum.after !== currentMomentum || eventOutcome.event.momentum !== record.momentum.after)
    fail(`Momentum changed before sequence ${id} could save its Event result.`);
  if (!["pending", "resolved"].includes(eventOutcome.eventResolution.status))
    fail(`invalid Event Resolution status for sequence ${id}.`);
  record.event = copy(eventOutcome.event);
  record.eventResolution = copy(eventOutcome.eventResolution);
  record.eventRolledAt = eventOutcome.resolvedAt;
  record.expeditionResolvedAt = eventOutcome.resolvedAt;
  record.phases = { ...record.phases, event: "completed", eventResolution: eventOutcome.eventResolution.status };
  return store;
}

/** Compatibility helper for older tests/callers that supply a combined outcome.
 * Normal dev.100 workflow uses the two explicit saves above.
 */
export function saveHexExpeditionOutcome(records, id, outcome) {
  if (!isObject(outcome) || outcome.schema !== 1 || outcome.recordId !== id ||
      !isCount(outcome.resolvedAt) || !isObject(outcome.travelQuality) || !isObject(outcome.momentum) ||
      !isObject(outcome.event) || !isObject(outcome.eventResolution)) fail("invalid Expedition outcome.");
  let store = saveHexExpeditionPreparation(records, id, {
    schema: 1, recordId: id, resolvedAt: outcome.resolvedAt,
    travelQuality: outcome.travelQuality, momentum: outcome.momentum
  });
  store = saveHexExpeditionEvent(store, id, {
    schema: 1, recordId: id, resolvedAt: outcome.resolvedAt,
    event: outcome.event, eventResolution: outcome.eventResolution
  });
  return store;
}

/** Transitional bridge for downstream engines that are not yet implemented.
 * It records a GM-authored resolution note without inventing time, resources,
 * Threat changes, checks, or consequences.
 */
export function saveHexEventManualResolution(records, id, { notes = "", now = Date.now() } = {}) {
  const store = cloneHexRecordStore(records);
  if (!validId(id)) fail("manual Event resolution requires a saved sequence ID.");
  const record = store.records.find(entry => entry.id === id);
  if (!record) fail(`sequence ${id} does not exist.`);
  if (record.status === "interrupted") fail(`sequence ${id} was interrupted by a ledger correction.`);
  if (record.phases?.event !== "completed" || !isObject(record.event) || !isObject(record.eventResolution))
    fail(`sequence ${id} has no Event ready for manual resolution.`);
  if (isEventResolutionComplete(record.eventResolution)) fail(`Event Resolution is already complete for sequence ${id}.`);
  const resolvedAt = timestamp(Number(now));
  record.eventResolution = { ...record.eventResolution, status: "manual", resolvedAt,
    notes: String(notes ?? "").trim() };
  record.phases = { ...record.phases, eventResolution: "manual" };
  return store;
}

export function hexRecordReadyForTravel(record) {
  return !!record && record.status !== "interrupted" &&
    record.phases?.reconnaissance === "completed" && record.phases?.support === "completed" &&
    record.phases?.travelQuality === "completed" && record.phases?.momentum === "completed" &&
    record.phases?.event === "completed" && isEventResolutionComplete(record.eventResolution);
}

function ledgerSummary(ledger) {
  if (!isObject(ledger)) fail("ledger summary requires a saved ledger object.");
  return copy(Object.fromEntries(["day", "hours", "pending", "hexes", "activeHexCardId"]
    .map(key => [key, ledger[key] ?? null])));
}

/** A manual correction detaches the active sequence without rewriting its
 * original rolls or pretending the edited counters were travel that occurred.
 */
export function markHexRecordLedgerCorrection(records, activeId, { before, after, now = Date.now() } = {}) {
  const store = cloneHexRecordStore(records);
  const record = store.records.find(entry => entry.id === activeId);
  if (!record || record.status !== "inProgress") return store;
  const at = timestamp(now);
  const correction = { at, reason: "manualLedgerCorrection", before: ledgerSummary(before), after: ledgerSummary(after) };
  record.corrections = [...(record.corrections ?? []), correction];
  record.interruptedAt = at;
  record.status = "interrupted";
  record.travel = { ...record.travel, status: "interrupted" };
  record.phases = { ...record.phases, travel: "interrupted" };
  return store;
}

function readSnapshot() {
  const game = globalThis.game;
  if (typeof game?.settings?.get !== "function") fail("read API requires a ready Foundry world.");
  const ledger = game.settings.get(MODULE_ID, LEDGER_KEY) ?? {};
  if (!isObject(ledger)) fail("saved travel ledger is malformed.");
  return { ledger, store: cloneHexRecordStore(ledger.hexRecords) };
}

/** Read-only public API. All returned data are detached from saved settings. */
export class HexTravelRecords {
  static current() {
    const { ledger, store } = readSnapshot();
    return store.records.find(record => record.id === ledger.activeHexCardId) ?? null;
  }
  static latest() {
    return readSnapshot().store.records.at(-1) ?? null;
  }
  static get(id) {
    return readSnapshot().store.records.find(record => record.id === id) ?? null;
  }
  static list() {
    return readSnapshot().store.records;
  }
  static momentum() {
    return expeditionMomentumFromStore(readSnapshot().store);
  }
  static threats() {
    return cloneThreats(readSnapshot().store.threats);
  }
  static inspect() {
    const { ledger, store } = readSnapshot();
    const game = globalThis.game;
    const current = store.records.find(record => record.id === ledger.activeHexCardId) ?? null;
    return {
      moduleId: MODULE_ID, moduleVersion: MODULE_VERSION,
      installedModuleVersion: game.modules?.get?.(MODULE_ID)?.version ?? null,
      foundryVersion: game.version ?? game.release?.version ?? null,
      systemId: game.system?.id ?? null, systemVersion: game.system?.version ?? null,
      schema: store.schema, ledger: ledgerSummary(ledger), recordCount: store.records.length,
      expedition: {
        momentum: expeditionMomentumFromStore(store),
        threatCount: cloneThreats(store.threats).length,
        activeThreatCount: cloneThreats(store.threats).filter(threat => threat.status === "active").length
      },
      current: copy(current), latest: copy(store.records.at(-1) ?? null),
      legacyActive: Number(ledger.pending) > 0 && current === null,
      clockSyncPending: copy(ledger.clockSyncPending ?? null)
    };
  }
}
