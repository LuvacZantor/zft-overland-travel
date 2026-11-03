import test from "node:test";
import assert from "node:assert/strict";
import {
  cloneHexRecordStore, startHexRecord, syncHexRecordProgress,
  markHexRecordLedgerCorrection, HexTravelRecords
} from "../src/engines/hex-travel/HexTravelRecords.js";

const clone = value => structuredClone(value);
function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function context(overrides = {}) {
  return {
    id: "hex-a", number: 3, day: 2, hour: 1, now: 1000,
    identity: { name: "Northern Expedition", region: "Ridge", world: "Test World" },
    difficulty: { mode: "terrain", dc: 18, terrainId: "mountains", regionDanger: "wild" },
    pace: { id: "normal", name: "Normal", multiplier: 1 },
    party: [{ actorUuid: "Actor.guide", name: "Guide PC" }, { actorUuid: "Actor.vanguard", name: "Vanguard PC" }],
    assignments: { guide: "Actor.guide", vanguard: "Actor.vanguard", scout: "", tracker: "", forager: "", coordinator: "" },
    navigation: {
      dc: 18, pace: "normal", guide: { actorUuid: "Actor.guide", total: 21, success: true, ruling: "roll", delay: 0 },
      vanguard: { actorUuid: "Actor.vanguard", total: 13, success: false, ruling: "roll", delay: 3 },
      grade: "partial", totalHours: 10
    },
    dice: { baseDice: [3, 4], delayDice: [3], base: 7, adjusted: 7, guideDelay: 0, vanguardDelay: 3, delay: 3, hours: 10 },
    ...overrides
  };
}
function initial(overrides = {}) { return startHexRecord(null, context(overrides)); }
function ledger(overrides = {}) {
  return { day: 2, hours: 1, pending: 10, hexes: 2, activeHexCardId: "hex-a", hexHourSegments: [], ...overrides };
}

test("missing legacy collection is empty without altering the legacy ledger", () => {
  const legacy = freeze(ledger({ activeHexCardId: "old-card" }));
  assert.deepEqual(cloneHexRecordStore(legacy.hexRecords), { schema: 1, records: [] });
  assert.deepEqual(syncHexRecordProgress(undefined, legacy, "old-card", 2000), { schema: 1, records: [] });
  assert.deepEqual(syncHexRecordProgress(null, legacy, null, 2000), { schema: 1, records: [] });
  assert.equal(Object.hasOwn(legacy, "hexRecords"), false);
});

test("new record snapshots finalized context and does not change supplied objects", () => {
  const input = freeze(context());
  const records = startHexRecord(undefined, input);
  const record = records.records[0];
  assert.equal(record.id, "hex-a");
  assert.equal(record.number, 3);
  assert.deepEqual(record.start, { day: 2, hour: 1 });
  assert.equal(record.createdAt, 1000);
  assert.equal(record.completedAt, null);
  assert.equal(record.status, "inProgress");
  assert.equal(record.travel.rolledHours, 10);
  assert.equal(record.travel.committedHours, 0);
  assert.equal(record.travel.remainingHours, 10);
  assert.deepEqual(record.travel.segments, []);
  assert.deepEqual(record.navigation, input.navigation);
  assert.deepEqual(record.context.party, input.party);
  assert.deepEqual(record.context.assignments, input.assignments);
  assert.deepEqual(record.context.difficulty, input.difficulty);
  assert.deepEqual(record.context.pace, input.pace);
  assert.equal(record.phases.navigation, "completed");
  for (const phase of ["reconnaissance", "support"]) assert.equal(record.phases[phase], "pending");
  for (const phase of ["travelQuality", "momentum", "event"]) assert.equal(record.phases[phase], "notImplemented");
  record.context.party[0].name = "Changed copy";
  record.navigation.guide.total = 1;
  record.travel.dice.baseDice[0] = 1;
  assert.equal(input.party[0].name, "Guide PC");
  assert.equal(input.navigation.guide.total, 21);
  assert.deepEqual(input.dice.baseDice, [3, 4]);
});

