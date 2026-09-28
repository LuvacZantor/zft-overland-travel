import { REGION_DANGER, ENCOUNTER_SEVERITY, ENCOUNTER_SEVERITY_TABLE } from "../../data/rules.js";
import { clamp, randomInt, resultFromRoll } from "../../utils/helpers.js";

export class SeverityEngine {
  static resolve({ regionDanger = "frontier", roll = null, severity = null } = {}) {
    if (severity) {
      const selected = ENCOUNTER_SEVERITY[severity];
      if (!selected) throw new Error(`[ZFT][ZOT] Unknown encounter severity: ${severity}`);
      return { roll: null, modifier: REGION_DANGER[regionDanger]?.severityModifier ?? 0, final: null, severity, ...selected };
    }

    const danger = REGION_DANGER[regionDanger];
    if (!danger) throw new Error(`[ZFT][ZOT] Unknown Region Danger: ${regionDanger}`);
    const baseRoll = roll ?? randomInt(20);
    if (!Number.isInteger(baseRoll) || baseRoll < 1 || baseRoll > 20) throw new Error("[ZFT][ZOT] Severity roll must be an integer from 1 to 20.");
    const final = clamp(baseRoll + danger.severityModifier, 1, 20);
    const id = resultFromRoll(ENCOUNTER_SEVERITY_TABLE, final)?.id ?? "standard";
    return { roll: baseRoll, modifier: danger.severityModifier, final, severity: id, ...ENCOUNTER_SEVERITY[id] };
  }
}
