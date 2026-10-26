MOUNT IRONROT HEX TRAVEL v4.13

Based on v4.12. Installation: Replace the contents of your existing Foundry Script macro with the complete v4.13 JavaScript file. Run as GM on Foundry V13 / dnd5e 5.2.x / Midi-QOL v13.

CHANGES
- Public expedition chat card displays completed forced-march results for the CURRENT travel day only. No Earlier Days expandable section.
- Earlier days remain in marchHistory in the existing world.mountIronrotTravelV45 setting for continuity / future module work. A full reset still clears that stored history.
- Stopping with unfinished hex time explicitly updates the card phase to Travel stopped rather than Travel in progress; the bottom line identifies carryover to next travel day.

PRESERVED FROM PRIOR BUILDS
- Start New Travel Day continues directly into the travel flow and resets daily hours, not the unfinished hex.
- Cancel / Exit on hourly prompt does not mean Stop and Carry.
- Compact Day / Hours / Total Hexes, player-facing CON saves and history for the current day, individual rerolls, GM adjudication, Exhaustion, and persisted ledger.
- Existing Foundry world setting; no migration or extra module necessary.

NOTES
- The card replaces prior expedition status cards and stays near the latest chat position; it is not a pinned HUD.
- Foundry clock, Fate Coins, Inspiration, and rests are not changed automatically.
- JavaScript syntax checked only. Verify live in Foundry before using in a paid session.
- No GitHub commit performed.