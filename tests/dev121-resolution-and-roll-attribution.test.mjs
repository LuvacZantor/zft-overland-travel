import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { rollControlledD20, rollControlledDice } from "../src/engines/rolls/GmRollControl.js";
import { ensurePrototypeComplicationRecord, resolveComplicationForHex } from "../src/engines/complication/ExpeditionComplication.js";

const consoleSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

function installRollMock() {
  let posted = null;
  globalThis.game = { user:{ id:"gm-user", isGM:true }, modules:{ get:()=>({active:false}) } };
  globalThis.Roll = class {
    constructor(formula) { this.formula=formula; this._raw=10; this._modifier=Number((formula.match(/\+\s*(-?\d+)/)||[])[1]||0); this.total=this._raw+this._modifier; this.dice=[{faces:20,results:[{result:this._raw,active:true}]}]; }
    async evaluate(){ return this; }
    async toMessage(data){ posted=data; return {id:"m1"}; }
  };
  return () => posted;
}

test("dev.121 Actor-owned controlled rolls ignore the GM's controlled token and speak as the selected Actor", async () => {
  const posted = installRollMock();
  globalThis.fromUuid = async uuid => uuid === "Actor.ayruak" ? {id:"ayruak",name:"Ayruak Athak Akyldav"} : null;
  const result = await rollControlledD20({modifier:4,dc:15,actorUuid:"Actor.ayruak",control:{mode:"normal"},flavor:"Complication Resolution"});
  assert.equal(result.executorUserId,"gm-user");
  assert.deepEqual(posted().speaker,{actor:"ayruak",alias:"Ayruak Athak Akyldav"});
});

test("dev.121 system-owned ZFT dice use a neutral speaker", async () => {
  const posted = installRollMock();
  globalThis.Roll = class {
    constructor(){ this.total=3; this.dice=[{faces:4,results:[{result:3,active:true}]}]; }
    async evaluate(){ return this; }
    async toMessage(data){ posted.capture=data; return {id:"m2"}; }
  };
  let capture = null;
  globalThis.Roll = class {
    constructor(){ this.total=3; this.dice=[{faces:4,results:[{result:3,active:true}]}]; }
    async evaluate(){ return this; }
    async toMessage(data){ capture=data; return {id:"m2"}; }
  };
  await rollControlledDice({count:1,faces:4,control:{mode:"normal"},flavor:"Complication Consequence"});
  assert.deepEqual(capture.speaker,{alias:"ZFT Overland Travel"});
});

test("dev.121 Complication resolution records roll versus direct adjudication explicitly", () => {
  const hex={id:"hex-1",event:{type:"complication"},roles:{reconnaissance:{grade:"partial"}}};
  const seeded=ensurePrototypeComplicationRecord({schema:1,records:[hex],complications:[]},hex,{detailRoll:1}).store;
  const resolved=resolveComplicationForHex(seeded,"hex-1",{outcome:"success",method:"direct",notes:"Spell bypassed the obstruction.",now:2}).record;
  assert.equal(resolved.resolution.method,"direct");
  assert.equal(resolved.resolution.outcome,"success");
  assert.equal(resolved.resolution.roll,undefined);
});

test("dev.121+ keeps Support opt-in while dev.124 makes Complication resolution GM-adjudication-only", () => {
  assert.match(consoleSource,/chooseComplicationAdjudication/);
  assert.match(consoleSource,/Outcome · GM Adjudication/);
  assert.doesNotMatch(consoleSource,/Roll \/ Check/);
  assert.doesNotMatch(consoleSource,/chooseComplicationResolutionMethod/);
  assert.match(consoleSource,/zft-complication-support-choice[^`]*name="useSupport"/);
  assert.doesNotMatch(consoleSource,/name="useSupport" checked/);
});

test("dev.121 routine controls hide Recovery and preserve current-travel reset", () => {
  assert.doesNotMatch(consoleSource,/<button type="button" data-hex-action="recovery"/);
  assert.match(consoleSource,/data-hex-action="reset-current"/);
});

test("dev.121 consequence summary is human-readable while detail audit keeps tier evidence", () => {
  assert.match(consoleSource,/Operational Readiness reduced the Consequence Severity\./);
  assert.match(consoleSource,/planned travel hour\$\{delay === 1 \? "" : "s"\} added\./);
  assert.match(consoleSource,/Audit: Consequence Severity/);
});
