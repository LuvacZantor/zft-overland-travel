import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const consoleSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.122 GM controls return to two readable columns without shrinking labels", () => {
  assert.match(css,/zft-hex-gm > \.zft-hex-actions \{\n  display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(css,/zft-hex-gm > \.zft-hex-actions \{\n  display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(css,/button\[data-hex-action="clear-log"\] \{grid-column:span 2;\}/);
  assert.match(css,/min-height:30px;padding:5px 7px;font-size:11px/);
});

test("dev.122 all reset and clear actions carry the danger treatment", () => {
  assert.match(consoleSource,/data-hex-action="reset-current" class="zft-hex-danger"/);
  assert.match(consoleSource,/data-hex-action="reset" class="zft-hex-danger"/);
  assert.match(consoleSource,/data-hex-action="clear-log" class="zft-hex-danger"/);
  assert.match(consoleSource,/zft-hex-card-title red[^>]*><i class="fa-solid fa-triangle-exclamation"[^>]*><\/i> Reset Current Travel/);
});

test("dev.122 Show to Players remains in the GM controls header", () => {
  assert.match(consoleSource,/zft-hex-workflow-head[\s\S]*data-hex-action="show-players"[\s\S]*Show to Players/);
});
