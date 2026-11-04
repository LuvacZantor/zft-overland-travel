import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/zft-overland-travel.css", import.meta.url), "utf8");

test("dev.114 refreshes Complications workspace from saved state", () => {
  assert.match(source, /querySelector\("\[data-hex-complication-cards\]"\)/);
  assert.match(source, /const complicationMarkup = renderComplicationsWorkspace\(\)/);
  assert.match(source, /complicationCards\.innerHTML = complicationMarkup/);
});

test("dev.114 Event roll dialog reveals only the field required by the selected mode", () => {
  assert.match(source, /data-event-roll-field="exact" hidden/);
  assert.match(source, /data-event-roll-field="eventType" hidden/);
  assert.match(source, /exact\.hidden = mode !== "exact"/);
  assert.match(source, /eventType\.hidden = mode !== "eventType"/);
  assert.match(source, /addEventListener\("change", \(\) => refreshEventRollFields\(root\)\)/);
  assert.match(css, /\[data-event-roll-field\]\[hidden\] \{display:none !important;\}/);
});

test("dev.114 active Travel log can preview Navigation plus pending Reconnaissance and Support", () => {
  assert.match(source, /function activeExpeditionPreviewRecord\(/);
  assert.match(source, /navigation: navigationCompleted \? "completed" : "pending", reconnaissance: "pending", support: "pending"/);
  assert.match(source, /hexItem\.shared \?\? \(isCurrent \? activeExpeditionPreviewRecord\(record, id, number\) : null\)/);
  assert.match(source, /rolePhaseHtml\(record,"reconnaissance","Reconnaissance"/);
  assert.match(source, /rolePhaseHtml\(record,"support","Expedition Support"/);
});
