import { IronrotConsole, registerIronrotSettings, publishIronrotSnapshot, publishIronrotTravelCard, removeIronrotTravelCard, ironrotIdentity, ironrotGeneration, ironrotLogEpoch, ironrotRolePreferences, rememberIronrotRoles, rememberIronrotHex } from "./expeditions/mount-ironrot/IronrotConsole.js";
import { MODULE_ID, MODULE_VERSION, MODULE_TITLE, SETTINGS, LOG_PREFIX } from "./constants/module-constants.js";
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
import { RulesCompendium } from "./docs/RulesCompendium.js";
import { ThemeManager } from "./theme/ThemeManager.js";

console.log(`${LOG_PREFIX} 🛠️ v${MODULE_VERSION} | Loading ${MODULE_ID}`);

Hooks.once("init", () => {
  ExpeditionState.registerSettings();
  registerIronrotSettings();
  ThemeManager.register();
  console.log(`${LOG_PREFIX} 🚀 v${MODULE_VERSION} | Initializing`);
});

Hooks.once("ready", async () => {
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
    themes: ThemeManager,
    rules: RulesCompendium,
    data: { terrain: TERRAIN, regionDanger: REGION_DANGER, roles: TRAVEL_ROLES }
  };

  game.zftOverlandTravel = module.api;
  // Only the Mount Ironrot implementation uses this bridge. It is not an API
  // of the generic Travel Manager or shared expedition-state engines.
  globalThis.ZFTMountIronrotConsole = Object.freeze({ publish: publishIronrotSnapshot, stage: publishIronrotTravelCard, removeStage: removeIronrotTravelCard, identity: ironrotIdentity, generation: ironrotGeneration, logEpoch: ironrotLogEpoch, rolePreferences: ironrotRolePreferences, rememberRoles: rememberIronrotRoles, hexStarted: rememberIronrotHex, prompt: options => IronrotConsole.prompt(options), registerPendingRoll: info => IronrotConsole.registerPendingRoll(info), unregisterPendingRoll: (key,token) => IronrotConsole.unregisterPendingRoll(key,token) });
  IronrotConsole.onReady();
  // Scoped V13 application hook: only our pending forced-march CON prompts
  // qualify for placement. No global Foundry window or Action HUD changes.
  Hooks.on("renderApplicationV2", (application, element) => {
    IronrotConsole.onOtherApplicationRendered();
    IronrotConsole.positionExpeditionRollDialog(application, element);
  });
  Hooks.on("closeApplicationV2", application => {
    IronrotConsole.restoreExpeditionRollDialog(application);
    IronrotConsole.onOtherApplicationRendered();
  });
  // V13 legacy and third-party windows should also pass in front of the
  // expedition panes; these hooks only adjust our own panes' z-index.
  Hooks.on("renderApplication", () => IronrotConsole.onOtherApplicationRendered());
  Hooks.on("renderDialog", () => IronrotConsole.onOtherApplicationRendered());

  if (game.user?.isGM) {
    try {
      await RulesCompendium.ensure();
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ v${MODULE_VERSION} | Failed to prepare rules compendium`, error);
    }
  }

  if (game.settings.get(MODULE_ID, SETTINGS.DEBUG)) {
    console.log(`${LOG_PREFIX} 🔍 v${MODULE_VERSION} | Debug mode enabled`, ExpeditionState.get());
  }

  console.log(`${LOG_PREFIX} ✅ v${MODULE_VERSION} | Ready`);
});

// Toolbar presentation is centralized in ZFT Tools; gameplay remains module-owned.
Hooks.once("ready", () => {
  const toolbar = game.modules.get("zft-tools")?.api;
  if (!toolbar?.registerGroup) {
    console.warn("[ZFT] ⚠️ Overland Travel | Requires ZFT Tools multi-group API (0.1.0-dev.8)");
    return;
  }
  toolbar.registerGroup(MODULE_ID, {
    title: MODULE_TITLE, icon: "fa-solid fa-compass", order: 990,
    tools: [
      { name: "zftOverlandTravel", title: "Travel Manager", icon: "fa-solid fa-map",
        order: 10, button: true, visible: true, gmOnly: true,
        onChange: () => { if (game.user?.isGM) TravelPanel.open(); } },
      { name: "zftMountIronrot", title: "Mount Ironrot Expedition Console", icon: "fa-solid fa-mountain",
        order: 20, button: true, visible: true, gmOnly: false,
        onChange: () => { void IronrotConsole.toggle(); } }
    ]
  });
});
