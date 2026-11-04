/** Expedition System 1.1 Complication record helpers.
 * Dev.123 expands Navigation into eight narrative primary Complications while
 * preserving the additive schema-1 record contract introduced in dev.112.
 */

const SCHEMA = 1;
const EVENT_TYPES = new Set(["complication", "majorComplication"]);
const SEVERITIES = new Set(["standard", "major"]);
const RECON_STATES = new Set(["full", "partial", "none"]);
const STATUSES = new Set(["pending", "resolved"]);
const OUTCOMES = new Set(["strongSuccess", "success", "failure", "majorFailure"]);
const RESOLUTION_METHODS = new Set(["roll", "direct"]);
const CONSEQUENCE_TIERS = Object.freeze({ strongSuccess: [0,1], success: [1,2], failure: [2,3], majorFailure: [3,4] });
const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const copy = value => typeof globalThis.structuredClone === "function"
  ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const fail = message => { throw new Error(`[ZFT][Complication] ${message}`); };

export const NAVIGATION_CONSEQUENCE_TYPES = Object.freeze({
  lostTime: Object.freeze({ id: "lostTime", label: "Lost Time" }),
  lostProgress: Object.freeze({ id: "lostProgress", label: "Lost Progress" }),
  resourceLoss: Object.freeze({ id: "resourceLoss", label: "Resource Loss" }),
  hpDamage: Object.freeze({ id: "hpDamage", label: "HP Damage" }),
  exhaustion: Object.freeze({ id: "exhaustion", label: "Exhaustion" }),
  threat: Object.freeze({ id: "threat", label: "Threat" })
});

export const RESOURCE_LOSS_ITEMS = Object.freeze([
  Object.freeze({ id: "rations", label: "Rations" }),
  Object.freeze({ id: "water", label: "Water" }),
  Object.freeze({ id: "healersKit", label: "Healer's Kit Uses" }),
  Object.freeze({ id: "healingPotions", label: "Healing Potions" }),
  Object.freeze({ id: "ammunition", label: "Ammunition" }),
  Object.freeze({ id: "lightFuel", label: "Light / Fuel" })
]);

const nav = ({ id, label, recoveryObjective, responsePalette, partialClue, outcomes, allowedConsequences, details }) => Object.freeze({
  category: Object.freeze({ id: "navigation", label: "Navigation" }),
  primaryType: Object.freeze({ id, label }),
  recoveryObjective,
  responsePalette,
  support: "operational",
  threatEligibility: allowedConsequences.includes("threat") ? "conditional" : "none",
  partialClue,
  outcomes: Object.freeze(outcomes),
  allowedConsequences: Object.freeze([...allowedConsequences]),
  details: Object.freeze([...details])
});

