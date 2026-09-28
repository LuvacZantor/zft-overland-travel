import { ExpeditionState } from "../../state/ExpeditionState.js";
import { RoleEngine } from "./RoleEngine.js";
import { EventEngine } from "./EventEngine.js";
import { MomentumEngine } from "./MomentumEngine.js";

export class TravelEngine {
  static async beginHex({ terrainId, regionDanger, roles = {}, eventRoll = null } = {}) {
    const dc = RoleEngine.calculateDC(terrainId, regionDanger);
    const state = ExpeditionState.get();
    const event = EventEngine.rollBase(eventRoll);
    const preparedRole = state.preparedRole;

    const currentHex = {
      terrainId, regionDanger, roleDC: dc.roleDC, baseDC: dc.baseDC,
      regionModifier: dc.modifier, roles: { ...roles }, preparedRole,
      baseEvent: event.event, eventRoll: event.roll, startedAt: Date.now()
    };

    const next = await ExpeditionState.update(
      { currentHex, preparedRole: null },
      { history: { type: "hexStart", terrainId, regionDanger, roleDC: dc.roleDC, baseEvent: event.event, eventRoll: event.roll } }
    );

    return { currentHex: next.currentHex, momentum: next.momentum, threat: next.threat, preparedRoleAdvantage: preparedRole };
  }

  static async resolveHex({ rolls } = {}) {
    const state = ExpeditionState.get();
    const hex = state.currentHex;
    if (!hex) throw new Error("[ZFT][ZOT] No active hex. Begin a hex before resolving travel.");

    const party = RoleEngine.resolveParty(rolls ?? [], hex.roleDC);
    const oldMomentum = state.momentum;
    const newMomentum = MomentumEngine.fromTravelQuality(oldMomentum, party.quality);
    const resolvedEvent = EventEngine.resolve({ roll: hex.eventRoll, momentum: newMomentum });

    const completedHex = {
      ...hex, completedAt: Date.now(), roleResults: party.results,
      successes: party.successes, failures: party.failures, travelQuality: party.quality,
      momentumBefore: oldMomentum, momentumAfter: newMomentum,
      resolvedEvent: resolvedEvent.resolvedEvent, momentumEventShift: resolvedEvent.momentumShift
    };

    const next = await ExpeditionState.update(
      { momentum: newMomentum, currentHex: null },
      { history: { type: "hexResolved", terrainId: hex.terrainId, regionDanger: hex.regionDanger, quality: party.quality, momentumBefore: oldMomentum, momentumAfter: newMomentum, event: resolvedEvent.resolvedEvent } }
    );

    return { hex: completedHex, state: next };
  }
}
