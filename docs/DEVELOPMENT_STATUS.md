## 0.4.0-dev.86 | Dashboard label clarification (local build, not live verified)

Source: complete dev.85 manual-install ZIP. Only the two travel-hour tile labels are clarified: TRAVEL TODAY -> TRAVEL HOURS TODAY and HEX REMAINING -> TRAVEL HOURS LEFT. Day and Hexes Complete remain as before. Tile count, progress bars, next actions, stored state, navigation, Forced March, history, themes and all integrations are preserved. No GitHub changes.

---

## 0.4.0-dev.85 | Consolidated dashboard summary

Based on the complete dev.84 manual-install module. The Dashboard overview now displays Day / Travel Today / Hexes Complete / Hex Remaining in four theme-aware tiles (responsive to two columns on narrow widths), with the original two labeled progress bars immediately below and no duplicated text-only hour breakdown. Next-action, daylight and ETA stay intact. When no hex is pending, Hex Remaining displays an em dash. Only Dashboard markup, scoped CSS, version and documentation changed. No mechanics, state schema, world time, historical log, Forced March or other module files modified. Local validation only, Foundry live acceptance pending, no GitHub write.

---

## 0.4.0-dev.84 | Forced March history expansion and compact travel confirmation

Derived from complete local dev.83 manual-install package (not the outdated dev.79 GitHub checkpoint). Small presentation-only changes: resume confirmation condenses summary and reflects Forced March context; Navigation and Travel Time spacing reduced modestly; only the current resolved Forced March hour may auto-expand while the hex has pending travel, previous entries collapse on hour transitions, all collapse when hex completes, and only one manual historical entry can be open at a time. No gameplay, ledger, exhaustion, dice, or persistent history schema changes. Local testing pending; not pushed to GitHub.

---

## 0.4.0-dev.83 | Compact Hex Travel presentation-only test build

Based on the complete 0.4.0-dev.82 ZIP. Reworked only the read-only Hex Travel result renderer and scoped CSS to provide aligned Guide/Vanguard rows, prominent saved total hours, dice faces next to corresponding saved calculation rows, and an expandable original roll detail section. Existing navigation d20/d4 totals, role skills, pace, ledger, GM rulings, Forced March, themes, and saved records are untouched. Local checks only; Foundry V13 live verification pending. GitHub not modified.

---

# 0.4.0-dev.82 | Aligned Navigation travel-report rows (local test build)

Derived directly from the complete dev.81 package, preserving all role assignments, skill checks, dice math, Saved Hex Travel records, GM ruling, time ledger and Forced March. The hex-log renderer now displays Guide and Vanguard in matching compact rows with character identity, evaluated d20 total, DC and status in aligned columns, with a narrow-width fallback. Historical Secondary and older cards remain viewable. The update changes only the runtime presentation code and scoped theme-aware CSS. Browser responsive layout checks passed; live Foundry testing pending. The feature branch still holds the dev.79 checkpoint; this dev.82 package was not committed.

---

# 0.4.0-dev.81 | Cooperative Navigation (local test build)

**Local baseline:** dev.80 complete manual-install module ZIP. **GitHub base checkpoint:** `LuvacZantor/zft-overland-travel`, branch `feature/expedition-system`, commit `c5a487c97e4245ef27fdd57a928be4fc779f20d2` (dev.79). No GitHub writes authorized for dev.81.

Guide Survival and present Vanguard Athletics are requested concurrently and independently adjudicated by GM. Failure of each adds one d4 hour without a fixed bonus; base `ceil(2d4 × pace)` preserved. Navigation results are recorded as structured card metadata; role/event tab placeholders and unrelated engines are unchanged. A missing Vanguard is unassisted, not failed. Unfinished-hex resume uses saved pending hours and does not roll again. Existing records, settings and original Mount Ironrot source preserved. Live Foundry validation pending.

---

# 0.4.0-dev.80 | Tabbed Expedition Log (local test build)

Based on owner-approved dev.79 checkpoint in `feature/expedition-system`. Three Expedition Log tabs: Travel (existing log, default and preserved), Roles (placeholder) and Events (placeholder). Only presentation/navigation and version/testing documentation changed; no new role rolls, changes to skill definitions, event processing, persistence schema, or travel/Forced March mechanics. Local build only; not pushed to GitHub, Foundry V13/V14 live acceptance pending.

---

# 0.4.0-dev.79 | Role-group swap only (local test build)

Derived directly from the complete `0.4.0-dev.77` installable ZIP. Swap Tracker and Vanguard between the paired categories only: Navigation is Guide (WIS Survival) + Vanguard (STR Athletics); Reconnaissance is Scout (DEX Stealth) + Tracker (INT Investigation); Expedition Support remains Forager (WIS Survival) + Coordinator (CHA Persuasion). All six original skill definitions, Actor role IDs, saved assignments, and core travel/Forced March mechanics remain unchanged. No situational-roll workflow is included. GitHub not modified; live acceptance pending.