test("starting an existing ID preserves its original results and progress", () => {
  const original = freeze(syncHexRecordProgress(initial(), ledger({
    hours: 8, pending: 3, hexHourSegments: [{ hexId: "hex-a", day: 2, hours: 7 }]
  }), "hex-a", 2000));
  const again = startHexRecord(original, { id: "hex-a" });
  assert.deepEqual(again, original);
  assert.notEqual(again, original);
  assert.notEqual(again.records[0], original.records[0]);
  assert.equal(again.records.length, 1);
});

test("actual day segments determine progress and unrelated hexes are excluded", () => {
  const original = freeze(initial());
  const state = freeze(ledger({ hours: 8, pending: 3, hexHourSegments: [
    { hexId: "another-hex", day: 2, hours: 100 },
    { hexId: "hex-a", day: 2, hours: 5 },
    { hexId: "hex-a", day: 2, hours: 2 }
  ] }));
  const updated = syncHexRecordProgress(original, state, "hex-a", 2000);
  assert.equal(updated.records[0].travel.committedHours, 7);
  assert.equal(updated.records[0].travel.remainingHours, 3);
  assert.deepEqual(updated.records[0].travel.segments, [{ day: 2, hours: 7 }]);
  assert.equal(updated.records[0].status, "inProgress");
  assert.equal(updated.records[0].completedAt, null);
  assert.equal(original.records[0].travel.committedHours, 0);
});

test("cross-day continuation retains the same sequence and original context", () => {
  const partial = freeze(syncHexRecordProgress(initial(), ledger({
    hours: 8, pending: 3, hexHourSegments: [{ hexId: "hex-a", day: 2, hours: 7 }]
  }), "hex-a", 2000));
  const nextDay = ledger({ day: 3, hours: 0, pending: 3, hexHourSegments: [{ hexId: "hex-a", day: 2, hours: 7 }] });
  const unchanged = syncHexRecordProgress(partial, freeze(nextDay), "hex-a", 3000);
  assert.deepEqual(unchanged, partial);
  const finished = syncHexRecordProgress(partial, freeze({
    ...nextDay, hours: 3, pending: 0, hexes: 3, activeHexCardId: null,
    hexHourSegments: [{ hexId: "hex-a", day: 3, hours: 3 }, { hexId: "hex-a", day: 2, hours: 7 }]
  }), "hex-a", 4000);
  const record = finished.records[0];
  assert.equal(record.id, partial.records[0].id);
  assert.deepEqual(record.context, partial.records[0].context);
  assert.deepEqual(record.navigation, partial.records[0].navigation);
  assert.deepEqual(record.start, { day: 2, hour: 1 });
  assert.equal(record.status, "completed");
  assert.equal(record.travel.status, "completed");
  assert.equal(record.phases.travel, "completed");
  assert.equal(record.travel.committedHours, 10);
  assert.equal(record.travel.remainingHours, 0);
  assert.equal(record.completedAt, 4000);
  assert.deepEqual(record.travel.segments, [{ day: 2, hours: 7 }, { day: 3, hours: 3 }]);
});

test("zero pending without actual committed hours does not invent completion", () => {
  const record = syncHexRecordProgress(initial(), ledger({ pending: 0, activeHexCardId: null }), "hex-a", 2000).records[0];
  assert.equal(record.status, "inProgress");
  assert.equal(record.travel.committedHours, 0);
  assert.equal(record.completedAt, null);
});

test("clock reconciliation cannot double-count or reopen a completed record", () => {
  const state = ledger({ pending: 0, activeHexCardId: null,
    hexHourSegments: [{ hexId: "hex-a", day: 2, hours: 10 }],
    clockSyncPending: { before: 80000, seconds: 36000, day: 2, travelHour: 11 }
  });
  const done = freeze(syncHexRecordProgress(initial(), freeze(state), "hex-a", 2000));
  const reconciled = syncHexRecordProgress(done, { ...state, clockSyncPending: null }, "hex-a", 9000);
  assert.deepEqual(reconciled, done);
  assert.equal(reconciled.records[0].completedAt, 2000);
  assert.equal(Object.hasOwn(reconciled.records[0], "completedWorldTime"), false);
});

