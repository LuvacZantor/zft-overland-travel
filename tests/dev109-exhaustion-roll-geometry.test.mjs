import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const consoleSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const cssSource = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.109 gives Exhaustion a severity class without replacing the roster phase identity", () => {
  assert.match(consoleSource, /const exhaustionSeverity = exhaustion \? Math\.max\(1, Math\.min\(6, Number\(exhaustion\) \|\| 1\)\) : 0/);
  assert.match(consoleSource, /has-exhaustion is-exhaustion-\$\{exhaustionSeverity\}/);
  assert.match(consoleSource, /data-zft-exhaustion-level="\$\{exhaustionSeverity\}"/);
  assert.match(cssSource, /zft-hex-roster-refined\.has-exhaustion[\s\S]*linear-gradient\(var\(--zft-exhaustion-overlay/);
  assert.match(cssSource, /box-shadow:inset 3px 0 0 color-mix\(in srgb,var\(--zft-roster-phase-color/);
});

test("dev.109 uses a compact red-tinted Exhaustion help card whose intensity follows level", () => {
  assert.match(consoleSource, /target\.dataset\.zftExhaustionLevel/);
  assert.match(consoleSource, /tooltip\.classList\.add\("is-exhaustion-help", `is-exhaustion-\$\{exhaustionLevel\}`\)/);
  assert.match(cssSource, /is-exhaustion-1 \{--zft-exhaustion-tone:#d78787;--zft-exhaustion-overlay:rgba\(184,54,54,\.045\);\}/);
  assert.match(cssSource, /is-exhaustion-6 \{--zft-exhaustion-tone:#f32323;--zft-exhaustion-overlay:rgba\(244,25,25,\.27\);\}/);
  assert.match(cssSource, /zft-hex-dashboard-help-tooltip\.is-exhaustion-help \{[\s\S]*width:min\(218px/);
  assert.match(cssSource, /zft-hex-dashboard-help-tooltip\.is-exhaustion-help dd \{font-weight:800;color:var\(--zft-exhaustion-tone/);
});

test("dev.109 tightens the actual Roll and Result column geometry", () => {
  assert.match(cssSource, /grid-template-columns:minmax\(0,1fr\) 32px 96px;[\s\S]*gap:5px/);
  assert.match(cssSource, /zft-hex-role-log-roll \{[\s\S]*min-width:32px;[\s\S]*width:32px;[\s\S]*justify-content:flex-end/);
  assert.match(cssSource, /zft-hex-role-log-verdict \{max-width:96px;\}/);
  assert.match(cssSource, /grid-template-columns:minmax\(0,1fr\) 30px 90px;[\s\S]*gap:4px/);
});
