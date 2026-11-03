import test from "node:test";
import assert from "node:assert/strict";

import { launchHexTravel } from "../src/engines/hex-travel/HexTravelEngine.js";
import { saveHexRolePhase, saveHexExpeditionOutcome } from "../src/engines/hex-travel/HexTravelRecords.js";
import { buildHexExpeditionOutcome } from "../src/engines/hex-travel/HexExpeditionOutcome.js";
import {
  HexTravelConsole,
  clearHexTravelExpeditionLog,
  hexTravelGeneration
} from "../src/engines/hex-travel/HexTravelConsole.js";

const MODULE_ID = "zft-overland-travel";
const LEDGER = "hexTravelLedger";
const clone = value => value === undefined ? undefined : structuredClone(value);
const defaultLedger = () => ({ day: 1, hours: 0, pending: 0, hexes: 0 });
const SETUP = {
  pace: "normal", navRoller: "auto", vanguardRoller: "auto",
  dcMode: "custom", customDC: "15", terrainId: "forest",
  regionDanger: "wild", terrainDescription: "Old forest road"
};
const USE_ROLLS = { guide: "roll", vanguard: "roll" };

/**
 * Run the production workflow against deterministic Foundry document/setting,
 * Midi socket, dialog, and Roll ports. No production function is replaced.
 * The port records each authoritative ledger write, allowing checks at the
 * persistence boundaries as well as after the operation has completed.
 */