export const NAVIGATION_COMPLICATIONS = Object.freeze([
  nav({
    id: "route-obscured", label: "Route Obscured",
    recoveryObjective: "Find or reconstruct the intended route.",
    responsePalette: "Find, reveal, or reconstruct the route. These are examples only; any plausible approach may be adjudicated by the GM.",
    partialClue: "The route ahead is difficult to read or partially obscured.",
    outcomes: {
      strongSuccess: "No added travel time; the route is identified cleanly.",
      success: "Minor or reduced delay.",
      failure: "Full navigation delay.",
      majorFailure: "Increased delay and the party becomes meaningfully displaced or exposed."
    },
    allowedConsequences: ["lostTime", "lostProgress", "threat"],
    details: [
      "Heavy fog or unnatural mist hides the route",
      "Dense vegetation has swallowed the trail",
      "Snow, sand, ash, or debris has covered all tracks",
      "Darkness or poor visibility makes landmarks unusable",
      "Recent weather has erased the established path",
      "Smoke, dust, spores, or airborne debris limits sight",
      "Multiple overlapping tracks make the correct route unclear",
      "Terrain features conceal the route until the party is nearly past it"
    ]
  }),
  nav({
    id: "path-blocked", label: "Path Blocked",
    recoveryObjective: "Clear, bypass, climb, bridge, or otherwise overcome the obstruction.",
    responsePalette: "Clear, bypass, climb, bridge, move, or magically overcome the obstruction. These are examples only; any plausible approach may be adjudicated by the GM.",
    partialClue: "Something ahead is blocking or making the normal route unsafe.",
    outcomes: {
      strongSuccess: "No added time; passage is opened efficiently.",
      success: "Reduced delay.",
      failure: "Full delay to clear or bypass.",
      majorFailure: "Increased delay plus damaged gear, injury risk, or a substantially longer detour."
    },
    allowedConsequences: ["lostTime", "resourceLoss", "hpDamage", "exhaustion"],
    details: [
      "Fallen trees or dense growth block passage",
      "Rockslide or collapsed earth seals the route",
      "Floodwater has swallowed the path",
      "A bridge, causeway, or constructed crossing has collapsed",
      "A sinkhole, fissure, or sudden drop cuts through the route",
      "Ice, mud, scree, or unstable ground makes passage unsafe",
      "Ruins or wreckage obstruct the way",
      "A recently formed natural barrier completely blocks normal travel"
    ]
  }),
  nav({
    id: "false-trail", label: "False Trail",
    recoveryObjective: "Recognize the mistake and recover the correct route.",
    responsePalette: "Recognize the deception, backtrack, compare signs, use maps, magic, or local knowledge. These are examples only; any plausible approach may be adjudicated by the GM.",
    partialClue: "The route signs do not fully agree with the expedition's expectations.",
    outcomes: {
      strongSuccess: "The false route is caught before meaningful time is lost.",
      success: "Minor delay while correcting course.",
      failure: "Full delay from following and correcting the false route.",
      majorFailure: "Increased delay; the party becomes significantly displaced or enters worse terrain."
    },
    allowedConsequences: ["lostTime", "lostProgress", "threat"],
    details: [
      "An old trail appears more traveled than the correct route",
      "Animal tracks resemble signs of regular passage",
      "Travelers or creatures have created a misleading secondary path",
      "Previous trail markers have been moved or damaged",
      "A route that once worked now ends abruptly",
      "Similar terrain features make the wrong direction appear correct",
      "Deliberate markings direct travelers away from the true route",
      "The party unknowingly follows its own earlier tracks or a looping path"
    ]
  }),
  nav({
    id: "dangerous-crossing", label: "Dangerous Crossing",
    recoveryObjective: "Get the expedition across safely or establish another crossing.",
    responsePalette: "Scout, secure ropes, build support, find another crossing, use movement magic, or accept the risk. These are examples only; any plausible approach may be adjudicated by the GM.",
    partialClue: "A hazardous crossing lies ahead and will require a deliberate approach.",
    outcomes: {
      strongSuccess: "Crossing is solved without meaningful delay or loss.",
      success: "Reduced delay and controlled risk.",
      failure: "Full delay to cross safely or recover from difficulty.",
      majorFailure: "Increased delay plus injury, lost gear, separation, or another concrete setback."
    },
    allowedConsequences: ["lostTime", "resourceLoss", "hpDamage", "exhaustion", "threat"],
    details: [
      "Fast or deep water must be crossed",
      "A ravine, gorge, or fissure blocks the route",
      "A narrow ledge or exposed ridge must be traversed",
      "An unstable bridge or natural span must be crossed",
      "Loose scree, unstable slope, or crumbling ground lies ahead",
      "Deep mud, bog, marsh, or sucking ground impedes passage",
      "Ice, snowfield, or another unstable surface must be crossed",
      "Crumbling ruins or damaged structures provide the only passage"
    ]
  }),
  nav({
    id: "forced-detour", label: "Forced Detour",
    recoveryObjective: "Find and successfully navigate an alternate route.",
    responsePalette: "Find a shorter bypass, negotiate passage, create a route, use magic, or accept the long way around. These are examples only; any plausible approach may be adjudicated by the GM.",
    partialClue: "The direct route may no longer be usable and an alternate way may be required.",
    outcomes: {
      strongSuccess: "A near-direct alternative is found.",
      success: "Reduced detour.",
      failure: "Full detour delay.",
      majorFailure: "Long detour plus a secondary logistical or hazard consequence."
    },
    allowedConsequences: ["lostTime", "lostProgress", "threat"],
    details: [
      "Flooding forces the party around low ground",
      "A cliff, escarpment, or steep rise prevents direct travel",
      "Dense vegetation or impassable terrain forces a wide bypass",
      "Fire, smoke, lava, toxic ground, or another hazard blocks the direct route",
      "A damaged road or trail redirects travel through rough terrain",
      "Territorial creatures make the direct route unsafe without confrontation",
      "A settlement, camp, fortification, or controlled area blocks passage",
      "A newly formed terrain feature makes the mapped route impossible"
    ]
  }),
  nav({
    id: "landmark-problem", label: "Landmark Problem",
    recoveryObjective: "Re-establish position using alternate references.",
    responsePalette: "Re-identify the landmark, triangulate, use maps, magic, memory, or terrain features. These are examples only; any plausible approach may be adjudicated by the GM.",
    partialClue: "An expected landmark cannot be relied on for orientation.",
    outcomes: {
      strongSuccess: "Orientation is restored with no added time.",
      success: "Brief or reduced delay.",
      failure: "Full delay while re-establishing position.",
      majorFailure: "Increased delay and a meaningful navigational error before correction."
    },
    allowedConsequences: ["lostTime", "lostProgress", "threat"],
    details: [
      "The expected landmark is missing",
      "The landmark has collapsed or been destroyed",
      "Vegetation, weather, or terrain conceals it",
      "Several similar landmarks make identification uncertain",
      "The landmark has changed significantly since it was recorded",
      "The landmark was mapped or described incorrectly",
      "The party reaches the landmark from an unexpected direction",
      "Something has deliberately altered, moved, or disguised the landmark"
    ]
  }),
  nav({
    id: "route-split", label: "Route Split",
    recoveryObjective: "Determine which route is correct or strategically best.",
    responsePalette: "Compare terrain, tracks, maps, local knowledge, divination, or scout both options. These are examples only; any plausible approach may be adjudicated by the GM.",
    partialClue: "The route divides and the correct or best path is uncertain.",
    outcomes: {
      strongSuccess: "Correct or best route chosen immediately.",
      success: "A short verification delay.",
      failure: "Full delay from testing or reversing a poor choice.",
      majorFailure: "Increased delay; wrong branch creates another obstacle or displacement."
    },
    allowedConsequences: ["lostTime", "lostProgress", "threat"],
    details: [
      "Two equally traveled paths diverge",
      "A new path branches from the established route",
      "The trail divides repeatedly into smaller paths",
      "Maps and physical terrain disagree about which branch is correct",
      "Trail markers point in conflicting directions",
      "One route appears shorter but substantially more difficult",
      "One route appears safer but significantly longer",
      "Signs suggest both routes may eventually reach the destination by different means"
    ]
  }),
  nav({
    id: "progress-lost", label: "Progress Lost",
    recoveryObjective: "Determine where the expedition went wrong and recover its course.",
    responsePalette: "Reorient, backtrack, triangulate, use landmarks, magic, or recover the intended route. These are examples only; any plausible approach may be adjudicated by the GM.",
    partialClue: "The expedition's actual progress no longer matches what was expected.",
    outcomes: {
      strongSuccess: "Lost progress is diagnosed early enough to avoid extra time.",
      success: "Reduced recovery delay.",
      failure: "Full recovery delay.",
      majorFailure: "Increased delay and substantial lost ground or a secondary complication."
    },
    allowedConsequences: ["lostTime", "lostProgress", "threat"],
    details: [
      "The party discovers it has been traveling in the wrong direction",
      "The route has gradually curved away from the destination",
      "The party has unknowingly doubled back",
      "Difficult terrain has produced far less progress than expected",
      "A navigation assumption proves incorrect after significant travel",
      "The party reaches an unexpected location and must reorient",
      "A shortcut fails and returns the expedition near its earlier position",
      "The party cannot determine exactly where along the intended route it currently is"
    ]
  })
]);

