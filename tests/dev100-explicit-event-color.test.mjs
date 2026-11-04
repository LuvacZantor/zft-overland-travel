import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const js=fs.readFileSync(path.join(root,"src/engines/hex-travel/HexTravelConsole.js"),"utf8");
const workflow=fs.readFileSync(path.join(root,"src/engines/hex-travel/HexExpeditionWorkflow.js"),"utf8");
const primary=fs.readFileSync(path.join(root,"src/engines/hex-travel/HexTravelPrimaryAction.js"),"utf8");
const css=fs.readFileSync(path.join(root,"src/styles/zft-overland-travel.css"),"utf8");

test("dev.100 stops after Travel Quality/Momentum and exposes an explicit Roll Event action",()=>{
  assert(workflow.includes("resolveHexExpeditionPreparation"));
  assert(!workflow.includes("resolveHexExpeditionOutcome(recordId)"));
  assert(primary.includes('kind: "roll-event", label: "Roll Event"'));
  assert(js.includes('if (primary.kind === "roll-event")'));
  assert(js.includes('rollHexExpeditionEvent(primary.recordId')); // dev.113 may pass Event-roll control options
  assert(js.includes("Awaiting Event Roll"));
});

test("dev.100 pending Momentum text is subordinate instead of a large sentence",()=>{
  assert(js.includes(': "Pending";'));
  assert(js.includes(': "Awaiting Travel Quality";'));
  assert(!js.includes('"Awaiting current-hex Travel Quality"'));
});

test("dev.100 uses semantic state color without changing typography",()=>{
  assert(css.includes("v0.4.0-dev.100: explicit Event stage and semantic Expedition State color."));
  assert(css.includes("is-quality-successful"));
  assert(css.includes("is-quality-neutral"));
  assert(css.includes("is-quality-poor"));
  for (const state of ["deteriorating","risky","neutral","prepared","favored"]) assert(css.includes(`is-state-${state}`));
  assert(js.includes('class="is-state-${esc(state)}'));
});

test("dev.100 roster role help has no nested popup",()=>{
  assert(js.includes('zft-hex-role-tooltip zft-hex-dashboard-help-target'));
  assert(!js.includes('zft-hex-role-tooltip-pop" role="tooltip'));
  assert(!css.includes('.zft-hex-role-tooltip-pop {'));
  assert(css.includes('.zft-hex-role-tooltip[data-zft-dashboard-help]'));
});
