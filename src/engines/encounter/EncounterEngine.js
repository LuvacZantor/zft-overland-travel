import { TERRAIN, ENCOUNTER_TEMPLATES, CREATURE_CATEGORIES, BEHAVIORS, SITUATION_STATES } from "../../data/rules.js";
import { SeverityEngine } from "./SeverityEngine.js";
import { findById, randomInt, sample } from "../../utils/helpers.js";

export class EncounterEngine {
  static generate({
    environment,
    regionDanger = "frontier",
    partyLevel = null,
    severity = null,
    severityRoll = null,
    template = null,
    creatureCategory = null,
    behavior = null,
    situationState = null
  } = {}) {
    if (!TERRAIN[environment]) throw new Error(`[ZFT][ZOT] Unknown encounter environment: ${environment}`);

    const severityResult = SeverityEngine.resolve({ regionDanger, roll: severityRoll, severity });
    const templateResult = this.#resolveTemplate(template);
    const categoryResult = this.#resolveConstrained(
      CREATURE_CATEGORIES,
      creatureCategory,
      (entry) => templateResult.creatureCategories.includes(entry.id) && entry.environments.includes(environment)
    );
    const behaviorResult = this.#resolveConstrained(BEHAVIORS, behavior, (entry) => templateResult.behaviors.includes(entry.id));
    const situationResult = this.#resolveConstrained(SITUATION_STATES, situationState, (entry) => templateResult.situationStates.includes(entry.id));

    return {
      environment,
      regionDanger,
      partyLevel: Number.isFinite(Number(partyLevel)) ? Number(partyLevel) : null,
      severity: severityResult,
      template: { id: templateResult.id, name: templateResult.name, category: templateResult.category, description: templateResult.description, requiredElements: templateResult.requiredElements },
      creatureCategory: categoryResult,
      behavior: behaviorResult,
      situationState: situationResult,
      presentation: {
        firstSign: sample(templateResult.firstSigns),
        playerDecisions: [...templateResult.playerDecisions],
        severityScaling: templateResult.severityScaling[severityResult.severity] ?? null
      }
    };
  }

  static averagePartyLevel(actors = []) {
    const levels = actors.map((actor) => Number(actor?.system?.details?.level)).filter((level) => Number.isFinite(level) && level > 0);
    if (!levels.length) return null;
    return levels.reduce((sum, level) => sum + level, 0) / levels.length;
  }

  static #resolveTemplate(id) {
    if (id) {
      const selected = findById(ENCOUNTER_TEMPLATES, id);
      if (!selected) throw new Error(`[ZFT][ZOT] Unknown encounter template: ${id}`);
      return selected;
    }
    const roll = randomInt(8);
    return ENCOUNTER_TEMPLATES.find((entry) => entry.roll === roll) ?? ENCOUNTER_TEMPLATES[0];
  }

  static #resolveConstrained(collection, requestedId, predicate) {
    if (requestedId) {
      const selected = findById(collection, requestedId);
      if (!selected) throw new Error(`[ZFT][ZOT] Unknown encounter value: ${requestedId}`);
      if (!predicate(selected)) throw new Error(`[ZFT][ZOT] ${requestedId} conflicts with the selected encounter context.`);
      return { ...selected };
    }

    const allowed = collection.filter(predicate);
    if (!allowed.length) throw new Error("[ZFT][ZOT] No valid encounter result exists for the selected constraints.");

    const dieSides = Math.max(...collection.map((entry) => entry.roll ?? 0));
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const roll = randomInt(dieSides);
      const candidate = collection.find((entry) => entry.roll === roll);
      if (candidate && predicate(candidate)) return { ...candidate, roll };
    }

    return { ...sample(allowed), roll: null };
  }
}