export const ROUTE_OBSCURED = NAVIGATION_COMPLICATIONS[0];

export function navigationComplicationByRoll(roll) {
  const value = Number(roll);
  if (!Number.isSafeInteger(value) || value < 1 || value > NAVIGATION_COMPLICATIONS.length)
    fail("Navigation Complication roll must be an integer from 1 to 8.");
  return NAVIGATION_COMPLICATIONS[value - 1];
}

export function navigationComplicationById(id) {
  return NAVIGATION_COMPLICATIONS.find(entry => entry.primaryType.id === id) ?? null;
}

function validateRecord(record) {
  if (!isObject(record) || record.schema !== SCHEMA || typeof record.id !== "string" || !record.id ||
      typeof record.sourceHexRecordId !== "string" || !record.sourceHexRecordId ||
      !EVENT_TYPES.has(record.eventType) || !SEVERITIES.has(record.severity) ||
      !isObject(record.category) || typeof record.category.id !== "string" ||
      !isObject(record.primaryType) || typeof record.primaryType.id !== "string" ||
      !isObject(record.detail) || !Number.isSafeInteger(record.detail.roll) || record.detail.roll < 1 || record.detail.roll > 8 ||
      !RECON_STATES.has(record.reconnaissanceState) || !STATUSES.has(record.status)) {
    fail("malformed saved Complication record.");
  }
  if (record.primaryType.roll !== undefined && (!Number.isSafeInteger(record.primaryType.roll) || record.primaryType.roll < 1 || record.primaryType.roll > 8))
    fail("malformed saved Complication primary roll.");
  if (record.generation !== undefined) {
    if (!isObject(record.generation)) fail("malformed Complication generation evidence.");
    if (record.generation.original !== undefined) {
      const original = record.generation.original;
      if (!isObject(original) || !Number.isSafeInteger(original.primaryRoll) || original.primaryRoll < 1 || original.primaryRoll > 8 ||
          !Number.isSafeInteger(original.detailRoll) || original.detailRoll < 1 || original.detailRoll > 8)
        fail("malformed original Complication generation evidence.");
    }
    if (record.generation.revisions !== undefined && !Array.isArray(record.generation.revisions))
      fail("malformed Complication generation revision history.");
  }
  if (record.resolution !== undefined) {
    if (!isObject(record.resolution) || !OUTCOMES.has(record.resolution.outcome) ||
        !Number.isSafeInteger(record.resolution.resolvedAt) || record.resolution.resolvedAt < 0 ||
        typeof record.resolution.notes !== "string") fail("malformed saved Complication resolution.");
    if (record.resolution.method !== undefined && !RESOLUTION_METHODS.has(record.resolution.method)) fail("malformed Complication resolution method.");
    if (record.resolution.roll !== undefined && !isObject(record.resolution.roll)) fail("malformed Complication roll evidence.");
    if (record.resolution.support !== undefined && !isObject(record.resolution.support)) fail("malformed Complication Support evidence.");
    if (record.resolution.consequence !== undefined && !isObject(record.resolution.consequence)) fail("malformed Complication consequence evidence.");
  }
  return record;
}

