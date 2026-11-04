import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const mainSource = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
const consoleSource = await readFile(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.92 refreshes the open Expedition roster for native Exhaustion effect lifecycle changes", () => {
  assert.match(mainSource, /Hooks\.on\("createActiveEffect", refreshForExhaustionEffect\)/);
  assert.match(mainSource, /Hooks\.on\("updateActiveEffect", refreshForExhaustionEffect\)/);
  assert.match(mainSource, /Hooks\.on\("deleteActiveEffect", refreshForExhaustionEffect\)/);
  assert.match(mainSource, /effect\.id === "dnd5eexhaustion0"/);
  assert.match(mainSource, /effect\.statuses\?\.has\?\.\("exhaustion"\)/);
  assert.match(mainSource, /actor\?\.type === "character" && isExhaustionEffect\(effect\)/);
});

test("dev.92 coalesces Actor/effect updates before refreshing the roster", () => {
  assert.match(mainSource, /const scheduleRosterRefresh = \(\) =>/);
  assert.match(mainSource, /clearTimeout\(rosterRefreshTimer\)/);
  assert.match(mainSource, /setTimeout\(\(\) => \{/);
  assert.match(mainSource, /HexTravelConsole\.refresh\(\)/);
  assert.match(mainSource, /Hooks\.on\("updateActor", actor => \{ if \(actor\?\.type === "character"\) scheduleRosterRefresh\(\); \}\)/);
});

test("dev.92 Exhaustion refresh behavior survives the current compact status presentation", () => {
  assert.match(consoleSource, /zft-hex-member-exhaustion-level/);
  assert.match(consoleSource, /exhaustionDisplayLevel\(actor\)/);
  assert.doesNotMatch(consoleSource, /const status = exhaustion \? `<span class="zft-hex-member-exhaustion">/);
  assert.match(css, /zft-hex-member-exhaustion-level[^\{]*\{[\s\S]*?position:absolute/);
});

test("dev.92 gives point totals their own clean line without a POINTS label", () => {
  assert.match(consoleSource, /Success Point/);
  assert.match(consoleSource, /Failure Point/);
  assert.match(consoleSource, /zft-hex-role-log-points/);
  assert.doesNotMatch(consoleSource, /<b>POINTS<\/b>/);
  assert.match(css, /zft-hex-role-log-points/);
});
