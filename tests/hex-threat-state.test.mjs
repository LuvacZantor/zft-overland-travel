import test from "node:test";
import assert from "node:assert/strict";
import {
  createThreat, advanceThreat, reduceThreat, resolveThreat, setThreatVisibility, cloneThreats
} from "../src/engines/hex-travel/HexThreatState.js";

test("multiple independent Threats persist with stable identity", () => {
  let threats = createThreat([], {id:"storm",name:"Incoming Supernatural Storm",stage:"emerging",now:100});
  threats = createThreat(threats, {id:"goblins",name:"Goblin Warband Tracking Party",stage:"developing",now:110});
  assert.equal(threats.length,2);
  assert.equal(threats[0].id,"storm");
  assert.equal(threats[1].stage,"developing");
  assert.equal(threats[0].status,"active");
});

test("Threat progression is explicit and never skips stages", () => {
  let threats = createThreat([], {id:"t",name:"Wyvern Territory",stage:"emerging",now:100});
  threats = advanceThreat(threats,"t",{now:200});
  assert.equal(threats[0].stage,"developing");
  threats = advanceThreat(threats,"t",{now:300});
  assert.equal(threats[0].stage,"imminent");
  threats = advanceThreat(threats,"t",{now:400});
  assert.equal(threats[0].stage,"immediate");
  assert.throws(() => advanceThreat(threats,"t",{now:500}), /already Immediate/);
});

test("reducing Emerging resolves it and preserves history", () => {
  let threats = createThreat([], {id:"t",name:"Storm",stage:"developing",now:100});
  threats = reduceThreat(threats,"t",{now:200});
  assert.equal(threats[0].stage,"emerging");
  threats = reduceThreat(threats,"t",{now:300});
  assert.equal(threats[0].status,"resolved");
  assert.equal(threats[0].resolvedAt,300);
  assert.deepEqual(threats[0].history.map(entry=>entry.action),["created","reduced","resolved"]);
});

test("manual resolve does not erase stage or history", () => {
  let threats = createThreat([], {id:"t",name:"Cult Scouts",stage:"imminent",now:100});
  threats = resolveThreat(threats,"t",{now:200,reason:"Party broke pursuit"});
  assert.equal(threats[0].status,"resolved");
  assert.equal(threats[0].stage,"imminent");
  assert.equal(threats[0].history.at(-1).reason,"Party broke pursuit");
});

test("player visibility changes are explicit state with history", () => {
  let threats = createThreat([], {id:"t",name:"Hidden Hunter",visibility:"hidden",now:100});
  threats = setThreatVisibility(threats,"t","partial",{now:200});
  threats = setThreatVisibility(threats,"t","full",{now:300});
  assert.equal(threats[0].visibility,"full");
  assert.deepEqual(threats[0].history.slice(-2).map(entry=>entry.to),["partial","full"]);
});

test("cloneThreats rejects duplicate IDs instead of silently merging", () => {
  const one = createThreat([], {id:"t",name:"A",now:100})[0];
  assert.throws(() => cloneThreats([one,structuredClone(one)]), /duplicate Threat ID/);
});
