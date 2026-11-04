# Local Validation — ZFT Overland Travel 0.4.0-dev.99

**Date:** November 3, 2026  
**Evidence level:** locally validated only; not live Foundry acceptance.  
**Baseline:** complete local dev.98 manual-install package.  
**Remote baseline:** `feature/expedition-system-1.1` remains at owner-approved dev.97 checkpoint `5597f595a6dbda24732e68076f7445129dd0e859`. No GitHub write was performed.

## Scope

- Remaining transparency rollout using the dev.98 fixed `document.body` help overlay.
- Help for Hex Travel Remaining, Safe Travel Hours, saved Event result math/chart band, and Forced March.
- Roster role help now identifies role phase and fixed primary check.
- Coordinator wording aligned with Expedition Support operational readiness rather than a separate morale mechanic.
- Dedicated top-right Dashboard minimize button removed; double-clicking the existing left mountain/triangle collapses to the floating icon. Keyboard Enter/Space provides the same action.
- Momentum remains `−2 / −1 / 0 / +1 / +2`; `−3 / −1 / 0 / +1 / +3` is documented only as a future deterministic playtest candidate.
- No travel, role-resolution, Travel Quality, Momentum, Event, Threat, Forced March, Exhaustion, clock, ledger, or persistence mechanic changes.

## Automated/static results

- Full Node suite: **95/95 passed**.
- JavaScript/MJS syntax checks: **65 passed**.
- Relative imports: **149 checked, 0 missing**.
- `module.json` and `lang/en.json`: valid JSON.
- CSS structural braces: **1592 opening / 1592 closing**.
- Version consistency: `module.json`, `MODULE_VERSION`, README current build = `0.4.0-dev.99`.

## Preservation

Compared byte-for-byte with dev.98:

- `assets/` unchanged.
- `packs/` unchanged.
- `src/migration/` unchanged.
- `src/theme/` unchanged.
- `src/expeditions/mount-ironrot/MountIronrotV413.source.js` unchanged; SHA-256 `9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425`.

## Live acceptance still required

Use the dev.99 addendum at the top of `INTEGRATION_TEST_NOTES.md`, especially tooltip placement/no layout shift, Event math transparency, Forced March commit wording, role phase help, and the new mountain/triangle double-click compact control.
