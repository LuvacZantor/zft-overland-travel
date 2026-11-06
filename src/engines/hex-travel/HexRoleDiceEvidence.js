/** Read-only, small d20 evidence extracted from native Midi-QOL/Foundry rolls.
 * The evaluated d20 and native message are authoritative. Never reroll or infer
 * advantage from the defaults sent before the player's editable roll dialog.
 */
const isObject = value => value !== null && typeof value === "object";
const finite = value => value !== undefined && value !== null && Number.isFinite(Number(value)) ? Number(value) : null;
const dieFace = value => Number.isSafeInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 20 ? Number(value) : null;

function rollCandidates(value, seen = new Set(), depth = 0) {
  if (!isObject(value) || seen.has(value) || depth > 5) return [];
  seen.add(value);
  if (Array.isArray(value)) return value.flatMap(item => rollCandidates(item, seen, depth + 1));
  const result = [];
  if (Array.isArray(value.dice) || Array.isArray(value.terms)) result.push(value);
  for (const key of ["rolls", "roll", "data", "result", "chatMessage", "message"]) {
    if (isObject(value[key])) result.push(...rollCandidates(value[key], seen, depth + 1));
  }
  return result;
}

function evidenceFromRoll(roll, total) {
  const nativeTotal = finite(roll.total ?? roll._total);
  if (nativeTotal !== null && nativeTotal !== total) return null;
  const dice = Array.isArray(roll.dice) ? roll.dice : (Array.isArray(roll.terms) ? roll.terms : []);
  const d20s = dice.filter(die => Number(die?.faces) === 20 && Array.isArray(die?.results));
  if (d20s.length !== 1) return null;
  const die = d20s[0];
  if (die.results.length < 1 || die.results.length > 2) return null;
  const faces = die.results.map(row => dieFace(row?.result));
  if (faces.some(face => face === null)) return null;
  const formula = String(roll.formula ?? roll._formula ?? die.expression ?? "");
  const mods = Array.isArray(die.modifiers) ? die.modifiers.join(" ") : "";
  const rollNotation = `${formula} ${mods}`.toLowerCase();
  const high = /(?:2\s*d\s*20\s*k\s*h\s*1?|\bkh\s*1?\b|\bkeep\s*highest\b)/i.test(rollNotation);
  const low = /(?:2\s*d\s*20\s*k\s*l\s*1?|\bkl\s*1?\b|\bkeep\s*lowest\b)/i.test(rollNotation);
  const active = die.results.map(row => row?.active !== false && row?.discarded !== true);
  let usedIndex = active.filter(Boolean).length === 1 ? active.indexOf(true) : null;
  if (usedIndex === null && faces.length === 1 && active[0]) usedIndex = 0;
  if (usedIndex === null && faces.length === 2 && high !== low) {
    usedIndex = high ? (faces[0] >= faces[1] ? 0 : 1) : (faces[0] <= faces[1] ? 0 : 1);
  }
  if (faces.length === 2 && usedIndex === null) return null;
  if (faces.length === 1 && usedIndex === null) return null;
  // If native roll data explicitly retains the die selection, preserve it even
  // when the formula lacks a recognizable keep-high/keep-low modifier.
  let mode = "unknown";
  if (faces.length === 1) mode = "normal";
  else if (high !== low) mode = high ? "advantage" : "disadvantage";
  const modifier = finite(total - faces[usedIndex]);
  return {
    mode,
    faces: faces.map((value, index) => ({ value, used: index === usedIndex })),
    usedIndex,
    modifier,
    total
  };
}

/** Caller supplies an observed/identified ChatMessage only if it belongs to
 * the same roll request; we independently enforce identity and public access.
 * No message data, IDs or private chat content is copied to the record.
 */
export function captureNativeD20Evidence({ remote = null, message = null, total, actorId = null, rollerId = null } = {}) {
  const target = finite(total);
  if (target === null) return null;
  if (message) {
    if (message.blind || (Array.isArray(message.whisper) && message.whisper.length > 0)) return null;
    if (message.isRoll !== true || (actorId && message.speaker?.actor !== actorId) ||
        (rollerId && message.author?.id !== rollerId)) return null;
    for (const roll of rollCandidates(message.rolls ?? message.roll ?? message)) {
      const evidence = evidenceFromRoll(roll, target);
      if (evidence) return evidence;
    }
  }
  for (const roll of rollCandidates(remote)) {
    const evidence = evidenceFromRoll(roll, target);
    if (evidence) return evidence;
  }
  return null;
}

export function nativeRollMessageId(value, observedId = null) {
  const first = Array.isArray(value) ? value[0] : value;
  const id = first?.messageId ?? first?.messageID ?? first?.chatMessageId ?? first?.chatMessage?.id ?? observedId;
  return typeof id === "string" && id ? id : null;
}
