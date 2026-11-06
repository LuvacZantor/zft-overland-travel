# ZFT Overland Travel

Foundry VTT expedition and hex-based overland travel module for D&D5e.

**Authoritative starting point:** [Project status and active branch](https://github.com/LuvacZantor/zft-overland-travel/blob/main/PROJECT_STATUS.md). Read that file before selecting a branch or continuing development. The default `main` branch is an older, differently identified module baseline, **not** the current development implementation.

## Current development at this documentation checkpoint

- **Active implementation branch:** [`feature/expedition-engines`](https://github.com/LuvacZantor/zft-overland-travel/tree/feature/expedition-engines)
- **Module ID/version:** `zft-overland-travel` / `0.4.0-dev.126`
- **Target:** Foundry V13.351 with D&D5e 5.2.5
- **Evidence:** [dev.126 local validation](docs/LOCAL_VALIDATION_DEV126.md) (196/196 active tests reported passing); full GM/player Foundry acceptance remains pending
- **Source-changing checkpoint:** [`55bd7d9e90027366e2bec516ace30e5d0d0a14d7`](https://github.com/LuvacZantor/zft-overland-travel/commit/55bd7d9e90027366e2bec516ace30e5d0d0a14d7). Later documentation-only commits do not imply a new test build.

This development version is experimental and has **not** been accepted as a stable release. Do not treat V13 testing as V14 compatibility.

## What this implementation contains

The modular Hex Travel engine records one expedition crossing, assigns six expedition roles in three paired activities, resolves role results with GM adjudication, and stages Travel Quality, Momentum, Event rolls, and follow-on decisions. The current Navigation Complication slice includes primary/detail generation, GM result control, and deterministic permitted consequences. The Expedition Dashboard, GM Controls, and Expedition Log are synchronized with saved expedition state. The existing travel-hour/world-clock checkpoints, Forced March/Exhaustion workflow, themes, and optional integrations remain protected.

Other planned Complication categories, Opportunity, Threat/Discovery and shared Encounter engine work must be checked against the [current handoff](docs/DEVELOPMENT_HANDOFF.md) and [design record](docs/EXPEDITION_SYSTEM_DESIGN_1.1_DRAFT.md); do not confuse planned features with live implementations.

## Documentation index

| Purpose | File |
| --- | --- |
| Canonical active-branch / status routing | [`main/PROJECT_STATUS.md`](https://github.com/LuvacZantor/zft-overland-travel/blob/main/PROJECT_STATUS.md) |
| Actionable current development handoff | [`docs/DEVELOPMENT_HANDOFF.md`](docs/DEVELOPMENT_HANDOFF.md) |
| Development status pointer (not a competing authority) | [`docs/DEVELOPMENT_STATUS.md`](docs/DEVELOPMENT_STATUS.md) |
| Current in-Foundry acceptance checklist | [`INTEGRATION_TEST_NOTES.md`](INTEGRATION_TEST_NOTES.md) |
| All recorded validation evidence | [`docs/validation/INDEX.md`](docs/validation/INDEX.md) |
| Complete historical README/version notes | [`CHANGELOG.md`](CHANGELOG.md) |
| Archived superseded handoffs and status entries | [`docs/history/`](docs/history/) |
| Expedition System 1.1 design / roadmap | [`docs/EXPEDITION_SYSTEM_DESIGN_1.1_DRAFT.md`](docs/EXPEDITION_SYSTEM_DESIGN_1.1_DRAFT.md) |
| Shared persistent hex record contract | [`docs/HEX_RECORDS.md`](docs/HEX_RECORDS.md) |
| Module-specific visual presets | [`docs/THEMES.md`](docs/THEMES.md) |
| Central ZFT project/development standards | [`zft-standards/main/PROJECT-INSTRUCTIONS.md`](https://github.com/LuvacZantor/zft-standards/blob/main/PROJECT-INSTRUCTIONS.md) |

## Installation and API

The installed module folder must be named **`zft-overland-travel`**, matching the current development `module.json.id`. For manual extraction, a complete versioned ZIP must contain `zft-overland-travel/module.json` within one top-level `zft-overland-travel/` folder; a GitHub source-branch ZIP is **not** an installable module package. No new package is built by this documentation cleanup.

After Foundry's `ready` hook, public services are exposed under `game.zftOverlandTravel`. The read-only `hexRecords` API and persistence boundaries are described in [`docs/HEX_RECORDS.md`](docs/HEX_RECORDS.md). User-authored world settings, travel records, module packs/assets, and preserved original Mount Ironrot source are not touched by this documentation update.

## Development policy

Follow the [current ZFT central standards](https://github.com/LuvacZantor/zft-standards/blob/main/PROJECT-INSTRUCTIONS.md). Check the [canonical project status](https://github.com/LuvacZantor/zft-overland-travel/blob/main/PROJECT_STATUS.md), live branch HEAD, current handoff, and manifest before every change. No remote GitHub commit, branch update, merge, tag, or release is authorized by these documents.
