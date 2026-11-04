# Local Validation — ZFT Overland Travel 0.4.0-dev.121

**Evidence level:** locally validated only. Live Foundry V13.351 / D&D5e 5.2.5 acceptance remains pending.

## Scope

- Roll / Check versus Direct Adjudication Complication resolution.
- Actor-safe Chat speaker attribution for Actor-owned ZFT rolls.
- Neutral speaker for system-owned ZFT rolls.
- Operational Readiness opt-in mitigation.
- Human-readable consequence presentation with detailed tier audit preserved.
- Routine Recovery removed from normal controls; internal Recovery implementation preserved.
- Three-column normal GM control layout.

## Automated validation

- Active Node regression suite: **170/170 passed** (historical dev.95/dev.96 cosmetic rollback tests intentionally excluded per established convention).
- JavaScript/MJS syntax: **92/92 passed**.
- Relative imports: **164 checked, 0 missing**.
- JSON: **2/2 valid**. CSS structure: **1818 opening / 1818 closing braces**. Package structure: **one top-level `zft-overland-travel/` directory with `module.json` at its root; 170 files**.
- Protected Mount Ironrot source, migration, themes, packs, and assets: **unchanged from dev.120**.
- Fresh-extraction regression: **170/170 passed**.

## Required live checks

1. Direct-adjudicate a Complication and confirm no d20 occurs.
2. Roll a Complication as Actor A while controlling Actor B; Chat speaker and downstream attribution must remain Actor A.
3. Confirm system-owned detail/consequence dice use ZFT Overland Travel speaker.
4. Confirm Operational Readiness is not consumed unless explicitly selected.
5. Confirm consequence wording, player-facing result card, and three-column GM controls.