export function cloneComplicationRecords(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail("saved Complication records must be an array.");
  const ids = new Set();
  for (const record of value) {
    validateRecord(record);
    if (ids.has(record.id)) fail(`duplicate Complication record ${record.id}.`);
    ids.add(record.id);
  }
  return copy(value);
}

export function reconnaissanceStateFromHex(record) {
  const grade = record?.roles?.reconnaissance?.grade;
  if (grade === "strong") return "full";
  if (grade === "partial") return "partial";
  return "none";
}

export function buildPrototypeComplicationRecord(hexRecord, { primaryRoll = 1, detailRoll } = {}) {
  if (!isObject(hexRecord) || typeof hexRecord.id !== "string" || !hexRecord.id)
    fail("a saved Hex Travel record is required.");
  const eventType = hexRecord?.event?.type;
  if (!EVENT_TYPES.has(eventType)) fail("the Hex Travel Event is not a Complication.");
  const severity = eventType === "majorComplication" ? "major" : "standard";
  const primary = navigationComplicationByRoll(primaryRoll);
  const roll = Number(detailRoll);
  if (!Number.isSafeInteger(roll) || roll < 1 || roll > 8) fail("detail roll must be an integer from 1 to 8.");
  const text = primary.details[roll - 1];
  return {
    schema: SCHEMA,
    id: `${hexRecord.id}:complication`,
    sourceHexRecordId: hexRecord.id,
    eventType,
    severity,
    category: copy(primary.category),
    primaryType: { ...copy(primary.primaryType), roll: Number(primaryRoll) },
    detail: { id: `navigation.${primary.primaryType.id}.${roll}`, roll, text, partialClue: primary.partialClue },
    generation: { original: { primaryRoll: Number(primaryRoll), detailRoll: roll }, revisions: [] },
    reconnaissanceState: reconnaissanceStateFromHex(hexRecord),
    status: "pending"
  };
}

