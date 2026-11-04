import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const consoleSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.104 assigns the primary GM travel button the same workflow phase identity as Current Step", () => {
  assert.match(consoleSource, /travelButton\.dataset\.hexPhase = primaryPhase \|\| "travel"/);
  assert.match(consoleSource, /primary\.kind === "start" \? "navigation"/);
  assert.match(consoleSource, /primary\.kind === "resolve-role" \? primary\.phase/);
  assert.match(consoleSource, /\["roll-event", "resolve-event"\]\.includes\(primary\.kind\) \? "event"/);
  assert.match(consoleSource, /primary\.kind === "continue"[^\n]*\? "forced" : "travel"/);
});

test("dev.104 primary action phase colors mirror the Current Step palette", () => {
  const pairs = [
    ["navigation", "var\\(--zft-theme-navigationEdge,#6d96a6\\)"],
    ["reconnaissance", "#5f9f96"],
    ["support", "#927bb0"],
    ["state", "#6fa68a"],
    ["event", "#d18450"],
    ["travel", "#6e9fbd"],
    ["forced", "var\\(--zft-theme-failure,#c96662\\)"]
  ];
  for (const [phase, value] of pairs) {
    assert.match(css, new RegExp(`zft-hex-current-step\\.is-phase-${phase}[^}]*${value}`));
    assert.match(css, new RegExp(`data-hex-phase="${phase}"\\][^}]*${value}`));
  }
});

test("dev.104 keeps phase color focused on the primary GM action", () => {
  assert.match(css, /button\[data-hex-action="travel"\][^{]*\{[^}]*--zft-primary-phase-color/);
  assert.match(css, /button\[data-hex-action="day"\]/);
  assert.match(css, /button\[data-hex-action="travel"\]:is\(:hover,:focus-visible\)/);
});