function fixture({ ledger = defaultLedger(), clockSync = false, isGM = true } = {}) {
  const values = new Map([
    [LEDGER, clone(ledger)],
    ["hexTravelAttendance", { excludedActorUuids: [] }],
    ["hexTravelAdvanceWorldTime", clockSync],
    ["hexTravelCards", { cards: [] }],
    ["hexTravelCalendar", { datesByDay: {} }],
    ["hexTravelLogVisibility", { epoch: 0, recordedDays: [] }]
  ]);
  const state = {
    values, writes: [], prompts: [], answers: [], socketCalls: [],
    skillTotals: [], saveTotals: [], travelDice: [], rollCalls: [],
    phases: [], stages: [], removed: [], completions: [], autoWorkflowCalls: [],
    notifications: [], clockCalls: [], clockFailure: null, nextId: 0
  };
  const actors = ["Guide", "Vanguard", "Scout"].map((name, index) => ({
    id: `actor${index + 1}`, uuid: `Actor.actor${index + 1}`, name,
    type: "character", img: `portraits/${name.toLowerCase()}.webp`,
    system: { attributes: { exhaustion: 0 }, skills: {} },
    testUserPermission: () => true,
    async update(update) {
      if (Object.hasOwn(update, "system.attributes.exhaustion"))
        this.system.attributes.exhaustion = update["system.attributes.exhaustion"];
      return this;
    }
  }));
  const gm = { id: "gm", name: "GM", isGM, active: true };
  const players = actors.map((actor, i) => ({
    id: `player${i + 1}`, name: `Player ${i + 1}`, isGM: false,
    active: true, character: actor
  }));
  const roles = {
    navigatorUuid: actors[0].uuid,
    assignments: { guide: actors[0].uuid, vanguard: actors[1].uuid, scout: actors[2].uuid }
  };
  values.set("hexTravelRolePreferences", clone(roles));
  values.set("hexTravelIdentity", { name: "Test Expedition", region: "Old Forest", world: "Test World" });
  state.actors = actors;
  state.roles = roles;
  const registered = new Map([[`${MODULE_ID}.${LEDGER}`, {}]]);
  globalThis.game = {
    user: gm, system: { id: "dnd5e", version: "5.2.5" },
    users: { players, get: id => id === "gm" ? gm : players.find(p => p.id === id) },
    actors: new Map(actors.map(actor => [actor.id, actor])),
    messages: new Map(),
    modules: new Map([["midi-qol", { active: true, version: "13.0.44" }]]),
    settings: {
      settings: registered,
      register(moduleId, key, config) {
        registered.set(`${moduleId}.${key}`, config);
        if (!values.has(key)) values.set(key, clone(config.default));
      },
      get(moduleId, key) {
        assert.equal(moduleId, MODULE_ID);
        return clone(values.get(key));
      },
      async set(moduleId, key, value) {
        assert.equal(moduleId, MODULE_ID);
        state.writes.push({ key, value: clone(value) });
        values.set(key, clone(value));
        return clone(value);
      }
    },
    time: {
      worldTime: 36000, components: { hour: 10, minute: 0 },
      async advance(seconds) {
        state.clockCalls.push(seconds);
        if (state.clockFailure === "before") throw new Error("Simulated clock transport failure");
        this.worldTime += seconds;
        if (state.clockFailure === "after") throw new Error("Simulated response loss after clock advance");
      }
    }
  };
  globalThis.foundry = {
    utils: {
      deepClone: clone,
      randomID: () => `test-hex-${++state.nextId}`,
      isNewerVersion: () => true,
      getProperty: (object, path) => path.split(".").reduce((value, key) => value?.[key], object)
    },
    applications: { api: { DialogV2: { wait() { throw new Error("Unexpected native dialog fallback"); } } } }
  };
  globalThis.ui = { notifications: Object.fromEntries(["warn", "error", "info"].map(level => [level, message => {
    state.notifications.push({ level, message });
  }])) };
  globalThis.CONFIG = { DND5E: { skills: { sur: { label: "Survival" }, ath: { label: "Athletics" } } } };
  globalThis.Hooks = { on: () => 1, off: () => {} };
  globalThis.MidiQOL = { socket: () => ({
    async executeAsUser(operation, userId, args) {
      state.socketCalls.push({ operation, userId, args: clone(args) });
      const queue = args.saveDetails.rollType === "save" ? state.saveTotals : state.skillTotals;
      return { total: queue.length ? queue.shift() : 18 };
    }
  }) };
  globalThis.Roll = class {
    constructor(formula) { this.formula = formula; }
    async evaluate() {
      state.rollCalls.push(this.formula);
      const next = state.travelDice.shift();
      assert.ok(next, `No deterministic travel dice configured for ${this.formula}`);
      this.dice = [next.base, next.delay ?? []].map(faces => ({
        results: faces.map(result => ({ result, active: true }))
      }));
      return this;
    }
  };
  globalThis.ZFTHexTravelConsole = {
    generation: hexTravelGeneration, logEpoch: () => values.get("hexTravelLogVisibility")?.epoch ?? 0,
    identity: () => clone(values.get("hexTravelIdentity")), rolePreferences: () => clone(roles),
    async prompt(options) {
      const title = options.window?.title ?? "";
      state.prompts.push(title);
      assert.ok(state.answers.length, `Unexpected prompt: ${title}`);
      const next = state.answers.shift();
      assert.match(title, next.title, `Prompt order: ${title}`);
      return typeof next.answer === "function" ? next.answer(options) : clone(next.answer);
    },
    async publish(ledger, phase) { state.phases.push({ ledger: clone(ledger), phase }); },
    async stage(id, html, stage, epoch, metadata) { state.stages.push({ id, stage, metadata: clone(metadata) }); },
    async removeStage(id) { state.removed.push(id); },
    async hexStarted() {},
    async resumeWorkflow(recordId) { state.autoWorkflowCalls.push(recordId); return null; },
    hexCompleted(value) { state.completions.push(clone(value)); },
    async preserveDayDate() {}, cue() {},
    registerPendingRoll() { return "pending-token"; }, unregisterPendingRoll() {}
  };
  globalThis.__ZFT_HEX_TRAVEL_WORKFLOW_ACTIVE__ = null;
  delete globalThis.CALENDARIA;
  delete globalThis.SimpleCalendar;
  state.ledger = () => clone(values.get(LEDGER));
  state.records = () => state.ledger().hexRecords?.records ?? [];
  state.ledgerWrites = () => state.writes.filter(write => write.key === LEDGER);
  state.skillCalls = () => state.socketCalls.filter(call => call.args.saveDetails.rollType === "skill");
  state.saveCalls = () => state.socketCalls.filter(call => call.args.saveDetails.rollType === "save");
  state.answer = (title, answer) => state.answers.push({ title, answer });
  state.expectClean = () => {
    assert.deepEqual(state.answers, [], "All expected dialogs were consumed");
    assert.deepEqual(state.notifications.filter(item => item.level === "error"), [], "No unexpected runtime error");
  };
  return state;
}

async function startHex(f, { base = [2, 2], delay = [] } = {}) {
  f.answer(/^Hex Travel$/, SETUP);
  f.answer(/Navigation Ruling$/, USE_ROLLS);
  f.travelDice.push({ base, delay });
  await launchHexTravel({ action: "travel" });
}

