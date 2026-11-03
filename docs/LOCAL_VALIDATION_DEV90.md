# Local Validation: 0.4.0-dev.90

**Build:** `0.4.0-dev.90`  
**Date:** November 3, 2026  
**Implementation baseline:** complete local `0.4.0-dev.89` manual-install package  
**Remote reference:** `LuvacZantor/zft-overland-travel`, `feature/expedition-system-1.1`, still frozen at dev.88 commit `fca67c46e7c1ca5921a031645c9d9fa99063b469`  
**Evidence level:** local/static/simulated only. Foundry live acceptance is still required.

## Automated regression

`node --test tests/*.mjs`:

- **71 tests passed**
- 0 failed
- 0 skipped
- 0 canceled

Dev.90-specific coverage includes automatic staged role/outcome orchestration without travel commitment, cancellation safety, state-aware Recovery/race guarding, transient rolled-but-unconfirmed role display, explicit player-visibility state, dashboard/GM-control vocabulary, and preservation of the later explicit safe-hour commit path. Existing record, outcome, Threat, Forced March, clock-reconciliation, correction/reset, player-permission, and legacy-unfinished-travel regressions remain included.

## Static validation

- **56** JavaScript/MJS files passed `node --check`.
- `module.json` and `lang/en.json` parsed successfully.
- **137** relative JavaScript imports were resolved; none were missing.
- Manifest runtime references exist: one ES module, one stylesheet, one language file.
- `src/styles/zft-overland-travel.css` structural brace count: **1489 open / 1489 close** after comments/quoted strings were ignored.
- `module.json.version` and `src/constants/module-constants.js` both use `0.4.0-dev.90`.

## Preservation

Compared byte-for-byte with the complete dev.89 package:

- `assets/` unchanged.
- `packs/` unchanged.
- `src/migration/` unchanged.
- `src/theme/` unchanged.
- Exact original `src/expeditions/mount-ironrot/MountIronrotV413.source.js` preserved with SHA-256:
  `9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425`

No Foundry world data, mutable packs/assets, actor data, calendar state, or GitHub state was modified by this local build process.

## Dev.90 implementation scope

- Automatic post-Navigation Reconnaissance → Support → Travel Quality → Momentum → Event workflow from the authoritative saved record.
- Explicit **Commit Travel** boundary remains separate from staged planning/adjudication and is the only path into existing travel/world-time commitment.
- State-aware **Start Travel / Commit Travel / Continue Travel** primary action.
- State-aware **Recovery** drawer replaces normal Resolve Role Checks.
- Rolled-but-unsaved role results display **Awaiting GM Confirmation** without early persistence.
- **Show to Players** moved to the GM Controls header with explicit dev.90 visibility state.
- **HEX TRAVEL REMAINING** replaces the ambiguous pre-staging label.
- Day → Hex Travel history consolidates Navigation, Reconnaissance, Support, Travel Quality, Momentum, Event and Event Resolution; cross-day continuations do not duplicate that workflow history.
- Events no longer expose routine manual Travel Quality/Momentum/Event execution. Quiet Travel remains automatic; other current downstream outcomes require explicit GM Event Resolution.

## Live acceptance still required

Use `INTEGRATION_TEST_NOTES.md` for the dev.90 Foundry pass. The most important live gates are automatic role firing, transient adjudication display, Recovery interruption behavior, explicit commit/world-time boundary, cross-day persistence, Forced March regression, player visibility/permissions, and refresh/restart reconstruction.

Passing this file's checks does **not** certify Foundry V13.351 / D&D5e 5.2.5 runtime behavior.
