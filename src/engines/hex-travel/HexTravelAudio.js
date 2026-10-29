/** Local GM-only event cues. No world writes, no sockets, and no required sound module. */
import { MODULE_ID } from "../../constants/module-constants.js";
const PATH = `modules/${MODULE_ID}/assets/audio/`;
const FILES = Object.freeze({
  hexComplete: "hex-complete.wav", navigationSuccess: "navigation-success.wav",
  navigationFailure: "navigation-failure.wav", forcedMarch: "forced-march-alert.wav"
});
export function playHexTravelCue(kind) {
  if (!game.user?.isGM || !(kind in FILES)) return false;
  try {
    if (!game.settings.get(MODULE_ID, "hexTravelSoundEnabled")) return false;
    const requested = Number(game.settings.get(MODULE_ID, "hexTravelSoundVolume"));
    const volume = Number.isFinite(requested) ? Math.min(1, Math.max(0, requested)) : 0.35;
    if (volume === 0) return false;
    const helper = globalThis.AudioHelper ?? globalThis.foundry?.audio?.AudioHelper;
    if (typeof helper?.play !== "function") return false;
    const result = helper.play({ src: PATH + FILES[kind], volume, autoplay: true, loop: false }, false);
    if (result?.catch) result.catch(error => console.warn(`[ZFT][HexTravel] Local ${kind} sound unavailable.`, error));
    return true;
  } catch (error) {
    console.warn(`[ZFT][HexTravel] Optional ${kind} sound skipped.`, error);
    return false;
  }
}
