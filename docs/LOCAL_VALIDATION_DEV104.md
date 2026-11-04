# Local Validation — 0.4.0-dev.104

**Status:** locally validated; Foundry live acceptance pending.  
**Baseline:** complete `0.4.0-dev.103` manual-install package.  
**Target:** Foundry V13.351 / D&D5e 5.2.5.

## Scope

- Synchronize the primary GM travel/workflow button with Dashboard Current Step phase color.
- Preserve all mechanics, persistence, integrations, themes, content, and protected source.

## Automated checks

- `node --test tests/*.test.mjs`: 113/113 passing before packaging.
- Dev.104 regression coverage verifies phase assignment, palette parity with Current Step, and primary-action-only emphasis.
- Full syntax/import/JSON/CSS/archive checks are run during final packaging.

## Live acceptance

Use the dev.104 section at the top of `INTEGRATION_TEST_NOTES.md`. This build is intended as the final cosmetic checkpoint before specialized engine work only after owner live acceptance.
