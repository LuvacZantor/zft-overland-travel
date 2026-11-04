import test from "node:test";
import assert from "node:assert/strict";
import { hexHistoryDefaultOpen } from "../src/engines/hex-travel/HexTravelConsole.js";

test("dev.105 keeps active/incomplete hex work open", () => {
  assert.equal(hexHistoryDefaultOpen({ isCurrent: true, isLatest: true, complete: false }), true);
  assert.equal(hexHistoryDefaultOpen({ isCurrent: false, isLatest: true, complete: false }), true);
});

test("dev.105 keeps completed hex history collapsed by default", () => {
  assert.equal(hexHistoryDefaultOpen({ isCurrent: false, isLatest: true, complete: true }), false);
  assert.equal(hexHistoryDefaultOpen({ isCurrent: false, isLatest: false, complete: true }), false);
});
