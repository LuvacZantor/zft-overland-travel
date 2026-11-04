# Local Validation — ZFT Overland Travel 0.4.0-dev.122

**Evidence level:** locally validated only. Live Foundry V13.351 / D&D5e 5.2.5 acceptance remains pending.

## Scope

- Restore routine GM controls to two readable columns at normal width.
- Preserve Show to Players in the header.
- Apply danger treatment to Reset Current Travel and its confirmation heading.
- Preserve all dev.121 functionality and dev.120 travel/consequence behavior.

## Automated validation

- Active Node regression suite: **173/173 passed** (historical dev.95/dev.96 cosmetic rollback tests intentionally excluded per established convention).
- JavaScript/MJS syntax: **93/93 passed**.
- Relative imports: **164 checked, 0 missing**.
- JSON: **2/2 valid**. CSS structure: **1814 opening / 1814 closing braces**. Package structure: **one top-level `zft-overland-travel/` directory with `module.json` at its root; 172 files**.
- Protected Mount Ironrot source, migration, themes, packs, and assets: **unchanged from dev.121**. Only the scoped UI/version/docs/tests files differ from the baseline.
- Fresh-extraction regression: **173/173 passed**.

## Required live checks

1. Confirm GM controls are two columns and readable at normal width.
2. Confirm Show to Players remains in the header.
3. Confirm Reset Current Travel is visibly red/warning-styled and its confirmation remains scoped to the active uncommitted travel.
4. Execute the consolidated dev.121/dev.120 functional checklist supplied with the build.
