# Local Validation: 0.4.0-dev.88

**Date:** November 2, 2026.  
**Evidence level:** locally-validated.  
**Live Foundry acceptance:** NOT TESTED.  
**Remote GitHub baseline:** `LuvacZantor/zft-overland-travel`, `feature/expedition-system`, `caccc9f1acd46b97f05c8e60813bfc7efc871fcc` (dev.86).  
**Local source baseline:** complete `0.4.0-dev.87` manual-install package, SHA256 `13590a2b16b23900d54a78d12625c46cdeb25c8e55eeb60593df88560d4b8ee0`.  
**Owner-uploaded dev.87 comparison:** file contents matched the preserved dev.87 tree; ZIP metadata/compression differed.  
**GitHub status:** unchanged. No push, branch creation, merge, tag, release, or deployment.

## Development scope

Dev.88 completes the remaining two current Expedition role pairs without connecting later expedition engines:

- Reconnaissance: Scout = Dexterity (Stealth), Tracker = Intelligence (Investigation).
- Expedition Support: Forager = Wisdom (Survival), Coordinator = Charisma (Persuasion).
- Each pair reads the frozen party, assignments, and DC from the shared dev.87 hex record.
- Present assigned characters roll their fixed checks together; the GM reviews each result independently and may use the roll or override it to Success/Failure.
- Original totals and rolled outcomes remain stored even when the GM overrides the effective outcome.
- Unassigned and assigned-but-absent roles do not receive invented rolls or automatic failures.
- Results are saved into that same shared record and displayed on the Expedition Log Roles tab.
- Travel Quality, Momentum, Event, Threat, Discovery, Complication, Encounter, travel hours, world clock, Forced March, Exhaustion, supplies, and rest behavior are unchanged.

## Automated checks

| Check | Result |
| --- | --- |
| Total automated tests | 42 passed, 0 failed |
| JavaScript / MJS syntax | 46 files passed |
| Relative import targets | 113 checked; no missing paths |
| JSON/manifest parse | 2 JSON files valid |
| Version consistency | `module.json` and runtime module constant both use `0.4.0-dev.88`; current README/handoff identify dev.88 |
| Protected original source | `MountIronrotV413.source.js` SHA256 unchanged: `9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425` |
| Preserved inactive role-check source | `HexTravelRoleChecks.js` SHA256 unchanged: `5a0360772d5dd598e7839b93818434872a419f5275e9e7d18f4dc8498bd9515a` |
| Packs and assets | Byte-for-byte unchanged from dev.87 |
| Module files before packaging | 90 files after this validation report is included |

Runtime used for local tests: Node v22.16.0.

The full suite was executed with:

```sh
node --test tests/*.test.mjs
```

JavaScript syntax was checked with `node --check` on every `.js` and `.mjs` file. Relative static import targets were enumerated and verified against the complete source tree. Every JSON file was parsed.

## What the new dev.88 tests exercise

The new pure role-resolution tests cover phase initialization, frozen context/DC use, assigned-but-absent handling, preservation of original roll evidence under GM overrides, pair grading, isolated phase persistence, compatibility with dev.87 records whose role phases are still `notImplemented`, and rejection of late resolution on interrupted records.

The new runtime integration tests execute the production role-resolution workflow against mocked Foundry/Midi ports. They verify that Reconnaissance and Expedition Support are written into the same shared record without changing day, hours, pending hours, completed hex count, active hex identity, or unrelated ledger data; that effective GM overrides are saved; and that canceling GM review after native rolls writes no role result.

The complete pre-existing dev.87 record/integration suite also passes, covering cancellation, Navigation, delays, stale GM changes, safe-hour travel, Forced March, cross-day continuation, clock reconciliation, manual correction/reset, Clear Log, player mutation rejection, legacy sequences, immutable record context, and schema safety.

These tests are simulated/local evidence. They do not establish live Foundry client behavior, real Midi-QOL remote rolls, Dice So Nice timing, multi-client synchronization, Calendaria, Rest Recovery, or V14 compatibility.

## Changed existing files relative to dev.87

- `INTEGRATION_TEST_NOTES.md`
- `README.md`
- `docs/DEVELOPMENT_HANDOFF.md`
- `docs/DEVELOPMENT_STATUS.md`
- `docs/HEX_RECORDS.md`
- `module.json`
- `src/constants/module-constants.js`
- `src/engines/hex-travel/HexTravelConsole.js`
- `src/engines/hex-travel/HexTravelRecords.js`
- `src/engines/hex-travel/HexTravelRoles.js`
- `src/styles/zft-overland-travel.css`
- `tests/hex-records-integration.test.mjs`
- `tests/hex-records.test.mjs`

## New dev.88 files

- `src/engines/hex-travel/HexExpeditionRoleResolution.js`
- `src/engines/hex-travel/HexTravelRoleResolution.js`
- `tests/hex-role-resolution-integration.test.mjs`
- `tests/hex-role-resolution.test.mjs`
- `docs/LOCAL_VALIDATION_DEV88.md`

## Remaining live acceptance

Test on the established production-maintenance target: Foundry V13.351 / D&D5e 5.2.5, with the actually installed Midi-QOL version and both GM/player clients. Follow the dev.88 checklist at the top of `INTEGRATION_TEST_NOTES.md`. V14 remains unverified and is not claimed by this build.
