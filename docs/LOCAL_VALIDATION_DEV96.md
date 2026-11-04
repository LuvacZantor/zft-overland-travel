# Local Validation — ZFT Overland Travel 0.4.0-dev.96

**Baseline:** complete local `0.4.0-dev.95` manual-install package. Remote `feature/expedition-system-1.1` remains frozen at dev.88 commit `fca67c46e7c1ca5921a031645c9d9fa99063b469`.

## Scope

- Cosmetic repair of dev.95 transparency UI only.
- Tooltip triggers inherit normal surrounding typography.
- Summary-tile tooltip positioning stays inside the Dashboard instead of appearing as an orphan surface above the tile/header.
- Momentum modifier/persistence facts use readable full-width rows and narrow-width stacking.
- No rules, calculations, state transitions, travel/time accounting, Actor effects, Threat state, or persistence changes.

## Automated evidence

- Automated Node tests: **99/99 passed** before final packaging.
- Dev.96-specific cosmetic regression tests: typography inheritance, summary-tooltip positioning, Momentum fact layout, readable dashboard transparency typography.
- Final syntax/import/JSON/CSS/package/preservation evidence is recorded during packaging and fresh-extraction verification.

Local evidence is not live Foundry acceptance.

## Preservation

The protected `MountIronrotV413.source.js`, packs, assets, migration files, and theme files must remain byte-for-byte identical to dev.95 through final packaging.

## Live acceptance

See the dev.96 addendum at the top of `INTEGRATION_TEST_NOTES.md`.
