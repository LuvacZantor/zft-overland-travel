# ZFT Overland Travel | Local Validation — 0.4.0-dev.128

**Evidence:** Locally validated only, November 6, 2026. **Target:** Foundry V13.351 / D&D5e 5.2.5. No live GM/player acceptance has been performed for the export functionality.

## Scope

- GM-only built-in Expedition Log **Export Data** action, downloading structured JSON for analysis with no console command.
- Read-only point-in-time snapshot of saved expedition hex/role/Navigation/Reconnaissance/Support/Travel Quality/Momentum/Event/Complication/consequence/travel/Forced March history and presentation records, plus environment identity.
- Stable per-hex identity for cross-session deduplication, historical roll provenance labeled unknown when not saved, no inventing previous rerolls or random-origin claims.
- No new world settings, schema changes, game-rule changes, automatic telemetry polling, clearing, timer/clock actions or new dependencies.
- All dev.127 Navigation GM-review preview and completed Final Result behavior preserved.

## Automated validation

- Active Node regression suite: **209/209 passed**, including **6** focused export tests; dev.95/dev.96 superseded cosmetic tests excluded per existing rollback convention.
- JavaScript/MJS syntax, relative imports, JSON, CSS brace balance, protected file comparison, archive integrity and fresh extraction: checked during ZIP packaging and recorded in the delivery report.
- GM-only guard verified twice: hidden player UI and a programmatic guard before any world-state read/download. Export helper exercised with a mocked save-file adapter and verified to invoke **zero setting writes**.

## Required live acceptance

See [INTEGRATION_TEST_NOTES.md](../INTEGRATION_TEST_NOTES.md): test GM-only button, download filename and JSON content after multiple hexes, idle/during pending travel, player access, read-only behavior and unchanged dev.127 gameplay. Confirm that the saved JSON is treated as GM-private information. Browser download action has not been live-tested here.

## GitHub status

**Not committed, pushed, merged, tagged, released or deployed.** GitHub remains at dev.126 on `feature/expedition-engines`; this is a complete local test ZIP based on the previous dev.127 package. All future GitHub writes require a separate scoped approval.
