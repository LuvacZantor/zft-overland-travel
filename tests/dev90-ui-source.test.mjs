import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const consoleSource = await readFile(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url),"utf8");
const engineSource = await readFile(new URL("../src/engines/hex-travel/HexTravelEngine.js", import.meta.url),"utf8");

test("dev.90 dashboard and GM controls expose the staged/commit vocabulary",()=>{
  assert.match(consoleSource,/HEX TRAVEL REMAINING/);
  assert.doesNotMatch(consoleSource,/spanStat\("TRAVEL HOURS LEFT"/);
  assert.match(consoleSource,/data-hex-action="recovery"/);
  assert.doesNotMatch(consoleSource,/data-hex-action="resolve-roles"/);
  assert.match(consoleSource,/data-hex-player-visibility/);
  assert.match(consoleSource,/Start Travel/);
  assert.match(consoleSource,/Commit Travel/);
  assert.match(consoleSource,/Continue Travel/);
});

test("current staging preserves the dev.90 commit boundary while role progression is now manual",()=>{
  assert.doesNotMatch(engineSource,/resumeWorkflow\?\.\(hexCardId\)/);
  assert.match(engineSource,/Resolve Reconnaissance when ready/);
  const stageIndex=engineSource.indexOf("startHexRecord");
  const safeCommitIndex=engineSource.indexOf("const safe = Math.min",stageIndex);
  assert.ok(stageIndex>=0 && safeCommitIndex>stageIndex,"safe-hour commit remains in the later resume branch");
});

test("Events UI no longer exposes a normal Resolve Travel Outcome button or dev bridge wording",()=>{
  assert.doesNotMatch(consoleSource,/> Resolve Travel Outcome<\/button>/);
  assert.doesNotMatch(consoleSource,/dev\.89 bridge/);
  assert.match(consoleSource,/Record Event Resolution/);
});


test("Recovery is state-aware and cannot launch a duplicate normal workflow",()=>{
  assert.match(consoleSource,/const workflowRunning = this\.travelActive/);
  assert.match(consoleSource,/!workflowRunning && !!record && \(rolesPending \|\| preparationPending\)/);
  assert.match(consoleSource,/eventRollPending/);
  assert.match(consoleSource,/Use the normal Roll Event action/);
  assert.match(consoleSource,/The normal travel workflow is still active/);
});

test("player visibility uses an explicit dev.90 state instead of a legacy request timestamp",()=>{
  assert.match(consoleSource,/visible === true && Number\(showData\.requestedAt\) > 0/);
  assert.match(consoleSource,/visible === true && Number\(current\.requestedAt\) > 0/);
  assert.match(consoleSource,/data\.visible === true/);
});
