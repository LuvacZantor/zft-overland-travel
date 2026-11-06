import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { latestCompletedHexResult } from "../src/engines/hex-travel/HexFinalResult.js";

const source = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const engine = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelEngine.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

const baseResult = (id="h1", completedAt=100) => ({
  id, number:1, status:"completed", completedAt,
  event:{type:"quietTravel"}, eventResolution:{status:"resolved",engine:"quietTravel"},
  travel:{rolledHours:4}
});
const card = (id,stage="complete",createdAt=5) => ({ id,stage,createdAt });

test("dev.127 final result displays only a genuinely completed saved hex with a retained travel card", () => {
  const record=baseResult();
  assert.equal(latestCompletedHexResult([record],[card(record.id)])?.id,record.id);
  assert.equal(latestCompletedHexResult([record],[card(record.id)],{pending:2}),null);
  assert.equal(latestCompletedHexResult([record],[card(record.id)],{activeHexCardId:record.id}),null);
  assert.equal(latestCompletedHexResult([{...record,status:"inProgress"}],[card(record.id)]),null);
  assert.equal(latestCompletedHexResult([{...record,eventResolution:{status:"pending"}}],[card(record.id)]),null);
  assert.equal(latestCompletedHexResult([record],[]),null);
  assert.equal(latestCompletedHexResult([record],[card(record.id,"navigation")]),null);
});

test("dev.127 new hex retracts final result; cancellation doesn't destroy the previous saved result", () => {
  const older=baseResult();
  assert.equal(latestCompletedHexResult([older],[card("h1"),card("h2","started",101)]),null);
  assert.equal(latestCompletedHexResult([older],[card("h1")],{dismissedId:"h1"}),null);
  assert.equal(latestCompletedHexResult([older],[card("h1")])?.id,"h1");
  const newer={...baseResult("h2",200),number:2};
  assert.equal(latestCompletedHexResult([older,newer],[card("h1"),card("h2","complete",101)],{dismissedId:"h1"})?.id,"h2");
});

test("dev.127 initial Navigation stage publishes raw Guide/Vanguard totals before the travel dice checkpoint", () => {
  const review = engine.indexOf('await publishStage({ stage: "navigation", navResult, secResult });');
  const finalDice = engine.indexOf('const travelRoll = await new Roll(formula).evaluate()');
  assert.ok(review >= 0 && finalDice > review);
  assert.match(engine, /stageInfo\.stage === "navigation" && stageInfo\.navResult/);
  assert.match(engine, /total: stageInfo\.navResult\.total/);
  assert.match(engine, /total: stageInfo\.secResult\.total/);
  assert.match(engine, /navigation: options\.details\?\.navigation \?\? previewNavigation/);
  assert.match(source, /navigation: metadata\.navigation \? foundry\.utils\.deepClone\(metadata\.navigation\)/);
  assert.match(source, /pendingGmLabel:"Pending GM"/);
  assert.match(source, /status:"checked", total:Number\(rolled\.total\)/);
  assert.match(source, /const navigationCompleted = card\?\.stage === "complete"/);
});