test("another active sequence does not replace this sequence's pending hours", () => {
  const records = freeze(initial());
  const updated = syncHexRecordProgress(records, ledger({ activeHexCardId: "hex-b", pending: 2 }), "hex-a", 2000);
  assert.deepEqual(updated, records);
});

test("manual correction interrupts the active record and preserves original evidence", () => {
  const before = freeze(ledger({ hours: 8, pending: 3, hexHourSegments: [{ hexId: "hex-a", day: 2, hours: 7 }] }));
  const after = freeze(ledger({ day: 4, hours: 2, pending: 8, activeHexCardId: null }));
  const partial = freeze(syncHexRecordProgress(initial(), before, "hex-a", 2000));
  const corrected = markHexRecordLedgerCorrection(partial, "hex-a", { before, after, now: 3000 });
  const record = corrected.records[0];
  assert.equal(record.status, "interrupted");
  assert.equal(record.travel.status, "interrupted");
  assert.equal(record.phases.travel, "interrupted");
  assert.equal(record.interruptedAt, 3000);
  assert.equal(record.completedAt, null);
  assert.equal(record.travel.remainingHours, 3);
  assert.equal(record.travel.committedHours, 7);
  assert.deepEqual(record.navigation, partial.records[0].navigation);
  assert.deepEqual(record.context, partial.records[0].context);
  assert.deepEqual(record.corrections, [{ at: 3000, reason: "manualLedgerCorrection",
    before: { day: 2, hours: 8, pending: 3, hexes: 2, activeHexCardId: "hex-a" },
    after: { day: 4, hours: 2, pending: 8, hexes: 2, activeHexCardId: null }
  }]);
  assert.deepEqual(markHexRecordLedgerCorrection(corrected, "hex-a", { before, after, now: 5000 }), corrected);
  assert.deepEqual(syncHexRecordProgress(corrected, after, "hex-a", 5000), corrected);
  assert.equal(partial.records[0].status, "inProgress");
});

test("legacy correction does not synthesize results and unknown fields survive", () => {
  const records = initial();
  records.extension = { preserved: [1, 2] };
  records.records[0].extension = { result: "future" };
  records.records[0].travel.extension = "keep";
  records.records[0].phases.extension = "queued";
  const source = freeze(records);
  const unchanged = markHexRecordLedgerCorrection(source, "legacy", { before: ledger(), after: ledger(), now: 3000 });
  assert.deepEqual(unchanged, source);
  const progressed = syncHexRecordProgress(source, ledger({ pending: 3, hexHourSegments: [{ hexId: "hex-a", day: 2, hours: 7 }] }), "hex-a", 3000);
  assert.deepEqual(progressed.extension, { preserved: [1, 2] });
  assert.deepEqual(progressed.records[0].extension, { result: "future" });
  assert.equal(progressed.records[0].travel.extension, "keep");
  assert.equal(progressed.records[0].phases.extension, "queued");
});

test("all mutations reject unsupported or malformed stores without resetting data", () => {
  const badRecord = initial();
  badRecord.records[0].schema = 2;
  const duplicate = initial();
  duplicate.records.push(clone(duplicate.records[0]));
  const malformedProgress = initial();
  malformedProgress.records[0].travel.committedHours = -1;
  for (const invalid of [[], {}, { schema: 2, records: [] }, { schema: 1, records: {} },
    { schema: 1, records: [null] }, badRecord, duplicate, malformedProgress]) {
    const before = clone(invalid);
    freeze(invalid);
    for (const call of [
      () => cloneHexRecordStore(invalid),
      () => startHexRecord(invalid, context()),
      () => syncHexRecordProgress(invalid, ledger(), "hex-a", 2000),
      () => markHexRecordLedgerCorrection(invalid, "hex-a", { before: ledger(), after: ledger(), now: 2000 })
    ]) assert.throws(call, /Saved hex records/);
    assert.deepEqual(invalid, before);
  }
});

