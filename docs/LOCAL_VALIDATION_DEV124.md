# Local Validation — ZFT Overland Travel 0.4.0-dev.124

**Evidence level:** locally validated only. Live Foundry acceptance remains required.

## Scope validated

- Dashboard Current Step mirrors active Complication category/type/detail and next action.
- Complication Details uses compact responsive layout intended to remain usable at 1080p-height desktop resolutions.
- Complication resolution is GM-adjudication-only; the live Roll / Check recovery branch is removed.
- Outcome and consequence are selected on one Resolve Complication surface with dynamic Base/Final Consequence Severity.
- Operational Readiness remains explicit opt-in and uses fixed compact checkbox geometry.
- Dev.123 Navigation content and deterministic consequence mechanics remain unchanged.

## Automated validation

- Active Node regression suite: **186/186 passed**.
- Historical dev.95/dev.96 cosmetic tests remain intentionally excluded under the existing rollback convention.
- JavaScript/MJS syntax checks: **95 passed**.
- Relative imports checked: **165**, **0 missing**.
- JSON parsing: passed.
- CSS brace balance: passed.
- Preservation comparison against the complete dev.123 ZIP: **30 protected pack/asset/migration/Mount Ironrot files checked, 0 mismatches**.
- Fresh-extraction active regression suite: **186/186 passed** after final packaging.

## Live checks still required

1. Current Step shows the actual active Complication and specific situation.
2. View Details fits and remains readable on a 1920×1080 desktop without one-column vertical sprawl.
3. Resolve opens one GM-adjudication surface with outcome and consequence together and no Roll / Check path.
4. Outcome changes recalculate Consequence Severity immediately.
5. Operational Readiness checkbox is compact, aligned, unchecked by default, and reduces only Final Severity.
6. Deterministic dev.123 consequence application remains correct.
