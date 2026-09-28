import { TERRAIN, DISCOVERY_MODIFIERS, DISCOVERY_TABLES } from "../../data/rules.js";
import { randomInt, resultFromRoll } from "../../utils/helpers.js";

export class DiscoveryEngine {
  static generate({ terrainId, roll = null, modifier = true, modifierRoll = null, table = null } = {}) {
    const terrain = TERRAIN[terrainId];
    if (!terrain) throw new Error(`[ZFT][ZOT] Unknown terrain: ${terrainId}`);

    if (!terrain.discoveriesByDefault) {
      return { terrain, manual: true, reason: `${terrain.name} does not use Discovery Tables by default.` };
    }

    const entries = table ?? DISCOVERY_TABLES[terrainId];
    if (!Array.isArray(entries) || !entries.length) {
      return { terrain, unavailable: true, reason: `No ${terrain.name} Discovery Table entries have been supplied yet.` };
    }

    const discoveryRoll = roll ?? randomInt(20);
    const discovery = resultFromRoll(entries, discoveryRoll);
    if (!discovery) throw new Error(`[ZFT][ZOT] Discovery table for ${terrainId} has no result for roll ${discoveryRoll}.`);

    let modifierResult = null;
    if (modifier) {
      const d6 = modifierRoll ?? randomInt(6);
      modifierResult = DISCOVERY_MODIFIERS.find((entry) => entry.roll === d6) ?? null;
    }

    return { terrain, roll: discoveryRoll, discovery, modifier: modifierResult };
  }
}
