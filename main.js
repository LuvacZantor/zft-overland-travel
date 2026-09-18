// src/main.js

import { MODULE_ID, ZOT } from "./constants/module-constants.js";

Hooks.once("init", () => {
  console.log(`[ZFT][ZOT] 🛠️ v0.1.1 | ${MODULE_ID} initializing`);
});

Hooks.once("ready", () => {
console.log(`[ZFT][ZOT] ✅ v0.1.1 | ${MODULE_ID} ready`);

  if (ZOT.DEBUG) {
    console.log("[ZFT][ZOT] 🔎 Debug Mode Enabled");
  }
});