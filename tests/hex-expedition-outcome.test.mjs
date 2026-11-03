import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTravelQuality, shiftExpeditionMomentum, resolveExpeditionEvent,
  buildHexExpeditionOutcome, EXPEDITION_EVENT_TYPES
} from "../src/engines/hex-travel/HexExpeditionOutcome.js";

function record() {
  return {
    id:"hex-a", number:1,
    context:{difficulty:{dc:15}},
    phases:{navigation:"completed",reconnaissance:"completed",support:"completed"},
    navigation:{
      dc:15,
      guide:{total:20,ruling:"roll",success:true},
      vanguard:{total:14,ruling:"roll",success:false}
    },
    roles:{
      reconnaissance:{dc:15,results:[
        {role:"scout",roleName:"Scout",status:"checked",total:10,ruling:"success",success:true},
        {role:"tracker",roleName:"Tracker",status:"checked",total:21,ruling:"roll",success:true}
      ]},
      support:{dc:15,results:[
        {role:"forager",roleName:"Forager",status:"checked",total:15,ruling:"roll",success:true},
        {role:"coordinator",roleName:"Coordinator",status:"unassigned",total:null,ruling:null,success:null}
      ]}
    }
  };
}

test("Travel Quality uses margin points and binary GM overrides exactly once", () => {
  const quality = buildTravelQuality(record());
  assert.equal(quality.successPoints, 6); // Guide 2 + Scout override 1 + Tracker 2 + Forager 1
  assert.equal(quality.failurePoints, 1); // Vanguard miss by 1
  assert.equal(quality.quality, "successful");
  const scout = quality.results.find(r => r.role === "scout");
  assert.equal(scout.margin, -5);
  assert.equal(scout.successPoints, 1);
  assert.equal(scout.failurePoints, 0);
  const coordinator = quality.results.find(r => r.role === "coordinator");
  assert.equal(coordinator.successPoints, 0);
  assert.equal(coordinator.failurePoints, 0);
});

test("GM failure override is one failure point even when original roll exceeded DC by 5+", () => {
  const value = record();
  value.roles.support.results[0] = {role:"forager",roleName:"Forager",status:"checked",total:30,ruling:"failure",success:false};
  const quality = buildTravelQuality(value);
  const forager = quality.results.find(r => r.role === "forager");
  assert.equal(forager.margin, 15);
  assert.equal(forager.successPoints, 0);
  assert.equal(forager.failurePoints, 1);
});

test("Momentum shifts once and clamps at track ends", () => {
  assert.deepEqual(shiftExpeditionMomentum("neutral","successful"), {before:"neutral",after:"prepared",shift:1});
  assert.deepEqual(shiftExpeditionMomentum("favored","successful"), {before:"favored",after:"favored",shift:0});
  assert.deepEqual(shiftExpeditionMomentum("deteriorating","poor"), {before:"deteriorating",after:"deteriorating",shift:0});
  assert.deepEqual(shiftExpeditionMomentum("prepared","neutral"), {before:"prepared",after:"prepared",shift:0});
});

test("Event chart uses approved momentum modifiers and final-roll bands", () => {
  assert.equal(resolveExpeditionEvent(1,"deteriorating").final, 1);
  assert.equal(resolveExpeditionEvent(1,"deteriorating").type, EXPEDITION_EVENT_TYPES.MAJOR_COMPLICATION);
  assert.equal(resolveExpeditionEvent(7,"neutral").type, EXPEDITION_EVENT_TYPES.COMPLICATION);
  assert.equal(resolveExpeditionEvent(15,"neutral").type, EXPEDITION_EVENT_TYPES.QUIET_TRAVEL);
  assert.equal(resolveExpeditionEvent(14,"prepared").type, EXPEDITION_EVENT_TYPES.QUIET_TRAVEL);
  assert.equal(resolveExpeditionEvent(15,"prepared").type, EXPEDITION_EVENT_TYPES.OPPORTUNITY);
  assert.equal(resolveExpeditionEvent(19,"favored").final, 20);
  assert.equal(resolveExpeditionEvent(19,"favored").modifier, 2);
});

test("full outcome resolves Quiet Travel as a no-op and leaves other engines pending", () => {
  const quietRecord = record();
  // Successful quality moves Neutral -> Prepared (+1), raw 13 -> final 14 Quiet.
  const quiet = buildHexExpeditionOutcome(quietRecord,{momentum:"neutral",eventRoll:13,now:1000});
  assert.equal(quiet.momentum.after,"prepared");
  assert.equal(quiet.event.type,EXPEDITION_EVENT_TYPES.QUIET_TRAVEL);
  assert.equal(quiet.eventResolution.status,"resolved");
  assert.equal(quiet.eventResolution.outcome,"nothingHappens");

  const opportunity = buildHexExpeditionOutcome(quietRecord,{momentum:"neutral",eventRoll:15,now:1001});
  assert.equal(opportunity.event.type,EXPEDITION_EVENT_TYPES.OPPORTUNITY);
  assert.equal(opportunity.eventResolution.engine,"opportunity");
  assert.equal(opportunity.eventResolution.status,"pending");
});

test("Travel Quality refuses unresolved paired stages", () => {
  const value = record();
  value.phases.support = "pending";
  assert.throws(() => buildTravelQuality(value), /support must be completed/);
});
