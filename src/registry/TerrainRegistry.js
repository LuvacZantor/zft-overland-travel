// src/registry/TerrainRegistry.js

import {
  MODULE_ID,
  MODULE_VERSION
} from "../constants/module-constants.js";

import { requireFields } from "../utils/validation.js";

export class TerrainRegistry {

  static #terrain = new Map();

  static async initialize() {

    console.log(
      `[ZFT][ZOT] 🗺️ v${MODULE_VERSION} | ${MODULE_ID} | Initializing TerrainRegistry`
    );

    const path =
      `modules/${MODULE_ID}/src/data/terrain/terrain.json`;

    const response =
      await fetch(path);

    if (!response.ok) {

      console.error(
        `[ZFT][ZOT] ❌ v${MODULE_VERSION} | ${MODULE_ID} | Failed to load terrain data from ${path}`
      );

      return;
    }

    const data =
      await response.json();

    for (const entry of data) {

      if (!requireFields(
        entry,
        ["id", "name", "difficulty", "baseDc"],
        "terrain"
      )) {

        console.warn(
          `[ZFT][ZOT] ⚠️ v${MODULE_VERSION} | ${MODULE_ID} | Invalid terrain entry`,
          entry
        );

        continue;
      }

      this.#terrain.set(entry.id, entry);
    }

    console.log(
      `[ZFT][ZOT] ✅ v${MODULE_VERSION} | ${MODULE_ID} | Loaded ${this.#terrain.size} terrain entries`
    );
  }

  static get(id) {
    return this.#terrain.get(id);
  }

  static all() {
    return Array.from(this.#terrain.values());
  }
}