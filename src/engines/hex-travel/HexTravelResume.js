/** Pure, display-only planning for the GM's unfinished-hex confirmation. */
export function planHexTravelResume(state = {}) {
  const pending = Number(state.pending);
  const hours = Number(state.hours);
  const day = Number(state.day);
  const hexes = Number(state.hexes);
  if (!Number.isSafeInteger(pending) || pending <= 0 ||
      !Number.isSafeInteger(hours) || hours < 0 ||
      !Number.isSafeInteger(day) || day < 1 ||
      !Number.isSafeInteger(hexes) || hexes < 0) {
    throw new Error("Cannot resume an invalid unfinished-hex travel record.");
  }
  const safeAvailable = Math.max(0, 8 - hours);
  const safeHours = Math.min(pending, safeAvailable);
  const forcedHours = pending - safeHours;
  const hexNumber = hexes + 1;
  const plural = count => `${count} ${count === 1 ? "hour" : "hours"}`;
  let description;
  if (forcedHours === 0) {
    description = `Continuing will record ${plural(safeHours)} toward today's travel and complete Hex ${hexNumber}.`;
  } else if (safeHours > 0) {
    description = `Continuing will record ${plural(safeHours)} of safe travel. Then you can decide whether to continue the remaining ${plural(forcedHours)} as Forced March.`;
  } else {
    description = `The party has used its 8 safe travel hours today. Continuing will ask you to decide whether to begin or resume Forced March. No additional hour is recorded until its required decisions are completed.`;
  }
  return { day, hexNumber, pending, safeAvailable, safeHours, forcedHours, description };
}