function readyStagedHex(f, { eventRoll = 13 } = {}) {
  const ledger = f.ledger();
  const record = ledger.hexRecords.records.find(entry => entry.id === ledger.activeHexCardId);
  assert.ok(record, "Expected an active staged shared record");
  const dc = Number(record.context.difficulty.dc);
  let store = saveHexRolePhase(ledger.hexRecords, record.id, "reconnaissance", {
    schema:1,phase:"reconnaissance",name:"Reconnaissance",dc,resolvedAt:Date.now(),grade:"partial",results:[
      {role:"scout",roleName:"Scout",skill:"ste",ability:"dex",status:"checked",total:dc+1,margin:1,rolledSuccess:true,ruling:"roll",success:true},
      {role:"tracker",roleName:"Tracker",skill:"inv",ability:"int",status:"unassigned",total:null,margin:null,rolledSuccess:null,ruling:null,success:null}
    ]
  });
  store = saveHexRolePhase(store, record.id, "support", {
    schema:1,phase:"support",name:"Expedition Support",dc,resolvedAt:Date.now()+1,grade:"unassigned",results:[
      {role:"forager",roleName:"Forager",skill:"sur",ability:"wis",status:"unassigned",total:null,margin:null,rolledSuccess:null,ruling:null,success:null},
      {role:"coordinator",roleName:"Coordinator",skill:"per",ability:"cha",status:"unassigned",total:null,margin:null,rolledSuccess:null,ruling:null,success:null}
    ]
  });
  const updatedRecord = store.records.find(entry => entry.id === record.id);
  const outcome = buildHexExpeditionOutcome(updatedRecord,{momentum:store.momentum ?? "neutral",eventRoll,now:Date.now()+2});
  store = saveHexExpeditionOutcome(store,record.id,outcome);
  assert.equal(store.records.find(entry=>entry.id===record.id).eventResolution.status,"resolved", "Test helper expects Quiet Travel");
  f.values.set(LEDGER,{...ledger,hexRecords:store});
  return store.records.find(entry=>entry.id===record.id);
}

function assertRecordProgress(f, { count = 1, committed, remaining, status }) {
  const records = f.records();
  assert.equal(records.length, count);
  const record = records.at(-1);
  assert.equal(record.travel.committedHours, committed);
  assert.equal(record.travel.remainingHours, remaining);
  assert.equal(record.status, status);
  assert.equal(record.travel.status, status);
  assert.equal(record.phases.travel, status);
  return record;
}

function consoleActionPort(f, action, fields) {
  const button = { dataset: { hexAction: action } };
  const editor = {
    hidden: false, replaceChildren() {},
    querySelector(selector) {
      const key = /name=['"]([^'"]+)['"]/.exec(selector)?.[1];
      return key && Object.hasOwn(fields, key) ? { value: String(fields[key]) } : null;
    }
  };
  const port = {
    element: { contains: element => element === button },
    workflowElement: { querySelector: () => editor },
    busy: false, travelActive: false, activeTravelTicket: 0,
    handleRollRecovery: () => false, dismissPrompt() {}, refresh() {}
  };
  const event = { target: { closest: selector => selector === "button[data-hex-action]" ? button : null } };
  return () => HexTravelConsole.click.call(port, event);
}

test("canceling initial setup never writes ledger, records, travel dice, or clock", async () => {
  const f = fixture();
  const before = f.ledger();
  f.answer(/^Hex Travel$/, null);
  await launchHexTravel({ action: "travel" });
  assert.deepEqual(f.ledger(), before);
  assert.equal(f.ledgerWrites().length, 0);
  assert.equal(f.socketCalls.length, 0);
  assert.equal(f.rollCalls.length, 0);
  assert.equal(f.records().length, 0);
  assert.deepEqual(f.clockCalls, []);
  f.expectClean();
});

test("canceling Navigation Ruling after native checks creates no authoritative record", async () => {
  const f = fixture();
  const before = f.ledger();
  f.answer(/^Hex Travel$/, SETUP);
  f.answer(/Navigation Ruling$/, null);
  await launchHexTravel({ action: "travel" });
  assert.equal(f.skillCalls().length, 2);
  assert.equal(f.rollCalls.length, 0);
  assert.deepEqual(f.ledger(), before);
  assert.equal(f.ledgerWrites().length, 0);
  assert.equal(f.records().length, 0);
  assert.equal(f.removed.length, 1);
  f.expectClean();
});

