# ZFT Overland Travel | Development Test Notes

## v0.4.0-dev.24 | Current-day result and new-day wording (development)

Status: Local source/syntax and targeted in-memory regression checks only. Live Foundry V13 GM/player verification remains required.

1. Record one completed hex on Day 1. The Day 1 group and its newest completed event should both be expanded on first display, exposing the travel dice, navigator check, and result detail without a second click.
2. Collapse that event manually. Make another UI update (such as changing role preferences); the manually collapsed event must stay closed. A newly completed event should open automatically while earlier entries remain compact unless explicitly expanded.
3. Start a new day after previously recording travel. The current day's empty log message must say **No travel activity recorded for this day yet.** It must never call this the first travel result or imply this expedition has just begun.
4. This update must **not** advance or otherwise change Foundry's world clock. A day number can advance while its displayed calendar date remains the same; those are distinct settings.
5. Previous-day entries, GM roll decisions, player client visibility, persisted travel state, and all Mount Ironrot travel calculations are unchanged.

Status: Historical test notes; see latest build section below. **NOT live Foundry V13 verified.**

## v0.4.0-dev.23 | Compact UI and log height (development)

Status: JavaScript/JSON checked and Chromium-based in-memory UI tests passed. **Not live Foundry V13 tested.**

1. Fresh or reset Day 1 expedition, no events: log should occupy roughly 250px of height (depending on font/zoom), not 650px, and should display a short empty-state message.
2. Add hex and forced-march history: log grows up to the available screen height, then scrolls; dates appear once per day and current day remains at the top.
3. All completed hex and forced-march events start compact. Expand one to inspect full persisted dice/result HTML, then collapse it. Expansion should resize the log if it has space.
4. Use the log resize grip to set a manual height; refresh the module and browser. The manually selected height remains, regardless of the quantity of log entries. Dock and undock, move the log, then verify both placement and sizing survive reload.
5. With multiple Foundry windows, character sheets, Action HUD and Midi-QOL saving throws, confirm dialogs appear in front of the expedition panes and are clickable. No Foundry/Action HUD global stacking rules were changed in this build.
6. Review all GM and player text, button priority, portraits, and exhaustion labels for legibility at your actual Foundry resolution. GM controls and inline forms must remain auto-height and scroll when space runs out.
7. Check the Foundry V13 Module Management entry for `ZFT Overland Travel` with other installed modules enabled. The CSS row fix is specifically scoped to package ID selectors, and **cannot be guaranteed without a live V13 DOM check**. Please report if the title still wraps or any module-list behavior changes.
8. Perform one navigation check, second activity and forced-march sequence, cancel/retry, and day rollover to verify unchanged travel logic; existing ledger/history/actor Exhaustion must not reset.

Known: A legacy 650px saved height cannot be distinguished from a deliberate previous resize to exactly 650px. Such settings switch to auto height in dev.23 unless the user resizes the log again. No `mountIronrotTravelV45` state migration is performed.


## Scope since dev.8
- Reuse Combat Log's exact ZFT dice palette and its *installed D&D5e system* SVG artwork via CSS masks. Combat Log has no bundled dice SVGs to copy; only `no-type.svg` is module-owned (and unrelated). D&D5e files remain owned by the installed game system and are not redistributed.
- Render the actual 2d4 travel and optional 1d4 navigation-delay dice using d4 silhouettes with overlaid rolled face values. Not generic squares. Results, totals, game rules, state, and Dice So Nice behavior remain unchanged.
- Give navigation checks, secondary skill totals, and expedition forced-march save results d20 icons, using the same Combat Log red d20 color. The displayed number is the **modified check total**, not the natural face.
- Previously saved hex cards with the original square-faced d4 spans are decorated when displayed, without rewriting saved world-setting HTML. New cards use the renderer directly.
- The Present Party portrait opens the assigned Actor sheet on double click (or Enter/Space when focused), provided the current user can view the sheet. No token required.
- Original v4.13 standalone source is unchanged. Generic Overland Travel engine and other ZFT modules unchanged.

