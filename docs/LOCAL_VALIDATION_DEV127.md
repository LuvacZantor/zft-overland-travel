# ZFT Overland Travel | Local Validation — 0.4.0-dev.127

**Evidence:** Locally validated only, November 6, 2026. **Target:** Foundry V13.351 / D&D5e 5.2.5. No live GM/player acceptance has been performed for this build.

## Scope

- Navigation Guide/Vanguard rolls published during pending GM adjudication using the existing saved expedition travel card, before travel-time dice and before the shared hex record exists.
- Completed-hex Final Result shown between hexes on Dashboard, retracted on Start Travel, saved permanently as a derived section of the completed hex in the Travel tab.
- For crossings spanning multiple days, the permanent Final Result appears under the last day's hex segment. No secondary database or time writer is introduced.
- Confidential Complication details and GM notes remain restricted on player clients; actual public consequences remain visible.
- Dev.126 Complication Details design, Reconnaissance/Support behavior and all existing persistence contracts retained.

## Automated checks

- Active Node regression suite: **203/203 passed** across 46 test files; legacy dev.95/dev.96 cosmetic tests intentionally excluded under established rollback convention.
- JavaScript/MJS syntax: **99 passed**.
- Relative JS/MJS imports: **168 checked, 0 missing**.
- JSON syntax: **2 valid**.
- CSS brace balance: **1929 open / 1929 close**.
- Protected source/data comparison against the owner-supplied dev.125 ZIP: **36 files checked, 0 mismatches** (module packs, audio assets, themes, migration and protected Mount Ironrot sources). All 3 runtime files changed by dev.126 were reconstructed to the exact committed dev.126 Git blob SHA before dev.127 edits.
- Manual extraction package integrity and fresh-extraction checks are separately verified in the delivery report.

## Next live acceptance

[Live GM/player acceptance checklist](../INTEGRATION_TEST_NOTES.md). Verify pre-travel Navigation visibility, reroll/override, no premature time commit, hex completion, cross-day/Forced March, Final Result retraction, persisted log history, GM/private-data redaction, and all established themes. **Local tests do not certify live Foundry behavior or Foundry V14 compatibility.**

## GitHub state

**Not pushed, merged, tagged, released or deployed.** GitHub still references dev.126 on `feature/expedition-engines` as the last source-changing checkpoint. This is a complete local test ZIP only; future GitHub writes need separate owner approval.