---

# Development status | ZFT Overland Travel

**Latest local test package:** `0.4.0-dev.67` (uncommitted, derived from local .66; the GitHub `develop` branch remains on .62).

**Local test build:** `0.4.0-dev.43` (feature branch remains `0.4.0-dev.29` on GitHub) (based on `0.4.0-dev.28` on `develop`). This is not a released or live-verified build. Do not merge to `main`, create a release, or claim Foundry V14 compatibility from static/simulated tests alone.

## Architecture and compatibility

- Public module ID: `zft-overland-travel`; user-facing title: **ZFT Overland Travel**. Keep the ID unchanged because installed modules and client settings refer to it.
- Foundry V13 / D&D5e is the currently targeted live environment. **Foundry V14 has not been validated in this project**. The manifest's compatibility metadata is not evidence of runtime verification.
- Requires ZFT Tools `0.1.0-dev.8` for toolbar integration; travel roll workflows use Midi-QOL.
- The reusable expedition framework remains alongside the isolated Mount Ironrot implementation (`src/expeditions/mount-ironrot/`). Do not automatically merge state or mechanics between them.
- The original Mount Ironrot v4.13 source is preserved as `MountIronrotV413.source.js`. The established world ledger key `mountIronrotTravelV45` and user-configured expedition, party, and history must be preserved.
- **New Travel Day does not advance Foundry world time.** Calendaria affects date formatting; previous history is not silently rewritten.

## Current development behavior

- Three independent windows: GM Expedition Controls, Expedition Dashboard, and Expedition Log. Their stacking must yield to Foundry, Midi-QOL, character sheets, and unrelated module dialogs.
- Saved navigator/secondary assignments; party attendance independent of scene token placement; expanded details for current travel results and compact historical entries.
- The log distinguishes the **current hex in progress** from earlier completed travel entries. A completed roll is not automatically equivalent to a completed hex.
- While the GM session is active, a pending player's roll can be resent, handed off to the GM, or canceled. Superseded late socket responses are ignored within that workflow. **A GM client reload does not restore an in-memory pending request.**
- Five client-specific interface palettes, with 22 individual color fields. The editor opens from the **Dashboard only**, in a separately movable window. See [THEMES.md](THEMES.md).

## Acceptance checklist for live Foundry V13 testing

1. Install alongside ZFT Tools `0.1.0-dev.8`. Confirm the Foundry Module Management title, version and single-line row layout; recheck the previously reported name-wrap issue.
2. With three windows open, open a character sheet, Journal, Foundry DialogV2, legacy dialog, and a Midi-QOL player prompt. Each must appear in front and remain clickable; the map outside the three panes must stay usable.
3. Open the Dashboard palette icon. Confirm there is **no duplicate icon on the Log**. Verify the theme window can move, resize, and display multi-column colors on desktop; recheck a narrow client.
4. On separate GM and player clients, select all five presets; modify individual colors using both picker and `#RRGGBB`; Save and reload; Cancel/Escape and close the Dashboard without saving; confirm previews roll back and one client's colors do not change the other's.
5. Open a new expedition: Day 1 and empty current-day log should be concise, and it must not misleadingly call subsequent-day results the party's *first travel*. Complete a travel attempt, review current-hex state, add another day, and confirm correct current/historical labeling.
6. Test a disconnected player during a skill check and a Forced March CON save. Resend once, verify replacement attempt, then test Roll as GM and Cancel Request. Ensure no duplicate hex hours, ledger entry, or accepted roll.
7. Confirm party roles and saved progress survive browser reload; Cancel followed by Start/Continue must remain usable. Verify calendar year formatting but **no world-clock advancement**.
8. Verify the original v4.13 travel computations, dice presentation, exhaustions/forced march adjudication, and Action HUD still function.

All above are **live acceptance tests pending**, not claims of live success. Developer-provided local syntax and Chromium simulations were run on preceding test builds and are recorded in `INTEGRATION_TEST_NOTES.md` for context.

## Current known constraints

- A player disconnect can leave an outstanding socket response unresolved; the active GM can invoke roll-recovery controls. GM reload recovery is not implemented.
- Some historic travel-card HTML contains inline legacy colors, so not every older visual fragment follows every custom color override.
- Previously saved default/explicit log heights may affect window size. User manual sizing takes precedence; confirm this in live GM and player sessions.
- The legacy generic framework's Discovery and Complication content and some event-shift specifications are incomplete; this dev checkpoint does **not** invent missing rules.
- Mount Ironrot is a candidate foundation for future general-purpose expedition profiles, but no architectural refactor is approved or included in this checkpoint.

## Development and promotion

Work on `develop`, use the module ID as the ZIP root directory, bump `module.json` and the ZIP name together for future builds, and test live before any promotion. `main`, tags, and published Releases require separate owner authorization under the policy in the private `zft-standards` repository.

