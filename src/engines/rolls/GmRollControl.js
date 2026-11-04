/** Reusable GM-controlled ZFT roll helpers.
 * Forced modes alter the evaluated die face/total before the roll is posted,
 * so downstream rules still consume a real Foundry Roll and players see dice.
 */
export const ZFT_D20_OUTCOMES = Object.freeze(["strongSuccess", "success", "failure", "majorFailure"]);

const copy = value => typeof globalThis.structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const isInt = value => Number.isSafeInteger(Number(value));

export function d20OutcomeFor({ raw, modifier = 0, dc } = {}) {
  const face = Number(raw), mod = Number(modifier), target = Number(dc);
  if (!isInt(face) || face < 1 || face > 20) throw new Error("d20 face must be an integer from 1 to 20.");
  if (!Number.isFinite(mod) || !Number.isFinite(target)) throw new Error("A numeric modifier and DC are required.");
  const total = face + mod;
  const margin = total - target;
  const outcome = margin >= 5 ? "strongSuccess" : margin >= 0 ? "success" : margin >= -4 ? "failure" : "majorFailure";
  return { raw: face, modifier: mod, total, dc: target, margin, outcome };
}

export function rawD20FacesForOutcome(outcome, { modifier = 0, dc } = {}) {
  if (!ZFT_D20_OUTCOMES.includes(outcome)) throw new Error(`Unknown d20 outcome ${String(outcome)}.`);
  const faces = [];
  for (let raw = 1; raw <= 20; raw++) if (d20OutcomeFor({ raw, modifier, dc }).outcome === outcome) faces.push(raw);
  if (!faces.length) throw new Error(`No d20 face can produce ${outcome} with modifier ${modifier} against DC ${dc}.`);
  return faces;
}

function randomCandidate(values) {
  if (!Array.isArray(values) || !values.length) throw new Error("No valid die results are available.");
  const configured = globalThis.CONFIG?.Dice?.randomUniform;
  const sample = typeof configured === "function" ? Number(configured()) : Math.random();
  const unit = Number.isFinite(sample) ? Math.min(0.999999999999, Math.max(0, sample)) : Math.random();
  return values[Math.floor(unit * values.length)];
}

function forceSingleDieFace(roll, faces, forcedFace) {
  const value = Number(forcedFace);
  if (!isInt(value) || value < 1 || value > faces) throw new Error(`Forced d${faces} result must be an integer from 1 to ${faces}.`);
  const die = roll?.dice?.find?.(term => Number(term?.faces) === faces)
    ?? roll?.terms?.find?.(term => Number(term?.faces) === faces && Array.isArray(term?.results));
  const result = die?.results?.find?.(entry => entry?.active !== false) ?? die?.results?.[0];
  if (!die || !result) throw new Error(`Foundry did not expose the evaluated d${faces} result for forcing.`);
  result.result = value;
  result.active = true;
  try { die._total = value; } catch {}
  return roll;
}

function forceDiceTotal(roll, count, faces, forcedTotal) {
  const total = Number(forcedTotal);
  if (!isInt(total) || total < count || total > count * faces)
    throw new Error(`Forced ${count}d${faces} total must be from ${count} to ${count * faces}.`);
  const die = roll?.dice?.find?.(term => Number(term?.faces) === faces && Array.isArray(term?.results));
  if (!die || die.results.length < count) throw new Error(`Foundry did not expose ${count}d${faces} results for forcing.`);
  let remaining = total;
  const values = [];
  for (let i = 0; i < count; i++) {
    const diceLeft = count - i - 1;
    const minRest = diceLeft;
    const value = Math.min(faces, Math.max(1, remaining - minRest));
    values.push(value);
    remaining -= value;
  }
  if (remaining !== 0) throw new Error(`Unable to distribute forced ${count}d${faces} total ${total}.`);
  for (let i = 0; i < count; i++) {
    die.results[i].result = values[i];
    die.results[i].active = true;
  }
  try { die._total = total; } catch {}
  return roll;
}

