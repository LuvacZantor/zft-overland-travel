# ZFT Overland Travel — Superseded Development Handoffs

> **Historical archive.** The full prior handoffs beginning with dev.125 are retained verbatim below. The archived `Current` headings describe their original date, **not** today's active baseline. See [project status](https://github.com/LuvacZantor/zft-overland-travel/blob/main/PROJECT_STATUS.md) and [active handoff](../DEVELOPMENT_HANDOFF.md).

# ZFT Overland Travel | Current dev.125 Development Handoff

**Current local build:** `0.4.0-dev.125`, November 4, 2026.  
**Implementation baseline:** complete locally validated dev.124 manual-install ZIP.  
**Remote branch:** `feature/expedition-engines` remains older and was inspected read-only; it is not the implementation baseline for this build.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.125 remote write, merge, tag, release, or deployment.

## Dev.125 scope

- Replace the two-window Navigation generation setup with one staged Primary + Detail control screen. Both d8 rolls remain real visible ZFT rolls.
- Preserve normal / exact / semantic GM control. A named Detail result is selectable whenever the configured Primary is known; otherwise the screen explains that Detail names depend on the Primary and allows normal or exact Detail d8 instead.
- Add pending-result GM correction controls: **Reroll Primary + Detail**, **Reroll Detail**, and **Choose Results**. Changing Primary necessarily produces a new Detail.
- Preserve original generated Primary/Detail rolls plus every GM revision in additive Complication generation evidence. Final saved Primary/Detail remain authoritative.
- Tighten Complication Details hierarchy: **Reconnaissance / Mitigation / Threat Handoff**, compact full-width Recovery, full-width Suggested Response with concise GM note, Allowed Consequences, compact GM Result Control, then Outcome Guidance.
- Preserve dev.124 GM-adjudication-only resolution and deterministic consequence behavior unchanged.

## Mandatory preservation

Preserve travel and world-clock checkpoints, roles/recon/support outcomes, Momentum/Event state, Forced March/Exhaustion, roster/attendance, saved history, themes, packs/assets, migration, optional integrations, and exact `src/expeditions/mount-ironrot/MountIronrotV413.source.js`. Existing dev.112–124 Complication records without generation evidence must continue to load.

## Live checks

1. Generate a Navigation Complication with Primary=normal and Detail=normal: one setup screen only, then two visible d8 rolls sequentially.
2. Configure Primary exact/forced plus Detail exact/forced on the same screen; verify the final saved narrative matches both visible dice.
3. Verify Force Detail Result is populated from the configured Primary and is unavailable with an explanatory message when Primary remains random.
4. In pending Details, test Reroll Detail, Reroll Primary + Detail, and Choose Results. Reopen after each; final content must update without changing the source hex/event severity.
5. Verify Details hierarchy and labels: Mitigation, Threat Handoff Eligible, compact Recovery, Suggested Response, Allowed Consequences, GM Result Control, 2x2 Outcome Guidance.
6. Resolve normally afterward and recheck dev.124 deterministic consequence application.

---

# ZFT Overland Travel | Current dev.124 Development Handoff

**Current local build:** `0.4.0-dev.124`, November 4, 2026.  
**Implementation baseline:** complete locally validated dev.123 manual-install ZIP.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-engines` remains at the dev.110 checkpoint.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.124 remote write, merge, tag, release, or deployment.

## Dev.124 scope

- Treat owner screenshots as workflow acceptance evidence, not visual-mockup requests.
- Dashboard **Current Step** now mirrors the active Complication identity and detail (for example `Navigation · False Trail` plus `A route that once worked now ends abruptly`) and states the next action. Expedition Log remains the more detailed history surface.
- Rework **Complication Details** for 1080p-safe vertical fit using compact multi-column structure rather than a long one-column stack. Existing readable typography is preserved; layout, not micro-text, carries the compression.
- Remove **Roll / Check** from the live Complication resolution path. Complication resolution is GM adjudication only for now. ZFT-owned generation dice (Event, Navigation primary d8, detail d8) remain unchanged.
- Merge Outcome and Consequence selection into one **Resolve Complication** screen. Outcome drives Base Consequence Severity; Operational Readiness optionally reduces Final Severity by one; the selected allowed consequence uses the same deterministic dev.123 mechanics.
- Repair Operational Readiness checkbox geometry with a fixed compact custom checkbox. The same safe geometry applies to character-target checkboxes.

## Preservation

- Preserve all dev.123 Navigation content, eight primary Complications / 64 details, deterministic consequence tables, exact Resource Item scope, Threat handoff, saved Complication compatibility, travel/clock/Forced March behavior, role history, GM/player permissions, themes, packs/assets, migration, optional integrations, and exact protected Mount Ironrot source.
- Historical roll-attribution helper tests remain because shared ZFT roll infrastructure still exists, but Complication recovery no longer calls that d20 path.

## Live acceptance focus

1. Current Step shows the actual pending Complication and situation, not only generic Event-resolution wording.
2. View Details fits comfortably at a normal 1080p desktop height and remains readable without micro-fonts.
3. Resolve opens directly to one adjudication screen containing outcome + consequence. No Roll / Check method screen or d20 resolution workflow appears.
4. Selecting an outcome immediately calculates Base/Final Consequence Severity; consequence type and optional Operational Readiness remain on the same screen.
5. Operational Readiness checkbox is compact, aligned, clickable, unchecked by default, and visually stable.
6. Existing dev.123 consequence application and ordinary travel progression remain unchanged.

---

# ZFT Overland Travel | Current dev.123 Development Handoff

**Current local build:** `0.4.0-dev.123`, November 4, 2026.  
**Implementation baseline:** complete locally validated dev.122 manual-install ZIP.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-engines` remains at the dev.110 checkpoint.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.123 remote write, merge, tag, release, or deployment.

## Dev.123 scope

- Navigation Complications now include Route Obscured, Path Blocked, False Trail, Dangerous Crossing, Forced Detour, Landmark Problem, Route Split, and Progress Lost. Each retains eight narrative d8 detail results.
- New Complications roll a visible GM-controlled d8 for the primary Navigation Complication and a second visible d8 for that primary's detail. Existing saved Complications are reopened without rerolling.
- Recovery remains outcome-centric: Roll / Check or Direct Adjudication. Default roll DC uses the saved Navigation DC and remains GM-editable.
- User-facing `Tier` language is replaced by **Consequence Severity 0–4**. Operational Readiness may explicitly reduce final severity by one.
- Consequence generation is deterministic and contains no consequence dice. The GM selects one consequence allowed by the chosen Navigation Complication.
- Implemented coded consequences: Lost Time `0/1/2/4/8` planned hours; Lost Progress `0/10/25/50/100%`; Resource Loss `0/10/25/50/100%`; HP Damage `0/10/20/35/50% max HP`; Exhaustion `+0/+1/+2/+3/+4`; Threat records a downstream handoff with final Consequence Severity.
- Resource Loss targets are closed to Rations, Water, Healer's Kit Uses, Healing Potions, Ammunition, and Light / Fuel. The GM selects the exact Foundry Item being reduced.
- Operational Readiness checkbox styling is repaired so it is compact and explicit rather than inheriting full-width input styling.
- Disease and Curse remain recorded design foundations for later dedicated consequence subsystems; they are not part of the Navigation runtime in dev.123.

## Preservation

- Preserve all dev.122 travel ledger/world-clock behavior, pending role preview, Reset Current Travel safety, two-column GM controls, roster layout, roll attribution, themes, packs/assets, migration, optional integrations, and saved history.
- Preserve `src/expeditions/mount-ironrot/MountIronrotV413.source.js` verbatim.
- Existing older Complication records remain readable; deprecated dev.120 consequence helpers remain compatibility-only and are not used by the live dev.123 consequence workflow.

## Validation state

- Active Node regression suite after implementation: **182/182 passed** before final packaging validation. Historical dev.95/dev.96 cosmetic tests remain intentionally excluded.
- Evidence level remains **locally validated** until owner testing in Foundry V13.351 / D&D5e 5.2.5.

---

# ZFT Overland Travel | Current dev.122 Development Handoff

**Current local build:** `0.4.0-dev.122`, November 4, 2026.  
**Implementation baseline:** complete owner-live-reviewed `0.4.0-dev.121` manual-install ZIP.  
**Remote checkpoint:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-engines` remains at dev.110 commit `6f67f30f802b6c1abb07f1437f173645c6e654e0`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.122 remote write, merge, tag, release, or deployment.

## Dev.122 scope

- Restore routine GM controls to two columns at normal width so active workflow labels remain readable without reducing font size.
- Keep **Show to Players** in the GM Controls header.
- Mark **Reset Current Travel** with the same danger-family button treatment as Reset All Travel and Clear Expedition Log, and use a red warning heading in its confirmation panel.
- Preserve the existing control order so rows remain: workflow/day, roles/attendance, ledger/current reset, all-reset/log-clear.
- Preserve all dev.121 Complication resolution modes, Actor/system roll attribution, Support opt-in behavior, consequence math, hidden Recovery infrastructure, dev.120 pending phases/current-reset safety, travel accounting, themes, packs/assets, migration, and protected Mount Ironrot source.

## Required live test

1. Verify GM Controls render as two readable buttons per row at normal width and no label is forced into an unreadable narrow column.
2. Verify Show to Players remains in the header.
3. Verify Reset Current Travel, Reset All Travel, and Clear Expedition Log all carry visible red warning treatment; open Reset Current Travel and confirm its warning surface is clearly destructive/recovery-oriented.
4. Re-run the dev.121 functional checks: Direct Adjudication without a d20, Roll / Check with Actor A while controlling Actor B, neutral ZFT speaker for system dice, Operational Readiness opt-in, readable consequence result.
5. Re-run the dev.120 safety/workflow checks: pending role phases, Reset Current Travel preservation/refusal after committed hours, Event/Complication forcing, planned-time-only Navigation consequences.

---

# ZFT Overland Travel | Current dev.121 Development Handoff

**Current local build:** `0.4.0-dev.121`, November 4, 2026.  
**Implementation baseline:** complete owner-live-tested `0.4.0-dev.120` manual-install ZIP.  
**Remote checkpoint:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-engines` remains at dev.110 commit `6f67f30f802b6c1abb07f1437f173645c6e654e0`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.121 remote write, merge, tag, release, or deployment.

