# ZFT Overland Travel 0.4.0-dev.92 | Local Validation

**Date:** 2026-11-03  
**Evidence level:** locally validated only; not live Foundry acceptance.  
**Live target for owner testing:** Foundry V13.351 / D&D5e 5.2.5.  
**Implementation baseline:** complete local `0.4.0-dev.91` manual-install package.  
**Remote checkpoint:** `feature/expedition-system-1.1` remains frozen at `fca67c46e7c1ca5921a031645c9d9fa99063b469` (`0.4.0-dev.88`). No GitHub write was performed.

## Scope

Dev.92 addresses two owner-reported live presentation/state-sync problems from dev.91 without changing travel mechanics:

- the Expedition Roster now refreshes after character Actor updates and native D&D5e Exhaustion ActiveEffect create/update/delete events, so Long Rest exhaustion changes can appear without another travel action;
- Actor/effect refreshes are debounced to wait for the settled document state and avoid repeated intermediate workspace redraws;
- roster Exhaustion is a single full-card footer line (`Exhaustion N · penalty`), absent when Exhaustion is zero;
- Navigation, Reconnaissance, and Expedition Support point totals are on a dedicated full-width line below each phase heading, with singular/plural `Success Point(s)` / `Failure Point(s)` wording and no separate POINTS label;
- existing d20 icons/totals and CHARACTER / CHECK, ROLL, RESULT columns are retained.

## Automated regression

Command:

```sh
node --test tests/*.test.mjs
```

Result: **84/84 passed**, 0 failed, 0 skipped.

New dev.92 coverage checks:

- Exhaustion ActiveEffect create/update/delete hook registration;
- native D&D5e Exhaustion effect identification and character scoping;
- coalesced Actor/effect refresh scheduling;
- compact one-line roster Exhaustion presentation;
- dedicated role-phase Success/Failure point line without the former POINTS label.

## Static validation

- **60** JavaScript/MJS files passed `node --check`.
- **142** relative imports were resolved; **0 missing**.
- `module.json` and `lang/en.json` parsed successfully.
- CSS brace balance: **1532 opening / 1532 closing**.
- Version consistency confirmed for `module.json`, `MODULE_VERSION`, README current-build text, Development Status, Development Handoff, Integration Test Notes, and package naming target: `0.4.0-dev.92`.

## Preservation checks

Compared with the complete dev.91 package:

- `src/expeditions/mount-ironrot/MountIronrotV413.source.js` is byte-identical. SHA-256: `9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425`.
- `packs/` unchanged (24 files).
- `assets/` unchanged (4 files).
- `src/migration/` unchanged.
- `src/theme/` unchanged.

No intended changes were made to role point formulas, Travel Quality, Momentum, Event bands, rerolls, travel duration/commit behavior, Forced March/Exhaustion application, world-time accounting, Threats, Calendaria/Rest Recovery ownership, completion notices/audio, permissions, or saved expedition state.

## Live acceptance still required

Use the dev.92 checklist in `INTEGRATION_TEST_NOTES.md`. Priority acceptance is a Long Rest that reduces/removes native Exhaustion while both GM and player Expedition workspaces are already open. The roster should converge on the Actor's current state without a travel action or manual refresh. Also verify the new point line and one-line Exhaustion footer at normal and narrow dashboard/log widths.
