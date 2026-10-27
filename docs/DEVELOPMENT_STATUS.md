# Development status | ZFT Overland Travel

**Current source checkpoint:** `0.4.0-dev.28` on `develop`. This is not a released or live-verified build. Do not merge to `main`, create a release, or claim Foundry V14 compatibility from static/simulated tests alone.

## Architecture and compatibility

- Public module ID: `zft-overland-travel`; user-facing title: **ZFT Overland Travel**. Keep the ID unchanged because installed modules and client settings refer to it.
- Foundry V13 / D&D5e is the currently targeted live environment. **Foundry V14 has not been validated in this project**. The manifest's compatibility metadata is not evidence of runtime verification.
- Requires ZFT Tools `0.1.0-dev.8` for toolbar integration; travel roll workflows use Midi-QOL.
- The reusable expedition framework remains alongside the isolated Mount Ironrot implementation (`src/expeditions/mount-ironrot/`). Do not automatically merge state or mechanics between them.
- The original Mount Ironrot v4.13 source is preserved as `MountIronrotV413.source.js`. The established world ledger key `mountIronrotTravelV45` and user-configured expedition, party, and history must be preserved.
- **New Travel Day does not advance Foundry world time.** Calendaria affects date formatting; previous history is not silently rewritten.

## Current development behavior

- Three independent windows: GM Expedition Controls, Expedition Dashboard, and Expedition Log. Their stacking must yield to Foundry, Midi-QOL, character sheets, and unrelated module dialogs.
- Saved navigator/secondary assignments; party attendance independent of scene token placement; expanded details for current travel results and compact historical entries.
- The log distinguishes the **current hex in progress** from earlier completed travel entries. A completed roll is not automatically equivalent to a completed hex.
- While the GM session is active, a pending player's roll can be resent, handed off to the GM, or canceled. Superseded late socket responses are ignored within that workflow. **A GM client reload does not restore an in-memory pending request.**
- Five client-specific interface palettes, with 22 individual color fields. The editor opens from the **Dashboard only**, in a separately movable window. See [THEMES.md](THEMES.md).

## Acceptance checklist for live Foundry V13 testing

1. Install alongside ZFT Tools `0.1.0-dev.8`. Confirm the Foundry Module Management title, version and single-line row layout; recheck the previously reported name-wrap issue.
2. With three windows open, open a character sheet, Journal, Foundry DialogV2, legacy dialog, and a Midi-QOL player prompt. Each must appear in front and remain clickable; the map outside the three panes must stay usable.
3. Open the Dashboard palette icon. Confirm there is **no duplicate icon on the Log**. Verify the theme window can move, resize, and display multi-column colors on desktop; recheck a narrow client.
4. On separate GM and player clients, select all five presets; modify individual colors using both picker and `#RRGGBB`; Save and reload; Cancel/Escape and close the Dashboard without saving; confirm previews roll back and one client's colors do not change the other's.
5. Open a new expedition: Day 1 and empty current-day log should be concise, and it must not misleadingly call subsequent-day results the party's *first travel*. Complete a travel attempt, review current-hex state, add another day, and confirm correct current/historical labeling.
6. Test a disconnected player during a skill check and a Forced March CON save. Resend once, verify replacement attempt, then test Roll as GM and Cancel Request. Ensure no duplicate hex hours, ledger entry, or accepted roll.
7. Confirm party roles and saved progress survive browser reload; Cancel followed by Start/Continue must remain usable. Verify calendar year formatting but **no world-clock advancement**.
8. Verify the original v4.13 travel computations, dice presentation, exhaustions/forced march adjudication, and Action HUD still function.

All above are **live acceptance tests pending**, not claims of live success. Developer-provided local syntax and Chromium simulations were run on preceding test builds and are recorded in `INTEGRATION_TEST_NOTES.md` for context.

## Current known constraints

- A player disconnect can leave an outstanding socket response unresolved; the active GM can invoke roll-recovery controls. GM reload recovery is not implemented.
- Some historic travel-card HTML contains inline legacy colors, so not every older visual fragment follows every custom color override.
- Previously saved default/explicit log heights may affect window size. User manual sizing takes precedence; confirm this in live GM and player sessions.
- The legacy generic framework's Discovery and Complication content and some event-shift specifications are incomplete; this dev checkpoint does **not** invent missing rules.
- Mount Ironrot is a candidate foundation for future general-purpose expedition profiles, but no architectural refactor is approved or included in this checkpoint.

## Development and promotion

Work on `develop`, use the module ID as the ZIP root directory, bump `module.json` and the ZIP name together for future builds, and test live before any promotion. `main`, tags, and published Releases require separate owner authorization under the policy in the private `zft-standards` repository.