## Dev.121 scope

- Complication resolution is no longer roll-only. The GM explicitly chooses **Roll / Check** or **Direct Adjudication**. Direct adjudication chooses Strong Success / Success / Failure / Major Failure with no fake roll.
- Rolled resolution retains the GM-private normal/exact/forced-outcome d20 control and still produces a real Foundry roll.
- Actor-owned ZFT rolls bind the Chat speaker to the Overland Travel selected Actor. The GM's currently controlled token is ignored. System-owned ZFT rolls use neutral speaker **ZFT Overland Travel**.
- Operational Readiness mitigation is optional and unchecked by default.
- Consequence summaries lead with readable travel impact; tier transitions remain detailed audit evidence.
- Routine Recovery is removed from GM controls, but the underlying state-aware Recovery implementation remains intact.
- Normal GM controls use three columns; Clear Expedition Log spans two columns on the final row, with narrower responsive fallbacks.
- Player-facing resolved Complication cards include concise result guidance and planned-time impact.
- Preserve dev.120 Pending role previews, Reset Current Travel safety, Event forcing, Navigation consequence tiers/delay dice, planned-vs-committed time separation, themes, packs/assets, migration, and exact protected Mount Ironrot source.

## Required live test

1. Resolve one Complication through **Direct Adjudication**. Verify no d20 is rolled and the normal consequence/optional Support path still follows the chosen outcome.
2. Resolve another through **Roll / Check**. Select Actor A while controlling Actor B's token. Verify modifier, Chat speaker, and Critical/Fumble attribution all identify Actor A.
3. Verify Complication detail and Navigation consequence dice post as **ZFT Overland Travel**, not the controlled token.
4. Verify Operational Readiness is unchecked by default; test once without it and once explicitly selecting it.
5. Verify the resolved Log card uses readable consequence wording while View Details retains tier/audit evidence.
6. Verify routine GM controls have no Recovery button and render as the intended three-column layout at normal width.
7. Regression: Pending role phases, Reset Current Travel, Event roll forcing, planned-time consequences, travel commit/world-time boundary, roster layout, themes, and player read-only behavior remain unchanged.

---

# ZFT Overland Travel | Current dev.120 Development Handoff

**Current local build:** `0.4.0-dev.120`, November 4, 2026.  
**Implementation baseline:** complete owner-tested `0.4.0-dev.119` manual-install ZIP.  
**Remote checkpoint:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-engines` remains at dev.110 commit `6f67f30f802b6c1abb07f1437f173645c6e654e0`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.120 remote write, merge, tag, release, or deployment.

## Dev.120 scope

- Pending Navigation / Reconnaissance / Expedition Support appear immediately in the active Travel Log using frozen role assignments.
- Reset Current Travel removes only an uncommitted active hex/workflow and its generated Complication, preserving earlier travel history and counters.
- Reusable GM-private ZFT roll control now covers the Complication detail d8 (normal/exact/forced detail) and resolution d20 (normal/exact/forced semantic outcome), while still producing visible Foundry rolls.
- Route Obscured Complication resolution now uses a selected Actor/test/DC, derives the four outcome grades from margin, records roll provenance, and never derives success from Reconnaissance.
- First Navigation consequence slice is active: severity/outcome → Tier 0–4 → optional Operational Readiness one-tier mitigation → planned-time delay. Tier 2 rolls 1d4; Tier 3–4 roll 2d4. Tier 4 records that a secondary setback remains for GM adjudication.
- Consequence time modifies planned travel/remaining hours only. It does not commit ledger/world-clock travel until the existing commit workflow runs.
- Player-facing Complication presentation is simplified to party intelligence and resolution.

## Required live test

1. Start a hex and verify all three role phases appear immediately as Pending in Travel.
2. Use Reset Current Travel before any committed hour and verify only the active hex disappears; completed history remains.
3. Force a Complication and resolve it using normal, exact, and forced-outcome d20 modes across repeated tests. Verify the visible die still rolls.
4. Confirm Partial/Full/None Reconnaissance changes information only and never preselects or modifies the resolution outcome.
5. Test Standard and Major consequence tiers, with and without Coordinator-created Operational Readiness.
6. For Tier 2+ delays, verify the visible d4/2d4 consequence roll and that Hex Travel Remaining increases while Travel Hours Today/world time do not change until commit.
7. Verify the resolved Complication card and View Details retain outcome, Support use, tier transition, delay, and GM notes.

---

# ZFT Overland Travel | Current dev.119 Development Handoff

**Current local build:** `0.4.0-dev.119`, November 4, 2026.  
**Implementation baseline:** complete owner-live-tested dev.118 manual-install ZIP.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-engines` remains at dev.110 checkpoint `6f67f30f802b6c1abb07f1437f173645c6e654e0`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.119 remote write, merge, tag, release, or deployment.

## Dev.119 scope

- Refine the accepted Complication UI without changing its workflow or saved-state contract.
- Make the specific situation the focal information and remove duplicated Situation wording.
- Present Reconnaissance, Support, and Threat as aligned metadata rows rather than three narrow cards.
- Keep Suggested Response secondary and give outcome rows restrained success/failure tint for faster scanning.
- Refine the Complications-tab summary card around situation, outcome, and GM resolution notes.
- Preserve the accepted two-column Expedition Roster at normal Dashboard widths by lowering the emergency one-column breakpoint from 330px to 240px.
- Preserve all dev.118 Complication mechanics/persistence, Event forcing, Travel/clock/role behavior, themes, packs/assets, migration, and protected Mount Ironrot source.

## Continuation checkpoint

1. Live-test dev.119 in Foundry V13.351 / D&D5e 5.2.5.
2. Verify the Expedition Roster stays two columns at the normal Dashboard size.
3. Verify Details scan order is classification → specific situation → context rows → Suggested Response → outcomes, with no repeated situation sentence.
4. Verify resolved Log cards emphasize the specific situation and saved Outcome, with GM Resolution notes separated.
5. If accepted, stop Complication presentation iteration and return to Complication mechanics/content.
6. GitHub remains at dev.110 until fresh explicit approval for a write to `feature/expedition-engines`.

---

# ZFT Overland Travel | Current dev.118 Development Handoff

**Current local build:** `0.4.0-dev.118`, November 4, 2026.  
**Implementation baseline:** complete owner-live-tested dev.117 manual-install ZIP.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-engines` remains at dev.110 checkpoint `6f67f30f802b6c1abb07f1437f173645c6e654e0`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.118 remote write, merge, tag, release, or deployment.

## Dev.118 scope

- Readability/visual-hierarchy pass only for Complication Details and Resolve Complication.
- Raise micro-sized labels/body/outcome text to normal readable sizes and increase line-height/section spacing.
- Make the Complication situation the primary focal block.
- Present Reconnaissance, Support, and Threat as distinct metadata cards with larger values.
- Strengthen Suggested Response and Outcome Guidance, including semantic success/failure outcome edges and larger descriptions.
- Preserve selectable outcome keyboard behavior and saved resolution workflow.
- Widen only these Complication dialogs from 600px to 640px.
- Preserve all dev.117 mechanics, persistence, content, Event forcing, Travel/clock/role behavior, themes, packs/assets, migration, and protected Mount Ironrot source.

## Continuation checkpoint

1. Install and visually test dev.118 in Foundry V13.351 / D&D5e 5.2.5.
2. Verify Situation, metadata, Suggested Response, and Outcome Guidance are readable at normal Foundry zoom.
3. Verify Resolve cards are clearly distinguishable and the selected state remains obvious.
4. If readability is accepted, stop Complication UI iteration and continue mechanics/content from dev.118.
5. GitHub remains at dev.110 until fresh explicit approval for a write to `feature/expedition-engines`.

---

# ZFT Overland Travel | Current dev.117 Development Handoff

**Current local build:** `0.4.0-dev.117`, November 4, 2026.  
**Implementation baseline:** complete owner-live-tested dev.116 manual-install ZIP.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-engines` remains at dev.110 checkpoint `6f67f30f802b6c1abb07f1437f173645c6e654e0`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.117 remote write, merge, tag, release, or deployment.

## Dev.117 scope

- Formatting-only repair for the Complication Detail and Resolve surfaces.
- Correct the Complication/Event-roll CSS scope to the actual `#zft-hex-travel-workflow-window` GM window.
- Present severity and lifecycle state as compact badges, keep category/type as the primary heading, and isolate Situation text from its explanatory frame.
- Render Reconnaissance, Support, and Threat as aligned metadata rows.
- Render Suggested Response and the four outcome guidance entries as distinct readable sections/rows.
- Keep Resolve focused on the situation plus four selectable outcomes and optional notes instead of repeating the full Detail view.
- Suppress the redundant automatic **Cancel / Exit** control in the Detail viewer because **Close** already exists.
- Preserve the complete dev.116 Complication content/persistence contract, dev.115 action routing, dev.114 refresh/pending-role UI, dev.113 Event forcing, and all established Travel/clock/role behavior.
- No consequence automation, Support consumption, Threat/Discovery/Encounter handoff, Opportunity work, or content-library expansion.

## Continuation checkpoint

1. Install and visually test dev.117 in Foundry V13.351 / D&D5e 5.2.5.
2. Check **View Details** for clean spacing, readable metadata, and distinct outcome guidance at the normal GM Controls width.
3. Check **Resolve** for four readable selectable outcome cards and no duplicated detail content.
4. Verify Detail actions are only **Resolve Complication** + **Close** when pending and only **Close** when resolved.
5. If the presentation is accepted, continue Complication mechanics/content from dev.117 rather than doing another layout pass.
6. GitHub remains at dev.110 until the owner gives fresh explicit approval for a specific write to `feature/expedition-engines`.

