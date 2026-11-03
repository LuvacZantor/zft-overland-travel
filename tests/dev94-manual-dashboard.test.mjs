import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { startHexRecord, saveHexRolePhase } from "../src/engines/hex-travel/HexTravelRecords.js";
import { primaryHexTravelAction } from "../src/engines/hex-travel/HexTravelPrimaryAction.js";

const consoleSource=await readFile(new URL("../src/engines/hex-travel/HexTravelConsole.js",import.meta.url),"utf8");
const engineSource=await readFile(new URL("../src/engines/hex-travel/HexTravelEngine.js",import.meta.url),"utf8");
const css=await readFile(new URL("../src/styles/zft-overland-travel.css",import.meta.url),"utf8");

function store(){return startHexRecord(undefined,{id:"hex-1",number:1,day:1,hour:0,identity:{},difficulty:{dc:15},pace:{id:"normal"},party:[],assignments:{},navigation:{dc:15,guide:{total:20,ruling:"roll",success:true},grade:"unassisted"},dice:{hours:3,baseDice:[1,2],delayDice:[]},now:1});}

test("dev.94 staged hex waits for explicit Reconnaissance and Support actions",()=>{
  assert.doesNotMatch(engineSource,/resumeWorkflow\?\.\(hexCardId\)/);
  assert.match(engineSource,/Resolve Reconnaissance when ready/);
  let hexRecords=store();
  let action=primaryHexTravelAction({pending:3,activeHexCardId:"hex-1",hexRecords});
  assert.equal(action.label,"Resolve Reconnaissance");
  hexRecords=saveHexRolePhase(hexRecords,"hex-1","reconnaissance",{schema:1,phase:"reconnaissance",name:"Reconnaissance",dc:15,resolvedAt:2,grade:"unassigned",results:[{role:"scout",roleName:"Scout",status:"unassigned"},{role:"tracker",roleName:"Tracker",status:"unassigned"}]});
  action=primaryHexTravelAction({pending:3,activeHexCardId:"hex-1",hexRecords});
  assert.equal(action.label,"Resolve Expedition Support");
  assert.match(consoleSource,/primary\.kind === "resolve-role"/);
});

test("dev.94 dashboard distinguishes current-hex quality from persistent Momentum",()=>{
  assert.match(consoleSource,/THIS HEX · TRAVEL QUALITY/);
  assert.match(consoleSource,/THIS HEX · MOMENTUM CHANGE/);
  assert.match(consoleSource,/EXPEDITION MOMENTUM/);
  assert.match(consoleSource,/Carries into the next hex/);
  assert.match(consoleSource,/EVENT d20/);
  assert.match(consoleSource,/1–5 Major/);
  assert.match(consoleSource,/16–20 Opportunity/);
  assert.match(css,/zft-hex-momentum-track/);
  assert.match(css,/\.is-current/);
});

test("dev.94 role-grade help is a structured tooltip instead of one run-on sentence",()=>{
  assert.match(consoleSource,/zft-hex-role-grade-tooltip-points/);
  assert.match(consoleSource,/Travel Quality contribution/);
  assert.match(consoleSource,/Success Points/);
  assert.match(consoleSource,/Failure Points/);
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
