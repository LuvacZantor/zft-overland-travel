import { MOMENTUM_TRACK, MOMENTUM_EVENT_SHIFT } from "../../data/rules.js";
import { MOMENTUM } from "../../constants/module-constants.js";
import { clamp } from "../../utils/helpers.js";

export class MomentumEngine {
  static normalize(value) {
    return MOMENTUM_TRACK.includes(value) ? value : MOMENTUM.NEUTRAL;
  }

  static shift(value, steps) {
    const current = this.normalize(value);
    const index = MOMENTUM_TRACK.indexOf(current);
    return MOMENTUM_TRACK[clamp(index + steps, 0, MOMENTUM_TRACK.length - 1)];
  }

  static fromTravelQuality(value, quality) {
    if (quality === "successful") return this.shift(value, 1);
    if (quality === "poor") return this.shift(value, -1);
    return this.normalize(value);
  }

  static towardNeutral(value) {
    const current = this.normalize(value);
    if (current === MOMENTUM.RISKY || current === MOMENTUM.DETERIORATING) return this.shift(current, 1);
    return current;
  }

  static eventShift(value) {
    return MOMENTUM_EVENT_SHIFT[this.normalize(value)] ?? 0;
  }
}
