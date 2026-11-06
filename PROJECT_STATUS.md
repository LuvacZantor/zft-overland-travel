# ZFT Overland Travel — Current Project Status

**This is the single authoritative status and branch-routing entrypoint for this repository.** A fresh development chat should read this page first, then verify the named branch HEAD, manifest, current handoff and test evidence. Do not scan branches and choose the one with the biggest-looking version.

**Last verified:** 2026-11-06 (America/New_York)  
**Repository:** [`LuvacZantor/zft-overland-travel`](https://github.com/LuvacZantor/zft-overland-travel)  
**Central development policy:** [`zft-standards/main/PROJECT-INSTRUCTIONS.md`](https://github.com/LuvacZantor/zft-standards/blob/main/PROJECT-INSTRUCTIONS.md)

## Active development source

| Item | Verified state |
| --- | --- |
| **Active branch** | [`feature/expedition-engines`](https://github.com/LuvacZantor/zft-overland-travel/tree/feature/expedition-engines) |
| **Verified HEAD (after documentation cleanup)** | [`6532c016caa2c82e2cbe01d4073a5ea1068824b9`](https://github.com/LuvacZantor/zft-overland-travel/commit/6532c016caa2c82e2cbe01d4073a5ea1068824b9) |
| **Last runtime/source-changing commit** | [`55bd7d9e90027366e2bec516ace30e5d0d0a14d7`](https://github.com/LuvacZantor/zft-overland-travel/commit/55bd7d9e90027366e2bec516ace30e5d0d0a14d7) |
| **Module ID** | `zft-overland-travel` |
| **Manifest version** | **`0.4.0-dev.126`** |
| **Target** | Foundry V13.351 / D&D5e 5.2.5 |
| **Evidence level** | **Locally validated**; current dev.126 build has not completed full live Foundry GM/player acceptance |
| **Next test version** | Not assigned or built by this documentation operation |
| **Release/promotion** | No `main` code promotion, tag, GitHub Release or deployment performed |

The HEAD in the table is a **documentation-only commit**. The preceding source-changing commit is listed separately so that the current source baseline and status/documentation changes cannot be confused.

## Follow these references in order

1. [Active module manifest](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/module.json) to verify module ID/version and dependency declarations.
2. [Active development handoff](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/docs/DEVELOPMENT_HANDOFF.md) for actionable scope, preservation rules and next testing.
3. [Development README](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/README.md) for architecture summary and the documentation index.
4. [Current live acceptance checklist](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/INTEGRATION_TEST_NOTES.md) for in-Foundry testing.
5. [Dev.126 local validation](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/docs/LOCAL_VALIDATION_DEV126.md) and [the complete validation index](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/docs/validation/INDEX.md).
6. [Expedition System 1.1 design/roadmap](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/docs/EXPEDITION_SYSTEM_DESIGN_1.1_DRAFT.md) and [shared hex-record contract](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/docs/HEX_RECORDS.md). Some passages are historical and do not override later implementation.
7. [Historical changelog](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/CHANGELOG.md) and [archived handoffs](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/docs/history/DEVELOPMENT_HANDOFF_ARCHIVE.md) when investigating older versions, not when selecting the active branch.

## What is currently implemented

The dev.126 source includes the modular Hex Travel workflow, persistent shared expedition/hex records, the six roles and paired adjudications, Travel Quality and Momentum, Event staging, current Navigation Complication generation (eight primary types, eight details each), GM result controls and adjudication, selected deterministic consequences, and the saved travel/log pipeline. The existing Forced March/Exhaustion and optional world-clock integration remain part of the established travel system.

Dev.126 specifically refines the Complication Details display. It preserves dev.125 Primary/Detail generation and change history, and the dev.124 GM-adjudication-only resolution path. The older dev.123 Complication Roll / Check behavior is **not** the current live path. The earlier Roles tab was removed in dev.110; the authoritative Navigation/Reconnaissance/Support results are presented in Travel.

**Do not infer from draft documents that the full Complication content library, Opportunity, Threat/Discovery or shared Encounter engine have been fully implemented or live accepted.** Check the current handoff, source and tests for each feature.

### Latest recorded validation

The [dev.126 report](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/docs/LOCAL_VALIDATION_DEV126.md) records **196/196** active automated tests, **97** JavaScript/MJS syntax checks, **166** relative imports with zero missing, JSON/CSS validation, and protected-file comparisons. These are local/test artifacts; V13 multi-client Foundry acceptance is outstanding and V14 is not verified.

## Next queued development correction

**Pending player-roll visibility in the Expedition Log** (reported 2026-11-06; not yet implemented). Once players roll, display the actual rolled totals in **Navigation**, **Reconnaissance**, and **Expedition Support** immediately, alongside `Pending GM` for the unadjudicated results. Keep original rolls visible when the GM accepts, rerolls or overrides; both GM and player clients should see the appropriately synchronized records. This is **queued feedback**, not authorization to change gameplay code during this documentation cleanup.

## Preserve these invariants

- Existing world ledger, hex-record schema, day/hour accounting, committed-vs-planned travel time and world-clock checkpoints.
- Role assignments, original player rolls, GM rulings, travel outcomes, Momentum/Events, records/history and player/GM views.
- Forced March and D&D5e Exhaustion, roster/attendance, saved settings, themes, packs/assets, optional integrations, documented APIs and migration behavior.
- Original `src/expeditions/mount-ironrot/MountIronrotV413.source.js` without modification.
- Accepted/known-good builds and world data. No destructive migration, unapproved branch merge, force push, or release.

## Other branch identities

| Branch | Manifest ID/version at audit | Role |
| --- | --- | --- |
| `main` (this default branch) | `zantors-overland-travel` / `0.1.0` | Legacy runtime baseline; this document supplies routing only |
| `develop` | `zft-overland-travel` / `0.4.0-dev.77` | Older development checkpoint |
| `feature/expedition-system` | `zft-overland-travel` / `0.4.0-dev.88` | Historical implementation |
| `feature/expedition-system-1.1` | `zft-overland-travel` / `0.4.0-dev.110` | Historical implementation |
| **`feature/expedition-engines`** | **`zft-overland-travel` / `0.4.0-dev.126`** | **Active development** |
| `feature/overland-framework` | `zft-overland-travel` / `0.4.0-dev.29` | Historical feature checkpoint |
| `milestone/overland-travel-0.4.0-dev.28` | `zft-overland-travel` / `0.4.0-dev.28` | Historical milestone |

No historical branch was deleted, rewritten, merged, or promoted during this documentation audit.

## Status freshness and write authorization

1. **Open this file first** for any Overland Travel repository task; it provides branch selection but does not replace checking live GitHub.
2. Confirm that the named branch and its current HEAD actually exist and that `module.json.version` matches the recorded version. Check the current handoff and tests. If a later approved commit has changed the HEAD, **report that this status pointer needs updating**; do not silently fall back to `develop` or select another branch based on apparent recency.
3. Each future approved development checkpoint should produce an updated, concise handoff on the working branch and, under separately scoped GitHub approval, refresh **this one status page** with the new branch/HEAD/version and evidence. Keep prior handoffs under history.
4. Keep local/simulated validation distinct from GM/player live verification and stable release. No documentation update authorizes source changes.
5. **No GitHub write without fresh, explicit, task-specific approval.** Authorizations for the feature-branch documentation cleanup and this default-branch status commit do not cover future pushes, merges, tags, releases, settings changes or deployments.

**Current choice:** continue Overland Travel development from `feature/expedition-engines` at `0.4.0-dev.126`, verify its live HEAD, and apply any future code changes only under the next approved change scope.