## Live test plan
1. Load as GM: verify d4-shaped colorful dice faces in a successful 2d4 roll. Force a navigation failure and verify 2d4 plus a visually identical d4 delay in the same result card; all three still report actual rolled values.
2. Verify d20 symbol/color next to navigation, secondary activity, forced march (pending/completed) results. Check that a modified total over 20 is still labeled and not misrepresented as the natural die face.
3. Reload client with existing dev.8 hex card and verify prior square chips now show the d4 silhouette without modifying the persisted result text.
4. Test the portrait double-click in GM and player view, including permissions and a character with no token on the scene.
5. Confirm log window docking and scroll position, clear log, role preferences, ledger, forced march, player updates, and reset remain unchanged.
6. Verify the installed D&D5e game system exposes `systems/dnd5e/icons/svg/dice/d4.svg` and `d20.svg` as used by Combat Log. Check CSS rendering in the actual V13 browser.

No GitHub operations performed.

# ZFT Overland Travel v0.4.0-dev.8 | Development Test Notes

Status: Local static and state-regression checks only. **NOT live Foundry V13 verified**.

## Changes since v0.4.0-dev.7

- Expedition Dashboard remains its own fixed-width GM/player window. A second, independent Expedition Log window docks immediately to its right. Drag the log header to undock; use Dock to redock. The log resizes from its corner and remembers client-local dimensions and position.
- The dashboard header toggles the log's visibility. Collapse and Close hide both windows; the toolbar restores them. A GM's Show to Players request opens both on active player clients.
- Replaced the dangerous "Clear Global Chat" function with "Clear Expedition Log" (type `CLEAR LOG`). It only clears saved expedition visual cards and hides historical forced-march results already displayed in the expedition log. **Foundry ChatMessages, Midi-QOL roll messages, ledger, and Exhaustion are not deleted.** The log-clearing epoch prevents older in-progress hex-card stage updates from restoring cleared entries. All world clients receive setting updates. New hex results appear normally after clearing.
- Navigation, secondary character and secondary activity choices are remembered in `ironrotRolePreferences` and validated against the currently present roster before every hex. Missing/absent PCs never become eligible solely because they were saved previously.
- A separate `ironrotHexDisplayProgress` world setting records an active hex's original travel duration, allowing precise elapsed time to be shown alongside hours remaining. Hexes already underway before installing dev.8 do not have an original duration; they display `Not recorded`, not a guessed value. Existing world ledger `mountIronrotTravelV45` remains unchanged.
- Dashboard separates hours traveled today, safe hours remaining, forced hours, hexes completed, current-hex elapsed and remaining time, and the upcoming forced-march hour/DC.
- Party roster is a vertical list of Foundry Actor portraits, names, saved roles, and present status. It does not require tokens on the scene or online players.
- Experimental Zantor's Realms dark Foundry styling applies amber, parchment, warm brown and copper styling to this module's two windows. Oxblood/red is reserved for destructive controls. No other ZFT modules or shared brand policy are changed.

## Important live testing (V13.351 / D&D5e 5.2.5)

1. Open console as GM: verify physically separate Dashboard and Expedition Log windows. Resize only the log; drag the dashboard while docked and confirm the log follows. Drag the log to undock, redock, close log and reopen using dashboard scroll icon. Confirm refresh preserves client-local choices.
2. Confirm **Player view** displays the dashboard, portrait roster and log, but does not contain GM action controls. Verify Show to Players restores both for a connected player.
3. Start a new hex. Select Navigator, Secondary PC and activity; perform navigation/Midi rolls. Start another hex: verify selections are prefilled. Refresh browser and repeat. Exclude a previously selected actor from Party Attendance; verify the absent PC is never silently selected or rolled.
4. Confirm safe-travel and forced-march hour totals and original hex duration. For pre-existing unfinished hexes, `Not recorded` is expected until a new hex starts.
5. As GM, select **Clear Expedition Log** and enter `CLEAR LOG`. Verify both GM and player logs clear, then refresh/rejoin and confirm cleared cards do not reappear. Existing Foundry Chat tab messages must remain; day/hours/hexes/pending, character Exhaustion and saved role preferences must be untouched.
6. Try clearing while a roll is pending. Its old card stages must not reappear afterward. Subsequent new hexes should publish new cards normally.
7. Verify reset, new day, forced march, Stop & Carry, GM rulings and rerolls remain functional. Reset should not silently overwrite Foundry Chat or erase role preferences.
8. Review branding readability and button/error colors at different window sizes. Do not infer Foundry V14 compatibility from V13 checks.

