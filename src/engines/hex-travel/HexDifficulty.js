/** GM-selected navigation difficulty for a single hex. No scene or token inference. */
import { TERRAIN, REGION_DANGER } from "../../data/rules.js";

export const TERRAIN_CHOICES = Object.freeze(Object.values(TERRAIN).map(({ id, name, baseDC }) => ({ id, name, baseDC })));
export const DANGER_CHOICES = Object.freeze(Object.values(REGION_DANGER).map(({ id, name, dcModifier }) => ({ id, name, modifier: dcModifier })));

export function hexNavigationDifficulty({ mode = "custom", dc = 15, terrainId = null, regionDanger = null, description = "" } = {}) {
  if (mode === "custom") {
    const value = typeof dc === "string" ? dc.trim() : dc;
    const number = value === "" || value == null ? NaN : Number(value);
    if (!Number.isSafeInteger(number) || number < 1 || number > 30)
      throw new Error("Custom Navigation DC must be a whole number from 1 to 30.");
    return { mode, dc: number, terrainId: null, regionDanger: null, baseDC: null, modifier: null,
      description: String(description ?? "").trim().slice(0,100) };
  }
  if (mode === "terrainDanger") {
    const terrain = TERRAIN[terrainId];
    const danger = REGION_DANGER[regionDanger];
    if (!terrain || !danger) throw new Error("Select a valid terrain and Region Danger.");
    const number = terrain.baseDC + danger.dcModifier;
    return { mode, dc: number, terrainId: terrain.id, regionDanger: danger.id,
      baseDC: terrain.baseDC, modifier: danger.dcModifier, description: "" };
  }
  throw new Error("Choose Custom DC or Terrain + Region Danger.");
}

/** Client-side GM form preferences. Save both methods independently; these are not game rules. */
export const DEFAULT_HEX_DIFFICULTY_PREFERENCES = Object.freeze({
  mode: "custom", customDC: 15, terrainId: "forest", regionDanger: "wild", terrainDescription: ""
});

export function normalizeHexDifficultyPreferences(source = {}) {
  const raw = source && typeof source === "object" ? source : {};
  const number = Number(raw.customDC);
  const valid = raw.customDC !== "" && raw.customDC != null && Number.isSafeInteger(number) && number >= 1 && number <= 30;
  return {
    mode: raw.mode === "terrainDanger" ? "terrainDanger" : "custom",
    customDC: valid ? number : 15,
    terrainId: Object.hasOwn(TERRAIN, raw.terrainId) ? raw.terrainId : "forest",
    regionDanger: Object.hasOwn(REGION_DANGER, raw.regionDanger) ? raw.regionDanger : "wild",
    terrainDescription: String(raw.terrainDescription ?? "").slice(0, 100)
  };
}
