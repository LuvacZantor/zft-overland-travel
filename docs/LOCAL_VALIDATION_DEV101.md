# Local Validation — ZFT Overland Travel 0.4.0-dev.101

**Date:** November 3, 2026  
**Evidence level:** locally validated only; not live Foundry acceptance.  
**Baseline:** complete local `0.4.0-dev.100` manual-install package.  
**Remote checkpoint:** `feature/expedition-system-1.1` remains at `5597f595a6dbda24732e68076f7445129dd0e859` (`0.4.0-dev.97`). No GitHub write is part of this build.

## Scope

- Add current-hex Event to Dashboard Expedition State.
- Show Awaiting Event Roll before the explicit GM Event stage.
- Show saved Event result plus compact roll/resolution detail after Roll Event.
- Move the four Event bands from permanent Dashboard chrome into the body-level Event help overlay.
- Add Event semantic state accents without changing Event mechanics.

## Pre-package automated evidence

- Full Node regression suite: **105/105 passed**.
- Existing dev.100 explicit Event-stage behavior remains covered.
- New dev.101 tests verify Dashboard Event state, removal of the permanent chart, Event help bands/current roll detail, and semantic Event classes.

## Preservation intent

No intended changes to Event probabilities, Momentum modifiers, Travel Quality scoring, travel duration/commit behavior, ledger/world-time accounting, Threats, Forced March/Exhaustion, optional integrations, packs/assets, migration, themes, or the protected Mount Ironrot source.

Final syntax/import/archive/preservation and fresh-extraction results are recorded in the build report delivered with the ZIP.
