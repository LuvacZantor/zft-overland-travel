# Local Validation — 0.4.0-dev.107

**Status:** LOCALLY VALIDATED / NOT LIVE VERIFIED  
**Baseline:** complete `0.4.0-dev.106` manual-install package  
**Target:** Foundry V13.351 / D&D5e 5.2.5

## Scope

- Paused Forced March with unfinished hex hours presents **Travel Decision** instead of implying Forced March is the only continuation path.
- Continue Travel resumes Forced March; New Travel Day carries the unfinished hours forward with a fresh daily allowance.
- The day/rest transition does not fabricate a travel-hour commit.
- Routine informational Foundry toasts are removed from the modern Hex Travel workflow; warnings/errors, required dialogs, and Hex Complete remain.
- Expedition role modified totals are centered inside the d20 icon.
- Role Log grid reserves a stable Roll column and wraps long Result text such as **Awaiting GM Confirmation** without moving the die.
- No travel, role, Momentum, Event, Threat, Forced March/Exhaustion, persistence-schema, theme, pack/asset, migration, or protected Mount Ironrot mechanics change.

## Automated/static evidence

- Node tests: **122/122 passed** in the source worktree.
- JavaScript/MJS syntax checks: **73 passed**.
- Relative imports: **151 checked, 0 missing**.
- JSON: **2 files parsed successfully**.
- CSS structural brace check: **1672 / 1672**.
- Protected files compared with dev.106: **32 / 32 byte-identical**.
- Protected Mount Ironrot SHA-256: `9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425`.

These checks are local evidence only. Live acceptance still requires the owner to exercise the paused Forced March / New Travel Day transition, pending role rows, GM/player views, and representative themes in Foundry V13.351 / D&D5e 5.2.5.
