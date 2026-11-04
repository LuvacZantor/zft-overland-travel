import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  NAVIGATION_COMPLICATIONS, RESOURCE_LOSS_ITEMS, buildPrototypeComplicationRecord,
  navigationSeverityPlan, lostTimeHoursForSeverity, lostProgressPercentForSeverity,
  resourceLossPercentForSeverity, hpDamagePercentForSeverity, exhaustionLevelsForSeverity,
  navigationConsequenceEvidence
} from "../src/engines/complication/ExpeditionComplication.js";

const consoleSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const runtimeSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexExpeditionRuntime.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

const hex = { id:"hex-nav", number:2, event:{type:"complication"}, roles:{reconnaissance:{grade:"strong"}} };

test("dev.123 Navigation has eight narrative Complications and eight details each", () => {
  assert.deepEqual(NAVIGATION_COMPLICATIONS.map(x => x.primaryType.label), [
    "Route Obscured", "Path Blocked", "False Trail", "Dangerous Crossing",
    "Forced Detour", "Landmark Problem", "Route Split", "Progress Lost"
  ]);
  assert.equal(NAVIGATION_COMPLICATIONS.length, 8);
  for (const entry of NAVIGATION_COMPLICATIONS) assert.equal(entry.details.length, 8, entry.primaryType.label);
});

test("dev.123 primary and detail d8 results persist the selected Navigation content", () => {
  const record = buildPrototypeComplicationRecord(hex, { primaryRoll:4, detailRoll:6 });
  assert.equal(record.primaryType.label, "Dangerous Crossing");
  assert.equal(record.primaryType.roll, 4);
  assert.equal(record.detail.roll, 6);
  assert.equal(record.detail.text, "Deep mud, bog, marsh, or sucking ground impedes passage");
});

test("dev.123 Navigation allowed-consequence maps match the approved design", () => {
  const by = Object.fromEntries(NAVIGATION_COMPLICATIONS.map(x => [x.primaryType.id, x.allowedConsequences]));
  assert.deepEqual(by["route-obscured"], ["lostTime","lostProgress","threat"]);
  assert.deepEqual(by["path-blocked"], ["lostTime","resourceLoss","hpDamage","exhaustion"]);
  assert.deepEqual(by["false-trail"], ["lostTime","lostProgress","threat"]);
  assert.deepEqual(by["dangerous-crossing"], ["lostTime","resourceLoss","hpDamage","exhaustion","threat"]);
  assert.deepEqual(by["forced-detour"], ["lostTime","lostProgress","threat"]);
  assert.deepEqual(by["landmark-problem"], ["lostTime","lostProgress","threat"]);
  assert.deepEqual(by["route-split"], ["lostTime","lostProgress","threat"]);
  assert.deepEqual(by["progress-lost"], ["lostTime","lostProgress","threat"]);
});

test("dev.123 consequence severity and deterministic tables match owner-approved baselines", () => {
  assert.deepEqual([0,1,2,3,4].map(lostTimeHoursForSeverity), [0,1,2,4,8]);
  assert.deepEqual([0,1,2,3,4].map(lostProgressPercentForSeverity), [0,10,25,50,100]);
  assert.deepEqual([0,1,2,3,4].map(resourceLossPercentForSeverity), [0,10,25,50,100]);
  assert.deepEqual([0,1,2,3,4].map(hpDamagePercentForSeverity), [0,10,20,35,50]);
  assert.deepEqual([0,1,2,3,4].map(exhaustionLevelsForSeverity), [0,1,2,3,4]);
  assert.deepEqual(navigationSeverityPlan({outcome:"majorFailure",severity:"major",supportUsed:true}), {originalSeverity:4,finalSeverity:3,supportUsed:true});
});

test("dev.123 Resource Loss is closed to the six approved Resource Items", () => {
  assert.deepEqual(RESOURCE_LOSS_ITEMS.map(x => x.label), [
    "Rations", "Water", "Healer's Kit Uses", "Healing Potions", "Ammunition", "Light / Fuel"
  ]);
  const evidence = navigationConsequenceEvidence("resourceLoss", 2, {resourceId:"rations",currentUnits:12,targetItemUuid:"Actor.a.Item.r"});
  assert.equal(evidence.percent, 25);
  assert.equal(evidence.unitsLost, 3);
});

test("dev.123 Character Harm evidence is deterministic", () => {
  const hp = navigationConsequenceEvidence("hpDamage", 3, {damageType:"fire",targets:[{actorUuid:"Actor.a",actorName:"A",maxHp:47}]});
  assert.equal(hp.percent, 35);
  assert.equal(hp.targets[0].damage, 17);
  const exhaustion = navigationConsequenceEvidence("exhaustion", 4, {targets:[{actorUuid:"Actor.a",actorName:"A"}]});
  assert.equal(exhaustion.levels, 4);
});

test("dev.123+ consequence UI is GM-selected, Support is compact opt-in, and consequence dice are gone", () => {
  assert.match(consoleSource, /chooseComplicationAdjudication/);
  assert.match(consoleSource, /title: "Resolve Complication"/);
  assert.match(consoleSource, /Consequence Severity/);
  assert.match(consoleSource, /name="consequenceType"/);
  assert.match(consoleSource, /name="resourceId"/);
  assert.match(consoleSource, /name="resourceTarget"/);
  assert.match(consoleSource, /name="damageType"/);
  assert.match(consoleSource, /zft-complication-support-choice/);
  assert.doesNotMatch(consoleSource, /chooseConsequenceDiceControl/);
  assert.doesNotMatch(consoleSource, /Roll Delay/);
  assert.match(css, /zft-complication-support-choice > input\[type="checkbox"\][\s\S]*?appearance:none !important/);
  assert.match(css, /inline-size:18px !important/);
});

test("dev.123+ generation keeps separate visible primary/detail d8 rolls", () => {
  assert.match(consoleSource, /chooseNavigationComplicationRollControl/);
  assert.match(consoleSource, /Navigation Complication · Hex/);
  assert.match(consoleSource, /Detail · Hex/);
  assert.match(consoleSource, /rollControlledDice\(\{ count:1, faces:8/);
  assert.match(runtimeSource, /ComplicationLibrary\.ensureNavigation/);
});

test("dev.123 runtime applies coded consequences without advancing the world clock", () => {
  assert.match(runtimeSource, /appliedConsequence\.type === "lostTime"/);
  assert.match(runtimeSource, /appliedConsequence\.type === "lostProgress"/);
  assert.match(runtimeSource, /applyResourceLoss/);
  assert.match(runtimeSource, /applyHpDamage/);
  assert.match(runtimeSource, /applyExhaustion/);
  assert.match(runtimeSource, /addPlannedTravelHours/);
  assert.doesNotMatch(runtimeSource, /advanceWorldTime/);
});
