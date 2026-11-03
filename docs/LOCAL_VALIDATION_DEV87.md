# Local Validation: 0.4.0-dev.87

**Date:** November 2, 2026.  
**Evidence level:** locally-validated.  
**Live Foundry acceptance:** NOT TESTED.  
**Source baseline:** `LuvacZantor/zft-overland-travel`, `feature/expedition-system`, `caccc9f1acd46b97f05c8e60813bfc7efc871fcc` (dev.86).  
**Owner-supplied baseline:** installed dev.86 ZIP with SHA256 `991e260ab9e77a14eb3a41c3f1b88bc777e92fbde35a38387b4beab17c81a884`.  
**GitHub status:** unchanged. No push, branch creation, merge, tag, release, or deployment.

## Automated checks

| Check | Result |
| --- | --- |
| Pure record tests | 14 passed, 0 failed |
| Real workflow with mocked Foundry/Midi ports | 18 passed, 0 failed |
| Total automated tests | 32 passed, 0 failed |
| JavaScript syntax | 42 files passed (40 runtime/reference JS plus 2 test MJS files) |
| Relative import targets | 103 checked; no missing paths |
| JSON/manifest | 2 JSON files valid; module ID, dev.87 version, runtime constant, and manifest references agree |
| Baseline preservation | All 74 GitHub files retained; original source, packs, assets, migration, and theme files checked byte for byte |
| Installed-only source | All 5 extra source files preserved byte for byte |
| Prior uploaded handoff | Retained verbatim as historical documentation |
| Manual ZIP | One `zft-overland-travel/` directory, complete file inventory, matching manifest/version, CRC and byte read-back checked during packaging |

Runtime used for local tests: Node v24.22.1. The exact passing commands are:

```sh
node tests/hex-records.test.mjs
node tests/hex-records-integration.test.mjs
```

JavaScript syntax was checked with `node --check` on every `.js` and `.mjs` file. The runtime did not accept `--experimental-default-type=module`; that unused invocation was corrected before delivery. The direct test commands above report all named subtests.

## What the tests exercise

Pure tests cover immutable context snapshots, independent read copies, repeated sequence IDs, cross-day accounting from actual committed segments, unrelated hex exclusion, completion guards, clock-reconciliation idempotence, manual interruption, legacy missing records, unknown-field preservation, invalid schema rejection, and diagnostic context.

Integration tests execute the production `launchHexTravel` function and production console handlers against deterministic external Foundry settings, Actors, Midi socket, dialogs, and Roll ports. They cover setup/review/resume/new-day cancellation; initial record checkpoint; exact saved GM overrides and delay dice; safe-hour completion; Forced March pause and actual hour adjudication; reuse of saved CON rolls; cross-day same-ID continuity without Navigation/travel rerolls; legacy continuation; clock response loss and subsequent reconciliation; both manual correction routes; both reset routes; Clear Log; player mutation rejection; and visible stale-ledger changes by another GM during Navigation or resume confirmation.

These are not live browser, Foundry server, remote-client, Dice So Nice, calendar, or Rest Recovery acceptance tests. Simulated stale-change checks do not establish distributed locking for simultaneous GM writes.

## Changed existing files

- `INTEGRATION_TEST_NOTES.md`
- `README.md`
- `docs/DEVELOPMENT_HANDOFF.md`
- `docs/DEVELOPMENT_STATUS.md`
- `module.json`
- `src/constants/module-constants.js`
- `src/engines/hex-travel/HexTravelConsole.js`
- `src/engines/hex-travel/HexTravelEngine.js`
- `src/main.js`

## New implementation and supporting files

- `docs/HEX_RECORDS.md`
- `docs/history/INSTALLED_DEV86_HANDOFF.md`
- `src/engines/hex-travel/HexTravelRecords.js`
- `tests/hex-records-integration.test.mjs`
- `tests/hex-records.test.mjs`
- `docs/LOCAL_VALIDATION_DEV87.md`

The five additional older source files came from the owner-supplied installed package and were preserved, not developed or activated by this build. Full baseline details and live test steps are in [HEX_RECORDS.md](HEX_RECORDS.md).

## Remaining live acceptance

Use a copied world, verify the actual core/system/module versions, and perform the checklist in HEX_RECORDS.md with GM and player clients. Verify original UI/theme/history behavior, optional clock/calendar/rest integration, and the current record before and after pause, refresh, New Travel Day, and completion. The established compatibility baseline remains V13.351 / D&D5e 5.2.5; this report makes no V14 verification claim.
