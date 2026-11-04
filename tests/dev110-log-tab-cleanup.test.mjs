import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const consoleSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.110 removes the redundant Roles log tab while preserving role assignment and Travel history", () => {
  assert.doesNotMatch(consoleSource, /id="zft-hex-tab-roles"/);
  assert.doesNotMatch(consoleSource, /data-hex-log-panel="roles"/);
  assert.doesNotMatch(consoleSource, /data-hex-role-cards/);
  assert.doesNotMatch(consoleSource, /function renderRoleLog\(/);
  assert.match(consoleSource, /data-hex-action="roles"/);
  assert.match(consoleSource, /function expeditionHexHistoryHtml\(record\)/);
  assert.match(consoleSource, /rolePhaseHtml\(record,"reconnaissance","Reconnaissance"/);
  assert.match(consoleSource, /rolePhaseHtml\(record,"support","Expedition Support"/);
});

test("dev.110 keeps Events for persistent Threats but removes duplicate per-hex outcome cards", () => {
  assert.match(consoleSource, /id="zft-hex-tab-events"/);
  assert.match(consoleSource, /function renderEventLog\(storeValue\)/);
  assert.match(consoleSource, /Persistent Threats/);
  assert.match(consoleSource, /data-hex-event-action="threat-add"/);
  assert.match(consoleSource, /data-hex-event-action="threat-advance"/);
  assert.match(consoleSource, /data-hex-event-action="threat-reduce"/);
  assert.match(consoleSource, /data-hex-event-action="threat-resolve"/);
  assert.doesNotMatch(consoleSource, /function eventRecordHtml\(record\)/);
  assert.doesNotMatch(consoleSource, /zft-hex-event-records/);
  assert.match(consoleSource, /return `<div class="zft-hex-event-log-feed">\$\{threatSection\}<\/div>`;/);
});

test("dev.110 log chrome is now the two authoritative surfaces: Travel and Events", () => {
  assert.match(consoleSource, /if \(!\["travel", "events"\]\.includes\(tab\)/);
  assert.match(css, /\.zft-hex-log-tabs \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});
