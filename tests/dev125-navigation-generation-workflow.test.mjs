import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildPrototypeComplicationRecord, reviseComplicationGeneration
} from "../src/engines/complication/ExpeditionComplication.js";

const source = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const runtime = fs.readFileSync(new URL("../src/engines/hex-travel/HexExpeditionRuntime.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");
const hex = { id:"hex-125", number:1, event:{type:"complication"}, roles:{reconnaissance:{grade:"partial"}} };

test("dev.125 configures Primary and Detail d8 rolls on one screen", () => {
  assert.match(source, /async chooseNavigationComplicationRollControl/);
  assert.match(source, /1 · Primary Complication/);
  assert.match(source, /2 · Detail/);
  assert.match(source, /name="primaryMode"/);
  assert.match(source, /name="detailMode"/);
  assert.match(source, /Force Complication Result/);
  assert.match(source, /Force Detail Result/);
  assert.doesNotMatch(source, /chooseComplicationPrimaryRollControl/);
  assert.doesNotMatch(source, /chooseComplicationDetailRollControl/);
  assert.match(css, /zft-navigation-roll-stage-grid/);
});

test("dev.125 initial workflow executes both configured visible d8 rolls without a second detail prompt", () => {
  assert.match(source, /const controls = await this\.chooseNavigationComplicationRollControl\(primary\.recordNumber\)/);
  assert.match(source, /control:controls\.primaryControl/);
  assert.match(source, /control:controls\.detailControl/);
  assert.match(source, /Navigation Complication · Hex/);
  assert.match(source, /Detail · Hex/);
});

test("dev.125 GM can reroll both, reroll Detail, or choose replacement results", () => {
  assert.match(source, /data-zft-generation-action="rerollBoth"/);
  assert.match(source, /data-zft-generation-action="rerollDetail"/);
  assert.match(source, /data-zft-generation-action="chooseResults"/);
  assert.match(source, /async reviseComplicationGeneration\(recordId, action\)/);
  assert.match(runtime, /reviseHexComplicationGeneration/);
});

test("dev.125 generation revision preserves original rolls and audit history", () => {
  const record = buildPrototypeComplicationRecord(hex, { primaryRoll:3, detailRoll:5 });
  const store = { schema:1, records:[], complications:[record], threats:[] };
  const revised = reviseComplicationGeneration(store, hex.id, { primaryRoll:5, detailRoll:8, action:"chooseResults", now:1234 });
  assert.deepEqual(revised.record.generation.original, { primaryRoll:3, detailRoll:5 });
  assert.equal(revised.record.generation.revisions.length, 1);
  assert.deepEqual(revised.record.generation.revisions[0].from, { primaryRoll:3, detailRoll:5 });
  assert.deepEqual(revised.record.generation.revisions[0].to, { primaryRoll:5, detailRoll:8 });
  assert.equal(revised.record.primaryType.label, "Forced Detour");
  assert.equal(revised.record.detail.roll, 8);
});

test("dev.125 generation controls remain while later Details layout refinements stay compatible", () => {
  assert.match(source, /<dt>Mitigation<\/dt>/);
  assert.match(source, /zft-complication-guidance-list/);
  assert.match(source, /Examples only\. The GM may adjudicate any plausible approach\./);
  assert.match(css, /zft-complication-generation-control/);
});

test("dev.125 can revise older pending Complication records that predate generation evidence", () => {
  const record = buildPrototypeComplicationRecord(hex, { primaryRoll:1, detailRoll:2 });
  delete record.generation;
  const store = { schema:1, records:[], complications:[record], threats:[] };
  const revised = reviseComplicationGeneration(store, hex.id, { primaryRoll:2, detailRoll:3, action:"rerollBoth", now:5678 });
  assert.deepEqual(revised.record.generation.original, { primaryRoll:1, detailRoll:2 });
  assert.equal(revised.record.primaryType.label, "Path Blocked");
  assert.equal(revised.record.detail.roll, 3);
});
