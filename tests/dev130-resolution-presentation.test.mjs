import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { latestDisplayableHexResult, latestCompletedHexResult } from "../src/engines/hex-travel/HexFinalResult.js";

const source = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

const record = (status="inProgress", type="majorComplication") => ({
  id:"hex-130", number:3, status, completedAt:status==="completed" ? 2000 : null,
  event:{ type }, eventResolution:{status:"manual",engine:type==="quietTravel" ? "quietTravel":"complication",notes:"Ice Cream Found"},
  travel:{rolledHours:7,remainingHours:status==="completed" ? 0 : 5,committedHours:status==="completed" ? 7 : 2}
});
const cards=(stage="complete") => [{id:"hex-130",stage,createdAt:1200}];

function render(recordValue,complication,isGM=false,surface="dashboard") {
  const start=source.indexOf("function completedHexFinalResultHtml(");
  const end=source.indexOf("function consequenceSummaryHtml(",start);
  assert.ok(start>0 && end>start);
  const ctx={
    game:{user:{isGM}},esc:v=>String(v).replaceAll("&","&amp;").replaceAll("<","&lt;"),
    EXPEDITION_EVENT_TYPES:{COMPLICATION:"complication",MAJOR_COMPLICATION:"majorComplication",QUIET_TRAVEL:"quietTravel",OPPORTUNITY:"opportunity"},
    EXPEDITION_EVENT_LABELS:{complication:"Complication",majorComplication:"Major Complication",quietTravel:"Quiet Travel",opportunity:"Opportunity"},
    expeditionLabel:v=>String(v),eventResolutionLabel:r=>r.eventResolution.status==="manual" ? "Resolved manually" : "Resolved",
    complicationOutcomeLabel:v=>({strongSuccess:"Strong Success",success:"Success",failure:"Failure",majorFailure:"Major Failure"})[v]??v,
    consequenceTypeLabel:v=>({lostTime:"Lost Time"})[v]??v,
    consequenceImpactText:v=>v.type==="lostTime" ? `${v.plannedTimeDelta} planned travel hours added.` : "Consequence recorded."
  };
  return vm.runInNewContext(`${source.slice(start,end)}\ncompletedHexFinalResultHtml`,ctx)(recordValue,complication,surface);
}

function guide(complication,selectable=false){
  const a=source.indexOf("function complicationOutcomeGuideHtml(");
  const b=source.indexOf("function consequenceTypeLabel(",a);
  assert.ok(a>0&&b>a);
  const ctx={esc:v=>String(v),complicationDefinition:c=>c.definition};
  return vm.runInNewContext(`${source.slice(a,b)}\ncomplicationOutcomeGuideHtml`,ctx)(complication,{selectable,selected:"failure"});
}

test("dev.130 displays the saved ruling before committing any travel hours",()=>{
  const active=record();
  assert.equal(latestDisplayableHexResult([active],cards(),{pending:5,activeHexCardId:active.id})?.id,active.id);
  assert.match(render(active,null,true),/RESOLUTION RECORDED · HEX 3/);
  assert.match(render(active,null,true),/Travel Pending/);
  assert.match(render(active,null,true),/5h remaining to commit/);
  assert.doesNotMatch(render(active,null,true),/7h travel completed/);
  assert.equal(latestCompletedHexResult([active],cards(),{pending:5,activeHexCardId:active.id}),null);
});

test("dev.130 completed result persists between hexes, and next started hex hides it",()=>{
  const done=record("completed","opportunity");
  assert.equal(latestDisplayableHexResult([done],cards(),{})?.id,done.id);
  assert.match(render(done,null,true),/FINAL RESULT · HEX 3/);
  assert.match(render(done,null,true),/7h travel completed/);
  assert.match(render(done,null,true),/No consequence recorded/);
  assert.equal(latestDisplayableHexResult([done],[...cards(),{id:"hex-4",stage:"started",createdAt:2001}],{}),null);
  assert.equal(latestDisplayableHexResult([done],cards(),{dismissedId:done.id}),null);
});