## Expedition roles redesign (feature branch; Foundry validation pending)

The GM's **Expedition Roles** editor replaces the Party Roles assignment panel. The player/GM party roster displays the assigned role and skill bonus, including offline PCs assigned to a user character. The editor groups six distinct roles into three cooperative travel activities:

| Activity | Roles and primary checks |
| --- | --- |
| Navigation | Guide (WIS Survival), Tracker (INT Investigation) |
| Reconnaissance | Scout (DEX Stealth), Vanguard (STR Athletics) |
| Expedition Support | Forager (WIS Survival), Coordinator (CHA Persuasion) |

A character may only be assigned one expedition role/check in each travel resolution. Unfilled roles are allowed except Guide, which is required for the existing hex navigation workflow. On future cooperative roll integration: 2 successes = strong, 1 = partial, 0 = failed; these paired outcomes are **not implemented yet**. The current hex engine still uses its established Guide/Navigator roll and may retain a previous legacy secondary assignment when that character remains assigned; other new roles currently display as assignments without automatically rolling. Existing saved navigator/secondary settings are read for display migration without rewriting travel history. The established hex duration, dice, calendar, forced march and Constitution saving throws are unchanged. Run a live Foundry V13 GM/player check before promoting or claiming compatibility.


## Local 0.4.0-dev.30 test package (not yet committed)

- Expedition role dropdowns now prevent choosing the same character for two roles and repair duplicate initial selections in the editor. Save validation remains in place.
- Test by assigning a character as Guide, opening the Tracker dropdown (Guide must be unavailable), changing and clearing assignments, reloading the editor, and verifying the existing travel/CON behavior.
- Not live Foundry-verified or pushed to GitHub.

## Local 0.4.0-dev.34 test package (not committed)

Start/Continue uses saved Guide and shows grouped Expedition Roles instead of old Navigator/Secondary selectors. Legacy secondary skill roll is bypassed, while Guide navigation/duration and CON forced march are retained. Remaining cooperative rolls require implementation. Not yet Foundry-tested.

## Local dev.32 roster usability additions

- "Present Party" panel renamed to "Expedition Roster" for GM and player clients.
- Each assigned expedition role displays the shared role description and primary skill in a hover/focus tooltip.
- GM right-click on an Expedition Roster character opens a context menu setting the actor's real D&D5e exhaustion level (0–6); the current level is marked. No historical rolls or travel hours change.
- Exhaustion penalties appear directly below nonzero exhaustion levels, using the 2024 rule by default or an explicitly configured legacy 2014 rules-version setting where available. Verify the target world's D&D5e exhaustion rules before accepting this display as authoritative.
- Actor update hook refreshes the roster for connected GM and player clients.
- Static checks only; Foundry V13 player/GM validation still required. This build is **local only** pending separately scoped GitHub write approval.

### Local 0.4.0-dev.34 regression repair

Restores dashboard/log rendering by implementing the missing exhaustion-menu cleanup method. Completes the planned GM roster context menu, exhaustion penalty labels and role hover descriptions. This build requires live Foundry V13 validation.

### Local 0.4.0-dev.36 acceptance focus (not committed)

- Verify Expedition Roles opens independently of GM Controls, all six controls are visible on a 1080p display, and smaller viewports scroll only inside the pop-out where unavoidable.
- Verify unassigned and assigned options, save/cancel, and player roster updates.
- Check right-aligned exhaustion penalties, with correct value shown in the menu and both dashboards after GM corrections (e.g., 4 → 2 → 0). Test rapid repeated actions while one update is pending.
- Check Roles Reference shaded panels and drag handling. No changes to duration/CON mechanics.

## Local test build 0.4.0-dev.38 (not committed to GitHub)

Restores the Expedition Roles editor directly beneath the GM Controls buttons, retains two-column grouped assignments with role/skill/dropdown on separate lines and single-character uniqueness validation. Keeps the separate Roles Reference help window. Adds status-based dashboard colors for safe hours, travel limits, forced travel, current hex progress, and next Forced March warnings. Aligns roster exhaustion data on the right edge. The exhaustion setter delegates creation and removal of condition effects to D&D5e and no longer deliberately creates a fixed-ID exhaustion effect; it confirms the stored actor level before reporting success. Duplicate-effect errors observed via the Change Log module may still require diagnosing the third-party hook. No hex duration or Forced March mechanics are changed. Foundry V13 live validation pending.

## Local test build 0.4.0-dev.39 (not committed to GitHub)

Hours Today stat card gains themed amber/red shading for the daily safe limit and Forced March. Failed save rulings now default to Apply +1 Exhaustion (manual GM processing remains mandatory), preserving previously saved GM choices. Forced March adjudication footer uses two-line equal-width action buttons. Hex duration and existing saving throw DCs are unchanged. Validate GM override, rerolls, pause/resume and narrow-window display in live Foundry V13.


