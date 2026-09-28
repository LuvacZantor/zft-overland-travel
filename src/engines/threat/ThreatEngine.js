import { THREAT, LOG_PREFIX } from "../../constants/module-constants.js";
import { THREAT_TRACK } from "../../data/rules.js";
import { ExpeditionState } from "../../state/ExpeditionState.js";
import { clamp } from "../../utils/helpers.js";

export class ThreatEngine {
  static normalize(stage) { return THREAT_TRACK.includes(stage) ? stage : THREAT.NONE; }

  static move(stage, steps) {
    const current = this.normalize(stage);
    const index = THREAT_TRACK.indexOf(current);
    return THREAT_TRACK[clamp(index + steps, 0, THREAT_TRACK.length - 1)];
  }

  static async set(stage, source = null) {
    const normalized = this.normalize(stage);
    const next = await ExpeditionState.update(
      { threat: { stage: normalized, source } },
      { history: { type: "threat", stage: normalized, source } }
    );
    return { threat: next.threat, encounterTriggered: normalized === THREAT.IMMEDIATE };
  }

  static async create(source = null, stage = THREAT.DISTANT) {
    const current = ExpeditionState.get().threat;
    if (current.stage !== THREAT.NONE) console.warn(`${LOG_PREFIX} ⚠️ Active Threat already exists; replacing it`, current);
    return this.set(stage, source);
  }

  static async advance(source = undefined) {
    const current = ExpeditionState.get().threat;
    return this.set(this.move(current.stage, 1), source === undefined ? current.source : source);
  }

  static async reduce() {
    const current = ExpeditionState.get().threat;
    const stage = this.move(current.stage, -1);
    return this.set(stage, stage === THREAT.NONE ? null : current.source);
  }

  static async clear() { return this.set(THREAT.NONE, null); }
}
