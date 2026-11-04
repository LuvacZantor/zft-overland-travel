/** Pure Expedition System 1.1 Travel Quality, Momentum, and Event resolution.
 * No Foundry globals, settings, dice, world time, or downstream event engines.
 */

export const EXPEDITION_MOMENTUM_TRACK = Object.freeze([
  "deteriorating", "risky", "neutral", "prepared", "favored"
]);

export const EXPEDITION_EVENT_TYPES = Object.freeze({
  MAJOR_COMPLICATION: "majorComplication",
  COMPLICATION: "complication",
  QUIET_TRAVEL: "quietTravel",
  OPPORTUNITY: "opportunity"
});

export const EXPEDITION_EVENT_LABELS = Object.freeze({
  [EXPEDITION_EVENT_TYPES.MAJOR_COMPLICATION]: "Major Complication",
  [EXPEDITION_EVENT_TYPES.COMPLICATION]: "Complication",
  [EXPEDITION_EVENT_TYPES.QUIET_TRAVEL]: "Quiet Travel",
  [EXPEDITION_EVENT_TYPES.OPPORTUNITY]: "Opportunity"
});

export const EXPEDITION_MOMENTUM_EVENT_MODIFIER = Object.freeze({
  favored: 2,
  prepared: 1,
  neutral: 0,
  risky: -1,
  deteriorating: -2
});

const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const copy = value => typeof globalThis.structuredClone === "function"
  ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const fail = message => { throw new Error(`[ZFT][HexTravel] Expedition outcome: ${message}`); };

export function normalizeExpeditionMomentum(value) {
  return EXPEDITION_MOMENTUM_TRACK.includes(value) ? value : "neutral";
}

export function expeditionMomentumFromStore(store) {
  if (!isObject(store)) return "neutral";
  const value = store.momentum;
  if (value === undefined || value === null || value === "") return "neutral";
  if (!EXPEDITION_MOMENTUM_TRACK.includes(value)) fail(`saved Momentum ${String(value)} is invalid.`);
  return value;
}

function normalizedRuling(result) {
  const ruling = result?.ruling ?? "roll";
  return ["roll", "success", "failure"].includes(ruling) ? ruling : "roll";
}

function pointResult({ role, roleName, status, total, dc, ruling, success }) {
  if (["unassigned", "absent"].includes(status)) {
    return { role, roleName, status, total: null, dc, margin: null, ruling: null,
      success: null, successPoints: 0, failurePoints: 0 };
  }
  if (status !== "checked") fail(`${roleName} is not resolved.`);
  const numericTotal = Number(total);
  if (!Number.isFinite(numericTotal)) fail(`${roleName} has no numeric result.`);
  const effectiveRuling = normalizedRuling({ ruling });
  const effectiveSuccess = effectiveRuling === "roll" ? Boolean(success) : effectiveRuling === "success";
  const margin = numericTotal - dc;

  // A binary GM override is deliberately worth one point on the selected side.
  if (effectiveRuling !== "roll") {
    return { role, roleName, status: "checked", total: numericTotal, dc, margin,
      ruling: effectiveRuling, success: effectiveSuccess,
      successPoints: effectiveSuccess ? 1 : 0, failurePoints: effectiveSuccess ? 0 : 1 };
  }

  if (effectiveSuccess) {
    return { role, roleName, status: "checked", total: numericTotal, dc, margin,
      ruling: "roll", success: true,
      successPoints: margin >= 5 ? 2 : 1, failurePoints: 0 };
  }
  return { role, roleName, status: "checked", total: numericTotal, dc, margin,
    ruling: "roll", success: false,
    successPoints: 0, failurePoints: margin <= -5 ? 2 : 1 };
}

function navigationRole(record, role, roleName) {
  const dc = Number(record?.navigation?.dc ?? record?.context?.difficulty?.dc);
  if (!Number.isFinite(dc)) fail("Navigation DC is missing.");
  const value = record?.navigation?.[role];
  if (!value) return pointResult({ role, roleName, status: "unassigned", dc });
  return pointResult({
    role, roleName, status: "checked", total: value.total, dc,
    ruling: value.ruling ?? "roll", success: value.success
  });
}

function pairedRole(record, phase, role, roleName) {
  const saved = record?.roles?.[phase];
  const result = saved?.results?.find?.(entry => entry?.role === role);
  const dc = Number(saved?.dc ?? record?.context?.difficulty?.dc);
  if (!Number.isFinite(dc)) fail(`${roleName} DC is missing.`);
  if (!result) fail(`${roleName} result is missing from ${phase}.`);
  return pointResult({
    role, roleName, status: result.status, total: result.total, dc,
    ruling: result.ruling, success: result.success
  });
}

export function buildTravelQuality(record) {
  if (!isObject(record) || !isObject(record.phases)) fail("a saved hex record is required.");
  for (const phase of ["reconnaissance", "support"]) {
    if (record.phases[phase] !== "completed") fail(`${phase} must be completed first.`);
  }
  const results = [
    navigationRole(record, "guide", "Guide"),
    navigationRole(record, "vanguard", "Vanguard"),
    pairedRole(record, "reconnaissance", "scout", "Scout"),
    pairedRole(record, "reconnaissance", "tracker", "Tracker"),
    pairedRole(record, "support", "forager", "Forager"),
    pairedRole(record, "support", "coordinator", "Coordinator")
  ];
  const successPoints = results.reduce((sum, result) => sum + result.successPoints, 0);
  const failurePoints = results.reduce((sum, result) => sum + result.failurePoints, 0);
  const quality = successPoints > failurePoints ? "successful" : successPoints < failurePoints ? "poor" : "neutral";
  return { schema: 1, quality, successPoints, failurePoints, results: copy(results) };
}

