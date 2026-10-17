# Testing, verification and known limitations

## Environment / prerequisites

- Foundry VTT **V13**, compatible D&D 5e system (developed around dnd5e 5.2.x), and active **Midi-QOL v13**.
- Dice So Nice is **optional** but important to the visual experience.
- A GM running a **Script macro**; selected player online for direct remote prompt, or GM/eligible Owner substitution for an absent PC.
- Character assigned in Foundry Player Configuration. Merely having an owned token on the canvas is not enough to be included.

## Regression test checklist

1. `node --check versions/Mount_Ironrot_Hex_Travel_v4_4_Secondary_PC_Clarity.js` for syntax.
2. Normal / Fast / Slow pace; verify upward rounding against base 2d4 (2–8 hours).
3. DC 15 navigation success -> **only 2d4** rolled for travel.
4. DC 15 navigation failure -> **2d4 + 1d4 + 2**, and all three d4 faces are displayed.
5. Confirm **delay added after** pace adjustment. No accidental doubling of failed travel.
6. Confirm a connected player's **Midi-QOL** roll dialog opens automatically, is not fast-forwarded, and permits modifiers/formula adjustment.
7. Confirm assigned *offline* PC can be chosen and GM/Owner handles its roll; verify actor statistics match the selected character.
8. Test secondary None and all five optional secondary skills, including independent character/roller selection. Verify that the current navigator never appears in the Secondary PC menu; changing Navigator updates the list, keeps an eligible prior secondary selection, and picks another character if necessary. With one assigned PC, optional secondary actions cannot be chosen.
9. Test cancellations, failed remote rolls, fallback/retry, DM success/failure override, and avoiding stale progress cards.
10. Confirm progress card is visible while Dice So Nice animates final travel dice and that final card appears latest in chat.
11. Test with Dice So Nice disabled. Verify no duplicate travel dice messages.
12. Check the character-specific Midi-QOL triggers (e.g. Zhara's possible bonus d4 under its actual trigger conditions); **not independently verified by the macro tests**.
13. Confirm world time, movement, actor resources, module data, and main ZFT Overland Travel code **are unchanged**.

## Actual verification status

- Source files were archived intact from the prior macro revisions.
- Previous development reported syntax and mocked workflow tests, including failure/success, offline GM fallback, and Dice So Nice wait behavior.
- **User report:** the v4.3 continuous card “seems to be working.” v4.4 only changes secondary-character selection UI and is not yet live-tested. This is useful live feedback, **not** a comprehensive integration test against all configurations or features.
- Dice So Nice's per-client visuals and network timing may vary. Waiting on the GM's `waitFor3DAnimationByMessageID` does not guarantee exact simultaneous visibility for every connected client.
- The module's own `module.json`, `main.js`, source, packs, and metadata are not involved.

## Troubleshooting

- **No eligible PCs:** verify Player Configuration actor assignments, not scene tokens.
- **Player not prompted:** check that the selected user is online, owns the chosen actor, and Midi-QOL's socket API is available on GM/player clients.
- **Midi-QOL bonus omitted:** inspect the feature's trigger conditions and Midi-QOL automation. A bonus conditional on *failure* should not fire on success.
- **A player waits too long:** review Midi-QOL's player roll timeout; remote rolls can be auto-resolved when their module timeout elapses.
- **Card jumps but players don't see it:** Foundry may respect a player's scroll position. The macro only posts newest card; it does not force-scroll.
- **Animation gap:** verify Dice So Nice is enabled and its `waitFor3DAnimationByMessageID` API is available in that version.

Save future known issues and solutions here rather than reconstructing decisions from chats.
