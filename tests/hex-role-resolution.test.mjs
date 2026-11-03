import test from "node:test";
import assert from "node:assert/strict";
import { startHexRecord, saveHexRolePhase } from "../src/engines/hex-travel/HexTravelRecords.js";
import { buildRolePhasePlan, buildRolePhaseResolution, rolePairGrade } from "../src/engines/hex-travel/HexExpeditionRoleResolution.js";

const context = {
  id: "hex-a", number: 1, day: 2, hour: 3,
  identity: { name: "Overland Expedition", region: "Ironrot", world: "Eberron" },
  difficulty: { mode: "custom", dc: 15, terrainId: null, regionDanger: null },
  pace: { id: "normal", name: "Normal", multiplier: 1 },
  party: [
    { actorUuid: "Actor.guide", name: "Guide PC" },
    { actorUuid: "Actor.vanguard", name: "Vanguard PC" },
    { actorUuid: "Actor.scout", name: "Scout PC" },
    { actorUuid: "Actor.tracker", name: "Tracker PC" },
    { actorUuid: "Actor.forager", name: "Forager PC" }
  ],
  assignments: {
    guide: "Actor.guide", vanguard: "Actor.vanguard", scout: "Actor.scout",
    tracker: "Actor.tracker", forager: "Actor.forager", coordinator: "Actor.absent"
  },
  navigation: {
    dc: 15, guide: { actorUuid: "Actor.guide", actorName: "Guide PC", total: 16, success: true, ruling: "roll" },
    vanguard: { actorUuid: "Actor.vanguard", actorName: "Vanguard PC", total: 14, success: false, ruling: "roll" },
    grade: "partial", totalHours: 4
  },
  dice: { hours: 4, baseDice: [2, 2], delayDice: [] },
  now: 1000
};
function recordStore() { return startHexRecord(undefined, context); }

test("dev.89 records stage later Expedition phases pending", () => {
  const record = recordStore().records[0];
  assert.equal(record.phases.reconnaissance, "pending");
  assert.equal(record.phases.support, "pending");
  assert.equal(record.phases.travelQuality, "pending");
  assert.equal(record.phases.momentum, "pending");
  assert.equal(record.phases.event, "pending");
});

test("Reconnaissance plan uses frozen assignments, party and DC", () => {
  const record = recordStore().records[0];
  const plan = buildRolePhasePlan(record, "reconnaissance");
  assert.equal(plan.dc, 15);
  assert.deepEqual(plan.slots.map(slot => [slot.role, slot.actorName, slot.skill, slot.ability, slot.status]), [
    ["scout", "Scout PC", "ste", "dex", "ready"],
    ["tracker", "Tracker PC", "inv", "int", "ready"]
  ]);
});

test("Support plan records an assigned-but-absent Coordinator without inventing a roll", () => {
  const record = recordStore().records[0];
  const plan = buildRolePhasePlan(record, "support");
  assert.deepEqual(plan.slots.map(slot => [slot.role, slot.actorName, slot.status]), [
    ["forager", "Forager PC", "ready"],
    ["coordinator", null, "absent"]
  ]);
});

test("GM override preserves original total and rolled outcome while changing effective success", () => {
  const record = recordStore().records[0];
  const plan = buildRolePhasePlan(record, "reconnaissance");
  const result = buildRolePhaseResolution(plan, {
    scout: { total: 10, rollerId: "player-a" }, tracker: { total: 20, rollerId: "player-b" }
  }, { scout: "success", tracker: "failure" }, 2000);
  assert.equal(result.grade, "partial");
  const scout = result.results.find(entry => entry.role === "scout");
  const tracker = result.results.find(entry => entry.role === "tracker");
  assert.equal(scout.total, 10);
  assert.equal(scout.rolledSuccess, false);
  assert.equal(scout.ruling, "success");
  assert.equal(scout.success, true);
  assert.equal(tracker.total, 20);
  assert.equal(tracker.rolledSuccess, true);
  assert.equal(tracker.ruling, "failure");
  assert.equal(tracker.success, false);
});

test("paired grade is strong with two successes, partial with one, failure with none, unassigned with no checks", () => {
  assert.equal(rolePairGrade([{ status: "checked", success: true }, { status: "checked", success: true }]), "strong");
  assert.equal(rolePairGrade([{ status: "checked", success: true }, { status: "checked", success: false }]), "partial");
  assert.equal(rolePairGrade([{ status: "checked", success: false }, { status: "checked", success: false }]), "failure");
  assert.equal(rolePairGrade([{ status: "unassigned" }, { status: "absent" }]), "unassigned");
});

test("saving a role phase changes only that phase and keeps later Expedition stages pending", () => {
  const store = recordStore();
  const plan = buildRolePhasePlan(store.records[0], "reconnaissance");
  const result = buildRolePhaseResolution(plan, { scout: 17, tracker: 12 }, {}, 3000);
  const next = saveHexRolePhase(store, "hex-a", "reconnaissance", result);
  const record = next.records[0];
  assert.equal(record.phases.reconnaissance, "completed");
  assert.equal(record.phases.support, "pending");
  assert.equal(record.phases.travelQuality, "pending");
  assert.equal(record.roles.reconnaissance.grade, "partial");
  assert.equal(record.navigation.guide.total, 16);
  assert.equal(record.travel.rolledHours, 4);
});

test("existing dev.87 notImplemented phase can be resolved once without migration", () => {
  const store = recordStore();
  store.records[0].phases.reconnaissance = "notImplemented";
  const plan = buildRolePhasePlan(store.records[0], "reconnaissance");
  const result = buildRolePhaseResolution(plan, { scout: 15, tracker: 15 }, {}, 4000);
  const next = saveHexRolePhase(store, "hex-a", "reconnaissance", result);
  assert.equal(next.records[0].phases.reconnaissance, "completed");
  assert.throws(() => saveHexRolePhase(next, "hex-a", "reconnaissance", result), /already completed/);
});

test("interrupted record rejects late role results", () => {
  const store = recordStore();
  store.records[0].status = "interrupted";
  store.records[0].travel.status = "interrupted";
  store.records[0].phases.travel = "interrupted";
  const plan = buildRolePhasePlan(store.records[0], "reconnaissance");
  const result = buildRolePhaseResolution(plan, { scout: 15, tracker: 15 }, {}, 5000);
  assert.throws(() => saveHexRolePhase(store, "hex-a", "reconnaissance", result), /interrupted/);
});
