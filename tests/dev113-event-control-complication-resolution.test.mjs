import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  EXPEDITION_EVENT_TYPES,
  rawEventRollsForType
} from "../src/engines/hex-travel/HexExpeditionOutcome.js";
import {
  ensurePrototypeComplicationRecord,
  resolveComplicationForHex
} from "../src/engines/complication/ExpeditionComplication.js";

const fixture = () => ({
  schema:1,id:"hex-a",number:1,event:{type:"complication"},
  eventResolution:{engine:"complication",severity:"standard",status:"pending"},
  roles:{reconnaissance:{grade:"strong"}}
});

test("dev.113 calculates forceable raw d20 faces after Momentum instead of bypassing the Event chart",()=>{
  assert.deepEqual(rawEventRollsForType(EXPEDITION_EVENT_TYPES.MAJOR_COMPLICATION,"prepared"),[1,2,3,4]);
  assert.deepEqual(rawEventRollsForType(EXPEDITION_EVENT_TYPES.COMPLICATION,"prepared"),[5,6,7,8,9]);
  assert.deepEqual(rawEventRollsForType(EXPEDITION_EVENT_TYPES.QUIET_TRAVEL,"prepared"),[10,11,12,13,14]);
  assert.deepEqual(rawEventRollsForType(EXPEDITION_EVENT_TYPES.OPPORTUNITY,"prepared"),[15,16,17,18,19,20]);
  assert.deepEqual(rawEventRollsForType(EXPEDITION_EVENT_TYPES.MAJOR_COMPLICATION,"deteriorating"),[1,2,3,4,5,6,7]);
  assert.deepEqual(rawEventRollsForType(EXPEDITION_EVENT_TYPES.OPPORTUNITY,"deteriorating"),[18,19,20]);
});

test("dev.113 records one adjudicated Complication outcome without adding consequence automation",()=>{
  const created=ensurePrototypeComplicationRecord({schema:1,records:[]},fixture(),{detailRoll:4});
  const resolved=resolveComplicationForHex(created.store,"hex-a",{outcome:"failure",notes:"The party backtracked.",now:500});
  assert.equal(resolved.record.status,"resolved");
  assert.equal(resolved.record.resolution.outcome,"failure");
  assert.equal(resolved.record.resolution.notes,"The party backtracked.");
  assert.equal(resolved.record.resolution.resolvedAt,500);
  assert.equal(resolved.record.resolution.support?.used,false);
  assert.throws(()=>resolveComplicationForHex(created.store,"hex-a",{outcome:"catastrophe",now:500}),/unknown resolution outcome/);
});

test("dev.113 UI exposes normal, exact, and Event-type d20 control plus four Complication outcomes",()=>{
  const source=fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js",import.meta.url),"utf8");
  const runtime=fs.readFileSync(new URL("../src/engines/hex-travel/HexExpeditionRuntime.js",import.meta.url),"utf8");
  assert.match(source,/chooseEventRollControl/);
  assert.match(source,/Force Exact d20 Result/);
  assert.match(source,/Force Event Type/);
  assert.match(source,/recordComplicationResolution/);
  for (const label of ["Strong Success","Success","Failure","Major Failure"]) assert.match(source,new RegExp(label));
  assert.match(runtime,/forceSingleD20Result/);
  assert.match(runtime,/rawEventRollsForType/);
  assert.match(runtime,/complicationOutcome/);
  assert.doesNotMatch(source,/Support mitigation.*button/i);
  assert.doesNotMatch(source,/Threat handoff.*button/i);
});
