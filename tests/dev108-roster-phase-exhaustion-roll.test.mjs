import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const consoleSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const cssSource = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.108 phase-codes roster cards without changing their geometry", () => {
  assert.match(consoleSource, /function expeditionRolePhaseKey\(roleId\)/);
  assert.match(consoleSource, /is-phase-\$\{rolePhaseKey\}/);
  assert.match(cssSource, /zft-hex-roster-refined\.is-phase-navigation[\s\S]*--zft-roster-phase-color:var\(--zft-theme-navigationEdge/);
  assert.match(cssSource, /zft-hex-roster-refined\.is-phase-reconnaissance[\s\S]*--zft-roster-phase-color:#5f9f96/);
  assert.match(cssSource, /zft-hex-roster-refined\.is-phase-support[\s\S]*--zft-roster-phase-color:#927bb0/);
  assert.match(cssSource, /zft-hex-roster-refined\[class\*="is-phase-"\][\s\S]*box-shadow:inset 3px 0 0/);
});

test("dev.108 shows Exhaustion as a fixed upper-right level with body-level help", () => {
  assert.match(consoleSource, /function exhaustionHelpRows\(level\)/);
  assert.match(consoleSource, /\{ label: "D20 Tests", value: `−\$\{level \* 2\}` \}/);
  assert.match(consoleSource, /\{ label: "Speed", value: `−\$\{level \* 5\} ft\.` \}/);
  assert.match(consoleSource, /zft-hex-member-exhaustion-level zft-hex-dashboard-help-target/);
  assert.doesNotMatch(consoleSource, /const status = exhaustion \? `<span class="zft-hex-member-exhaustion">/);
  assert.match(cssSource, /zft-hex-member-exhaustion-level \{[\s\S]*position:absolute;top:5px;right:6px/);
  assert.match(cssSource, /zft-hex-roster-refined\.has-exhaustion \.zft-hex-member-heading > strong[\s\S]*padding-right:20px/);
});

test("dev.108 right-aligns the Roll column toward Result", () => {
  assert.match(cssSource, /zft-hex-role-log-columns span:nth-child\(2\) \{text-align:right;\}/);
  assert.match(cssSource, /zft-hex-role-log-roll \{justify-content:flex-end;\}/);
  assert.match(cssSource, /grid-template-columns:minmax\(0,1fr\) 38px 118px/);
});
