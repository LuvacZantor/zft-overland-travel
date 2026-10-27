# Zantor's Overland Travel

Foundry VTT module implementing Zantor's hex-based overland travel and independent encounter-generation framework.

## Version

`0.3.1` alpha foundation.

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

## Development

The repository follows ZFT semantic versioning and logging conventions. `main` remains the stable branch; major work should be developed and tested in feature branches before merging.


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
