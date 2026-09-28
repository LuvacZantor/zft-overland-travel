import { EVENTS, MOMENTUM, THREAT } from "../constants/module-constants.js";

export const TERRAIN = Object.freeze({
  roadways: { id: "roadways", name: "Roadways", difficulty: "easy", baseDC: 10, discoveriesByDefault: false },
  settled: { id: "settled", name: "Settled Lands", difficulty: "easy", baseDC: 10, discoveriesByDefault: false },
  plains: { id: "plains", name: "Plains", difficulty: "standard", baseDC: 12, discoveriesByDefault: true },
  coast: { id: "coast", name: "Coast", difficulty: "standard", baseDC: 12, discoveriesByDefault: true },
  riverlands: { id: "riverlands", name: "Riverlands", difficulty: "standard", baseDC: 12, discoveriesByDefault: true },
  forest: { id: "forest", name: "Forest", difficulty: "difficult", baseDC: 14, discoveriesByDefault: true },
  hills: { id: "hills", name: "Hills", difficulty: "difficult", baseDC: 14, discoveriesByDefault: true },
  swamp: { id: "swamp", name: "Swamp", difficulty: "harsh", baseDC: 16, discoveriesByDefault: true },
  desert: { id: "desert", name: "Desert", difficulty: "harsh", baseDC: 16, discoveriesByDefault: true },
  mountains: { id: "mountains", name: "Mountains", difficulty: "harsh", baseDC: 16, discoveriesByDefault: true },
  arctic: { id: "arctic", name: "Arctic", difficulty: "extreme", baseDC: 18, discoveriesByDefault: true },
  blighted: { id: "blighted", name: "Blighted Lands", difficulty: "extreme", baseDC: 18, discoveriesByDefault: true },
  underground: { id: "underground", name: "Underground", difficulty: "extreme", baseDC: 18, discoveriesByDefault: true },
  feyTouched: { id: "feyTouched", name: "Fey-Touched", difficulty: "extreme", baseDC: 18, discoveriesByDefault: true }
});

export const REGION_DANGER = Object.freeze({
  safe: { id: "safe", name: "Safe", dcModifier: -2, severityModifier: -2, longRestChance: 100 },
  frontier: { id: "frontier", name: "Frontier", dcModifier: 0, severityModifier: 0, longRestChance: 100 },
  wild: { id: "wild", name: "Wild", dcModifier: 2, severityModifier: 2, longRestChance: 75 },
  hostile: { id: "hostile", name: "Hostile", dcModifier: 4, severityModifier: 4, longRestChance: 50 },
  cataclysmic: { id: "cataclysmic", name: "Cataclysmic", dcModifier: 6, severityModifier: 6, longRestChance: 25 }
});

export const MOMENTUM_TRACK = Object.freeze([
  MOMENTUM.DETERIORATING, MOMENTUM.RISKY, MOMENTUM.NEUTRAL, MOMENTUM.PREPARED, MOMENTUM.FAVORED
]);

export const MOMENTUM_EVENT_SHIFT = Object.freeze({
  [MOMENTUM.FAVORED]: 1,
  [MOMENTUM.PREPARED]: 1,
  [MOMENTUM.NEUTRAL]: 0,
  [MOMENTUM.RISKY]: -1,
  [MOMENTUM.DETERIORATING]: -2
});

export const MOMENTUM_REST_MODIFIER = Object.freeze({
  [MOMENTUM.FAVORED]: 25,
  [MOMENTUM.PREPARED]: 25,
  [MOMENTUM.NEUTRAL]: 0,
  [MOMENTUM.RISKY]: -25,
  [MOMENTUM.DETERIORATING]: -50
});

export const EVENT_TRACK = Object.freeze([EVENTS.ENCOUNTER, EVENTS.COMPLICATION, EVENTS.DISCOVERY, EVENTS.QUIET]);

export const EVENT_TABLE = Object.freeze([
  { min: 1, max: 8, event: EVENTS.ENCOUNTER },
  { min: 9, max: 12, event: EVENTS.COMPLICATION },
  { min: 13, max: 16, event: EVENTS.DISCOVERY },
  { min: 17, max: 20, event: EVENTS.QUIET }
]);

