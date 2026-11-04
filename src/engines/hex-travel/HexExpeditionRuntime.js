/** Foundry adapter for staged Expedition System 1.1 outcomes and Threats. */
import { MODULE_ID } from "../../constants/module-constants.js";
import {
  buildHexExpeditionOutcome, buildHexExpeditionPreparation, buildHexExpeditionEvent, expeditionMomentumFromStore, rawEventRollsForType
} from "./HexExpeditionOutcome.js";
import {
  cloneHexRecordStore, saveHexExpeditionOutcome, saveHexExpeditionPreparation, saveHexExpeditionEvent, saveHexEventManualResolution, addPlannedTravelHours
} from "./HexTravelRecords.js";
import { cloneThreats, createThreat, advanceThreat, reduceThreat, resolveThreat, setThreatVisibility } from "./HexThreatState.js";
import {
  ensurePrototypeComplicationRecord, resolveComplicationForHex, complicationRecordForHex, reviseComplicationGeneration
} from "../complication/ExpeditionComplication.js";
import { ComplicationLibrary } from "../complication/ComplicationLibrary.js";

const LEDGER_KEY = "hexTravelLedger";
const copy = value => typeof globalThis.structuredClone === "function"
  ? structuredClone(value) : JSON.parse(JSON.stringify(value));

function assertGm() {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can change Expedition outcomes or Threats.");
}
function readLedger() {
  const value = game.settings.get(MODULE_ID, LEDGER_KEY) ?? {};
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Saved Hex Travel ledger is malformed.");
  return copy(value);
}
function recordFrom(ledger, id) {
  return cloneHexRecordStore(ledger.hexRecords).records.find(record => record.id === id) ?? null;
}
async function writeStore(ledger, hexRecords) {
  await game.settings.set(MODULE_ID, LEDGER_KEY, { ...ledger, hexRecords });
}

function forceSingleD20Result(roll, forcedResult) {
  const value = Number(forcedResult);
  if (!Number.isSafeInteger(value) || value < 1 || value > 20)
    throw new Error("Forced Event die result must be an integer from 1 to 20.");
  const die = roll?.dice?.find?.(term => Number(term?.faces) === 20)
    ?? roll?.terms?.find?.(term => Number(term?.faces) === 20 && Array.isArray(term?.results));
  const result = die?.results?.find?.(entry => entry?.active !== false) ?? die?.results?.[0];
  if (!die || !result) throw new Error("Foundry did not expose the evaluated d20 result for Event forcing.");
  result.result = value;
  result.active = true;
  try { die._total = value; } catch {}
  try { roll._total = value; } catch {}
  if (Number(roll.total) !== value) throw new Error("Foundry could not apply the forced Event d20 face.");
  return roll;
}

function randomCandidate(values) {
  if (!Array.isArray(values) || !values.length) throw new Error("No valid Event die faces are available for the requested Event.");
  const configured = globalThis.CONFIG?.Dice?.randomUniform;
  const sample = typeof configured === "function" ? Number(configured()) : Math.random();
  const unit = Number.isFinite(sample) ? Math.min(0.999999999999, Math.max(0, sample)) : Math.random();
  return values[Math.floor(unit * values.length)];
}

async function nativeEventRoll(record, { forcedResult = null } = {}) {
  if (typeof globalThis.Roll !== "function") throw new Error("Foundry Roll is unavailable for the Event die.");
  let roll = await new Roll("1d20").evaluate();
  if (forcedResult !== null && forcedResult !== undefined) roll = forceSingleD20Result(roll, forcedResult);
  const total = Number(roll.total);
  if (!Number.isSafeInteger(total) || total < 1 || total > 20) throw new Error("The Event roll did not return a valid d20 result.");
  let message = null;
  if (typeof roll.toMessage === "function") {
    message = await roll.toMessage({
      speaker: { alias: "ZFT Overland Travel" },
      flavor: `Expedition Event · Hex ${record.number}`
    });
  }
  if (game.modules?.get?.("dice-so-nice")?.active && message?.id &&
      typeof game.dice3d?.waitFor3DAnimationByMessageID === "function") {
    try { await game.dice3d.waitFor3DAnimationByMessageID(message.id); }
    catch (error) { console.warn("[ZFT][HexTravel] Event die animation unavailable", error); }
  }
  return total;
}

