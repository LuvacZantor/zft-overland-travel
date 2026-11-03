# Local Validation — ZFT Overland Travel 0.4.0-dev.93

**Evidence:** locally validated only. This does not certify live Foundry behavior.
**Baseline:** complete local `0.4.0-dev.92` manual-install package.
**Live target for later acceptance:** Foundry V13.351 / D&D5e 5.2.5.
**Remote GitHub:** unchanged; `feature/expedition-system-1.1` remains frozen at dev.88 commit `fca67c46e7c1ca5921a031645c9d9fa99063b469`.

## Scope

- Contextual primary action opens pending manual Event Resolution directly.
- Compact roster uses unique first names with collision fallback.
- Role-grade hover/focus explanations include actual saved point contribution.
- Final travel commit auto-collapses the completed hex card; partial travel remains open.

## Automated checks

- Full Node test suite: **89/89 passed** before packaging.
- New dev.93 tests cover Major Complication, Complication and Opportunity primary actions; direct Event dialog routing; roster-name collision behavior; role-grade help; and completed-hex collapse state.
- JavaScript/MJS syntax: **61 files passed**.
- Relative imports: **147 verified, 0 missing**.
- JSON/manifest parsing passed; CSS brace balance is zero; manifest/constant/README versions agree.
- **32 protected files** across the Mount Ironrot original source, packs, assets, migration, and theme areas match dev.92 byte-for-byte.
- Protected `MountIronrotV413.source.js` SHA-256: `9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425`.
- Archive layout and fresh-extraction regression are verified during final packaging.

## Live checks still required

Use the dev.93 section of `INTEGRATION_TEST_NOTES.md`. In particular, confirm direct Event Resolution and the completed-hex collapse in the actual Foundry client.
