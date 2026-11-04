# 0.4.0-dev.126 | Complication Details Decision-Aid Cleanup (local test build)

- Situation remains the primary visual anchor.
- Details metadata is reduced to Reconnaissance and Mitigation; Threat is no longer shown as pre-resolution metadata.
- Mitigation reflects actual Operational Readiness availability for the source hex and states the optional severity reduction when available.
- Recovery Objective and Suggested Response are stacked in one compact vertical guidance block.
- Allowed Consequences is an inline row; Outcome Guidance remains visible in a denser two-column reference.
- dev.125 Navigation generation/revision controls and all dev.124/dev.123 consequence mechanics are preserved.

# 0.4.0-dev.125 | Navigation Generation Workflow + GM Result Control (local test build)

- One Navigation Complication Rolls screen configures both Primary and Detail d8 rolls. Both rolls remain visible ZFT-owned Foundry dice.
- Forced named Detail results are enabled once the configured Primary is known; random Primary may still pair with normal or exact Detail face.
- Pending Complication Details provides GM Result Control for Reroll Primary + Detail, Reroll Detail, and Choose Results. Original generation is retained with additive revision history.
- Details hierarchy now emphasizes Situation first, then Reconnaissance / Mitigation / Threat Handoff, compact Recovery, Suggested Response, Allowed Consequences, GM Result Control, and Outcome Guidance.
- No consequence mechanics changed from dev.124.

---

# 0.4.0-dev.124 | Complication Adjudication Workflow Repair (local test build)

**Baseline:** complete dev.123 manual-install ZIP.  
**Target:** Foundry V13.351 / D&D5e 5.2.5.  
**Remote:** `feature/expedition-engines` remains at the dev.110 checkpoint; no GitHub write is authorized or performed.

## Current scope

- Dashboard Current Step now identifies the pending Complication by category/type and specific detail, with the next action stated as resolve before Commit Travel.
- Complication Details is reorganized for vertical fit: three-column metadata, side-by-side recovery/suggested-response guidance, consequence chips, and a two-column outcome reference with responsive single-column fallback.
- Complication resolution is GM-adjudication-only. Roll / Check setup and d20 resolution controls are removed from the live Complication workflow.
- Outcome and consequence selection are merged into one Resolve Complication screen. Base/final Consequence Severity update dynamically from the chosen outcome and explicit Operational Readiness use.
- Operational Readiness and target checkboxes use fixed 18px custom checkbox geometry so Foundry/theme input rules cannot stretch them into malformed controls.
- All dev.123 Navigation content and deterministic consequence mechanics remain unchanged.

## Preservation

Preserve dev.123 eight Navigation primaries / 64 details, deterministic Lost Time/Lost Progress/Resource Loss/HP Damage/Exhaustion, Threat handoff, travel ledger/world-clock boundaries, Reset Current Travel, role history, themes, packs/assets, migration, and exact `src/expeditions/mount-ironrot/MountIronrotV413.source.js`.

## Evidence

Local regression and package validation are required before delivery. Live acceptance remains pending in Foundry V13.351 / D&D5e 5.2.5.

---

# 0.4.0-dev.123 | Navigation Complication Engine (local test build)

Navigation is the first complete Complication-category test slice. Eight primary Navigation Complications each own eight narrative details. Recovery resolves through Roll / Check or Direct Adjudication, then produces Consequence Severity 0–4. The GM explicitly selects one allowed deterministic consequence; the live consequence phase performs no random roll.

Implemented consequence types are Lost Time, Lost Progress, Resource Loss, HP Damage, Exhaustion, and a future Threat Engine handoff. Operational Readiness is explicit opt-in mitigation. Existing travel, clock, role, Forced March, roster, and history behavior remains preserved.

# 0.4.0-dev.122 | Readable two-column GM controls (local test build)

Status: locally validated; live Foundry acceptance pending.

Baseline: complete dev.121 manual-install ZIP. Target: Foundry V13.351 / D&D5e 5.2.5.

This build is a focused GM-control presentation correction: two buttons per row at normal width, unchanged control typography, Show to Players retained in the header, and Reset Current Travel promoted to the same warning family as the other destructive reset/log actions. All dev.121 Complication and roll-ownership functionality remains unchanged.

---

# 0.4.0-dev.121 | Flexible Complication resolution and roll ownership (local test build)

Status: locally validated; live Foundry acceptance pending.

Baseline: complete dev.120 manual-install ZIP. Target: Foundry V13.351 / D&D5e 5.2.5.

This build corrects live dev.120 workflow issues without expanding the content library: Complication resolution may be rolled or directly adjudicated, Actor-owned ZFT rolls use the selected Actor rather than the GM-controlled token, Support mitigation is opt-in, Recovery is no longer a routine control, and the GM controls/Complication result presentation are refined. Route Obscured consequence math remains the only implemented Complication consequence slice.
