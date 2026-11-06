# ZFT Overland Travel | Active Development Handoff · dev.126

**Verified development source:** `0.4.0-dev.126`, committed on `feature/expedition-engines` on 2026-11-04.
**Last source-changing checkpoint:** [`55bd7d9e90027366e2bec516ace30e5d0d0a14d7`](https://github.com/LuvacZantor/zft-overland-travel/commit/55bd7d9e90027366e2bec516ace30e5d0d0a14d7); the subsequent documentation-only commit changes no runtime files.
**Branch to inspect:** `feature/expedition-engines`; use the exact current branch HEAD from [the canonical project status](https://github.com/LuvacZantor/zft-overland-travel/blob/main/PROJECT_STATUS.md).
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** dev.126 source is committed. The documentation reorganization does not merge, release, deploy, or certify live Foundry acceptance.

## Dev.126 scope

- Refine pending Complication Details as a decision aid rather than a collection of equal-weight cards.
- Preserve Situation as the focal content.
- Reduce metadata to **Reconnaissance** and **Mitigation**. Mitigation reports actual Operational Readiness availability from the source hex and identifies the optional `-1 Consequence Severity` effect when available.
- Remove pre-resolution **Threat Handoff** metadata. Threat remains selectable later as an allowed consequence and still records the deferred Threat Engine handoff.
- Stack **Recovery Objective** and **Suggested Response** in one compact full-width guidance list.
- Make **Allowed Consequences** a compact inline row.
- Keep **Outcome Guidance** on Details but compress it into a denser two-column reference.
- Preserve dev.125 one-screen Primary + Detail generation, GM reroll/choose controls and additive generation history; preserve dev.124 GM-adjudication-only resolution and deterministic Navigation consequence application.

## Mandatory preservation

Preserve travel/world-clock checkpoints, role/recon/support outcomes, Momentum/Event state, Forced March/Exhaustion, roster/attendance, saved history, themes, packs/assets, migration, optional integrations, prior Complication records, and exact `src/expeditions/mount-ironrot/MountIronrotV413.source.js`.

## Live checks

1. Open a pending Navigation Complication at 1920×1080 and confirm Situation remains visually dominant.
2. Verify metadata contains only Reconnaissance and Mitigation; Threat metadata is absent.
3. Verify Mitigation says Operational Readiness is available only when the source hex actually earned it, otherwise `Unavailable this hex`.
4. Verify Recovery Objective and Suggested Response read naturally as stacked list sections, not side-by-side cards.
5. Verify Allowed Consequences is compact and still includes Threat where valid.
6. Verify Outcome Guidance remains visible and readable with substantially less vertical space.
7. Recheck dev.125 GM Result Control and dev.124 Resolve Complication behavior afterward.

---

## Next queued change (not implemented)

- In the Expedition Log, show actual completed player d20 rolls immediately for all three paired categories: Navigation, Reconnaissance, and Expedition Support, while the corresponding GM decisions remain **Pending GM**. Retain the original rolled totals after GM acceptance, reroll, or override. This feedback is pending a separately requested module build; this documentation-only commit changes no code.

## Source routing and preserved history

- [Canonical current project status](https://github.com/LuvacZantor/zft-overland-travel/blob/main/PROJECT_STATUS.md) identifies the active development branch and verified source HEAD.
- [Current live acceptance checks](../INTEGRATION_TEST_NOTES.md), [dev.126 local evidence](LOCAL_VALIDATION_DEV126.md), and [validation index](validation/INDEX.md) distinguish locally validated code from live-tested behavior.
- [Expedition System 1.1 design](EXPEDITION_SYSTEM_DESIGN_1.1_DRAFT.md) remains a detailed design/roadmap with historical sections; the latest implementation and tests take precedence for present-tense claims.
- [Superseded development handoffs](history/DEVELOPMENT_HANDOFF_ARCHIVE.md) preserve all prior handoff text exactly as recorded, not as current instruction.
- [Historical status notes](history/DEVELOPMENT_STATUS_ARCHIVE.md) and [historical README/changelog](../CHANGELOG.md) preserve prior version records.
- Preserve existing travel ledger, world-clock checkpoints, roles and GM rulings, Forced March/Exhaustion, records and logs, themes, packs/assets, optional integrations, original Mount Ironrot v4.13 source, and public APIs. No migration or source rewrite is part of this cleanup.

**Before new development:** verify live GitHub branch HEAD, `module.json`, and the latest handoff; do not infer newer source from a version number on an older branch. GitHub writes always need fresh, scoped approval.
