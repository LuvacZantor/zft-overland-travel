import test from "node:test";
import assert from "node:assert/strict";
import { startHexRecord } from "../src/engines/hex-travel/HexTravelRecords.js";
import { resolveHexTravelRolePhases } from "../src/engines/hex-travel/HexTravelRoleResolution.js";

const MODULE = "zft-overland-travel";
const LEDGER = "hexTravelLedger";
const clone = value => structuredClone(value);

function fixture({ legacyPhases = false } = {}) {
  const actors = Object.fromEntries(["guide","vanguard","scout","tracker","forager","coordinator"].map(id => {
    const actor = {
      id, uuid:`Actor.${id}`, name:id[0].toUpperCase()+id.slice(1), type:"character",
      testUserPermission: () => true
    };
    return [actor.uuid, actor];
  }));
  let hexRecords = startHexRecord(undefined, {
    id:"hex-1", number:1, day:1, hour:0,
    identity:{name:"Overland Expedition",region:"Ironrot",world:"Eberron"},
    difficulty:{mode:"custom",dc:15,terrainId:null,regionDanger:null},
    pace:{id:"normal",name:"Normal",multiplier:1},
    party:Object.values(actors).map(actor => ({actorUuid:actor.uuid,name:actor.name})),
    assignments:Object.fromEntries(Object.keys(actors).map(uuid => [uuid.split(".")[1],uuid])),
    navigation:{dc:15,guide:{actorUuid:"Actor.guide",actorName:"Guide",total:18,rolledSuccess:true,ruling:"roll",success:true},vanguard:{actorUuid:"Actor.vanguard",actorName:"Vanguard",total:12,rolledSuccess:false,ruling:"roll",success:false},grade:"partial",totalHours:6},
    dice:{hours:6,baseDice:[3,3],delayDice:[]}, now:100
  });
  if (legacyPhases) {
    hexRecords.records[0].phases.reconnaissance = "notImplemented";
    hexRecords.records[0].phases.support = "notImplemented";
  }
  let saved = { day:1,hours:0,pending:6,hexes:0,activeHexCardId:"hex-1",marker:"keep",hexRecords };
  const writes = [];
  const totals = {"Actor.scout":14,"Actor.tracker":19,"Actor.forager":16,"Actor.coordinator":8};
  const notices = [];
  globalThis.CONST = { DOCUMENT_OWNERSHIP_LEVELS:{ OWNER:3 } };
  globalThis.foundry = { utils:{ isNewerVersion:()=>true } };
  globalThis.CONFIG = { DND5E:{ skills:{} } };
  globalThis.Hooks = { on:()=>1, off:()=>{} };
  globalThis.ui = { notifications:{ info:m=>notices.push(["info",m]), warn:m=>notices.push(["warn",m]), error:m=>notices.push(["error",m]) } };
  globalThis.game = {
    user:{id:"gm",name:"GM",active:true,isGM:true},
    users:{players:[]},
    system:{id:"dnd5e",version:"5.2.5"},
    modules:{get:id=> id === "midi-qol" ? {active:true,version:"13.0.44"} : {active:false}},
    actors:{get:id=>actors[`Actor.${id}`] ?? null},
    settings:{
      get:(module,key)=> { assert.equal(module,MODULE); assert.equal(key,LEDGER); return clone(saved); },
      set:async(module,key,value)=> { assert.equal(module,MODULE); assert.equal(key,LEDGER); saved=clone(value); writes.push(clone(value)); return value; }
    }
  };
  globalThis.fromUuid = async uuid => actors[uuid] ?? null;
  globalThis.MidiQOL = { socket:()=>({executeAsUser:async(_op,_user,args)=>({total:totals[args.saveDetails.actorUuid]})}) };
  return { actors, get:()=>clone(saved), writes, notices };
}

test("runtime resolves Reconnaissance and Support into the same shared record without changing travel ledger", async () => {
  const f = fixture({legacyPhases:true});
  const before = f.get();
  const prompt = async options => {
    if (options.window.title === "Reconnaissance Ruling") return { scout:"success", tracker:"roll" };
    if (options.window.title === "Expedition Support Ruling") return { forager:"roll", coordinator:"failure" };
    throw new Error(`Unexpected prompt ${options.window.title}`);
  };
  const result = await resolveHexTravelRolePhases({prompt,registerPending:()=>"t",unregisterPending:()=>{}});
  assert.deepEqual(result,{recordId:"hex-1",recordNumber:1,saved:2});
  const after = f.get();
  assert.equal(after.day,before.day);
  assert.equal(after.hours,before.hours);
  assert.equal(after.pending,before.pending);
  assert.equal(after.hexes,before.hexes);
  assert.equal(after.activeHexCardId,before.activeHexCardId);
  assert.equal(after.marker,"keep");
  const record = after.hexRecords.records[0];
  assert.equal(record.phases.reconnaissance,"completed");
  assert.equal(record.phases.support,"completed");
  assert.equal(record.phases.travelQuality,"notImplemented");
  assert.equal(record.phases.momentum,"notImplemented");
  assert.equal(record.phases.event,"notImplemented");
  assert.equal(record.roles.reconnaissance.grade,"strong");
  assert.equal(record.roles.reconnaissance.results.find(r=>r.role==="scout").rolledSuccess,false);
  assert.equal(record.roles.reconnaissance.results.find(r=>r.role==="scout").success,true);
  assert.equal(record.roles.support.grade,"partial");
  assert.equal(record.roles.support.results.find(r=>r.role==="coordinator").success,false);
  assert.equal(f.writes.length,2);
});

test("canceling GM review after rolls writes no role phase", async () => {
  const f = fixture();
  const before = f.get();
  const result = await resolveHexTravelRolePhases({prompt:async options => {
    assert.equal(options.window.title,"Reconnaissance Ruling");
    return null;
  },registerPending:()=>"t",unregisterPending:()=>{}});
  assert.deepEqual(result,{recordId:"hex-1",recordNumber:1,saved:0});
  assert.equal(f.writes.length,0);
  assert.deepEqual(f.get(),before);
});
