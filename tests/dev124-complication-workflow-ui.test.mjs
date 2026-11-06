import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.124 Dashboard Current Step mirrors the active Complication identity and situation", () => {
  assert.match(source, /activeComplication\.category\.label/);
  assert.match(source, /activeComplication\.primaryType\.label/);
  assert.match(source, /context: activeComplication\.detail\.text/);
  assert.match(source, /zft-hex-current-step-context/);
  assert.match(source, /Resolve before Commit Travel/);
});

test("dev.124+ Details uses compact hierarchy instead of one long vertical stack", () => {
  // Dev.126 condensed the older layout while preserving the GM controls.
  assert.match(source, /zft-complication-guidance-list/);
  assert.match(source, /zft-complication-guidance-row/);
  assert.match(source, /zft-complication-consequence-chips/);
  assert.match(css, /zft-complication-detail-meta \{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /zft-resolution-outcome-list/);
  const finalCss = css.slice(css.lastIndexOf("/* dev.130:"));
  assert.match(finalCss, /grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /max-height:min\(82vh,820px\)/);
});

test("dev.124 Complication resolution is one GM-adjudication screen with outcome and consequence together", () => {
  assert.match(source, /async chooseComplicationAdjudication\(/);
  assert.match(source, /Outcome · GM Adjudication/);
  assert.match(source, /name="outcome"/);
  assert.match(source, /name="consequenceType"/);
  assert.match(source, /data-base-severity/);
  assert.match(source, /data-final-severity/);
  assert.match(source, /Apply Resolution/);
  assert.doesNotMatch(source, /chooseComplicationResolutionMethod/);
  assert.doesNotMatch(source, /Roll \/ Check/);
  assert.doesNotMatch(source, /rollControlledD20/);
  assert.match(source, /method: "direct"/);
});

test("dev.124 Operational Readiness checkbox has fixed custom geometry", () => {
  assert.match(css, /zft-complication-support-choice > input\[type="checkbox"\][\s\S]*?appearance:none !important/);
  assert.match(css, /inline-size:18px !important/);
  assert.match(css, /block-size:18px !important/);
  assert.match(css, /:checked::before \{transform:scale\(1\);\}/);
});