async function controlledNativeEventRoll(record, control) {
  const mode = String(control?.mode ?? "normal");
  if (mode === "normal") return nativeEventRoll(record);
  if (mode === "exact") return nativeEventRoll(record, { forcedResult: Number(control?.raw) });
  if (mode === "eventType") {
    const candidates = rawEventRollsForType(String(control?.type ?? ""), record?.momentum?.after);
    return nativeEventRoll(record, { forcedResult: randomCandidate(candidates) });
  }
  throw new Error(`Unknown Event roll mode ${mode}.`);
}


async function nativeComplicationD8Roll(record, label) {
  if (typeof globalThis.Roll !== "function") throw new Error(`Foundry Roll is unavailable for the Complication ${label} die.`);
  const roll = await new Roll("1d8").evaluate();
  const total = Number(roll.total);
  if (!Number.isSafeInteger(total) || total < 1 || total > 8) throw new Error(`The Complication ${label} roll did not return a valid d8 result.`);
  let message = null;
  if (typeof roll.toMessage === "function") {
    message = await roll.toMessage({
      speaker: { alias: "ZFT Overland Travel" },
      flavor: `Complication ${label} · Hex ${record.number}`
    });
  }
  if (game.modules?.get?.("dice-so-nice")?.active && message?.id &&
      typeof game.dice3d?.waitFor3DAnimationByMessageID === "function") {
    try { await game.dice3d.waitFor3DAnimationByMessageID(message.id); }
    catch (error) { console.warn(`[ZFT][Complication] ${label} die animation unavailable`, error); }
  }
  return total;
}

export async function ensureHexComplication(recordId, { primaryRoll = null, detailRoll = null } = {}) {
  assertGm();
  const initialLedger = readLedger();
  const record = recordFrom(initialLedger, recordId);
  if (!record) throw new Error("The selected hex record no longer exists.");
  if (record.eventResolution?.engine !== "complication" || record.eventResolution?.status !== "pending")
    throw new Error("The selected hex is not waiting on a Complication.");
  const existing = complicationRecordForHex(cloneHexRecordStore(initialLedger.hexRecords), recordId);
  if (existing) return { record: copy(existing), created: false };

  await ComplicationLibrary.ensureNavigation();
  const primary = typeof primaryRoll === "function" ? await primaryRoll(record) :
    Number.isSafeInteger(primaryRoll) ? primaryRoll : await nativeComplicationD8Roll(record, "Type");
  const detail = typeof detailRoll === "function" ? await detailRoll(record, primary) :
    Number.isSafeInteger(detailRoll) ? detailRoll : await nativeComplicationD8Roll(record, "Detail");

  const currentLedger = readLedger();
  const currentRecord = recordFrom(currentLedger, recordId);
  if (!currentRecord || currentRecord.eventResolution?.engine !== "complication" || currentRecord.eventResolution?.status !== "pending")
    throw new Error("The Complication changed while its content rolls were resolving.");
  const result = ensurePrototypeComplicationRecord(cloneHexRecordStore(currentLedger.hexRecords), currentRecord, { primaryRoll: primary, detailRoll: detail });
  await writeStore(currentLedger, result.store);
  return { record: copy(result.record), created: result.created };
}

export async function reviseHexComplicationGeneration(recordId, { primaryRoll = null, detailRoll = null, action = "gmCorrection", note = "", now = Date.now() } = {}) {
  assertGm();
  const ledger = readLedger();
  const record = recordFrom(ledger, recordId);
  if (!record) throw new Error("The selected hex record no longer exists.");
  if (record.eventResolution?.engine !== "complication" || record.eventResolution?.status !== "pending")
    throw new Error("The selected hex is not waiting on a Complication.");
  const result = reviseComplicationGeneration(cloneHexRecordStore(ledger.hexRecords), recordId, { primaryRoll, detailRoll, action, note, now });
  await writeStore(ledger, result.store);
  return { record: copy(result.record), revision: copy(result.revision) };
}

export async function openPrototypeComplicationJournal() {
  assertGm();
  return ComplicationLibrary.openPrototype();
}

