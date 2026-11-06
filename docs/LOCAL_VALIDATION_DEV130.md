# ZFT Overland Travel — Local Validation 0.4.0-dev.130

**Status:** Locally validated only; **not live-verified**. **Target:** Foundry V13.351 / D&D5e 5.2.5. **Base:** complete locally validated dev.129 test ZIP. **Remote:** GitHub remains unchanged at `feature/expedition-engines` dev.126 (documentation HEAD `6532c016caa2c82e2cbe01d4073a5ea1068824b9`, last source-changing `55bd7d9e90027366e2bec516ace30e5d0d0a14d7`).

## Scope

1. Saved final Event/Complication resolutions show on the Dashboard **before** travel time is committed; pending hexes show `Resolution Recorded / Travel Pending`, with the saved remaining hours. The existing completed status and Start Travel dismissal still work. An unresolved Event cannot produce this panel.
2. The same public-safe data, including the exact adjudication, consequences, optional GM-only notes, and committed travel status, appears in the owning hex's Expedition Travel Log; no second persistence/history system was added.
3. The final result panel is more compact, with full-width fields rather than cramped columns and theme-derived success/failure/neutral visual treatment.
4. Standard and Major Complications share full-width compact outcome rows across Details and the GM's selectable adjudication screen, preserving the four original outcome texts, result choices, GM controls, and consequence logic.
5. All dev.129 gameplay, roll evidence, color-coded role decisions, Forced March DC, dev.128 export, dev.127 Navigation preview, ledger and world-clock paths, dependencies, themes, packs, assets and Mount Ironrot reference remain unchanged.

## Verification

- Active Node regression suite (excluding intentionally superseded dev.95 and dev.96 cosmetic snapshots): **228/228 passed** in the working tree; repeat on fresh ZIP extraction before delivery.
- New dev.130 tests (7) exercise pending and completed transitions, missing/cleared history, next-hex dismissal, GM/player redaction, event types and outcome row reuse.
- Original dev.127 tests were updated only for the newly approved pending-result behavior; historical dev.124 and dev.126 CSS layout assertions now assert the new shared layout without removing other checks.
- File/asset preservation, JavaScript syntax, import resolution, CSS/manifest, ZIP checks and fresh-extraction results are recorded in the delivery report.

## Live acceptance

Every newly changed UI behavior remains **NOT TESTED in Foundry**. Use `INTEGRATION_TEST_NOTES.md` with GM and player clients. Check both Standard and Major Complication dialogs and four Event outcome types before/after committing travel. Verify screen scaling and all themes. Do not regard passing tests as certification of V14 or stable release.

## Publication / rollback

No GitHub commit, push, merge, tag, release, or world deployment. Keep the complete dev.129 ZIP as the rollback test build. Do not overwrite mutable installed packs/assets or live world data during manual extraction.