export const TRAVEL_ROLES = Object.freeze({
  guide: { id: "guide", name: "Guide", purpose: "Keeps the party on course and chooses the route", prevents: "Getting lost, wasted travel, poor navigation", typicalSkills: ["Survival", "Nature", "Navigator's Tools"] },
  scout: { id: "scout", name: "Scout", purpose: "Observes what lies ahead of the party", prevents: "Walking blindly into danger", typicalSkills: ["Stealth", "Perception", "Survival"] },
  lookout: { id: "lookout", name: "Lookout", purpose: "Maintains awareness of immediate surroundings", prevents: "Surprise and poor positioning", typicalSkills: ["Perception", "Insight"] },
  forager: { id: "forager", name: "Forager", purpose: "Maintains supplies and gathers resources", prevents: "Resource strain and exhaustion pressure", typicalSkills: ["Survival", "Nature", "Herbalism Kit"] },
  pathfinder: { id: "pathfinder", name: "Pathfinder", purpose: "Leads movement through terrain obstacles", prevents: "Environmental slowdowns and traversal hazards", typicalSkills: ["Athletics", "Acrobatics", "Survival"] },
  quartermaster: { id: "quartermaster", name: "Quartermaster", purpose: "Organizes equipment, planning, and readiness", prevents: "Preparation failures and cascading problems", typicalSkills: ["Investigation", "Insight", "Persuasion", "Relevant Tool Proficiency"] }
});

export const THREAT_TRACK = Object.freeze([THREAT.NONE, THREAT.DISTANT, THREAT.CLOSING, THREAT.IMMEDIATE]);

export const DISCOVERY_TYPES = Object.freeze({
  landmark: "Navigation or world context",
  resource: "Tangible benefit",
  remnant: "Lore or history",
  situation: "Active but non-hostile scene",
  mystery: "Strange or magical phenomenon"
});

export const DISCOVERY_MODIFIERS = Object.freeze([
  { roll: 1, id: "hidden", name: "Hidden", effect: "The discovery is concealed, obscured, or difficult to notice" },
  { roll: 2, id: "damaged", name: "Damaged", effect: "The discovery is broken, decayed, or partially destroyed" },
  { roll: 3, id: "active", name: "Active", effect: "Something is currently happening here" },
  { roll: 4, id: "occupied", name: "Occupied", effect: "Creatures or NPCs are present" },
  { roll: 5, id: "valuable", name: "Valuable", effect: "The discovery contains additional resources or benefit" },
  { roll: 6, id: "unstable", name: "Unstable", effect: "The discovery is dangerous or unpredictable" }
]);

export const COMPLICATION_CATEGORIES = Object.freeze([
  { roll: 1, id: "navigation", name: "Navigation", function: "The route becomes unclear, blocked, or misleading" },
  { roll: 2, id: "environment", name: "Environment", function: "Natural conditions interfere with travel" },
  { roll: 3, id: "resources", name: "Resources", function: "Supplies, equipment, or endurance are strained" },
  { roll: 4, id: "omen", name: "Omen", function: "Signs suggest danger or something nearby" },
  { roll: 5, id: "social", name: "Social", function: "Interaction or tension with intelligent creatures" },
  { roll: 6, id: "magical", name: "Magical or Strange", function: "Supernatural or anomalous effects disrupt travel" }
]);

export const ENCOUNTER_SEVERITY_TABLE = Object.freeze([
  { min: 1, max: 7, id: "minor" },
  { min: 8, max: 14, id: "standard" },
  { min: 15, max: 18, id: "dangerous" },
  { min: 19, max: 20, id: "deadly" }
]);

export const ENCOUNTER_SEVERITY = Object.freeze({
  minor: { id: "minor", name: "Minor", creatureStrength: "Main threats CR 2–4 below Average Party Level", enemyStructure: "Lone weak threat or small weak group" },
  standard: { id: "standard", name: "Standard", creatureStrength: "Main threats near Average Party Level, CR −1 to +1", enemyStructure: "One main threat, balanced group, or weak group with leader" },
  dangerous: { id: "dangerous", name: "Dangerous", creatureStrength: "Main threats CR 2–4 above Average Party Level", enemyStructure: "Elite threat with support, strong group, or multiple coordinated threats" },
  deadly: { id: "deadly", name: "Deadly", creatureStrength: "Main threats CR 5+ above Average Party Level or multiple major threats", enemyStructure: "Boss with support, overwhelming force, or stacked threats" }
});

