import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/engines/hex-travel/HexTravelConsole.js", import.meta.url), "utf8");

test("dev.115 routes Complication card actions from Expedition Log to existing handlers", () => {
  assert.match(source, /const complicationAction = event\.target\.closest\('button\[data-hex-action="complication-details"\], button\[data-hex-action="complication-resolve"\]'\)/);
  assert.match(source, /if \(complicationAction && this\.logElement\?\.contains\(complicationAction\)\) \{[\s\S]*?return void this\.click\(event\);[\s\S]*?\}/);
  assert.match(source, /const complicationDetails = event\.target\.closest\('\[data-hex-action="complication-details"\]'\)/);
  assert.match(source, /const complicationResolve = event\.target\.closest\('\[data-hex-action="complication-resolve"\]'\)/);
  assert.match(source, /recordComplicationResolution\(complicationResolve\.dataset\.recordId\)/);
});
