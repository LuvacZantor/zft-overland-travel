# ZFT Overland Travel 0.4.0-dev.91 | Local Validation

**Date:** 2026-11-03  
**Evidence level:** locally validated only; not live Foundry acceptance.  
**Live target for owner testing:** Foundry V13.351 / D&D5e 5.2.5.  
**Implementation baseline:** complete local `0.4.0-dev.90` manual-install package.  
**Remote checkpoint:** `feature/expedition-system-1.1` remains frozen at `fca67c46e7c1ca5921a031645c9d9fa99063b469` (`0.4.0-dev.88`). No GitHub write was performed.

## Scope

Dev.91 repairs the dev.90 primary-action mismatch and restores selectable GM rerolls, then adds the approved player-facing expedition clarity changes:

- staged/unresolved travel displays **Resolve Expedition** with an explicit reason instead of a dead-looking Commit Travel control;
- fully resolved first travel commitment displays **Commit Travel** and uses the established confirmation/ledger/clock path;
- Navigation, Reconnaissance, and Expedition Support GM rulings include **Re-roll Check** with preserved unrelated rulings and no phase save until final submission;
- role log sections expose aggregate Success/Failure points and `CHARACTER / CHECK`, `ROLL`, `RESULT` headings while retaining d20 icons/totals;
- Dashboard repeats current Travel Quality and persistent Momentum;
- Expedition Roster is two columns at normal dashboard widths with a narrow single-column fallback.

## Automated regression

Command:

```sh
node --test tests/*.test.mjs
```

Result: **80/80 passed**, 0 failed, 0 skipped.

New/expanded dev.91 coverage includes:

- pure primary-action state for Start / Resolve / Commit / Continue;
- unresolved staged hex never presents a silent Commit Travel action;
- fully resolved first commitment is Commit Travel;
- partially committed hex is Continue Travel;
- paired-role reroll replaces only the selected roll and reopens GM review;
- Navigation reroll replaces only the selected roll and preserves the other role ruling;
- Dashboard Expedition State and two-column roster source contract;
- role-log Roll/Result headings, point totals, and retained die-total rendering.

## Static validation

- **59** JavaScript/MJS files passed `node --check`.
- **142** relative imports were resolved; **0 missing**.
- `module.json` and `lang/en.json` parsed successfully.
- CSS brace balance: **1523 opening / 1523 closing**.
- Version consistency confirmed for `module.json`, `MODULE_VERSION`, README current-build text, and package naming target: `0.4.0-dev.91`.

## Preservation checks

Compared with the complete dev.90 package:

- `src/expeditions/mount-ironrot/MountIronrotV413.source.js` is byte-identical. SHA-256:
  `9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425`
- `packs/` unchanged.
- `assets/` unchanged.
- `src/migration/` unchanged.
- `src/theme/` unchanged.

No intended changes were made to Travel Quality math, Event bands, Momentum rules, travel-duration math, Forced March/Exhaustion, world-time accounting, Threat mechanics, Calendaria/Rest Recovery ownership, completion notices/audio, or player mutation permissions.

## Live acceptance still required

Use `INTEGRATION_TEST_NOTES.md` dev.91 checklist. Priority live checks are the previously observed dev.90 regressions: selectable rerolls and a working Commit Travel transition after Event Resolution. Then verify player-visible point/column presentation, Dashboard Expedition State, two-column roster responsiveness, and the existing travel/clock/Forced March regressions.
