# ZFT Overland Travel 0.4.0-dev.89 | Local Validation

**Date:** November 2, 2026  
**Evidence level:** locally validated only; not live Foundry acceptance.  
**Build baseline:** complete dev.88 manual-install package, with key runtime files verified against GitHub `LuvacZantor/zft-overland-travel` branch `feature/expedition-system` checkpoint `fca67c46e7c1ca5921a031645c9d9fa99063b469`.  
**Isolated GitHub branch:** `feature/expedition-system-1.1` exists at that exact dev.88 checkpoint. Dev.89 source is not pushed.

## Scope validated

Dev.89 adds the first staged Expedition System 1.1 runtime slice:

- new-hex staging after Navigation/travel dice and before committed travel hours
- Reconnaissance / Expedition Support gate
- Travel Quality point calculation across all six effective role outcomes
- persistent five-state Momentum and one shift per hex
- corrected four-result Event Chart with native d20 Event roll
- Quiet Travel no-op resolution
- explicit manual resolution bridge for not-yet-implemented Complication / Major Complication / Opportunity engines
- Events-tab presentation and GM controls
- multiple persistent Threat records with explicit stage and visibility controls
- read-only Momentum/Threat inspection through `game.zftOverlandTravel.hexRecords`

No specialized Complication content resolution, Opportunity content engine, Discovery persistence, automatic Complication-to-Threat handoff, Recon-to-Threat reveal automation, or Encounter handoff is claimed in this build.

## Automated tests

Command:

```text
node --test tests/*.mjs
```

Result: **63 passed, 0 failed**.

Coverage includes:

- approved Travel Quality scoring and binary GM override rule
- Momentum shift/clamping and fail-closed malformed saved Momentum
- corrected Event bands/modifiers and Quiet no-op
- shared-record Event persistence and stale/duplicate protection
- manual Event bridge with no invented ledger mutations
- multi-Threat create/advance/reduce/resolve/visibility behavior
- GM authorization for staged mutations
- new-hex staging before travel-hour commitment
- existing cancellation, stale-GM, resume, cross-day, Forced March, clock reconciliation, manual correction, Reset/Clear Log, role-resolution, and read-only record regressions

## Static validation

- `module.json`: valid JSON
- `lang/en.json`: valid JSON
- JavaScript / MJS syntax: **53 files passed `node --check`**
- Relative imports: **130 checked, 0 missing**
- Manifest module/style/language references: present
- `src/styles/zft-overland-travel.css`: balanced structural braces
- `module.json.version`: `0.4.0-dev.89`
- `src/constants/module-constants.js` version: `0.4.0-dev.89`

## Preservation checks

The complete dev.88 package was retained as the file baseline. Diff review shows runtime/content changes are limited to the staged Expedition implementation, Events/Threat UI, tests, versioning, and documentation.

The following established areas are unchanged relative to the dev.88 package:

- `assets/audio/`
- `packs/`
- `src/migration/`
- `src/theme/`
- older generic travel/complication/discovery/quiet/threat/encounter engines
- original Mount Ironrot support files except no files in that directory were modified

Required preserved source:

```text
src/expeditions/mount-ironrot/MountIronrotV413.source.js
SHA-256 9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425
```

The hash matches the dev.88 package used as the baseline.

## Live acceptance still required

Target live environment remains Foundry V13.351 / D&D5e 5.2.5. The GM/player procedure is in `INTEGRATION_TEST_NOTES.md`.

Particular live risks to verify:

1. new hex stops before committing hours and directs the GM through Roles then Events
2. native Event die / Dice So Nice presentation and reload behavior
3. Events-tab layout at narrow widths, all themes, dock/undock, and interface scaling
4. GM versus player Threat visibility and controls
5. existing Forced March / Exhaustion / world-clock behavior after Event Resolution unlocks travel
6. legacy unfinished travel without a shared record remains usable

Do not use passing Node/static tests as evidence of live Foundry acceptance or as a reason to replace the known campaign-session build.