test("new hex record is persisted after dice and staged before any travel hours commit", async () => {
  const f = fixture();
  await startHex(f, { base: [3, 3] });
  f.expectClean();
  const record = assertRecordProgress(f, { committed: 0, remaining: 6, status: "inProgress" });
  assert.equal(f.ledger().hours, 0);
  assert.equal(f.ledger().pending, 6);
  assert.equal(f.ledger().hexes, 0);
  assert.equal(record.id, f.stages[0].id);
  assert.equal(record.travel.rolledHours, 6);
  assert.equal(record.completedAt, null);
  assert.equal(record.phases.navigation, "completed");
  for (const phase of ["reconnaissance", "support", "travelQuality", "momentum", "event", "eventResolution"]) assert.equal(record.phases[phase], "pending");
  assert.equal(f.completions.length, 0);
  assert.ok(f.phases.some(entry => entry.phase === "Expedition stages pending"));
  assert.deepEqual(f.autoWorkflowCalls,[],"A newly staged hex waits for the GM to advance Reconnaissance");
});

test("GM can request a Navigation reroll and preserve the other role ruling", async () => {
  const f = fixture();
  f.skillTotals.push(12, 18, 20);
  f.answer(/^Hex Travel$/, SETUP);
  f.answer(/Navigation Ruling$/, { guide: "reroll", vanguard: "failure" });
  f.answer(/Navigation Ruling$/, { guide: "roll", vanguard: "failure" });
  f.travelDice.push({ base: [1, 1], delay: [3] });
  await launchHexTravel({ action: "travel" });
  f.expectClean();
  const record = assertRecordProgress(f, { committed: 0, remaining: 5, status: "inProgress" });
  assert.equal(f.skillCalls().length, 3, "Guide and Vanguard roll once, then Guide rerolls once");
  assert.equal(f.prompts.filter(title => /Navigation Ruling$/.test(title)).length, 2);
  assert.equal(record.navigation.guide.total, 20);
  assert.equal(record.navigation.guide.rolledSuccess, true);
  assert.equal(record.navigation.guide.ruling, "roll");
  assert.equal(record.navigation.vanguard.total, 18);
  assert.equal(record.navigation.vanguard.ruling, "failure", "Vanguard GM ruling survives the Guide reroll");
  assert.equal(record.navigation.vanguard.delay, 3);
});

test("GM Navigation overrides and each delay die are frozen before travel progress", async () => {
  const f = fixture();
  f.skillTotals.push(3, 19);
  f.answer(/^Hex Travel$/, SETUP);
  f.answer(/Navigation Ruling$/, { guide: "success", vanguard: "failure" });
  f.travelDice.push({ base: [1, 2], delay: [4] });
  await launchHexTravel({ action: "travel" });
  f.expectClean();
  const record = assertRecordProgress(f, { committed: 0, remaining: 7, status: "inProgress" });
  assert.equal(record.navigation.guide.total, 3);
  assert.equal(record.navigation.guide.success, true);
  assert.equal(record.navigation.guide.ruling, "success");
  assert.equal(record.navigation.vanguard.total, 19);
  assert.equal(record.navigation.vanguard.success, false);
  assert.equal(record.navigation.vanguard.ruling, "failure");
  assert.equal(record.navigation.vanguard.delay, 4);
  assert.equal(record.travel.dice.guideDelay, 0);
  assert.equal(record.travel.dice.vanguardDelay, 4);
  assert.equal(record.travel.rolledHours, 7);
});

test("canceling unfinished-hex confirmation preserves the existing record byte-for-byte", async () => {
  const f = fixture({ ledger: { ...defaultLedger(), hours: 7 } });
  await startHex(f);
  readyStagedHex(f);
  f.expectClean();
  const before = f.ledger();
  const writeCount = f.ledgerWrites().length;
  const skillCount = f.skillCalls().length;
  f.answer(/^(?:Commit Travel for Hex|Continue Hex) 1\?$/, false);
  await launchHexTravel({ action: "travel" });
  assert.deepEqual(f.ledger(), before);
  assert.equal(f.ledgerWrites().length, writeCount);
  assert.equal(f.skillCalls().length, skillCount);
  assert.equal(f.rollCalls.length, 1);
  f.expectClean();
});