---

# ZFT Overland Travel | Current dev.116 Development Handoff

**Current local build:** `0.4.0-dev.116`, November 4, 2026.  
**Implementation baseline:** complete owner-live-tested dev.115 manual-install ZIP.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-engines` remains at dev.110 checkpoint `6f67f30f802b6c1abb07f1437f173645c6e654e0`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.116 remote write, merge, tag, release, or deployment.

## Dev.116 scope

- Treat the Complication Journal as backend/content storage rather than the normal GM-facing interface.
- Replace **Open Content** with a dedicated **View Details** renderer inside the existing ZFT workflow surface.
- Keep the Complications-tab card concise: hex/severity/state, category/type, situation, Reconnaissance, saved outcome, and minimal actions.
- Replace the cramped visible-radio resolution layout with accessible full-width selectable outcome cards.
- Keep resolution mechanics unchanged: one adjudicated outcome plus optional notes; no consequence automation, Support consumption, time/resource mutation, Threat/Discovery/Encounter handoff, or Opportunity work.
- Preserve all dev.115 Event forcing, Complication persistence, Travel/clock/role behavior, themes, packs/assets, migration, and protected Mount Ironrot source.

## Tomorrow / continuation checkpoint

1. Install and live-test dev.116 in Foundry V13.351 / D&D5e 5.2.5.
2. Verify **View Details** is preferable to the Journal sheet and that **Resolve** is readable/usable at the current GM Controls width.
3. Verify the compact Complications card is visually acceptable in pending and resolved states.
4. If the presentation is accepted, continue Complication mechanics/content from this checkpoint rather than expanding the UI again blindly.
5. GitHub remains at dev.110 until the owner gives fresh explicit approval for a specific write to `feature/expedition-engines`.

---

# ZFT Overland Travel | Current dev.115 Development Handoff

**Current local build:** `0.4.0-dev.115`, November 4, 2026.  
**Implementation baseline:** complete owner-tested `0.4.0-dev.114` manual-install ZIP.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-engines` remains at dev.110 checkpoint `6f67f30f802b6c1abb07f1437f173645c6e654e0`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.115 remote write, merge, tag, release, or deployment.

## Dev.115 scope

- Repair Complications-tab card actions so **Open Content** and **Resolve Complication** clicks inside the Expedition Log are delegated to the existing Complication action handlers.
- Preserve dev.114 live Complication rerender, dynamic Event-roll fields, active Travel-log Pending role phases, dev.113 Event forcing/outcome persistence, and all established travel behavior.
- No new mechanics or content.

## Validation state

- Active regression target: **145/145** before packaging.
- Evidence level remains **locally validated** until owner testing in Foundry V13.351 / D&D5e 5.2.5.

---

# ZFT Overland Travel | Current dev.114 Development Handoff

**Current local build:** `0.4.0-dev.114`, November 4, 2026.  
**Implementation baseline:** complete owner-tested/local `0.4.0-dev.113` manual-install ZIP.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-engines` remains at dev.110 checkpoint `6f67f30f802b6c1abb07f1437f173645c6e654e0`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.114 remote write, merge, tag, release, or deployment.

## Dev.114 scope

- Refresh **Complications** tab content from the authoritative saved Complication collection on every Expedition workspace refresh.
- Dynamically reveal only the Event-roll field required by the selected Roll mode.
- Provide an active-hex Travel Log preview after Travel Time so Navigation is visible immediately and unresolved Reconnaissance/Expedition Support show **Pending**; the saved shared hex record replaces the preview when available.
- Replace stale version-specific Complication prototype helper text with version-neutral wording.
- Preserve dev.113 Event d20 forcing, Complication generation/outcome persistence, Travel/clock accounting, roles, themes, assets/packs, migration, and protected Mount Ironrot source.

## Validation state

- Active regression target: **144/144** before packaging.
- Evidence level remains **locally validated** until owner testing in Foundry V13.351 / D&D5e 5.2.5.

---

# ZFT Overland Travel | Current dev.113 Development Handoff

**Current local build:** `0.4.0-dev.113`, November 3, 2026.  
**Implementation baseline:** complete dev.112 manual-install ZIP.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-engines` remains at `6f67f30f802b6c1abb07f1437f173645c6e654e0` (`0.4.0-dev.110`).  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.113 remote write, merge, tag, release, or deployment.

## Dev.113 scope

- Preserve the live-confirmed dev.112 Complication handoff and single Route Obscured d8 content slice.
- Add GM-controlled Event d20 testing: normal roll, exact d20 face, or Event-type selection. Event-type forcing derives a valid raw d20 face from current Momentum and still runs the normal Event calculation/routing.
- Preserve visible Foundry roll/chat behavior and the existing Dice So Nice message animation path for forced Event rolls.
- Add Standard/Major Complication frame display and four-outcome GM adjudication with optional notes.
- Save the selected outcome only; do not apply consequence tiers, time/resource changes, Support mitigation, Threat/Discovery/Encounter handoff, broader Complication content, or Opportunity mechanics.
- Preserve Travel, role stages, Momentum, Forced March/Exhaustion, clock, themes, packs/assets, migration, backend Threat state, and protected Mount Ironrot source.

## Continuation

Live-test the forced Event roll presentation and the Complication resolution interaction before adding consequence automation or more content. The next expansion should be driven by observed table use, not by pre-building downstream systems.

---

# ZFT Overland Travel | Current dev.112 Development Handoff

**Current local build:** `0.4.0-dev.112`, November 3, 2026.  
**Implementation baseline:** complete locally validated `0.4.0-dev.111` package.  
**Repository:** `LuvacZantor/zft-overland-travel`.  
**Working branch:** `feature/expedition-engines`, based on committed dev.110 checkpoint `6f67f30f802b6c1abb07f1437f173645c6e654e0`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.112 commit/push, merge, tag, release, or deployment.

## Dev.112 scope

- Preserve the accepted **Travel | Complications | Opportunities** tab architecture from dev.111 and leave Travel unchanged.
- Implement one narrow Complication vertical slice only: **Navigation → Route Obscured → d8 detail**.
- Persist the minimal Complication record shell under the existing Hex record store and enforce only `pending → resolved`.
- Generate the Complication once; refresh/reopen never rerolls it.
- Map saved Reconnaissance grade to Full/Partial/No Advance Intelligence for display.
- Lazily seed one world Complication Journal entry for Route Obscured when the GM first generates a Complication.
- Use the existing manual Event-resolution bridge to finish the prototype record; do not automate consequence tiers, Support, time, Threat, Discovery, or Encounter yet.
- Preserve existing Threat backend state/runtime, packs/assets, migration, themes, permissions, Forced March/Exhaustion, world-clock behavior, and protected Mount Ironrot source.

## Next expansion only after live testing

If this slice feels correct in Foundry, expand the content architecture toward the agreed **7 RollTables + 48 Journals** and replace the manual resolution bridge incrementally with the approved four-outcome consequence model. Do not bulk-build those systems before the owner validates this interaction model.

---

# ZFT Overland Travel | Prior dev.111 Development Handoff

**Current local build:** `0.4.0-dev.111`, November 3, 2026.  
**Implementation baseline:** committed `0.4.0-dev.110` checkpoint.  
**Repository:** `LuvacZantor/zft-overland-travel`.  
**Working branch:** `feature/expedition-engines`, created from dev.110 commit `6f67f30f802b6c1abb07f1437f173645c6e654e0`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** dev.111 was local only; no dev.111 commit/push, merge, tag, release, or deployment.

## Dev.111 scope

- Keep **Travel** unchanged as the authoritative chronological overland-travel log.
- Replace the generic **Events** tab with separate **Complications** and **Opportunities** tabs.
- Remove the visible Persistent Threat placeholder/workspace for now while preserving its backend state/runtime code and any saved Threat data.
- Establish empty engine-owned workspaces only. Do not define or persist a new Complication/Opportunity record contract until that design is deliberately worked out.
- Preserve all dev.110 travel, role, Travel Quality, Momentum, Event, Forced March/Exhaustion, clock, themes, packs/assets, migrations, permissions, and protected Mount Ironrot behavior.

## Working engine model

- Event outcomes route to sibling branches: Major Complication/Complication → Complication Engine; Quiet Travel → no additional engine for now; Opportunity → Opportunity Engine.
- Complication may later hand off to Threat or directly to Encounter.
- Opportunity may later hand off to Discovery or directly to Encounter.
- Threat and Discovery are downstream systems to design after Complication and Opportunity.
- Encounter is a shared downstream engine and must support hostile/dangerous as well as neutral/friendly/beneficial contexts supplied by the upstream engine.

## Next design task

Define the **Complication Engine record/data contract**: what one complication records, lifecycle/status, Reconnaissance disclosure, Support interaction, consequence resolution, and downstream references. Do not add those mechanics to Travel.

---

# ZFT Overland Travel | Current dev.110 Development Handoff

