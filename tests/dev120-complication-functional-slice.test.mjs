import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { d20OutcomeFor, rawD20FacesForOutcome } from "../src/engines/rolls/GmRollControl.js";
import { navigationConsequencePlan, finalizeNavigationConsequence } from "../src/engines/complication/ExpeditionComplication.js";
import { startHexRecord, resetCurrentHexRecord, addPlannedTravelHours } from "../src/engines/hex-travel/HexTravelRecords.js";

const consoleSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");

function baseRecordStore() {
  return startHexRecord(undefined, {
    id:"hex-1", number:1, day:1, hour:0,
    identity:{}, difficulty:{dc:15}, pace:{id:"normal"}, party:[], assignments:{},
    navigation:{dc:15}, dice:{hours:3}, now:1
  });
}

test("dev.120 d20 outcome forcing preserves the normal DC/margin model", () => {
  assert.equal(d20OutcomeFor({raw:7,modifier:6,dc:15}).outcome, "failure");
  const candidates = rawD20FacesForOutcome("failure", {modifier:6,dc:15});
  assert.deepEqual(candidates, [5,6,7,8]);
});

test("dev.120 maps Standard/Major outcomes to consequence tiers and Support mitigation", () => {
  assert.deepEqual(navigationConsequencePlan({outcome:"failure",severity:"standard",supportUsed:false}), {
    originalTier:2, finalTier:2, supportUsed:false, secondarySetback:false, fixedHours:0, dice:{count:1,faces:4}
  });
  const major = navigationConsequencePlan({outcome:"failure",severity:"major",supportUsed:true});
  assert.equal(major.originalTier,3); assert.equal(major.finalTier,2);
  assert.equal(finalizeNavigationConsequence(major,{rolledHours:4}).plannedTimeDelta,4);
});

test("dev.120 planned Complication time extends the same active record without committing time", () => {
  const store = addPlannedTravelHours(baseRecordStore(), "hex-1", 3);
  const record = store.records[0];
  assert.equal(record.travel.rolledHours,6);
  assert.equal(record.travel.remainingHours,6);
  assert.equal(record.travel.committedHours,0);
});

test("dev.120 Reset Current Travel removes only an uncommitted active record", () => {
  const store = baseRecordStore();
  const reset = resetCurrentHexRecord(store,"hex-1");
  assert.equal(reset.records.length,0);
});

test("dev.120 active Travel preview shows pending Navigation, Reconnaissance and Support", () => {
  assert.match(consoleSource, /stagedCurrentId/);
  assert.match(consoleSource, /navigation: navigationCompleted \? "completed" : "pending"/);
  assert.match(consoleSource, /pendingNavRole\("guide","Guide","sur","wis"\)/);
  assert.match(consoleSource, /rolePhaseHtml\(record,"reconnaissance","Reconnaissance"/);
  assert.match(consoleSource, /rolePhaseHtml\(record,"support","Expedition Support"/);
});

test("dev.120+ preserves safe current-travel reset while dev.124 retires Complication recovery rolls", () => {
  assert.match(consoleSource, /data-hex-action="reset-current"/);
  assert.match(consoleSource, /RESET CURRENT/);
  assert.match(consoleSource, /chooseNavigationComplicationRollControl/);
  assert.match(consoleSource, /Force Detail Result/);
  assert.match(consoleSource, /chooseComplicationAdjudication/);
  assert.doesNotMatch(consoleSource, /chooseGmD20RollControl/);
  assert.doesNotMatch(consoleSource, /rollControlledD20/);
  assert.match(consoleSource, /Operational Readiness/);
  assert.match(consoleSource, /resolveHexComplicationOutcome/);
});
