import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const js = fs.readFileSync(path.join(root, "src/engines/hex-travel/HexTravelConsole.js"), "utf8");
const css = fs.readFileSync(path.join(root, "src/styles/zft-overland-travel.css"), "utf8");
let pass = 0;
function check(name, fn){ fn(); pass++; console.log(`PASS ${name}`); }
check("generic dev95 dashboard tooltip helper removed", () => assert(!js.includes("function infoTooltip(")));
check("hex remaining restored to plain stat", () => assert(js.includes('spanStat("HEX TRAVEL REMAINING", pending > 0 ? `${pending}h` : "—", pending > 0 ? "amber" : "")')));
check("dev94 travel quality markup restored", () => assert(js.includes('<span><small>THIS HEX · TRAVEL QUALITY</small><strong>${esc(qualityLabel)}</strong><em>${esc(qualityDetail)}</em></span>')));
check("dev94 momentum heading restored", () => assert(js.includes('${esc(momentumModifierText)} to Event Roll · Carries into the next hex')));
check("dev95 tooltip CSS removed", () => assert(!css.includes("v0.4.0-dev.95: transparency tooltips")));
check("dev96 repair CSS removed", () => assert(!css.includes("dev.96 cosmetic repair")));
check("dev94 state styling retained", () => assert(css.includes("v0.4.0-dev.94: manual role-stage progression, richer dashboard state, and structured help.")));
console.log(`TOTAL ${pass} PASS`);
