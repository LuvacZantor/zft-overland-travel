import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.126 Details keeps Situation primary and reduces metadata to Reconnaissance plus Mitigation", () => {
  assert.match(source, /zft-complication-detail-situation/);
  assert.match(source, /<dt>Reconnaissance<\/dt>/);
  assert.match(source, /<dt>Mitigation<\/dt>/);
  assert.doesNotMatch(source, /<dt>Threat Handoff<\/dt>/);
  assert.match(source, /Operational Readiness · optional -1 Severity/);
  assert.match(source, /Unavailable this hex/);
  assert.match(css, /zft-complication-detail-meta \{[\s\S]*?repeat\(2,minmax\(0,1fr\)\)/);
});

test("dev.126 Recovery and Suggested Response are a vertical guidance list rather than side-by-side cards", () => {
  assert.match(source, /zft-complication-guidance-list/);
  assert.match(source, /zft-complication-guidance-row/);
  assert.match(source, /Recovery Objective/);
  assert.match(source, /Suggested Response/);
  assert.match(css, /zft-complication-guidance-list/);
  assert.match(css, /zft-complication-guidance-row/);
  assert.doesNotMatch(source, /zft-complication-detail-guidance-grid/);
});

test("dev.126 Allowed Consequences is compact and Threat remains selectable there when allowed", () => {
  assert.match(source, /zft-complication-allowed-row/);
  assert.match(source, /Allowed Consequences/);
  assert.match(source, /def\.allowedConsequences/);
  assert.match(css, /zft-complication-allowed-row/);
});

test("dev.126 Outcome Guidance remains present but uses a denser decision-reference layout", () => {
  assert.match(source, /Outcome Guidance/);
  const finalCss=css.slice(css.lastIndexOf("/* dev.130:"));
  assert.match(finalCss, /zft-resolution-outcome-list/);
  assert.match(finalCss, /display:flex;flex-wrap:wrap/);
  assert.match(css, /max-height:min\(82vh,820px\)/);
});
