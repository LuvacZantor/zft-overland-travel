# Local Validation — ZFT Overland Travel 0.4.0-dev.95

**Baseline:** complete local `0.4.0-dev.94` manual-install package. Remote `feature/expedition-system-1.1` remains frozen at dev.88 commit `fca67c46e7c1ca5921a031645c9d9fa99063b469`.

## Scope

- Dashboard Travel Quality point rows and separated Momentum facts.
- Structured hover/focus transparency help for Travel Quality, Momentum change/current state, staged travel, safe travel hours, roster roles, Event math/resolution, and Forced March semantics.
- No changes to Travel Quality math, Momentum shifts, Event rolls/bands, role progression, travel commitment, world time, Threat state, Forced March/Exhaustion, or persistence.
- Roles/Events tab structure intentionally unchanged for later design review.

## Automated evidence

- Automated Node tests: **95/95 passed**.
- JavaScript/MJS syntax checks: **63 passed**.
- Relative imports inspected: **149**, **0 missing**.
- JSON/manifest parse: passed.
- CSS delimiter validation: passed.
- Manifest / code constant / README current-version consistency: `0.4.0-dev.95`.
- Manual-install ZIP structure: one top-level `zft-overland-travel/` directory with `module.json` directly inside.
- Complete package file count: **115 files**.
- Fresh-extraction automated retest: **95/95 passed**; extracted manifest version verified as `0.4.0-dev.95`.

Local evidence is not live Foundry acceptance.

## Preservation

The protected `MountIronrotV413.source.js`, packs, assets, migration files, and theme files are verified byte-for-byte against dev.94 during final packaging.

## Live acceptance

See the dev.95 addendum at the top of `INTEGRATION_TEST_NOTES.md`. Target: Foundry V13.351 / D&D5e 5.2.5 with actual campaign integrations.