async function explicitRollSpeaker({ actorUuid = null, speakerAlias = "ZFT Overland Travel" } = {}) {
  if (actorUuid) {
    if (typeof globalThis.fromUuid !== "function") throw new Error("Foundry fromUuid is unavailable for Actor-owned ZFT rolls.");
    const document = await globalThis.fromUuid(actorUuid);
    const actor = document?.actor ?? document;
    if (!actor?.id || !actor?.name) throw new Error("The selected ZFT roll Actor could not be resolved.");
    const token = actor?.token ?? (document?.documentName === "Token" ? document : null);
    if (token?.id) {
      const sceneId = token.parent?.id ?? token.scene?.id ?? null;
      return { ...(sceneId ? { scene: sceneId } : {}), token: token.id, actor: actor.id, alias: actor.name };
    }
    return { actor: actor.id, alias: actor.name };
  }
  return { alias: String(speakerAlias || "ZFT Overland Travel") };
}

async function postRoll(roll, flavor, speakerOptions = {}) {
  let message = null;
  if (typeof roll.toMessage === "function") {
    message = await roll.toMessage({ speaker: await explicitRollSpeaker(speakerOptions), flavor });
  }
  if (globalThis.game?.modules?.get?.("dice-so-nice")?.active && message?.id &&
      typeof globalThis.game?.dice3d?.waitFor3DAnimationByMessageID === "function") {
    try { await globalThis.game.dice3d.waitFor3DAnimationByMessageID(message.id); }
    catch (error) { console.warn("[ZFT] ⚠️ Dice animation unavailable", error); }
  }
  return message;
}

export async function rollControlledD20({ modifier = 0, dc, control = null, flavor = "ZFT Roll", actorUuid = null, speakerAlias = "ZFT Overland Travel" } = {}) {
  if (typeof globalThis.Roll !== "function") throw new Error("Foundry Roll is unavailable.");
  const mode = String(control?.mode ?? "normal");
  let forcedFace = null;
  let requestedOutcome = null;
  if (mode === "exact") forcedFace = Number(control?.raw);
  else if (mode === "outcome") {
    requestedOutcome = String(control?.outcome ?? "");
    forcedFace = randomCandidate(rawD20FacesForOutcome(requestedOutcome, { modifier, dc }));
  } else if (mode !== "normal") throw new Error(`Unknown GM roll mode ${mode}.`);

  let roll = await new Roll(`1d20 + ${Number(modifier) || 0}`).evaluate();
  if (forcedFace !== null) {
    forceSingleDieFace(roll, 20, forcedFace);
    try { roll._total = forcedFace + (Number(modifier) || 0); } catch {}
  }
  const raw = Number(roll?.dice?.find?.(term => Number(term?.faces) === 20)?.results?.find?.(entry => entry?.active !== false)?.result);
  const result = d20OutcomeFor({ raw, modifier, dc });
  await postRoll(roll, flavor, { actorUuid, speakerAlias });
  return { ...result, mode, requestedOutcome, forced: mode !== "normal", executorUserId: globalThis.game?.user?.id ?? null };
}

export async function rollControlledDice({ count = 1, faces = 4, control = null, flavor = "ZFT Roll", actorUuid = null, speakerAlias = "ZFT Overland Travel" } = {}) {
  if (typeof globalThis.Roll !== "function") throw new Error("Foundry Roll is unavailable.");
  const n = Number(count), f = Number(faces);
  if (!isInt(n) || n < 1 || n > 20 || !isInt(f) || f < 2 || f > 100) throw new Error("Invalid dice formula.");
  const mode = String(control?.mode ?? "normal");
  let roll = await new Roll(`${n}d${f}`).evaluate();
  if (mode === "exact") forceDiceTotal(roll, n, f, Number(control?.total));
  else if (mode !== "normal") throw new Error(`Unknown GM dice mode ${mode}.`);
  const total = mode === "exact" ? Number(control?.total) : Number(roll.total);
  try { if (mode === "exact") roll._total = total; } catch {}
  await postRoll(roll, flavor, { actorUuid, speakerAlias });
  return { formula: `${n}d${f}`, total, mode, forced: mode !== "normal", executorUserId: globalThis.game?.user?.id ?? null };
}

export function detachedRollEvidence(value) { return copy(value); }
