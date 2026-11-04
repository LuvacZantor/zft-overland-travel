/** Staged Expedition System workflow orchestrator.
 * Resolves only incomplete role/outcome phases. It never commits travel hours,
 * advances world time, rerolls completed phases, or resolves a downstream Event.
 */
import { MODULE_ID } from "../../constants/module-constants.js";
import { cloneHexRecordStore, hexRecordReadyForTravel } from "./HexTravelRecords.js";
import { resolveNextHexTravelRolePhase } from "./HexTravelRoleResolution.js";
import { resolveHexExpeditionPreparation } from "./HexExpeditionRuntime.js";

const LEDGER_KEY = "hexTravelLedger";
const copy = value => typeof globalThis.structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
function readRecord(id) {
  const ledger = game.settings.get(MODULE_ID, LEDGER_KEY) ?? {};
  return cloneHexRecordStore(ledger.hexRecords).records.find(record => record.id === id) ?? null;
}
export async function resumeHexExpeditionWorkflow(recordId, services = {}) {
  if (!game.user?.isGM) throw new Error("Only a GM can resume the Expedition workflow.");
  let record = readRecord(recordId);
  if (!record || record.status === "interrupted") throw new Error("The selected staged hex is unavailable.");
  const roleResult = await resolveNextHexTravelRolePhase(recordId, services);
  if (roleResult?.canceled) return { record: copy(readRecord(recordId)), stopped: "rolesCanceled", outcome: null, rolePhase: roleResult?.phase ?? null };
  record = readRecord(recordId);
  let preparation = null;
  if (record?.phases?.reconnaissance === "completed" && record?.phases?.support === "completed" &&
      (record?.phases?.travelQuality !== "completed" || record?.phases?.momentum !== "completed")) {
    preparation = await resolveHexExpeditionPreparation(recordId);
  }
  record = readRecord(recordId);
  return { record: copy(record), preparation: copy(preparation), outcome: null, readyForTravel: hexRecordReadyForTravel(record),
    stopped: record?.phases?.event === "completed" ? null : "eventPending", rolePhase: roleResult?.phase ?? null };
}
