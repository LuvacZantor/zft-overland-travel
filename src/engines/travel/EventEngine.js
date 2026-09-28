import { EVENT_TABLE, EVENT_TRACK } from "../../data/rules.js";
import { MomentumEngine } from "./MomentumEngine.js";
import { clamp, randomInt, resultFromRoll } from "../../utils/helpers.js";

export class EventEngine {
  static rollBase(roll = null) {
    const die = roll ?? randomInt(20);
    if (!Number.isInteger(die) || die < 1 || die > 20) throw new Error("[ZFT][ZOT] Event roll must be an integer from 1 to 20.");
    return { roll: die, event: resultFromRoll(EVENT_TABLE, die)?.event ?? null };
  }

  static shift(event, steps) {
    const index = EVENT_TRACK.indexOf(event);
    if (index < 0) throw new Error(`[ZFT][ZOT] Unknown event type: ${event}`);
    return EVENT_TRACK[clamp(index + steps, 0, EVENT_TRACK.length - 1)];
  }

  static resolve({ roll = null, momentum = "neutral" } = {}) {
    const base = this.rollBase(roll);
    const shift = MomentumEngine.eventShift(momentum);
    return { ...base, momentum, momentumShift: shift, resolvedEvent: this.shift(base.event, shift) };
  }
}