export const ENCOUNTER_TEMPLATES = Object.freeze([
  {
    roll: 1, id: "predation", name: "Predation", category: "conflict",
    description: "A creature or group is hunting, stalking, feeding, or preparing to attack.",
    requiredElements: ["Predator", "Prey", "Evidence of hunting or feeding"],
    firstSigns: ["Tracks", "Blood", "A carcass", "Unnatural silence", "Movement in cover", "Alarmed animals", "A distant cry"],
    creatureCategories: ["beast", "monstrosity", "undead", "aberration"],
    behaviors: ["hostile", "wary", "hidden", "desperate"],
    situationStates: ["unaware", "alert", "nearby", "close", "developing", "immediate"],
    playerDecisions: ["Avoid", "Interrupt", "Rescue", "Bait", "Track", "Confront", "Fight", "Flee"],
    severityScaling: { minor: "Signs of a predator or weak threat", standard: "Active predator nearby", dangerous: "Hidden, advantaged, or coordinated predator", deadly: "Ambush, apex predator, or prey already trapped" }
  },
  {
    roll: 2, id: "territorialDefense", name: "Territorial Defense", category: "conflict",
    description: "A creature or faction protects its territory, nest, resources, route, or claimed domain.",
    requiredElements: ["Defender", "Claimed area", "Boundary or protected resource"],
    firstSigns: ["Warning calls", "Territorial markings", "Barricades", "Bones", "Claw marks", "Posted signs", "Sentries", "Aggressive displays"],
    creatureCategories: ["beast", "humanoid", "monstrosity", "undead", "magical"],
    behaviors: ["wary", "hostile", "hidden", "desperate"],
    situationStates: ["alert", "nearby", "close", "developing", "immediate"],
    playerDecisions: ["Withdraw", "Negotiate", "Trespass", "Bypass", "Challenge", "Calm", "Distract", "Fight"],
    severityScaling: { minor: "Warning signs or defensive posturing", standard: "Direct confrontation", dangerous: "Defenders have terrain advantage or reinforcements", deadly: "Fortified territory, overwhelming defenders, or no safe retreat" }
  },
  {
    roll: 3, id: "guardedSite", name: "Guarded Site", category: "conflict",
    description: "A location, object, passage, or individual is being guarded, defended, or restricted.",
    requiredElements: ["Guard", "Protected site or target", "Reason access is restricted"],
    firstSigns: ["A checkpoint", "Watchfire", "Barricade", "Locked gate", "Ward", "Patrol route", "Stationed guards", "Signs of recent trespassers"],
    creatureCategories: ["humanoid", "undead", "magical", "monstrosity", "aberration"],
    behaviors: ["wary", "hostile", "engaged", "hidden"],
    situationStates: ["alert", "distant", "nearby", "developing", "immediate"],
    playerDecisions: ["Negotiate", "Sneak", "Deceive", "Force entry", "Turn back", "Investigate", "Bribe", "Attack"],
    severityScaling: { minor: "Lightly guarded or easy to bypass", standard: "Guarded with clear resistance", dangerous: "Layered defenses, traps, or strong occupants", deadly: "Critical site, elite guards, magical defenses, or severe consequences for failure" }
  },
  {
    roll: 4, id: "patrolWatch", name: "Patrol or Watch", category: "social",
    description: "An organized group is observing, scouting, inspecting, monitoring, or enforcing control within the area.",
    requiredElements: ["Watchers", "Route or observation point", "Purpose for monitoring the area"],
    firstSigns: ["Footsteps", "Torchlight", "Voices", "Signal horns", "Tracks", "Mounted riders", "Scouts", "Distant silhouettes", "Signs of inspection"],
    creatureCategories: ["humanoid", "beast", "undead", "magical"],
    behaviors: ["wary", "engaged", "hostile", "hidden"],
    situationStates: ["alert", "distant", "nearby", "developing", "immediate"],
    playerDecisions: ["Hide", "Parley", "Mislead", "Observe", "Avoid", "Ambush", "Report", "Submit to questioning"],
    severityScaling: { minor: "Small or distracted patrol", standard: "Alert patrol with authority", dangerous: "Disciplined patrol with support or tracking ability", deadly: "Elite patrol, alarm network, or encounter that can summon overwhelming force" }
  },
  {
    roll: 5, id: "travelerCaravan", name: "Traveler or Caravan", category: "social",
    description: "A moving individual, group, or convoy crosses paths with the party while traveling.",
    requiredElements: ["Traveler or convoy", "Destination or route", "Reason for being on the move"],
    firstSigns: ["Wagon tracks", "Camp smoke", "Bells", "Lanterns", "Pack animals", "Songs", "Arguing voices", "Dust clouds", "Figures on the road"],
    creatureCategories: ["humanoid", "beast", "magical", "undead"],
    behaviors: ["passive", "wary", "engaged", "hostile", "desperate"],
    situationStates: ["distant", "nearby", "developing", "immediate"],
    playerDecisions: ["Trade", "Question", "Aid", "Ignore", "Escort", "Rob", "Warn", "Follow", "Investigate"],
    severityScaling: { minor: "Harmless traveler or small complication", standard: "Useful interaction with a meaningful choice", dangerous: "Traveler brings danger, pursuit, disease, contraband, or urgent trouble", deadly: "Caravan is bait, under attack, cursed, hunted, or carrying catastrophic cargo" }
  },
  {
    roll: 6, id: "hunterPrey", name: "Hunter and Prey", category: "dynamic",
    description: "One creature, group, or force is actively pursuing, escaping, tracking, or attacking another when the party arrives.",
    requiredElements: ["Hunter", "Prey", "Active chase, pursuit, trap, or confrontation"],
    firstSigns: ["Crashing movement", "Fleeing figures", "Pursuit calls", "Fresh tracks", "Arrows in trees", "Blood trails", "Broken brush", "A visible chase"],
    creatureCategories: ["beast", "humanoid", "monstrosity", "undead", "aberration"],
    behaviors: ["hostile", "wary", "engaged", "hidden", "desperate"],
    situationStates: ["nearby", "close", "developing", "immediate"],
    playerDecisions: ["Choose a side", "Intervene", "Hide", "Follow", "Rescue", "Exploit the distraction", "Negotiate", "Let events unfold"],
    severityScaling: { minor: "Low-stakes chase or weak participants", standard: "Active conflict with risk", dangerous: "Both sides are dangerous or terrain complicates intervention", deadly: "Party enters a lethal pursuit, trap, massacre, or battle between powerful forces" }
  },
  {
    roll: 7, id: "lingeringThreat", name: "Lingering Threat", category: "dynamic",
    description: "The primary danger has already passed, but evidence, hazards, corruption, survivors, or secondary effects remain.",
    requiredElements: ["Past danger", "Remaining evidence", "Unresolved consequence"],
    firstSigns: ["Corpses", "Ruins", "Broken weapons", "Scorched ground", "Abandoned supplies", "Strange residue", "Dying survivors", "Silence", "Lingering magic"],
    creatureCategories: ["undead", "magical", "aberration", "monstrosity", "humanoid"],
    behaviors: ["passive", "wary", "hostile", "hidden", "desperate"],
    situationStates: ["distant", "nearby", "developing", "aftermath"],
    playerDecisions: ["Investigate", "Avoid", "Salvage", "Heal survivors", "Follow clues", "Cleanse the area", "Prepare for return danger", "Leave quickly"],
    severityScaling: { minor: "Clues or harmless remnants", standard: "Hazard, survivor, or unresolved threat", dangerous: "Corruption, traps, disease, cursed remains, or returning danger", deadly: "Active spread, catastrophic aftermath, hidden killer, or threat about to re-emerge" }
  },
  {
    roll: 8, id: "strangePresence", name: "Strange Presence", category: "weird",
    description: "An unusual, supernatural, magical, alien, or inexplicable phenomenon is present in the area.",
    requiredElements: ["Strange presence", "Observable effect", "Uncertainty about its nature or intent"],
    firstSigns: ["Impossible sounds", "Unnatural lights", "Repeated symbols", "Floating objects", "Altered animals", "Warped terrain", "Whispers", "Visions", "A figure that does not behave normally"],
    creatureCategories: ["magical", "aberration", "undead", "monstrosity", "humanoid"],
    behaviors: ["passive", "wary", "engaged", "hostile", "hidden", "desperate"],
    situationStates: ["distant", "nearby", "developing", "immediate", "aftermath"],
    playerDecisions: ["Investigate", "Communicate", "Avoid", "Contain", "Destroy", "Follow", "Bargain", "Experiment", "Flee"],
    severityScaling: { minor: "Odd but mostly harmless phenomenon", standard: "Meaningful mystery or magical complication", dangerous: "Reality-warping effect, hostile entity, or escalating anomaly", deadly: "Catastrophic magic, alien intelligence, possession, planar breach, or irreversible consequence" }
  }
]);