## Known limitations and safety

- Foundry's standard Midi-QOL dice/chat messages remain native in Chat, by design.
- If a hex was started before dev.8, the original duration was never stored by older builds, so elapsed time cannot be reconstructed reliably. Do not infer it from the saved remaining-hours value.
- Clearing the visible forced-march history does not erase the ledger's authoritative historic adjudications, preventing accidental loss of already-applied Exhaustion.
- The v4.13 original macro source remains bundled unchanged in `MountIronrotV413.source.js` as a rollback reference. The isolated integration still requires live GM/player testing before use in a paid session.
- No GitHub writes were performed. The central `zft-standards` repository's potential branding standards update is intentionally deferred until the owner approves the theme.


## dev.10 client UI verification
- GM: while forced-march prompt is active, it should appear directly below progress overview, before party/GM controls, and all buttons should still work.
- Player: open Display Size from the dashboard header; scale Dashboard and Log independently, reload and confirm both persist only for that player.
- Follow log: with log near bottom, generate new travel card and watch it scroll down. Scroll upward then generate another card; view must remain at reviewed position. Return to bottom to resume.
- Earlier completed hexes collapse; click Previous hex to inspect full saved result. Most recent completed hex remains expanded.
- Confirm Midi-QOL roll prompts remain interactive above expedition windows and do not become blocked. No global z-index changes were made.
- Native Foundry Chat messages must remain unchanged. No GM/player world settings changed by client display preferences.


### dev.13 test: three-column layout and cancel/restart
1. Open GM console. Verify Left: GM Expedition Controls; center: Expedition Progress + Present Party; right: Expedition Log.
2. Click Start / Continue: the active prompt appears directly under the GM buttons in the same left column, without creating another pop-up window.
3. Cancel the first navigation prompt and reopen Start / Continue. It must reopen normally without Reset Travel.
4. Check New Travel Day > Cancel and Start / Continue again. Hours and hexes must remain unchanged.
5. Test Forced March Pause / Exit and resume, and GM adjudication with completed/partial saves. Roll progress must persist.
6. Open, edit then Cancel Attendance, Ledger, Settings and destructive confirmations. Confirm unsaved data is unchanged, and successful saves remain functional.
7. Confirm player display contains center progress/roster and right log but no left GM controls. Check Midi-QOL roll prompt accessibility.
8. Test log docking, window dragging, small browser dimensions, fixed 100% display scaling, and independent scrolling.


### dev.16 check: no GM Controls grip and automatic height
1. On refresh with dev.15 saved manual dimensions, confirm GM Controls has **no corner resizing control**, fits buttons only, and retains its Dock/Undock button.
2. Open Start/Continue: the controls window grows to show all choices and its action buttons **below** the form; no early clipping.
3. Click Cancel, confirm the window shrinks, then click Start/Continue again without resetting travel.
4. Test a tall Forced March/GM adjudication workflow. The window grows until the viewport edge, then only its inside content scrolls to reach the bottom action buttons.
5. Move the Dashboard with GM Controls docked, and undock/redock; window height remains driven by workflow content.
6. Confirm Player clients, Expedition Log resizing, and Midi-QOL saving throws remain functional. No native Foundry interface stacking changes.

## v0.4.0-dev.17: Foundry calendar + reroll status

- Expedition Settings displays the current Foundry in-world calendar date; manual start-date input removed.
- At the first GM-authored snapshot/card each expedition day, capture the Foundry calendar date once, without touching the world clock. New Travel Day does not advance time. Older captured dates remain unchanged when the world calendar is edited. Legacy date settings remain read-only fallback for pre-upgrade records.
- During GM-requested Forced March CON rerolls, log card immediately changes to **Rerolling · awaiting d20**, showing previous result as previous only. When the Midi-QOL rerolls return, the same actor card displays the new total, **Rerolled ×N**, and awaits a fresh GM ruling. No extra expedition cards or chat messages.
- Interrupted pending rerolls recover to GM review on resume, without requiring travel reset.
- Test with both a GM and player client; Foundry V13/Midi-QOL client behavior is not validated by local checks.


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