## v0.4.0-dev.40 | Expedition Log hierarchy and simplified Forced March choice

- Completed/earlier days remain in a single saved timeline, but render as visibly distinct containers. The current day owns its pending Forced March briefing, saving-throw results, hex history and completed march events; no duplicated standalone active briefing above the day heading.
- Completed hex and Forced March entries render as compact summaries with read-only expandable details. Earlier days remain collapsed by default. User expansion/collapse overrides and log dragging/docking/manual resizing are preserved.
- Pending GM action uses an amber-accented inset card; navigation/current hex uses a blue edge, successful Forced March a green edge, and failed navigation a red edge. Theme variables are retained, no existing world records rewritten.
- The pre-hour Forced March prompt offers only Continue Hour and Pause / Exit on one row. New Travel Day still lives in GM Expedition Controls; Pause retains unfinished hours and the current day. The former Stop & Carry choice is no longer presented, but its old saved phase remains recognized for legacy data.
- No changes to roll formulas, travel dice, hex timing, exhaustion, or world clock. Foundry V13 GM/player verification remains pending.


## v0.4.0-dev.41 | Hex-centered Expedition Log, linked Forced March history

- New Forced March history stores the `activeHexCardId` as `hexId` on each result record, using the existing stable visual hex card identifier. Unfinished hexes retain that identifier across paused travel and New Travel Day, including multi-day travel. Completion clears the active pointer without changing time, dice or rolls.
- The Expedition Log displays Day → Hex → linked travel events. Navigation and dice live under an expandable subheading; completed Forced March checks live inside their hex, with original actor results still expandable. Current active hexes include progress and GM pending checks when explicitly linked.
- When the same hex spans multiple days, each day's view shows a linked day segment rather than falsifying additional hex completions. Existing history with no valid link is preserved in a labeled day-level historical section instead of being assigned by timestamp assumptions.
- Day and hex expansion overrides, dock, manual resize and player/GM display remain. Saved hex HTML, prior march results, calendar and the original v4.13 source file are unchanged. Live Foundry V13 validation still needed.


## v0.4.0-dev.42 | Persisted active-hex identity restored on ledger load

- Corrects a v0.4.0-dev.41 bug: `loadState()` discarded `activeHexCardId` despite the world ledger saving it when each hex started. After Pause / Exit or New Travel Day, later Forced March results could no longer link to the current hex. The reader now preserves a stored nonempty ID and passes it through all subsequent state writes.
- Preserves exact `hexId` association from GM adjudication through Force March history, hex completion, and future Log renders. Pending Forced March panels can now reliably nest under the ongoing hex after resuming.
- Records from v0.4.0-dev.41 or earlier that never saved a `hexId` remain in the explicitly unlinked historical section. Do not guess their owning hex by date, hour, or relative position. No automatic migration or rewrite of past rolls.
- No changes to travel dice, navigation outcomes, Forced March rules, Exhaustion, attendance, clock, saved hex cards, or immutable v4.13 source. Foundry V13 live GM/player test required.


## v0.4.0-dev.43 | Latest hex expansion and individual roster checks

- The latest active **or completed** hex on the current day is initially expanded. On rolling, finishing a hex, or saving a linked Forced March, new event revisions reopen the latest hex; a manual collapse remains respected across unrelated snapshot refreshes.
- The current day's log group no longer collapses merely because travel is stopped or paused; a deliberate user toggle remains preserved.
- Reaffirm Day → Hex → Events: navigation/travel dice remain in their own expandable panel and linked Forced March checks are separated within the hex. The currently unfinished hex is included on its next travel day when it has a recorded ID. Older entries with no recorded hex association remain explicitly unlinked.
- Expedition Roster always places the assigned skill and the CON saving throw on individual lines, while the right-aligned exhaustion column is unchanged.
- No hex-travel, exhaustion, forced-march, actor-update, calendar, or saved-world-ledger mechanics were changed. Original v4.13 source remains immutable. Local/simulated verification only; live Foundry V13 validation pending.


## v0.4.0-dev.44 | Nested navigation-result auto expansion

- Fixed the second-level `Navigation & travel dice` `<details>` inside the current/latest hex. The latest active hex now displays the navigation result immediately upon roll, even before the GM confirms it and travel dice have been rolled. A completed latest hex shows the fully expanded travel calculation by default.
- A new recorded event revision in the same latest hex now clears both the parent hex's manual collapse override and the nested navigation/dice override. Ordinary refreshes, roster/exhaustion updates, and presentation-only changes respect both manual toggles.
- Previous hexes remain collapsed by default; manually expanded historical hexes remain untouched.
- No modifications to navigation calculation, dice, travel hours, Forced March, calendar, active exhaustion, or saved world ledger. The original v4.13 source is unchanged. Requires live Foundry V13 verification.


## v0.4.0-dev.45 | Compact log and Forced March decision

