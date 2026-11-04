import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const consoleSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.106 removes the duplicate upper Navigation roll presentation while keeping Travel Time", () => {
  assert.doesNotMatch(consoleSource, /<section class="zft-hex-time-navigation"/);
  assert.match(consoleSource, /aria-label="Travel dice and duration"/);
  assert.match(consoleSource, /<h4><i class="fa-solid fa-dice"[^>]*><\/i> Travel Time<\/h4>/);
});

test("dev.106 keeps Navigation-derived duration evidence in Travel Time", () => {
  assert.match(consoleSource, /Guide navigation delay/);
  assert.match(consoleSource, /Vanguard obstacle delay/);
  assert.match(consoleSource, /legacySecondary/);
  assert.match(consoleSource, /Original roll detail/);
});

test("dev.106 moves Navigation DC context to the authoritative lower role phase", () => {
  assert.match(consoleSource, /const navDCLabel = Number\.isFinite\(Number\(nav\.dc\)\) \? `DC \$\{Number\(nav\.dc\)\}` : "";/);
  assert.equal((consoleSource.match(/rolePhaseHeader\("Navigation", navGrade, navPoints, navDCLabel\)/g) ?? []).length, 1);
  assert.match(consoleSource, /zft-hex-role-log-phase-title/);
  assert.match(css, /\.zft-hex-role-log-phase-title > small/);
});