## v0.4.0-dev.20 verification and regression

- Start with an expedition containing a saved Navigator and Secondary; open Party Roles, confirm saved values, change the activity and Save. Verify the center Dashboard and a player client display the updated assignments.
- Start / Continue shows the saved assignments without requiring reselection. Change Roles for This Hex still exposes the existing selectors and roller controls. Ensure a missing/absent assigned PC produces a warning and does not cause a silent replacement.
- Start > Cancel > Start again remains usable and does not advance hours. Cancel in Party Roles discards edits and leaves the stored setting alone. Resume an unfinished hex even when the saved Navigator is no longer attending.
- On a Calendaria Harptos calendar showing Hammer 7, 1501, the Region Edit form and newly captured current-day log date should display 1501, not raw 0. If the current date was saved incorrectly by dev.19 or earlier, explicitly Re-sync Current Travel Date. Existing older dates are intentionally preserved.
- Verify GM Controls button order, absence of duplicate Region button, larger Dashboard region heading, and unchanged docking / automatic-height behavior on both GM and player clients.
- Locally verified with Node syntax and mocked Calendaria API year test; Chromium role editor selection, navigator exclusion, and None activity visibility checks.


## v0.4.0-dev.21 live GM/player acceptance tests (pending)

1. With three expedition panes visible, open a D&D5e character sheet and confirm it appears above them and remains fully clickable. Repeat with two sheets, a journal, item configuration, and the Expedition Log expanded/undocked.
2. Trigger a Midi-QOL skill check and forced-march CON saving throw from a player client. Verify controls and submission are clickable without moving/closing expedition panes; verify GM and player results update.
3. Test native DialogV2 confirmation, legacy module dialogs, and third-party floating windows; confirm each can display above all expedition panes. Click the exposed areas of Dashboard, Log, and GM Controls to change their **internal** order without stealing native dialog focus.
4. After closing dialogs, confirm the three expedition windows, docking, dragging, GM Controls intrinsic height, Start > Cancel > Start, and player roster still work. No hit-testing overlay should cover the map outside the panes.
5. Move to a new travel day without travel results. The newest day must still appear at the top of the log. Current day should expand on resume and earlier days remain collapsed; manual expansion is preserved.
6. Expand historical Hex Travel and Forced March records. The in-game date should be shown once in their owning day heading; saved dice, outcomes, and GM adjudications must be unchanged. Incorrect pre-dev.20 years require explicit current-day resync and must not be silently rewritten.
7. Confirm Foundry native Chat tab retains its messages, Action HUD remains functional, and no in-progress expedition hours/hexes/exhaustion change just by upgrading.

Static/Chromium tests do not establish live Foundry compatibility. Source includes no modifications to Foundry, Action HUD, or Midi-QOL.


## v0.4.0-dev.22: ZFT display-name acceptance tests (pending)

1. Confirm Foundry Module Management lists **ZFT Overland Travel** while the technical module ID remains `zft-overland-travel`.
2. GM and player: open the Mount Ironrot dashboard and confirm the fixed header reads **ZFT Overland Travel** / **Expedition Dashboard**, including after role changes, log events, and refresh.
3. GM: open generic Travel Manager and confirm the dialog title; verify toolbar group title is **ZFT Overland Travel** while the Mount Ironrot-specific tool remains recognizable.
4. Verify GM Controls and Expedition Log headers retain their names and window management, docking, log scrolling, and foreground dialog behavior match dev.21.
5. Verify stored expedition name/region/world, party assignments, ledger and recorded travel history are untouched; no duplicate world rules compendium is created.
6. Reconfirm legacy V13 workflow: Start/Continue, Cancel/reopen, rolls/forced-march dialog, and player-client updates.

