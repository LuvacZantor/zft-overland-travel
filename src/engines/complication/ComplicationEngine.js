import { COMPLICATION_CATEGORIES, COMPLICATION_PROMPT_TABLES } from "../../data/rules.js";
import { randomInt, sample } from "../../utils/helpers.js";
import { ThreatEngine } from "../threat/ThreatEngine.js";

export class ComplicationEngine {
  static determineCategory(category = null, roll = null) {
    if (category) {
      const selected = COMPLICATION_CATEGORIES.find((entry) => entry.id === category);
      if (!selected) throw new Error(`[ZFT][ZOT] Unknown Complication category: ${category}`);
      return { ...selected, roll: null };
    }
    const d6 = roll ?? randomInt(6);
    const selected = COMPLICATION_CATEGORIES.find((entry) => entry.roll === d6);
    return { ...selected, roll: d6 };
  }

  static generate({ category = null, categoryRoll = null, terrainId = null, threatFlag = false } = {}) {
    const selected = this.determineCategory(category, categoryRoll);
    const prompts = COMPLICATION_PROMPT_TABLES[selected.id] ?? [];
    return { category: selected, terrainId, threatFlag, prompt: prompts.length ? sample(prompts) : null, promptTableAvailable: prompts.length > 0 };
  }

  static async applyThreatOutcome({ threatFlag = false, outcome } = {}) {
    if (!threatFlag) return { changed: false, threat: null };
    if (outcome === "strongSuccess") return { changed: true, direction: "reduced", ...(await ThreatEngine.reduce()) };
    if (outcome === "failure") return { changed: true, direction: "advanced", ...(await ThreatEngine.advance()) };
    return { changed: false, threat: null };
  }
}