export function shiftExpeditionMomentum(momentum, quality) {
  const before = normalizeExpeditionMomentum(momentum);
  if (!["successful", "neutral", "poor"].includes(quality)) fail(`unknown Travel Quality ${String(quality)}.`);
  const direction = quality === "successful" ? 1 : quality === "poor" ? -1 : 0;
  const beforeIndex = EXPEDITION_MOMENTUM_TRACK.indexOf(before);
  const after = EXPEDITION_MOMENTUM_TRACK[clamp(beforeIndex + direction, 0, EXPEDITION_MOMENTUM_TRACK.length - 1)];
  return { before, after, shift: EXPEDITION_MOMENTUM_TRACK.indexOf(after) - beforeIndex };
}

export function eventTypeFromFinal(final) {
  if (!Number.isSafeInteger(final) || final < 1 || final > 20) fail("final Event roll must be an integer from 1 to 20.");
  if (final <= 5) return EXPEDITION_EVENT_TYPES.MAJOR_COMPLICATION;
  if (final <= 10) return EXPEDITION_EVENT_TYPES.COMPLICATION;
  if (final <= 15) return EXPEDITION_EVENT_TYPES.QUIET_TRAVEL;
  return EXPEDITION_EVENT_TYPES.OPPORTUNITY;
}

export function resolveExpeditionEvent(eventRoll, momentum) {
  const raw = Number(eventRoll);
  if (!Number.isSafeInteger(raw) || raw < 1 || raw > 20) fail("Event die must be an integer from 1 to 20.");
  const normalizedMomentum = normalizeExpeditionMomentum(momentum);
  const modifier = EXPEDITION_MOMENTUM_EVENT_MODIFIER[normalizedMomentum];
  const final = clamp(raw + modifier, 1, 20);
  const type = eventTypeFromFinal(final);
  return { schema: 1, raw, momentum: normalizedMomentum, modifier, final,
    type, label: EXPEDITION_EVENT_LABELS[type] };
}

export function eventRouteFor(type, now = Date.now()) {
  const resolvedAt = Number(now);
  if (!Number.isSafeInteger(resolvedAt) || resolvedAt < 0) fail("resolution timestamp must be a nonnegative integer.");
  if (type === EXPEDITION_EVENT_TYPES.QUIET_TRAVEL) {
    return {
      schema: 1, engine: "quietTravel", status: "resolved", resolvedAt,
      outcome: "nothingHappens",
      summary: "Quiet Travel: nothing happens. Normal travel may continue."
    };
  }
  if (type === EXPEDITION_EVENT_TYPES.MAJOR_COMPLICATION) {
    return { schema: 1, engine: "complication", severity: "major", status: "pending", resolvedAt: null };
  }
  if (type === EXPEDITION_EVENT_TYPES.COMPLICATION) {
    return { schema: 1, engine: "complication", severity: "standard", status: "pending", resolvedAt: null };
  }
  if (type === EXPEDITION_EVENT_TYPES.OPPORTUNITY) {
    return { schema: 1, engine: "opportunity", status: "pending", resolvedAt: null };
  }
  fail(`unknown Event type ${String(type)}.`);
}

export function buildHexExpeditionPreparation(record, { momentum = "neutral", now = Date.now() } = {}) {
  if (!isObject(record) || typeof record.id !== "string" || !record.id) fail("a saved hex record is required.");
  const resolvedAt = Number(now);
  if (!Number.isSafeInteger(resolvedAt) || resolvedAt < 0) fail("resolution timestamp must be a nonnegative integer.");
  const travelQuality = buildTravelQuality(record);
  const momentumResult = shiftExpeditionMomentum(momentum, travelQuality.quality);
  return { schema: 1, recordId: record.id, resolvedAt, travelQuality, momentum: momentumResult };
}

export function buildHexExpeditionEvent(record, { eventRoll, now = Date.now() } = {}) {
  if (!isObject(record) || typeof record.id !== "string" || !record.id) fail("a saved hex record is required.");
  if (!isObject(record.travelQuality) || !isObject(record.momentum) ||
      record.phases?.travelQuality !== "completed" || record.phases?.momentum !== "completed")
    fail("Travel Quality and Momentum must be completed before the Event roll.");
  const resolvedAt = Number(now);
  if (!Number.isSafeInteger(resolvedAt) || resolvedAt < 0) fail("resolution timestamp must be a nonnegative integer.");
  const event = resolveExpeditionEvent(eventRoll, record.momentum.after);
  const eventResolution = eventRouteFor(event.type, resolvedAt);
  return { schema: 1, recordId: record.id, resolvedAt, event, eventResolution };
}

export function buildHexExpeditionOutcome(record, { momentum = "neutral", eventRoll, now = Date.now() } = {}) {
  const preparation = buildHexExpeditionPreparation(record, { momentum, now });
  const event = resolveExpeditionEvent(eventRoll, preparation.momentum.after);
  const eventResolution = eventRouteFor(event.type, preparation.resolvedAt);
  return { ...preparation, event, eventResolution };
}

export function isEventResolutionComplete(value) {
  return value?.status === "resolved" || value?.status === "manual";
}