test("another GM changing the ledger during Navigation cannot be overwritten by a new record", async t => {
  const capturedErrors = [];
  t.mock.method(console, "error", (...args) => capturedErrors.push(args));
  const f = fixture();
  const otherGmLedger = { ...defaultLedger(), day: 4, hours: 3, hexes: 2, otherModuleMetadata: "preserve" };
  f.answer(/^Hex Travel$/, SETUP);
  f.answer(/Navigation Ruling$/, () => {
    f.values.set(LEDGER, clone(otherGmLedger));
    return USE_ROLLS;
  });
  f.travelDice.push({ base: [2, 2] });
  await launchHexTravel({ action: "travel" });
  assert.deepEqual(f.ledger(), otherGmLedger);
  assert.equal(f.records().length, 0);
  assert.equal(f.ledgerWrites().length, 0);
  assert.equal(f.rollCalls.length, 1);
  assert.ok(capturedErrors.some(args => args.some(arg => /Travel progress changed/.test(String(arg)))));
  assert.equal(f.notifications.filter(n => n.level === "error").length, 1);
  assert.deepEqual(f.answers, []);
});

test("another GM changing an unfinished hex during confirmation prevents stale progress", async () => {
  const f = fixture({ ledger: { ...defaultLedger(), hours: 7 } });
  await startHex(f);
  readyStagedHex(f);
  const otherGmLedger = { ...f.ledger(), day: 2, hours: 0 };
  const writeCount = f.ledgerWrites().length;
  f.answer(/^(?:Commit Travel for Hex|Continue Hex) 1\?$/, () => {
    f.values.set(LEDGER, clone(otherGmLedger));
    return true;
  });
  await launchHexTravel({ action: "travel" });
  assert.deepEqual(f.ledger(), otherGmLedger);
  assert.equal(f.ledgerWrites().length, writeCount);
  assert.equal(f.rollCalls.length, 1);
  assert.ok(f.notifications.some(n => n.level === "warn" && /progress changed/.test(n.message)));
  f.expectClean();
});

test("forced-march pause and next-day completion retain one ID and never reroll Navigation", async () => {
  const f = fixture({ ledger: { ...defaultLedger(), hours: 7 } });
  await startHex(f);
  let record = assertRecordProgress(f, { committed: 0, remaining: 4, status: "inProgress" });
  readyStagedHex(f);
  f.answer(/^(?:Commit Travel for Hex|Continue Hex) 1\?$/, true);
  f.answer(/^Forced March/, "cancel");
  await launchHexTravel({ action: "travel" });
  record = assertRecordProgress(f, { committed: 1, remaining: 3, status: "inProgress" });
  const first = clone(record);
  const id = record.id;
  f.answer(/^(?:Commit Travel for Hex|Continue Hex) 1\?$/, true);
  f.answer(/^Forced March/, "continue");
  f.answer(/Party CON DC 11$/, { action: "apply", decisions: Object.fromEntries(f.actors.map(a => [a.uuid, "accept"])) });
  f.answer(/^Forced March/, "cancel");
  await launchHexTravel({ action: "travel" });
  record = assertRecordProgress(f, { committed: 2, remaining: 2, status: "inProgress" });
  assert.equal(record.id, id);
  assert.equal(f.ledger().hours, 9);
  assert.equal(f.ledger().marchHistory[0].hexId, id);
  // A changed label/attendance preference must not rewrite this hex's snapshot.
  f.values.set("hexTravelIdentity", { name: "Renamed Later", region: "Elsewhere", world: "Other World" });
  f.actors[0].name = "Renamed Guide";
  f.answer(/^Start New Travel Day$/, { choice: "none", hour: "10", minute: "0", ampm: "PM", openRest: false });
  f.answer(/^(?:Commit Travel for Hex|Continue Hex) 1\?$/, true);
  await launchHexTravel({ action: "day" });
  record = assertRecordProgress(f, { committed: 4, remaining: 0, status: "completed" });
  assert.equal(record.id, id);
  assert.equal(f.ledger().day, 2);
  assert.equal(f.ledger().hours, 2);
  assert.equal(f.ledger().hexes, 1);
  assert.deepEqual(record.travel.segments, [{ day: 1, hours: 2 }, { day: 2, hours: 2 }]);
  assert.deepEqual(record.context, first.context);
  assert.deepEqual(record.navigation, first.navigation);
  assert.deepEqual(record.travel.dice, first.travel.dice);
  assert.equal(f.skillCalls().length, 2);
  assert.equal(f.rollCalls.length, 1);
  assert.equal(f.saveCalls().length, f.actors.length);
  f.expectClean();
});

