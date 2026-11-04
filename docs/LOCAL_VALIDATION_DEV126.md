# Local Validation — ZFT Overland Travel 0.4.0-dev.126

**Evidence level:** locally validated only. Live Foundry acceptance remains required.

## Scope validated

- Complication Details decision-aid hierarchy cleanup.
- Threat removed from pre-resolution metadata while remaining an allowed consequence/handoff.
- Operational Readiness mitigation reflects actual source-hex availability.
- Recovery Objective and Suggested Response use a compact vertical guidance list.
- Allowed Consequences uses a compact inline row.
- Outcome Guidance uses a denser two-column reference.
- dev.125 Navigation generation/revision workflow and dev.124 deterministic adjudication preserved.

## Automated validation

- Active Node regression suite: **196/196 passed**.
- Historical dev.95/dev.96 cosmetic tests remain intentionally excluded under the existing rollback convention.
- JavaScript/MJS syntax checks: **97 passed**.
- Relative ES-module imports checked: **166**, **0 missing**.
- JSON parsing: **2 files passed**.
- CSS brace balance: **1912 open / 1912 close**.
- Preservation comparison against complete dev.125 ZIP: **33 protected pack/asset/migration/theme/Mount Ironrot files checked, 0 mismatches**.

## Live checks still required

See `INTEGRATION_TEST_NOTES.md`.
- Fresh-extraction active regression suite: **196/196 passed**.
- Fresh-extraction JavaScript/MJS syntax: **97 passed**; relative ES-module imports **166**, **0 missing**; JSON/CSS validation passed.