export const CREATURE_CATEGORIES = Object.freeze([
  { roll: 1, id: "beast", name: "Beast", definition: "Natural animals and non-magical wildlife.", environments: ["plains", "forest", "hills", "swamp", "mountains", "arctic", "coast", "riverlands"], bestTemplates: ["predation", "territorialDefense", "hunterPrey", "travelerCaravan"] },
  { roll: 2, id: "humanoid", name: "Humanoid", definition: "Intelligent peoples, factions, travelers, soldiers, bandits, cultists, settlement groups, and organized forces.", environments: ["roadways", "settled", "plains", "coast", "riverlands", "forest", "hills", "desert", "mountains", "underground"], bestTemplates: ["guardedSite", "patrolWatch", "travelerCaravan", "hunterPrey"] },
  { roll: 3, id: "monstrosity", name: "Monstrosity", definition: "Unnatural creatures that do not fit cleanly into ordinary natural categories.", environments: ["forest", "hills", "swamp", "desert", "mountains", "arctic", "blighted", "underground"], bestTemplates: ["predation", "territorialDefense", "guardedSite", "hunterPrey"] },
  { roll: 4, id: "undead", name: "Undead", definition: "Creatures, spirits, corpses, or remnants animated by death, necromancy, curses, or lingering will.", environments: ["settled", "blighted", "underground", "swamp", "forest", "mountains", "feyTouched"], bestTemplates: ["lingeringThreat", "guardedSite", "predation", "strangePresence"] },
  { roll: 5, id: "magical", name: "Magical", definition: "Creatures or entities formed, changed, summoned, constructed, or sustained by magical forces.", environments: ["feyTouched", "blighted", "underground", "forest", "mountains", "coast", "riverlands", "desert"], bestTemplates: ["strangePresence", "guardedSite", "territorialDefense", "travelerCaravan"] },
  { roll: 6, id: "aberration", name: "Aberration", definition: "Alien, invasive, warped, or reality-defying entities that do not belong to the natural order.", environments: ["blighted", "underground", "feyTouched", "swamp", "mountains", "coast", "settled"], bestTemplates: ["strangePresence", "predation", "lingeringThreat", "hunterPrey"] }
]);