**Current local build:** `0.4.0-dev.110`, November 3, 2026.  
**Implementation baseline:** owner-supplied current live `0.4.0-dev.109` manual-install ZIP (`c2c3bc4499e1ffb4a77a8822968437bf0985f4f6ef4d6acb3141f5334024edbe`).  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-system-1.1` remains at owner checkpoint `5597f595a6dbda24732e68076f7445129dd0e859` (dev.97).  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.110 remote write, merge, tag, release, deployment, or branch creation.

## Dev.110 scope

- Remove the redundant **Roles** tab/panel from the Expedition Log. Role assignment/editing through GM **Expedition Roles**, the roster role reference, saved role records, adjudication/rerolls, and role mechanics remain unchanged.
- Preserve Navigation, Reconnaissance, and Expedition Support as authoritative per-hex history inside the **Travel** tab. No role evidence is deleted from saved data.
- Keep the **Events** tab for future event-side systems, but remove its duplicate per-hex Travel Quality/Momentum/Event/Resolution cards because those outcomes are already recorded in the Travel log.
- Preserve the existing **Persistent Threats** architecture and GM/player visibility/action controls in Events unchanged for now.
- Expedition Log chrome now contains the two authoritative surfaces: **Travel** and **Events**.
- No travel math, ledger/world-clock checkpoints, role/Event/Threat state schema, Forced March/Exhaustion behavior, themes, packs/assets, migration, or protected Mount Ironrot source changes.

## Validation state

- Current active Node regression set: **131/131 passed**. Historical dev.95/dev.96 cosmetic tests remain intentionally excluded because dev.97 explicitly rolled those UI experiments back; this matches the dev.109 validation convention.
- JavaScript/MJS syntax, relative imports, JSON, CSS structure, protected assets/packs/source, complete archive layout, and fresh-extraction tests are required before delivery.
- Evidence level: **locally validated** until owner testing in Foundry V13.351 / D&D5e 5.2.5.

---

# ZFT Overland Travel | Current dev.109 Development Handoff

**Current local build:** `0.4.0-dev.109`, November 3, 2026.  
**Implementation baseline:** complete local dev.108 manual-install ZIP.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-system-1.1` remains at owner checkpoint `5597f595a6dbda24732e68076f7445129dd0e859` (dev.97).  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.109 remote write, merge, tag, release, deployment, or engine branch creation.

## Dev.109 scope

- Preserve blue/teal/violet roster phase identity while adding a separate Exhaustion severity wash across exhausted character cards.
- Exhaustion severity is level-based from 1 through 6; higher levels use progressively stronger red tint. Exhaustion 0 remains unmarked.
- The fixed upper-right Exhaustion number and the compact body-level Exhaustion tooltip use the same severity identity.
- The Exhaustion tooltip is reduced to a compact status surface; 2024 rules retain D20 Tests/Speed rows and legacy rules retain their existing effect text.
- Expedition Log Roll/Result geometry is tightened by narrowing the actual fixed columns/gap; pending GM-confirmation text stays contained in Result and cannot move the die.
- Preserve all dev.108/dev.107 workflow behavior, travel/clock accounting, role/Event/Threat mechanics, Forced March/Exhaustion ownership, themes, packs/assets, migration, and exact protected Mount Ironrot source.

---

# ZFT Overland Travel | Current dev.108 Development Handoff

**Current local build:** `0.4.0-dev.108`, November 3, 2026.  
**Implementation baseline:** complete local dev.107 manual-install ZIP.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-system-1.1` remains at owner checkpoint `5597f595a6dbda24732e68076f7445129dd0e859` (dev.97).  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.108 remote write, merge, tag, release, deployment, or engine branch creation.

## Dev.108 scope

- Expedition Roster cards mirror the role-phase palette: Navigation blue, Reconnaissance teal, Expedition Support violet. The treatment is presentation-only and does not encode success/failure.
- Exhaustion no longer adds a footer row or changes character-card height. Exhausted characters show a compact red level number in the card upper-right; Exhaustion 0 shows no marker.
- Exhaustion hover/focus uses the existing body-level help system and shows the current level plus D20 Tests/Speed penalties for 2024 rules, while preserving legacy-rule effect text.
- D&D5e Actor/native Exhaustion state and the existing effect/Actor refresh hooks remain authoritative.
- Expedition Log Roll values are right-aligned inside their fixed Roll column, keeping the die visually adjacent to Result while retaining dev.107 pending-result wrapping.
- Preserve dev.107 Travel Decision/toast cleanup, dev.106 role deduplication, dev.105 completed-hex collapse, all travel/clock/Forced March mechanics, themes, packs/assets, migration, and the exact Mount Ironrot source.

---

# ZFT Overland Travel | Current dev.107 Development Handoff

**Current local build:** `0.4.0-dev.107`, November 3, 2026.  
**Implementation baseline:** complete local dev.106 manual-install ZIP.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-system-1.1` remains at owner checkpoint `5597f595a6dbda24732e68076f7445129dd0e859` (dev.97).  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.107 remote write, merge, tag, release, deployment, or engine branch creation.

## Dev.107 scope

- Pause / Exit at a Forced March boundary now leaves the Dashboard at **Travel Decision** rather than presenting Forced March as though it were the only next path.
- Current Step states that Continue Travel resumes Forced March and New Travel Day carries the remaining hex hours forward with a fresh daily allowance.
- No extra travel hour is committed when choosing New Travel Day; travel and idle/rest clock movement remain separate.
- Routine informational Foundry toasts are suppressed for the modern Hex Travel workflow; warnings, errors, required dialogs, and Hex Complete remain.
- Navigation / Reconnaissance / Expedition Support Log totals are visually centered inside the d20 icon.
- The role Roll column has a fixed presentation width and long pending Result text wraps inside its own column, so **Awaiting GM Confirmation** does not displace the die.
- No travel math, ledger/world-clock checkpoints, role/Event/Threat mechanics, Forced March/Exhaustion rules, themes, packs/assets, migration, or protected Mount Ironrot source changes.

---

# ZFT Overland Travel | Current dev.106 Development Handoff

**Current local build:** `0.4.0-dev.106`, November 3, 2026.  
**Implementation baseline:** complete dev.105 manual-install ZIP.  
**Remote checkpoint:** `feature/expedition-system-1.1` remains at dev.97 commit `5597f595a6dbda24732e68076f7445129dd0e859`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local presentation cleanup only; no remote write, merge, tag, release, deployment, or engine branch creation.

## Dev.106 scope

- Expanded Travel Log hexes show Navigation role results once, in the authoritative lower Navigation phase beside Reconnaissance and Expedition Support.
- The upper reconstructed Guide/Vanguard Navigation block is removed.
- Travel Time remains unchanged in purpose and preserves base dice, pace, saved delay dice, total duration, and original roll detail.
- The lower Navigation header shows the saved Navigation DC.
- Unique legacy pre-Vanguard Secondary evidence remains available rather than being discarded.
- Preserve dev.105 completed-hex collapse behavior and the complete dev.104/dev.103 workflow/color presentation.
- No mechanics or persisted-state changes. After owner live acceptance, dev.106 is the intended checkpoint candidate before specialized engine work begins on a new branch.

---

# ZFT Overland Travel | Current dev.105 Development Handoff

**Current local build:** `0.4.0-dev.105`, November 3, 2026.  
**Implementation baseline:** complete dev.104 manual-install ZIP.  
**Remote checkpoint:** `feature/expedition-system-1.1` remains at dev.97 commit `5597f595a6dbda24732e68076f7445129dd0e859`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local final-cleanup build only; no remote write, merge, tag, release, deployment, or engine branch creation.

## Dev.105 scope

- Completed hexes collapse after the completion transition and remain collapsed by default after refresh/reload.
- The current Day group remains open when appropriate so additional same-day travel is visible.
- Active/incomplete hex work may still auto-open; deliberately reopened history remains inspectable.
- Preserve the complete dev.104 workflow/color behavior and all Expedition mechanics/persistence.
- After owner live acceptance, dev.105 is the intended checkpoint candidate before creating a new branch for specialized engine development.

---

# ZFT Overland Travel | Current dev.104 Development Handoff

**Current local build:** `0.4.0-dev.104`, November 3, 2026.  
**Implementation baseline:** complete dev.103 manual-install ZIP.  
**Remote checkpoint:** `feature/expedition-system-1.1` remains at dev.97 commit `5597f595a6dbda24732e68076f7445129dd0e859`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local cosmetic stabilization build only; no remote write, merge, tag, release, deployment, or engine branch creation.

## Dev.104 scope

- Primary GM travel/workflow button now mirrors the Dashboard Current Step phase color: Navigation blue, Reconnaissance teal, Support violet, Event orange, travel blue, Forced March red.
- Phase color is supplementary; the button label remains authoritative. Hover/focus strengthens the same phase identity.
- Secondary controls remain visually separate.
- Preserve all dev.103 workflow hierarchy/color changes and all dev.102/dev.100 runtime/workflow fixes.
- No mechanics or persisted-state changes.
- After owner live acceptance, this build is the intended checkpoint before starting specialized engine development on a new branch; those GitHub operations still require fresh explicit authorization.

---

# ZFT Overland Travel | Current dev.103 Development Handoff

**Current local build:** `0.4.0-dev.103`, November 3, 2026.  
**Implementation baseline:** complete dev.102 manual-install ZIP.  
**Remote checkpoint:** `feature/expedition-system-1.1` remains at dev.97 commit `5597f595a6dbda24732e68076f7445129dd0e859`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local presentation build only; no remote write, merge, tag, release, or deployment.

## Dev.103 scope

- Dashboard **CURRENT STEP** is now the first workflow surface under Current Expedition; the old lower NEXT blurb is removed.
- Current Step changes by authoritative saved phase and uses restrained phase color accents without changing workflow mechanics.
- Log role-grade semantics: Strong green, Partial amber, Failed red, pending confirmation amber.
- Log Navigation/Reconnaissance/Support sections receive subtle phase identity; Expedition Outcome/Event tiles reuse semantic Dashboard state color.
- Start New Travel Day wording separates the new day's fresh allowance from an unfinished hex that carries forward; no `0h on Day N` display.
- Preserve dev.102 active-Event render repair, explicit Roll Event stage, Dashboard Event state, body-level help overlays, Momentum `−2/−1/0/+1/+2`, Threats, Forced March/Exhaustion, themes, packs/assets, migration, and exact protected Mount Ironrot source.
- No GitHub write is implied.

---

# ZFT Overland Travel | Current dev.102 Development Handoff

