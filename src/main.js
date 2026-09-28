import { MODULE_ID, MODULE_VERSION, SETTINGS, LOG_PREFIX } from "./constants/module-constants.js";
import { TERRAIN, REGION_DANGER, TRAVEL_ROLES } from "./data/rules.js";
import { ExpeditionState } from "./state/ExpeditionState.js";
import { TravelEngine } from "./engines/travel/TravelEngine.js";
import { RoleEngine } from "./engines/travel/RoleEngine.js";
import { MomentumEngine } from "./engines/travel/MomentumEngine.js";
import { EventEngine } from "./engines/travel/EventEngine.js";
import { EncounterEngine } from "./engines/encounter/EncounterEngine.js";
import { SeverityEngine } from "./engines/encounter/SeverityEngine.js";
import { ComplicationEngine } from "./engines/complication/ComplicationEngine.js";
import { DiscoveryEngine } from "./engines/discovery/DiscoveryEngine.js";
import { QuietTravelEngine } from "./engines/quiet-travel/QuietTravelEngine.js";
import { ThreatEngine } from "./engines/threat/ThreatEngine.js";
import { TravelPanel } from "./ui/TravelPanel.js";

console.log(`${LOG_PREFIX} 🛠️ v${MODULE_VERSION} | Loading ${MODULE_ID}`);

Hooks.once("init", () => {
  ExpeditionState.registerSettings();
  console.log(`${LOG_PREFIX} 🚀 v${MODULE_VERSION} | Initializing`);
});

Hooks.once("ready", () => {
  const module = game.modules.get(MODULE_ID);
  if (!module) {
    console.error(`${LOG_PREFIX} ❌ v${MODULE_VERSION} | Module record unavailable`);
    return;
  }

  module.api = {
    state: ExpeditionState,
    travel: TravelEngine,
    roles: RoleEngine,
    momentum: MomentumEngine,
    events: EventEngine,
    encounter: EncounterEngine,
    severity: SeverityEngine,
    complication: ComplicationEngine,
    discovery: DiscoveryEngine,
    quietTravel: QuietTravelEngine,
    threat: ThreatEngine,
    panel: TravelPanel,
    data: { terrain: TERRAIN, regionDanger: REGION_DANGER, roles: TRAVEL_ROLES }
  };

  game.zftOverlandTravel = module.api;

  if (game.settings.get(MODULE_ID, SETTINGS.DEBUG)) {
    console.log(`${LOG_PREFIX} 🔍 v${MODULE_VERSION} | Debug mode enabled`, ExpeditionState.get());
  }

  console.log(`${LOG_PREFIX} ✅ v${MODULE_VERSION} | Ready`);
});

Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user?.isGM) return;
  const tokens = controls?.tokens;
  if (!tokens?.tools) return;

  tokens.tools.zftOverlandTravel = {
    name: "zftOverlandTravel",
    title: "Zantor's Overland Travel",
    icon: "fa-solid fa-compass",
    order: Object.keys(tokens.tools).length,
    button: true,
    visible: true,
    onChange: () => TravelPanel.open()
  };
});
