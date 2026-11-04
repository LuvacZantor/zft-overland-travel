# Local Validation — ZFT Overland Travel 0.4.0-dev.114

## Scope

Focused live-test repair of dev.113: Complications-tab rerender, conditional Event-roll fields, and immediate active-hex role-phase visibility. No new engine mechanics.

## Local evidence before packaging

- Active automated regression set: **144/144 passed**.
- Historical dev.95/dev.96 cosmetic tests remain intentionally excluded because dev.97 rolled those experiments back.
- New tests cover Complications workspace refresh, conditional Event-roll fields, and active Travel-log Navigation/Reconnaissance/Support preview.
- JavaScript/MJS syntax: **84/84 passed**.
- Relative imports: **158 resolved, 0 missing**.
- Manifest and language JSON parse: **2/2 passed**.
- CSS brace structure: **1744/1744**.
- Protected source/data preservation checks: **passed**.
- Manual-install ZIP layout: one `zft-overland-travel/` root, **155 files**.
- Fresh-extraction active regression: **144/144 passed**.
- Protected Mount Ironrot source, migration, themes, assets, and packs must remain byte-for-byte unchanged from dev.113.

## Evidence level

**Locally validated** after the package checks below complete. Live Foundry V13.351 / D&D5e 5.2.5 testing is required for final UI behavior.

## Live acceptance focus

See the dev.114 section at the top of `INTEGRATION_TEST_NOTES.md`.
