# Local Validation — 0.4.0-dev.108

**Status:** LOCALLY VALIDATED / NOT LIVE VERIFIED  
**Baseline:** complete `0.4.0-dev.107` manual-install package  
**Target:** Foundry V13.351 / D&D5e 5.2.5

## Scope

- Expedition Roster cards carry restrained phase identity: Navigation blue, Reconnaissance teal, Expedition Support violet.
- Exhaustion no longer creates a footer row. Exhausted characters show a compact red level number fixed in the upper-right; Exhaustion 0 renders no marker or placeholder.
- Exhaustion hover/focus uses the existing body-level help overlay. 2024 rules show cumulative D20 Tests and Speed penalties; legacy rules retain their rule-specific effect text.
- Native D&D5e Exhaustion state and refresh hooks remain authoritative; this is presentation only.
- Role Log Roll values are right-aligned inside the existing fixed Roll column while Result retains protected wrapping.
- No travel, role, Travel Quality, Momentum, Event, Threat, Forced March, clock, persistence-schema, theme, pack/asset, migration, or protected Mount Ironrot mechanics change.

## Automated/static evidence

- Node tests: **125/125 passed** in the source worktree.
- JavaScript/MJS syntax checks: **74 passed**.
- Relative imports: **151 checked, 0 missing**.
- JSON: **2 files parsed successfully**.
- CSS structural brace check: **1682 / 1682**.
- Protected files compared with dev.107: **32 / 32 byte-identical**.
- Protected Mount Ironrot SHA-256: `9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425`.

These checks are local evidence only. Live acceptance still requires owner inspection of roster phase tint, Exhaustion level/help behavior, Roll alignment, representative long names, narrow widths, and themes in Foundry V13.351 / D&D5e 5.2.5.
