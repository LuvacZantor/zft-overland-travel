import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const consoleSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.111 Expedition Log chrome is Travel, Complications, Opportunities", () => {
  assert.match(consoleSource, /id="zft-hex-tab-travel"/);
  assert.match(consoleSource, /id="zft-hex-tab-complications"/);
  assert.match(consoleSource, /id="zft-hex-tab-opportunities"/);
  assert.doesNotMatch(consoleSource, /id="zft-hex-tab-events"/);
  assert.match(consoleSource, /if \(!\["travel", "complications", "opportunities"\]\.includes\(tab\)/);
  assert.match(css, /\.zft-hex-log-tabs \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
});

test("dev.111 removes visible Persistent Threat/Event workspace but preserves backend Threat architecture", () => {
  assert.doesNotMatch(consoleSource, /Persistent Threats/);
  assert.doesNotMatch(consoleSource, /data-hex-event-action=/);
  assert.doesNotMatch(consoleSource, /function renderEventLog\(/);
  assert.doesNotMatch(consoleSource, /function threatCardHtml\(/);
  assert.doesNotMatch(consoleSource, /cloneThreats/);
  assert.doesNotMatch(consoleSource, /createHexThreat/);
  const threatSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexThreatState.js", import.meta.url), "utf8");
  const runtimeSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexExpeditionRuntime.js", import.meta.url), "utf8");
  assert.match(threatSource, /export function createThreat/);
  assert.match(runtimeSource, /export async function createHexThreat/);
});

test("dev.111 engine-tab boundary remains while later builds may populate Complications", () => {
  assert.match(consoleSource, /function renderComplicationsWorkspace\(\)/);
  assert.match(consoleSource, /function renderOpportunitiesWorkspace\(\)/);
  assert.match(consoleSource, /Opportunity mechanics are not being invented ahead of their design pass/);
  assert.match(consoleSource, /data-hex-complication-cards/);
  assert.match(consoleSource, /data-hex-opportunity-cards/);
});
