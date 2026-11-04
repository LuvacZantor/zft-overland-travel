import test from "node:test";
import assert from "node:assert/strict";
import { startHexRecord } from "../src/engines/hex-travel/HexTravelRecords.js";
import { resumeHexExpeditionWorkflow } from "../src/engines/hex-travel/HexExpeditionWorkflow.js";
import { rollHexExpeditionEvent } from "../src/engines/hex-travel/HexExpeditionRuntime.js";

const MODULE="zft-overland-travel";
const LEDGER="hexTravelLedger";
const clone=value=>structuredClone(value);

function fixture() {
  const ids=["guide","vanguard","scout","tracker","forager","coordinator"];
  const actors=Object.fromEntries(ids.map(id=>{const a={id,uuid:`Actor.${id}`,name:id[0].toUpperCase()+id.slice(1),type:"character",testUserPermission:()=>true};return[a.uuid,a];}));
  let store=startHexRecord(undefined,{
    id:"hex-1",number:1,day:1,hour:0,identity:{name:"Test",region:"R",world:"W"},difficulty:{dc:15},pace:{id:"normal"},
    party:Object.values(actors).map(a=>({actorUuid:a.uuid,name:a.name})),assignments:Object.fromEntries(ids.map(id=>[id,`Actor.${id}`])),
    navigation:{dc:15,guide:{actorUuid:"Actor.guide",actorName:"Guide",total:18,rolledSuccess:true,ruling:"roll",success:true},vanguard:{actorUuid:"Actor.vanguard",actorName:"Vanguard",total:12,rolledSuccess:false,ruling:"roll",success:false},grade:"partial"},
    dice:{hours:6,baseDice:[3,3],delayDice:[]},now:100
  });
  let ledger={day:1,hours:0,pending:6,hexes:0,activeHexCardId:"hex-1",hexRecords:store};
  const totals={"Actor.scout":14,"Actor.tracker":19,"Actor.forager":16,"Actor.coordinator":8};
  globalThis.CONST={DOCUMENT_OWNERSHIP_LEVELS:{OWNER:3}};
  globalThis.foundry={utils:{isNewerVersion:()=>true}};
  globalThis.CONFIG={DND5E:{skills:{}}};
  globalThis.Hooks={on:()=>1,off:()=>{}};
  globalThis.ui={notifications:{info:()=>{},warn:()=>{},error:()=>{}}};
  globalThis.game={
    user:{id:"gm",name:"GM",active:true,isGM:true},users:{players:[]},system:{id:"dnd5e",version:"5.2.5"},messages:new Map(),
    modules:{get:id=>id==="midi-qol"?{active:true,version:"13.0.44"}:{active:false}},
    actors:{get:id=>actors[`Actor.${id}`]??null},
    settings:{get:(m,k)=>{assert.equal(m,MODULE);assert.equal(k,LEDGER);return clone(ledger);},set:async(m,k,v)=>{assert.equal(m,MODULE);assert.equal(k,LEDGER);ledger=clone(v);return v;}}
  };
  globalThis.fromUuid=async uuid=>actors[uuid]??null;
  globalThis.MidiQOL={socket:()=>({executeAsUser:async(_op,_user,args)=>({total:totals[args.saveDetails.actorUuid]})})};
  globalThis.Roll=class{constructor(){this.total=13;}async evaluate(){return this;}async toMessage(){return null;}};
  return {get:()=>clone(ledger)};
}

test("manual staged workflow resolves one role group per invocation, prepares outcome after Support, and waits for explicit Event roll", async()=>{
  const f=fixture();
  const first=await resumeHexExpeditionWorkflow("hex-1",{
    prompt:async options=>{
      if(options.window.title==="Reconnaissance Ruling")return{scout:"roll",tracker:"roll"};
      throw new Error(`Unexpected prompt ${options.window.title}`);
    },registerPending:()=>"t",unregisterPending:()=>{},onTransient:()=>{}
  });
  let after=f.get();
  let record=after.hexRecords.records[0];
  assert.equal(first.rolePhase,"reconnaissance");
  assert.equal(record.phases.reconnaissance,"completed");
  assert.equal(record.phases.support,"pending");
  assert.equal(record.phases.event,"pending");
  assert.equal(first.readyForTravel,false);
  assert.equal(after.hours,0);
  assert.equal(after.pending,6);

  const second=await resumeHexExpeditionWorkflow("hex-1",{
    prompt:async options=>{
      if(options.window.title==="Expedition Support Ruling")return{forager:"roll",coordinator:"roll"};
      throw new Error(`Unexpected prompt ${options.window.title}`);
    },registerPending:()=>"t",unregisterPending:()=>{},onTransient:()=>{}
  });
  after=f.get();
  record=after.hexRecords.records[0];
  assert.equal(second.rolePhase,"support");
  assert.equal(record.phases.support,"completed");
  assert.equal(record.phases.travelQuality,"completed");
  assert.equal(record.phases.momentum,"completed");
  assert.equal(record.phases.event,"pending");
  assert.equal(record.event,undefined);
  assert.equal(second.stopped,"eventPending");
  assert.equal(second.readyForTravel,false);
  assert.ok(second.preparation?.travelQuality);
  assert.equal(after.hours,0);
  assert.equal(after.pending,6);
  assert.equal(after.hexes,0);
  assert.equal(after.activeHexCardId,"hex-1");

  const rolled=await rollHexExpeditionEvent("hex-1",{eventRoll:13,now:500});
  assert.equal(rolled.event.type,"quietTravel");
  after=f.get();
  record=after.hexRecords.records[0];
  assert.equal(record.phases.event,"completed");
  assert.equal(record.eventResolution.status,"resolved");
});

test("manual staged workflow stops safely when role adjudication is canceled", async()=>{
  const f=fixture();
  const result=await resumeHexExpeditionWorkflow("hex-1",{prompt:async()=>null,registerPending:()=>"t",unregisterPending:()=>{},onTransient:()=>{}});
  const after=f.get();
  const record=after.hexRecords.records[0];
  assert.equal(result.stopped,"rolesCanceled");
  assert.equal(record.phases.reconnaissance,"pending");
  assert.equal(record.phases.event,"pending");
  assert.equal(after.hours,0);
  assert.equal(after.pending,6);
});