- Replaced the latest hex's large always-visible nested travel record with two scan-friendly navigation and travel-dice summary rows. The hex remains expanded when new results arrive. Original full navigation checks, dice faces, modifiers, pace and travel duration remain available via a secondary manual disclosure. Saved card HTML and the travel state are unchanged.
- Simplified the live Forced March briefing into a compact hour/status line and stat summary, retaining GM-review outcome details. Historical check details remain expandable.
- Simplified the GM pre-hour Forced March prompt to two stat/context lines and its original Continue and Pause/Exit decisions; removed repeated day-start instructions.
- Refined theme-aware spacing, color indicators and small-window wrapping, without changing the pane width, saved log records, hex math, Constitution saves or original v4.13 source.
- Local build and simulation only; Foundry V13 live verification pending.


## v0.4.0-dev.46 | Two-column hex results

- Replaced v0.4.0-dev.45’s compact result rows and nested Full Breakdown disclosure with a single, always-visible two-column hex result inside the latest automatically expanded hex. The left shows Guide metadata, actor, original d20 roll versus DC and the success/failure ruling. The right shows pace, original graphical d4 results, base/adjusted hours, and any navigation delay. Total Hours remains full width below.
- Kept existing saved rendered roll HTML, dice graphics/size, Forced March prompt, roll and exhaustion mechanics, theme palette variables, historical grouping, and window width. Older/unrecognized markup retains a full original-HTML fallback. No automatic calendar movement.
- Local validation only. Foundry V13 live testing required before acceptance. No GitHub changes.

## v0.4.0-dev.47 | Balanced hex result grid and navigation d20

- Kept the established two upper panels but moved saved Base 2d4, pace-adjusted hours and optional navigation delay into a separate bottom-left Travel Hours card. The right card still highlights TOTAL · ONE HEX; the top right now concentrates on the original travel die faces and pace.
- Enlarged the existing d20 check-total icon to match the d4 artwork dimensions, with the modified numeric total alongside it (never misrepresented as a natural d20 face). Preserved Guide, DC, success/failure, overrides, legacy secondary result, theme vars, and pending stages.
- No changes to travel mechanics, durations, Foundry world time, history persistence, or the original v4.13 source. Live Foundry V13 testing pending. GitHub unchanged.

## v0.4.0-dev.48 | Navigation d20 overlay and theme-consistent Log

- Changed only the hex Log's display styling and a presentation-only class for completed hexes. The existing modified d20 check total now overlays the red die graphic without converting it to a natural die-face result.
- Unified Navigation, Travel Dice, and Travel Hours panel surfaces and borders around existing per-client ThemeManager fields. Total hours retains a subdued accent based on the active theme. All five presets and 22 custom overrides remain authoritative.
- Collapsed completed hexes are visually muted until expanded; active and expanded hexes retain their existing emphasis. No change to expansion-state persistence, navigation or travel mechanics, actor effects, world clock, historical records, or v4.13 source.
- Local tests only; Foundry V13 verification still pending. GitHub unchanged.

## v0.4.0-dev.49 | Cohesive hex result and common Forced March event structure

- Replaced four equal-looking result cards with one theme-aware travel report. Navigation and original graphical dice are adjacent, with calculation detail and prominent total separated by a single footer rule. Original stored dice and travel result HTML is preserved.
- Both pending and completed Forced March checks use consistent title/icon/status/metadata rows. Removed redundant pending-section header; the GM interaction and saved roll history are unaffected.
- No changes to underlying travel/Forced March/exhaustion mechanics, source v4.13, calendar, ledger keys, or actor updates. Historical records preserved. Local validation only; live Foundry V13 test remains pending. GitHub not modified.

## v0.4.0-dev.50 | Expedition Log readability and grouping

- Navigation and Travel Dice are now independent full-width rows within one themed report, while travel calculation and total remain side by side. Dice graphics and saved roll markup are unchanged.
- Current and completed Forced March entries share one **Forced March checks** heading inside their associated hex. Existing recorded/legacy events remain unchanged.
- Hex headers display their creation-order number, and day summaries distinguish completed from in-progress hexes, with separate Forced March counts. No saved-state migration or travel mechanical change.
- Foundry V13 live verification remains pending; local browser and source checks only. GitHub remains unchanged.

## v0.4.0-dev.51 | Client interface ergonomics

- Expedition Roster can collapse, preserving the independent Roles reference action and remembering a per-client preference in the existing UI setting.
- Completed Forced March character results use aligned die, total, and Passed/Failed columns with original save totals and outcomes intact.
- A client-specific 80–120% slider scales the ZFT dashboard, GM controls, log and module-owned auxiliary interfaces, independently from themes. Legacy 100% presentation remains the default.
- Forced March placement and expedition mechanics unchanged. Live Foundry validation pending; GitHub unchanged.


