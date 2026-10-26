# Mount Ironrot Hex Travel (standalone side project)

**Latest archived build: v4.13 — Current Day Status (live Foundry verification still in progress).**

This directory archives development of the **Mount Ironrot one-hex travel macro** for the *Vecna: Eve of Ruin* Friday campaign, Chapter 4, using a custom hex map. It lives in the `zft-overland-travel` repository solely as a convenient home for revisions and documentation.

**It is NOT part of the ZFT Overland Travel Foundry module.** It does not use or modify the module's encounter engines, terrain registry, compendium packs, `src/`, `main.js`, or `module.json`. Do not import it into the main module or treat these adventure-specific rules as generic overland-travel mechanics. It is a standalone **Foundry Script Macro**, not a packaged Foundry module.

## Current macro

[`versions/Mount_Ironrot_Hex_Travel_v4_13_Current_Day_Status.js`](versions/Mount_Ironrot_Hex_Travel_v4_4_Secondary_PC_Clarity.js)

Previous versions are retained under [`versions/`](versions/) with incrementing numeric filenames. See [`CHANGELOG.md`](CHANGELOG.md). Historical source is left intact; the `v4_0_Dice_Visuals` archive label clarifies ordering among several earlier files that were all originally labeled v4.

## Install / run

1. Use Foundry VTT V13, a compatible D&D 5e system, and enabled Midi-QOL v13. Dice So Nice is optional.
2. In Foundry, open the existing **Mount Ironrot** Script macro. Replace its Command text with the entire contents of the current `.js` file.
3. Save, then execute **as GM**. Players do **not** execute the travel macro or install an extra helper module.
4. GM selects pace, navigator, who rolls, and optionally a secondary activity and secondary character **before** traveling.
5. Assigned players receive a **direct Midi-QOL-configured roll prompt** on their clients, not a whispered/clickable request card. The roll is not fast-forwarded; players can inspect and modify the roll.
6. After navigation and any selected secondary check resolve, GM confirms or overrides navigation. The travel dice then animate (when Dice So Nice is present) and the completed Mount Ironrot card appears in chat.

The PC roster comes from Foundry **Player Configuration** (`game.users.players[*].character`), not canvas tokens. Offline PCs remain eligible: GM or a connected player with Owner permission can roll for their actor.

## Technical design

- [`RULES_AND_WORKFLOW.md`](RULES_AND_WORKFLOW.md): agreed travel mechanics, actor/roller selection, secondary activities, chat progression.
- [`CHANGELOG.md`](CHANGELOG.md): archived versions and why each iteration changed.
- [`TESTING_AND_LIMITATIONS.md`](TESTING_AND_LIMITATIONS.md): test checklist, dependencies, limitations and known open items.

## Scope / status

The versioned macro remains independent of the module and targets Foundry V13. v4.13 adds persistent travel ledger, hourly forced-march adjudication, Exhaustion reporting, and a player-facing expedition card displaying only the current day's forced-march results. Older days are retained in the ledger but not shown on the chat card. The new-day action continues into travel; Cancel exits without recording an intentional stop. Live testing is still in progress.

Future modifications should create a new incremented version after v4.13, update these notes, and preserve earlier versioned sources. **Do not edit the main ZFT Overland Travel module** as part of this side project.
