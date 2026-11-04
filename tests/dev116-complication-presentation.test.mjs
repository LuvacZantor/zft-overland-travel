import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.116 keeps the Complication Log card concise and moves full content to View Details", () => {
  assert.match(source, /data-hex-action="complication-details"/);
  assert.match(source, /> View Details<\/button>/);
  assert.doesNotMatch(source, /> Open Content<\/button>/);
  assert.doesNotMatch(source, /zft-complication-scope/);
  assert.doesNotMatch(source, /d8 Detail <strong>/);
  assert.match(source, /function complicationDetailHtml\(/);
  assert.match(source, /Suggested Response/);
  assert.match(source, /Outcome Guidance/);
  assert.match(source, /Operational Readiness/);
  assert.match(source, /Threat/);
});

test("dev.116 View Details uses ZFT rendering rather than opening the Journal sheet", () => {
  assert.match(source, /async showComplicationDetails\(recordId\)/);
  assert.match(source, /window: \{ title: "Complication Details" \}/);
  assert.match(source, /content: complicationDetailHtml\(complication\)/);
  assert.doesNotMatch(source, /openPrototypeComplicationJournal/);
});

test("dev.116 resolution uses selectable outcome cards instead of visible radio controls", () => {
  assert.match(source, /function complicationOutcomeGuideHtml\(/);
  assert.match(source, /zft-complication-outcome-card/);
  assert.match(source, /Outcome · GM Adjudication/);
  assert.match(css, /#zft-hex-travel-workflow-window \.zft-complication-outcome-card input \{position:absolute;opacity:0;pointer-events:none;\}/);
  assert.match(css, /zft-complication-outcome-card input:checked \+ span/);
  assert.match(css, /zft-complication-detail-view/);
});
