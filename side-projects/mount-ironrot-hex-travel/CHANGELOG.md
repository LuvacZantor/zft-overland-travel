# Version history (preserve previous files)

All macros are archived in [`versions/`](versions/). Filenames are monotonically increasing so future progress is easy to locate; update the changelog whenever a new script is saved.

- **v4.0 (archive label) — Dice Visuals**: Direct Midi-QOL client prompts carried forward from an earlier v4 variant; real native Foundry travel rolls are attached to chat to allow Dice So Nice animation. Earlier files used the same v4 label for multiple different changes, hence the `v4_0` archive filename. Source code is unchanged.
- **v4.1 — All Three Dice**: Failed navigation presents the base 2d4 and extra penalty d4 in one combined native roll. Displays individual dice and separates the fixed +2 delay.
- **v4.2 — Progressive Card**: Post the Mount Ironrot card at the start; replace and bring it to the bottom after navigation, secondary check, and final time roll. Dice attach only to the completed card. **Issue discovered:** prior card disappears while Dice So Nice hides the incoming roll message during animation.
- **v4.3 — Continuous Card**: Existing card changes to “Rolling Travel Dice” and stays visible until Dice So Nice completes, then the completed card replaces it. User reported this **seems to be working** in live use.

- **v4.4 — Secondary PC Clarity (archived)**: The Secondary PC dropdown excludes the currently selected navigator, updates when Navigator changes, and preserves a different previously selected secondary PC when possible. A short in-dialog note explains why the same PC cannot take both activities and clarifies that an authorized user may still roll for either actor. Secondary actions are unavailable with fewer than two assigned PCs. All rolls, timing calculations, Midi-QOL prompting, and chat card progression are unchanged.

## Design decisions carried forward

- GM-only initiation; assigned PC roster from Player Configuration; offline PC roll fallback.
- Direct Midi-QOL skill dialogs on player's own client. No chat-card clicking and no extra `zft-ironrot-travel` helper module.
- Pace and `1d4 + 2` navigation delay follow the agreed one-hex adaptation.
- Secondary activity chosen in advance, default None; results require GM adjudication.
- Dice rolls are visual; finished card is newest; intermediate statuses are transient.
- Keep Chapter 4-specific macro separate from generic ZFT Overland Travel code and data.

## v4.5–v4.13 development archive

- **v4.5 — Daily Travel:** Persistent day, accumulated travel hours, unfinished hex progress, and completed-hex counter. Safe eight-hour travel limit and carryover.
- **v4.6 — Hourly Forced March:** Per-hour CON saves after eight hours; DC increases by one for each additional hour. GM adjudication of failed saves.
- **v4.7 — Party Panel / Ledger / Reset:** Unified GM review, manual travel-ledger correction and full-reset workflow.
- **v4.8 — Preserved Decisions / Dialog Clarity:** Existing rulings retained through individual rerolls; new-day labeling and dialogue styling.
- **v4.9 — Player-Facing Status:** Public chat expedition card and CON review progress, refreshed as the journey advances.
- **v4.10 — Compact History:** Narrow-chat-friendly status layout, total completed hex label, and saved forced-march results by hour.
- **v4.11 — Clear Status:** Specific pending/review/completion statuses and retained per-hour results within one refreshed expedition card.
- **v4.12 — Day / Cancel Flow:** Start New Travel Day continues into travel controls; Cancel differs from Stop-and-Carry.
- **v4.13 — Current Day Status (latest archived):** Hide earlier-day roll details from the player-facing card but preserve the ledger; show correct stopped-travel state and carryover. Retain current-day results, rerolls, outcomes, and Exhaustion. Live Foundry testing ongoing.

**Archive limitation:** Earlier v4.5–v4.12 builds were distributed as ZIPs during iterative testing and are not all committed to this repository. v4.13 is the current committed source; v4.4 and earlier remain archived. Do not represent missing intermediate scripts as committed.

## Planned next steps

- Validate v4.13 in the Foundry V13 production environment; address confirmed macro-only bugs in the next version.
- Keep the standalone macro separate from the V14 Overland Travel module. Any future module integration is a separate, not-yet-implemented project.
- Avoid adding full historical-day display to the chat card; current-day results are sufficient for this standalone build.
