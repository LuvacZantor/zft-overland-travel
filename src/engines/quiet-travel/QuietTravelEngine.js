import { REGION_DANGER, MOMENTUM_REST_MODIFIER, TRAVEL_ROLES } from "../../data/rules.js";
import { ExpeditionState } from "../../state/ExpeditionState.js";
import { MomentumEngine } from "../travel/MomentumEngine.js";
import { clamp, randomInt } from "../../utils/helpers.js";

export class QuietTravelEngine {
  static recover({ regionDanger, momentum = null, roll = null } = {}) {
    const danger = REGION_DANGER[regionDanger];
    if (!danger) throw new Error(`[ZFT][ZOT] Unknown Region Danger: ${regionDanger}`);
    const currentMomentum = momentum ?? ExpeditionState.get().momentum;
    const modifier = MOMENTUM_REST_MODIFIER[currentMomentum] ?? 0;
    const chance = clamp(danger.longRestChance + modifier, 0, 100);
    const d100 = roll ?? randomInt(100);
    if (!Number.isInteger(d100) || d100 < 1 || d100 > 100) throw new Error("[ZFT][ZOT] Long Rest roll must be an integer from 1 to 100.");
    return { choice: "recover", regionDanger, momentum: currentMomentum, baseChance: danger.longRestChance, modifier, chance, roll: d100, success: d100 <= chance, avoidsExhaustion: true, grantsLongRestBenefits: d100 <= chance };
  }

  static async prepare(roleId) {
    if (!TRAVEL_ROLES[roleId]) throw new Error(`[ZFT][ZOT] Unknown travel role: ${roleId}`);
    const state = await ExpeditionState.update(
      { preparedRole: roleId },
      { history: { type: "quietTravel", choice: "prepare", roleId } }
    );
    return { choice: "prepare", roleId, effect: "This role gains advantage in the next hex.", state };
  }

  static async regroup() {
    const current = ExpeditionState.get().momentum;
    const nextMomentum = MomentumEngine.towardNeutral(current);
    const state = await ExpeditionState.update(
      { momentum: nextMomentum },
      { history: { type: "quietTravel", choice: "regroup", from: current, to: nextMomentum } }
    );
    return { choice: "regroup", from: current, to: nextMomentum, changed: current !== nextMomentum, state };
  }
}
