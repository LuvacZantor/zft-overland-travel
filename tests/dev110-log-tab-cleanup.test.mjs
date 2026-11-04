import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const consoleSource = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");

test("dev.110 permanent boundary: redundant Roles log tab stays removed while role assignment and Travel history remain", () => {
  assert.doesNotMatch(consoleSource, /id="zft-hex-tab-roles"/);
  assert.doesNotMatch(consoleSource, /data-hex-log-panel="roles"/);
  assert.doesNotMatch(consoleSource, /data-hex-role-cards/);
  assert.doesNotMatch(consoleSource, /function renderRoleLog\(/);
  assert.match(consoleSource, /data-hex-action="roles"/);
  assert.match(consoleSource, /function expeditionHexHistoryHtml\(record\)/);
  assert.match(consoleSource, /rolePhaseHtml\(record,"reconnaissance","Reconnaissance"/);
  assert.match(consoleSource, /rolePhaseHtml\(record,"support","Expedition Support"/);
});
