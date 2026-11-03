import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const consoleSource=await readFile(new URL("../src/engines/hex-travel/HexTravelConsole.js",import.meta.url),"utf8");
const engineSource=await readFile(new URL("../src/engines/hex-travel/HexTravelEngine.js",import.meta.url),"utf8");
const roleSource=await readFile(new URL("../src/engines/hex-travel/HexTravelRoleResolution.js",import.meta.url),"utf8");
const css=await readFile(new URL("../src/styles/zft-overland-travel.css",import.meta.url),"utf8");

test("dev.91 dashboard repeats Travel Quality and Momentum and uses a two-column roster",()=>{
  assert.match(consoleSource,/EXPEDITION STATE/);
  assert.match(consoleSource,/TRAVEL QUALITY/);
  assert.match(consoleSource,/MOMENTUM/);
  assert.match(css,/data-hex-card="party"[^\n]*\.zft-hex-party-list/);
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test("dev.91 role log has explicit Roll/Result columns and point totals while retaining die totals",()=>{
  assert.match(consoleSource,/CHARACTER \/ CHECK/);
  assert.match(consoleSource,/>ROLL</);
  assert.match(consoleSource,/>RESULT</);
  assert.match(consoleSource,/rolePointSummary/);
  assert.match(consoleSource,/hexTravelD20Total/);
});

test("dev.91 restores selectable rerolls for Navigation and paired role adjudication",()=>{
  assert.match(engineSource,/Re-roll Check/);
  assert.match(engineSource,/Submit Navigation Rulings/);
  assert.match(roleSource,/Re-roll Check/);
  assert.match(roleSource,/Submit Role Rulings/);
});

test("dev.91 primary travel control does not silently disable a Commit-looking button",()=>{
  assert.match(consoleSource,/primaryHexTravelAction/);
  assert.match(consoleSource,/travelButton\.disabled = false/);
  assert.match(consoleSource,/Use Recovery if the automatic workflow was interrupted/);
});