test("dev.127 Dashboard and Travel history share saved final records without replacing Current Step or role phases", () => {
  assert.match(source, /const dashboardFinalResult = lastCompletedHex \? completedHexFinalResultHtml\(lastCompletedHex, completedComplication, "dashboard"\)/);
  assert.match(source, /const finalDay = segmentDay === lastTravelDay/);
  assert.match(source, /const finalHistory = finalDay && displayRecord \? completedHexFinalResultHtml\(displayRecord, savedComplication, "log"\)/);
  assert.match(source, /\$\{dashboardFinalResult\}[\s\S]*zft-hex-stats-overview/);
  assert.match(source, /\$\{sharedHistory\}\$\{finalHistory\}/);
  assert.match(source, /this\.dismissedFinalResultId = lastResult\.dataset\.hexFinalId/);
  assert.match(source, /rolePhaseHtml\(record,"reconnaissance","Reconnaissance"/);
  assert.match(source, /rolePhaseHtml\(record,"support","Expedition Support"/);
  assert.match(css, /#zft-hex-travel-console \.zft-hex-final-result/);
  assert.match(css, /#zft-hex-travel-log \.zft-hex-final-result/);
});

// Invoke real HTML render helper in isolation without a Foundry world. All its
// source data and permission behavior remains the original implementation.
function render(record,complication,isGM) {
  const start=source.indexOf("function completedHexFinalResultHtml(");
  const end=source.indexOf("function consequenceSummaryHtml(",start);
  assert.ok(start > 0 && end > start);
  const body=source.slice(start,end);
  const context={
    game:{user:{isGM}},
    esc:v=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    EXPEDITION_EVENT_TYPES:{COMPLICATION:"complication",MAJOR_COMPLICATION:"majorComplication",QUIET_TRAVEL:"quietTravel",OPPORTUNITY:"opportunity"},
    EXPEDITION_EVENT_LABELS:{complication:"Complication",majorComplication:"Major Complication",quietTravel:"Quiet Travel",opportunity:"Opportunity"},
    expeditionLabel:v=>String(v),
    eventResolutionLabel:r=>r.eventResolution.engine==="quietTravel" ? "Resolved · Nothing happens" : "Resolved manually",
    complicationOutcomeLabel:o=>({success:"Success",failure:"Failure",strongSuccess:"Strong Success",majorFailure:"Major Failure"})[o],
    consequenceTypeLabel:t=>({lostTime:"Lost Time"})[t] ?? t,
    consequenceImpactText:c=>`${c.plannedTimeDelta} planned travel hours added.`
  };
  return vm.runInNewContext(`${body}\ncompletedHexFinalResultHtml`,context)(record,complication,"log");
}

test("dev.127 Quiet Travel final summary contains no fabricated consequence", () => {
  const html=render(baseResult(),null,false);
  assert.match(html,/FINAL RESULT · HEX 1/);
  assert.match(html,/Quiet Travel/);
  assert.match(html,/No consequence/);
  assert.match(html,/4h travel completed/);
  const pending=render({...baseResult(),status:"inProgress",travel:{rolledHours:4,remainingHours:4}},null,false);
  assert.match(pending,/RESOLUTION RECORDED · HEX 1/);
  assert.match(pending,/4h remaining to commit/);
});

test("dev.127 GM sees saved Complication ruling and notes; player does not see hidden detail or GM notes", () => {
  const record={...baseResult(),event:{type:"complication"},eventResolution:{status:"manual",engine:"complication"}};
  const complication={reconnaissanceState:"none",status:"resolved",category:{label:"Navigation"},primaryType:{label:"False Trail"},detail:{text:"SECRET LOCATION",partialClue:"Vague signs"},resolution:{outcome:"failure",notes:"SECRET GM NOTE",consequence:{type:"lostTime",label:"Lost Time",finalSeverity:2,plannedTimeDelta:3}}};
  const gm=render(record,complication,true);
  assert.match(gm,/Navigation · False Trail/);assert.match(gm,/SECRET LOCATION/);assert.match(gm,/SECRET GM NOTE/);
  assert.match(gm,/Failure/);assert.match(gm,/Severity 2/);assert.match(gm,/3 planned travel hours added/);
  const player=render(record,complication,false);
  assert.match(player,/Travel Complication/);assert.match(player,/Lost Time/);assert.match(player,/Failure/);
  assert.doesNotMatch(player,/SECRET LOCATION|SECRET GM NOTE|False Trail/);
  const partial=render(record,{...complication,reconnaissanceState:"partial"},false);
  assert.match(partial,/Vague signs/);assert.doesNotMatch(partial,/SECRET LOCATION/);
});

test("dev.127 actual Navigation role row renders 18/14 and Pending GM without changing unrelated role status", () => {
  const a=source.indexOf("function roleOutcomeText(");
  const b=source.indexOf("function rolePointSummary(",a);
  assert.ok(a>0&&b>a);
  const outcome=vm.runInNewContext(`${source.slice(a,b)}\nroleOutcomeText`,{});
  const c=source.indexOf("function roleRow(");
  const d=source.indexOf("function rolePhaseHtml(",c);
  assert.ok(c>0&&d>c);
  const row=vm.runInNewContext(`${source.slice(c,d)}\nroleRow`,{
    roleOutcomeText:outcome,
    hexRoleRollEvidenceHtml:()=>"",
    hexTravelD20Total:n=>String(n),
    hexRoleSkillLabel:skill=>skill==="sur" ? "Survival" : "Athletics",
    esc:v=>String(v)
  });
  const guide={roleName:"Guide",actorName:"Player One",skill:"sur",ability:"wis",status:"checked",total:18,dc:15,rolledSuccess:true,awaitingConfirmation:true,pendingGmLabel:"Pending GM"};
  const vanguard={roleName:"Vanguard",actorName:"Player Two",skill:"ath",ability:"str",status:"checked",total:14,dc:15,rolledSuccess:false,awaitingConfirmation:true,pendingGmLabel:"Pending GM"};
  assert.match(row(guide,guide),/18<\/span>/);
  assert.match(row(vanguard,vanguard),/14<\/span>/);
  assert.match(row(guide,guide),/Pending GM/);
  assert.match(row(vanguard,vanguard),/Rolled Failure/);
  assert.match(outcome({...guide,pendingGmLabel:undefined}).label,/Awaiting GM Confirmation/);
});
