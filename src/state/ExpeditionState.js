import { MODULE_ID, MODULE_VERSION, SETTINGS, MOMENTUM, THREAT, LOG_PREFIX } from "../constants/module-constants.js";
import { clone, mergeDeep } from "../utils/helpers.js";

const DEFAULT_STATE = Object.freeze({
  schema: 1,
  momentum: MOMENTUM.NEUTRAL,
  threat: { stage: THREAT.NONE, source: null },
  preparedRole: null,
  currentHex: null,
  history: []
});

export class ExpeditionState {
  static registerSettings() {
    game.settings.register(MODULE_ID, SETTINGS.EXPEDITION_STATE, {
      name: "Zantor's Overland Travel Expedition State",
      scope: "world",
      config: false,
      type: Object,
      default: clone(DEFAULT_STATE)
    });

    game.settings.register(MODULE_ID, SETTINGS.DEBUG, {
      name: "Debug Logging",
      hint: "Enable additional ZFT Overland Travel diagnostic logging.",
      scope: "world",
      config: true,
      type: Boolean,
      default: false
    });
  }

  static get() {
    return mergeDeep(DEFAULT_STATE, game.settings.get(MODULE_ID, SETTINGS.EXPEDITION_STATE) ?? {});
  }

  static async update(patch, { history = null } = {}) {
    if (!game.user?.isGM) throw new Error(`${LOG_PREFIX} Only a GM may change expedition state.`);

    const next = mergeDeep(this.get(), patch);
    if (history) {
      next.history = [...(next.history ?? []), { at: Date.now(), ...history }].slice(-50);
    }

    await game.settings.set(MODULE_ID, SETTINGS.EXPEDITION_STATE, next);
    return clone(next);
  }

  static async reset() {
    if (!game.user?.isGM) throw new Error(`${LOG_PREFIX} Only a GM may reset expedition state.`);
    await game.settings.set(MODULE_ID, SETTINGS.EXPEDITION_STATE, clone(DEFAULT_STATE));
    console.log(`${LOG_PREFIX} ✅ v${MODULE_VERSION} | Expedition state reset`);
    return this.get();
  }

  static get defaultState() {
    return clone(DEFAULT_STATE);
  }
}
