# Local Validation — ZFT Overland Travel 0.4.0-dev.94

**Baseline:** complete local `0.4.0-dev.93` manual-install package. Remote `feature/expedition-system-1.1` remains frozen at dev.88 commit `fca67c46e7c1ca5921a031645c9d9fa99063b469`.

## Scope

- Manual GM progression from Navigation staging to Reconnaissance, then Expedition Support.
- Automatic Travel Quality → Momentum → Event only after Support completes.
- Dashboard current-hex Travel Quality/Momentum-change summary plus persistent five-step Momentum rail and Event bands.
- Structured role-grade tooltips.

## Automated evidence

- Automated Node tests: **92/92 passed**.
- JavaScript/MJS syntax checks: **62 passed**.
- Relative imports inspected: **149**, **0 missing**.
- JSON/manifest parse: passed.
- CSS delimiter validation: passed.
- Manifest / code constant / README current-version consistency: `0.4.0-dev.94`.

- Manual-install ZIP structure: one top-level `zft-overland-travel/` directory with `module.json` directly inside.
- Complete package file count: **113 files**.
- Fresh-extraction automated retest: **92/92 passed**; extracted manifest version verified as `0.4.0-dev.94`.

Local evidence is not live Foundry acceptance.

## Preservation

The protected `MountIronrotV413.source.js`, packs, assets, migration files, and theme files are verified byte-for-byte against dev.93 during final packaging.

## Live acceptance

See the dev.94 addendum at the top of `INTEGRATION_TEST_NOTES.md`. Target: Foundry V13.351 / D&D5e 5.2.5 with actual campaign integrations.
