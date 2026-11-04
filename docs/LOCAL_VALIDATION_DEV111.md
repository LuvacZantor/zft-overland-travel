# Local Validation — ZFT Overland Travel 0.4.0-dev.111

## Scope

Dev.111 establishes the engine-workspace boundary only: Travel remains locked, Events/Persistent Threat UI is removed, and separate Complications/Opportunities tabs are added. Threat backend state/runtime is preserved. No Complication or Opportunity record schema is introduced.

## Baseline

- Source: complete dev.110 manual-install package, matching the committed dev.110 engine-branch checkpoint for runtime files.
- Branch checkpoint: `feature/expedition-engines` at `6f67f30f802b6c1abb07f1437f173645c6e654e0`.
- Target: Foundry V13.351 / D&D5e 5.2.5.

## Results

- Active Node regression suite: **132/132 passed**. The historical dev.95/dev.96 tooltip experiments remain intentionally excluded because dev.97 explicitly rolled those UI experiments back; this is the same validation convention carried by dev.110.
- JavaScript/MJS syntax checks: **79 passed**.
- Relative imports resolved: **150**, **0 missing**.
- Manifest and language JSON parse: passed.
- Version consistency: `module.json` and module constants both report `0.4.0-dev.111`.
- CSS brace structure: **1709/1709**.
- Runtime diff from dev.110 is confined to the Expedition Log tab/placeholder boundary in `HexTravelConsole.js` and matching tab/workspace CSS. Existing Travel history rendering is unchanged.
- Protected `src/expeditions/mount-ironrot/MountIronrotV413.source.js`: unchanged from dev.110.
- `packs/`, `assets/`, `src/migration/`, and theme source files: unchanged from dev.110.
- No files from the dev.110 package were deleted.
- Complete manual-install ZIP: **147 files** under exactly one top-level `zft-overland-travel/` directory with `module.json` at the module root.
- ZIP integrity test: passed.
- Fresh-extraction active regression retest: **132/132 passed**.

## Live acceptance still required

Foundry V13.351 / D&D5e 5.2.5 live testing must confirm the three-tab Log, locked Travel behavior, absence of visible Threat controls, GM/player views, themes, resizing/docking, and preservation of saved Threat/travel state.

Evidence level: **locally validated**, not live verified.
