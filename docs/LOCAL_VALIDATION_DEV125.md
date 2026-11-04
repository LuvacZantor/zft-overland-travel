# Local Validation — ZFT Overland Travel 0.4.0-dev.125

**Evidence level:** locally validated only. Live Foundry acceptance remains required.

## Scope validated

- One-screen Primary + Detail Navigation generation setup.
- Real visible d8 execution remains separate and sequential after one setup decision.
- Pending Complication GM Result Control supports reroll-both, reroll-detail, and forced replacement results.
- Original generation and additive revision history persistence.
- Complication Details hierarchy/terminology refinement.
- dev.124 adjudication and deterministic consequence mechanics preserved.

## Automated validation

- Active Node regression suite: **192/192 passed**.
- Historical dev.95/dev.96 cosmetic tests remain intentionally excluded under the existing rollback convention.
- JavaScript/MJS syntax checks: **96 passed**.
- Relative imports checked: **233**, **0 missing**.
- JSON parsing: passed.
- CSS brace balance: passed.
- Preservation comparison against the complete dev.124 ZIP: **32 protected pack/asset/migration/theme/Mount Ironrot files checked, 0 mismatches**.
- Fresh-extraction active regression suite: **192/192 passed**.
- Fresh-extraction JavaScript/MJS syntax: **96 passed**; relative imports **233**, **0 missing**; JSON/CSS validation passed.

## Live checks still required

See `INTEGRATION_TEST_NOTES.md`.
