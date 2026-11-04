import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.96 tooltip wrappers preserve surrounding typography", () => {
  assert.match(css, /\.zft-hex-info-tooltip[\s\S]*?font:inherit;color:inherit;line-height:inherit;letter-spacing:inherit/);
  assert.match(css, /zft-hex-info-tooltip-label[\s\S]*?font:inherit!important/);
  const repair = css.slice(css.indexOf("/* dev.96 cosmetic repair"));
  assert.doesNotMatch(repair, /zft-hex-stats-overview[^}]*font-size:10px/);
});

test("dev.96 summary-tile tooltip opens inside the dashboard instead of above the card", () => {
  assert.match(css, /zft-hex-stats-overview[\s\S]*?zft-hex-info-tooltip-pop[\s\S]*?top:calc\(100% \+ 5px\);bottom:auto/);
  assert.match(css, /zft-hex-stat:last-child[\s\S]*?right:-5px/);
});

test("dev.96 Momentum facts use full-width rows and cannot collapse labels vertically", () => {
  assert.match(css, /zft-hex-momentum-heading \{display:grid;grid-template-columns:1fr/);
  assert.match(css, /zft-hex-momentum-facts \{display:grid;grid-template-columns:1fr/);
  assert.match(css, /zft-hex-momentum-facts em \{font-size:9px[^}]*white-space:nowrap/);
  assert.doesNotMatch(css, /zft-hex-momentum-facts \{display:grid;gap:2px;min-width:145px/);
});

test("dev.96 restores readable dashboard transparency typography", () => {
  assert.match(css, /zft-hex-expedition-current strong,[\s\S]*?zft-hex-momentum-heading strong \{font-size:14px;/);
  assert.match(css, /zft-hex-quality-point-list em \{font-size:10px!important/);
  assert.match(css, /zft-hex-momentum-track small \{font-size:8px;/);
  assert.match(css, /zft-hex-event-chart \{font-size:8\.5px;/);
});