## 0.4.0-dev.52 local test build
Proportional top-left window scaling and scale-aware redocking; standalone roster toggle below original header; compact GM action/decision controls. No travel rules or world ledger changes. Live V13 tests pending.


## 0.4.0-dev.53 local test build
Replaced continuous slider with exact numeric scale entry (Apply/Enter), immediately applying ±1/5/10 controls, and Reset. Expanded/collapsed roster uses icon-only double chevrons beside the Roles button in the unchanged header. Per-client scale/roster state, scaled docking, themes, travel mechanics and world history retained. Live Foundry V13 testing pending.


## 0.4.0-dev.54 local test build
Expanded per-client interface scaling to 60%–150%. Replaced repetitive pending roll request cards with a compact shared heading and per-character icon actions; all original Resend, Roll as GM, and Cancel logic retained. Consolidated forced march GM adjudication into a compact selectable party table; selections, saved rerolls, partial progress and application mechanics are unchanged. Redesigned Expedition Roster alignment, hierarchy and spacing, preserving separate skill and CON save lines and right-aligned exhaustion. Aligned live Forced March saves with archived completed check results before and after GM approval. Five theme presets/custom colors preserved. Live Foundry V13/V14 verification pending. GitHub unchanged.


## 0.4.0-dev.55 local test build

- Enlarged Expedition Roster portraits to 58px inside existing card heights; restored compact alignment and portrait square aspect ratios.
- Added a compact, tooltipped Pending Rolls icon legend. Per-character recovery actions unchanged.
- Theme-aware semantic color for forced march name/result, current or projected exhaustion, and GM selection. Review selection changes preview exhaustion/color only; no change to actor until approved.
- Replaced scale numeric input and six +/- buttons with a client-specific 1/5/10 increment chooser, two immediate +/- actions, live scale percentage, and Reset. 60%-150% limits and upper-left docking retained.
- Active hex summary now derives next/awaited action from current published phase and staged roll status; underlying snapshots and travel mechanics unchanged.
- Local validation only; live Foundry V13/V14 verification pending, GitHub unchanged.


## v0.4.0-dev.56 local development checkpoint

Dashboard redundancy cleanup; separate fixed-size Interface Scale window; compact current-hex status header; and more space-efficient roster. No ledger, Forced March, actor data, v4.13 calculation or timing changes. Local browser and syntax validation pending completion; Foundry V13 live acceptance not yet confirmed. GitHub not changed by this local packaging step.


## v0.4.0-dev.57 local checkpoint

Top/right roster exhaustion alignment and persistent explicit travel-day markers in the world-side Expedition Log visibility setting. Active travel, rolls, travel computations, exhaustion mechanics, calendar advancement policy and v4.13 source are unchanged. Live Foundry V13 verification pending. No GitHub writes.


## Local checkpoint 0.4.0-dev.58 (not promoted)
Legacy Hex Travel setup/Navigation Ruling styling modernized with ZFT theme variables; completed travel roll publishing waits for the Dice So Nice animation; live Forced March decision duplicate removed; latest processed Forced March expands until Continue/Pause. No underlying Mount Ironrot v4.13 source changes. Local checks are not live Foundry validation.


### 0.4.0-dev.59 (local test package; not live-verified)
- Consistent semantic success/failure/pending presentation in Navigation Ruling, hex Log, and pending/completed Forced March results, preserving original roll vs GM adjudication.
- Hex Travel role pairs have portraits and theme-tinted grouping; all five presets and custom overrides require live client verification. No remote GitHub promotion.
- Generic role-check tally and recovery result messages are color-labeled without altering their data or rolls.


## 0.4.0-dev.62 | Native exhaustion synchronization (local test build)

- Source is the complete, locally validated `0.4.0-dev.61` ZIP; GitHub `develop` retains `0.4.0-dev.59` and is not altered.
- Confirmed in D&D5e 5.2.5 source: Actor update calls `_onUpdateExhaustion` without awaiting it. Native effect creation and deletion can finish after `actor.update` resolves.
- The roster now waits for the actual native effect and the derived Actor exhaustion level for both increases and resets. It never directly creates, updates, or deletes native exhaustion effects, and it does not repeatedly call `Actor.update`.
- Corrects the live `0 -> 2` failure reported for Ayurak Athak Akyldav in dev.61 and preserves truthful failure reporting when native synchronization fails.
- Exhaustion checks: `0 -> 2`, `2 -> 0`, `1 -> 3`, unchanged level, rejected update, delayed effect, timeout, non-GM authorization. Simulations are not live Foundry verification.
- No change to role layout, Guide rolls, travel calculations, Forced March mechanics, history, world clock, compendium assets, themes or the original Mount Ironrot v4.13 source.
- **Live acceptance pending** on Foundry V13.351 / D&D5e 5.2.5: test both directions from the GM roster and a Forced March exhaustion application; verify character sheet/effect/roster consistency without console warnings.
- No GitHub writes, tags, merges or releases.


