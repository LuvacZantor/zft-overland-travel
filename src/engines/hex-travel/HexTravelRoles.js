/** Single source of truth for Hex Travel travel roles and checks.
 * Future activities added here automatically receive a matching roster label,
 * skill/ability modifier, and CON save summary without altering the roster UI.
 * Keep these IDs stable because they are saved in world role preferences.
 */
export const HEX_TRAVEL_NAVIGATION_SKILL = "sur";
export const HEX_TRAVEL_ACTIVITIES = Object.freeze({
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
  guide: { name: "Guide", skill: "sur", ability: "WIS", purpose: "Navigation and travel progress", tooltip: "Navigates the expedition, keeps the party on course, and determines travel progress." },
  tracker: { name: "Tracker", skill: "inv", ability: "INT", purpose: "Tracks, trails, and landmarks", tooltip: "Examines tracks, trails, and landmarks to identify signs of passage and potential discoveries." },
  scout: { name: "Scout", skill: "ste", ability: "DEX", purpose: "Advance reconnaissance and warning", tooltip: "Moves ahead of the party to investigate the route and identify danger without attracting attention." },
  vanguard: { name: "Vanguard", skill: "ath", ability: "STR", purpose: "Physical obstacles and safe crossings", tooltip: "Handles physical obstacles, difficult crossings, and hazardous terrain to help the party travel safely." },
  forager: { name: "Forager", skill: "sur", ability: "WIS", purpose: "Food, water, and resources", tooltip: "Searches for food, water, medicinal plants, and other useful natural resources." },
  coordinator: { name: "Coordinator", skill: "per", ability: "CHA", purpose: "Morale and group cohesion", tooltip: "Maintains morale, encourages companions, and keeps the expedition working together." }
});
