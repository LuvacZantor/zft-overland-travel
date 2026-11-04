# Local Validation — 0.4.0-dev.109

**Status:** LOCALLY VALIDATED / NOT LIVE VERIFIED  
**Baseline:** complete `0.4.0-dev.108` manual-install package  
**Target:** Foundry V13.351 / D&D5e 5.2.5

## Scope

- Preserves roster phase identity while adding a separate red Exhaustion severity wash that increases by Exhaustion level.
- Keeps the fixed upper-right level marker and makes its tone severity-aware.
- Converts Exhaustion help to a compact red-tinted body-level status card using the same severity class; 2024 D20 Tests/Speed and legacy effect text remain rule-aware.
- Narrows the actual Expedition Log Roll/Result grid so the d20 sits closer to Result while long pending text remains contained.
- Native D&D5e Exhaustion state/refresh hooks remain authoritative; presentation only.
- No travel, role, Travel Quality, Momentum, Event, Threat, Forced March, clock, persistence-schema, theme, pack/asset, migration, or protected Mount Ironrot mechanics change.

## Automated/static evidence

- Node tests: **128/128 passed** in the source worktree.
- JavaScript/MJS syntax checks: **75 passed**.
- Relative imports: **151 checked, 0 missing**.
- JSON: **2 files parsed successfully**.
- CSS structural brace check: **1704 / 1704**.
- Protected files compared with dev.108: **32 / 32 byte-identical**.
- Protected Mount Ironrot SHA-256: `9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425`.

These checks are local evidence only. Live acceptance still requires owner inspection in Foundry V13.351 / D&D5e 5.2.5.