export const BEHAVIORS = Object.freeze([
  { roll: 1, id: "passive", name: "Passive", meaning: "Not immediately threatening and may ignore, observe, pass by, or continue its current activity." },
  { roll: 2, id: "wary", name: "Wary", meaning: "Cautious, suspicious, defensive, or uncertain about the party." },
  { roll: 3, id: "hostile", name: "Hostile", meaning: "Aggressive, threatening, hunting, attacking, or likely to become violent." },
  { roll: 4, id: "engaged", name: "Engaged", meaning: "Focused on another task, target, ritual, conflict, journey, negotiation, or objective." },
  { roll: 5, id: "desperate", name: "Desperate", meaning: "Injured, fleeing, starving, trapped, hunted, panicked, or acting under pressure." },
  { roll: 6, id: "hidden", name: "Hidden", meaning: "Concealed, stalking, watching, ambushing, hiding, or not immediately obvious." }
]);

export const SITUATION_STATES = Object.freeze([
  { roll: 1, id: "unaware", name: "Unaware", meaning: "The encounter has not noticed the party. The party may observe, avoid, approach, prepare, or act first." },
  { roll: 2, id: "alert", name: "Alert", meaning: "The encounter is aware that something may be nearby, but has not fully identified the party." },
  { roll: 3, id: "distant", name: "Distant", meaning: "The encounter is detectable at a distance. The party has time to decide how to approach." },
  { roll: 4, id: "nearby", name: "Nearby", meaning: "The encounter is close enough to matter soon, but immediate contact has not yet occurred." },
  { roll: 5, id: "close", name: "Close", meaning: "The encounter is close enough for interaction, confrontation, or quick escalation." },
  { roll: 6, id: "immediate", name: "Immediate", meaning: "The encounter begins in direct contact, active danger, conversation, pursuit, ambush, or combat range." },
  { roll: 7, id: "developing", name: "Developing", meaning: "The encounter is already in motion and will change if the party does not intervene." },
  { roll: 8, id: "aftermath", name: "Aftermath", meaning: "The main event has already happened, leaving evidence, survivors, hazards, tracks, or consequences behind." }
]);

export const DISCOVERY_TABLES = Object.freeze({});
export const COMPLICATION_PROMPT_TABLES = Object.freeze({});
