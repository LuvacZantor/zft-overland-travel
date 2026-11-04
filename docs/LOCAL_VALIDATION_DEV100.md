# Local Validation — ZFT Overland Travel 0.4.0-dev.100

**Date:** November 3, 2026  
**Evidence level:** locally validated only; not live Foundry acceptance.  
**Implementation baseline:** complete owner-reviewed `0.4.0-dev.99` manual-install package.  
**Remote reference:** `feature/expedition-system-1.1` remains at dev.97 checkpoint `5597f595a6dbda24732e68076f7445129dd0e859`; dev.100 is not pushed.

## Scope

- Split deterministic Travel Quality/Momentum preparation from the Event d20.
- Explicit GM **Roll Event** stage with persisted/reload-safe boundary.
- Roster role help moved to the existing body-level viewport-clamped overlay.
- Pending Momentum Change hierarchy simplified to `Pending` / `Awaiting Travel Quality`.
- Semantic state accents and red-to-green Momentum rail, without changing numeric Momentum mechanics.

## Automated evidence

- Full Node test suite before final packaging: **102/102 passed**.
- Added coverage for split preparation/Event persistence, runtime Event gating, primary Roll Event action, workflow stop/reload semantics, roster tooltip architecture, pending-state text, and semantic-color source contracts.

## Preservation

- Travel/clock/Forced March/Exhaustion mechanics are outside this change.
- Threat mechanics and downstream specialized engines are outside this change.
- Packs, assets, migration, themes, and `MountIronrotV413.source.js` must match dev.99 byte-for-byte at final packaging.

## Live acceptance

Use the dev.100 addendum at the top of `INTEGRATION_TEST_NOTES.md`. The critical live proof is that Support ends at saved Travel Quality/Momentum with **Roll Event** waiting, including after reload, and that roster help remains viewport-safe.

## Final static/package gate

- JavaScript/MJS syntax checks: **66 passed**.
- Relative imports resolved: **150**, **0 missing**.
- JSON/manifest parsing and runtime manifest references: passed.
- CSS structural braces: **1609 / 1609**.
- Version consistency: `module.json`, `MODULE_VERSION`, README and archive target all use `0.4.0-dev.100`.
- Protected `src/expeditions/mount-ironrot/MountIronrotV413.source.js` SHA-256: `9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425`.
- All **31** protected files under packs/assets/migration/themes match dev.99 byte-for-byte.
- Complete source tree before packaging: **121 files**.
