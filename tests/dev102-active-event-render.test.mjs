import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const js = fs.readFileSync(path.join(root, "src/engines/hex-travel/HexTravelConsole.js"), "utf8");

test("dev.102 imports the Event type constants used by active Event rendering", () => {
  const importMatch = js.match(/import \{([^}]+)\} from "\.\/HexExpeditionOutcome\.js";/);
  assert(importMatch, "HexExpeditionOutcome import must exist");
  const imported = importMatch[1].split(",").map(value => value.trim());
  assert(imported.includes("EXPEDITION_EVENT_TYPES"), "EXPEDITION_EVENT_TYPES must be imported");
  for (const key of ["MAJOR_COMPLICATION", "COMPLICATION", "QUIET_TRAVEL", "OPPORTUNITY"]) {
    assert(js.includes(`EXPEDITION_EVENT_TYPES.${key}`), `renderer must still classify ${key}`);
  }
});
