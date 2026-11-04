# Local Validation — 0.4.0-dev.105

**Status:** locally validated; Foundry live acceptance pending.  
**Baseline:** complete `0.4.0-dev.104` manual-install package.  
**Target:** Foundry V13.351 / D&D5e 5.2.5.

## Scope

- Keep completed hex cards collapsed after completion and after refresh/reload.
- Keep the current Day group independent so same-day travel may remain visible.
- Preserve active/incomplete auto-open behavior and manual historical inspection.
- Preserve all mechanics, persistence, integrations, themes, content, and protected source.

## Automated checks

- `node --test tests/*.test.mjs`: 115/115 passing before packaging.
- Dev.105 regression coverage verifies active/incomplete open behavior and completed/latest default-collapse behavior.
- Full syntax/import/JSON/CSS/archive and protected-file checks are run during final packaging.

## Live acceptance

Use the dev.105 section at the top of `INTEGRATION_TEST_NOTES.md`. After owner acceptance, this build is intended as the Expedition System checkpoint before specialized engine development begins on a new branch.