export function ensurePrototypeComplicationRecord(store, hexRecord, { primaryRoll = 1, detailRoll } = {}) {
  if (!isObject(store)) fail("Hex record store is required.");
  const next = copy(store);
  const records = cloneComplicationRecords(next.complications);
  const id = `${hexRecord?.id ?? ""}:complication`;
  const existing = records.find(record => record.id === id);
  if (existing) return { store: next, record: copy(existing), created: false };
  const record = buildPrototypeComplicationRecord(hexRecord, { primaryRoll, detailRoll });
  records.push(record);
  next.complications = records;
  return { store: next, record: copy(record), created: true };
}

export function reviseComplicationGeneration(store, sourceHexRecordId, { primaryRoll = null, detailRoll = null, action = "gmCorrection", note = "", now = Date.now() } = {}) {
  if (!isObject(store)) fail("Hex record store is required.");
  const next = copy(store);
  const records = cloneComplicationRecords(next.complications);
  const index = records.findIndex(record => record.sourceHexRecordId === sourceHexRecordId);
  if (index < 0) fail("the Complication record does not exist.");
  const record = records[index];
  if (record.status !== "pending") fail("only a pending Complication can have its generated result revised.");
  const fromPrimary = Number(record.primaryType?.roll);
  const fromDetail = Number(record.detail?.roll);
  const nextPrimary = primaryRoll === null || primaryRoll === undefined ? fromPrimary : Number(primaryRoll);
  const nextDetail = detailRoll === null || detailRoll === undefined ? fromDetail : Number(detailRoll);
  const definition = navigationComplicationByRoll(nextPrimary);
  if (!Number.isSafeInteger(nextDetail) || nextDetail < 1 || nextDetail > 8) fail("detail roll must be an integer from 1 to 8.");
  const original = isObject(record.generation?.original)
    ? copy(record.generation.original)
    : { primaryRoll: fromPrimary, detailRoll: fromDetail };
  const revisions = Array.isArray(record.generation?.revisions) ? copy(record.generation.revisions) : [];
  revisions.push({
    at: Number.isSafeInteger(Number(now)) ? Number(now) : Date.now(),
    action: String(action || "gmCorrection"),
    note: String(note || ""),
    from: { primaryRoll: fromPrimary, detailRoll: fromDetail },
    to: { primaryRoll: nextPrimary, detailRoll: nextDetail }
  });
  record.category = copy(definition.category);
  record.primaryType = { ...copy(definition.primaryType), roll: nextPrimary };
  record.detail = {
    id: `navigation.${definition.primaryType.id}.${nextDetail}`,
    roll: nextDetail,
    text: definition.details[nextDetail - 1],
    partialClue: definition.partialClue
  };
  record.generation = { original, revisions };
  records[index] = validateRecord(record);
  next.complications = records;
  return { store: next, record: copy(record), revision: copy(revisions.at(-1)) };
}

