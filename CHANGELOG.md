# ZFT Overland Travel — Historical Changelog and Archived README

> **Historical evidence only.** The text below is the complete prior development README, preserved verbatim at the dev.126 documentation checkpoint. It contains old headings, expired "current" statements, stale branch references, and superseded behavior descriptions. **Do not use it to choose the active branch or determine present implementation.** Start at [the canonical project status](https://github.com/LuvacZantor/zft-overland-travel/blob/main/PROJECT_STATUS.md) and [the active development handoff](docs/DEVELOPMENT_HANDOFF.md).

## Historical development README snapshot (verbatim)

# ZFT Overland Travel

Current local test package: `0.4.0-dev.126` for Foundry V13 (live validation pending). This is an experimental Expedition System 1.1 build and is not the recommended campaign-session build until live acceptance. The Foundry module ID remains `zft-overland-travel`.

Foundry VTT module implementing Zantor's hex-based overland travel and independent encounter-generation framework.

## Version

Current module build: **`0.4.0-dev.126`** (development only). The original generic framework was developed as `0.3.1`; its earlier notes remain below for historical context.




## 0.4.0-dev.126 | Complication Details Decision-Aid Cleanup

- Keeps Situation as the primary Complication focal point while reducing metadata to the two items the GM needs before adjudication: Reconnaissance and Mitigation.
- Mitigation now reports whether Operational Readiness is actually available for the source hex and explains its optional `-1 Consequence Severity` effect when available.
- Removes Threat Handoff from Details metadata. Threat remains an allowed selectable consequence where the Complication permits it and still records the future Threat Engine handoff when selected.
- Replaces side-by-side Recovery/Suggested Response cards with one compact vertical guidance block.
- Converts Allowed Consequences to a compact inline row and compresses Outcome Guidance into a denser two-column decision reference.
- Preserves dev.125 combined Primary/Detail roll setup, GM reroll/choose-result history, dev.124 GM adjudication, and all deterministic Navigation consequence mechanics.

## 0.4.0-dev.125 | Navigation Generation Workflow + GM Result Control

- Primary Complication and Detail d8 controls now share one Navigation Complication Rolls screen. Normal/normal, exact/exact, and forced Primary plus forced named Detail can be configured before execution; both dice remain real visible Foundry rolls.
- Named Detail forcing is available when the Primary is already known from an exact/forced Primary configuration. A random Primary can still pair with a normal or exact Detail face without another setup window.
- Pending Complication Details adds GM Result Control: Reroll Primary + Detail, Reroll Detail, or Choose Results. Original generated rolls and every revision are preserved in additive audit evidence.
- Complication Details hierarchy is tightened: Reconnaissance / Mitigation / Threat Handoff metadata, compact full-width Recovery row, full-width Suggested Response with a short GM-adjudication note, consequence chips, and existing 2x2 Outcome Guidance.
- Existing dev.124 adjudication, deterministic Navigation consequences, travel/clock/role behavior, themes, packs/assets, migration, and protected Mount Ironrot source remain preserved.

## 0.4.0-dev.124 | Complication Adjudication Workflow Repair

- Complication resolution is now GM-adjudication-only. The live Roll / Check branch is removed from the Complication workflow.
- Outcome and consequence are selected on one Resolve Complication surface; Consequence Severity updates dynamically from the selected outcome and optional Operational Readiness.
- Dashboard Current Step now mirrors the active Complication type and specific situation instead of showing only a generic Event-resolution line.
- Complication Details uses compact multi-column metadata, guidance, consequence chips, and a two-column outcome reference so it remains usable at 1080p-height layouts.
- Operational Readiness and character-target checkboxes use fixed custom geometry instead of inheriting malformed full-size Foundry input styling.
- Navigation content, deterministic consequence tables, travel accounting, roles, Event generation, themes, packs/assets, migration, and protected source are otherwise unchanged from dev.123.

## 0.4.0-dev.123 | Navigation Complication Engine

- Expands Navigation Complications from the Route Obscured prototype to all eight narrative types, each with eight d8 detail results.
- Adds a separate visible d8 roll for Navigation Complication type and a second d8 for its detail, both using GM roll controls.
- Keeps Roll / Check and Direct Adjudication as valid recovery paths and renames user-facing consequence Tier terminology to **Consequence Severity**.
- Removes consequence dice from the live workflow. The GM selects one allowed coded consequence after resolution.
- Implements deterministic **Lost Time**, **Lost Progress**, **Resource Loss**, **HP Damage**, and **Exhaustion** results, plus a recorded **Threat** handoff for the future Threat Engine.
- Resource Loss is restricted to Rations, Water, Healer's Kit Uses, Healing Potions, Ammunition, and Light / Fuel.
- Fixes the Operational Readiness control so it renders as a compact checkbox rather than a stretched generic input.
- Preserves dev.122 two-column GM controls and all existing travel, role, clock, Forced March, history, theme, migration, pack, and protected-source behavior.

## 0.4.0-dev.122 | Readable two-column GM controls

- Returns the routine GM control surface to a readable **two-column** layout at normal width instead of forcing long workflow labels into three narrow columns.
- Keeps **Show to Players** in the GM Controls header and preserves the existing two-column button order: workflow/day, roles/attendance, ledger/current reset, all-reset/log-clear.
- Gives **Reset Current Travel** the same red danger-family treatment as **Reset All Travel** and **Clear Expedition Log**, including a red warning heading in its confirmation surface.
- Keeps the established button font size; no smaller typography is introduced to make the controls fit.
- Preserves dev.121 Roll / Check vs Direct Adjudication, Actor-safe roll attribution, neutral ZFT system-roll speaker, opt-in Operational Readiness, consequence math/presentation, hidden routine Recovery, and all dev.120 travel/reset/pending-phase behavior.

## 0.4.0-dev.121 | Flexible Complication resolution and roll ownership

- Complication resolution now begins with an explicit **Roll / Check** versus **Direct Adjudication** choice. Direct adjudication supports spells, resources, roleplay, clever plans, automatic outcomes, and other GM rulings without inventing a d20 roll.
- Rolled Complication resolution keeps the GM-private normal / exact-d20 / forced-outcome control, but Actor-owned rolls now bind both math and Chat speaker to the Actor selected in Overland Travel. A controlled token on the GM client can no longer replace that Actor.
- ZFT-owned system dice such as Complication detail and Navigation consequence rolls use the neutral **ZFT Overland Travel** speaker instead of inheriting a controlled token.
- Operational Readiness mitigation is now explicitly opt-in and unchecked by default. It is recorded as used only when the GM selects it.
- Complication Log consequence text is human-readable first; tier transitions remain available in the detailed audit view.
- Routine **Recovery** is removed from the normal GM control surface while its state-aware recovery implementation remains preserved internally for later contextual use.
- GM controls use a three-column normal layout with responsive fallbacks; **Clear Expedition Log** spans the final two columns to avoid the prior odd single-button row.
- Player-facing resolved Complication cards add concise outcome guidance and planned-time impact without exposing GM-only tier bookkeeping.
- Dev.120 pending role previews, Reset Current Travel safety, Navigation consequence math, planned-time-only delay behavior, Event forcing, and deferred Opportunity/Threat/Discovery/Encounter boundaries are preserved.

## 0.4.0-dev.120 | Complication consequence slice and workflow recovery

- Active Travel Log now shows Navigation, Reconnaissance, and Expedition Support assignments as **Pending** as soon as the active hex workflow exists, before Navigation results are saved.
- Adds **Reset Current Travel**, which restarts only an uncommitted active hex and preserves completed hexes, prior Expedition Log history, day/hour counters, and older results. It refuses to rewind a hex that already has committed travel hours.
- Adds reusable GM-private roll control for ZFT-owned dice. The Complication detail d8 supports normal, exact-face, or forced-detail selection; the resolution d20 supports normal, exact-face, or semantic outcome. Forced modes still post real visible Foundry rolls.
- Complication resolution now chooses the resolving Actor/test/DC, performs the visible d20, derives Strong Success / Success / Failure / Major Failure from the roll margin, and begins with no preselected outcome. Reconnaissance remains information-only.
- Implements the first real **Navigation → Route Obscured** consequence chain: Standard/Major outcome maps to Tier 0–4; applicable Operational Readiness may reduce the tier by one; Navigation delay adds planned travel time only; d4 delay rolls use GM-private roll control and real visible Foundry dice.
- Saves roll provenance, Support use, consequence tier, and planned-time delta with the Complication record. The Dashboard/Log use the increased planned duration while committed travel/world time remains unchanged until normal travel commit.
- Refines the player-facing Complication card into an information/result summary instead of a GM audit card.
- No Opportunity, automatic Threat, Discovery, or Encounter behavior is introduced.

## 0.4.0-dev.119 | Complication UI refinement and roster stability

- Keeps the accepted Complication workflow/mechanics unchanged while refining the GM-facing Details and Expedition Log presentation.
- Removes repeated Situation prose: the specific complication is the focal text and the Standard/Major frame supplies only the additional context.
- Replaces the three cramped Reconnaissance/Support/Threat metadata cards with one aligned row-based metadata panel.
- Keeps Suggested Response secondary, strengthens the four outcome rows with restrained semantic tint, and reduces category/type to classification rather than the primary focal heading.
- Refines Complications-tab summary cards so the situation and saved outcome scan before classification, and separates GM Resolution notes into their own block.
- Restores the accepted two-column Expedition Roster at normal Dashboard widths by moving the single-column emergency fallback from 330px to 240px.
- No Complication mechanics, persistence, Event routing, Travel/clock behavior, consequence automation, Support consumption, Threat/Discovery/Encounter handoff, or Opportunity behavior changes.

## 0.4.0-dev.118 | Complication readability and visual hierarchy

- Raises Complication Detail/Resolve typography from the dev.117 9–11px micro-scale to readable 11–16px body/metadata/outcome text while preserving the existing ZFT theme.
- Makes the actual situation the visual focal point, with a stronger heading, larger situation title, and readable explanatory frame.
- Converts Reconnaissance, Support, and Threat into three distinct metadata cards with larger values.
- Strengthens Suggested Response and Outcome Guidance hierarchy, including larger outcome labels/descriptions and clear success/failure semantic edges.
- Enlarges selectable resolution cards, notes, and supporting text while preserving keyboard/focus behavior.
- Widens only the Complication Details and Resolve dialogs from 600px to 640px so the larger typography does not create unnecessary wrapping.
- No Complication mechanics, persistence, Event routing, consequence automation, Support consumption, Threat/Discovery/Encounter handoff, Opportunity behavior, or Travel/clock logic changes.

## 0.4.0-dev.117 | Complication formatting repair

- Repairs the Complication Detail/Resolution styles so they target the actual `#zft-hex-travel-workflow-window` GM surface instead of an unused selector.
- Rebuilds the detail hierarchy with severity/status badges, a separated Situation block, aligned Reconnaissance/Support/Threat metadata, Suggested Response, and distinct Outcome Guidance rows.
- Keeps the resolution workflow focused: context is shown once, then four full-width selectable outcome cards, optional GM notes, and Save/Cancel.
- Removes the redundant automatic **Cancel / Exit** action from the detail viewer when **Close** is already present.
- No Complication mechanics, persistence, Event routing, Travel/clock behavior, Support consumption, consequence automation, Threat/Discovery/Encounter handoff, or Opportunity behavior changes.

## 0.4.0-dev.116 | Complication presentation pass

- Replaces gameplay **Open Content** with **View Details**. The Complication Journal remains content storage, while the GM sees the same content through a dedicated ZFT-rendered detail view.
- Simplifies Complications-tab cards to a concise status summary: hex, severity, category/type, situation, Reconnaissance state, saved outcome, and only the actions needed at the table.
- Rebuilds Complication resolution around full-width selectable outcome cards for Strong Success / Success / Failure / Major Failure, plus optional GM notes.
- Removes prototype/debug implementation language and d8 bookkeeping from the normal Complications card.
- Preserves the dev.115 Complication record/lifecycle, Event forcing, Travel workflow, and all downstream-engine boundaries unchanged.

## 0.4.0-dev.115 | Complication Log action routing repair

Dev.115 is a focused repair of the Complications-tab card actions observed during live dev.114 testing.

- **Open Content** and **Resolve Complication** clicks originating inside the Expedition Log now route to the same existing Complication handlers already used by the main Expedition workspace.
- The fix does not duplicate Journal or resolution logic; it only connects the Log window to the established handlers.
- Dev.114 live Complication rendering, dynamic Event-roll fields, active Travel-log Pending role phases, Event math, Complication persistence, travel accounting, and all downstream deferred systems remain unchanged.
- No new Complication content, consequence automation, Support mechanics, Threat/Encounter handoff, or Opportunity behavior is added.


## 0.4.0-dev.114 | Live Complication refresh and workflow clarity

Dev.114 is a focused live-test repair build on dev.113. It does not add new Complication mechanics.

- The **Complications** tab now rerenders from the saved Complication record whenever the Expedition workspace refreshes, so a newly generated or resolved Complication immediately replaces stale placeholder content.
- The **Roll Event** dialog dynamically shows only the control used by the selected mode: no extra field for normal rolls, exact d20 only for exact forcing, and Event type only for Event-type forcing.
- The active Travel Log can display **Navigation**, **Reconnaissance**, and **Expedition Support** immediately after Travel Time is available. Navigation shows the saved result and unresolved later roles show **Pending** rather than waiting for the shared-record refresh to become visible.
- Complication prototype helper text is version-neutral so a newer build cannot display stale dev.112/dev.113 wording.
- No Event math, Complication content, consequence tiers, Support mechanics, Threat/Encounter handoff, travel accounting, or Opportunity behavior changes.

## 0.4.0-dev.113 | Controlled Event die and Complication outcome

Dev.113 expands the accepted dev.112 slice in only two directions. It adds GM-controlled Event d20 testing while preserving the real Event pipeline, and it lets the GM record the first adjudicated Complication outcome without automating consequences.

- Clicking **Roll Event** now opens a compact GM choice: **Roll Normally**, **Force Exact d20 Result**, or **Force Event Type**.
- Forced modes still create a Foundry `1d20` roll/chat result. With Dice So Nice active, the supplied d20 face is the result sent through the existing 3D-roll message path.
- **Force Event Type** does not bypass the Event chart. It calculates which raw d20 faces can reach the selected Event after the current Momentum modifier, chooses one of those faces, displays that d20 result, and then uses the normal Event calculation and routing.
- The Complications card now shows the applicable **Standard** or **Major** frame for the existing Route Obscured prototype.
- **Resolve Complication** presents the approved four outcomes: Strong Success, Success, Failure, and Major Failure, plus optional GM notes. The selected outcome is saved on the Complication record and the existing Event-resolution bridge unlocks travel.
- No consequence tier, time change, Support consumption, resource loss, Threat/Discovery/Encounter handoff, broader Complication library, or Opportunity mechanic is automated in dev.113.

## 0.4.0-dev.112 | First Complication Engine vertical slice

Dev.112 deliberately stays small. It proves the Complication record/lifecycle and Complications-tab handoff without attempting the full 48-Journal/7-RollTable library or consequence automation.

- A Complication/Major Complication Event now hands the GM to **Complications** instead of immediately opening the old manual Event dialog.
- The first click generates one persistent Complication record and one native **d8 detail roll**. Reopening/refreshing uses the same saved record and never rerolls it.
- The saved record uses the locked minimal shell: ID, source Hex Travel record ID, Event type, Standard/Major severity, category, primary type, detail, Reconnaissance state, and `pending`/`resolved` status.
- Reconnaissance maps to **Full Intelligence / Partial Intelligence / No Advance Intelligence** for the Complications-tab presentation.
- The initial content slice is intentionally only **Navigation → Route Obscured**, with its eight approved detail results.
- On first generation, the GM lazily receives a world Complication Journal compendium containing the Route Obscured content and outcome guidance. No broad library is seeded yet.
- **Record Resolution** still uses the existing manual resolution bridge in this build, then marks the Complication record `resolved` and returns control to the established Travel commit workflow.
- No consequence-tier automation, Support consumption, planned-time changes, Threat/Discovery/Encounter handoff, category/primary RollTables, or Opportunity mechanics are implemented yet.
- Travel remains locked to its accepted dev.110 behavior. Threat backend data/code remains preserved but has no visible workspace.

## 0.4.0-dev.110 | Expedition Log tab cleanup

- Removes the redundant **Roles** tab from the Expedition Log; role assignments and role mechanics remain available through GM **Expedition Roles** and the roster role reference.
- Keeps all Navigation, Reconnaissance, and Expedition Support evidence in the authoritative expanded-hex history under **Travel**.
- Keeps **Events** for future event-side systems while removing duplicate per-hex Travel Quality/Momentum/Event/Resolution cards already shown in Travel history.
- Preserves the existing Persistent Threat architecture and its GM/player controls unchanged.
- No travel, role, Event, Threat, Forced March/Exhaustion, clock, persistence, theme, pack/asset, migration, or protected Mount Ironrot mechanics change.

## 0.4.0-dev.109 | Exhaustion severity and tighter role columns

Dev.109 refines the accepted dev.108 roster language without changing card geometry or role identity. The Navigation / Reconnaissance / Expedition Support phase edge remains authoritative for assignment, while characters with Exhaustion receive a red card wash whose intensity increases from level 1 through level 6. The upper-right Exhaustion level uses the same severity tone. Exhaustion 0 remains visually unmarked.

The Exhaustion hover/focus surface is now a compact red-tinted status card sized only for the level and current penalties. Its border/background intensity increases with the same Exhaustion severity class, while 2024-rules worlds continue to show **D20 Tests** and **Speed** penalties and legacy-rule worlds retain their rule-specific effect text. Native D&D5e Exhaustion remains authoritative.

The Expedition Log now changes the actual role-row grid geometry rather than only right-aligning the previous Roll column. Roll is narrowed and moved materially closer to Result; pending **Awaiting GM Confirmation** text remains confined to Result and may wrap without displacing the d20. No travel, role, Travel Quality, Momentum, Event, Threat, Forced March, clock, persistence, theme, pack/asset, migration, or protected Mount Ironrot mechanics change.


## 0.4.0-dev.108 | Phase-coded roster and compact Exhaustion status

Dev.108 carries the Expedition phase language into the Dashboard roster without changing card dimensions. Guide/Vanguard cards receive the same restrained Navigation blue identity used by the Log, Scout/Tracker use Reconnaissance teal, and Forager/Coordinator use Expedition Support violet. The treatment is a subtle inset edge/background tint; success/failure colors remain reserved for outcomes.

The old full-width roster Exhaustion footer is removed. Characters with Exhaustion now show only their current level as a compact red number fixed in the upper-right of the character card. It consumes no additional row height and is absent entirely at Exhaustion 0. Hover/focus uses the existing body-level help overlay: 2024-rules worlds show **Exhaustion N**, the cumulative **D20 Tests** penalty, and cumulative **Speed** penalty; legacy-rules worlds retain their existing rule-specific effect text. Native D&D5e Exhaustion remains authoritative and the existing Actor/effect refresh behavior is unchanged.

The Expedition Log Roll column is right-aligned within its reserved column so the d20 and Result form a tighter right-side pair while preserving the dev.107 protection against long **Awaiting GM Confirmation** text. No travel, role, Travel Quality, Momentum, Event, Threat, Forced March, clock, persistence, theme, pack/asset, migration, or protected Mount Ironrot mechanics change.


## 0.4.0-dev.107 | Paused-travel decision clarity and quiet routine notifications

Dev.107 clarifies the state after the GM chooses **Pause / Exit** at the Forced March boundary. The Dashboard **CURRENT STEP** becomes **Travel Decision**, identifies the unfinished hours still carried by the active hex, and states the two valid paths: **Continue Travel** resumes Forced March on the current day, while **New Travel Day** carries the unfinished hours forward with a fresh daily travel allowance. No travel hour is invented or committed by the day/rest transition.

Routine Foundry informational notifications from the modern Hex Travel workflow no longer create purple pop-up toasts. The same messages remain available as `[ZFT]` console diagnostics where useful. Warnings, errors, required dialogs, and the dedicated Hex Complete notification remain unchanged.

Expedition-role Log rows receive a final alignment cleanup from owner live review: Navigation, Reconnaissance, and Expedition Support totals are centered **inside** their d20 icons, matching the established die-face treatment used for travel dice. The Roll column now has a stable reserved width and the Result column wraps long pending text, so **Awaiting GM Confirmation** cannot push a die out of alignment. This is presentation only; the displayed number remains the saved modified check total. Travel accounting, clock checkpoints, New Travel Day behavior, Forced March saves/Exhaustion, expedition records, themes, packs/assets, migration, and the protected Mount Ironrot source are unchanged.

## 0.4.0-dev.106 | Consolidated Travel Log role presentation

Dev.106 removes the duplicated upper Navigation roll block from each expanded Travel Log hex. **Travel Time** remains in place with the saved total duration, base dice, pace, original roll detail, and any Guide/Vanguard delay dice that actually changed planned travel time. The authoritative lower **Navigation** phase remains alongside Reconnaissance and Expedition Support and now carries the saved Navigation DC in its header, so Guide/Vanguard rolls, result grade, Travel Quality points, and DC are shown once instead of twice. Unique legacy pre-Vanguard Secondary evidence remains preserved inside Travel Time for historical cards.

This is presentation-only cleanup. Navigation rolls/adjudication, travel-duration math, shared expedition records, Travel Quality, Momentum, Event workflow, travel commitment, Forced March/Exhaustion, themes, packs/assets, migration, and the protected Mount Ironrot source are unchanged.

## 0.4.0-dev.105 | Completed hexes stay collapsed

Dev.105 makes completed travel history visually definitive. When Commit/Continue Travel actually completes the active hex, that hex collapses in the Travel Log while the current Day group may remain open for additional travel. Completed hexes also remain collapsed by default after Dashboard refresh/reload; active or otherwise unfinished hex work can still open automatically, and any historical hex may still be reopened deliberately for inspection.

This is presentation/state-of-view behavior only. Travel-hour accounting, completion criteria, ledger/world-time mutation, role results, Travel Quality, Momentum, Event resolution, Threats, Forced March/Exhaustion, themes, packs/assets, migration, and protected Mount Ironrot source are unchanged.

## 0.4.0-dev.104 | Phase-matched primary GM action

Dev.104 is the final cosmetic stabilization pass before specialized engine work. The primary GM travel/workflow button now uses the same restrained phase identity as the Dashboard **CURRENT STEP** panel: Start/Navigation blue, Reconnaissance teal, Expedition Support violet, Event orange, normal Commit/Continue Travel blue, and Forced March red. Hover/focus strengthens the same phase color. Secondary GM controls, including New Travel Day, remain visually separate so the required next action stays obvious.

No workflow ordering, role resolution, Travel Quality, Momentum, Event, travel/clock, Threat, Forced March/Exhaustion, persistence, theme behavior, packs/assets, migration, or protected Mount Ironrot source changes are included.

## 0.4.0-dev.103 | Workflow-first Dashboard and semantic Log color

Dev.103 promotes the Dashboard workflow instruction into a first-class **CURRENT STEP** panel directly beneath Current Expedition, before the stat/result tiles. The panel changes with the saved phase and uses restrained phase identity: Navigation blue, Reconnaissance teal, Expedition Support violet, Event orange, travel blue, and Forced March red. The old buried NEXT block is removed. No workflow mechanics or phase ordering change.

The Expedition Log now distinguishes role grades semantically instead of treating every completed phase as green: **Strong** is green, **Partial** amber, **Failed** red, and pending GM confirmation amber. Navigation, Reconnaissance, and Expedition Support also receive subtle matching phase accents. Expedition Outcome/Event tiles reuse the Dashboard semantic language for positive, neutral, warning, negative, completed, and pending states.

The Start New Travel Day dialog wording is clarified: it reports hours traveled on the prior day, states that the next day begins with a fresh daily travel allowance, and separately states that an unfinished active hex carries forward. It no longer displays the confusing `0h on Day N` line. Saved travel, role results, Event state, Momentum, Threats, Forced March/Exhaustion, clock behavior, themes, packs/assets, migration, and protected Mount Ironrot source are unchanged.

## 0.4.0-dev.102 | Active-Event Dashboard render repair

Owner live testing of dev.101 exposed a runtime Dashboard/Log render failure when the saved current hex already contained an Event. The new Dashboard Event-state renderer referenced `EXPEDITION_EVENT_TYPES` without importing that export into `HexTravelConsole.js`. Dev.102 adds the missing import and a regression guard that requires every Event-type symbol used by the Dashboard renderer to be imported from the Expedition outcome module. No saved expedition state, Event result, Travel Quality, Momentum, travel-hour accounting, Forced March/Exhaustion, Threat state, or Dashboard design is changed.

## 0.4.0-dev.101 | Current Event joins the Dashboard at-a-glance state

Dev.101 adds the current hex **Event** to the Dashboard Expedition State so the Dashboard remains an at-a-glance summary while the Travel Log retains the detailed audit trail. Before the explicit Event stage it shows **Awaiting Event Roll**. After the GM uses **Roll Event**, the Dashboard shows the saved Event result plus a compact `d20 + Momentum = final` / resolution summary. Major Complication, Complication, Quiet Travel, Opportunity, and pending Event states use the same subtle semantic-color approach as Travel Quality and Momentum.

The permanent `EVENT d20 · 1–5 / 6–10 / 11–15 / 16–20` rules legend is removed from Dashboard chrome. Those four bands now live in the body-level Event help overlay, together with the current raw d20, Momentum modifier, final result, and resolution state when available. Event probabilities, Momentum values, the explicit Roll Event boundary introduced in dev.100, travel commitment, Threats, Forced March/Exhaustion, and all other mechanics are unchanged.

## 0.4.0-dev.100 | Explicit Event stage, tooltip repair, and semantic Expedition State color

Owner live dev.99 review identified three workflow/presentation issues before specialized engine development: roster role help still used a legacy inline popup that overflowed the Dashboard, pending Momentum Change text was visually over-weighted, and the Event d20 rolled automatically after Expedition Support. Dev.100 fixes those together and adds the approved semantic color pass.

After Expedition Support saves, Travel Quality and the single Momentum shift are calculated and persisted automatically, but **the Event is not rolled**. The primary GM action becomes **Roll Event**. Clicking it rolls the native d20, applies the already-saved persistent Momentum modifier, saves the Event result, and then either unlocks travel for Quiet Travel or advances to the existing explicit Event Resolution action. Reload/recovery preserves this boundary: a prepared hex remains prepared with an unrolled Event until the GM deliberately rolls it. No travel hours or world time are committed by preparation or the Event roll.

Roster role help now uses the same body-level, viewport-clamped overlay as the other transparency surfaces; the legacy nested role popup is removed. Pending Momentum Change is displayed as **Pending** with subordinate **Awaiting Travel Quality** text rather than a large multi-line result. Travel Quality and Momentum Change receive subtle semantic state tinting, and the five Momentum boxes use a red/orange/amber/olive/green progression from Deteriorating to Favored while retaining labels and numeric modifiers so color is never the only signal. The current Momentum box remains more strongly highlighted. Typography sizes and core Dashboard geometry are otherwise preserved.

Momentum mechanics remain `−2 / −1 / 0 / +1 / +2`; the future deterministic `−3 / −1 / 0 / +1 / +3` candidate remains only a playtest note.

## 0.4.0-dev.99 | Remaining transparency rollout and header compact control

Dev.99 continues the dev.98 body-level help pattern without changing the dev.97/dev.94 Dashboard typography baseline. Structured hover/focus help now covers Hex Travel Remaining, Safe Travel Hours, saved Event results, and Forced March, while roster role help identifies the owning phase and fixed primary check. Event help exposes the saved raw d20, Momentum modifier, final result, chart band, and resolution state. Forced March help distinguishes in-progress uncommitted adjudication from completed committed history. The Coordinator player-facing description is aligned with the approved Expedition Support design: expedition readiness and coordination, not a separate morale mechanic.

The dedicated top-right minimize control is removed. The existing gold mountain/triangle at the far left of the Dashboard header is now the compact-state control: double-click collapses the Dashboard to its floating icon, while keyboard Enter/Space provides the same action. The icon keeps its existing visual size and does not alter header geometry. No travel, Momentum, Event, Threat, Forced March, clock, persistence, or role-resolution mechanics change.

Momentum tuning remains unchanged at `−2 / −1 / 0 / +1 / +2`. A future playtest candidate is `−3 / −1 / 0 / +1 / +3` if the endpoints prove too weak; random Momentum dice are not planned.

## 0.4.0-dev.98 | Isolated Dashboard transparency pass

Dev.98 starts from the owner-checkpointed dev.97 visual reset and reintroduces only the first transparency layer. The dev.97/dev.94 Dashboard typography and card geometry remain the visual baseline. Travel Quality now presents Success Points and Failure Points as separate compact rows; Expedition Momentum separates Event Roll Modifier and Persistence into distinct rows. Travel Quality, Momentum Change, and Expedition Momentum expose structured hover/focus help. Unlike the rejected dev.95/dev.96 implementation, the help panel is appended to `document.body` as a fixed overlay and never participates in Dashboard layout, wrapping, or font inheritance. No generic tooltip wrapper is added to summary tiles. Broader help for Safe Travel Hours, Hex Travel Remaining, Event, and Forced March remains deferred until this pattern is live accepted. No rules, scoring, Momentum, Event, travel, clock, Threat, Forced March, or persistence behavior changes.

## 0.4.0-dev.97 | Dashboard visual rollback to dev.94 baseline

Owner live testing found the dev.95/dev.96 transparency-tooltip layer distorted Dashboard typography and left an orphan tooltip surface above Hex Travel Remaining. Dev.97 deliberately restores the complete dev.94 Dashboard runtime markup and CSS as the visual baseline while retaining the dev.94 feature set: manual Reconnaissance/Support progression, current-hex Travel Quality/Momentum shift, persistent Momentum rail, direct Event Resolution, compact roster, Exhaustion refresh, rerolls, Recovery, and explicit travel commit. The dev.95/dev.96 Dashboard tooltip wrappers and cosmetic overrides are removed rather than patched again. Role-grade structured help from dev.94 remains. No travel math, Momentum rules, Event bands, ledger/world-time behavior, Threat state, Forced March/Exhaustion, integrations, themes, packs/assets, or protected Mount Ironrot source are changed.

## 0.4.0-dev.94 | Manual role progression and persistent Momentum dashboard

Dev.94 changes the normal staged Expedition flow so the GM explicitly advances each paired role group. A new hex now stops after Navigation/travel-duration staging and presents **Resolve Reconnaissance**. After that phase is saved, the primary action becomes **Resolve Expedition Support**. Only after Support is saved does the deterministic Travel Quality → Momentum → Event pipeline run automatically. Completed role phases remain locked, rerolls remain available only inside GM adjudication, Recovery remains for genuinely interrupted state, and no travel hours/world time are committed until the existing Commit/Continue Travel boundary.

The Dashboard no longer mirrors the Log's Expedition Outcome card. **THIS HEX** now summarizes Travel Quality, exact Success/Failure Points, and this hex's Momentum change. A separate persistent **EXPEDITION MOMENTUM** rail shows all five states (`Deteriorating -2 → Risky -1 → Neutral 0 → Prepared +1 → Favored +2`), highlights the current state, displays its Event-roll modifier, states that Momentum carries into the next hex, and includes a compact Event d20 legend (`1–5 Major`, `6–10 Complication`, `11–15 Quiet`, `16–20 Opportunity`). The underlying Momentum/Event rules are unchanged.

Role-grade help is now a structured hover/focus mini-card with a grade explanation plus separate Success Point / Failure Point values instead of one long sentence. Existing compact roster names, Exhaustion synchronization, direct Event resolution, completed-hex auto-collapse, themes, packs/assets, world-time/Forced March behavior, and the protected Mount Ironrot source remain unchanged. Dev.94 is locally validated only; live Foundry V13.351 / D&D5e 5.2.5 acceptance remains required. GitHub remains unchanged at the frozen dev.88 checkpoint.

## 0.4.0-dev.93 | Event-resolution primary action and compact workflow polish

Owner live testing of dev.92 exposed a normal-workflow dead end after Major Complication: the staged Event was correctly marked for GM resolution, but the primary control still showed **Resolve Expedition** and only warned the GM to use Recovery. Dev.93 makes pending manual Events a first-class primary action. The control now reads **Resolve Major Complication**, **Resolve Complication**, or **Resolve Opportunity** as appropriate and opens the existing Event Resolution dialog directly. Recovery remains reserved for genuinely interrupted workflows. Saving the resolution returns the primary action to **Commit Travel** without changing the Event roll or travel hours.

The condensed two-column Expedition Roster now displays a unique first name only, while preserving the full Actor name in the card tooltip, sheet-opening action, rolls, logs, and saved records. If two present characters share the same first name, both fall back to their full names. Role grades such as **Strong**, **Partial**, and **Failed** now expose hover/focus tooltips explaining the grade and the actual Success/Failure Point contribution saved for that hex.

When **Commit Travel** finishes the current hex, that completed hex card now collapses automatically in the Travel log. Partial commits and unfinished/Forced March hexes remain expanded. The completion collapse is presentation state only and does not alter ledger history, world time, Event resolution, or saved records.

Dev.93 is built locally from the complete owner-tested dev.92 package. Automated/static/package validation is local evidence only; live verification remains required on Foundry V13.351 / D&D5e 5.2.5. GitHub remains unchanged at the frozen dev.88 checkpoint.

## 0.4.0-dev.92 | Exhaustion refresh and role-log presentation cleanup

Owner live testing of dev.91 showed that Expedition Roster Exhaustion could remain stale after a Long Rest even though the Actor's native D&D5e Exhaustion effect had changed. Dev.92 keeps the existing character-Actor refresh and also watches the native Exhaustion ActiveEffect create/update/delete lifecycle, coalescing those document changes before repainting the workspace. This is display synchronization only; ZFT does not apply Long Rest benefits or take ownership of Rest Recovery.

Roster Exhaustion is now one compact footer line (`Exhaustion N · penalty`) instead of a stacked block. Navigation, Reconnaissance, and Expedition Support point totals now occupy their own full-width line under the phase heading (`1 Success Point · 2 Failure Points`) rather than being compressed into the upper-right status area. Existing d20 icons, Roll/Result columns, two-column roster, Expedition State, travel commitment, rerolls, Forced March/Exhaustion mechanics, and all dev.91 persistence remain unchanged.

Dev.92 is built locally from the complete owner-tested dev.91 package. Automated/static/package validation is local evidence only; live verification remains required on Foundry V13.351 / D&D5e 5.2.5, especially Long Rest exhaustion removal on both GM and player clients. GitHub remains unchanged at the frozen dev.88 checkpoint.

## 0.4.0-dev.91 | Commit-state repair, rerolls, and expedition-state clarity

Dev.91 repairs two regressions found during live dev.90 testing. The primary travel control no longer shows a dead-looking **Commit Travel** button while the staged hex is still locked: unresolved stages now present **Resolve Expedition** with an explicit reason, while a fully resolved uncommitted hex presents a working **Commit Travel** action that uses the existing confirmation/ledger/world-time commit path. GM adjudication also restores the selectable **Re-roll Check** option for Navigation, Reconnaissance, and Expedition Support. A requested reroll replaces only that character's roll, preserves the other GM rulings, reopens the review, and does not persist the phase until a final no-reroll submission.

Player-facing expedition information is clearer without removing the existing die presentation. Navigation, Reconnaissance, and Expedition Support log sections now include **CHARACTER / CHECK**, **ROLL**, and **RESULT** column headings; the Roll column retains the D&D5e-style d20 icon and total. Each phase header also shows its aggregate Success/Failure point contribution so the resulting Travel Quality can be followed from role checks to the combined score.

The Dashboard now repeats the current **Travel Quality** and persistent **Momentum** in a compact **EXPEDITION STATE** block. Travel Quality is current-hex state and shows unavailable when no current result exists; Momentum remains visible as persistent expedition state. The Expedition Roster uses two columns at normal dashboard widths and falls back to one column only when the roster container is very narrow, preserving portraits, role/check labels, exhaustion/status, permissions, and sheet-opening behavior. Historical Travel Quality/Momentum/Event/Resolution remain in the Day → Hex log.

Dev.91 is built locally from the complete dev.90 package after owner live testing identified the two regressions above. Automated/static/package validation is local evidence only; dev.91 still requires Foundry V13.351 / D&D5e 5.2.5 live acceptance. The remote `feature/expedition-system-1.1` branch remains unchanged at frozen dev.88 commit `fca67c46e7c1ca5921a031645c9d9fa99063b469`; no dev.89/dev.90/dev.91 source has been pushed.

## 0.4.0-dev.90 | Automatic staged workflow, Recovery, and consolidated hex history

Dev.90 removes the routine manual handoff between the staged Expedition phases. After Navigation and travel duration are saved, the module automatically starts Reconnaissance, then Expedition Support, then calculates Travel Quality, shifts Momentum once, and rolls the Event. Each stage still uses the same frozen shared hex record and GM adjudication. Completed stages are never rerolled by the automatic workflow. Quiet Travel remains a no-op; Complication, Major Complication, and Opportunity still require explicit GM Event Resolution before travel can be committed.

Travel commitment remains intentionally separate from planning/adjudication. A staged hex never consumes travel hours or advances world time merely because the Expedition workflow finished. The primary GM action is now state-aware: **Start Travel** for a new hex, **Commit Travel** for the first explicit commitment of a fully resolved staged hex, and **Continue Travel** for a partially traveled hex. The dashboard tile formerly labeled `TRAVEL HOURS LEFT` is now **HEX TRAVEL REMAINING**, identifying the uncommitted hours still required to finish the current hex.

The normal **Resolve Role Checks** control is replaced by a state-aware **Recovery** drawer for interrupted workflows, pending roll controls, unresolved Events, clock reconciliation, saved-state refresh, and diagnostics. **Show to Players** moves into the GM Controls header beside Undock. Rolled-but-unconfirmed Reconnaissance/Support results are visible as **Awaiting GM Confirmation** without being persisted before Save. The Travel log now consolidates Navigation, Reconnaissance, Expedition Support, Travel Quality, Momentum, Event, and Event Resolution under the hex's starting day; a cross-day continuation references the original hex instead of duplicating its role/Event history.

Dev.90 is built locally from the complete dev.89 package that was partially live-tested in Foundry V13.351 / D&D5e 5.2.5. Dev.90 itself is **not live verified**. The remote `feature/expedition-system-1.1` branch remains at frozen dev.88 commit `fca67c46e7c1ca5921a031645c9d9fa99063b469`; no dev.89/dev.90 source has been pushed.

## 0.4.0-dev.89 | Staged Travel Quality, Momentum, Events, and persistent Threat foundation

Dev.89 turns the approved Expedition System 1.1 sequence into a live staged workflow. A newly rolled hex now saves Navigation and planned travel duration but **does not commit travel hours yet**. The GM first resolves Reconnaissance and Expedition Support, then uses the **Events** tab to calculate Travel Quality from all six effective role outcomes, shift the persistent Expedition Momentum track once, and roll the corrected Event Chart (`1d20 + Momentum`, clamped 1–20): Major Complication 1–5, Complication 6–10, Quiet Travel 11–15, Opportunity 16–20.

Quiet Travel resolves immediately as the approved no-op. Major Complication, Complication, and Opportunity are recorded as routed but pending specialized engines; dev.89 provides a clearly labeled **Record Manual Resolution** bridge so the GM can record an adjudicated result and unlock the existing travel workflow without inventing unfinished mechanics. The bridge does not change travel duration, resources, Threat, checks, consequences, or world time. After Event Resolution is complete, the existing Start / Continue confirmation, safe-hour commits, Forced March, Exhaustion, per-day history, completion notices, and optional clock integration proceed normally. Legacy unfinished travel without a shared record retains its existing resume behavior.

The Events tab also introduces the first persistent multi-Threat framework. Multiple named Threats may coexist and retain independent `Emerging → Developing → Imminent → Immediate` stages across hexes and travel days. Threat movement is explicit only; elapsed travel does not auto-advance or decay Threats. The GM can create, advance, reduce, resolve, and control player visibility. Immediate Threat is flagged for direct resolution, but Encounter handoff is intentionally not integrated yet. Automatic Threat creation from Complications, Recon-driven Threat visibility, the Complication content library, the Opportunity content engine, Discovery persistence, and the redesigned Encounter integration remain future increments.

This build is locally validated only. It is based on the frozen dev.88 checkpoint `fca67c46e7c1ca5921a031645c9d9fa99063b469`. A separate GitHub branch `feature/expedition-system-1.1` was created at that exact checkpoint; the dev.89 source itself has **not** been pushed.

## 0.4.0-dev.88 | Reconnaissance and Expedition Support resolution

The shared dev.87 hex record now drives the two remaining paired expedition activities. The GM uses **Resolve Role Checks** to resolve the saved hex's Reconnaissance pair (Scout · Dexterity/Stealth + Tracker · Intelligence/Investigation) and Expedition Support pair (Forager · Wisdom/Survival + Coordinator · Charisma/Persuasion). Each pair uses the exact DC, present-party snapshot, and role assignments frozen when that hex began. Native Midi-QOL skill rolls are requested concurrently within the pair, followed by independent GM success/failure adjudication. Original totals and rolled outcomes remain stored when the GM overrides a result.

The **Roles** tab is no longer a placeholder. It displays Navigation plus the saved Reconnaissance and Expedition Support results for every shared hex record. Unassigned roles and roles whose assigned character was absent when the hex started do not create invented rolls or automatic failures. New dev.88 records mark these two phases `pending`; existing dev.87 records with `notImplemented` can be resolved without reconstructing their context. Interrupted records reject late role results.

This build does **not** calculate Travel Quality, shift Momentum, roll/modify Events, advance Threat, change supplies, alter travel hours, advance world time, or change Forced March/Exhaustion. Those engines remained queued after dev.88. Local validation only; live Foundry V13 acceptance pending. The complete dev.88 checkpoint is preserved on `feature/expedition-system`.

## 0.4.0-dev.87 | Shared saved record for each hex travel sequence

Adds a versioned record within the existing travel ledger after confirmed Navigation and travel dice. The existing hex ID links the GM-selected conditions, present party and assignments, exact Navigation results/rulings, dice, and actual per-day travel hours. Safe and adjudicated Forced March hours update the record in the same ledger checkpoint. Pausing, refreshing, and New Travel Day retain that sequence. Legacy travel is not backfilled, manual ledger corrections preserve and detach records, Clear Log retains them, and explicit Reset clears them.

Read-only API: `game.zftOverlandTravel.hexRecords.current()`, `.latest()`, `.get(id)`, `.list()`, and `.inspect()`. Record reads never write settings. Remaining role and event phases are explicitly not implemented. No map registration, automatic terrain selection, additional rolls, changed travel calculations, clock writer, or new role/event mechanics are introduced.

Derived from dev.86 feature commit `caccc9f1acd46b97f05c8e60813bfc7efc871fcc`, compared with the owner's installed dev.86 ZIP, with its additional source files preserved. See [Shared Hex Travel Records](docs/HEX_RECORDS.md) for the data contract, testing, and rollback details. Local build only; live Foundry acceptance pending; GitHub remains at dev.86.

## 0.4.0-dev.86 | Dashboard tile labels only

The existing four dashboard overview tiles remain in the same compact row with unchanged values, behavior, heights, progress bars and responsive wrapping. Labels now read DAY, TRAVEL HOURS TODAY, HEXES COMPLETE and TRAVEL HOURS LEFT. The final value still displays an em dash when no active hex has pending hours. All gameplay mechanics, world settings, ledger, themes and Expedition Log remain unchanged. Derived from the complete local dev.85 ZIP; local validation only, live Foundry acceptance pending. No GitHub writes.

## 0.4.0-dev.85 | Four-tile dashboard summary

Dashboard overview now presents Day, Travel Today, Hexes Complete, and Hex Remaining as four compact summary tiles (two by two at narrow widths). Removed the duplicate text-only Traveled Today, Safe Hours Remaining, Forced March Hours, and Current Hex Remaining grid. Both original safe-hour and current-hex progress bars, conditional next-action callout, daylight/ETA, existing travel rules, ledger, Force March, role roster, themes, and Expedition Log remain unchanged. Zero pending hex hours are shown as an em dash instead of suggesting an active hex. Derived from complete local dev.84 ZIP; locally tested, live Foundry acceptance pending; no GitHub changes.

## 0.4.0-dev.84 | Compact resume and Forced March accordion

The unfinished-hex resume confirmation is shorter, with an accurate safe-hour/forced-hour summary and a context-sensitive **Review Forced March** action when no safe hours remain. The Navigation and Travel Time panels have slightly tighter vertical spacing while retaining all dice, GM status, detail disclosures, and total-hour calculations. Forced March history now auto-expands only the newly resolved current hour while the hex remains unfinished; a new hour closes the previous one, and completing the hex collapses all completed Forced March entries. Manual review remains possible one hour at a time. These changes affect presentation and expansion state only, not game rules, saves, exhaustion, world time, persistent history or event engines. Live Foundry acceptance pending.

## 0.4.0-dev.83 | Compact summary-first Travel Log card

The Travel Log now shows two aligned Navigation rows with the name first and the saved d20/DC/GM status on the right. The Travel Time section puts the recorded total first, and moves each existing d4 die face next to its corresponding saved hour calculation. An optional Original roll detail disclosure preserves the original math and dice markup. Unsupported historical records fall back without changing stored data. No travel mechanics, world state, themes, or other engines were modified. This is a local presentation-only test build, not live-verified.

## 0.4.0-dev.81 | Cooperative Navigation check

Guide (Wisdom / Survival) and assigned, present Vanguard (Strength / Athletics) are requested concurrently at new-hex start. Both use the same chosen DC, with independent GM success/failure overrides. Each failed check adds its own 1d4 hours, **without the former Guide +2 modifier**. Base travel time stays `ceil(2d4 × pace multiplier)` and delays are added afterward. The travel roll remains a single native Foundry Roll, and the travel card identifies both checks and delay dice. If the Vanguard is absent or unassigned, Guide navigates unassisted with no automatic obstacle failure. Each completed card stores its structured Navigation result for later expedition-engine integration. An unfinished hex resumes its previously rolled remaining hours without new checks. No other role categories, event outcomes or tab integrations are added; the Roles and Events tabs remain placeholders. Live Foundry acceptance is pending.

## 0.4.0-dev.80 | Expedition Log tabs (presentation-only)

The existing Expedition Log now has Travel, Roles, and Events tabs. Travel remains the default and uses the original cards, history and persistence; Roles and Events are clearly marked placeholders. Switching tabs does not roll dice or write expedition state. New event/role logging is not implemented in this build.

## 0.4.0-dev.79 | Role-pair grouping correction

Only Vanguard and Tracker have exchanged activity groups. Vanguard remains STR (Athletics), Tracker remains INT (Investigation), and the other four roles retain their original fixed checks. The existing Guide navigation roll, hex duration, travel log, and Forced March rules are unchanged. No new situational roll dialog, variable skill choices, or automatic cooperative checks are added.

## Expedition roles (feature branch)

The GM **Expedition Roles** panel groups six role assignments into three paired activities: Navigation (Guide + Vanguard), Reconnaissance (Scout + Tracker), and Expedition Support (Forager + Coordinator). Each actor may hold at most one expedition assignment. Their assignments appear in the GM/player Present Party roster. The Navigation pair now rolls and resolves together when a present Vanguard is assigned; the other two category mechanics remain pending. Forced March and Constitution calculations are unchanged. Live Foundry V13 verification remains pending.

## Canonical terminology

- Momentum: `Favored → Prepared → Neutral → Risky → Deteriorating`
- Region Danger: `Safe → Frontier → Wild → Hostile → Cataclysmic`
- Encounter Severity: `Minor → Standard → Dangerous → Deadly`
- Threat: `None → Distant → Closing → Immediate`

Immediate Threat triggers an Encounter.

## Implemented

- Persistent world-level expedition state
- Terrain Base DC and Region Danger modifiers
- Six travel roles
- Role-check outcome grading and party tally
- Travel Quality and Momentum shifting
- Initial event roll and Momentum event shifting
- Quiet Travel: Recover, Prepare, Regroup
- Persistent Threat track
- Encounter severity, Template, Creature Category, Behavior / Intent, and Situation State generation
- Independent Encounter Engine
- GM scene-control button and DialogV2 control panel
- Gold/amber Overland Travel scene-control icon
- Public module API

## Deliberately incomplete

The supplied design specifies terrain-specific Discovery Tables and category-specific Complication prompt tables, but the actual table entries supplied so far are incomplete. The engines are present and return an explicit unavailable result rather than inventing content.

The design also states that Region Danger and Travel Outcome may affect the final Event result, but no complete event-shift rules for those two factors were supplied. Version 0.3.1 therefore applies the documented Momentum event shift only.

## Public API

Available after the `ready` hook:

```js
game.zftOverlandTravel
```

Main services:

```js
game.zftOverlandTravel.hexRecords
game.zftOverlandTravel.state
game.zftOverlandTravel.travel
game.zftOverlandTravel.roles
game.zftOverlandTravel.momentum
game.zftOverlandTravel.events
game.zftOverlandTravel.encounter
game.zftOverlandTravel.severity
game.zftOverlandTravel.complication
game.zftOverlandTravel.discovery
game.zftOverlandTravel.quietTravel
game.zftOverlandTravel.threat
game.zftOverlandTravel.panel
```

The staged Hex Travel record API is read-only to callers. Dev.89 adds:

```js
game.zftOverlandTravel.hexRecords.current()
game.zftOverlandTravel.hexRecords.latest()
game.zftOverlandTravel.hexRecords.get(id)
game.zftOverlandTravel.hexRecords.list()
game.zftOverlandTravel.hexRecords.momentum()
game.zftOverlandTravel.hexRecords.threats()
game.zftOverlandTravel.hexRecords.inspect()
```

The older generic `momentum`, `events`, `quietTravel`, and `threat` services remain available for compatibility but are not the rules authority for the new staged Expedition System 1.1 workflow.

## Installation note

The module folder name must be exactly `zft-overland-travel`. That must match the module `id` in `module.json`.

**Do not install the unmodified GitHub branch source ZIP as a Foundry module.** GitHub names its extracted top-level folder after the repository and branch. For a packaged module ZIP, the archive must contain `zft-overland-travel/module.json` at its root, not `zft-overland-travel-feature-overland-framework/module.json`.

## Development

The repository follows the authoritative ZFT development and release policy in `zft-standards`. The experimental Expedition System 1.1 work is isolated on **`feature/expedition-system-1.1`**; that remote branch currently remains at the frozen dev.88 checkpoint. `develop` and `main` are not updated by this local dev.89 build.

- [Development status and live acceptance checklist](docs/DEVELOPMENT_STATUS.md)
- [Interface theme configuration](docs/THEMES.md)

The current development work is converting the Chapter 4 origin into a reusable Hex Travel Engine while retaining the independent generic Overland framework. Existing Mount Ironrot hex calculations and persistence remain intact during the transition. There is no automatic world-clock advancement from the New Travel Day control.


## Rules documentation

The authoritative human-readable rules are stored in the module under `src/docs/` as normalized HTML. On GM load, the module creates or updates a locked world compendium named `Zantor's Overland Travel Rules`.

The generated Journal contains these pages:

- Overland Travel Procedure
- Travel Events
- Encounter Engine

Only the terminology decisions already established for this project are normalized in those sources. Missing Discovery and Complication table entries are identified as missing rather than invented.

To force a rules refresh from the browser console:

```js
await game.zftOverlandTravel.rules.refresh();
```


### 0.3.1

- Fixes invalid literal escape sequences introduced in the 0.3.0 module wiring.
- Restores the Rules API, automatic rules-compendium initialization, and Rules control-panel action.

## v0.4.0-dev.3: Mount Ironrot direct integration (Foundry V13 test build)

- The Mount Ironrot toolbar action now directly invokes module-owned v4.13 code; no world macro named `Mount Ironrot` is needed.
- The v4.13 source is retained verbatim in `src/expeditions/mount-ironrot/MountIronrotV413.source.js`; a callable wrapper is exported from `MountIronrot.js`.
- Separate world-scoped ledger `world.mountIronrotTravelV45` is retained; generic `ExpeditionState` and travel engines are not touched.
- Requires ZFT-Tools 0.1.0-dev.8 for the dedicated toolbar group; Midi-QOL v13 for direct roll prompts.
- Verified Foundry V13 behavior still requires live GM/player testing; V14 is not verified.


### v0.4.0-dev.4 Mount Ironrot Console (development)

- Dedicated Overland Travel toolbar group continues to be owned by ZFT-Tools 0.1.0-dev.8.
- The Mount Ironrot button is player-visible and toggles a floating read-only results console; GM sees additional travel management controls.
- Player/GM windows independently support expanded, minimized-bar, compact-button, and hidden states. Drag position and state are stored in a client setting.
- GM status snapshots synchronize through `zft-overland-travel.ironrotConsoleSnapshot` world setting. Late-joining clients read the stored snapshot. Stable result cards are incrementally reconciled without re-rendering the entire window. Existing sidebar chat card remains as fallback.
- GM Party Attendance excludes selected assigned PCs even if their player is online. Offline assigned characters can still participate. Saved in `zft-overland-travel.ironrotAttendance` world setting; default is all assigned PCs present. It does not alter Player Configuration.
- The console's travel, new day, ledger and reset actions invoke the existing isolated v4.13 logic, with its initial menu bypassed. Reset requires the original typed confirmation and receives amber/red dialog styling.
- The existing `world.mountIronrotTravelV45` ledger is unchanged. No generic Travel Manager state or engine integration.
- This package is **not live tested**. Use a V13 test world before production.

### v0.4.0-dev.5 (development fix)

- Fixes a launch-blocking JavaScript temporal-dead-zone collision for GM Expedition Console actions.
- No changes to the v4.13 travel calculation, persisted ledger key, UI snapshot format, ZFT-Tools API, or generic Overland Travel engines.
- Foundry V13 live testing is still required.

### v0.4.0-dev.8 (local development, not Foundry-verified)

See `INTEGRATION_TEST_NOTES.md` for the console redesign, inline GM panels, global chat clearing, and compatibility/regression tests. The old v4.13 source is retained intact as reference. Existing `world.mountIronrotTravelV45` ledger remains authoritative. No additional ZFT-Tools changes.

## v0.4.0-dev.8 (experimental)

- Split the Mount Ironrot dashboard and travel log into independent dockable windows.
- GM-only **Clear Expedition Log** clears only the expedition's displayed result history, never global Foundry Chat.
- Navigation/secondary role preferences persist; Actor portraits and detailed progress appear in the dashboard.
- Trial warm gold/parchment/copper Zantor's Realms branding is scoped to the Mount Ironrot workspace.
- See `INTEGRATION_TEST_NOTES.md` for full test and rollback guidance. All features remain live-unverified in Foundry.

### v0.4.0-dev.9: Expedition dice presentation

- Uses ZFT Combat Log's canonical die colors and D&D5e-system-native SVG masks for d4 travel and d20 check icons; no D&D5e artwork is bundled.
- Adds d20 iconography to navigation, secondary checks, and forced-march result cards.
- Present Party portraits open character sheets on double click with permission checks.
- Locally syntax-checked; live V13 testing required.


### v0.4.0-dev.10 (local development build)
- Move active GM travel prompts directly below the progress summary; keep GM controls beneath the party roster.
- Remove redundant Travel in Progress panel, explicitly label safe-travel bar, and show current-hex progress when original duration was recorded.
- Make prior completed hex entries expandable, preserving full saved card HTML and keeping the latest completed hex expanded.
- Follow newest log entries by default; manual scrolling upward pauses automatic following, returning to bottom resumes it.
- Add independent, client-only Dashboard and Expedition Log UI Scale sliders (75–125%), available to GMs and players via the header sliders icon.
- Compact party rows; reserve right-side status for positive Exhaustion rather than repeating Present.
- Leave window stacking and global Foundry/Midi-QOL interfaces untouched to avoid focus/click interception regressions.
- Preserve Mount Ironrot world travel ledger key and unchanged v4.13 reference source.


### v0.4.0-dev.11 development test build
- Newest-first expedition log (without changing persisted chronological card data), with active forced-march group retained together.
- Collapsed completed-hex results use muted parchment/copper surfaces. Failures retain a separate indicator.
- Smart scroll follows the top and offers a Jump to Latest control while reviewing earlier results; restores visual anchor on incoming entries.
- GM adjudication buttons are shown at the top of the active prompt; narrow party rulings use responsive cards instead of a clipped table.
- During expedition Constitution saving-throw requests, native roll dialogs with an identifiable roster actor can be positioned beside the log when screen space permits. If no space is available, only overlapping expedition windows temporarily become invisible until that dialog closes. No global Foundry z-index, Midi-QOL roll behavior, or Action HUD change.
- This package requires live Foundry V13 GM/client validation before promotion.


### v0.4.0-dev.12 GM workflow and dated chronological log (development build)
- GM Expedition Controls moved to the top of the dashboard, separate from a new movable/resizable GM Workflow window.
- Workflow window prefers docking LEFT of the dashboard when room permits; fallback does not change global Foundry stacking.
- Hiding the workflow window does not dismiss or reset the pending GM prompt; click its header button in the dashboard to reopen.
- Travel log uses a single timeline for hex and forced march events, newest first, grouped by recorded travel day.
- Optional in-game Day 1 date in Expedition Settings, Gregorian YYYY-MM-DD; no Foundry world-clock mutation.
- Existing hex records missing a stored travel day remain explicitly undated rather than being assigned a made-up date.
- Completed Forced March history collapses when older; name, roll, result, and GM ruling remain accessible.
- Stamped event timestamps added to new March history and new hex result card metadata; world travel ledger setting name unchanged.
- Live Foundry V13 + Midi-QOL GM/player verification required before any promotion.


## v0.4.0-dev.13 three-column GM workspace (V13 test build)

- GM Expedition Controls live permanently in the left column. All GM travel prompts, attendance, ledger, settings, and confirmation forms appear inline below the corresponding controls. There is no per-workflow X/close window.
- Expedition progress and Present Party occupy the central dashboard without being pushed downward by GM forms; Expedition Log remains docked to the right and displays newest-first dated entries.
- A prompt's Cancel, Pause/Exit, or Escape completes its cancellation callback. A subsequent Start / Continue invocation must work without resetting the expedition.
- Existing saved travel ledger, assigned character roles, GM/client logs, roll dialogs, and module-owned cards are unchanged.
- Browser and simulated regressions are useful checks, not a substitute for GM/player testing in Foundry V13.


## 0.4.0-dev.14: GM Controls sizing and docking

- GM Controls auto-sizes to its visible buttons while idle; it grows when a GM workflow/editor opens and collapses when dismissed. Long forms scroll inside the controls window within the available viewport.
- The old dev.13 fixed 610-pixel height is ignored on migration; no travel ledger, roll, or actor setting is changed.
- GM Controls has its own Dock/Undock button. Docked aligns immediately left of Dashboard and follows Dashboard movement; undocked preserves its independent screen position. Dragging GM Controls by its title also undocks it.
- Saved width remains effective. The corner grip sets an optional maximum active-workflow height rather than introducing empty space when idle.
- Start / Cancel / Start and existing travel state behavior are retained. This is a V13 development test package, not a live-tested release.


## 0.4.0-dev.15: Actual GM Controls corner resizing

- Fixed the dev.14 resize grip: dragging now changes both the visible window width and actual height. An intentional manual size is restored after refresh.
- Docked to the Dashboard, the grip is on the bottom-left and resizing extends outward without overlapping the Dashboard. Undocked, the grip is bottom-right.
- New/unresized GM Controls stays content-sized and grows automatically with inline workflows. Only an explicitly resized window retains extra height.
- Temporary GM decision buttons, including Continue, Stop, Cancel, and adjudication actions, are again placed BELOW their workflow content. Permanent GM Expedition Controls remain at the top of the left pane.
- Prior dev.14 saved height caps are ignored until a new manual resize. No travel-state or Midi-QOL changes; no global Foundry window layering changes.


## 0.4.0-dev.16: GM Controls intrinsic workflow sizing

- Removes the GM Controls manual resize grip and ignores obsolete dev.15 fixed-height settings.
- Idle controls fit the permanent buttons, active workflows expand downward, and Cancel/completion collapses the window automatically.
- Only workflows too tall for the remaining viewport scroll internally; the action buttons remain at the bottom of the form.
- Preserves GM Controls Dock/Undock, center Dashboard, right Expedition Log, and the existing travel/roll logic.
- Test Start > Cancel > Start again, a long GM adjudication, docking/undocking, and reload with an old saved manual size.

### v0.4.0-dev.17: Foundry calendar and live rerolls

Travel dates now read from the V13 Foundry in-world calendar (`game.time.calendar`) and are captured once per expedition day. Expedition Settings no longer has a manual date picker, and the module never changes the world clock. Legacy manually recorded dates remain available as fallback for previous entries.

When the GM requests a Forced March Constitution-save reroll, the corresponding character's expedition log card immediately shows **Rerolling** while waiting for the native Midi-QOL roll dialog. On completion it updates the same card with the replacement total and reroll count; a fresh GM ruling is required.


## v0.4.0-dev.18: Player-facing Forced March and fixed interface scale

- The Expedition Log shows a read-only Forced March briefing to both GM and players before the GM chooses Continue/Stop. It includes travel day/date, upcoming hour, CON save DC, current hex time left, and the Exhaustion consequence of failure.
- The briefing transitions through GM decision, saving throws, rerolling, and adjudication using the existing world status snapshot. Completed hours appear once in the existing dated, newest-first Forced March history.
- No new custom Foundry ChatMessage is created and no GM action buttons are exposed on player clients. A canceled GM decision publishes a paused status and never advances the ledger.
- Removed both UI size sliders, the size-settings header button, and their event handlers. Existing client scale preferences are ignored; all windows render at 100% while preserving docking and other window settings.
- Runtime compatibility remains targeted at Foundry V13 and D&D5e/Midi-QOL. Live GM/player verification is required. No GitHub write.


## v0.4.0-dev.19: expedition roster, region, date check, day log groups

- Present Party now shows configured travel role, assigned skill and ability, Actor-derived skill modifier, and Actor-derived Constitution save bonus. Unknown modifiers render as `—` rather than inventing a numeric bonus. This includes all five existing secondary activities.
- Region / Location promoted to a prominent top-of-dashboard panel, plus a first-class GM `Region / Expedition` control. Settings put location first.
- World calendar display prefers an installed Simple Calendar formatted date when available (including its configured year/era) and otherwise uses native Foundry V13 calendar formatting. Current-day date can be explicitly re-synced in Region / Expedition; historical days are not silently rewritten.
- Log entries are grouped into collapsible travel-day sections. Stopping or pausing collapses the current day, continuing it expands again; older days start collapsed. Historical entries remain expandable and newest-first.
- No changes to the original Mount Ironrot v4.13 source, travel calculations, Midi roll submission, global Foundry stacking, or GitHub. Live V13 GM/player validation required.


## v0.4.0-dev.20: saved Party Roles, compact travel setup, Calendaria year

- GM Controls are now ordered by workflow: **Start / Continue | New Travel Day**, **Party Roles | Party Attendance**, **Edit Travel Ledger | Show to Players**, **Reset Travel | Clear Expedition Log**. Removed the duplicate Region / Expedition button; expedition identity remains editable from the center Dashboard's Edit control.
- Party Roles is an inline, GM-only editor beneath the fixed GM Controls, with Save Party Roles and Cancel below the fields. It saves Navigator, optional secondary character, and activity in the existing world-scoped `ironrotRolePreferences` setting. Role selections immediately update the present-party roster for all clients. Characters assigned but offline remain eligible; absent PCs cannot be assigned.
- Start / Continue reuses valid saved role assignments and presents a compact summary (plus travel pace and Prompt Rolls). The GM can choose Change Roles for This Hex without losing the previous behavior. Missing saved characters cause a warning rather than silently selecting a different PC. A partially traveled hex continues its existing state without requiring the now-irrelevant initial Navigator assignment.
- Calendaria integration uses its public `CALENDARIA.api.getCurrentDateTime()` and `CALENDARIA.api.formatDate(date, "dateLong")` to respect `years.yearZero` (e.g. 1501 DR rather than raw year 0). A failed Calendaria lookup does not write a raw zero-year date. The **Edit** panel's Re-sync Current Travel Date action remains available to correct dates saved by older development builds. Past dates are not rewritten automatically.
- The Dashboard header always displays **Overland Expedition / Expedition Dashboard**, while the region / world are presented once in a more prominent branded expedition context panel. Custom expedition names remain visible there.
- Original Mount Ironrot v4.13 source, travel ledger key, travel calculations, Foundry clock, player Midi-QOL rolls, and window stacking are unchanged. Live V13 GM/player verification is required. GitHub unchanged.


## v0.4.0-dev.21: Foundry window priority and Chronicle visual pass

- Expedition Dashboard, GM Controls, and Expedition Log now share their own bounded stacking order below Foundry's native application windows. Clicking an expedition pane moves it forward only relative to the other two expedition panes. No Foundry global z-index, `#interface`, `#ui-left`, Action HUD, Midi-QOL, native window, or blocking overlay is modified.
- On V13 application/dialog render, an application-layer compatibility check can lower **only our panes** below a native/legacy floating window with an unusually low z-index. Ordinary Foundry dialogs keep normal focus and click targets.
- Each expedition day owns its displayed date. Collapsed hex and forced-march summaries no longer repeat the travel date; dated details omit redundant date labels. The current travel day is displayed even before it has a log event.
- Subtle journal styling changes clarify open/current versus muted historical events, keep gold/brown styling and dice/result colors, and reduce repetitive framing.
- No changes to travel calculations, world settings, role assignments, character Exhaustion, Foundry's clock, or history storage. Target: Foundry V13; test GM and player clients in a real Foundry session before acceptance.


## v0.4.0-dev.22: user-facing ZFT module branding

- Foundry's module title is now **ZFT Overland Travel**.
- The main expedition window title is **ZFT Overland Travel**, with **Expedition Dashboard** retained as its subtitle; the fixed header is refreshed consistently.
- The generic Travel Manager dialog, toolbar group, and hidden expedition-state setting label use the new ZFT title.
- The left **GM Expedition Controls** and right **Expedition Log** headers remain descriptive within the ZFT workspace.
- Mount Ironrot retains its expedition-specific name and isolated rules; custom expedition name/region/world settings and their defaults remain unchanged.
- Existing world rules compendium names and IDs are intentionally not migrated or recreated by this display-title update.
- Unchanged module ID `zft-overland-travel`, existing setting keys, actor/world state, activity logic, persisted ledger, original v4.13 source, dependencies, and Foundry window layers.
- No GitHub push, tag, or release; verify Foundry module manager name and GM/player window headers in V13.


## v0.4.0-dev.23: compact expedition UI (GM and player)

- The dockable Expedition Log now calculates its initial height from the visible day and event content. The old 650px default no longer fills most of a screen when the expedition has no results.
- When more history is shown or opened, the log expands up to the available viewport height, then scrolls internally. Manually resizing the log records `logHeightManual: true` in **client-scoped** settings, preserving the user's choice. A pre-dev.23 non-default saved height remains respected; a legacy `650px` default is treated as automatic. Width/docking settings are not reset.
- Empty days display a compact status with different guidance for GM and player. Current travel day remains first.
- Completed hexes and forced marches start as compact, expandable event summaries; full dice/results stay available on demand. Saved travel-card HTML and world ledger data are unchanged.
- Tighter hierarchy on the dashboard and roster, with slightly larger labels, progress/status text, and clearly distinguished Start / Continue and New Travel Day actions.
- A narrowly scoped CSS workaround targets this module's entry in Foundry's Module Management list when V13 supplies a package-ID row attribute. This needs verification with the user's actual Foundry/module-manager add-ons; it does **not** restyle other module entries.

Scope: Existing three independent dockable panes, roll behavior, persistence keys, calendar dates, and the embedded original Mount Ironrot v4.13 remain unchanged. No generic-travel engine refactor. No GitHub write.


### v0.4.0-dev.25: Recovering stalled player rolls
While a GM is waiting on a Midi-QOL player skill check or Constitution save, GM Expedition Controls offers **Resend Prompt**, **Roll as GM**, or **Cancel Request**. Use Resend after the player reconnects; old attempts are ignored locally but a late prompt might still appear on the player client and should be closed without rolling. Cancel Request during an initial skill check cancels that hex attempt without spending time; canceled CON requests remain unresolved for GM adjudication/reroll. No changes to world clock. GM-side browser reload cannot resume the original in-memory roll request in this development version.


### v0.4.0-dev.26 (local test build)
- Current-day latest hex roll is identified as in progress rather than mislabeled complete; historical hex rolls are grouped and retain their full details.
- Expanded travel results use a compact read-only layout with dice artwork and calculation preserved.
- No changes to travel rolls, ledger keys, saved HTML, Foundry time, or the recovery controls added in dev.25.

### v0.4.0-dev.27: Full interface color themes (local test build)

- The existing look is **Zantor Default**. Selecting that preset with no overrides uses the same CSS as dev.26.
- Four alternative full-interface palettes: Antique Copper, Moonlit Slate, Verdigris, and Graphite.
- Open **Interface Color Themes** from the palette icon in the Expedition Dashboard header.
- Customize 22 individual interface colors with a visual color picker or a six-digit `#RRGGBB` value, grouped by surfaces, typography, controls, and results.
- Preset selection and edits preview immediately on the three ZFT expedition panes. **Save Theme** stores the choice in Foundry's per-user `client` setting `zft-overland-travel.interfaceTheme`; **Cancel** restores the saved choice. **Restore Preset** clears custom overrides; each color also has its own revert control.
- Themes do not change Foundry UI, Action HUD, dice art/semantic dice colors, calendar, actor effects, GM travel workflow, existing travel history, shared expedition settings, or ZFT Tools.
- All validations are static/simulated only until tested live in Foundry V13.

### v0.4.0-dev.34: Independent interface theme window (local test build)

- Use the **single palette button in the Dashboard header**. The duplicate palette button has been removed from the Expedition Log.
- The theme editor is now an independent, draggable, resizable, modeless floating window (not an inline Dashboard panel). On desktop it presents preset swatches in a left column and 22 color controls in a two-column layout on the right; smaller viewports stack the groups and scroll inside the window.
- Preview, preset/hex editing, Save, Cancel, Escape-to-cancel and client-only theme persistence remain. Closing the main Dashboard discards an unsaved preview.
- The editor stays above ZFT panes but yields to regular Foundry/Midi-QOL windows. No global stacking changes or transparent overlays are added.
- This update makes **no changes** to the Mount Ironrot rules, world-clock behavior, travel state, roll recovery, or saved log data. Live Foundry V13 GM/player testing remains required.

### v0.4.0-dev.30 (local UI fix, unverified in Foundry)

- Expedition Roles editor immediately disables a character already selected in another role.
- Corrects duplicate assignments found when opening previously saved role preferences.
- Existing save-time uniqueness check, role list, navigation, hex duration, and Forced March remain unchanged.
- Feature-branch repository update requires separate approval.

### v0.4.0-dev.34 (local test build)

- Start/Continue no longer displays the legacy Navigator or Secondary assignment controls. It displays the three paired Expedition Role groups and takes the Guide from saved Expedition Roles.
- The existing Guide Survival and hex-duration calculation are retained, with no legacy secondary roll. All other cooperative checks remain unimplemented and must not be mistaken for executed rolls.
- New assignment editing stays in GM Expedition Roles. This build is not yet live verified.

### Local 0.4.0-dev.34 regression repair

Restores dashboard/log rendering by implementing the missing exhaustion-menu cleanup method. Completes the planned GM roster context menu, exhaustion penalty labels and role hover descriptions. This build requires live Foundry V13 validation.

### Local 0.4.0-dev.37 (not committed)

- Expedition Roles assignments now open in their own movable window, fully sized on ordinary monitors with scrolling only when viewport height requires it; role names and skill checks are on separate lines.
- Used party members are disabled and visually muted in other role dropdowns.
- Roles Reference groups have subtle shaded panels and separators.
- Right-align the exhaustion level and penalty lines; synchronize context menu selection with the same displayed actor value and block simultaneous edits.
- Increase dashboard travel-metric text slightly.
- This is a local test package. Pair-resolution engine is not yet implemented; hex calculations and Forced March remain unchanged.


### Local 0.4.0-dev.37 (unverified GM test build)

- Reconcile D&D5e 5.x exhaustion status flags and the actor attribute before accepting a manual adjustment; report an actual readback mismatch rather than pretending the correction succeeded.
- Expedition Roles assignment window opens below GM Expedition Controls. Small viewports may scroll inside the separate window.
- Consistent GM controls headings, warning treatment, action button sizing and themes; compact four-field Edit Travel Ledger.
- Existing travel/hex-duration formulas and Forced March decisions are unchanged. This build has not passed live Foundry V13 testing.

### Local 0.4.0-dev.38 (V13 testing pending)

Expedition Roles assignments return to the inline pop-down within GM Expedition Controls. The two-column, three-group editor retains separate name/skill/select lines and prevents duplicate character assignments. The separate Roles Reference is unchanged. The exhaustion correction now primarily uses the native actor field and verifies it after updating; prior duplicate-effect errors during Change Log module hooks need live verification. Right-aligned exhaustion information and context-aware color cues for safe hours, Forced March, and hex progress are added. No travel-duration rules were changed.

### Local 0.4.0-dev.39 (V13 testing pending)

- The Hours Today dashboard stat now has a theme-aware amber shaded border/background at exactly 8/8 safe hours, red at 9/8 or more. Safe travel retains a neutral card background. The existing number/progress/warning colors are unchanged.
- For Forced March party-CON adjudication, a failed save preselects **Apply +1 Exhaustion**; success still defaults to **Accept success**. Unrolled checks remain unresolved, and any previously saved GM choice is preserved. Nothing applies until the GM selects **Process Party Decisions**. Reroll results are re-evaluated under the same default rules while other recorded choices persist.
- The Forced March ruling footer has two equal-width, two-line actions (**Process Party / Decisions**, **Pause / Exit / Saves Progress**) and stacks on narrow screens. Existing action callbacks and save checkpoints remain intact.
- No changes to navigation, hex duration, forced-hour DC, outcomes, or the legacy source file. Static tests only; live GM/player Foundry verification pending.


## v0.4.0-dev.63 | Hex Travel Engine naming and GM-selected navigation DC

- Active Hex Travel files, symbols, CSS classes, data attributes, bridge, and toolbar action no longer use the Chapter 4 Ironrot names. Original MountIronrotV413.source.js retained byte for byte as archival source only.
- GM chooses Custom DC (default 15) or Terrain + Region Danger in each new Hex Travel setup. Both selections are explicit; no environmental automation or scene inference.
- One validated DC is used for Guide Midi roll requests, result adjudication, report text, and retained per-hex card metadata. Existing saved card and Forced March history remains intact.
- Historical world/client setting values are copied once through src/migration/hex-travel-v63.js to the generic Hex Travel keys. No automatic deletion or rewriting of old setting records; the running engine only writes new keys.
- Tested baseline remains Foundry V13.351 / D&D5e 5.2.5. V14 is not yet verified.
- No changes to existing Forced March DC formula, base travel dice, pace multipliers, world clock behavior, or unrelated generic Overland engines.

## v0.4.0-dev.64 | Migration startup recovery (V13 test build)

- Correct scope-specific settings storage detection. World settings are stored as Setting documents in a Collection (`get`); client settings use localStorage-style `getItem`. The incorrect client lookup caused Hex Travel startup to abort on .63.
- Preserve all existing world and client state and the original historical keys. A partially completed migration resumes only missing destinations, and does not overwrite any migrated or newly edited value.
- Missing or failed client preference migration logs a warning and permits workspace startup with registered UI defaults; failed world migration remains fail-closed to protect expedition history.
- No travel mechanics, DC selection rules, layout, theme, dependencies, source v4.13 reference or compendium contents changed. The fix still requires live Foundry V13.351 / D&D5e 5.2.5 GM and player testing.

## v0.4.0-dev.65 | GM prompt toggles and compact Navigation Difficulty

- Start / Continue closes its own initial Hex Travel setup when clicked again; New Travel Day similarly closes its uncommitted confirmation on a second click. Canceling either prompt writes no world ledger changes. A submitted decision, active Guide roll, or Forced March is still protected from button-based interruption.
- Reorganized the initial Navigation Difficulty section with accessible segmented radio choices for Custom DC versus Terrain + Danger, paired terrain/danger inputs, an understated DC summary, and reduced redundant nested framing. Responsive narrow panes stack input controls. Existing GM-selected calculations, values, custom description, per-hex logging and mechanics are untouched.
- Preserves dev.64 settings migration recovery, all role/attendance/editor functionality, travel history, theme presets, and original v4.13 source. Live Foundry V13.351/D&D5e 5.2.5 GM and player acceptance remains outstanding. No GitHub write.


### Local 0.4.0-dev.67 | GM New Travel Day and optional Rest Recovery

- Compact GM Day N to N+1 panel displays hours reset and unfinished-hex hours retained.
- Optional time jump to next sunrise, midday, sunset, midnight or custom 12-hour clock time (5-minute steps). Sunrise/sunset require the active calendar's values; no 6 AM / 6 PM assumptions. A preview displays elapsed idle time. Default remains no time change.
- Optional Rest Recovery 5e integration is only enabled when its GM prompt API is active. ZFT advances to bedtime then opens the provider's native GM rest UI; the GM selects Long Rest and party, and Rest Recovery owns resource changes and any additional rest-duration time advancement. No direct actor healing or duplicate 8-hour jump.
- Next travel day still resets only expedition hours, preserves unfinished hex, and never requires Calendaria or Rest Recovery. Cancel/toggle off changes nothing. Rest workflow does not automatically reopen Guide travel.
- When Rest Recovery is selected, the new day date remains pending until travel next records a calendar date, to avoid permanently stamping bedtime's pre-rest date. This is not an automatic rest-completion guarantee.
- Hex-based world-time synchronization remains deferred to the next phase.


## 0.4.0-dev.68 (local test build, not committed)

- Added GM world setting **Advance world time during Hex Travel** (off by default). When enabled, committed safe and Forced March travel hours advance Foundry world time as they accrue, including partial hexes. No separate change on hex completion; no rest hours are added.
- Travel clock updates are checkpointed in the existing world ledger. An interrupted or failed update requires explicit GM reconciliation; the engine never blindly replays it. Existing history, actor exhaustion adjudication, pending hex IDs and Rest Recovery remain preserved.
- Corrected the New Travel Day Rest Recovery checkbox alignment on themed/narrow windows.
- Live V13.351/D&D5e 5.2.5 GM and player acceptance is outstanding.


## 0.4.0-dev.69 local test build (not committed)

- Compact Hex Travel controls above Pace: GM difficulty modes/inputs, navigation DC and persistent world-clock checkbox in one summary row. No changes to travel hours, DC rules or existing ledger data.
- New Travel Day now stores the GM client’s time preset, custom bedtime (hour, minute and AM/PM), and Rest Recovery checkbox preference. UI selection alone never advances time or performs a rest.
- Corrected the checkbox and description alignment with independent label and input styling across ZFT themes and narrow windows.
- Rest Recovery and Calendaria remain optional; the GM must explicitly confirm a new day and complete the rest in the provider UI.
- Existing .68 clock synchronization and migration implementation retained. Requires live V13 GM/client verification; V14 is not verified.


## 0.4.0-dev.70 local test changes

- Expedition header shows current in-game date and clock time, read directly from Foundry/Calendaria. The `updateWorldTime` hook updates only the labels while the Dashboard is open. No polling, independent timer, world setting, or duplicate time authority.
- Dashboard shows sunrise/sunset daylight status when Calendaria provides valid values, plus a read-only estimated arrival time for unfinished hexes with known travel duration. Time estimates do not start travel or apply nighttime penalties.
- Nonstandard calendar hours and missing daylight data display unavailable status instead of inventing a time. Existing ledger, historical dates, resting and travel clock accounting are unchanged.
- This is a V13 live-test candidate. No V14 compatibility claim.


## 0.4.0-dev.72 | Calendaria display parity, clear travel wording, and day summary

- Mirrors Calendaria's published visual tick and selected GM/player HUD time format including seconds when configured; clock start/stop, world-time commits and display format changes synchronize the header without rebuilding the Dashboard. No independent timer or world-time writes. Native time fallback when Calendaria is absent.
- Existing optional Calendaria recommendation is preserved in `module.json`; it is not a required dependency. Live target remains Foundry V13.351 / D&D5e 5.2.5, not V14-certified.
- Expedition Log day headers show separate Completed, In Progress, and Forced March check counts; no counts are reclassified or persisted anew.
- Improves dashboard next-action, safe/forced-hour descriptions, sunrise/sunset temporal wording, and estimated-arrival language. Arrival row is hidden when no active hex exists. Display-only changes do not modify expedition records, roll logic, clock accounting, or the original Mount Ironrot source.
- Live acceptance still needed for Calendaria version-specific hooks, GM/player display preferences, pause/stop boundaries, all themes and small windows.


## 0.4.0-dev.72 | Hex travel day-hour history and log readability

- Per-hex actual committed hours are recorded in the existing world ledger as additive `hexHourSegments` entries keyed by stable hex-card ID and expedition day. Safe hours and adjudicated Forced March hours are recorded once, at the same ledger checkpoint as completed travel. The existing clock synchronization and all travel calculations remain unchanged.
- Completed hex headers show recorded travel duration; when one hex spans days, the expanded hex displays each day's hours and unfinished balance. The same stable hex appears on each relevant day, without generating a new roll/card. Older history with no per-day data retains its original rolled duration and clearly indicates any missing allocations.
- Day/date are separate lines; day counts explicitly say Hex Completed, Hexes Completed, Hex in Progress, Hexes in Progress, and Forced March Checks as appropriate. The Dashboard NEXT instruction is its own two-line heading.
- After the final hour commits, only the GM sees a six-second themed, nonblocking Hex Complete reminder. No automatic party-token movement or replay on refresh. When 8 safe hours have been reached, the notice warns that continuing may require Forced March.
- Manual install ZIP with complete module; preserved original Mount Ironrot source, compendiums, migration logic, integrations and themes. Live Foundry V13/V14 acceptance pending. No GitHub write.

## Local test build 0.4.0-dev.73 | Notification, audio and next-day log collapse

- Hex Complete GM-only announcement is positioned over normal Foundry windows with the same opacity/blur dissolve technique used by ZFT Cinematics, without adding a Cinematics dependency. Only emitted on a saved, fully completed hex; duplicate notice IDs suppressed per session.
- Optional GM-client sound cues for navigation success/failure, first Forced March prompt, and hex completion. Four original low-volume WAV assets bundled. Foundry Module Settings offers an enable toggle (off by default) and individual client volume (0–1). No player broadcast.
- A confirmed New Travel Day collapses the prior day's log group and expands the new current day on every connected client. Canceled New Travel Day leaves expansion unchanged; earlier days may still be expanded manually.
- No changes to travel calculations, DCs, effects, migrations, or original source. Local tests only; live V13 / V14 acceptance pending.

## Local test build 0.4.0-dev.74 | Date preservation and GM prompt clarity

- Hex Complete acknowledgement now supports click-to-dismiss, Enter, Space, or Escape with a ten-second automatic dissolve fallback; event never re-executes travel.
- On confirmed New Travel Day, persist the departing day's calendar date before optionally advancing to bedtime. This preserves dates even for days with no travel events; a canceled dialog leaves state unchanged.
- New days awaiting Rest Recovery show a provisional date; the current date label changes with world time without rebuilding or expanding history. Historical day dates are not rewritten.
- New Travel Day preview shows `(next calendar day)` on its own success-colored line, and the summary distinguishes the old day's hours from the new day's reset zero counter and separately retained hex time.
- No changes to rules, travel-hour calculations, Rest Recovery handling, compendiums, migrations, or saved world data schema. Live GM/player testing required.

## Local test build 0.4.0-dev.75 | Hex completion acknowledgement

- Each saved completion publishes a GM-owned world event for connected GM and player clients.
- GM notices remain until dismissed by click, Enter, Space, or Escape; unacknowledged notices survive refresh in that GM client and are queued rather than overwritten.
- Connected players receive a brief completion announcement which can be clicked away or fades after 10 seconds. Player alerts are silent and historical events do not replay at startup.
- No change to travel math, dice, clock, rest, logs or historical expedition state.
- Foundry V13.351 / D&D5e 5.2.5 requires live GM/player client acceptance.

## Local test build 0.4.0-dev.76 | Clean Hex Complete reminder

- Removed the redundant upper-right X control from GM and player Hex Complete notices. The whole notice remains clickable and keyboard accessible (Enter, Space, Escape).
- GM notices remain visible until acknowledged and restore if pending after a refresh. Players can click to dismiss or wait for the existing 10-second automatic fade.
- All other completion events, acknowledgement persistence, audio, travel math, dates, settings, and packs remain unchanged. Live multi-client Foundry testing pending.

## Local test build 0.4.0-dev.77 | Confirm unfinished hex travel

Built on the complete local dev.76 package; GitHub `develop` remains at the historical dev.62 checkpoint. Start / Continue now asks the GM to confirm before spending saved unfinished hours, including hours carried into a new travel day. The confirmation shows remaining hex hours, today's available safe hours, and the expected outcome (or Forced March choice). Cancel, Escape or closing the prompt leaves world time, ledger, hour history and saved progress unchanged, and the prompt appears again on the next attempt. On confirmation the unchanged travel-hour and Forced March engine runs, after checking the saved ledger has not changed while the prompt was open. All archived source, migrations, packs, themes, clock accounting, audio and notifications preserved. Local tests are not live V13 or V14 acceptance. No GitHub write.
