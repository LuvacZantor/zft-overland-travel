import test from "node:test";
import assert from "node:assert/strict";
import {
  startHexRecord, saveHexRolePhase, saveHexExpeditionOutcome,
  saveHexEventManualResolution, hexRecordReadyForTravel
} from "../src/engines/hex-travel/HexTravelRecords.js";
import { buildHexExpeditionOutcome } from "../src/engines/hex-travel/HexExpeditionOutcome.js";

function start() {
  let store = startHexRecord(undefined, {
    id:"hex-a",number:1,day:1,hour:0,
    identity:{name:"Overland Expedition",region:"Ironrot",world:"Eberron"},
    difficulty:{mode:"custom",dc:15,terrainId:null,regionDanger:null},
    pace:{id:"normal",name:"Normal",multiplier:1},
    party:[
      {actorUuid:"Actor.guide",name:"Guide"},{actorUuid:"Actor.vanguard",name:"Vanguard"},
      {actorUuid:"Actor.scout",name:"Scout"},{actorUuid:"Actor.tracker",name:"Tracker"},
      {actorUuid:"Actor.forager",name:"Forager"},{actorUuid:"Actor.coordinator",name:"Coordinator"}
    ],
    assignments:{guide:"Actor.guide",vanguard:"Actor.vanguard",scout:"Actor.scout",tracker:"Actor.tracker",forager:"Actor.forager",coordinator:"Actor.coordinator"},
    navigation:{dc:15,guide:{actorUuid:"Actor.guide",actorName:"Guide",total:17,ruling:"roll",success:true},vanguard:{actorUuid:"Actor.vanguard",actorName:"Vanguard",total:16,ruling:"roll",success:true},grade:"strong",totalHours:6},
    dice:{hours:6,baseDice:[3,3],delayDice:[]},now:100
  });
  store = saveHexRolePhase(store,"hex-a","reconnaissance",{
    schema:1,phase:"reconnaissance",name:"Reconnaissance",dc:15,resolvedAt:200,grade:"partial",results:[
      {role:"scout",roleName:"Scout",skill:"ste",ability:"dex",status:"checked",total:16,margin:1,rolledSuccess:true,ruling:"roll",success:true},
      {role:"tracker",roleName:"Tracker",skill:"inv",ability:"int",status:"checked",total:14,margin:-1,rolledSuccess:false,ruling:"roll",success:false}
    ]
  });
  store = saveHexRolePhase(store,"hex-a","support",{
    schema:1,phase:"support",name:"Expedition Support",dc:15,resolvedAt:300,grade:"strong",results:[
      {role:"forager",roleName:"Forager",skill:"sur",ability:"wis",status:"checked",total:18,margin:3,rolledSuccess:true,ruling:"roll",success:true},
      {role:"coordinator",roleName:"Coordinator",skill:"per",ability:"cha",status:"checked",total:15,margin:0,rolledSuccess:true,ruling:"roll",success:true}
    ]
  });
  return store;
}

test("dev.89 new records stage later Expedition phases before travel commitment", () => {
  const raw = startHexRecord(undefined, {
    id:"hex-a",number:1,day:1,hour:0,identity:{},difficulty:{dc:15},pace:"normal",party:[],assignments:{},
    navigation:{dc:15},dice:{hours:4},now:100
  }).records[0];
  assert.equal(raw.phases.reconnaissance,"pending");
  assert.equal(raw.phases.support,"pending");
  assert.equal(raw.phases.travelQuality,"pending");
  assert.equal(raw.phases.momentum,"pending");
  assert.equal(raw.phases.event,"pending");
  assert.equal(raw.phases.eventResolution,"pending");
  assert.equal(hexRecordReadyForTravel(raw),false);
});

test("saving outcome updates only staged Expedition state and persistent Momentum", () => {
  const store = start();
  const beforeTravel = structuredClone(store.records[0].travel);
  const outcome = buildHexExpeditionOutcome(store.records[0],{momentum:"neutral",eventRoll:13,now:400}); // +1 -> Quiet 14
  const next = saveHexExpeditionOutcome(store,"hex-a",outcome);
  const record = next.records[0];
  assert.equal(next.momentum,"prepared");
  assert.equal(record.phases.travelQuality,"completed");
  assert.equal(record.phases.momentum,"completed");
  assert.equal(record.phases.event,"completed");
  assert.equal(record.phases.eventResolution,"resolved");
  assert.equal(record.event.type,"quietTravel");
  assert.deepEqual(record.travel,beforeTravel);
  assert.equal(hexRecordReadyForTravel(record),true);
});

test("pending downstream Event requires explicit manual resolution before travel unlocks", () => {
  const store = start();
  const outcome = buildHexExpeditionOutcome(store.records[0],{momentum:"neutral",eventRoll:18,now:400}); // Opportunity
  const staged = saveHexExpeditionOutcome(store,"hex-a",outcome);
  assert.equal(staged.records[0].eventResolution.status,"pending");
  assert.equal(hexRecordReadyForTravel(staged.records[0]),false);
  const resolved = saveHexEventManualResolution(staged,"hex-a",{notes:"Party investigated the site manually.",now:500});
  assert.equal(resolved.records[0].eventResolution.status,"manual");
  assert.equal(resolved.records[0].eventResolution.notes,"Party investigated the site manually.");
  assert.equal(hexRecordReadyForTravel(resolved.records[0]),true);
});

test("malformed saved Momentum fails closed instead of silently resetting to Neutral", () => {
  const store = start();
  store.momentum = "broken";
  const outcome = buildHexExpeditionOutcome(store.records[0],{momentum:"neutral",eventRoll:13,now:400});
  assert.throws(() => saveHexExpeditionOutcome(store,"hex-a",outcome),/saved Momentum broken is invalid/);
});

test("duplicate Event resolution and stale Momentum cannot overwrite saved evidence", () => {
  const store = start();
  const outcome = buildHexExpeditionOutcome(store.records[0],{momentum:"neutral",eventRoll:13,now:400});
  const saved = saveHexExpeditionOutcome(store,"hex-a",outcome);
  assert.throws(() => saveHexExpeditionOutcome(saved,"hex-a",outcome),/already completed/);

  const fresh = start();
  fresh.momentum = "risky";
  assert.throws(() => saveHexExpeditionOutcome(fresh,"hex-a",outcome),/Momentum changed/);
});