export function complicationConsequenceTier(outcome, severity = "standard") {
  if (!OUTCOMES.has(outcome)) fail(`unknown resolution outcome ${String(outcome)}.`);
  if (!SEVERITIES.has(severity)) fail(`unknown Complication severity ${String(severity)}.`);
  const [standard, major] = CONSEQUENCE_TIERS[outcome];
  return severity === "major" ? major : standard;
}

/** User-facing replacement for the old Tier terminology. */
export function complicationConsequenceSeverity(outcome, severity = "standard") {
  return complicationConsequenceTier(outcome, severity);
}

export function navigationSeverityPlan({ outcome, severity = "standard", supportUsed = false } = {}) {
  const originalSeverity = complicationConsequenceSeverity(outcome, severity);
  const finalSeverity = Math.max(0, originalSeverity - (supportUsed ? 1 : 0));
  return { originalSeverity, finalSeverity, supportUsed: Boolean(supportUsed) };
}

const LOST_TIME_HOURS = Object.freeze([0, 1, 2, 4, 8]);
const LOST_PROGRESS_PERCENT = Object.freeze([0, 10, 25, 50, 100]);
const RESOURCE_LOSS_PERCENT = Object.freeze([0, 10, 25, 50, 100]);
const HP_DAMAGE_PERCENT = Object.freeze([0, 10, 20, 35, 50]);
const EXHAUSTION_LEVELS = Object.freeze([0, 1, 2, 3, 4]);

function checkedSeverity(severity) {
  const value = Number(severity);
  if (!Number.isSafeInteger(value) || value < 0 || value > 4) fail("Consequence Severity must be 0–4.");
  return value;
}

export function lostTimeHoursForSeverity(severity) { return LOST_TIME_HOURS[checkedSeverity(severity)]; }
export function lostProgressPercentForSeverity(severity) { return LOST_PROGRESS_PERCENT[checkedSeverity(severity)]; }
export function resourceLossPercentForSeverity(severity) { return RESOURCE_LOSS_PERCENT[checkedSeverity(severity)]; }
export function hpDamagePercentForSeverity(severity) { return HP_DAMAGE_PERCENT[checkedSeverity(severity)]; }
export function exhaustionLevelsForSeverity(severity) { return EXHAUSTION_LEVELS[checkedSeverity(severity)]; }

export function navigationConsequenceEvidence(type, severity, options = {}) {
  const finalSeverity = checkedSeverity(severity);
  const def = NAVIGATION_CONSEQUENCE_TYPES[type];
  if (!def) fail(`unknown Navigation consequence type ${String(type)}.`);
  const base = { type: def.id, label: def.label, finalSeverity };
  if (type === "lostTime") return { ...base, plannedTimeDelta: lostTimeHoursForSeverity(finalSeverity) };
  if (type === "lostProgress") return { ...base, percent: lostProgressPercentForSeverity(finalSeverity) };
  if (type === "resourceLoss") {
    const resource = RESOURCE_LOSS_ITEMS.find(entry => entry.id === options.resourceId);
    if (!resource) fail("Resource Loss requires one approved Resource Item.");
    const currentUnits = Number(options.currentUnits);
    if (!Number.isSafeInteger(currentUnits) || currentUnits < 0) fail("Resource Loss requires a nonnegative current-unit count.");
    const percent = resourceLossPercentForSeverity(finalSeverity);
    const unitsLost = Math.min(currentUnits, Math.ceil(currentUnits * percent / 100));
    return { ...base, resource: copy(resource), percent, currentUnits, unitsLost, targetItemUuid: options.targetItemUuid ? String(options.targetItemUuid) : null };
  }
  if (type === "hpDamage") {
    const percent = hpDamagePercentForSeverity(finalSeverity);
    const targets = Array.isArray(options.targets) ? options.targets.map(target => ({
      actorUuid: String(target.actorUuid ?? ""), actorName: String(target.actorName ?? ""), maxHp: Number(target.maxHp),
      damage: Math.ceil(Math.max(0, Number(target.maxHp) || 0) * percent / 100)
    })).filter(target => target.actorUuid && Number.isFinite(target.maxHp)) : [];
    if (!targets.length && finalSeverity > 0) fail("HP Damage requires at least one affected character.");
    return { ...base, percent, damageType: String(options.damageType ?? ""), targets };
  }
  if (type === "exhaustion") {
    const levels = exhaustionLevelsForSeverity(finalSeverity);
    const targets = Array.isArray(options.targets) ? options.targets.map(target => ({ actorUuid: String(target.actorUuid ?? ""), actorName: String(target.actorName ?? "") })).filter(target => target.actorUuid) : [];
    if (!targets.length && levels > 0) fail("Exhaustion requires at least one affected character.");
    return { ...base, levels, targets };
  }
  if (type === "threat") return { ...base, handoff: "threatEngine", status: "pending" };
  return base;
}

