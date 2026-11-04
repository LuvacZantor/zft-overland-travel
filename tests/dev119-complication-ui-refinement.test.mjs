import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.119 removes duplicated Situation prose and makes the specific complication the focal text", () => {
  assert.doesNotMatch(source, /const detail = String\(complication\?\.detail\?\.text/);
  assert.match(source, /The problem is contained but prevents clean progress until the expedition addresses it\./);
  assert.match(css, /zft-complication-situation-title,[\s\S]*?font-size:19px/);
  assert.match(css, /zft-complication-detail-view h4,[\s\S]*?font:700 18px/);
});

test("dev.119 uses readable metadata rows and subtly tinted outcome guidance", () => {
  assert.match(css, /zft-complication-detail-meta > div \{[\s\S]*?grid-template-columns:150px minmax\(0,1fr\)/);
  assert.match(css, /is-strongSuccess[^}]*background:color-mix/);
  assert.match(css, /is-majorFailure[^}]*background:color-mix/);
});

test("dev.119 keeps the Complication Log as a compact summary with explicit label-value rows", () => {
  assert.match(source, /<dl class="zft-complication-summary-list">/);
  assert.match(source, /<dt>Reconnaissance<\/dt><dd>/);
  assert.match(source, /<dt>Outcome<\/dt><dd>/);
  assert.match(source, /<section class="zft-complication-resolution-note"><span>GM Resolution<\/span><p>/);
  assert.match(css, /zft-complication-detail \{[^}]*font-size:14px[^}]*font-weight:750/);
  assert.match(css, /zft-complication-actions button \{[^}]*min-height:28px/);
});

test("dev.119 preserves two-column roster at normal Dashboard widths", () => {
  assert.match(css, /data-hex-card="party"[^\n]*\.zft-hex-party-list \{\n  grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@container \(max-width:240px\)/);
});