test("dev.130 does not display unadjudicated events, stale records or a cleared log",()=>{
  const active=record();
  assert.equal(latestDisplayableHexResult([{...active,eventResolution:{status:"pending"}}],cards(),{pending:5,activeHexCardId:active.id}),null);
  assert.equal(latestDisplayableHexResult([active],[],{pending:5,activeHexCardId:active.id}),null);
  assert.equal(latestDisplayableHexResult([active],cards("navigation"),{pending:5,activeHexCardId:active.id}),null);
  assert.equal(latestDisplayableHexResult([{...active,status:"interrupted"}],cards(),{pending:5,activeHexCardId:active.id}),null);
  assert.equal(latestDisplayableHexResult([active],cards(),{pending:5,activeHexCardId:"some-other-hex"}),null);
});

test("dev.130 public pending Complication uses redacted details and GM notes remain private",()=>{
  const active=record("inProgress","majorComplication");
  const comp={reconnaissanceState:"none",category:{label:"Navigation"},primaryType:{label:"Hidden Road"},detail:{text:"SECRET TRAP",partialClue:"Danger nearby"},resolution:{outcome:"strongSuccess",notes:"SECRET NOTE",consequence:{type:"lostTime",label:"Lost Time",plannedTimeDelta:1}}};
  const gm=render(active,comp,true),player=render(active,comp,false),log=render(active,comp,false,"log");
  assert.match(gm,/SECRET TRAP|SECRET NOTE/);
  assert.match(gm,/Strong Success/); assert.match(gm,/zft-hex-final-outcome is-positive/);
  assert.match(player,/Strong Success/);
  assert.match(render(active,{...comp,resolution:{...comp.resolution,outcome:"failure"}},false),/zft-hex-final-outcome is-negative/);
  assert.match(player,/1 planned travel hours added/);
  assert.doesNotMatch(player,/SECRET TRAP|SECRET NOTE|Hidden Road/);
  assert.match(log,/RESOLUTION RECORDED · HEX 3/);
});

test("dev.130 Quiet Travel and Opportunity use same final-result lifecycle with truthful consequences",()=>{
  for(const eventType of ["quietTravel","opportunity"]){
    const result=render(record("inProgress",eventType),null,false);
    assert.match(result,/RESOLUTION RECORDED/);
    assert.match(result,eventType==="opportunity"?/Opportunity/:/Quiet Travel/);
    assert.match(result,eventType==="quietTravel" ? /No consequence/ : /No consequence recorded/);
    assert.doesNotMatch(result,/Ice Cream Found/);
  }
});

test("dev.130 Details and GM adjudication use one four-outcome row system",()=>{
  const definition={outcomes:{strongSuccess:"A near-direct alternative is found.",success:"Reduced detour.",failure:"Full detour delay.",majorFailure:"Long detour plus a secondary consequence."}};
  for(const severity of ["standard","major"]){
    const comp={definition,severity};
    const reference=guide(comp),select=guide(comp,true);
    assert.match(reference,/zft-resolution-outcome-list zft-complication-outcome-reference/);
    assert.match(select,/zft-resolution-outcome-list zft-complication-outcome-choices/);
    assert.equal((reference.match(/<strong>/g)||[]).length,4);
    assert.equal((select.match(/<input type="radio"/g)||[]).length,4);
    assert.match(select,/value="failure" checked/);
    assert.match(reference,/Long detour plus a secondary consequence/);
  }
});

test("dev.130 CSS supports compact dashboard/log cards and full-width outcome rows",()=>{
  const latest=css.slice(css.lastIndexOf("/* dev.130:"));
  assert.ok(latest.length>1400);
  assert.match(latest,/zft-resolution-outcome-list/);
  assert.match(latest,/grid-template-columns:minmax\(0,1fr\)/);
  assert.match(latest,/display:flex;flex-wrap:wrap/);
  assert.match(latest,/\.is-majorFailure input:checked \+ span/);
  assert.match(latest,/\.zft-hex-final-result\.is-travel-pending/);
  assert.match(latest,/\.zft-hex-final-headline/);
  assert.match(source,/const finalHistory = finalDay && displayRecord \? completedHexFinalResultHtml\(displayRecord, savedComplication, "log"\)/);
  assert.match(source,/lastResult\?\.classList\.contains\("is-completed"\)/);
  assert.match(source,/this\.dismissedFinalResultId = lastResult\.dataset\.hexFinalId/);
});
