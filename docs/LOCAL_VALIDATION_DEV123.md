# Local Validation — ZFT Overland Travel 0.4.0-dev.123

**Date:** November 4, 2026  
**Baseline:** complete `0.4.0-dev.122` manual-install ZIP  
**Target:** Foundry V13.351 / D&D5e 5.2.5  
**Evidence:** locally validated only; live Foundry acceptance pending

## Scope

Dev.123 expands the Navigation Complication Engine from the Route Obscured prototype to all eight Navigation primary Complications and their 64 narrative detail results. It introduces the owner-approved deterministic Consequence Severity model and GM-selected consequence application while preserving the existing travel workflow and persistence contracts.

## Local checks

- Active Node regression suite: **182/182 passed**.
- Historical dev.95/dev.96 cosmetic tests remain intentionally excluded, matching the established validation convention.
- JavaScript/MJS syntax: **94 files passed**.
- Relative imports: **165 checked, 0 missing**.
- JSON parsing: passed.
- CSS brace balance: passed.
- `module.json.version` and `MODULE_VERSION`: `0.4.0-dev.123`.
- Protected `src/expeditions/mount-ironrot/MountIronrotV413.source.js` SHA-256 remains `9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425`, identical to dev.122.
- `assets/`, `packs/`, `src/migration/`, and `src/theme/` compare unchanged against dev.122.

## Dev.123 rule checks

- Eight Navigation primary Complications, eight details each.
- Primary and detail rolls are separate visible d8 rolls and support normal/exact/forced-result GM control.
- Existing saved Complications remain idempotent and do not reroll.
- Roll / Check and Direct Adjudication remain supported.
- Actor-owned rolls remain bound to the selected Actor; system-owned rolls use neutral `ZFT Overland Travel` speaker.
- User-facing consequence terminology is Consequence Severity 0–4.
- Operational Readiness remains opt-in and is unchecked by default.
- Live consequence workflow performs no consequence dice roll.
- Lost Time baseline: `0/1/2/4/8` planned hours.
- Lost Progress baseline: `0/10/25/50/100%`.
- Resource Loss baseline: `0/10/25/50/100%` with the closed six-item resource list.
- HP Damage baseline: `0/10/20/35/50%` of maximum HP.
- Exhaustion baseline: `+0/+1/+2/+3/+4`, capped at six by the runtime.
- Threat records a future-engine handoff with final Consequence Severity only.
- Operational Readiness control uses a compact checkbox rather than full-width generic input styling.
- dev.122 two-column GM controls remain intact.

## Modified implementation files

- `src/engines/complication/ExpeditionComplication.js`
- `src/engines/complication/ComplicationLibrary.js`
- `src/engines/hex-travel/HexExpeditionRuntime.js`
- `src/engines/hex-travel/HexTravelConsole.js`
- `src/styles/zft-overland-travel.css`
- version/documentation/test files associated with dev.123

## Live acceptance still required

Use `INTEGRATION_TEST_NOTES.md` for the in-world checklist. In particular, exercise each consequence type against real D&D5e Actors/Items, verify resource quantity/use mutations, HP/temp-HP handling, Exhaustion synchronization, pending/resolved card presentation, player visibility, and no world-clock movement until normal travel commit.
