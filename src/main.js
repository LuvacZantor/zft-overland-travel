import { registerHexTravelLegacySettings, migrateHexTravelSettings } from "./migration/hex-travel-v63.js";
import { HexTravelConsole, registerHexTravelSettings, publishHexTravelSnapshot, publishHexTravelCard, removeHexTravelCard, hexTravelIdentity, hexTravelGeneration, hexTravelLogEpoch, hexTravelRolePreferences, rememberHexTravelRoles, rememberHexProgress, notifyHexCompletion, playHexTravelCue, preserveDepartingTravelDayDate } from "./engines/hex-travel/HexTravelConsole.js";
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
  registerHexTravelLegacySettings();
  registerHexTravelSettings();
  ThemeManager.register();
  console.log(`${LOG_PREFIX} 🚀 v${MODULE_VERSION} | Initializing`);
});

Hooks.once("ready", async () => {
  try { await migrateHexTravelSettings(); }
  catch (error) {
    console.error("[ZFT][HexTravel] World/client settings migration failed; workspace not initialized.", error);
    ui.notifications?.error?.("Hex Travel migration failed. Expedition controls were not started; review F12 and restore from a backup before retrying.");
    return;
  }
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
  // Dedicated Hex Travel Engine bridge; the generic Travel Manager is separate.
  globalThis.ZFTHexTravelConsole = Object.freeze({ publish: publishHexTravelSnapshot, stage: publishHexTravelCard, removeStage: removeHexTravelCard, identity: hexTravelIdentity, generation: hexTravelGeneration, logEpoch: hexTravelLogEpoch, rolePreferences: hexTravelRolePreferences, rememberRoles: rememberHexTravelRoles, hexStarted: rememberHexProgress, hexCompleted: notifyHexCompletion, cue: playHexTravelCue, preserveDayDate: preserveDepartingTravelDayDate, prompt: options => HexTravelConsole.prompt(options), registerPendingRoll: info => HexTravelConsole.registerPendingRoll(info), unregisterPendingRoll: (key,token) => HexTravelConsole.unregisterPendingRoll(key,token) });
  HexTravelConsole.onReady();
  Hooks.on("updateActor", actor => { if (actor?.type === "character") HexTravelConsole.refresh(); });
  // Scoped V13 application hook: only our pending forced-march CON prompts
  // qualify for placement. No global Foundry window or Action HUD changes.
  Hooks.on("renderApplicationV2", (application, element) => {
    HexTravelConsole.onOtherApplicationRendered();
    HexTravelConsole.positionExpeditionRollDialog(application, element);
  });
  Hooks.on("closeApplicationV2", application => {
    HexTravelConsole.restoreExpeditionRollDialog(application);
    HexTravelConsole.onOtherApplicationRendered();
  });
  // V13 legacy and third-party windows should also pass in front of the
  // expedition panes; these hooks only adjust our own panes' z-index.
  Hooks.on("renderApplication", () => HexTravelConsole.onOtherApplicationRendered());
  Hooks.on("renderDialog", () => HexTravelConsole.onOtherApplicationRendered());

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
      { name: "zftHexTravelEngine", title: "Expedition Dashboard", icon: "fa-solid fa-mountain",
        order: 20, button: true, visible: true, gmOnly: false,
        onChange: () => { void HexTravelConsole.toggle(); } }
    ]
  });
});