test("invalid new context and invalid matching committed history fail safely", () => {
  for (const replacement of [{ id: "" }, { number: 0 }, { day: 0 }, { hour: -1 },
    { dice: { hours: 0 } }, { party: {} }, { navigation: null }, { now: NaN }])
    assert.throws(() => startHexRecord(null, context(replacement)), /Saved hex records/);
  const store = freeze(initial());
  assert.throws(() => syncHexRecordProgress(store, ledger({ pending: -1 }), "hex-a", 2000), /invalid travel ledger/);
  assert.throws(() => syncHexRecordProgress(store, ledger({
    hexHourSegments: [{ hexId: "hex-a", day: 0, hours: 10 }]
  }), "hex-a", 2000), /invalid committed-hour history/);
  assert.equal(store.records[0].travel.committedHours, 0);
});

test("read-only API returns independent copies and exact runtime diagnostic context", t => {
  const previous = globalThis.game;
  t.after(() => { if (previous === undefined) delete globalThis.game; else globalThis.game = previous; });
  let writes = 0;
  const saved = ledger({ hexRecords: initial(), clockSyncPending: { before: 10, seconds: 3600 } });
  globalThis.game = {
    version: "13.351", system: { id: "dnd5e", version: "5.2.5" },
    modules: new Map([["zft-overland-travel", { version: "0.4.0-dev.87" }]]),
    settings: { get: (namespace, key) => {
      assert.equal(namespace, "zft-overland-travel");
      assert.equal(key, "hexTravelLedger");
      return saved;
    }, set: () => { writes++; throw new Error("Read API attempted a write"); } }
  };
  const current = HexTravelRecords.current();
  const latest = HexTravelRecords.latest();
  const byId = HexTravelRecords.get("hex-a");
  const list = HexTravelRecords.list();
  const report = HexTravelRecords.inspect();
  assert.deepEqual(current, saved.hexRecords.records[0]);
  assert.deepEqual(latest, current);
  assert.deepEqual(byId, current);
  assert.equal(HexTravelRecords.get("unknown"), null);
  assert.equal(report.recordCount, 1);
  assert.equal(report.installedModuleVersion, "0.4.0-dev.87");
  assert.equal(report.foundryVersion, "13.351");
  assert.equal(report.systemId, "dnd5e");
  assert.equal(report.systemVersion, "5.2.5");
  assert.equal(report.legacyActive, false);
  current.context.party[0].name = "Changed";
  latest.navigation.guide.total = -1;
  byId.travel.dice.baseDice[0] = -1;
  list.splice(0);
  report.current.context.assignments.guide = "Actor.changed";
  report.latest.travel.segments.push({ day: 100, hours: 100 });
  report.clockSyncPending.seconds = 0;
  report.ledger.pending = 0;
  assert.equal(saved.hexRecords.records[0].context.party[0].name, "Guide PC");
  assert.equal(saved.hexRecords.records[0].navigation.guide.total, 21);
  assert.deepEqual(saved.hexRecords.records[0].travel.dice.baseDice, [3, 4]);
  assert.equal(saved.hexRecords.records.length, 1);
  assert.equal(saved.hexRecords.records[0].context.assignments.guide, "Actor.guide");
  assert.deepEqual(saved.hexRecords.records[0].travel.segments, []);
  assert.equal(saved.clockSyncPending.seconds, 3600);
  assert.equal(saved.pending, 10);
  assert.equal(writes, 0);
});

test("read API explicitly identifies a legacy active sequence and validates schema", t => {
  const previous = globalThis.game;
  t.after(() => { if (previous === undefined) delete globalThis.game; else globalThis.game = previous; });
  const saved = ledger({ activeHexCardId: "legacy" });
  globalThis.game = { settings: { get: () => saved } };
  assert.equal(HexTravelRecords.current(), null);
  assert.equal(HexTravelRecords.latest(), null);
  assert.deepEqual(HexTravelRecords.list(), []);
  assert.equal(HexTravelRecords.inspect().legacyActive, true);
  assert.equal(Object.hasOwn(saved, "hexRecords"), false);
  saved.hexRecords = { schema: 2, records: [] };
  for (const read of [() => HexTravelRecords.current(), () => HexTravelRecords.latest(),
    () => HexTravelRecords.get("legacy"), () => HexTravelRecords.list(), () => HexTravelRecords.inspect()])
    assert.throws(read, /unsupported or malformed store/);
});
