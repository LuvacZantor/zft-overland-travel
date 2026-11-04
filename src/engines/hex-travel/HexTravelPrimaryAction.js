/** Pure primary-action state for the Hex Travel GM control.
 * Keeps the visible label, readiness, and click behavior in agreement.
 */
import { cloneHexRecordStore, hexRecordReadyForTravel } from "./HexTravelRecords.js";
import { EXPEDITION_EVENT_LABELS } from "./HexExpeditionOutcome.js";

const copy = value => typeof globalThis.structuredClone === "function"
  ? structuredClone(value) : JSON.parse(JSON.stringify(value));

export function primaryHexTravelAction(ledger = {}) {
  const pending = Math.max(0, Number(ledger?.pending) || 0);
  if (pending <= 0) return {
    kind: "start", label: "Start Travel", blocked: false, recordId: null, recordNumber: null, reason: ""
  };

  const store = cloneHexRecordStore(ledger?.hexRecords);
  const record = typeof ledger?.activeHexCardId === "string" && ledger.activeHexCardId
    ? store.records.find(entry => entry.id === ledger.activeHexCardId) ?? null
    : null;

  // Legacy unfinished travel has no shared Expedition record and therefore
  // continues through the established resume path.
  if (!record) return {
    kind: "continue", label: "Continue Travel", blocked: false, recordId: null, recordNumber: null, reason: ""
  };

  if (!hexRecordReadyForTravel(record)) {
    if (record.phases?.reconnaissance !== "completed") return {
      kind: "resolve-role", phase: "reconnaissance", label: "Resolve Reconnaissance", blocked: false,
      recordId: record.id, recordNumber: record.number, reason: `Resolve Reconnaissance for Hex ${record.number}.`
    };
    if (record.phases?.support !== "completed") return {
      kind: "resolve-role", phase: "support", label: "Resolve Expedition Support", blocked: false,
      recordId: record.id, recordNumber: record.number, reason: `Resolve Expedition Support for Hex ${record.number}.`
    };
    const preparationPending = record.phases?.travelQuality !== "completed" || record.phases?.momentum !== "completed";
    if (preparationPending) return {
      kind: "blocked", label: "Resolve Expedition", blocked: true,
      recordId: record.id, recordNumber: record.number,
      reason: `Hex ${record.number} still needs its automatic Travel Quality and Momentum calculation.`
    };
    if (record.phases?.event !== "completed") return {
      kind: "roll-event", label: "Roll Event", blocked: false,
      recordId: record.id, recordNumber: record.number,
      reason: `Roll the Event for Hex ${record.number}. Travel remains staged until the Event is resolved.`
    };
    if (record.eventResolution?.status === "pending") {
      const eventLabel = EXPEDITION_EVENT_LABELS[record.event?.type] ?? record.event?.label ?? "Event";
      return {
        kind: "resolve-event", label: `Resolve ${eventLabel}`, blocked: false,
        recordId: record.id, recordNumber: record.number, reason: `Resolve the ${eventLabel} before travel can be committed.`
      };
    }
    return {
      kind: "blocked", label: "Resolve Expedition", blocked: true,
      recordId: record.id, recordNumber: record.number, reason: `Hex ${record.number} is not yet ready to commit travel.`
    };
  }

  const committed = Math.max(0, Number(record.travel?.committedHours) || 0);
  return committed === 0
    ? { kind: "commit", label: "Commit Travel", blocked: false, recordId: record.id, recordNumber: record.number, reason: "" }
    : { kind: "continue", label: "Continue Travel", blocked: false, recordId: record.id, recordNumber: record.number, reason: "" };
}

export const clonePrimaryHexTravelAction = value => copy(value);
