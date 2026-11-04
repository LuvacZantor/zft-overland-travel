import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const consoleSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const engineSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelEngine.js", import.meta.url), "utf8");
const roleChecks = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelRoleChecks.js", import.meta.url), "utf8");
const roleResolution = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelRoleResolution.js", import.meta.url), "utf8");

const cssSource = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.107 presents a paused Forced March as an explicit Travel Decision", () => {
  assert.match(consoleSource, /pausedTravelDecision = \["Travel paused", "Travel stopped"\]/);
  assert.match(consoleSource, /title: "Travel Decision"/);
  assert.match(consoleSource, /Continue Travel = Forced March/);
  assert.match(consoleSource, /New Travel Day = carry \$\{pending\}h forward with a fresh daily allowance/);
});

test("dev.107 removes routine purple informational Foundry notifications from the modern workflow", () => {
  for (const source of [consoleSource, engineSource, roleChecks, roleResolution]) {
    assert.doesNotMatch(source, /ui\.notifications(?:\?\.)?\.info/);
  }
  assert.match(engineSource, /ui\.notifications\.warn/);
  assert.match(consoleSource, /ui\.notifications\.error/);
});

test("dev.107 retains non-toast console diagnostics for formerly informational workflow messages", () => {
  assert.match(engineSource, /console\.info\("\[ZFT\]\[HexTravel\]"/);
  assert.match(consoleSource, /console\.info\("\[ZFT\]\[HexTravel\]"/);
});


test("dev.107 keeps expedition role totals inside the d20 and protects the Roll column", () => {
  assert.match(cssSource, /zft-hex-role-log-columns,\s*#zft-hex-travel-log \.zft-hex-role-log-row \{\s*grid-template-columns:minmax\(0,1fr\) 38px 118px/);
  assert.match(cssSource, /zft-hex-role-log-roll \.zft-hex-d20-total \{[\s\S]*display:inline-grid;place-items:center;position:relative;width:30px;height:30px/);
  assert.match(cssSource, /zft-hex-role-log-roll \.zft-hex-d20-total > \.zft-hex-die-icon \{[\s\S]*position:absolute;inset:0;width:30px!important;height:30px!important/);
  assert.match(cssSource, /zft-hex-role-log-roll \.zft-hex-d20-total > strong \{[\s\S]*color:#fff!important;font-size:12px!important/);
  assert.match(cssSource, /zft-hex-role-log-verdict \{\s*min-width:0;max-width:118px;overflow-wrap:anywhere/);
});
