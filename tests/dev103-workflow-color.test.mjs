import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const consoleSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const engineSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelEngine.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.103 promotes Current Step above Dashboard stat/result detail", () => {
  assert.match(consoleSource, /zft-hex-current-step is-phase-\$\{esc\(currentStep\.phase\)\}/);
  assert.match(consoleSource, /CURRENT STEP/);
  assert.match(consoleSource, /Resolve Reconnaissance/);
  assert.match(consoleSource, /Resolve Expedition Support/);
  assert.match(consoleSource, /Roll Event/);
  assert.ok(consoleSource.indexOf("zft-hex-current-step") < consoleSource.indexOf("zft-hex-stats-overview"));
  assert.doesNotMatch(consoleSource, /zft-hex-next-step \$\{nextStatus\}/);
});

test("dev.103 uses restrained phase accents and semantic role-grade color", () => {
  assert.match(consoleSource, /is-phase-navigation/);
  assert.match(consoleSource, /is-phase-\$\{esc\(phase\)\}/);
  assert.match(consoleSource, /is-grade-failed/);
  assert.match(css, /is-grade-failed[^}]*[\s\S]*?--zft-theme-failure/);
  assert.match(css, /is-grade-partial[^}]*[\s\S]*?#c6a35d/);
  assert.match(css, /is-phase-reconnaissance[^}]*#5f9f96/);
  assert.match(css, /is-phase-support[^}]*#927bb0/);
});

test("dev.103 gives Expedition Outcome tiles the Dashboard semantic state language", () => {
  assert.match(consoleSource, /expeditionQualityToneClass\(tq\)/);
  assert.match(consoleSource, /expeditionMomentumToneClass\(momentum\)/);
  assert.match(consoleSource, /expeditionEventToneClass\(event\)/);
  assert.match(css, /zft-hex-event-stage-grid > div\.is-state-positive/);
  assert.match(css, /zft-hex-event-stage-grid > div\.is-state-negative/);
  assert.match(css, /zft-hex-event-stage-grid > div\.is-state-warning/);
});

test("dev.103 New Travel Day wording separates daily allowance from unfinished-hex carryover", () => {
  assert.match(engineSource, /DAILY TRAVEL HOURS/);
  assert.match(engineSource, /h traveled on Day/);
  assert.match(engineSource, /begins with a fresh daily travel allowance/);
  assert.match(engineSource, /The active hex carries forward to Day/);
  assert.doesNotMatch(engineSource, /0h on Day/);
  assert.doesNotMatch(engineSource, /h used on Day/);
});
