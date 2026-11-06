import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildExpeditionDataSnapshot, exportExpeditionDataFromFoundry, EXPEDITION_EXPORT_SCHEMA
} from "../src/engines/hex-travel/HexExpeditionDataExport.js";

const consoleSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js",import.meta.url),"utf8");
const initial = Object.freeze({
  day: 3, hours: 7, pending: 0, hexes: 2,
  marchHistory: [{ day:2, hour:9, results:[{ total:18, passed:true }] }],
  hexRecords: { schema:1, records:[
    { id:"hex-A", number:1, status:"completed", start:{day:1,hour:0}, completedAt:1234,
      context:{pace:"normal",difficulty:{dc:14}},
      navigation:{guide:{total:17, ruling:"roll",success:true},vanguard:null},
      roles:{reconnaissance:{results:[{role:"scout",total:15,success:true}]}, support:{grade:"strong"}},
      travelQuality:{quality:"successful",successPoints:5,failurePoints:1},
      momentum:{before:"neutral",after:"prepared",shift:1},
      event:{raw:9,modifier:1,final:10,type:"complication"},
      eventResolution:{status:"manual",outcome:"success",notes:"Private GM note"},
      travel:{rolledHours:4,committedHours:4,remainingHours:0}
    },
    { id:"hex-B", number:2, status:"inProgress",start:{day:3,hour:2},
      navigation:{guide:{total:5}}, event:{raw:15,modifier:1,final:16,type:"opportunity",rollControlMode:"exact"},
      travel:{remainingHours:1} }
  ], complications:[{id:"comp-A",sourceHexRecordId:"hex-A",severity:"standard",resolution:{consequence:{type:"lostTime",plannedTimeDelta:1}}}],
  threats:[] }
});
const presentation = {cards:[{id:"hex-A",html:"<p>Previous result</p>"}]};

test("dev.128 exports cumulative saved world state and keyed per-hex analysis without altering inputs", () => {
  const before = JSON.stringify(initial);
  const data = buildExpeditionDataSnapshot({ledger:initial,travelCards:presentation,worldId:"world-1",exportedAt:"2026-11-06T16:04:00.000Z"});
  assert.equal(data.format,EXPEDITION_EXPORT_SCHEMA);
  assert.equal(data.exportedAt,"2026-11-06T16:04:00.000Z");
  assert.equal(data.source.worldId,"world-1");
  assert.equal(data.statistics.recordedHexes,2);
  assert.equal(data.statistics.completedHexes,1);
  assert.equal(data.statistics.eventTypes.complication,1);
  assert.equal(data.statistics.eventTypes.opportunity,1);
  assert.equal(data.statistics.storedComplications,1);
  assert.equal(data.statistics.storedForcedMarchEntries,1);
  assert.equal(data.hexes[0].eventRollSelectionMode,null);
  assert.equal(data.hexes[1].eventRollSelectionMode,"exact");
  assert.equal(data.statistics.unknownEventRollModes,1);
  assert.equal(data.hexes[0].complications[0].resolution.consequence.plannedTimeDelta,1);
  assert.equal(data.savedState.ledger.hexRecords.records[0].eventResolution.notes,"Private GM note");
  assert.equal(data.savedState.travelCards.cards[0].html,"<p>Previous result</p>");
  assert.equal(JSON.stringify(initial),before);
  assert.notStrictEqual(data.savedState.ledger,initial);
});

test("dev.128 never invents unrecorded rolls or a prior saved hex", () => {
  const data=buildExpeditionDataSnapshot({ledger:{day:1,hours:0,hexes:0,pending:0}});
  assert.deepEqual(data.hexes,[]);
  assert.equal(data.statistics.recordedHexes,0);
  assert.deepEqual(data.statistics.eventTypes,{});
  assert.equal(data.savedState.travelCards,null);
  assert.equal(data.statistics.unknownEventRollModes,0);
});

test("dev.128 refuses malformed or missing ledger instead of writing or dropping history", () => {
  for(const input of [null,undefined,[],"hello"]) assert.throws(() => buildExpeditionDataSnapshot({ledger:input}),/ledger is unavailable/);
});

test("dev.128 export reads saved settings and initiates an ordinary local file download only", () => {
  const oldGame=globalThis.game, oldSave=globalThis.saveDataToFile;
  const accessed=[],writes=[],downloads=[];
  try {
    globalThis.game = {
      user:{isGM:true},version:"13.351",system:{id:"dnd5e",version:"5.2.5"},world:{id:"test-world"},time:{worldTime:1020},
      modules:new Map([["zft-overland-travel",{version:"0.4.0-dev.128"}]]),
      settings:{get(id,key){assert.equal(id,"zft-overland-travel");accessed.push(key); return key==="hexTravelLedger"?initial:key==="hexTravelCards"?presentation:{empty:true};},
        set(...args){writes.push(args);throw Error("unexpected write");}}
    };
    globalThis.saveDataToFile=(text,mime,filename)=>downloads.push({data:JSON.parse(text),mime,filename});
    const result=exportExpeditionDataFromFoundry();
    assert.equal(result.recordedHexes,2);
    assert.match(result.filename,/^zft-expedition-data_\d{8}-\d{4}\.json$/);
    assert.equal(downloads.length,1);
    assert.equal(downloads[0].data.savedState.ledger.hexRecords.records.length,2);
    assert.equal(downloads[0].mime,"application/json");
    assert.deepEqual(writes,[]);
    assert.deepEqual(accessed,["hexTravelLedger","hexTravelCards","hexTravelLogVisibility","hexTravelSnapshot","hexTravelCalendar","hexTravelIdentity","hexTravelDisplayProgress"]);
  } finally { globalThis.game=oldGame;globalThis.saveDataToFile=oldSave; }
});

test("dev.128 players cannot export hidden GM-only expedition state even if invoking the handler", () => {
  const oldGame=globalThis.game,oldSave=globalThis.saveDataToFile;let read=false,download=false;
  try {
    globalThis.game={user:{isGM:false},settings:{get(){read=true;throw Error("player state read");}}};
    globalThis.saveDataToFile=()=>{download=true;};
    assert.throws(()=>exportExpeditionDataFromFoundry(),/Only a GM/);
    assert.equal(read,false);assert.equal(download,false);
  } finally {globalThis.game=oldGame;globalThis.saveDataToFile=oldSave;}
});

test("dev.128 export is a visible GM-only Expedition Log action, not a console macro", () => {
  assert.match(consoleSource,/game\.user\.isGM \? `<button type="button" data-hex-log-action="export"/);
  assert.match(consoleSource,/aria-label="Export Expedition Data \(JSON\)"/);
  assert.match(consoleSource,/if \(button\.dataset\.hexLogAction === "export"\)/);
  assert.match(consoleSource,/if \(!game\.user\?\.isGM\) return;/);
  assert.match(consoleSource,/exportExpeditionDataFromFoundry\(\)/);
  assert.doesNotMatch(consoleSource,/console\.log\(JSON\.stringify\(.*expedition.*\)\)/i);
});