## 0.4.0-dev.63 | Generic Hex Travel Engine development test

- Local test based on develop commit 8848a78ca4bb0cf3e5fd024fe0c3f809e8a8a4c9. No GitHub writes.
- New runtime namespace and file names remove Ironrot-specific labels from working code. Archived MountIronrotV413.source.js retained verbatim.
- Historical world settings and per-client interface preferences are copied to new keys when saved values exist; legacy values remain for rollback. Existing visible saved log markup is converted within migrated copies.
- GM now explicitly chooses Custom DC 1–30 (default 15) or Terrain + Region Danger, with dynamic preview, before starting a new hex. DC is used for roll requests, outcome comparison, GM ruling and saved log metadata. Forced March DC remains 10 plus hours past eight.
- Design work on other six paired roles, Momentum, encounters, Discovery and Threat remains pending, with no implicit automation.
- Needs live Foundry V13 regression testing for migration, rolls, Force March and multi-client behavior. Verified V14 compatibility has been removed from the manifest pending actual tests.

## 0.4.0-dev.64 | Migration startup fix

- Owner live test of dev.63 (2026-10-28): startup stopped with `[ZFT][HexTravel] World/client settings migration failed; workspace not initialized.` The raw exception was not expanded in the shared log.
- Reproduction: `hasSavedValue` incorrectly called `.get` on client settings storage. Foundry V13 client storage uses `.getItem`, not the world Setting collection interface.
- Correct per-scope saved-setting detection, preserve world-state fail-closed behavior, and treat client preference storage problems as non-fatal with actionable warning.
- No migration key deletion; the migration remains idempotent and can complete after a partially failed .63 run. The existing .62 source and package remain the rollback point.
- Local tests required on a realistic world Collection and browser-style client Storage, including repeated GM/player startup and failure recovery. Live GM and player client verification still pending; no GitHub write.

## 0.4.0-dev.65 | Presentation/toggle acceptance candidate

- Derived from uncommitted dev.64 local ZIP. Source of truth for committed baseline remains develop 8848a78ca4bb0cf3e5fd024fe0c3f809e8a8a4c9 (.62).
- GM Start / Continue and New Travel Day actions now close only their own unfinished initial dialogs when pressed a second time. No cancel of already-submitted adjudications, live Guide/Midi-QOL rolls or Forced March; no world-state mutation on toggle.
- Difficulty method uses two accessible radio segments instead of a Method select. Terrain and Region Danger are paired, and DC result is visually prominent. The redundant One Hex eyebrow and nested difficulty border were removed. Existing selected method, custom/terrain inputs, validations, DC calculations, per-hex metadata and logging are unchanged.
- Preserve all existing settings/migration keys, themes, source v4.13, world ledger, pending roll recovery and compendium assets. Live GM/player testing remains necessary.


## 0.4.0-dev.66 local development (not committed)

- Based on the locally packaged and owner-tested 0.4.0-dev.65 ZIP. GM Hex Travel setup saves both difficulty methods' last selections as hidden client preferences, restoring on reopen/refresh. These preferences do not mutate the ledger or historical per-hex DCs.
- Dashboard retains current hex progress and now also explicitly displays Hex time remaining separately from safe hours. Expedition Log removes redundant live progress bar and "h left" header while preserving current/finished state, navigation checks, and archived results.
- Canceling New Travel Day quietly returns without state changes. Other confirmations, safety warnings, and server actions are preserved.
- Preserve migration, source, compendium bytes and travel calculations. Requires live V13 GM/player testing; no GitHub writes.


## 0.4.0-dev.67 local, uncommitted

- Starting source: 0.4.0-dev.66 complete ZIP (based on accepted GitHub dev.62 checkpoint).
- New Travel Day is compact and retains prior travel-day, pending-hour, and cancel behavior. Separate optional world-time jump occurs **before** Rest Recovery is launched; no time moves on cancel or without explicit selection. Sunrise/sunset come from the active Calendaria season/scene values.
- Native `game.restrecovery.renderPromptRestInterface()` is used only when `rest-recovery` is active, as an optional recommended module. GM must actually perform the Long Rest in that interface. ZFT does not control completion or imply healing has occurred just because the interface opened.
- Rest Recovery may itself advance Foundry world time when GM initiates a Long Rest. Do not add duration in ZFT. Record new expedition day date on subsequent travel instead of freezing the bedtime date.
- No hex-completion time advancement (future development). V13 and V14 integrations require live acceptance. No GitHub writes.


## 0.4.0-dev.68 local development (not committed)

