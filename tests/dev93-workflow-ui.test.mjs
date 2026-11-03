import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { startHexRecord, saveHexRolePhase, saveHexExpeditionOutcome } from "../src/engines/hex-travel/HexTravelRecords.js";
import { buildHexExpeditionOutcome } from "../src/engines/hex-travel/HexExpeditionOutcome.js";
import { primaryHexTravelAction } from "../src/engines/hex-travel/HexTravelPrimaryAction.js";
import { compactRosterDisplayNames, completedHexIdForAutoCollapse } from "../src/engines/hex-travel/HexTravelConsole.js";

const consoleSource = await readFile(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

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
function stagedEvent(raw){
  let store=completedRoles(baseStore());
  const outcome=buildHexExpeditionOutcome(store.records[0],{momentum:"neutral",eventRoll:raw,now:3});
  return saveHexExpeditionOutcome(store,"hex-1",outcome);
}

test("dev.93 primary action opens normal manual Event resolution for each pending Event type",()=>{
  for (const [raw,label] of [[3,"Resolve Major Complication"],[8,"Resolve Complication"],[18,"Resolve Opportunity"]]) {
    const store=stagedEvent(raw);
    const action=primaryHexTravelAction({pending:4,activeHexCardId:"hex-1",hexRecords:store});
    assert.equal(action.kind,"resolve-event");
    assert.equal(action.label,label);
    assert.equal(action.blocked,false);
    assert.match(action.reason,/before travel can be committed/);
  }
});

test("dev.93 primary GM control routes resolve-event directly to the existing Event-resolution dialog",()=>{
  assert.match(consoleSource,/primary\.kind === "resolve-event"/);
  assert.match(consoleSource,/await this\.recordEventResolution\(primary\.recordId\)/);
  assert.doesNotMatch(consoleSource,/still needs its Event resolved\. Use Recovery/);
});

test("dev.93 compact roster uses unique first names and falls back to full names on collisions",()=>{
  const names=compactRosterDisplayNames([
    {uuid:"1",name:"Ayurak Athak Akyldav"},
    {uuid:"2",name:"Merrick Clay"},
    {uuid:"3",name:"Merrick Stone"},
    {uuid:"4",name:"Yynn"}
  ]);
  assert.equal(names.get("1"),"Ayurak");
  assert.equal(names.get("2"),"Merrick Clay");
  assert.equal(names.get("3"),"Merrick Stone");
  assert.equal(names.get("4"),"Yynn");
  assert.match(consoleSource,/title="\$\{esc\(actor\.name\)\}">\$\{esc\(displayName\)\}/);
});

test("dev.93 role grades expose hover/focus explanations with actual Travel Quality contribution",()=>{
  assert.match(consoleSource,/Both assigned checks succeeded/);
  assert.match(consoleSource,/One assigned check succeeded and one failed/);
  assert.match(consoleSource,/Both assigned checks failed/);
  assert.match(consoleSource,/Travel Quality contribution/);
  assert.match(consoleSource,/zft-hex-role-grade-tooltip/);
  assert.match(css,/zft-hex-role-grade-tooltip:is\(:hover,:focus-visible\)/);
});

test("dev.93 auto-collapses only a genuinely completed formerly-active hex",()=>{
  const store=baseStore();
  const record=store.records[0];
  record.status="completed";
  record.completedAt=5;
  record.travel.committedHours=4;
  record.travel.remainingHours=0;
  record.travel.status="completed";
  record.phases.travel="completed";
  assert.equal(completedHexIdForAutoCollapse("hex-1",4,{pending:0,activeHexCardId:null,hexRecords:store}),"hex-1");
  assert.equal(completedHexIdForAutoCollapse("hex-1",4,{pending:2,activeHexCardId:"hex-1",hexRecords:store}),null);
  assert.equal(completedHexIdForAutoCollapse(null,4,{pending:0,activeHexCardId:null,hexRecords:store}),null);
  assert.match(consoleSource,/historyOpenOverrides\.set\(card\.key, false\)/);
  assert.match(consoleSource,/if \(node\) node\.open = false/);
});
