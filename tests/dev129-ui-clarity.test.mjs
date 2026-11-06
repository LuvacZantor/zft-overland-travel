import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const get=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");
const consoleSource=get("src/engines/hex-travel/HexTravelConsole.js");
const engine=get("src/engines/hex-travel/HexTravelEngine.js");
const roles=get("src/engines/hex-travel/HexTravelRoleResolution.js");
const css=get("src/styles/zft-overland-travel.css");
const esc=s=>String(s).replace(/[<>&"]/g,"_");

test("dev.129 all six roles use actual d20 evidence, preserving native totals and pending GM",()=>{
 const a=consoleSource.indexOf("function hexRoleRollEvidenceHtml(");
 const b=consoleSource.indexOf("function rolePhaseHtml(",a);
 assert.ok(a>0&&b>a);
 const context={esc,Number};
 const mk=vm.runInNewContext(`${consoleSource.slice(a,b)}\n[hexRoleRollEvidenceHtml,roleRow]`,{
  ...context,roleOutcomeText:({awaitingConfirmation})=>({label:awaitingConfirmation?"Pending GM":"Success",tone:"pending"}),
  hexTravelD20Total:n=>`<b>${n}</b>`,hexRoleSkillLabel:s=>s
 });
 const [html,row]=mk;
 const evidence={mode:"advantage",faces:[{value:7,used:false},{value:18,used:true}],usedIndex:1,modifier:5,total:23};
 const result={roleName:"Scout",actorName:"Yynn",status:"checked",skill:"ste",ability:"dex",total:23,awaitingConfirmation:true,rollEvidence:evidence};
 const rendered=row(result,result);
 assert.match(rendered,/Advantage/);assert.match(rendered,/7 dropped/);assert.match(rendered,/18 used/);
 assert.match(rendered,/\+5 other/);assert.match(rendered,/Pending GM/);assert.match(rendered,/>23<\/b>/);
 assert.equal(html(null),"");assert.equal(html({mode:"normal",faces:[]}),"");
});

test("dev.129 Navigation and paired GM ruling selects use thematic Success/Failure/Reroll colors",()=>{
 assert.match(engine,/select\.classList\.add\("is-reroll"\)/);
 assert.match(engine,/select\.classList\.toggle\("is-success", finalSuccess\)/);
 assert.match(engine,/select\.classList\.toggle\("is-failure", !finalSuccess\)/);
 assert.match(roles,/class="is-\$\{tone\}" name="ruling-/);
 assert.match(roles,/preview\.textContent = reroll/);
 assert.match(roles,/select\.classList\.add\(`is-\$\{tone\}`\)/);
 for(const state of ["success","failure","reroll"]){
  assert.match(css,new RegExp(`\\.zft-hex-role-ruling-choice > select\\.is-${state}`));
  assert.match(css,new RegExp(`\\.zft-hex-navigation-ruling select\\.is-${state}`));
 }
});

test("dev.129 Forced March Current Step uses saved hour-derived DC and a compact warning chip",()=>{
 assert.match(consoleSource,/saveDC: 10 \+ nextHour - 8/);
 assert.match(consoleSource,/currentStep\.saveDC != null \? `<span class="zft-hex-current-step-save-dc"/);
 assert.match(consoleSource,/CONSTITUTION SAVE <strong>DC \$\{esc\(currentStep\.saveDC\)\}<\/strong>/);
 assert.match(css,/#zft-hex-travel-console \.zft-hex-current-step-save-dc/);
 assert.match(css,/\.zft-hex-current-step-save-dc > strong/);
});

test("dev.129 Complication GM Result Control is stacked and buttons wrap inside the panel",()=>{
 assert.match(css,/\.zft-complication-generation-control \{\s*display:grid;grid-template-columns:minmax\(0,1fr\);align-items:stretch/);
 assert.match(css,/\.zft-complication-generation-actions \{display:flex;flex-wrap:wrap;justify-content:flex-start/);
 assert.match(css,/white-space:normal;overflow-wrap:anywhere/);
 assert.match(consoleSource,/GM Result Control/);
 assert.match(consoleSource,/data-zft-generation-action="rerollBoth"/);
 assert.match(consoleSource,/data-zft-generation-action="rerollDetail"/);
 assert.match(consoleSource,/data-zft-generation-action="chooseResults"/);
});

test("dev.129 read-only data exporter remains part of installed module",()=>{
 const main=get("src/main.js");
 const exporter=get("src/engines/hex-travel/HexExpeditionDataExport.js");
 assert.match(consoleSource,/exportExpeditionDataFromFoundry\(\)/);
 assert.match(exporter,/buildExpeditionDataSnapshot/);
 assert.match(exporter,/if \(!globalThis\.game\?\.user\?\.isGM\)/);
 assert.match(main,/HexTravelConsole/);
});
