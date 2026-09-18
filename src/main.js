// src/main.js

import { MODULE_ID,MODULE_VERSION, ZOT } from "./constants/module-constants.js";
import { TerrainRegistry } from "./registry/TerrainRegistry.js";
import { EncounterTemplateRegistry } from "./registry/EncounterTemplateRegistry.js";
import { SeverityEngine } from "./engines/encounter/SeverityEngine.js";

Hooks.once("init", () => {
  console.log(`[ZFT][ZOT] 🛠️ v0.1.6 | ${MODULE_ID} initializing`);
});

Hooks.once("ready", async () => {
  console.log(`[ZFT][ZOT] ✅ v0.1.6 | ${MODULE_ID} ready`);

  if (ZOT.DEBUG) {
    console.log("[ZFT][ZOT] 🔎 v0.1.6 | Debug Mode Enabled");
  }

  await TerrainRegistry.initialize();
  
  await EncounterTemplateRegistry.initialize();
  

  game.modules.get(MODULE_ID).api = {
    terrain: TerrainRegistry,
    encounterTemplates: EncounterTemplateRegistry,
	severity: SeverityEngine
  };

  console.log("[ZFT][ZOT] 🌐 v0.1.6 | Public API registered");
});