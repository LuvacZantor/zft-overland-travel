# Version history (preserve previous files)

All macros are archived in [`versions/`](versions/). Filenames are monotonically increasing so future progress is easy to locate; update the changelog whenever a new script is saved.

- **v4.0 (archive label) — Dice Visuals**: Direct Midi-QOL client prompts carried forward from an earlier v4 variant; real native Foundry travel rolls are attached to chat to allow Dice So Nice animation. Earlier files used the same v4 label for multiple different changes, hence the `v4_0` archive filename. Source code is unchanged.
- **v4.1 — All Three Dice**: Failed navigation presents the base 2d4 and extra penalty d4 in one combined native roll. Displays individual dice and separates the fixed +2 delay.
- **v4.2 — Progressive Card**: Post the Mount Ironrot card at the start; replace and bring it to the bottom after navigation, secondary check, and final time roll. Dice attach only to the completed card. **Issue discovered:** prior card disappears while Dice So Nice hides the incoming roll message during animation.
- **v4.3 — Continuous Card (current)**: Existing card changes to “Rolling Travel Dice” and stays visible until Dice So Nice completes, then the completed card replaces it. User reported this **seems to be working** in live use.

## Design decisions carried forward

- GM-only initiation; assigned PC roster from Player Configuration; offline PC roll fallback.
- Direct Midi-QOL skill dialogs on player's own client. No chat-card clicking and no extra `zft-ironrot-travel` helper module.
- Pace and `1d4 + 2` navigation delay follow the agreed one-hex adaptation.
- Secondary activity chosen in advance, default None; results require GM adjudication.
- Dice rolls are visual; finished card is newest; intermediate statuses are transient.
- Keep Chapter 4-specific macro separate from generic ZFT Overland Travel code and data.

## Next version

The next revised macro should be named `Mount_Ironrot_Hex_Travel_v4_4_<descriptive_change>.js`, or use a new larger version only if intentionally agreed. Never overwrite the prior version file. Avoid duplicate version numbers for distinct content.
