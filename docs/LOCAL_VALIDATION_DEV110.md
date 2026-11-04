# Local Validation — 0.4.0-dev.110

**Status:** LOCALLY VALIDATED / NOT LIVE VERIFIED  
**Baseline:** owner-supplied current live `0.4.0-dev.109` manual-install ZIP  
**Baseline ZIP SHA-256:** `c2c3bc4499e1ffb4a77a8822968437bf0985f4f6ef4d6acb3141f5334024edbe`  
**Target:** Foundry V13.351 / D&D5e 5.2.5

## Scope

- Remove the redundant Expedition Log **Roles** tab/panel and its separate all-hex role feed.
- Preserve actual Expedition Roles assignment/editing, saved role data, resolution/rerolls, role reference, and the per-hex role history already rendered in **Travel**.
- Keep **Events**, but remove duplicate per-hex Travel Quality/Momentum/Event/Resolution cards from that tab.
- Preserve **Persistent Threats** and all current Threat state/actions/visibility behavior.
- Reduce Expedition Log tab chrome from three tabs to two: **Travel** and **Events**.
- No game-state or persistence-schema migration.

## Automated/static evidence

- Active Node regression set (excluding the intentionally reverted dev.95/dev.96 cosmetic experiments, as in the dev.109 validation convention): **131/131 passed**.
- JavaScript/MJS syntax: **78 passed**.
- Relative imports: **151 checked, 0 missing**.
- JSON: **2 files parsed successfully**.
- CSS structural braces: **1704 / 1704**.
- Module files before packaging: **145**.
- `packs/`, `assets/`, `src/migration/`, `src/theme/`, and the protected Mount Ironrot source are byte-identical to the supplied dev.109 baseline.
- Protected Mount Ironrot SHA-256: `9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425`.
- Final archive structure and fresh-extraction regression are verified after packaging; they do not replace live Foundry acceptance.

These checks are local evidence only. Live acceptance requires owner testing in Foundry V13.351 / D&D5e 5.2.5.
