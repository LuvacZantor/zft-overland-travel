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
