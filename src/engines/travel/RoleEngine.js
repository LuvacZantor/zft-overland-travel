import { TERRAIN, REGION_DANGER, TRAVEL_ROLES } from "../../data/rules.js";

export class RoleEngine {
  static getRole(id) { return TRAVEL_ROLES[id] ?? null; }
  static getRoles() { return Object.values(TRAVEL_ROLES); }

  static calculateDC(terrainId, regionDangerId) {
    const terrain = TERRAIN[terrainId];
    const danger = REGION_DANGER[regionDangerId];
    if (!terrain) throw new Error(`[ZFT][ZOT] Unknown terrain: ${terrainId}`);
    if (!danger) throw new Error(`[ZFT][ZOT] Unknown Region Danger: ${regionDangerId}`);
    return { terrain, regionDanger: danger, baseDC: terrain.baseDC, modifier: danger.dcModifier, roleDC: terrain.baseDC + danger.dcModifier };
  }

  static resolveIndividual(total, dc) {
    if (!Number.isFinite(total)) throw new Error("[ZFT][ZOT] Role total must be numeric.");
    if (!Number.isFinite(dc)) throw new Error("[ZFT][ZOT] Role DC must be numeric.");
    const margin = total - dc;
    if (margin >= 5) return { outcome: "strongSuccess", successes: 2, failures: 0, margin };
    if (margin >= 0) return { outcome: "success", successes: 1, failures: 0, margin };
    if (margin >= -4) return { outcome: "failure", successes: 0, failures: 1, margin };
    return { outcome: "majorFailure", successes: 0, failures: 2, margin };
  }

  static resolveParty(rolls, dc) {
    const resolved = (rolls ?? []).map((entry, index) => {
      const total = typeof entry === "number" ? entry : Number(entry.total);
      const role = typeof entry === "number" ? null : entry.role ?? null;
      return { index, role, total, ...this.resolveIndividual(total, dc) };
    });
    const successes = resolved.reduce((sum, entry) => sum + entry.successes, 0);
    const failures = resolved.reduce((sum, entry) => sum + entry.failures, 0);
    const quality = successes > failures ? "successful" : failures > successes ? "poor" : "neutral";
    return { results: resolved, successes, failures, quality };
  }
}
