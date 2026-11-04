# Local Validation — ZFT Overland Travel 0.4.0-dev.113

## Scope

Small expansion of the owner-tested dev.112 Complication prototype. Dev.113 adds GM-controlled visible Event d20 selection and the first persisted Complication adjudication outcome. It deliberately does not expand the content library or automate downstream consequences.

## Local evidence before packaging

- Active automated regression set: **141/141 passed**.
- Historical dev.95/dev.96 cosmetic tests remain intentionally excluded because dev.97 rolled those experiments back; this matches the established dev.110–dev.112 convention.
- New tests cover Momentum-aware forceable Event d20 faces, exact forced d20 presentation through the Foundry roll/message path, Event-type forcing through the normal Event chart, persisted four-outcome Complication adjudication, and source/UI boundaries.
- JavaScript/MJS syntax: **83/83 passed**.
- Relative imports: **158 resolved, 0 missing**.
- Manifest and language JSON parse: passed.
- CSS brace structure: **1742/1742**.
- Protected Mount Ironrot source, migration, themes, assets, and packs are byte-for-byte unchanged from dev.112.
- Intended runtime changes are limited to Event-roll control, pure Event raw-face selection, Complication resolution persistence/presentation, scoped CSS, version constants, tests, and current development documentation.
- Complete manual-install ZIP structure must contain one `zft-overland-travel/` root with `module.json` directly inside that module directory.
- Fresh-extraction active regression: **141/141 passed**.

## Evidence level

**Locally validated** only. Live Foundry V13.351 / D&D5e 5.2.5 testing is required for the actual Dialog presentation, Foundry chat roll, Dice So Nice 3D face, and final interaction feel.

## Live acceptance focus

See the dev.113 section at the top of `INTEGRATION_TEST_NOTES.md`. The critical checks are:

1. normal Event roll remains normal;
2. exact forced d20 displays the selected face and still receives Momentum;
3. forced Event type chooses a raw face that reaches the requested band after Momentum instead of bypassing the chart;
4. Complication resolution records one of Strong Success / Success / Failure / Major Failure and optional notes;
5. no consequence, Support, resource, Threat, Discovery, Encounter, or Opportunity automation occurs yet.
