import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const js=fs.readFileSync(path.join(root,"src/engines/hex-travel/HexTravelConsole.js"),"utf8");
const css=fs.readFileSync(path.join(root,"src/styles/zft-overland-travel.css"),"utf8");

test("dev.101 Dashboard adds current Event state and removes the permanent Event chart",()=>{
  assert(js.includes("THIS HEX · EVENT"));
  assert(js.includes('activeRecord?.momentum ? "Awaiting Event Roll" : "Pending"'));
  assert(js.includes("Use Roll Event when the table is ready"));
  assert(!js.includes('class="zft-hex-event-chart"'));
  assert(css.includes("zft-hex-expedition-event"));
  assert(!css.includes("#zft-hex-travel-console .zft-hex-event-chart"));
});

test("dev.101 Event help owns the d20 bands and current roll detail",()=>{
  for (const band of ["1–5","6–10","11–15","16–20"]) assert(js.includes(`{ label: "${band}"`));
  assert(js.includes('{ label: "Raw d20", value: String(activeEvent.raw) }'));
  assert(js.includes('{ label: "Final", value: String(activeEvent.final) }'));
  assert(js.includes('{ label: "Resolution", value: eventResolutionLabel(activeRecord) }'));
});

test("dev.101 Event state uses semantic color without changing Event probability mechanics",()=>{
  for (const state of ["is-event-major","is-event-complication","is-event-quiet","is-event-opportunity","is-event-pending"]) assert(css.includes(state));
  assert(js.includes('EXPEDITION_EVENT_TYPES.MAJOR_COMPLICATION ? "is-event-major"'));
  assert(js.includes('EXPEDITION_EVENT_TYPES.OPPORTUNITY ? "is-event-opportunity"'));
});