**Current local build:** `0.4.0-dev.102`, November 3, 2026.  
**Implementation baseline:** complete dev.101 manual-install ZIP.  
**Remote checkpoint:** `feature/expedition-system-1.1` remains at dev.97 commit `5597f595a6dbda24732e68076f7445129dd0e859`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local repair build only; no remote write, merge, tag, release, or deployment.

## Dev.102 scope

- Repairs dev.101 workspace rendering when a saved/current Event exists by importing `EXPEDITION_EVENT_TYPES` where the Dashboard Event-state renderer uses it.
- Adds a regression guard for the required import.
- Preserves the dev.101 Dashboard Event at-a-glance presentation and all dev.100 workflow behavior.
- Does not mutate saved expedition state or any travel/Event mechanics.

---

# ZFT Overland Travel | Current dev.101 Development Handoff

**Current local build:** `0.4.0-dev.101`, November 3, 2026.  
**Implementation baseline:** complete dev.100 manual-install ZIP.  
**Remote checkpoint:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-system-1.1` at owner checkpoint `5597f595a6dbda24732e68076f7445129dd0e859` (`0.4.0-dev.97`).  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.101 remote write, merge, tag, release, or deployment.

## Mandatory continuation baseline

1. Continue from the complete dev.101 package when it is the latest owner-tested build.
2. Preserve the explicit GM sequence: Navigation → Reconnaissance → Expedition Support → automatic Travel Quality/Momentum → explicit **Roll Event** → Event Resolution when required → explicit travel commit.
3. Dashboard is current state at a glance; Travel Log is the detailed chronological/audit record.
4. Preserve body-level help overlays, semantic state color, current `−2/−1/0/+1/+2` Momentum mechanics, Threat state, Forced March/Exhaustion, integrations, themes, packs/assets, migration, and exact protected Mount Ironrot source.
5. Roles/Events tab role refinement and specialized Complication/Opportunity engines remain future work.
6. No GitHub write is implied.

## Dev.101 scope

- Adds current Event state to Dashboard Expedition State.
- Moves the static four-band Event chart from permanent Dashboard display into the Event help overlay.
- Keeps detailed Event roll/resolution information in help and the Travel Log.
- No gameplay or persistence rule changes.

---

# ZFT Overland Travel | Current dev.100 Development Handoff

**Current local build:** `0.4.0-dev.100`, November 3, 2026.  
**Implementation baseline:** complete owner-reviewed dev.99 manual-install ZIP.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-system-1.1` at owner checkpoint `5597f595a6dbda24732e68076f7445129dd0e859` (dev.97).  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** dev.100 is local only; no remote write, merge, tag, release, or deployment.

## Mandatory continuation baseline

1. Preserve the explicit staged flow: Navigation → Resolve Reconnaissance → Resolve Expedition Support → automatic Travel Quality/Momentum preparation → **Roll Event** → Event Resolution when required → Commit/Continue Travel.
2. Travel Quality/Momentum preparation and Event rolling are now separate persisted stages. Never auto-roll the Event on Support completion or reload.
3. Preserve dev.97/dev.94 typography and geometry; semantic color may supplement text but must not become the only state signal.
4. Roster role help must remain body-level/viewport-clamped; do not restore the legacy nested `.zft-hex-role-tooltip-pop`.
5. Preserve all travel/clock/Forced March/Exhaustion, Threat state, role skills, themes, integrations, packs/assets, migration, and exact protected Mount Ironrot source.
6. Momentum remains `−2 / −1 / 0 / +1 / +2`. Future `−3 / −1 / 0 / +1 / +3` remains a playtest candidate only.
7. No GitHub write is implied.

## Next engine direction

After dev.100 live acceptance, begin the specialized **Complication / Major Complication Engine**. Opportunity, Discovery, deeper Threat handoff, and Encounter follow after that.

See `docs/LOCAL_VALIDATION_DEV100.md` and the dev.100 section at the top of `INTEGRATION_TEST_NOTES.md`.

---

# ZFT Overland Travel | Current dev.99 Development Handoff

**Current local build:** `0.4.0-dev.99`, November 3, 2026.  
**Implementation baseline:** complete dev.98 manual-install ZIP, itself based on the owner checkpointed dev.97 source.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-system-1.1` at dev.97 commit `5597f595a6dbda24732e68076f7445129dd0e859`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** dev.99 is local only; no remote write, merge, tag, release, or deployment.

## Dev.99 scope

- Preserve dev.97/dev.94 Dashboard typography and geometry.
- Preserve dev.98 body-level help for Travel Quality, Momentum Change, and Expedition Momentum.
- Add body-level help for Hex Travel Remaining, Safe Travel Hours, Event results, and Forced March.
- Roster role help identifies Navigation / Reconnaissance / Expedition Support and the fixed primary check.
- Coordinator player-facing wording is operational readiness/coordination, matching the approved design.
- Move Dashboard compact-state control from the redundant top-right minimize button to double-click on the existing left mountain/triangle; keyboard Enter/Space also collapses.
- No mechanic changes.

## Momentum tuning note

Current modifiers remain `Deteriorating −2 / Risky −1 / Neutral 0 / Prepared +1 / Favored +2`. If live play shows the endpoints are too conservative, first candidate is `−3 / −1 / 0 / +1 / +3`. Do not add a random Momentum die without a separate design decision.

## Next engine direction after UI acceptance

After dev.99 transparency/header behavior is visually accepted, proceed to the specialized Complication / Major Complication Engine before Opportunity, Discovery, deeper Threat integration, and Encounter. Roles/Events tab structural redesign remains deferred until those engines give the tabs their final operational purpose.

See `docs/LOCAL_VALIDATION_DEV99.md` and the dev.99 section at the top of `INTEGRATION_TEST_NOTES.md`.

---

# ZFT Overland Travel | Current dev.98 Development Handoff

**Current local build:** `0.4.0-dev.98`, November 3, 2026.  
**Implementation baseline:** complete dev.97 manual-install ZIP and GitHub checkpoint `5597f595a6dbda24732e68076f7445129dd0e859`.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-system-1.1` at the dev.97 checkpoint above.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** dev.98 is local only; no remote write, merge, tag, release, or deployment.

## Mandatory continuation baseline

1. Re-read current `zft-standards` before further development.
2. Dev.97 remains the accepted visual reset baseline. Dev.98 adds only an isolated body-level help overlay and two compact information-row layouts; do not reintroduce dev.95/dev.96 generic tooltip wrappers or typography overrides.
3. Preserve manual role-stage progression, explicit travel commit boundary, six fixed role skills, persistent Momentum, Event bands, Threat state, Forced March/Exhaustion, optional integrations, themes, packs/assets, and exact protected Mount Ironrot source.
4. Treat broader Dashboard help as deferred until the dev.98 overlay pattern is live accepted.
5. No GitHub write is implied.

## Dev.98 scope

- Travel Quality point totals are separate Success / Failure rows without changing the dev.97 card typography.
- Expedition Momentum shows Event Roll Modifier and Persistence on separate rows.
- Travel Quality, Momentum Change, and Expedition Momentum use structured help rendered as a fixed `document.body` overlay, triggered by hover or keyboard focus.
- No help wrapper or tooltip surface exists inside the Dashboard card layout.
- Role-grade structured help in the Travel log remains unchanged from dev.94/dev.97.

See `docs/LOCAL_VALIDATION_DEV98.md` and the dev.98 section at the top of `INTEGRATION_TEST_NOTES.md`.

---

# ZFT Overland Travel | Current dev.97 Development Handoff

