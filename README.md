# ZFT Overland Travel

**Current development test build:** `0.4.0-dev.130` for **Foundry V13.351 / D&D5e 5.2.5**. This is an experimental development package, not a verified stable release. Module ID: `zft-overland-travel`.

**Repository routing:** [Canonical Project Status](https://github.com/LuvacZantor/zft-overland-travel/blob/main/PROJECT_STATUS.md). The complete dev.130 **source checkpoint** is preserved on `feature/expedition-engines`; verify the exact HEAD from the canonical status page. The complete manual-install dev.130 ZIP remains a separately validated local test artifact, not a published GitHub Release or an authorized production deployment.

## Dev.130 scope: resolution visibility and consistent compact presentation

- **Resolved before travel:** As soon as the Event or Complication ruling is saved, the Dashboard shows **Resolution Recorded · Hex N** under Current Step. This persists through Commit Travel, partial/cross-day travel, and Forced March. No travel hour is advanced by displaying it.
- **Completed hex:** After the last hour commits, the same summary becomes **Final Result · Hex N**, stays visible between hexes, and retracts when Start Travel begins a new hex. Saved per-hex Travel Log evidence remains accessible and uses the same public-safe component before and after time is committed.
- **Unified result presentation:** Complication Details guidance and the GM adjudication choices share a single compact, full-width four-outcome row design for Standard and Major Complications; the outcome labels, selected outcome colors, allowed consequences and severity logic remain unchanged.
- **Compact summary:** Event type, final outcome, consequence, exact applied impact, optional GM-only notes and travel commitment status use a full-width compact layout rather than narrow two-column cards. This summary works for Complications, Major Complications, Quiet Travel and Opportunities. Unresolved Events do not display a final summary.
- This build is a **presentation-focused development test update**. No game math, Momentum/Event odds, persistence schema, roles, GM rulings, world-clock writes, Exhaustion, actor mutations, assets, packs or data-export behavior is changed. Retain the complete dev.129 ZIP for rollback.

## Dev.129 scope: roll evidence and GM interface clarity

- **Actual dice in the Expedition Log:** Guide, Vanguard, Scout, Tracker, Forager and Coordinator show Normal / Advantage / Disadvantage with the individual evaluated d20 faces, kept/dropped indication and other modifiers *when the native Midi-QOL result or verified matching public ChatMessage provides that evidence*. The original total remains authoritative. No dice faces or mode are fabricated for old or incomplete results.
- **Saved data and export:** New roll evidence accompanies the GM-review preview and final saved role results. The built-in GM-only Export Data JSON includes the same saved data without a new persistent stream or setting.
- **GM ruling dropdowns:** Navigation, Reconnaissance and Expedition Support use green Success, red Failure and amber Re-roll presentation with immediate text previews. The actual rulings and reroll mechanics are unchanged.
- **Forced March:** Current Step emphasizes **CONSTITUTION SAVE · DC X** in a small theme-colored warning chip for the current Forced March hour, with no new calculation.
- **Complication Details:** GM Result Control stacks its text above wrapping action buttons, fixing a one-character-wide label at narrow workflow widths. All three existing actions are preserved.
- No gameplay engine, probability, travel-hour calculation, clock/Exhaustion logic, or data migration is changed. Keep dev.128 as the rollback test package until acceptance.

## Dev.128 scope: built-in GM expedition data export

- The **Expedition Log** header now includes a GM-only **Export Data** button. It downloads a structured JSON record of all currently saved expedition ledger data (including hex records, Navigation, Reconnaissance, Expedition Support, Travel Quality, Momentum, raw/final Event rolls, event resolutions, complications, consequences, travel/Forced March history, and saved log presentation cards). No console command is needed.
- Exports include module/core/system versions, world identity, an export timestamp, per-hex stable IDs, a compact analysis index, and explicit caveats for historical results where the GM-forced Event-roll mode or earlier reroll attempts were never stored. Multiple session exports can be deduplicated by world ID and hex ID.
- Export is **read-only**: no new world setting, recurring background logging, reset, deletion, console dump, player-facing action, game-rule change, or clock operation. The resulting file contains GM-only notes and should be kept private.
- **Existing dev.127 gameplay work is preserved unchanged.** Continue live GM/player tests before accepting this build.

## Preserved dev.127 changes

- **Navigation:** Guide and Vanguard completed rolls now appear in the Expedition Log with **Pending GM** during Navigation adjudication, before travel-time dice. GM override/reroll and final travel hours still follow the established workflow.
- **Completed hex Final Result:** After all travel hours are committed, a temporary Dashboard summary beneath **Current Step** displays the final Event/Complication outcome and consequences. **Start Travel** retracts this display. The same result remains under that completed hex in the Travel Log, with GM-only information hidden from players.
- No new saved record schema, clock writer, rule changes, or log truncation. Reconnaissance, Expedition Support, Force March, Momentum, Complications, themes, assets, packs and original Mount Ironrot source remain preserved.

## Documentation

- [Active development handoff](docs/DEVELOPMENT_HANDOFF.md)
- [Live acceptance steps](INTEGRATION_TEST_NOTES.md)
- [Local dev.130 validation](docs/LOCAL_VALIDATION_DEV130.md) and [dev.128 evidence](docs/LOCAL_VALIDATION_DEV128.md)
- [Validation reports index](docs/validation/INDEX.md)
- [Historical changelog](CHANGELOG.md) and [archived handoffs](docs/history/DEVELOPMENT_HANDOFF_ARCHIVE.md)
- [Expedition System 1.1 design](docs/EXPEDITION_SYSTEM_DESIGN_1.1_DRAFT.md), [Hex records](docs/HEX_RECORDS.md), and [module themes](docs/THEMES.md)
- [Central ZFT standards](https://github.com/LuvacZantor/zft-standards/blob/main/PROJECT-INSTRUCTIONS.md)

## Installation

Extract the entire `zft-overland-travel/` directory from `zft-overland-travel-v0.4.0-dev.130.zip` into the Foundry `Data/modules/` directory, replacing the prior test version. Keep world backups and any user-modified module pack/asset files before replacing an installed directory. Do not simply delete an installed module directory containing mutable data. Restart Foundry because the module manifest version changes. The GitHub source ZIP is not the manual-install package.

This development package keeps the module's existing requirements (`zft-tools`) and optional Calendaria/Rest Recovery integration. Verify the complete module in a copied Foundry world before campaign use.
