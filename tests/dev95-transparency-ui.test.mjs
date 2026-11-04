import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const consoleSource = await readFile(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.95 Dashboard uses intentional Travel Quality point rows", () => {
  assert.match(consoleSource, /zft-hex-quality-point-list/);
  assert.match(consoleSource, /Success Points/);
  assert.match(consoleSource, /Failure Points/);
  assert.doesNotMatch(consoleSource, /THIS HEX · TRAVEL QUALITY<\/small><strong>\$\{esc\(qualityLabel\)\}<\/strong><em>/);
  assert.match(css, /zft-hex-quality-point-list/);
});

test("dev.95 Momentum separates Event modifier and persistence", () => {
  assert.match(consoleSource, /zft-hex-momentum-facts/);
  assert.match(consoleSource, /Event Roll Modifier/);
  assert.match(consoleSource, /Persistence/);
  assert.match(consoleSource, /Carries into the next hex/);
  assert.match(css, /zft-hex-momentum-facts/);
});

test("dev.95 transparency tooltips cover current state, staged travel, events, roles, and Forced March", () => {
  assert.match(consoleSource, /Travel Quality explanation/);
  assert.match(consoleSource, /Momentum Change explanation/);
  assert.match(consoleSource, /Expedition Momentum explanation/);
  assert.match(consoleSource, /Hex Travel Remaining/);
  assert.match(consoleSource, /Safe Travel Hours explanation/);
  assert.match(consoleSource, /Phase: \$\{esc\(rolePhase\)\}/);
  assert.match(consoleSource, /eventResultWithTooltip/);
  assert.match(consoleSource, /Final Event Result/);
  assert.match(consoleSource, /Forced March checks explanation/);
  assert.match(consoleSource, /Commit rule/);
  assert.match(css, /zft-hex-info-tooltip-pop/);
  assert.match(css, /:hover,:focus-visible/);
});
