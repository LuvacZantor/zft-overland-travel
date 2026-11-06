import test from "node:test";
import assert from "node:assert/strict";
import { captureNativeD20Evidence, nativeRollMessageId } from "../src/engines/hex-travel/HexRoleDiceEvidence.js";

const roll=(formula, faces, total, usedIndex) => ({formula,total,dice:[{faces:20,results:faces.map((value,i)=>({result:value,active:i===usedIndex,discarded:i!==usedIndex}))}]});
const msg=(rollObj,extra={})=>({isRoll:true,speaker:{actor:"A1"},author:{id:"U1"},rolls:[rollObj],...extra});
test("dev.129 reads actual advantage dice, original order, selected face, and total",()=>{
 const e=captureNativeD20Evidence({remote:{rolls:[roll("2d20kh + 5",[7,18],23,1)]},total:23});
 assert.equal(e.mode,"advantage");assert.deepEqual(e.faces,[{value:7,used:false},{value:18,used:true}]);assert.equal(e.modifier,5);
});
test("dev.129 reads disadvantage and normal, without changing totals",()=>{
 let e=captureNativeD20Evidence({remote:roll("2d20kl1 + 5",[18,7],12,1),total:12});
 assert.equal(e.mode,"disadvantage");assert.equal(e.faces[1].used,true);
 e=captureNativeD20Evidence({remote:roll("1d20 + 5",[18],23,0),total:23});
 assert.equal(e.mode,"normal");assert.equal(e.faces.length,1);
});
test("dev.129 preserves unknown mode for native two-die selection without valid advantage notation",()=>{
 const e=captureNativeD20Evidence({remote:roll("2d20 + 4",[12,18],22,1),total:22});
 assert.equal(e.mode,"unknown");assert.deepEqual(e.faces.map(f=>f.used),[false,true]);
});
test("dev.129 does not invent d20 faces, infer mode from requested advantage, or accept mismatched totals",()=>{
 assert.equal(captureNativeD20Evidence({remote:{total:23,advantage:true},total:23}),null);
 assert.equal(captureNativeD20Evidence({remote:roll("2d20kh+5",[7,18],23,1),total:24}),null);
});
test("dev.129 matches native chat message identity and never copies private or unrelated rolls",()=>{
 const native=msg(roll("2d20kh + 5",[12,19],24,1));
 const ok=captureNativeD20Evidence({remote:{total:24},message:native,total:24,actorId:"A1",rollerId:"U1"});
 assert.equal(ok.mode,"advantage");
 for(const bad of [{...native,whisper:["U1"]},{...native,blind:true},{...native,speaker:{actor:"A2"}},{...native,author:{id:"U2"}},{...native,isRoll:false}]) {
  assert.equal(captureNativeD20Evidence({remote:{total:24},message:bad,total:24,actorId:"A1",rollerId:"U1"}),null);
 }
});
test("dev.129 identifies exact matching chat message before falling back to observed message id",()=>{
 assert.equal(nativeRollMessageId({messageId:"abc"},"xyz"),"abc");
 assert.equal(nativeRollMessageId({total:13},"xyz"),"xyz");
 assert.equal(nativeRollMessageId({total:13}),null);
});

test("dev.129 role resolution carries actual native dice with the effective GM outcome",async()=>{
 const {buildRolePhaseResolution}=await import("../src/engines/hex-travel/HexExpeditionRoleResolution.js");
 const plan={phase:"reconnaissance",name:"Reconnaissance",dc:15,slots:[
   {status:"ready",role:"scout",roleName:"Scout",actorUuid:"a1"},
   {status:"absent",role:"tracker",roleName:"Tracker",actorUuid:"a2"}
 ]};
 const evidence=captureNativeD20Evidence({remote:roll("2d20kl1 + 5",[18,7],12,1),total:12});
 const resolved=buildRolePhaseResolution(plan,{scout:{total:12,rollEvidence:evidence,rerolls:1}},{scout:"success"},1000);
 assert.equal(resolved.results[0].success,true);
 assert.equal(resolved.results[0].rolledSuccess,false);
 assert.equal(resolved.results[0].rollEvidence.mode,"disadvantage");
 assert.equal(resolved.results[0].rollEvidence.faces[1].value,7);
 assert.equal(resolved.results[0].rerolls,1);
 assert.equal(resolved.results[1].rollEvidence,undefined);
});
