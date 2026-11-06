/** Select the one completed-hex result visible between crossings.
 * Read-only presentation derived from the saved hex ledger and existing
 * expedition cards; no new history, time writer, or persistence owner.
 */
export function latestCompletedHexResult(records, cards, { pending = 0, activeHexCardId = null, dismissedId = null } = {}) {
  if (Number(pending) > 0 || activeHexCardId) return null;
  const saved = Array.isArray(records) ? records : [];
  const published = Array.isArray(cards) ? cards : [];
  const finished = saved.filter(record => record?.status === "completed" &&
    Number.isFinite(Number(record.completedAt)) && record.completedAt !== null &&
    ["resolved", "manual"].includes(record.eventResolution?.status));
  finished.sort((a, b) => Number(b.completedAt) - Number(a.completedAt) || Number(b.number) - Number(a.number));
  const latest = finished[0] ?? null;
  if (!latest || latest.id === dismissedId) return null;
  // Clearing the Expedition Log intentionally removes its presentation. The
  // ledger keeps the original travel record without resurrecting a cleared log.
  if (!published.some(card => card?.id === latest.id && card.stage === "complete")) return null;
  // The next hex's initial Navigation card is published before travel dice,
  // when the ledger does not yet have a new active shared record.
  if (published.some(card => card?.id !== latest.id && card?.stage !== "complete" &&
    Number(card?.createdAt) > Number(latest.completedAt))) return null;
  return latest;
}

/** Show the active hex's saved Event ruling BEFORE travel hours are committed.
 * The existing completed-hex selection remains the fallback between crossings.
 * No new world setting, resolution path, or clock writer is introduced.
 */
export function latestDisplayableHexResult(records, cards, options = {}) {
  const { pending = 0, activeHexCardId = null, dismissedId = null } = options;
  const saved = Array.isArray(records) ? records : [];
  const published = Array.isArray(cards) ? cards : [];
  if (Number(pending) > 0 && typeof activeHexCardId === "string" && activeHexCardId) {
    const active = saved.find(record => record?.id === activeHexCardId);
    if (!active || active.status !== "inProgress" || active.id === dismissedId ||
        !["resolved", "manual"].includes(active.eventResolution?.status)) return null;
    // No resurrected result after an explicit Clear Expedition Log.
    if (!published.some(card => card?.id === active.id && card.stage === "complete")) return null;
    return active;
  }
  return latestCompletedHexResult(records, cards, options);
}
