import test from "node:test";
import assert from "node:assert/strict";
import {
  ROUTE_OBSCURED,
  buildPrototypeComplicationRecord,
  ensurePrototypeComplicationRecord,
  resolveComplicationForHex,
  cloneComplicationRecords
} from "../src/engines/complication/ExpeditionComplication.js";
import fs from "node:fs";

const fixture = ({ eventType = "complication", reconGrade = "strong" } = {}) => ({
  schema: 1,
  id: "hex-a",
  number: 1,
  event: { type: eventType },
  eventResolution: { engine: "complication", severity: eventType === "majorComplication" ? "major" : "standard", status: "pending" },
  roles: { reconnaissance: { grade: reconGrade } }
});

test("dev.112 prototype record keeps the locked minimal identity shell", () => {
  const record = buildPrototypeComplicationRecord(fixture(), { detailRoll: 1 });
  assert.equal(record.id, "hex-a:complication");
  assert.equal(record.sourceHexRecordId, "hex-a");
  assert.equal(record.eventType, "complication");
  assert.equal(record.severity, "standard");
  assert.deepEqual(record.category, { id: "navigation", label: "Navigation" });
  assert.deepEqual(record.primaryType, { id: "route-obscured", label: "Route Obscured", roll: 1 });
  assert.equal(record.detail.roll, 1);
  assert.equal(record.detail.text, ROUTE_OBSCURED.details[0]);
  assert.equal(record.reconnaissanceState, "full");
  assert.equal(record.status, "pending");
});

test("dev.112 Major Complication and Reconnaissance mapping are deterministic", () => {
  assert.equal(buildPrototypeComplicationRecord(fixture({ eventType: "majorComplication", reconGrade: "partial" }), { detailRoll: 8 }).severity, "major");
  assert.equal(buildPrototypeComplicationRecord(fixture({ reconGrade: "partial" }), { detailRoll: 2 }).reconnaissanceState, "partial");
  assert.equal(buildPrototypeComplicationRecord(fixture({ reconGrade: "failure" }), { detailRoll: 3 }).reconnaissanceState, "none");
  assert.equal(buildPrototypeComplicationRecord(fixture({ reconGrade: "unassigned" }), { detailRoll: 4 }).reconnaissanceState, "none");
});

test("dev.112 generation is idempotent and never rerolls an existing Complication", () => {
  const store = { schema: 1, records: [] };
  const first = ensurePrototypeComplicationRecord(store, fixture(), { detailRoll: 3 });
  const second = ensurePrototypeComplicationRecord(first.store, fixture(), { detailRoll: 7 });
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.record.detail.roll, 3);
  assert.equal(second.store.complications.length, 1);
});

test("dev.112 lifecycle has only pending and resolved persisted states", () => {
  const created = ensurePrototypeComplicationRecord({ schema: 1, records: [] }, fixture(), { detailRoll: 5 });
  const resolved = resolveComplicationForHex(created.store, "hex-a");
  assert.equal(resolved.changed, true);
  assert.equal(resolved.record.status, "resolved");
  const repeated = resolveComplicationForHex(resolved.store, "hex-a");
  assert.equal(repeated.changed, false);
  assert.equal(repeated.record.status, "resolved");
  assert.equal(cloneComplicationRecords(repeated.store.complications).length, 1);
});

test("dev.112 source wires a deliberately narrow Complication tab workflow", () => {
  const consoleSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
  const runtimeSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexExpeditionRuntime.js", import.meta.url), "utf8");
  const librarySource = fs.readFileSync(new URL("../src/engines/complication/ComplicationLibrary.js", import.meta.url), "utf8");
  assert.match(consoleSource, /ensureHexComplication/);
  assert.match(consoleSource, /selectLogTab\("complications"\)/);
  assert.match(consoleSource, /data-hex-action="complication-resolve"/);
  assert.match(consoleSource, /data-hex-action="complication-details"/);
  assert.match(runtimeSource, /new Roll\("1d8"\)/);
  assert.match(runtimeSource, /ComplicationLibrary\.ensureNavigation/);
  assert.match(librarySource, /NAVIGATION_COMPLICATIONS/);
  assert.doesNotMatch(consoleSource, /Persistent Threats/);
});
