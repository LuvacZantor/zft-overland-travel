// src/registry/EncounterTemplateRegistry.js

import {
  MODULE_ID,
  MODULE_VERSION
} from "../constants/module-constants.js";

import { requireFields } from "../utils/validation.js";

export class EncounterTemplateRegistry {

  static #templates = new Map();

  static async initialize() {

    console.log(
      `[ZFT][ZOT] 🧩 v${MODULE_VERSION} | ${MODULE_ID} | Initializing EncounterTemplateRegistry`
    );

    const path =
      `modules/${MODULE_ID}/src/data/encounter/encounter-templates.json`;

    const response =
      await fetch(path);

    if (!response.ok) {

      console.error(
        `[ZFT][ZOT] ❌ v${MODULE_VERSION} | ${MODULE_ID} | Failed to load encounter templates from ${path}`
      );

      return;
    }

    const data =
      await response.json();

    for (const entry of data) {

      if (!requireFields(
        entry,
        ["id", "name", "category"],
        "encounter template"
      )) {
        continue;
      }

      this.#templates.set(entry.id, entry);
    }

    console.log(
      `[ZFT][ZOT] ✅ v${MODULE_VERSION} | ${MODULE_ID} | Loaded ${this.#templates.size} encounter templates`
    );
  }

  static get(id) {
    return this.#templates.get(id);
  }

  static all() {
    return Array.from(this.#templates.values());
  }
}