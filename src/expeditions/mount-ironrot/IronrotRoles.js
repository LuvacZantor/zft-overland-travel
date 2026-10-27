/** Single source of truth for Mount Ironrot travel roles and checks.
 * Future activities added here automatically receive a matching roster label,
 * skill/ability modifier, and CON save summary without altering the roster UI.
 * Keep these IDs stable because they are saved in world role preferences.
 */
export const IRONROT_NAVIGATION_SKILL = "sur";
export const IRONROT_ACTIVITIES = Object.freeze({
  none: Object.freeze({ name: "None", skill: null }),
  scout: Object.freeze({ name: "Scout Ahead", skill: "prc" }),
  arcane: Object.freeze({ name: "Arcane Survey", skill: "arc" }),
  investigate: Object.freeze({ name: "Investigate Route", skill: "inv" }),
  conceal: Object.freeze({ name: "Conceal Party", skill: "ste" }),
  nature: Object.freeze({ name: "Environmental Assessment", skill: "nat" })
});

/** Expedition role assignment model. Paired checks are a design checkpoint;
 * existing hex-duration, navigation and forced-march mechanics remain intact. */
export const EXPEDITION_PAIRS = Object.freeze([
  Object.freeze({ name: "Navigation", roles: ["guide", "tracker"] }),
  Object.freeze({ name: "Reconnaissance", roles: ["scout", "vanguard"] }),
  Object.freeze({ name: "Expedition Support", roles: ["forager", "coordinator"] })
]);
export const EXPEDITION_ROLES = Object.freeze({
  guide: { name: "Guide", skill: "sur", ability: "WIS", purpose: "Navigation and travel progress" },
  tracker: { name: "Tracker", skill: "inv", ability: "INT", purpose: "Tracks, trails, and landmarks" },
  scout: { name: "Scout", skill: "ste", ability: "DEX", purpose: "Advance reconnaissance and warning" },
  vanguard: { name: "Vanguard", skill: "ath", ability: "STR", purpose: "Physical obstacles and safe crossings" },
  forager: { name: "Forager", skill: "sur", ability: "WIS", purpose: "Food, water, and resources" },
  coordinator: { name: "Coordinator", skill: "per", ability: "CHA", purpose: "Morale and group cohesion" }
});
