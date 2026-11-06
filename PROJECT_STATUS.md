# ZFT Overland Travel — Current Project Status

**This is the single authoritative status and branch-routing entrypoint for this repository.** A fresh development chat should read this page first, then verify the named branch HEAD, manifest, current handoff and test evidence. Do not scan branches and choose the one with the biggest-looking version.

**Last verified:** 2026-11-06 (America/New_York)  
**Repository:** [`LuvacZantor/zft-overland-travel`](https://github.com/LuvacZantor/zft-overland-travel)  
**Central development policy:** [`zft-standards/main/PROJECT-INSTRUCTIONS.md`](https://github.com/LuvacZantor/zft-standards/blob/main/PROJECT-INSTRUCTIONS.md)

## Active development source

| Item | Verified state |
| --- | --- |
| **Active branch** | [`feature/expedition-engines`](https://github.com/LuvacZantor/zft-overland-travel/tree/feature/expedition-engines) |
| **Verified HEAD and latest source-changing checkpoint** | [`28b3162b5759e96aeb345bfff6687940484793c0`](https://github.com/LuvacZantor/zft-overland-travel/commit/28b3162b5759e96aeb345bfff6687940484793c0) |
| **Previous locally validated source checkpoint** | [`55bd7d9e90027366e2bec516ace30e5d0d0a14d7`](https://github.com/LuvacZantor/zft-overland-travel/commit/55bd7d9e90027366e2bec516ace30e5d0d0a14d7) (dev.126) |
| **Module ID / version** | `zft-overland-travel` / **`0.4.0-dev.130`** |
| **Target** | Foundry V13.351 / D&D5e 5.2.5 |
| **Evidence level** | **Locally validated**, 228/228 active Node tests; final in-world GM/player acceptance **not confirmed** |
| **Development state** | **Paused at dev.130 stopping-point checkpoint. No development authorized until resumed.** |
| **Release / promotion** | No runtime merge to `main`, tag, stable GitHub Release, or deployment |

The source checkpoint was committed as a fast-forward to the existing feature branch, retaining previous Git history, code, assets, compendiums, protected original source, and historical documentation. The **default `main` branch still contains a legacy module ID/version** and is a navigation/documentation branch for this development work, not the dev.130 runtime.

## Follow these references in order

1. [Active module manifest](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/module.json) to verify module ID/version and dependency declarations.
2. [Active development handoff](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/docs/DEVELOPMENT_HANDOFF.md) for actionable scope, preservation rules and next testing.
3. [Development README](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/README.md) for architecture summary and the documentation index.
4. [Current live acceptance checklist](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/INTEGRATION_TEST_NOTES.md) for in-Foundry testing.
5. [Dev.130 local validation](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/docs/LOCAL_VALIDATION_DEV130.md) and [the complete validation index](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/docs/validation/INDEX.md).
6. [Expedition System 1.1 design/roadmap](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/docs/EXPEDITION_SYSTEM_DESIGN_1.1_DRAFT.md) and [shared hex-record contract](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/docs/HEX_RECORDS.md). Some passages are historical and do not override later implementation.
7. [Historical changelog](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/CHANGELOG.md) and [archived handoffs](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/docs/history/DEVELOPMENT_HANDOFF_ARCHIVE.md) when investigating older versions, not when selecting the active branch.

## What is currently implemented

Dev.130 includes the established Hex Travel workflow and six expedition roles; paired adjudication; persistent hex records, saved dice and GM rulings; Travel Quality and Momentum; explicit Event rolls; Navigation Complication generation and GM consequences; Forced March/Exhaustion and optional committed-hour world-clock syncing; and the saved Travel Log and optional media/theme integrations.

**Dev.127–130 functional/presentation changes:**

- **dev.127:** Navigation Guide/Vanguard totals appear in the Expedition Log during GM review before rolling travel time, alongside `Pending GM`. Saved final outcomes remain authoritative. Final Result is shown after a hex completes and retained in its Travel Log.
- **dev.128:** GM-only **Export Data** JSON containing the cumulative expedition ledger and an analysis-oriented hex summary, with unknown provenance marked unknown. Read-only export; does not affect game mechanics.
- **dev.129:** Capture available native d20 evidence for Advantage/Disadvantage and the used die without fabricating unavailable faces; theme-safe GM dropdown success/failure/reroll colors; visually highlighted Forced March Constitution Save DC; Complication Details control layout repair.
- **dev.130:** **Resolution Recorded** appears when an Event/Complication resolution is saved, before travel hours are committed. It persists through partial travel; becomes **Final Result** after hex completion; retracts when a new hex starts. The permanent completed-hex record remains in Travel Log. Resolution displays and Complication outcome guidance use compact, consistent rows across supported types.

The earlier dev.123 Complication Roll / Check path is historical; dev.124 introduced GM-adjudication-only resolution. The former Roles tab was removed in dev.110. Planned Opportunity/Threat/Discovery/Encounter functionality in draft documents must **not** be represented as fully implemented or live accepted.

### Latest recorded validation

[Dev.130 local validation](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/docs/LOCAL_VALIDATION_DEV130.md) reports **228/228 active regression tests passed** in a fresh extraction, **105 JS syntax checks**, **176 relative imports resolved**, CSS/JSON/ZIP validation, and **36 protected assets/source files unchanged**. Historical obsolete cosmetic snapshots are excluded as documented. These checks are local/simulated only. Final live acceptance in Foundry V13.351 with D&D5e 5.2.5 is **pending**. V14 is not verified.

The exact manual-install dev.130 package was generated before the checkpoint: `zft-overland-travel-v0.4.0-dev.130.zip`, SHA-256 `c5e129e73f31e92001e4345b95385e7705e952537b0fc83469cb01357f5c6871`. The full source and tests are now in the feature branch, but **the ZIP has not been published as a GitHub Release or distribution asset**.

## Stopping-point status and pending acceptance

**Stopping point set November 6, 2026.** No further development, module optimization, new build, branch merge, tag, or release is currently authorized. The owner performed substantial hands-on testing but has **not** confirmed completion of the entire live acceptance checklist. Retain the dev.130 tested source and artifact; preserve a known-good rollback package and world backup.

**When resuming:** Read this file, then verify the live feature HEAD, `module.json`, [current handoff](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/docs/DEVELOPMENT_HANDOFF.md), and [live test checklist](https://github.com/LuvacZantor/zft-overland-travel/blob/feature/expedition-engines/INTEGRATION_TEST_NOTES.md). Check pending GM/player acceptance including responsive resolution displays, saved results before/after travel commitment, client permissions, rerolls, exports, Exhaustion and world clock integration. Resolve any reported defects with a **new authorized scope**. Module packaging cleanup and structural optimization remain deferred.

The feature branch preserves the five more recent historical/design documents from the GitHub dev.126 documentation cleanup rather than overwriting them with stale copies from the local dev.130 ZIP. Old validation notes retain their original recorded state; use this canonical status and current handoff for the present source checkpoint.

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
| **`feature/expedition-engines`** | **`zft-overland-travel` / `0.4.0-dev.130`** | **Active source, paused checkpoint** |
| `feature/overland-framework` | `zft-overland-travel` / `0.4.0-dev.29` | Historical feature checkpoint |
| `milestone/overland-travel-0.4.0-dev.28` | `zft-overland-travel` / `0.4.0-dev.28` | Historical milestone |

No historical branch was deleted, rewritten, merged, or promoted during this development checkpoint.

## Status freshness and write authorization

1. **Open this file first** for any Overland Travel repository task; it provides branch selection but does not replace checking live GitHub.
2. Confirm that the named branch and its current HEAD actually exist and that `module.json.version` matches the recorded version. Check the current handoff and tests. If a later approved commit has changed the HEAD, **report that this status pointer needs updating**; do not silently fall back to `develop` or select another branch based on apparent recency.
3. Each future approved development checkpoint should produce an updated, concise handoff on the working branch and, under separately scoped GitHub approval, refresh **this one status page** with the new branch/HEAD/version and evidence. Keep prior handoffs under history.
4. Keep local/simulated validation distinct from GM/player live verification and stable release. No documentation update authorizes source changes.
5. **No GitHub write without fresh, explicit, task-specific approval.** Authorizations for the feature-branch documentation cleanup and this default-branch status commit do not cover future pushes, merges, tags, releases, settings changes or deployments.

**Current choice:** stop at the dev.130 checkpoint on `feature/expedition-engines` (verified HEAD above). Resume testing or development only under a later, explicitly approved task; do not treat this checkpoint as a stable release.
