# ZFT Overland Travel — Local Validation 0.4.0-dev.129

**Status:** Locally validated, **not live-verified**. **Target:** Foundry V13.351 / D&D5e 5.2.5. **Source:** complete locally preserved dev.128 ZIP. **GitHub:** no write performed; last source-changing remote checkpoint dev.126.

## Scope

1. Preserve public Navigation, Reconnaissance and Support totals and GM rulings while saving actual native d20 evidence when exposed (Advantage/Disadvantage/Normal, two die faces, used/dropped and other modifier). Do not infer absent faces.
2. Give Navigation, Reconnaissance and Support ruling dropdowns consistent color and immediate text-preview feedback: green Success, red Failure, amber Re-roll.
3. Highlight Constitution Save DC only during an active Forced March Current Step; retain the existing progression (Hour 9 DC 11, Hour 10 DC 12).
4. Correct Complication Details GM Result Control horizontal compression by stacking its description above wrapping action buttons.
5. Preserve all existing gameplay, complete dev.128 built-in data export, dev.127 Final Result/Navigation review, hex ledger, world-clock checkpoints, Forced March/Exhaustion, themes, public APIs and original Mount Ironrot source.

## Regression evidence

- **221/221 active Node regression tests passed** on a complete fresh extraction. The superseded dev.95/dev.96 cosmetic tests remain intentionally excluded under the existing versioned rollback convention.
- **104 JavaScript/MJS syntax checks**, **175 relative imports resolved**, **2 JSON files parsed**, CSS brace count **1,945 open / 1,945 close**, and single-root manual ZIP structure with CRC verified.
- **36 protected source/asset/migration/theme files** compared byte-for-byte against the complete dev.128 ZIP with **0 mismatches**. No original file from dev.128 was removed.
- Native roll tests cover real selection flags and keep-high/keep-low formulas, unknown evidence, mismatched totals, unrelated/private chat messages, effective GM rulings and legacy stored data.
- UI checks cover ruling colors and immediate previews, Complication action visibility, Forced March DC and dev.128 exporter retention.
- **195 files in complete manual-install ZIP**. Foundry GM/player live acceptance remains NOT TESTED.

## Live acceptance required

Use [INTEGRATION_TEST_NOTES.md](../INTEGRATION_TEST_NOTES.md). Repeat in-world on GM and player clients, multiple themes, narrow workflow and zoomed windows. If Midi returns only the final total and not native d20 dice/chat metadata, leave detailed evidence absent and report that limitation rather than filling it with inferred values. Test in a backed-up world; dev.128 remains the prior complete rollback ZIP.

## Deployment status

No GitHub commit/push, merge, tag, release or Foundry world deployment. A complete local test ZIP requires owner-led in-world validation before any acceptance.