/** Deprecated dev.120 compatibility helpers. The live dev.123 workflow does not
 * use consequence dice. Retained only so old saved/test integrations can load.
 */
export function navigationConsequencePlan({ outcome, severity = "standard", supportUsed = false } = {}) {
  const originalTier = complicationConsequenceTier(outcome, severity);
  const finalTier = Math.max(0, originalTier - (supportUsed ? 1 : 0));
  const plan = finalTier === 0 ? { fixedHours: 0, dice: null }
    : finalTier === 1 ? { fixedHours: 1, dice: null }
    : finalTier === 2 ? { fixedHours: 0, dice: { count: 1, faces: 4 } }
    : { fixedHours: 0, dice: { count: 2, faces: 4 } };
  return { originalTier, finalTier, supportUsed: Boolean(supportUsed), secondarySetback: finalTier === 4, ...plan };
}

export function finalizeNavigationConsequence(plan, { rolledHours = null } = {}) {
  if (!isObject(plan) || !Number.isSafeInteger(plan.originalTier) || !Number.isSafeInteger(plan.finalTier)) fail("valid Navigation consequence plan required.");
  let hours = Number(plan.fixedHours) || 0;
  if (plan.dice) {
    const rolled = Number(rolledHours);
    const minimum = plan.dice.count, maximum = plan.dice.count * plan.dice.faces;
    if (!Number.isSafeInteger(rolled) || rolled < minimum || rolled > maximum) fail("Navigation consequence roll is outside the valid range.");
    hours += rolled;
  }
  return { channel: "time", originalTier: plan.originalTier, finalTier: plan.finalTier, plannedTimeDelta: hours, secondarySetback: Boolean(plan.secondarySetback) };
}

export function resolveComplicationForHex(store, sourceHexRecordId, { outcome = null, notes = "", method = null, roll = null, supportUsed = false, consequence = null, now = Date.now() } = {}) {
  if (!isObject(store)) fail("Hex record store is required.");
  const next = copy(store);
  const records = cloneComplicationRecords(next.complications);
  const record = records.find(entry => entry.sourceHexRecordId === sourceHexRecordId);
  if (!record) return { store: next, record: null, changed: false };
  if (record.status === "resolved") return { store: next, record: copy(record), changed: false };
  if (outcome !== null && !OUTCOMES.has(outcome)) fail(`unknown resolution outcome ${String(outcome)}.`);
  if (method !== null && !RESOLUTION_METHODS.has(method)) fail(`unknown resolution method ${String(method)}.`);
  const resolvedAt = Number(now);
  if (outcome !== null && (!Number.isSafeInteger(resolvedAt) || resolvedAt < 0)) fail("resolution timestamp must be a nonnegative integer.");
  record.status = "resolved";
  if (outcome !== null) record.resolution = { outcome, notes: String(notes ?? "").trim(), resolvedAt, ...(method ? { method } : {}), ...(roll ? { roll: copy(roll) } : {}), support: { type: "operational", used: Boolean(supportUsed) }, ...(consequence ? { consequence: copy(consequence) } : {}) };
  next.complications = records;
  return { store: next, record: copy(record), changed: true };
}

export function complicationRecordForHex(store, sourceHexRecordId) {
  if (!isObject(store)) return null;
  return cloneComplicationRecords(store.complications).find(record => record.sourceHexRecordId === sourceHexRecordId) ?? null;
}
