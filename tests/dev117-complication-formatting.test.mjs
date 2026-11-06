import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.117 scopes Complication presentation to the actual GM workflow window", () => {
  assert.match(css, /#zft-hex-travel-workflow-window \.zft-complication-detail-view/);
  assert.match(css, /#zft-hex-travel-workflow-window \.zft-complication-detail-meta/);
  assert.match(css, /#zft-hex-travel-workflow-window \.zft-complication-outcome-reference/);
  assert.doesNotMatch(css, /#zft-hex-travel-workflow \.zft-complication-detail-view/);
});

test("dev.117 separates Complication hierarchy and metadata instead of concatenated prose", () => {
  assert.match(source, /function complicationHeaderHtml\(/);
  assert.match(source, /function complicationContextHtml\(/);
  assert.match(source, /zft-complication-section-label/);
  assert.match(source, /<dl class="zft-complication-detail-meta">/);
  assert.match(source, /<dt>Reconnaissance<\/dt><dd>/);
  // Dev.126 narrowed metadata to Reconnaissance and calculated Mitigation.
  assert.match(source, /<dt>Mitigation<\/dt><dd>\$\{esc\(mitigation\)\}<\/dd>/);
  assert.doesNotMatch(source, /<dt>Threat Handoff<\/dt><dd>/);
});

test("dev.117+ keeps resolution focused and removes the redundant automatic exit action from details", () => {
  assert.match(source, /chooseComplicationAdjudication\(/);
  assert.match(source, /Outcome · GM Adjudication/);
  assert.match(source, /autoCancel: false/);
  assert.match(source, /options\.autoCancel !== false/);
  assert.match(source, /\/cancel\|close\|pause\|exit\|stop\/i/);
});