test("paused CON review reuses saved rolls and records no hour until party adjudication", async () => {
  const f = fixture({ ledger: { ...defaultLedger(), hours: 8 } });
  f.answer(/^Hex Travel$/, SETUP);
  f.answer(/Navigation Ruling$/, USE_ROLLS);
  f.travelDice.push({ base: [1, 1] });
  await launchHexTravel({ action: "travel" });
  readyStagedHex(f);
  f.answer(/^(?:Commit Travel for Hex|Continue Hex) 1\?$/, true);
  f.answer(/^Forced March/, "continue");
  f.answer(/Party CON DC 11$/, { action: "pause" });
  await launchHexTravel({ action: "travel" });
  const first = assertRecordProgress(f, { committed: 0, remaining: 2, status: "inProgress" });
  assert.equal(f.saveCalls().length, f.actors.length);
  assert.equal(f.ledger().hours, 8);
  f.answer(/^(?:Commit Travel for Hex|Continue Hex) 1\?$/, true);
  f.answer(/Party CON DC 11$/, { action: "apply", decisions: Object.fromEntries(f.actors.map(a => [a.uuid, "accept"])) });
  f.answer(/^Forced March/, "cancel");
  await launchHexTravel({ action: "travel" });
  const resumed = assertRecordProgress(f, { committed: 1, remaining: 1, status: "inProgress" });
  assert.equal(resumed.id, first.id);
  assert.equal(f.saveCalls().length, f.actors.length, "The paused hour's CON saves were reused");
  assert.equal(f.rollCalls.length, 1);
  assert.equal(f.ledger().marchHistory.length, 1);
  f.expectClean();
});

test("legacy unfinished hex keeps its hours and ID without inventing a shared record", async () => {
  const f = fixture({ ledger: {
    ...defaultLedger(), day: 3, hours: 1, pending: 2,
    activeHexCardId: "legacy-card", hexHourSegments: [{ hexId: "legacy-card", day: 2, hours: 5 }]
  } });
  f.answer(/^(?:Commit Travel for Hex|Continue Hex) 1\?$/, true);
  await launchHexTravel({ action: "travel" });
  assert.equal(f.ledger().hours, 3);
  assert.equal(f.ledger().pending, 0);
  assert.equal(f.ledger().hexes, 1);
  assert.equal(f.records().length, 0);
  assert.equal(f.rollCalls.length, 0);
  assert.equal(f.socketCalls.length, 0);
  assert.equal(f.completions[0].id, "legacy-card");
  f.expectClean();
});

test("clock response loss preserves completed record and reconciliation cannot duplicate its hours", async t => {
  t.mock.method(console, "error", () => {});
  const f = fixture({ clockSync: true });
  f.clockFailure = "after";
  await startHex(f, { base: [2, 3] });
  readyStagedHex(f);
  f.answer(/^(?:Commit Travel for Hex|Continue Hex) 1\?$/, true);
  await launchHexTravel({ action: "travel" });
  const record = assertRecordProgress(f, { committed: 5, remaining: 0, status: "completed" });
  assert.equal(f.ledger().hours, 5);
  assert.equal(f.ledger().clockSyncPending.seconds, 5 * 3600);
  assert.equal(game.time.worldTime, 36000 + 5 * 3600);
  assert.equal(f.notifications.filter(n => n.level === "error").length, 1);
  f.notifications.length = 0;
  f.clockFailure = null;
  f.answer(/^Reconcile Hex Travel Clock$/, "accounted");
  f.answer(/^Hex Travel$/, null);
  await launchHexTravel({ action: "travel" });
  assert.equal(f.ledger().clockSyncPending, null);
  assert.deepEqual(f.records()[0], record);
  assert.equal(f.ledger().hours, 5);
  assert.deepEqual(f.clockCalls, [5 * 3600]);
  assert.equal(f.rollCalls.length, 1);
  f.expectClean();
});

