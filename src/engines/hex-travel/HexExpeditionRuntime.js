/** Foundry adapter for staged Expedition System 1.1 outcomes and Threats. */
import { MODULE_ID } from "../../constants/module-constants.js";
import { buildHexExpeditionOutcome, expeditionMomentumFromStore } from "./HexExpeditionOutcome.js";
import { cloneHexRecordStore, saveHexExpeditionOutcome, saveHexEventManualResolution } from "./HexTravelRecords.js";
import { cloneThreats, createThreat, advanceThreat, reduceThreat, resolveThreat, setThreatVisibility } from "./HexThreatState.js";

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

async function nativeEventRoll(record) {
  if (typeof globalThis.Roll !== "function") throw new Error("Foundry Roll is unavailable for the Event die.");
  const roll = await new Roll("1d20").evaluate();
  const total = Number(roll.total);
  if (!Number.isSafeInteger(total) || total < 1 || total > 20) throw new Error("The Event roll did not return a valid d20 result.");
  let message = null;
  if (typeof roll.toMessage === "function") {
    message = await roll.toMessage({
      speaker: globalThis.ChatMessage?.getSpeaker?.({ user: game.user }),
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

export async function resolveHexEventManually(recordId, { notes = "", now = Date.now() } = {}) {
  assertGm();
  const ledger = readLedger();
  const hexRecords = saveHexEventManualResolution(ledger.hexRecords, recordId, { notes, now });
  await writeStore(ledger, hexRecords);
  return recordFrom({ ...ledger, hexRecords }, recordId)?.eventResolution ?? null;
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
