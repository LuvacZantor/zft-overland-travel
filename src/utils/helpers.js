export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function randomInt(max) {
  const rng = globalThis.CONFIG?.Dice?.randomUniform ?? Math.random;
  return Math.floor(rng() * max) + 1;
}

export function sample(values) {
  if (!Array.isArray(values) || !values.length) return null;
  return values[randomInt(values.length) - 1] ?? null;
}

export function clone(value) {
  if (globalThis.structuredClone) return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function mergeDeep(target, source) {
  const output = clone(target ?? {});
  for (const [key, value] of Object.entries(source ?? {})) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      output[key] &&
      typeof output[key] === "object" &&
      !Array.isArray(output[key])
    ) {
      output[key] = mergeDeep(output[key], value);
    } else {
      output[key] = clone(value);
    }
  }
  return output;
}

export function findById(collection, id) {
  return collection.find((entry) => entry.id === id) ?? null;
}

export function resultFromRoll(table, roll) {
  return table.find((entry) => roll >= entry.min && roll <= entry.max) ?? null;
}