test("canceling new travel day leaves the active record, ledger, and clock unchanged", async () => {
  const f = fixture({ ledger: { ...defaultLedger(), hours: 7 } });
  await startHex(f);
  const before = f.ledger();
  const writeCount = f.ledgerWrites().length;
  f.answer(/^Start New Travel Day$/, null);
  await launchHexTravel({ action: "day" });
  assert.deepEqual(f.ledger(), before);
  assert.equal(f.ledgerWrites().length, writeCount);
  assert.deepEqual(f.clockCalls, []);
  f.expectClean();
});

for (const route of ["legacy dialog", "GM console"]) {
  test(`${route}: manual ledger correction preserves rolled history and detaches the active record`, async () => {
    const f = fixture({ ledger: { ...defaultLedger(), hours: 7 } });
    await startHex(f);
    const before = f.records()[0];
    const correction = { day: 2, hours: 1, pending: 3, hexes: 0 };
    if (route === "legacy dialog") {
      f.answer(/Manage Saved Travel$/, { mode: "save", ...correction });
      await launchHexTravel({ action: "manage" });
    } else await consoleActionPort(f, "manage-save", correction)();
    const record = f.records()[0];
    assert.equal(f.records().length, 1);
    assert.equal(record.id, before.id);
    assert.equal(record.status, "interrupted");
    assert.equal(record.travel.status, "interrupted");
    assert.equal(record.phases.travel, "interrupted");
    assert.equal(f.ledger().activeHexCardId, null);
    assert.deepEqual(record.navigation, before.navigation);
    assert.deepEqual(record.context, before.context);
    assert.deepEqual(record.travel.dice, before.travel.dice);
    assert.deepEqual(record.travel.segments, before.travel.segments);
    assert.equal(record.travel.committedHours, 0);
    assert.equal(record.corrections.at(-1).reason, "manualLedgerCorrection");
    // Resuming the GM's corrected unassociated hours may finish the ledger,
    // but must not reopen or add progress to the old shared hex record.
    const detached = clone(record);
    f.answer(/^(?:Commit Travel for Hex|Continue Hex) 1\?$/, true);
    await launchHexTravel({ action: "travel" });
    assert.deepEqual(f.records()[0], detached);
    assert.equal(f.records().length, 1);
    assert.equal(f.ledger().pending, 0);
    assert.equal(f.ledger().hours, 4);
    assert.equal(f.rollCalls.length, 1);
    f.expectClean();
  });

  test(`${route}: full reset clears shared records together with ledger travel`, async () => {
    const f = fixture();
    await startHex(f, { base: [1, 2], forced: null });
    assert.equal(f.records().length, 1);
    if (route === "legacy dialog") {
      f.answer(/Confirm Full Reset$/, "RESET");
      await launchHexTravel({ action: "reset" });
    } else await consoleActionPort(f, "reset-save", { confirmation: "RESET" })();
    assert.equal(f.records().length, 0);
    assert.equal(f.ledger().day, 1);
    assert.equal(f.ledger().hours, 0);
    assert.equal(f.ledger().pending, 0);
    assert.equal(f.ledger().hexes, 0);
    assert.equal(f.actors[0].system.attributes.exhaustion, 0);
    f.expectClean();
  });
}

test("Clear Expedition Log cannot erase or reconstruct authoritative shared records", async () => {
  const f = fixture();
  await startHex(f, { base: [2, 2], forced: null });
  const before = f.ledger();
  f.values.set("hexTravelCards", { cards: [{ id: before.hexRecords.records[0].id, html: "Visual history" }] });
  await clearHexTravelExpeditionLog();
  assert.deepEqual(f.ledger(), before);
  assert.deepEqual(f.values.get("hexTravelCards"), { cards: [] });
  assert.equal(f.values.get("hexTravelLogVisibility").epoch, 1);
  f.expectClean();
});

test("player cannot launch travel or mutate ledger through GM console correction", async () => {
  const f = fixture({ isGM: false });
  const before = f.ledger();
  await launchHexTravel({ action: "travel" });
  await consoleActionPort(f, "manage-save", { day: 2, hours: 3, pending: 4, hexes: 1 })();
  assert.deepEqual(f.ledger(), before);
  assert.equal(f.ledgerWrites().length, 0);
  assert.equal(f.socketCalls.length, 0);
  assert.equal(f.records().length, 0);
  assert.ok(f.notifications.some(n => n.level === "warn" && /GM/.test(n.message)));
  f.expectClean();
});
