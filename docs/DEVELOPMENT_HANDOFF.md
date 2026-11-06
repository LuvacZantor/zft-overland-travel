# ZFT Overland Travel | Active Development Handoff — 0.4.0-dev.130

**Local complete manual ZIP:** `zft-overland-travel-v0.4.0-dev.130.zip`. **Target:** Foundry V13.351 / D&D5e 5.2.5. **Evidence:** locally validated only; live GM/player acceptance pending. This is a development test build, not a stable release.

**Authoritative GitHub source:** `feature/expedition-engines` contains the full dev.130 source checkpoint (runtime, tests, manifest, current documentation, and validation records). Use [main/PROJECT_STATUS.md](https://github.com/LuvacZantor/zft-overland-travel/blob/main/PROJECT_STATUS.md) for the **exact new development commit SHA** and distinction from the previous dev.126 source. Do not infer that the GitHub default `main` module is current.

## Dev.130 current change: early Event resolution summary and unified presentation

**Base:** Complete locally validated dev.129 ZIP (preserved for rollback). **Delivery:** Complete dev.130 manual-install ZIP with SHA-256 `c5e129e73f31e92001e4345b95385e7705e952537b0fc83469cb01357f5c6871`; 197 file entries, ZIP CRC valid. **Remote:** the dev.130 source is checkpointed on `feature/expedition-engines`, not merged to `main`. Five historical documents originally updated by the dev.126 documentation cleanup remain preserved from the existing feature branch rather than being overwritten with stale copies in the earlier local ZIP.

- **Dashboard:** Reuse the saved final-result component immediately after the Event/Complication is actually resolved, *before* the first travel hour is committed. Show **Resolution Recorded · Hex N / Travel Pending** while the hex is in progress, including a current remaining-hours label. Once all hours commit, transition to **Final Result · Hex N / Completed**. Clicking **Start Travel** dismisses the old Dashboard result without deleting history.
- **Travel Log:** The owning saved hex shows the same public-safe summary as soon as its Event resolution is saved. It remains tied to the hex, including when it spans travel days, and transitions to a completed summary with the final committed hours.
- **One outcome-row style:** Both Standard and Major Complication Details and selectable GM adjudication use one shared four-row geometry. Keep the actual outcome meanings, color semantics, consequence-selection rules, and GM actions unchanged. No placeholder support is added for unfinished Opportunity/Threat engines.
- **Compact final result:** Remove the narrow fact grid in favor of full-width labeled details and a compact outcome heading. Redact GM-only notes/hidden Complication information on player clients; preserve all original saved words and data. Success, failure and neutral ruling labels use their appropriate theme colors.
- **Safety:** This is presentation-only. No new setting, saved schema, time commit, dice, role calculation, consequence processing, Event routing, Momentum, sound cue, log clearing, compendium, asset, migration or original Mount Ironrot source change. All prior dev.129 dice evidence, GM color updates, Forced March DC and dev.128 export stay intact.

### Required Foundry acceptance

Test one Quiet Travel, Opportunity, Standard Complication and Major Complication; verify the pending summary after GM resolution, after a partial travel commit and Forced March, then after completion and Start Travel. Verify GM/player notes, clearance/reload, all saved outcomes and consequences. Open Complication Details and Resolve Complication at narrow and ordinary widths, check the same four compact outcome rows without broken words, controls and keyboard/radio selection. Compare travel ledger and world clock before and after viewing summaries. See `../INTEGRATION_TEST_NOTES.md`.

## Preserved dev.129 change: read-only roll evidence, GM color consistency and focused UI fixes

- `HexRoleDiceEvidence.js` extracts actual evaluated d20 faces from matched native Midi return values or matching public ChatMessages without making any new roll or relying on pre-dialog request defaults. Two faces include used/dropped selection; mode is Advantage, Disadvantage, Normal, or Unknown only when supported by actual roll metadata. No fabricated data.
- Guide/Vanguard and Scout/Tracker/Forager/Coordinator carry this evidence during GM review and in the permanent saved record. The Log renders its compact evidence underneath the role/check identity. Saved data export includes the same fields automatically. Older records remain valid.
- All six GM ruling selects show theme-relative Success/Failure/Re-roll colors with text previews. The Complication Details GM Result Control now stacks and wraps within the panel. The Forced March Current Step marks Constitution Save DC with a compact amber chip.
- No change to gameplay probabilities, formulas, DC computation, Event/Complication generation, role outcome adjudication, world time, or UI settings. Original source, packs/assets, themes and older saved records remain protected.

## Dev.128 change: GM-only built-in exporter

- The Expedition Log header has one **Export Data** control on GM clients only. It initiates a local JSON file download. Player clients do not receive the control; the handler checks GM permission a second time.
- Source: `src/engines/hex-travel/HexExpeditionDataExport.js` and one small control/action in `HexTravelConsole.js`. No edits to travel math, role adjudication, Event routing, Complication consequences, time/clock handling, or save paths.
- Export format: `zft-expedition-data-v1`. It contains environment/version, stable per-hex IDs, a compact analytical view, the full saved travel ledger/hex records (including roles, travel quality, Momentum, Events, Complications, pending state, forced-march history) and saved presentation/log cards and dates. This is a point-in-time read, not a new telemetry database.
- **Known data gaps:** Historical Event roll-control mode and earlier replaced reroll attempts are not reliably saved. They are marked unknown; do not use them as proven naturally random samples. Saved visual cards retain only the most recent 15 entries, but the structured hex records may retain older crossings. Later exports can overlap; deduplicate by world ID and stable hex ID.
- Export never calls `game.settings.set`, never modifies world time, and never deletes or clears any data. The JSON may contain private GM notes and identities; it is not player-safe or intended for public sharing.

## Preserve and verify dev.127

- Navigation: actual Guide/Vanguard rolled totals displayed **Pending GM** before travel dice, keeping the working Reconnaissance/Support system unchanged.
- Completed-hex Final Result appears on Dashboard only after full travel completion and retracts on Start Travel; the same adjudicated result is present in permanent per-hex Log history, subject to existing visibility/retention policy.
- World ledger, chronology, clock checkpoints, GM rulings, Forced March/Exhaustion, saved history, themes, packs/assets, migration and all optional integrations unchanged.
- Protected original source: `src/expeditions/mount-ironrot/MountIronrotV413.source.js` must remain byte-for-byte identical to the verified dev.127 ZIP and Git baseline.

## Validation / next action

- [dev.130 local validation](LOCAL_VALIDATION_DEV130.md) and [dev.128 history](LOCAL_VALIDATION_DEV128.md)
- [Live acceptance checklist](../INTEGRATION_TEST_NOTES.md)
- [Validation index](validation/INDEX.md)

Install in a copied world first; verify export button on GM and absence on player, downloaded JSON fields, no world-setting writes, preserved results after reload, and no changes to travel/gameplay. Retest outstanding dev.127 live checks separately.

**Stopping-point status (2026-11-06):** The owner expressly approved one complete dev.130 source checkpoint on `feature/expedition-engines` and one documentation-only update of `main/PROJECT_STATUS.md`. Those are the only authorized GitHub operations. No code merge into `main`, stable release, tag, deployment, packaging optimization or new feature work occurred. **Live acceptance remains pending**; preserve dev.129 and dev.130 test ZIPs and take a world/data backup before any installation. The local dev.130 validation report is an immutable record of its pre-commit state, so older statements about GitHub remote status in that report are historical. Future GitHub writes require fresh, scoped approval.
