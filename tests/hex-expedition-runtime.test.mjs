import test from "node:test";
import assert from "node:assert/strict";
import { startHexRecord, saveHexRolePhase } from "../src/engines/hex-travel/HexTravelRecords.js";
import {
  resolveHexExpeditionOutcome, resolveHexExpeditionPreparation, rollHexExpeditionEvent, resolveHexEventManually,
  createHexThreat, advanceHexThreat, setHexThreatVisibility, resolveHexThreat
} from "../src/engines/hex-travel/HexExpeditionRuntime.js";

const MODULE="zft-overland-travel";
const LEDGER="hexTravelLedger";
const clone=value=>structuredClone(value);

function fixture({isGM=true}={}) {
  let store=startHexRecord(undefined,{
    id:"hex-a",number:1,day:1,hour:0,identity:{name:"Test",region:"R",world:"W"},
    difficulty:{dc:15},pace:{id:"normal"},party:[],assignments:{},
    navigation:{dc:15,guide:{total:18,ruling:"roll",success:true},grade:"unassisted"},
    dice:{hours:4,baseDice:[2,2],delayDice:[]},now:100
  });
  store=saveHexRolePhase(store,"hex-a","reconnaissance",{
    schema:1,phase:"reconnaissance",name:"Reconnaissance",dc:15,resolvedAt:200,grade:"unassigned",results:[
      {role:"scout",roleName:"Scout",status:"unassigned",total:null,ruling:null,success:null},
      {role:"tracker",roleName:"Tracker",status:"unassigned",total:null,ruling:null,success:null}
    ]
  });
  store=saveHexRolePhase(store,"hex-a","support",{
    schema:1,phase:"support",name:"Expedition Support",dc:15,resolvedAt:300,grade:"unassigned",results:[
      {role:"forager",roleName:"Forager",status:"unassigned",total:null,ruling:null,success:null},
      {role:"coordinator",roleName:"Coordinator",status:"unassigned",total:null,ruling:null,success:null}
    ]
  });
  let ledger={day:1,hours:0,pending:4,hexes:0,activeHexCardId:"hex-a",marker:"keep",hexRecords:store};
  const writes=[];
  globalThis.game={
    user:{id:"gm",isGM},
    settings:{get:(m,k)=>{assert.equal(m,MODULE);assert.equal(k,LEDGER);return clone(ledger);},set:async(m,k,v)=>{assert.equal(m,MODULE);assert.equal(k,LEDGER);ledger=clone(v);writes.push(clone(v));return v;}},
    modules:new Map(),messages:new Map()
  };
  globalThis.foundry={utils:{randomID:()=>"threat-id"}};
  return {get:()=>clone(ledger),writes};
}


test("runtime preparation writes Momentum without rolling an Event until GM asks",async()=>{
  const f=fixture();
  const preparation=await resolveHexExpeditionPreparation("hex-a",{now:350});
  let after=f.get();
  assert.equal(preparation.momentum.after,"prepared");
  assert.equal(after.hexRecords.records[0].phases.event,"pending");
  assert.equal(after.hexRecords.records[0].event,undefined);
  assert.equal(after.pending,4);
  const rolled=await rollHexExpeditionEvent("hex-a",{eventRoll:12,now:400});
  after=f.get();
  assert.equal(rolled.event.type,"quietTravel");
  assert.equal(after.hexRecords.records[0].phases.event,"completed");
  assert.equal(after.hexRecords.records[0].eventResolution.status,"resolved");
});
test("runtime outcome writes shared record without changing travel ledger counters",async()=>{
  const f=fixture();
  const result=await resolveHexExpeditionOutcome("hex-a",{eventRoll:12,now:400}); // guide success -> prepared, final 13 Quiet
  const after=f.get();
  assert.equal(result.event.type,"quietTravel");
  assert.equal(after.hours,0);
  assert.equal(after.pending,4);
  assert.equal(after.hexes,0);
  assert.equal(after.activeHexCardId,"hex-a");
  assert.equal(after.marker,"keep");
  assert.equal(after.hexRecords.momentum,"prepared");
  assert.equal(after.hexRecords.records[0].eventResolution.status,"resolved");
  assert.equal(f.writes.length,1);
});

test("manual downstream resolution records notes without inventing ledger mechanics",async()=>{
  const f=fixture();
  await resolveHexExpeditionOutcome("hex-a",{eventRoll:20,now:400});
  assert.equal(f.get().hexRecords.records[0].event.type,"opportunity");
  await resolveHexEventManually("hex-a",{notes:"Resolved at the table.",now:500});
  const after=f.get();
  assert.equal(after.hexRecords.records[0].eventResolution.status,"manual");
  assert.equal(after.hexRecords.records[0].eventResolution.notes,"Resolved at the table.");
  assert.equal(after.pending,4);
  assert.equal(after.hours,0);
});

test("runtime supports multiple persistent Threat mutations in the same store",async()=>{
  const f=fixture();
  await createHexThreat({name:"Wyvern Territory",stage:"emerging",visibility:"hidden",recordId:"hex-a",now:400});
  let threat=f.get().hexRecords.threats[0];
  assert.equal(threat.id,"threat-id");
  assert.equal(threat.createdRecordNumber,1);
  await advanceHexThreat(threat.id,{now:500});
  await setHexThreatVisibility(threat.id,"full",{now:600});
  threat=f.get().hexRecords.threats[0];
  assert.equal(threat.stage,"developing");
  assert.equal(threat.visibility,"full");
  await resolveHexThreat(threat.id,{now:700});
  assert.equal(f.get().hexRecords.threats[0].status,"resolved");
});

test("player cannot mutate staged outcome or Threat state",async()=>{
  fixture({isGM:false});
  await assert.rejects(()=>resolveHexExpeditionOutcome("hex-a",{eventRoll:12,now:400}),/Only a GM/);
  await assert.rejects(()=>createHexThreat({name:"Nope",now:400}),/Only a GM/);
});