export async function resolveHexExpeditionPreparation(recordId, { now = Date.now() } = {}) {
  assertGm();
  const ledger = readLedger();
  const record = recordFrom(ledger, recordId);
  if (!record) throw new Error("The selected hex record no longer exists.");
  const momentum = expeditionMomentumFromStore(cloneHexRecordStore(ledger.hexRecords));
  const preparation = buildHexExpeditionPreparation(record, { momentum, now });
  const hexRecords = saveHexExpeditionPreparation(ledger.hexRecords, recordId, preparation);
  await writeStore(ledger, hexRecords);
  return copy(preparation);
}

export async function rollHexExpeditionEvent(recordId, { eventRoll = null, eventRollControl = null, now = Date.now() } = {}) {
  assertGm();
  const initialLedger = readLedger();
  const record = recordFrom(initialLedger, recordId);
  if (!record) throw new Error("The selected hex record no longer exists.");
  const raw = typeof eventRoll === "function" ? await eventRoll(record) :
    Number.isSafeInteger(eventRoll) ? eventRoll : await controlledNativeEventRoll(record, eventRollControl);
  const eventOutcome = buildHexExpeditionEvent(record, { eventRoll: raw, now });

  // Re-read after the asynchronous Event die. The save rejects duplicate or
  // stale Momentum state rather than overwriting a newer GM action.
  const currentLedger = readLedger();
  const hexRecords = saveHexExpeditionEvent(currentLedger.hexRecords, recordId, eventOutcome);
  await writeStore(currentLedger, hexRecords);
  return copy(eventOutcome);
}

export async function resolveHexExpeditionOutcome(recordId, { eventRoll = null, now = Date.now() } = {}) {
  assertGm();
  const initialLedger = readLedger();
  const record = recordFrom(initialLedger, recordId);
  if (!record) throw new Error("The selected hex record no longer exists.");
  const momentum = expeditionMomentumFromStore(cloneHexRecordStore(initialLedger.hexRecords));
  const raw = typeof eventRoll === "function" ? await eventRoll(record) :
    Number.isSafeInteger(eventRoll) ? eventRoll : await nativeEventRoll(record);
  const outcome = buildHexExpeditionOutcome(record, { momentum, eventRoll: raw, now });

  // Re-read after the asynchronous roll. saveHexExpeditionOutcome rejects a
  // stale Momentum chain or a duplicate Event instead of overwriting it.
  const currentLedger = readLedger();
  const hexRecords = saveHexExpeditionOutcome(currentLedger.hexRecords, recordId, outcome);
  await writeStore(currentLedger, hexRecords);
  return copy(outcome);
}

export async function resolveHexEventManually(recordId, { notes = "", complicationOutcome = null, now = Date.now() } = {}) {
  assertGm();
  const ledger = readLedger();
  let hexRecords = saveHexEventManualResolution(ledger.hexRecords, recordId, { notes, now });
  if (recordFrom({ ...ledger, hexRecords }, recordId)?.eventResolution?.engine === "complication") {
    hexRecords = resolveComplicationForHex(cloneHexRecordStore(hexRecords), recordId, {
      outcome: complicationOutcome, notes, now
    }).store;
  }
  await writeStore(ledger, hexRecords);
  return recordFrom({ ...ledger, hexRecords }, recordId)?.eventResolution ?? null;
}


function trackedResourceState(item) {
  const uses = item?.system?.uses;
  const max = Number(uses?.max);
  const spent = Number(uses?.spent);
  if (Number.isFinite(max) && max > 0 && Number.isFinite(spent)) {
    return { mode: "usesSpent", current: Math.max(0, Math.trunc(max - spent)), max: Math.trunc(max), spent: Math.max(0, Math.trunc(spent)) };
  }
  const value = Number(uses?.value);
  if (Number.isFinite(value) && value >= 0) return { mode: "usesValue", current: Math.trunc(value) };
  const quantity = Number(item?.system?.quantity);
  if (Number.isFinite(quantity) && quantity >= 0) return { mode: "quantity", current: Math.trunc(quantity) };
  return null;
}

