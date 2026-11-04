import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.118+ keeps Complication typography out of the micro-text range", () => {
  assert.match(css, /zft-complication-detail-view h4,[\s\S]*?font:700 18px\/1\.25 Georgia/);
  assert.match(css, /zft-complication-situation-title,[\s\S]*?font-size:19px/);
  assert.match(css, /zft-complication-detail-situation p,[\s\S]*?font-size:14px/);
  assert.match(css, /zft-complication-detail-meta dd \{[^}]*font-size:14px/);
  assert.match(css, /zft-complication-outcome-reference strong \{[^}]*font-size:13\.5px/);
  assert.match(css, /zft-complication-outcome-reference span \{[^}]*font-size:13px/);
});

test("dev.118+ gives metadata and outcomes distinct visual hierarchy", () => {
  assert.match(css, /zft-complication-detail-meta \{[\s\S]*?display:grid/);
  assert.match(css, /zft-complication-detail-meta > div \{[\s\S]*?grid-template-columns:150px minmax\(0,1fr\)/);
  assert.match(css, /zft-complication-detail-situation \{border-left:4px solid/);
  assert.match(css, /zft-complication-outcome-reference > :is\(\.is-strongSuccess,\.is-success\) strong/);
  assert.match(css, /zft-complication-outcome-reference > :is\(\.is-failure,\.is-majorFailure\) strong/);
});

test("dev.118+ keeps the Complication dialogs wide enough for readable type", () => {
  assert.match(source, /title: "Complication Details" \}, position: \{ width: 760 \}/);
  assert.match(source, /title: "Resolve Complication" \}, position: \{ width: 720 \}/);
});
