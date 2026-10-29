# ZFT Overland Travel

Current local test package: `0.4.0-dev.79` for Foundry V13 (live validation pending). The Foundry module ID remains `zft-overland-travel`.

Foundry VTT module implementing Zantor's hex-based overland travel and independent encounter-generation framework.

## Version

Current module build: **`0.4.0-dev.79`** (development only). The original generic framework was developed as `0.3.1`; its earlier notes remain below for historical context.

## 0.4.0-dev.79 | Role-pair grouping correction

Only Vanguard and Tracker have exchanged activity groups. Vanguard remains STR (Athletics), Tracker remains INT (Investigation), and the other four roles retain their original fixed checks. The existing Guide navigation roll, hex duration, travel log, and Forced March rules are unchanged. No new situational roll dialog, variable skill choices, or automatic cooperative checks are added.

## Expedition roles (feature branch)

The GM **Expedition Roles** panel groups six role assignments into three paired activities: Navigation (Guide + Vanguard), Reconnaissance (Scout + Tracker), and Expedition Support (Forager + Coordinator). Each actor may hold at most one expedition assignment. Their assignments appear in the GM/player Present Party roster. The cooperative resolution rules (both succeed = strong; one = partial; neither = failed) are documented design and are **not yet executed by the existing hex roll workflow**. Existing navigation, duration, forced march and Constitution calculations are unchanged. Live Foundry V13 verification remains pending.

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

## Installation note

The module folder name must be exactly `zft-overland-travel`. That must match the module `id` in `module.json`.

**Do not install the unmodified GitHub branch source ZIP as a Foundry module.** GitHub names its extracted top-level folder after the repository and branch. For a packaged module ZIP, the archive must contain `zft-overland-travel/module.json` at its root, not `zft-overland-travel-feature-overland-framework/module.json`.

## Development

The repository follows the authoritative ZFT development and release policy in `zft-standards`. The **`develop` branch** holds the latest in-progress module source; `main` remains the accepted/stable branch and must not receive this dev build without separate approval.

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
