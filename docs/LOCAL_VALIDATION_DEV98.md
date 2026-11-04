# Local Validation — ZFT Overland Travel 0.4.0-dev.98

## Baseline

- Complete dev.97 manual-install package.
- GitHub checkpoint: `LuvacZantor/zft-overland-travel` / `feature/expedition-system-1.1` / `5597f595a6dbda24732e68076f7445129dd0e859`.
- Live target remains Foundry V13.351 / D&D5e 5.2.5.

## Scope

- Separate Travel Quality Success Points / Failure Points rows.
- Separate Expedition Momentum Event Roll Modifier / Persistence rows.
- Structured help for Travel Quality, Momentum Change, and Expedition Momentum only.
- Help is rendered as a fixed `document.body` overlay and is not nested inside Dashboard cards.
- No rules/state changes.

## Automated evidence

- Full Node suite: **94/94 passed** before final packaging.
- Dev.98 source guard verifies the body-level fixed overlay, absence of dev.95 generic tooltip wrappers, and retained dev.94/dev.97 visual baseline markers.
- JavaScript/MJS syntax checks: **64 passed**.
- Relative imports: **149 checked, 0 missing**.
- Manifest and language JSON parse: passed.
- CSS structural brace check: **1586 opening / 1586 closing**.
- Protected MountIronrotV413 source SHA-256 remains `9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425`.
- `packs/`, `assets/`, `src/migration/`, and `src/theme/` remain unchanged from dev.97.

## Live acceptance

See the dev.98 addendum in `INTEGRATION_TEST_NOTES.md`. Live visual acceptance is required before expanding this tooltip pattern to additional Dashboard/Log elements.