- Starting source: complete locally generated `0.4.0-dev.67` ZIP based on GitHub `develop` checkpoint `8848a78ca4bb0cf3e5fd024fe0c3f809e8a8a4c9` (`0.4.0-dev.62`). GitHub is unchanged.
- A new GM world setting `hexTravelAdvanceWorldTime` (default **false**) optionally advances game world time at each committed travel-hour batch: safe travel is committed as a batch; Forced March increments one hour only after saved CON adjudication. Partial hexes, day boundaries and resumes do not replay previously counted hours.
- The stored `hexTravelLedger.clockSyncPending` checkpoint protects against double advances on refresh/errors. When pending, the GM must explicitly reconcile the world clock before more travel or new-day operations; the module must not automatically retry. An explicit destructive Reset remains available. If history has been committed, a failed clock update does not clear the associated hex card.
- The Rest Recovery checkbox is displayed in a fixed 18px grid column, with native Foundry checkbox sizing/position overrides. The integration continues to delegate all Long Rest behavior to Rest Recovery; ZFT never adds rest duration.
- V13.351 / D&D5e 5.2.5 and V14 / D&D5e 6.x require live independent verification.


## 0.4.0-dev.69 local test handoff (uncommitted)

- Source base: complete dev.68 ZIP, itself derived from the GitHub `develop` dev.62 checkpoint `8848a78ca4bb0cf3e5fd024fe0c3f809e8a8a4c9`. Do not mistake this for an updated remote branch.
- Compact pre-Pace navigation/clock UI, Rest Recovery checkbox geometry fix, GM-client New Travel Day preference persistence.
- New client key `hexTravelNewDayPreferences` stores only GUI choices, not world time, actors or travel outcomes. The existing `hexTravelAdvanceWorldTime` world setting remains authoritative.
- Preserve no-rest operation, canceled day behavior, Calendaria and Rest Recovery contracts, migration, world ledger, legacy source and compendium bytes.
- Test on Foundry V13.351 / D&D5e 5.2.5 with GM and player clients, and independently on V14 before claiming compatibility.


## Local dev.70 (not committed to GitHub)

- Adds read-only live calendar/date display in the expedition identity header and lightweight `updateWorldTime` label refresh.
- Adds conditional sunset/sunrise advisory and hex ETA when a saved current hex has remaining hours. No autonomous night travel behavior or changes to travel hours.
- Source baseline is the complete locally-tested dev.69 ZIP; upstream `develop` stays on dev.62 until separately approved.
- Night-travel mechanics, rich history timestamps, explicit manual-clock reconciliation, and Rest Recovery completion audit remain future design items, not shipped behavior.


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

## Local test build 0.4.0-dev.74 | Date continuity and click-to-dismiss completion

Source baseline: complete local dev.73 ZIP (not GitHub's historical develop/dev.62).

- Completed-hex confirmation responds to click and keyboard dismissal; otherwise auto-dismisses after 10 seconds, with the existing Cinematics-inspired dissolve and reduced-motion support.
- Freezes a departing travel day's calendar label before an optional bedtime time jump, even with zero activity; current days awaiting rest derive their date from the active world clock, updated with native and Calendaria time hooks. Do not re-date older records.
- Explicit New Travel Day hours reset and carried-hex wording, with separately highlighted next-calendar-day preview note.
- No automatic completion/rest decisions, no new settings, no state-migration operation, and no changes to time accounting.
- Retest with GM/players and active Calendaria/Rest Recovery, especially a Long Rest spanning midnight, then another empty day. Not V14 live verified.

## Local test build 0.4.0-dev.75 | Multi-client completion confirmations

Built on the full local dev.74 package (not the older GitHub dev.62 checkpoint). After the final travel-hour checkpoint, a GM-only world-setting event announces each completed hex to connected clients. The GM client retains dismissal-required, queued notifications across refresh via a local client setting; players see a dismissible, 10-second announcement and do not replay historical events on joining. The original transition styling, sound defaults, travel state, packs, and migrations are preserved. Requires live V13 GM/player verification. No GitHub writes.

## Local test build 0.4.0-dev.76 | Completion notice without redundant close button

Based on complete local dev.75 ZIP, not historical GitHub dev.62. Removed only the redundant X button and its CSS spacing. Both GM and player notices dismiss by click anywhere or keyboard Enter/Space/Escape. GM notices do not time out; player notices retain ten-second auto-dismiss. World event broadcasts and queued client acknowledgements unchanged. No travel, date, roll, or saved-state changes. Live V13 GM/player acceptance pending. No GitHub writes.

## Local test build 0.4.0-dev.77 | Explicit unfinished-hex confirmation

Built on complete local dev.76 ZIP, not GitHub `develop` dev.62. Start / Continue with a pending hex prompts before applying safe travel hours or invoking Forced March. Clear remaining/safe-hour figures and contextual outcome; Cancel preserves pending hex, ledger, calendar and existing history, and the same prompt reappears next time. Confirmation checks the saved ledger did not change while open, then uses the existing travel-hour/clock checkpoints. No changes to the actual travel/clock arithmetic, prior compendiums, original source, audio or completed-hex notifications. Live V13.351 / D&D5e 5.2.5 GM/player check required; V14 remains unverified. No GitHub writes.
