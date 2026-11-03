# Local Validation — ZFT Overland Travel 0.4.0-dev.97

## Scope

Dev.97 is an owner-directed visual rollback to the complete dev.94 runtime baseline after live dev.95/dev.96 Dashboard cosmetic regressions. No gameplay/state mechanics are intentionally changed.

## Baseline/preservation

- Source package: complete `zft-overland-travel-v0.4.0-dev.94.zip`.
- Remote feature branch remains frozen at dev.88 commit `fca67c46e7c1ca5921a031645c9d9fa99063b469`.
- Dashboard `HexTravelConsole.js` and `zft-overland-travel.css` are byte-identical to dev.94.
- Protected MountIronrotV413 source, packs, assets, migration and theme files remain unchanged.

## Required local checks

- All included automated tests.
- Dev.97 visual-rollback guard test.
- JS/MJS syntax validation.
- Relative import resolution.
- Manifest/JSON/CSS structural validation.
- Complete manual-install ZIP structure and fresh-extraction retest.

Live Foundry V13.351 / D&D5e 5.2.5 visual acceptance remains required.

## Results

- Automated tests: **99/99 passed** across 16 test files.
- JavaScript/MJS syntax checks: **63 passed**.
- Relative imports resolved: **149**, **0 missing**.
- Manifest and language JSON parse: passed.
- CSS brace structure: passed.
- `HexTravelConsole.js`: byte-for-byte identical to dev.94.
- `src/styles/zft-overland-travel.css`: byte-for-byte identical to dev.94.
- Protected MountIronrotV413 source, packs, assets, migration and theme files: unchanged from dev.94.
- Evidence level: **locally validated**, not live Foundry acceptance.
