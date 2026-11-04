# Local Validation — ZFT Overland Travel 0.4.0-dev.112

## Scope

First deliberately small Complication Engine vertical slice on the dev.111 tab architecture. Travel remains unchanged. Prototype content is limited to Navigation → Route Obscured with one persistent d8-selected detail.

## Local evidence before packaging

- Active automated regression set: **137/137 passed**.
- Historical dev.95/dev.96 cosmetic tests remain intentionally excluded because dev.97 rolled those experiments back; this matches the established dev.110/dev.111 convention.
- New Complication tests cover minimal record identity, Standard/Major severity, Reconnaissance mapping, idempotent generation, pending→resolved lifecycle, and source wiring.
- JavaScript/MJS syntax: **82/82 passed**.
- Relative imports: **147 resolved, 0 missing**.
- Manifest and language JSON parse: passed.
- CSS brace structure: **1724/1724**.
- Protected Mount Ironrot source, migration, themes, assets, and packs are byte-for-byte unchanged from dev.111.
- Complete manual-install ZIP structure: one `zft-overland-travel/` root with `module.json` at module root.
- Fresh-extraction active regression: **137/137 passed**.
- Initial archive pass contained 151 files; the final package is rebuilt after this validation record is written and rechecked before delivery.

## Live checks

See the dev.112 addendum at the top of `INTEGRATION_TEST_NOTES.md`. Live Foundry V13.351 / D&D5e 5.2.5 verification is required before treating the prototype interaction as accepted.