Status: local static/source validation only until Foundry GM/player checks are completed.


## v0.4.0-dev.25 | 2026-10-27
- During live Midi-QOL skill/CON roll requests, GM Controls now displays an explicit recovery panel with Resend Prompt, Roll as GM, and Cancel Request. No automatic duplicate roll, no travel dice reroll. Superseded socket responses are ignored on the GM client.
- Pending player must reconnect before resending. If the original prompt appears late, close it without rolling. GM-client refresh does not persist the JavaScript request; this recovery path targets a player disconnect while the GM remains connected.
- Constitution save results are serialized to the existing world ledger as they complete; canceled rerolls do not erase the previous result. Other saved rolls remain intact.
- Current hex is shown as in progress while ledger hours remain, rather than being mislabeled completed merely because the travel dice have been rolled.
- Expanded travel detail margins/header duplication reduced. Foundry clock, existing saved ledger keys and Mount Ironrot v4.13 source are unchanged.
- Requires GM and player live validation of socket retry and duplicate late prompt cases.


## v0.4.0-dev.26: current hex label and compact roll details
- Travel-card `stage: complete` still represents **travel dice finished**, not proof the party has reached the far side of the current hex. The latest recorded hex remains "Current hex · In progress" for the current day (and across a day boundary while `pending > 0`). Earlier records become "Hex completed" once superseded or on a later day without pending time.
- Compact log details are generated from existing saved card HTML at render time. The original roll records, modifiers, actual dice faces, and navigation/secondary check totals remain intact. Legacy/unrecognized markup falls back unchanged.
- A small metadata row replaces duplicate context, pace, and oversized "TOTAL · ONE HEX" panel. Navigation, optional secondary, dice icons and timing math remain expandable.
- No world-clock change, ledger migration, Midi-QOL socket change, exhaustion change, or GitHub write. Requires Foundry V13 GM/player live validation.

## v0.4.0-dev.27 | Personal interface themes (development)

**Scope:** presentation only. New `ThemeManager.js` and `ThemeEditor.js`; no changes to Mount Ironrot v4.13 source, saved travel state, roll payloads or existing data keys.

**Presets:** Zantor Default (unchanged when selected without overrides); Antique Copper, Moonlit Slate, Verdigris, and Graphite. Individual colors editable as `#RRGGBB` with native color inputs, revert per field, and revert all overrides. Save and Cancel are explicit. Preference stored in a new **client-scope** setting `interfaceTheme` (no world sync).

**Validation:** JavaScript syntax pass; CSS parser pass with 0 top-level errors (dev.26 also 0). Chromium GM UI test: five presets, 22 fields, three-pane previews, editor from Dashboard and Log, save/reopen, cancel rollback, per-field reset, default restoration, simulated native Foundry dialog unaffected/clickable. Chromium non-GM UI test: player can save theme independently without GM Controls. ZIP/manifest verification pending archive generation.

**Live test plan:** Open all three panes; try each preset; change navigation result background and button color via picker and hex field; cancel, then save; reload Foundry and verify personal preference persists. Repeat with a player account to verify it does not modify GM palette. Test expanded old travel cards, Foundry dialogs, and Midi-QOL prompts while themed.


## v0.4.0-dev.28 | Independent theme window
- Palette launch lives **only** on the main Dashboard (both GM and player). No palette action remains on the Expedition Log.
- The editor is a separate, draggable, resizable window outside the Dashboard scroll container. At desktop widths, preset choices are in a sidebar and groups of editable color slots use two columns. On narrow clients the layout stacks.
- The editor occupies its own low-priority z-index above ZFT panes but below Foundry application windows; no global window layer changes.
- Client-only `interfaceTheme` persistence, live preview, hex validation, reset, Save, Cancel and Escape rollback retained. Header X discards unsaved changes.
- Check GM and player, especially reopening from the Dashboard, dragging, input focus after preset changes, clickability of native Foundry/Midi-QOL dialogs, and cancellation when closing Dashboard. No travel engine or world-setting migration.
- Local Chromium tests and static validation only; live Foundry V13 check pending. No GitHub writes.