**Current local build:** `0.4.0-dev.97`, November 3, 2026.  
**Implementation baseline:** complete dev.94 manual-install ZIP, intentionally restored after dev.95/dev.96 Dashboard cosmetic regressions.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-system-1.1`, still identical to frozen dev.88 commit `fca67c46e7c1ca5921a031645c9d9fa99063b469`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.97 remote write, merge, tag, release, or deployment.

## Mandatory continuation baseline

1. Re-read current `zft-standards` before further development.
2. Treat dev.97 as the owner-directed visual reset point. Dashboard runtime markup/CSS intentionally match dev.94; do not reintroduce dev.95/dev.96 generic tooltip wrappers without a new isolated design and live visual check.
3. Preserve the manual role-stage workflow, explicit travel commit boundary, six fixed role skills, persistent Momentum, Event bands, Threat state, Forced March/Exhaustion, optional integrations, themes, packs/assets, and exact protected Mount Ironrot source.
4. Role-grade structured help in the Travel log remains accepted; future transparency help should be implemented without altering normal Dashboard layout or typography.
5. No GitHub write is implied.

## Dev.97 scope

- Runtime rollback of Dashboard/tooltip presentation to dev.94.
- Removes dev.95/dev.96 Dashboard tooltip CSS/markup and the orphan tooltip artifact.
- No gameplay/state behavior changes from dev.94.

See `docs/LOCAL_VALIDATION_DEV97.md` and the dev.97 section at the top of `INTEGRATION_TEST_NOTES.md`.

---

# ZFT Overland Travel | Current dev.94 Development Handoff

**Current local build:** `0.4.0-dev.94`, November 3, 2026.  
**Implementation baseline:** complete owner-tested dev.93 manual-install ZIP.  
**Remote baseline:** `LuvacZantor/zft-overland-travel` branch `feature/expedition-system-1.1`, still identical to frozen dev.88 commit `fca67c46e7c1ca5921a031645c9d9fa99063b469`.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.  
**GitHub status:** local build only; no dev.89–dev.94 remote write, merge, tag, release, or deployment.

## Mandatory continuation baseline

1. Re-read current `zft-standards` project/development/versioning/architecture/validation/UI standards before further Foundry work.
2. Continue from the complete dev.94 package when it is the latest owner-tested build; do not reconstruct current work from remote dev.88.
3. Preserve the ledger/shared hex-record boundary, explicit travel commit/time boundary, six fixed role skills, reroll/GM adjudication semantics, persistent Momentum, Threat state, Forced March/Exhaustion, themes, packs/assets, optional Calendaria/Rest Recovery integration, and exact `src/expeditions/mount-ironrot/MountIronrotV413.source.js`.
4. Normal role progression is now manual: Navigation staging → Resolve Reconnaissance → Resolve Expedition Support → automatic Travel Quality/Momentum/Event → Event Resolution when required → Commit Travel. Recovery is not a routine progression control.
5. No GitHub write is implied by this handoff. Every later remote operation still requires fresh task-specific owner authorization.

## Dev.94 scope

- New hex staging no longer auto-launches Reconnaissance or Support.
- Primary action explicitly advances one paired activity at a time.
- Support completion still triggers the saved-role outcome/Event pipeline automatically without committing travel.
- Dashboard distinguishes current-hex Travel Quality and Momentum shift from persistent Momentum; the five-state rail shows `-2/-1/0/+1/+2`, current Event modifier, carry-forward behavior, and Event-chart ranges.
- Role-grade tooltips are structured mini-cards with actual Success/Failure Point contributions.
- All dev.93 Event-resolution/auto-collapse behavior and dev.92 Exhaustion refresh remain preserved.

See `docs/LOCAL_VALIDATION_DEV94.md` and the dev.94 section at the top of `INTEGRATION_TEST_NOTES.md`.

---

# ZFT Overland Travel | Prior dev.93 Development Handoff

**Current local build:** `0.4.0-dev.93`, November 3, 2026.  
**Implementation baseline:** complete local `0.4.0-dev.92` manual-install package.  
**Repository:** `LuvacZantor/zft-overland-travel`.  
**Remote checkpoint:** `feature/expedition-system-1.1` remains frozen at dev.88 commit `fca67c46e7c1ca5921a031645c9d9fa99063b469`.  
**GitHub status:** dev.89 through dev.93 remain local only. No remote source write, merge, tag, GitHub Release, or deployment is included.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.

## Mandatory next-chat baseline

1. Re-read current ZFT standards and inspect the remote branch before any repository operation.
2. Use the complete dev.93 package as the implementation baseline if it is the latest owner-tested build; do not reconstruct it from remote dev.88.
3. Preserve the staged Expedition workflow, explicit Event Resolution and Commit Travel boundaries, rerolls, point scoring, Exhaustion refresh, Travel Quality/Momentum state, two-column roster, Threat state, Forced March/Exhaustion, clock safeguards, themes, packs/assets, integrations, and exact `src/expeditions/mount-ironrot/MountIronrotV413.source.js`.
4. No GitHub write is implied by this local build. Every remote operation requires fresh task-specific approval.

## Dev.93 scope

- Manual Major Complication, Complication, and Opportunity outcomes are normal workflow states. The primary GM action names the pending Event and opens Event Resolution directly instead of routing the GM to Recovery.
- The compact roster displays unique first names, falling back to full names on collisions; underlying Actor identity and all saved/logged names remain unchanged.
- Strong/Partial/Failed role grades have mouse and keyboard-focus explanations including their actual Travel Quality point contribution.
- Completing a hex through Commit/Continue Travel automatically collapses the completed hex card; partial/unfinished travel remains open.
- Momentum rail/Event-chart visualization remains a design candidate and is not implemented in dev.93.

See `docs/LOCAL_VALIDATION_DEV93.md` and the dev.93 section of `INTEGRATION_TEST_NOTES.md`.

---

# ZFT Overland Travel | Current dev.92 Development Handoff

**Current local build:** `0.4.0-dev.92`, November 3, 2026.  
**Implementation baseline:** complete local `0.4.0-dev.91` manual-install package.  
**Repository:** `LuvacZantor/zft-overland-travel`.  
**Remote checkpoint:** `feature/expedition-system-1.1` remains frozen at dev.88 commit `fca67c46e7c1ca5921a031645c9d9fa99063b469`.  
**GitHub status:** dev.89 through dev.92 remain local only. No remote source write, merge, tag, GitHub Release, or deployment is included.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5.

## Mandatory next-chat baseline

1. Re-read current ZFT standards and inspect the remote branch before any repository operation.
2. Use the complete dev.92 package as the implementation baseline if it is the latest owner-tested build; do not reconstruct it from remote dev.88.
3. Preserve the staged Expedition workflow, explicit Commit Travel boundary, rerolls, point-scoring rules, Expedition State, two-column roster, Threat state, Forced March/Exhaustion, clock safeguards, themes, packs/assets, integrations, and exact `src/expeditions/mount-ironrot/MountIronrotV413.source.js`.
4. No GitHub write is implied by this local build. Every remote operation requires fresh task-specific approval.

## Dev.92 scope

Owner live dev.91 testing found that a Long Rest could update native D&D5e Exhaustion while the open Expedition Roster continued showing the old level. Dev.92 observes character Actor updates plus Exhaustion ActiveEffect create/update/delete events and schedules a settled workspace refresh. The hook is display-only and does not apply or remove Exhaustion.

Presentation changes are limited to the roster Exhaustion footer and role-phase point hierarchy: Exhaustion is one line, and Success/Failure point totals sit on their own line below each role phase heading. Existing dice eye candy, Roll/Result columns, current two-column roster, and gameplay rules remain.

See `docs/LOCAL_VALIDATION_DEV92.md` and the dev.92 section of `INTEGRATION_TEST_NOTES.md`.

---

# ZFT Overland Travel | Current dev.91 Development Handoff

**Current local build:** `0.4.0-dev.91`, November 3, 2026.  
**Module repository:** `LuvacZantor/zft-overland-travel`.  
**Local implementation baseline:** complete `0.4.0-dev.90` manual-install package, itself based on the locally tested dev.89 staging implementation.  
**Frozen remote checkpoint:** `feature/expedition-system-1.1` at `fca67c46e7c1ca5921a031645c9d9fa99063b469` (`0.4.0-dev.88`).  
**GitHub status:** dev.89/dev.90/dev.91 remain local only. No remote source write, merge, tag, GitHub Release, or deployment is included.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5. Dev.91 live acceptance pending.

## Mandatory next-chat baseline

1. Read current `zft-standards` instructions before further module/repository work.
2. Use the complete dev.91 package as the implementation baseline if it is the latest owner-tested build; do not reconstruct it from the older remote dev.88 branch.
3. Preserve the shared ledger/hex-record authority, planned-vs-committed travel separation, all six fixed role checks, Event chart, Momentum model, multi-Threat state, safe/Forced March commitment, clock checkpointing, themes, packs/assets, optional Calendaria/Rest Recovery behavior, permissions, and exact `src/expeditions/mount-ironrot/MountIronrotV413.source.js`.
4. No GitHub write is implied by this local build. Any future remote checkpoint requires fresh task-specific approval.

## Dev.91 scope

- Repairs the dev.90 primary-action mismatch that could display **Commit Travel** while the button was silently disabled. The button state now derives from one readiness helper: **Start Travel**, **Resolve Expedition**, **Commit Travel**, or **Continue Travel**. A locked click reports the unresolved stage instead of doing nothing; a ready Commit/Continue action uses the existing travel confirmation and ledger/clock path.
- Restores selectable **Re-roll Check** during Navigation, Reconnaissance, and Expedition Support GM adjudication. Only selected characters reroll, other rulings are preserved, review reopens, canceled rerolls retain the prior result, and the phase is not saved until a final no-reroll submission. Existing Forced March reroll behavior remains unchanged.
- Adds player-readable role-log structure: **CHARACTER / CHECK**, **ROLL**, and **RESULT** columns, retaining die icons/totals, plus Success/Failure point totals in each Navigation/Reconnaissance/Support phase header.
- Adds compact Dashboard **EXPEDITION STATE** for current Travel Quality and persistent Momentum. Historical outcome data remains in Day → Hex history.
- Converts the Expedition Roster to two columns at normal dashboard widths with a narrow single-column fallback while preserving portraits, role/check data, statuses, sheet access, and permissions.
- Retains dev.90 automatic staged workflow, Recovery, explicit travel commit boundary, header player visibility, consolidated Travel history, Event/Threat behavior, Forced March/Exhaustion, clock reconciliation, New Travel Day, integrations, and themes.

## Live evidence carried forward

Owner live testing of dev.90 confirmed the new automatic/staged presentation far enough to expose two regressions: the primary **Commit Travel** control could appear to do nothing while the record remained locked, and the previous GM **Re-roll Check** option was missing. Those are observed dev.90 failures and the direct dev.91 repair targets. Earlier dev.89 live evidence for staging, role resolution, Travel Quality/Momentum/Event calculation, Event Resolution, explicit travel/time commit, and New Travel Day remains prior evidence only. None of it certifies dev.91.

## Evidence and next live checks

Local regression and package evidence is recorded in `LOCAL_VALIDATION_DEV91.md`. Live testing should specifically verify: Navigation and paired-role rerolls; the Resolve Expedition/Commit Travel state transition; Commit Travel opening the existing confirmation and advancing ledger/world time only after approval; player-visible role point totals/column headings/die icons; Dashboard Travel Quality/Momentum; two-column roster at normal width and one-column narrow fallback; then the existing cross-day, Forced March, clock, Recovery, Threat, and GM/player regressions.

No future GitHub write is implied. The remote feature branch remains frozen at dev.88 until the owner separately authorizes a specific repository write.

---

# ZFT Overland Travel | Current dev.89 Development Handoff

**Current local build:** `0.4.0-dev.89`, November 2, 2026.  
**Module repository:** `LuvacZantor/zft-overland-travel`.  
**Frozen source checkpoint:** `feature/expedition-system` at `fca67c46e7c1ca5921a031645c9d9fa99063b469` (`0.4.0-dev.88`).  
**Isolated development branch:** `feature/expedition-system-1.1`, created at the same dev.88 commit.  
**Remote branch status:** branch exists, but dev.89 source is local only. No source commit/push, merge, tag, GitHub Release, or deployment was performed.  
**Live target:** Foundry V13.351 / D&D5e 5.2.5. Live acceptance pending.

## Dev.89 implementation boundary

The staged Hex Travel workflow now owns Travel Quality, persistent Momentum, Event selection, Event Resolution gating, and the initial multi-Threat state. New hexes stop after Navigation/dice and cannot commit travel hours until Reconnaissance, Support, Travel Quality, Momentum, Event, and Event Resolution are complete. Legacy unfinished hexes with no shared record preserve the old resume path.

Quiet Travel resolves as a no-op. Complication/Major Complication and Opportunity are routed but not yet fully implemented; **Record Manual Resolution** is an explicit transitional bridge that records GM notes only and then unlocks the existing travel commit workflow. It does not fabricate planned-time changes, supplies, consequences, checks, Threat movement, or world-clock changes.

Persistent Threat state is store-level under the same ledger-owned shared record collection, supports multiple simultaneous Threats, and uses `Emerging → Developing → Imminent → Immediate`. Movement and visibility are explicit. There is no automatic time-based escalation. GM-created Threats are supported now; automatic Complication-created Threats and Recon-driven visibility are deferred until those downstream engines are implemented. Immediate Threat displays the direct-resolution requirement; Encounter handoff remains deliberately unintegrated.

## Mandatory preservation

Preserve all dev.88 functionality and data contracts, existing travel/Forced March/Exhaustion and clock checkpoints, themes, packs/assets, optional Calendaria/Rest Recovery behavior, GM/player permissions, and exact `src/expeditions/mount-ironrot/MountIronrotV413.source.js`. Do not wire the older generic `EventEngine.js`, `QuietTravelEngine.js`, or single-Threat generic state into the staged Expedition workflow; they are legacy framework components, not the 1.1 authority.

## Evidence and next work

Local Node regression: **63/63 passed**. This is not live Foundry verification. Next work after dev.89 UI/live testing should be driven by observed workflow friction, then implement the specialized Complication and Opportunity engines, automatic Threat handoffs, and finally redesign Encounter so it operates both standalone and as a travel/Threat handoff.

No future GitHub write is implied by creation of the branch. A source checkpoint on `feature/expedition-system-1.1` still requires fresh task-specific approval.

---

# ZFT Overland Travel | Current dev.88 Development Handoff

**Current local build:** `0.4.0-dev.88`, November 2, 2026.  
**Source baseline:** complete `0.4.0-dev.87` manual-install ZIP, verified against the owner-uploaded dev.87 copy; file contents matched.  
**Repository baseline:** `LuvacZantor/zft-overland-travel`, `feature/expedition-system`, commit `caccc9f1acd46b97f05c8e60813bfc7efc871fcc` (`0.4.0-dev.86`).  
**GitHub status:** unchanged. No commit, push, merge, tag, release, or deployment was authorized or performed.  
**Current scope:** resolve the remaining paired role checks from the shared hex record and populate the Expedition Log Roles tab. Travel Quality, Momentum, and Events remain unintegrated.

## Dev.88 behavior

- GM control **Resolve Role Checks** selects the latest/specified unresolved shared hex record.
- Reconnaissance uses saved Scout = Dexterity (Stealth) and Tracker = Intelligence (Investigation).
- Expedition Support uses saved Forager = Wisdom (Survival) and Coordinator = Charisma (Persuasion).
- Both assigned/present members of a pair receive native Midi-QOL skill prompts concurrently at the saved hex DC. GM reviews each result independently and may keep the roll, count it as success, or count it as failure.
- Original total and `rolledSuccess` are retained even when GM ruling changes the effective `success`.
- Unassigned roles and assigned characters absent from the hex-start party snapshot receive no roll and no invented failure.
- New records mark `reconnaissance` and `support` as `pending`. Existing dev.87 records whose phases still say `notImplemented` can be resolved once without migration/backfill.
- Interrupted records reject late role writes. Travel/clock/Forced March/Exhaustion fields are not modified by role resolution.
- Roles tab reads the same shared records and displays Navigation plus both paired-role phases for GM and player clients.

## Preservation and next integration point

Preserve the dev.87 ledger-owned shared record, all travel-hour and clock checkpoint behavior, six fixed role IDs/skills, original gold/copper themes, packs/assets, optional Calendaria/Rest Recovery behavior, GM/player permissions, and exact `src/expeditions/mount-ironrot/MountIronrotV413.source.js`. The older unreferenced `HexTravelRoleChecks.js` remains untouched and unimported.

The next planned integration increment is Travel Quality → Momentum → Event, using the **effective GM-approved outcomes stored by Navigation, Reconnaissance, and Expedition Support**. Do not derive future results from current role settings or overwrite original totals. Discovery/Complication missing content still must not be invented.

Live Foundry acceptance is still required before any promotion or compatibility claim.

---

# ZFT Overland Travel | Prior dev.87 Development Handoff

**Current local build:** `0.4.0-dev.87`, November 2, 2026.  
**Repository baseline:** `LuvacZantor/zft-overland-travel`, `feature/expedition-system`, commit `caccc9f1acd46b97f05c8e60813bfc7efc871fcc` (`0.4.0-dev.86`).  
**GitHub status:** unchanged at dev.86. No remote write is authorized or performed.  
**Current scope:** shared saved record for each hex travel sequence, with all existing game mechanics preserved. Remaining role and event integration is still queued.  
**Delivery:** complete manual-install `zft-overland-travel-v0.4.0-dev.87.zip`; includes current source, tests, preservation documentation, and this handoff.  
**Evidence:** locally validated: 32 automated tests, 42 JavaScript syntax checks, 103 relative imports, and complete package validation. Live Foundry acceptance pending.

## Next-chat baseline and scope

Read current central PROJECT-INSTRUCTIONS.md and applicable standards from GitHub. If continuing this build, inspect the complete dev.87 ZIP before replacing it with the older remote dev.86 source. The owner approved a local build and testing guidance, not a repository write. Read `docs/HEX_RECORDS.md` and `docs/LOCAL_VALIDATION_DEV87.md` for the data contract, original-package comparison, exact source changes, tests, and acceptance requirements.

The owner clarified that the GM continues to select conditions for each crossing. This is not a persistent geographic-map registry. Use the existing hex-card ID as the travel-sequence identifier. Keep the existing ledger authoritative for hours and clock checkpoints, and the generic expedition state separate for Momentum/Threat until their integration is deliberately implemented.

The new field `hexTravelLedger.hexRecords` owns schema-1 shared records. Creation occurs only at the first committed pending-hours save after Navigation review/dice. Progress updates occur with committed safe/Forced March hours. Existing old sequences remain unrecorded. Manual edits retain/detach; Clear Log retains; full Reset clears. Read API is `game.zftOverlandTravel.hexRecords`.

Preserve all original source, packs, assets, history, themes, skill definitions, calendar/rest behavior, and GM/player permissions. The owner supplied an installed dev.86 ZIP with five additional unreferenced older source files; all are retained unchanged. Its dev.78 handoff is archived in `docs/history/INSTALLED_DEV86_HANDOFF.md` and is historical only.

A binary-only downgrade to dev.86 can drop the additive records during later travel because the older loader whitelists known fields. Complete rollback uses dev.86 plus the pre-upgrade world backup. Do not claim live V14 support from these local tests.

---

## Prior dev.86 handoff retained verbatim below

# ZFT Overland Travel | Current Development Handoff

**Checkpoint:** `0.4.0-dev.86`, October 29, 2026.
**Repository:** `LuvacZantor/zft-overland-travel`.
**Authoritative source branch for this checkpoint:** `feature/expedition-system`, advancing from parent `c5a487c97e4245ef27fdd57a928be4fc779f20d2` (dev.79).
**GitHub scope:** Dev.86 source and this handoff committed only to the feature branch by specific owner approval. Neither `develop` nor `main` is promoted; no tag, release, or deployment is implied.
**Delivery:** Complete manual-install ZIP `zft-overland-travel-v0.4.0-dev.86.zip`, SHA256 `0eb8115fb9e61cc137c635a6937b3ec65e8332c46af95ebb8b50ee2b1e5bff8e`; 73 files under one `zft-overland-travel/` directory.
**Evidence:** Locally validated, live Foundry acceptance pending. User screenshots and feedback are not a complete regression pass.

## Mandatory next-chat baseline

1. Re-read current `LuvacZantor/zft-standards/main/PROJECT-INSTRUCTIONS.md` and all applicable current central standards, then inspect this module's actual source and GitHub branch HEAD.
2. Use this dev.86 feature-branch checkpoint, not the older `develop` dev.77 or archived dev.79 handoff, when continuing the current Expedition System iteration. If a locally verified newer complete ZIP exists, establish and compare that baseline before editing.
3. Preserve existing state/history, six role skill definitions, original gold/copper theme presets, world clock integration, GM/player permissions, and the exact original file `src/expeditions/mount-ironrot/MountIronrotV413.source.js`.
4. Never write to any GitHub repository without fresh, operation-specific approval identifying repository, branch, affected files, and intended action.
5. Deliver complete versioned installable ZIPs for future requested builds, not partial patches, and distinguish local/simulated testing from live acceptance.

## Dev.80–86 changes in this checkpoint

- **Dev.80:** Expedition Log gains Travel, Roles, Events tabs. Travel preserves existing log and persistence; Roles and Events remain clearly marked placeholders.
- **Dev.81:** Active Guide Survival (WIS) and optional present Vanguard Athletics (STR) roll concurrently at the same GM-selected Navigation DC. Independent GM adjudication. Travel formula `ceil(2d4 × pace) + failed Guide ? 1d4 : 0 + failed Vanguard ? 1d4 : 0` (terms are additive, each failure gets a separate d4). Missing Vanguard is unassisted, not an automatic failure. Unfinished hex resumes without rerolling. New pure helper `src/engines/hex-travel/HexNavigationResolution.js` and structured results.
- **Dev.82–83:** Aligned compact Navigation results, readable total travel hours and d4 faces beside their calculation rows, with optional original roll detail, preserving historical cards and dice values.
- **Dev.84:** Compact unfinished-hex confirmation; only current resolved Forced March hour auto-expands while hex travel is pending; earlier hours collapse when a new one starts; completing hex collapses all, with one-at-a-time manual historical review.
- **Dev.85:** Four dashboard overview tiles replace redundant hour text rows. Original progress bars, next action, daylight/ETA remain.
- **Dev.86:** Tile labels `DAY`, `TRAVEL HOURS TODAY`, `HEXES COMPLETE`, `TRAVEL HOURS LEFT`, same compact row/heights at standard window width; responsive smaller-width behavior preserved.

Other paired expedition skills are unchanged: Scout = Stealth (DEX), Tracker = Investigation (INT), Forager = Survival (WIS), Coordinator = Persuasion (CHA). Reconnaissance and Expedition Support cooperative mechanics are not implemented yet. The original generic Momentum/Event/Discovery/Complication/Threat/Encounter engines are not newly wired into the placeholder tabs.

## Validation and pending acceptance

The complete dev.86 manual ZIP previously passed local JSON/JS syntax, import, Navigation resolution, Forced March lifecycle, packaging, and multiple responsive dashboard checks. Re-run relevant tests on new changes; live testing should include assigned and unassigned Vanguard, all pass/fail outcomes with GM overrides, forced-hour transition and hex completion, resuming across days without re-rolls, long saved history, narrow widths, GM/player clients, and existing themes. Test on the actually installed Foundry V13/D&D5e versions; V14 compatibility has not been verified. See `INTEGRATION_TEST_NOTES.md` and `docs/DEVELOPMENT_STATUS.md` for specific acceptance steps.

## Preserved source and history

This checkpoint changes only `module.json`, `README.md`, `INTEGRATION_TEST_NOTES.md`, `docs/DEVELOPMENT_STATUS.md`, this handoff, `src/constants/module-constants.js`, `src/engines/hex-travel/HexTravelConsole.js`, `src/engines/hex-travel/HexTravelEngine.js`, `src/styles/zft-overland-travel.css`, and adds `src/engines/hex-travel/HexNavigationResolution.js`. All existing assets and packs retain their prior Git blob SHAs; no data-bearing files are modified.

---

## Archived handoff (historical snapshot, superseded above)

# ZFT Overland Travel | Chat Continuity Checkpoint

**Prepared:** October 28, 2026 at 05:05 PM EDT  
**Project:** 🛠️ Foundry Scripting  
**Module repo:** `LuvacZantor/zft-overland-travel`  
**Development branch on GitHub:** `develop`  
**GitHub HEAD verified:** `8848a78ca4bb0cf3e5fd024fe0c3f809e8a8a4c9` (`0.4.0-dev.62`)  
**Latest complete local test build:** `0.4.0-dev.77`  
**Previous test build/rollback:** `0.4.0-dev.76`  
**GitHub change status:** NOT PUSHED, NOT COMMITTED REMOTELY. GitHub remains at `dev.62`.  
**Current local build status:** locally validated; NOT live verified on Foundry for dev.77.  

## CRITICAL next-chat startup

1. Read the current `LuvacZantor/zft-standards/main/PROJECT-INSTRUCTIONS.md` and referenced applicable current standards using the connected GitHub tools before any module or repo work.
2. Inspect this checkpoint and the module's `module.json`, `README.md`, `docs/DEVELOPMENT_STATUS.md`, `INTEGRATION_TEST_NOTES.md` and tests. The GitHub `develop` branch is an older `dev.62` checkpoint. **Do not silently base future modifications on that older branch or lose the complete local dev.77 source.**
3. Obtain explicit approval with **repository, branch, paths and operations** before modifying GitHub. The request to preserve work should not be treated as authorizing unbounded remote writes or release operations. No `main` push, merge, tag, or release is authorized.
4. The dev.77 ZIP contains the complete **manual-install** module under a single `zft-overland-travel/` directory and can be used as the source for further test builds. It is not a stable release. Verify byte hashes before modifying it.

## Current checkpoint deliverables

- `zft-overland-travel-v0.4.0-dev.77.zip`: complete module, 72 files. SHA256: `279cae7506e59182dbb9006b2fac0e4457eb0dd06c35447340d96259971c24ae`.
- `zft-overland-travel-v0.4.0-dev.76.zip`: previous complete package for rollback.
- This handoff, archived test outputs and source-bearing checkpoint bundle.

## Dev.77 change (most recent task)

The GM reported that after New Travel Day, clicking **Start / Continue** automatically recorded the remaining safe hours in an unfinished hex, completing it and showing the **Hex Complete!** popup before an explicit travel decision.

Dev.77 adds a **Continue Traveling Through Hex N?** confirmation before consuming pending hex hours or advancing world time. It states the pending hours, safe hours available, and any possible Forced March follow-up. **Continue Traveling** uses the existing travel/clock checkpoint logic and will complete the hex only after hours are committed. **Cancel** changes no ledger, hex progress, day count, or world time; clicking Start / Continue again shows the same prompt. If another GM changes the ledger while the prompt is open, the original confirmation is rejected safely.

Dev.77 is based on the entire dev.76 module, not the historical GitHub dev.62 source.

### Changed files relative to dev.76

- Added `src/engines/hex-travel/HexTravelResume.js` (pure confirmation plan, safety checks and contextual wording).
- Modified `src/engines/hex-travel/HexTravelEngine.js` to confirm before existing resume workflow and reject stale confirmation.
- Modified `src/styles/zft-overland-travel.css` for the prompt layout.
- Version/documentation: `module.json`, `src/constants/module-constants.js`, `README.md`, `docs/DEVELOPMENT_STATUS.md`, `INTEGRATION_TEST_NOTES.md`.
- Original Mount Ironrot 4.13 source, `packs/`, `src/migration/`, `assets/audio/`, and other existing module files were preserved byte-for-byte from dev.76.

## Earlier complete work preserved from dev.63 to dev.76

- Reusable Hex Travel engine with legacy Ironrot persistence migration; original source preserved verbatim.
- GM navigation difficulty: Custom DC or Terrain + Region Danger, remembered client selections, compact settings.
- Three dockable GM/player-facing views, themes, role assignments, attendance/roster, navigation rolls, survival/Forced March, Exhaustion decisions and detailed Log.
- Optional world-clock advancement for committed safe/forced travel hours, clock double-advance safeguards, Calendaria-compatible date/clock display including seconds and sunset/ETA advisory; optional Rest Recovery hand-off and New Travel Day bedtime jump.
- Hex-hour segments by expedition day and saved hex ID; cross-day hex progress and logs.
- Log styling, clear counts/labels, day/date separation, historical collapse after new day, persisted day dates including empty days, contextual NEXT messaging.
- Dissolving Hex Complete notification, optional GM-only sound cues, GM notification stays until acknowledgment, player notification goes away after 10 seconds, multi-client broadcast; removed redundant X in dev.76.

## Tests and validation

The local `zft-dev77-work` tests were executed at checkpoint and all passed. Notable summaries:

- `test-regression.mjs`: TOTAL 35 PASS
- `test-expedition-time.mjs`: 15 PASS
- `test-clock-commit.mjs`: 12 PASS
- `test-preferences.mjs`: PASS source wiring preferences, world setting, compact summary
- `test-display.mjs`: 12 PASS
- `test-dev71.mjs`: TOTAL 26 PASS
- `test-dev72.mjs`: TOTAL 23 PASS
- `test-dev73.mjs`: TOTAL 20 PASS
- `test-dev74.mjs`: TOTAL 11 PASS
- `test-dev75.mjs`: TOTAL 14 PASS
- `test-dev77.mjs`: TOTAL 10 PASS

- ZIP validation: **72 module files**, **33 JS syntax checks**, **85 relative imports**, valid manifest and ZIP integrity.
- `module.json.version` is `0.4.0-dev.77`; core minimum is 13, `verified` is 13. **Not V14 live verified**.
- One test intentionally simulates failed audio playback; its caught warning is not a regression.
- Automated tests are not a substitute for live GM/player Foundry testing.

## Live acceptance still required

1. Backup the world and install `dev.77` over the previous test module; do not delete mutable content.
2. Establish an unfinished hex crossing to another travel day. Click **Start / Continue**; verify no world/ledger change prior to confirming.
3. Click **Cancel**. Verify identical hex remaining hours, day travel hours, clock and Log. Reopen; prompt must reappear.
4. Click **Continue Traveling**. Verify exactly the remaining hours are counted, world time advances at most once when enabled, and completion notification occurs only after the hex is truly completed.
5. Test a hex with some safe hours and later Forced March hours; its confirmation must not skip CON saves or auto-apply exhaustion.
6. Test concurrent GM changes, GM/player notification broadcast, a fresh-player reconnect, calendars and Rest Recovery; exercise all five themes and small screen widths.

## Remote GitHub checkpoint proposal (REQUIRES scoped approval)

**Repository:** `LuvacZantor/zft-overland-travel`  
**Target branch:** `develop`  
**Operation:** commit and push an exact development checkpoint containing the complete dev.77 source tree (including original archived source and packs) and an updated development handoff/test notes. Preserve existing history; no force push, no `main` update, no tag, no release.  

As the remote source is still dev.62, first review the tree diff and current HEAD, ensure no unrelated uncommitted work would be overwritten, and use the approved GitHub write operation only after explicit task-specific permission. The module can be resumed from the attached complete ZIP in the meantime.

## Open future design/backlog (not part of dev.77)

- Further timestamp/audit sophistication for hexes/rests, optional night-travel mechanics, manual clock-change reconciliation. Do not assume the user approved implementation of these items.
- Once dev.77 is live accepted, consider a separately approved remote checkpoint and eventual release workflow; never infer GitHub write permissions from a build.
