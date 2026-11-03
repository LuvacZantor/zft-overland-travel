import test from "node:test";
import assert from "node:assert/strict";
import { startHexRecord, saveHexRolePhase, saveHexExpeditionOutcome, saveHexEventManualResolution } from "../src/engines/hex-travel/HexTravelRecords.js";
import { buildHexExpeditionOutcome } from "../src/engines/hex-travel/HexExpeditionOutcome.js";
import { primaryHexTravelAction } from "../src/engines/hex-travel/HexTravelPrimaryAction.js";

function baseStore(){
  return startHexRecord(undefined,{id:"hex-1",number:1,day:1,hour:0,identity:{},difficulty:{dc:15},pace:{id:"normal"},party:[],assignments:{},
    navigation:{dc:15,guide:{total:18,ruling:"roll",success:true},grade:"unassisted"},dice:{hours:4,baseDice:[2,2],delayDice:[]},now:1});
}
function completedRoles(store){
  for(const phase of ["reconnaissance","support"]){
    store=saveHexRolePhase(store,"hex-1",phase,{schema:1,phase,name:phase,dc:15,resolvedAt:2,grade:"unassigned",results:phase==="reconnaissance"?
      [{role:"scout",roleName:"Scout",status:"unassigned",total:null,ruling:null,success:null},{role:"tracker",roleName:"Tracker",status:"unassigned",total:null,ruling:null,success:null}]:
      [{role:"forager",roleName:"Forager",status:"unassigned",total:null,ruling:null,success:null},{role:"coordinator",roleName:"Coordinator",status:"unassigned",total:null,ruling:null,success:null}]});
  }
  return store;
}

test("primary action explicitly advances Reconnaissance before Support",()=>{
  let hexRecords=baseStore();
  let action=primaryHexTravelAction({pending:4,activeHexCardId:"hex-1",hexRecords});
  assert.equal(action.kind,"resolve-role");
  assert.equal(action.phase,"reconnaissance");
  assert.equal(action.label,"Resolve Reconnaissance");
  hexRecords=saveHexRolePhase(hexRecords,"hex-1","reconnaissance",{schema:1,phase:"reconnaissance",name:"Reconnaissance",dc:15,resolvedAt:2,grade:"unassigned",results:[
    {role:"scout",roleName:"Scout",status:"unassigned",total:null,ruling:null,success:null},
    {role:"tracker",roleName:"Tracker",status:"unassigned",total:null,ruling:null,success:null}
  ]});
  action=primaryHexTravelAction({pending:4,activeHexCardId:"hex-1",hexRecords});
  assert.equal(action.kind,"resolve-role");
  assert.equal(action.phase,"support");
  assert.equal(action.label,"Resolve Expedition Support");
});

test("fully resolved first commit is explicitly Commit Travel",()=>{
  let store=completedRoles(baseStore());
  let outcome=buildHexExpeditionOutcome(store.records[0],{momentum:"neutral",eventRoll:20,now:3});
  store=saveHexExpeditionOutcome(store,"hex-1",outcome);
  store=saveHexEventManualResolution(store,"hex-1",{notes:"Resolved",now:4});
  const action=primaryHexTravelAction({pending:4,activeHexCardId:"hex-1",hexRecords:store});
  assert.equal(action.kind,"commit");
  assert.equal(action.label,"Commit Travel");
  assert.equal(action.blocked,false);
});

test("a partially committed saved hex becomes Continue Travel",()=>{
  let store=completedRoles(baseStore());
  const outcome=buildHexExpeditionOutcome(store.records[0],{momentum:"neutral",eventRoll:12,now:3});
  store=saveHexExpeditionOutcome(store,"hex-1",outcome);
  store.records[0].travel.committedHours=1;
  store.records[0].travel.remainingHours=3;
  const action=primaryHexTravelAction({pending:3,activeHexCardId:"hex-1",hexRecords:store});
  assert.equal(action.kind,"continue");
  assert.equal(action.label,"Continue Travel");
});
