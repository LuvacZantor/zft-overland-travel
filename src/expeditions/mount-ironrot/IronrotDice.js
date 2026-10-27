/**
 * ZFT Overland Travel dice presentation.
 * Ported from ZFT Combat Log's supported D&D5e SVG mask treatment and exact die palette.
 * Artwork stays owned by the installed D&D5e system; no system asset is vendored.
 * Pure HTML presentation helpers. No game-state changes.
 */
export const IRONROT_DIE_COLORS = Object.freeze({
  4: "#62B3FE", 5: "#FFEA05", 6: "#38D40C", 7: "#62B3FE",
  8: "#F0920F", 10: "#FFEA05", 12: "#F7F4F8", 14: "#62B3FE",
  16: "#38D40C", 20: "#FF0A0A", 24: "#F0920F",
  30: "#9F10FE", 100: "#9F10FE"
});
const SUPPORTED = new Set([4, 6, 8, 10, 12, 20]);
const escapeText = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '\"':"&quot;", "'":"&#39;"
})[c]);

export function ironrotDieIcon(faces, {size = "check"} = {}) {
  const d = Number(faces);
  const label = Number.isSafeInteger(d) && d > 0 ? `d${d}` : "die";
  const color = IRONROT_DIE_COLORS[d] ?? "#D7C3FF";
  if (!SUPPORTED.has(d)) return `<span class="zft-ir-die-fallback" aria-label="${label}">${label}</span>`;
  // Fixed, whitelist-controlled system resource. Same SVG paths as Combat Log.
  const url = `systems/dnd5e/icons/svg/dice/d${d}.svg`;
  return `<span class="zft-ir-die-icon zft-ir-die-icon--${size}" style="--zft-ir-die-color:${color};-webkit-mask-image:url('${url}');mask-image:url('${url}')" role="img" aria-label="${label}"></span>`;
}

export function ironrotDieFace(value, faces, { penalty = false } = {}) {
  // Numeric overlay is the natural face result. Do not apply it to modified d20 totals.
  const v = Number(value);
  if (!Number.isFinite(v)) return `<span class="zft-ir-die-unknown">—</span>`;
  return `<span class="zft-ir-die-face${penalty ? " zft-ir-die-face--penalty" : ""}" title="d${Number(faces)} roll: ${escapeText(v)}" aria-label="d${Number(faces)} rolled ${escapeText(v)}">${ironrotDieIcon(faces, {size:"face"})}<span class="zft-ir-die-value" aria-hidden="true">${escapeText(v)}</span></span>`;
}

export function ironrotD20Total(value) {
  const v = Number(value);
  return `<span class="zft-ir-d20-total" title="d20 check total (including modifiers)">${ironrotDieIcon(20)}<strong>${escapeText(Number.isFinite(v) ? v : value)}</strong></span>`;
}

/** Existing saved hex-card HTML is display-only; don't rewrite persisted records. */
export function decorateLegacyIronrotDice(html) {
  let value = String(html ?? "");
  if (value.includes('zft-ir-die-face')) return value;
  // Old card writer emitted these exact 24px numeric chips for ALL d4 rolls.
  value = value.replace(/<span style="display:inline-block;min-width:24px;[^"]*">(\d+)<\/span>/g,
    (_match, n) => ironrotDieFace(Number(n), 4));
  // Limit the d20 total decoration to the original travel-card result phrases.
  value = value.replace(/<strong>(\d+)<\/strong>(?= vs DC \d+ \u00b7)/g,
    (_match, n) => ironrotD20Total(n));
  value = value.replace(/<strong>(\d+)<\/strong>(?= <span style="color:#b9bec9;">\(GM adjudicates\)<\/span>)/g,
    (_match, n) => ironrotD20Total(n));
  return value;
}
