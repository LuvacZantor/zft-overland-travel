/** Pure multi-Threat persistence model for Expedition System 1.1.
 * Threats do not advance with time. Every change is explicit and recorded.
 */

export const HEX_THREAT_STAGES = Object.freeze(["emerging", "developing", "imminent", "immediate"]);
export const HEX_THREAT_VISIBILITY = Object.freeze(["hidden", "partial", "full"]);

const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const copy = value => typeof globalThis.structuredClone === "function"
  ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const fail = message => { throw new Error(`[ZFT][HexTravel] Threat state: ${message}`); };
const validText = value => typeof value === "string" && value.trim().length > 0;
const validTime = value => Number.isSafeInteger(Number(value)) && Number(value) >= 0;

function validateThreat(threat) {
  if (!isObject(threat) || threat.schema !== 1 || !validText(threat.id) || !validText(threat.name) ||
      !HEX_THREAT_STAGES.includes(threat.stage) || !["active", "resolved"].includes(threat.status) ||
      !HEX_THREAT_VISIBILITY.includes(threat.visibility) || !validTime(threat.createdAt) ||
      !validTime(threat.lastChangedAt) || !Array.isArray(threat.history)) fail("malformed Threat record.");
  return threat;
}

export function cloneThreats(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail("Threat collection must be an array.");
  const ids = new Set();
  for (const threat of value) {
    validateThreat(threat);
    if (ids.has(threat.id)) fail(`duplicate Threat ID ${threat.id}.`);
    ids.add(threat.id);
  }
  return copy(value);
}

function appendHistory(threat, entry) {
  threat.history = [...(threat.history ?? []), copy(entry)];
}

export function createThreat(threats, {
  id, name, stage = "emerging", visibility = "hidden", warning = "Signs of danger have been detected.",
  source = { type: "gm", detail: "GM introduced" }, recordId = null, recordNumber = null, now = Date.now()
} = {}) {
  const list = cloneThreats(threats);
  if (!validText(id) || list.some(threat => threat.id === id)) fail("new Threat requires a unique stable ID.");
  if (!validText(name)) fail("new Threat requires a name.");
  if (!HEX_THREAT_STAGES.includes(stage)) fail(`invalid starting stage ${String(stage)}.`);
  if (!HEX_THREAT_VISIBILITY.includes(visibility)) fail(`invalid visibility ${String(visibility)}.`);
  if (!validTime(now)) fail("Threat timestamp must be a nonnegative integer.");
  const createdAt = Number(now);
  const threat = {
    schema: 1, id, name: name.trim(), stage, status: "active", visibility,
    warning: String(warning ?? "").trim() || "Signs of danger have been detected.",
    source: isObject(source) ? copy(source) : { type: "gm", detail: String(source ?? "GM introduced") },
    createdAt, lastChangedAt: createdAt,
    createdRecordId: recordId || null,
    createdRecordNumber: Number.isSafeInteger(Number(recordNumber)) ? Number(recordNumber) : null,
    history: [{ at: createdAt, action: "created", from: null, to: stage, reason: "Threat created" }]
  };
  list.push(threat);
  return list;
}

function mutateThreat(threats, id, now, mutate) {
  const list = cloneThreats(threats);
  if (!validTime(now)) fail("Threat timestamp must be a nonnegative integer.");
  const threat = list.find(entry => entry.id === id);
  if (!threat) fail(`Threat ${String(id)} does not exist.`);
  mutate(threat, Number(now));
  threat.lastChangedAt = Number(now);
  return list;
}

export function advanceThreat(threats, id, { reason = "GM advanced Threat", now = Date.now() } = {}) {
  return mutateThreat(threats, id, now, (threat, at) => {
    if (threat.status !== "active") fail(`${threat.name} is already resolved.`);
    const index = HEX_THREAT_STAGES.indexOf(threat.stage);
    if (index >= HEX_THREAT_STAGES.length - 1) fail(`${threat.name} is already Immediate.`);
    const from = threat.stage;
    threat.stage = HEX_THREAT_STAGES[index + 1];
    appendHistory(threat, { at, action: "advanced", from, to: threat.stage, reason });
  });
}

export function reduceThreat(threats, id, { reason = "GM reduced Threat", now = Date.now() } = {}) {
  return mutateThreat(threats, id, now, (threat, at) => {
    if (threat.status !== "active") fail(`${threat.name} is already resolved.`);
    const index = HEX_THREAT_STAGES.indexOf(threat.stage);
    const from = threat.stage;
    if (index === 0) {
      threat.status = "resolved";
      threat.resolvedAt = at;
      appendHistory(threat, { at, action: "resolved", from, to: "resolved", reason });
      return;
    }
    threat.stage = HEX_THREAT_STAGES[index - 1];
    appendHistory(threat, { at, action: "reduced", from, to: threat.stage, reason });
  });
}

export function resolveThreat(threats, id, { reason = "GM resolved Threat", now = Date.now() } = {}) {
  return mutateThreat(threats, id, now, (threat, at) => {
    if (threat.status !== "active") fail(`${threat.name} is already resolved.`);
    const from = threat.stage;
    threat.status = "resolved";
    threat.resolvedAt = at;
    appendHistory(threat, { at, action: "resolved", from, to: "resolved", reason });
  });
}

export function setThreatVisibility(threats, id, visibility, { now = Date.now() } = {}) {
  if (!HEX_THREAT_VISIBILITY.includes(visibility)) fail(`invalid visibility ${String(visibility)}.`);
  return mutateThreat(threats, id, now, (threat, at) => {
    const from = threat.visibility;
    threat.visibility = visibility;
    appendHistory(threat, { at, action: "visibility", from, to: visibility, reason: "GM changed player information" });
  });
}