async function applyResourceLoss(consequence) {
  if ((Number(consequence?.unitsLost) || 0) <= 0) return consequence;
  if (!consequence?.targetItemUuid || typeof globalThis.fromUuid !== "function")
    throw new Error("Resource Loss requires a selected Foundry Item.");
  const item = await fromUuid(consequence.targetItemUuid);
  if (!item || item.documentName !== "Item") throw new Error("The selected Resource Item no longer exists.");
  const state = trackedResourceState(item);
  if (!state) throw new Error(`${item.name} does not expose a trackable quantity or uses value.`);
  const expected = Number(consequence.currentUnits);
  if (Number.isSafeInteger(expected) && expected !== state.current)
    throw new Error(`${item.name} changed from ${expected} to ${state.current} units before the consequence could be applied.`);
  const loss = Math.min(state.current, Math.max(0, Number(consequence.unitsLost) || 0));
  if (state.mode === "usesSpent") await item.update({ "system.uses.spent": Math.min(state.max, state.spent + loss) });
  else if (state.mode === "usesValue") await item.update({ "system.uses.value": Math.max(0, state.current - loss) });
  else await item.update({ "system.quantity": Math.max(0, state.current - loss) });
  return { ...consequence, targetItemName: item.name, targetActorUuid: item.parent?.uuid ?? null, targetActorName: item.parent?.name ?? null, appliedUnitsLost: loss, remainingUnits: state.current - loss };
}

async function resolveActor(uuid) {
  if (!uuid || typeof globalThis.fromUuid !== "function") throw new Error("An affected character is required.");
  const doc = await fromUuid(uuid);
  const actor = doc?.documentName === "Actor" ? doc : doc?.actor ?? null;
  if (!actor || actor.type !== "character") throw new Error("The selected consequence target is not a character Actor.");
  return actor;
}

async function applyHpDamage(consequence) {
  const percent = Number(consequence?.percent) || 0;
  if (percent <= 0) return consequence;
  const applied = [];
  for (const target of consequence.targets ?? []) {
    const actor = await resolveActor(target.actorUuid);
    const hp = actor.system?.attributes?.hp;
    const maxHp = Math.max(0, Number(hp?.max) || 0);
    const damage = Math.ceil(maxHp * percent / 100);
    const beforeHp = Math.max(0, Number(hp?.value) || 0);
    const beforeTemp = Math.max(0, Number(hp?.temp) || 0);
    if (typeof actor.applyDamage === "function") await actor.applyDamage([{ value: damage, type: String(consequence.damageType || "") }], { ignore: true });
    else {
      const tempLoss = Math.min(beforeTemp, damage);
      const hpLoss = Math.min(beforeHp, Math.max(0, damage - tempLoss));
      const updates = { "system.attributes.hp.value": Math.max(0, beforeHp - hpLoss) };
      if (hp?.temp !== undefined) updates["system.attributes.hp.temp"] = Math.max(0, beforeTemp - tempLoss);
      await actor.update(updates);
    }
    const after = actor.system?.attributes?.hp ?? {};
    const afterHp = Math.max(0, Number(after.value) || 0);
    const afterTemp = Math.max(0, Number(after.temp) || 0);
    applied.push({ actorUuid: actor.uuid, actorName: actor.name, maxHp, damage,
      hpLoss: Math.max(0, beforeHp - afterHp), tempHpLoss: Math.max(0, beforeTemp - afterTemp),
      beforeHp, afterHp, beforeTempHp: beforeTemp, afterTempHp: afterTemp });
  }
  return { ...consequence, targets: applied };
}

async function applyExhaustion(consequence) {
  const levels = Math.max(0, Number(consequence?.levels) || 0);
  if (!levels) return consequence;
  const applied = [];
  for (const target of consequence.targets ?? []) {
    const actor = await resolveActor(target.actorUuid);
    const raw = actor.system?.attributes?.exhaustion;
    const current = Math.max(0, Math.min(6, Math.trunc(Number(typeof raw === "object" ? raw?.value : raw) || 0)));
    const next = Math.min(6, current + levels);
    if (next !== current) await actor.update({ "system.attributes.exhaustion": next });
    applied.push({ actorUuid: actor.uuid, actorName: actor.name, before: current, after: next, levelsAdded: next - current });
  }
  return { ...consequence, targets: applied };
}

async function applyNonLedgerConsequence(consequence) {
  if (!consequence || typeof consequence !== "object") return consequence;
  if (consequence.type === "resourceLoss") return applyResourceLoss(consequence);
  if (consequence.type === "hpDamage") return applyHpDamage(consequence);
  if (consequence.type === "exhaustion") return applyExhaustion(consequence);
  return consequence;
}

