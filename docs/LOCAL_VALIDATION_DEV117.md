# Local Validation — ZFT Overland Travel 0.4.0-dev.117

## Scope

Complication formatting-only pass. Repairs the CSS scope and restructures Detail/Resolve presentation without changing Complication mechanics, persistence, Event routing, or downstream systems.

## Local evidence before packaging

- Active automated regression set: **151/151 passed**.
- New regression covers actual GM workflow-window CSS scoping, separated metadata hierarchy, focused resolution rendering, and redundant auto-cancel suppression.
- Historical dev.95/dev.96 cosmetic experiments remain intentionally excluded because dev.97 rolled those experiments back.
- JavaScript/MJS syntax: **87/87 passed**.
- Relative imports: **158 resolved, 0 missing**.
- Manifest/language JSON: **2/2 parsed**.
- CSS structure: **1770/1770 braces balanced**.
- Protected source/data preservation: **passed against dev.116**; Mount Ironrot protected source, migration, theme manager/editor, packs, and assets are unchanged.
- Manual-install ZIP structure: **passed**; one `zft-overland-travel/` root with **161 files**.
- Fresh-extraction active regression: **151/151 passed**.

## Evidence level

**Locally validated** only after final static/package checks complete. Live Foundry V13.351 / D&D5e 5.2.5 testing is required.

## Live acceptance focus

See the dev.117 section at the top of `INTEGRATION_TEST_NOTES.md`.