export async function resolveHexComplicationOutcome(recordId, { outcome, notes = "", method = null, roll = null, supportUsed = false, consequence = null, now = Date.now() } = {}) {
  assertGm();
  const ledger = readLedger();
  const record = recordFrom(ledger, recordId);
  if (!record) throw new Error("The selected hex record no longer exists.");
  if (record.eventResolution?.engine !== "complication" || record.eventResolution?.status !== "pending")
    throw new Error("This hex is not waiting on a Complication resolution.");

  let appliedConsequence = copy(consequence ?? {});
  let addedHours = 0;
  if (appliedConsequence.type === "lostTime") {
    addedHours = Number(appliedConsequence.plannedTimeDelta ?? 0);
  } else if (appliedConsequence.type === "lostProgress") {
    const percent = Number(appliedConsequence.percent ?? 0);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) throw new Error("Lost Progress percentage is invalid.");
    const baseHours = Math.max(0, Number(record.travel?.rolledHours) || 0);
    addedHours = Math.ceil(baseHours * percent / 100);
    appliedConsequence = { ...appliedConsequence, baseTravelHours: baseHours, lostProgressHours: addedHours, plannedTimeDelta: addedHours };
  }
  if (!Number.isSafeInteger(addedHours) || addedHours < 0) throw new Error("Complication planned-time adjustment is invalid.");

  appliedConsequence = await applyNonLedgerConsequence(appliedConsequence);

  let hexRecords = cloneHexRecordStore(ledger.hexRecords);
  if (addedHours > 0) hexRecords = addPlannedTravelHours(hexRecords, recordId, addedHours);
  hexRecords = saveHexEventManualResolution(hexRecords, recordId, { notes, now });
  hexRecords = resolveComplicationForHex(hexRecords, recordId, { outcome, notes, method, roll, supportUsed, consequence: appliedConsequence, now }).store;
  await game.settings.set(MODULE_ID, LEDGER_KEY, { ...ledger, pending: Math.max(0, Number(ledger.pending) || 0) + addedHours, hexRecords });
  if (addedHours > 0) {
    const progress = game.settings.get(MODULE_ID, "hexTravelDisplayProgress") ?? {};
    await game.settings.set(MODULE_ID, "hexTravelDisplayProgress", { ...progress, totalHours: Math.max(0, Number(progress.totalHours) || 0) + addedHours });
  }
  return { eventResolution: recordFrom({ ...ledger, hexRecords }, recordId)?.eventResolution ?? null,
    complication: complicationRecordForHex(hexRecords, recordId), delay: addedHours, consequence: copy(appliedConsequence) };
}

function newThreatId() {
  if (typeof globalThis.foundry?.utils?.randomID === "function") return foundry.utils.randomID(16);
  if (typeof globalThis.crypto?.randomUUID === "function") return crypto.randomUUID();
  return `threat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function mutateThreats(mutator) {
  assertGm();
  const ledger = readLedger();
  const store = cloneHexRecordStore(ledger.hexRecords);
  store.threats = mutator(cloneThreats(store.threats));
  await writeStore(ledger, store);
  return cloneThreats(store.threats);
}

export async function createHexThreat({ name, stage = "emerging", visibility = "hidden", warning = "", source = "", recordId = null, now = Date.now() } = {}) {
  const ledger = readLedger();
  const record = recordId ? recordFrom(ledger, recordId) : cloneHexRecordStore(ledger.hexRecords).records.at(-1) ?? null;
  return mutateThreats(threats => createThreat(threats, {
    id: newThreatId(), name, stage, visibility, warning,
    source: { type: "gm", detail: String(source || "GM introduced") },
    recordId: record?.id ?? null, recordNumber: record?.number ?? null, now
  }));
}

export const advanceHexThreat = (id, options = {}) => mutateThreats(threats => advanceThreat(threats, id, options));
export const reduceHexThreat = (id, options = {}) => mutateThreats(threats => reduceThreat(threats, id, options));
export const resolveHexThreat = (id, options = {}) => mutateThreats(threats => resolveThreat(threats, id, options));
export const setHexThreatVisibility = (id, visibility, options = {}) =>
  mutateThreats(threats => setThreatVisibility(threats, id, visibility, options));
