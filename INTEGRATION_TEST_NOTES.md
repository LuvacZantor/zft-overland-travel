## 0.4.0-dev.86 | Dashboard tile label wording (live Foundry acceptance pending)

1. Open the Expedition Dashboard and confirm tile labels DAY, TRAVEL HOURS TODAY, HEXES COMPLETE, TRAVEL HOURS LEFT, in that order.
2. Confirm four tiles remain on the same row at normal dashboard width without increasing tile height. At narrow sizes preserve existing responsive layout with no overlap or overflow.
3. During an unfinished hex verify the last tile still displays pending hours. With no active unfinished hex, verify it displays an em dash.
4. Verify safe-hours and current-hex progress bars, NEXT message, world clock, Force March transitions, Expedition Log, dice, saved history, and themes are unchanged.
5. Repeat as GM and player in the intended Foundry test world; automated/browser layout checks are not live acceptance.

---

## 0.4.0-dev.85 | Dashboard overview consolidation (live acceptance pending)

1. With a pending hex and Forced March underway (e.g. Day 1, 10h traveled, 2 hexes complete, 3h pending), confirm the four tiles show Day 1 / Travel Today 10h / Hexes Complete 2 / Hex Remaining 3h.
2. Confirm the duplicated text-only lines (Traveled today, Safe hours remaining, Forced March hours, Current hex remaining) no longer appear below the progress bars.
3. Confirm both original progress bars retain their labels, numeric fractions, fill, warnings, and calculations. NEXT, sunrise/sunset, and estimated arrival remain present.
4. Finish a hex: Hex Remaining displays a dash, not 0h implying an active hex. Start a new hex: actual remaining hours display as before.
5. Resize the Dashboard, test at interface scales and themes, and verify four tiles in a row at normal width and two-by-two in narrow windows, with no horizontal overflow.
6. Verify the Expedition Log, current and historical Forced March panels, GM rulings, world clock, and all travel mechanics are unaffected. Test GM/player views. Live Foundry testing pending.

---

## 0.4.0-dev.84 | Compact confirmation and single-open Forced March (live verification pending)

1. With an unfinished hex containing safe hours, open Start / Continue: verify compact remaining/safe summary and **Continue Traveling**. Cancel must preserve ledger and world time.
2. At 8 safe hours used with travel remaining, reopen: verify **Review Forced March** action, correct warning, and the existing post-confirmation GM Forced March decision. Cancel leaves pending hours, ledger and clock untouched. With a changed ledger while the prompt is open, stale confirmation must be rejected.
3. Complete Forced March Hour 9 while hex is still pending: Hour 9 may expand automatically. Begin Hour 10: Hour 9 collapses. Complete Hour 10 with pending hex travel: only Hour 10 expands. Once the hex is completed, **all** completed Forced March hours collapse and remain individually available for manual review.
4. Manually open an older hour: confirm no second completed hour stays expanded. Check current/past day groups, refresh/reopen the log, reconnect a player, and the original detail rows and GM outcomes.
5. Verify Navigation/Travel Time spacing is slightly denser at 280/340/540px while the original d20/d4 faces, DC, overrides, all hour math, total, and expandable Original roll detail stay readable.
6. Regression: original travel pace, exhaustion, Forced March DC and saves, 8-hour safe cap, clock sync, day change, hex history, roles/events placeholders, customized themes, GM/player visibility. Static tests are NOT live Foundry acceptance.

---

## 0.4.0-dev.83 | Summary-first Hex Travel report (live acceptance pending)

1. With both Navigation roles assigned, verify the pending and complete Guide/Vanguard rows at normal and narrow log sizes, including GM overrides and long character names.
2. Verify final travel hours are prominent; every existing base/delay d4 face appears next to its saved calculation, with pace and exact totals unchanged.
3. Expand Original roll detail to compare the original dice faces and math against the compact rows; collapse the disclosure again.
4. Verify Guide-only, both roles failed, long hex spanning two days, old historical/secondary cards, theme selection, and GM versus player clients.
5. Recheck Forced March, Exhaustion, dice animation, travel clock, resume confirmation, day transitions, window docking, and Travel/Roles/Events tabs. This is a presentation-only change; no stored travel record is migrated.

---

## 0.4.0-dev.82 | Navigation report alignment only (live Foundry check pending)

1. Open an in-progress hex with both Guide and Vanguard rolls awaiting GM adjudication. Check both checks show equivalent rows, with labels, character names, d20 totals, DCs and statuses aligned.
2. Approve mixed success/failure and test overridden results. Both statuses and original roll totals should remain clear, and Travel Dice should display below with the correct hours.
3. Try long character names, narrowed/undocked log, all configured themes, GM and player clients, and old pre-Vanguard travel cards.
4. Ensure Navigation delay dice, GM rulings, ledger, Forced March, and clock behavior remain identical to dev.81.

Only the view renderer and scoped CSS are changed at runtime. No stored history is rewritten. Browser live validation pending.

---

## 0.4.0-dev.81 | Cooperative Guide + Vanguard Navigation (live acceptance pending)

1. Assign two present, distinct Actors to Guide and Vanguard; confirm Guide = Survival (WIS), Vanguard = Athletics (STR), and their assigned players receive roll prompts together. Both use the GM-selected DC.
2. Check all four pass/fail combinations, including GM overrides: 2d4 base, plus one d4 for each failure. The former fixed +2 Guide delay must be absent. Fast 75%, Normal 100% and Slow 150% still round base hours up before adding delay dice.
3. Confirm the travel log shows both role results and the separate delays. Check the role data survive reopening and a new travel day. Older saved log cards must remain unchanged.
4. Unassign Vanguard or mark their Actor absent and verify Guide-only Navigation without an extra failure or Vanguard prompt.
5. Cancel a GM ruling and ensure neither hex time nor world clock advance; retry/recover GM/player roll prompts. Verify that same player controlling both PCs does not cause a stalled or swapped roll.
6. Start a hex that spills into the next day, pause, resume and finish: no repeated Guide/Vanguard rolls or delay dice. Test Forced March, CON saves, exhaustion, clock sync and tab switching.
7. Check both GM and player clients, themes, narrow Expedition Log width, with and without Dice So Nice. Run on Foundry V13 / the installed D&D5e and Midi-QOL versions; static tests do not certify live Foundry compatibility.

---

## 0.4.0-dev.80 | Expedition Log tabs, live acceptance pending

1. Open Expedition Dashboard and confirm the Expedition Log defaults to Travel with all existing day/hex history and newest/Latest behavior intact.
2. Select Roles and Events. Each shows only the explanatory placeholder and no new event records; switch back to Travel and verify the original cards remain unchanged.
3. In Travel, scroll back and expand an older day/hex; switch tabs and return to verify scroll position, open cards and history. Test newest/Latest behavior separately.
4. Test a travel result while Roles or Events is displayed, then return to Travel to verify the result is correctly logged, with normal travel hours and day history.
5. Verify tab keyboard navigation (Left/Right/Home/End), dock/undock, hide/show, resizing, interface scale and both GM/player views.
6. Verify no new dice roll or expedition state mutation occurs when changing tabs. Test rollover, an unfinished hex and Forced March as regressions.

Static checks are not live Foundry testing. No new event engine wiring or data storage is claimed.

---

## 0.4.0-dev.79 | Role grouping only, live acceptance pending

1. In Expedition Roles, verify Navigation = Guide Survival (WIS) + Vanguard Athletics (STR).
2. Verify Reconnaissance = Scout Stealth (DEX) + Tracker Investigation (INT).
3. Verify Expedition Support = Forager Survival (WIS) + Coordinator Persuasion (CHA).
4. Save assignments; reopen and confirm the same Actor UUIDs remain assigned to their named roles. Check GM and player roster / Roles Reference.
5. Start/Continue on a new hex; Guide should still request only Survival and retain its original dice, navigation delay, and travel hours.
6. Verify New Travel Day, unfinished hex confirmation, world-clock toggle, Forced March CON saves, log, and theme unaffected.

No other roll mechanics or skill selection UI was added. Automated checks are not live Foundry verification.

---

## v0.4.0-dev.51 | Roster collapse, Forced March alignment and interface scale

1. Collapse and expand Expedition Roster using its heading. Ensure the Roles reference button remains visible. Refresh the dashboard and reopen it: the per-client state must persist without affecting other players.
2. Expand a completed Forced March event. Verify d20 graphic/total and Passed/Failed result occupy consistent fixed columns for both long and short character names, and reroll/outcome details remain accessible. Check narrow log widths.
3. Open the sliders icon in Dashboard header. Move from 100% to 80%, 120%, then reset to 100%. Confirm Dashboard, GM Controls, Log, role reference and theme editor scale together, without affecting Foundry windows. Setting must persist on client reload and not be pushed to other users.
4. Verify all five themes and custom overrides still work. Confirm Forced March stays nested inside the active hex and all travel calculations and saved state are unaffected.

Local tests are not a substitute for live Foundry V13 verification. GitHub not modified.

## v0.4.0-dev.50 | Full-width dice rows and expedition log consistency

1. Roll a hex and confirm Navigation occupies its own full-width row with the red graphical d20 total, Guide, DC and success/failure, followed by a full-width Travel Dice row with the original graphical dice. The footer still shows Travel Hours and Total Hours side by side at normal log widths.
2. Test successful navigation, failure and delay dice, GM override and incomplete navigation. Verify no redundant summaries, new roll total or mechanical changes.
3. Trigger Forced March while a hex is active. Pending and completed entries should both appear beneath the same **Forced March Checks** heading, with matching event header formatting and different status accents.
4. Start multiple hexes. The log labels **Hex 1**, **Hex 2**, etc., numbering persisted hex records in creation order; completed hexes remain muted when collapsed. Current-day totals distinguish completed and active hexes and count Forced March checks separately.
5. Continue a hex to a new travel day, and check retained hex number/ID; confirm older unlinked Forced March history stays separate. Switch all five themes, including custom overrides; resize log to 320, 400, 560px; inspect responsiveness.

Status: Local validation only. Live Foundry V13 verification required; GitHub unchanged.

## v0.4.0-dev.49 | Unified travel report and Forced March headers

1. Roll navigation and travel time for a new hex. The latest hex opens to ONE travel report with no four separate box borders: Navigation left, graphical Travel Dice right, travel-hour calculation and total separated by a rule below. Check the original red d20 total overlay and d4 results.
2. Confirm successful navigation, failed navigation with GM override, secondary checks, pace adjustment, and delay dice all display intact and lead to unchanged total hours. Before travel dice, navigation remains visible and no fictitious duration is displayed.
3. During Forced March, verify pending and completed Hour N entries display matching font sizes, title/icon positions, status positioning and metadata rows. Pending uses amber status; completed uses green. The additional GM decision title wrapper was removed, not the saves or GM actions.
4. Expand completed Forced March and inspect all actor rolls and GM decisions. Confirm its history stays under its owning hex across pause/continue and New Travel Day. Old unlinked events stay separate.
5. Switch all 5 themes and a customized theme color; resize log to 320px, 400px and 560px; verify responsive presentation, no horizontal overflow or hardcoded new panel colors.

Status: Local source and browser checks only. Live Foundry V13 validation pending. GitHub unchanged.

## v0.4.0-dev.48 | Navigation die total, coherent theme surfaces, muted closed history

1. After a Guide check, inspect the navigation d20. The **modified check total** must render centered on the red d20 icon (the tooltip explicitly identifies it as a check total); compare its size to the blue d4 travel dice. DC and success/failure text remain separate.
2. Check the Navigation, Travel Dice, and Travel Hours cards: all use the same surface and border colors from the selected client theme. The Total card retains a restrained themed accent. Success/failure indicators retain semantic colors.
3. Switch through Zantor Default, Antique Copper, Moonlit Slate, Verdigris, and Graphite and try a custom color override. Confirm the log updates with the theme without reopening, and previous client theme settings remain intact.
4. Complete several hexes. The latest expanded hex remains prominent; *collapsed completed* hexes have muted borders/header. Click an older completed hex to expand and restore full contrast; collapse it to mute again. Active/current hex is never muted by this rule.
5. Confirm no change in actual rolls, pace, hours, navigation failure delays, Forced March associations, saved history, or original V4.13 source.

Status: local source and browser checks only; live Foundry V13 validation pending; GitHub unchanged.

## v0.4.0-dev.47 | Balanced hex results and navigation d20 (live testing pending)

1. Roll Guide navigation before travel dice: the latest hex expands; Guide check total uses the original red d20 SVG graphic enlarged to the same silhouette dimensions as the d4 travel dice. The number remains adjacent to the d20 because it is a modified check TOTAL, not a raw die face. Guide name, DC, and GM outcome remain intact.
2. Complete travel dice: top-left Navigation and top-right Travel Dice share a row. The right side retains pace, formula and original graphical d4s but NO base/pace math.
3. Bottom row: left Travel Hours contains individually separated Base and Pace rows, plus the Navigation delay row on failure; right keeps prominent TOTAL · ONE HEX.
4. Test navigation success and failure/GM override (2d4 + 1d4 + 2), confirm actual dice faces, calculated hour values, and extra legacy secondary text all remain correct.
5. Test 320px, 400px, and 560px Log content widths; columns remain balanced without text overflow; at narrow widths they stack. Compare themes.
6. Verify newest hex expansion, historical Force March associations, and compact GM Forced March prompt remain unchanged.

Status: local browser and structural validation only; live Foundry V13 verification required. GitHub unchanged.

## v0.4.0-dev.46 | Two-column Hex display (live testing pending)

1. Begin a new hex and roll navigation: Hex is expanded; Navigation Guide/DC/character/d20/outcome visible in left column, Travel Dice pending on right. No separate details disclosure.
2. Finish travel dice: original dice graphics (same size as before), formula and base/pace/delay appear in the right column; full-width Total Hours below both columns. Verify rolled hours unchanged.
3. Test a FAILED Guide check with GM override: actual failure/d20/override label preserved on left and delay die/extra hours preserved on right; no missing secondary checks.
4. Complete hex: the latest automatically expands; prior hexes remain collapsed unless manually expanded. Refresh and verify manual collapse persistence.
5. Resize Expedition Log near 400px and 560px, ensure the two columns remain legible and no horizontal overflow; at exceptionally narrow widths they may stack. Test theme switching.
6. Ensure compact GM Forced March choice from .45 remains unchanged, Forced March linked entries and historical unlinked entries remain intact, world calendar unaffected.

Status: local testing only; live Foundry V13 verification pending. No remote GitHub modifications.

## v0.4.0-dev.45 | Compact log / Forced March prompt (live test pending)

1. Complete navigation roll: latest hex expands automatically, compact Navigation row shows character, result and DC, while travel row says Pending.
2. Roll travel time: compact dice row shows dice formula, faces and hours. Expand `Full navigation & dice breakdown` to verify original die icons, pace, detailed calculation and navigation ruling remain available; close it and confirm summaries remain visible.
3. Trigger Hour 9 Forced March: compact GM prompt displays Traveled, Hex Left, CON DC and the original two buttons. Verify Continue processes an hour, Pause/Exit preserves progress, New Travel Day still uses the existing GM Controls action.
4. During GM decision/review verify the live log briefing is compact; after resolving saves confirm Force March results remain under the correct hex and character details are accessible.
5. Verify a new hex auto-expands but its detailed dice breakdown remains closed until manually requested, older hexes stay collapsed, theme switching/readability works and narrow log width has no horizontal overflow.
6. Check no legacy travel math/world history alteration and no Foundry clock movement.

Status: local checks only, live Foundry V13 acceptance pending; no GitHub write.

## v0.4.0-dev.44 | Nested navigation/dice disclosure regression (live testing pending)

1. First navigation roll in a fresh hex: latest Hex and Navigation & Travel Dice details both automatically OPEN, even when the GM ruling is still pending and travel hours are unavailable.
2. GM confirms navigation outcome and rolls travel time: both levels stay OPEN, showing the navigation result, dice, modifiers and duration.
3. Hex completes: both levels remain OPEN after the log refresh.
4. GM manually closes Navigation & Travel Dice, then refreshes without a new travel event: it stays closed. Repeat for outer hex. On a NEW recorded event for that same hex, both reopen.
5. Roll a second hex: its two levels auto-open; the previous hex is collapsed by default unless the GM had explicitly expanded it.
6. Verify pause/resume and Forced March linked checks still render correctly, and that stored travel duration and character roster are unchanged.

Status: Browser DOM simulations and package checks only; live Foundry V13 unverified. No GitHub writes.

## v0.4.0-dev.43 | Live Foundry checklist (pending)

1. Start and complete a new hex: latest/current day's hex stays expanded when the result is recorded; navigation and travel dice remain inspectable in their expandable subsection.
2. Collapse that hex manually, then refresh the dashboard without recording new events: it must remain closed. Record a NEW event in that hex or a newer hex: the latest updated entry should open automatically.
3. Pause/Exit and then Start/Continue: the current day stays expanded, and unfinished hex progress remains visible with its stored hex ID.
4. Process a Forced March after pausing and resuming: confirmed linked checks appear under the associated hex; historical checks with no saved hex ID remain separate.
5. In the roster, verify each present character displays role, role skill, and CON save on separate lines, including when exhaustion penalties are shown on the right.
6. Verify historical roll results, manual log resizing, docking, role assignments, world time, and hex duration remain unchanged.

Status: Local tests only; NOT live Foundry verified. No GitHub writes.

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

## v0.4.0-dev.39: Safe-limit shading and Forced March ruling defaults (live testing pending)

1. At 7/8, verify the Hours Today card retains its neutral surface. At 8/8, confirm amber shading and border; at 9/8, confirm red shading and border. Test a custom theme as well.
2. With one failed CON save, confirm Apply +1 Exhaustion is preselected; with a passed save, Accept success remains preselected. Neither should commit a result before Process Party Decisions is pressed.
3. Override a failed result to waive exhaustion, request a reroll for a different PC, and verify that override persists. Rerolled PCs should select the default corresponding to their new total.
4. Check both decision footer buttons: Process Party / Decisions and Pause / Exit / Saves Progress. On narrow displays they stack; neither button loses its original callback.
5. Pause with unresolved decisions, reopen and verify saved choices. Verify reroll checkpointing and no duplicated exhaustion/hex hours. Full live Foundry V13 validation remains pending.


## v0.4.0-dev.40 live log and Forced March verification (pending)

1. On a current day with a pending Forced March decision, the warning and hour/DC information should be inside that day's expanded section, not above the day header. Earlier days remain collapsed. The previous/saved timeline entries must remain intact.
2. At the Forced March pre-hour prompt, verify only Continue Hour N and Pause / Exit appear, aligned in a single row. Pause and reopen using Start/Continue: unchanged day and unfinished hex hours. Use New Travel Day separately for carry-forward.
3. Complete a forced march with pass/fail results. Verify the summary remains short/collapsed until clicked, and expansion reveals the original per-character saves and GM ruling. Navigation/hex result details must still expand and retain all dice and timing data.
4. Expand/collapse an earlier day and a completed event; trigger a dashboard refresh. Verify the user selections persist and the Log still docks, undocks and resizes manually on both GM and player clients.
5. Test at narrow window widths and with alternate theme palettes. Amber pending, blue navigation, green completed, red failed should be readable but not override personal theming.


## v0.4.0-dev.41: Hex-parent log test checklist (requires Foundry V13)

1. Begin a new hex that lasts beyond 8 travel hours and resolve one Forced March save. Expand that day's hex: the resolved save must appear INSIDE the hex, with the exact roll totals/decisions retained. New saved `marchHistory` entry must include an exact `hexId` matching the travel card.
2. Pause and resume: confirm the current hex ID stays unchanged and the same hex owns later Forced March saves. At hex completion, ensure the active-hex pointer clears and the number of completed hexes increments once.
3. Advance New Travel Day with unfinished hex time. The new day must display a continued segment linked to that SAME hex; current-day Forced March saves appear inside that segment, while older day sections retain their earlier results.
4. Open pre-v41 history: old Forced March results with no `hexId` must remain visible in a labeled day-level legacy section, not be silently assigned to a hex. No dice, outcomes or dates may change.
5. Expand and collapse day, hex and nested save details, change theme, dock/undock and manually resize the log as GM and player. Check old and new histories at narrow widths.
6. Confirm module console version displays `0.4.0-dev.41`, ZFT Tools toolbar calls the control `Expedition Dashboard`, and no core travel dice or DCs have changed.

Local syntax/DOM/render tests do not replace live Foundry GM and player checks.


## v0.4.0-dev.42: Forced March-to-hex association regression (requires live Foundry V13)

1. Begin a fresh hex with 10+ hours of travel. Pause at the Forced March prompt and close the panel. Reopen via Start / Continue. Verify the pending Forced March is nested inside the current hex, not above it or in Earlier Forced March checks.
2. Roll/process a Forced March check, then pause and reopen once more. The completed check must remain nested under the same hex. Confirm actor totals and GM decisions are unchanged.
3. Before completing an unfinished hex, select New Travel Day. Confirm the active hex retains its ID, its hours do not restart, and new Forced March events stay attached to that hex in the appropriate day's segment.
4. Finish the hex. Confirm the completed hex retains linked checks, increments exactly one completed hex, and a fresh hex does not inherit the old ID.
5. Prior unlinked Hour 9/Hour 10 checks from dev.41 remain under the labeled legacy section, with no silent reassociation. Check player log synchronization, manual docking/resizing, and no errors.

Local source/DOM tests don't establish actual Foundry V13 behavior. No GitHub writes.


## 0.4.0-dev.52 local test build
Proportional top-left window scaling and scale-aware redocking; standalone roster toggle below original header; compact GM action/decision controls. No travel rules or world ledger changes. Live V13 tests pending.


## 0.4.0-dev.53 local test build
Replaced continuous slider with exact numeric scale entry (Apply/Enter), immediately applying ±1/5/10 controls, and Reset. Expanded/collapsed roster uses icon-only double chevrons beside the Roles button in the unchanged header. Per-client scale/roster state, scaled docking, themes, travel mechanics and world history retained. Live Foundry V13 testing pending.


## 0.4.0-dev.54 local test build
Expanded per-client interface scaling to 60%–150%. Replaced repetitive pending roll request cards with a compact shared heading and per-character icon actions; all original Resend, Roll as GM, and Cancel logic retained. Consolidated forced march GM adjudication into a compact selectable party table; selections, saved rerolls, partial progress and application mechanics are unchanged. Redesigned Expedition Roster alignment, hierarchy and spacing, preserving separate skill and CON save lines and right-aligned exhaustion. Aligned live Forced March saves with archived completed check results before and after GM approval. Five theme presets/custom colors preserved. Live Foundry V13/V14 verification pending. GitHub unchanged.


## v0.4.0-dev.55 UI acceptance checks (pending live Foundry V13)
- Inspect 58px portraits and actor names with long/wrapped names, with and without exhaustion, all five themes and 60%/150% scale.
- Pending rolls: verify per-character Resend, Roll as GM, Cancel tooltips/legend, including one and six concurrent requests.
- Forced March review: pass and fail colors; Exhaustion 0 versus positive; change each select between accept, exhaust, reroll without applying; projected level and chosen action color must respond; confirm only Process Party applies effects.
- Scale settings: select steps 1,5,10; +/- applies instantly; Reset = 100%; persistence and GM/player dock arrangements.
- Hex heading: navigation, GM ruling, travel dice, decision, CON saves, GM review, completion; no stale status and no layout overflow.


## 0.4.0-dev.56 — UI layout/scale follow-up (local, live V13 testing pending)

- Dashboard overview removes duplicate Current Hex Left and Completed Hexes fields without changing stored ledger state.
- Scale controls open in an independent, movable and unscaled ZFT window with prior client-only increments preserved; normal GM/player panes still scale/redock.
- Current hex header uses a compact top row and separate theme-aware current-action strip; Forced March count remains available when collapsed.
- Roster tightens text/row padding; portraits fit content rather than setting height, while preserving separate skill/CON lines.
- Check popout focus, all five themes, scaling 60–150%, hover/tooltips, window overflow, GM/player use and the saved history in actual Foundry V13. Browser tests are not live verification.


## 0.4.0-dev.57 — roster condition alignment and empty travel days

- Roster exhaustion label and penalty lines now top/right align with the character heading. The 0.4.0-dev.56 compact card height and portrait remain unchanged.
- World-side expedition log visibility tracks explicit `recordedDays` in addition to travel cards and Force March checks. The GM snapshot registers its day and, on the explicit New Travel Day transition, the immediately preceding day. Historical empty days remain visible after browser reload and can be expanded to show a truthful zero-activity note. No empty-day roll/hex records are fabricated and Foundry's world clock is not advanced.
- Clearing the expedition log clears recorded-day markers; full expedition reset clears markers and records Day 1 on the next published snapshot. Manual ledger jumps do not fabricate missing dates or days.
- Older versions do not have the new markers, so an already-lost historical empty day cannot be reconstructed without evidence of that day.
- Local source and browser tests are not live Foundry V13 validation. Verify with consecutive zero-activity days, reloads, manual ledger corrections and Clear Expedition Log.


## 0.4.0-dev.58 local test focus
- Hex Travel setup and Navigation Ruling now share theme-aware modern surfaces, controls and typography. The paired role actions remain informational and are not executed.
- Travel dice are published after Dice So Nice's `showForRoll` resolves; remote Midi native rolls wait when a returned or matching observed native chat message ID is available. Retry/cancel hooks are deregistered after every attempt. Live multi-client animation timing must still be tested.
- The latest recorded Forced March event expands for review while the next GM hour decision is pending. Continue / Pause closes it; previously opened historical entries remain available.
- Removed the duplicate public Forced March awaiting-decision briefing; the active hex header remains the single pending-action summary.
- Confirm live Foundry V13 and Dice So Nice player/GM behavior, especially mixed rolling modes, retries and disconnects.


## 0.4.0-dev.59 — semantic roll outcome colors and hex roles display
- Hex Travel setup shows the assigned actor portrait, role and skill inside three gently raised theme-aware category surfaces. Only Guide is marked as active roll.
- Navigation Ruling distinguishes actual roll outcome from the selected GM override; preview updates when the select changes.
- Expedition Log colors original Guide roll context, individual live and archived Forced March names, Passed/Failed labels, and textual GM outcomes. Original d20 red artwork and white numerical contrast retained.
- Uses the existing theme success/failure/muted CSS variables and preserves all calculation, actor assignment, history, and socket behavior. Local browser/syntax tests are not live Foundry verification.
- Generic travel hex role-check tallies and Quiet Travel recovery results also use semantic success/failure classes (native chat color fallback when theme variables are not in scope).


## 0.4.0-dev.62 | Exhaustion regression acceptance

Environment: Foundry V13.351, D&D5e 5.2.5. Begin from a test Actor or backed-up world Actor.

1. From the GM expedition roster, set exhaustion from `0 -> 2`. Confirm native effect `dnd5eexhaustion0` exists at level 2 and the sheet and roster both show 2. No `Exhaustion update not confirmed` warning.
2. Set `2 -> 0`. Confirm the effect is gone and the sheet/roster both show 0. No `ActiveEffect ... does not exist` warning.
3. Test `1 -> 3` and an unchanged-level selection. Ensure only one native exhaustion effect exists and no duplicate actor updates.
4. Process a failed Forced March CON save with GM adjudication to add exhaustion; verify exhaustion reflects the D&D5e system result and logged GM decision.
5. Test a character sheet reopen or client refresh and verify the level persists and the roster reflects it. For any failure capture expanded `[ZFT][Ironrot] Exhaustion update not confirmed` details (requested, observed, source, nativeEffectPresent, nativeEffectLevel).
6. Regression: Guide navigation, paired-role layout, buttons, log history, and chat message author warning remain as in `.61`.

These are LIVE checks for the owner. Local JavaScript/ZIP validations and mocked native asynchronous tests do not establish in-world acceptance. No GitHub writes.


## 0.4.0-dev.63 | Hex Travel Engine and difficulty (live tests pending)

1. Back up world settings and install over .62. Confirm active ledger, in-progress hex, saved travel days and log cards, role assignments, client theme/position/scale, and party attendance are intact on GM and player clients. Repeat reload; migration must be idempotent.
2. Start a new hex with Custom DC 15. Verify Guide Midi-QOL shows DC 15, adjudication and log show 15, and a saved record retains the method. Repeat using Custom DC 22, then confirm new hex defaults back to Custom 15.
3. Use Terrain Forest + Region Wild to get DC 16. Change to Mountains + Cataclysmic for DC 22. Confirm live preview, Guide request, GM ruling, and saved log all agree.
4. Cancel Hex Travel setup: no new roll, hex, or saved state. Try invalid Custom DC and verify no roll proceeds.
5. Test Forced March (including exhaustion 0->2 and 2->0) and resume unfinished hex; no change to Constitution save DC or dice/pace formulas.
6. Verify all five color themes, three windows, dialog stacking, responsive UI and player/pending-roll recovery. No Ironrot named active IDs or CSS selectors should remain.

Status: Local packaging and simulated tests only. Foundry V13 GM/player live verification required; V14 is not certified.

## 0.4.0-dev.64 | Migration recovery acceptance (2026-10-28)

**Observed dev.63 failure:** GM client on Foundry V13.351 / D&D5e 5.2.5 displayed `[ZFT][HexTravel] World/client settings migration failed; workspace not initialized.` before Dashboard initialization. `renderChatMessage` deprecation warnings in the same log are unrelated.

1. Backup world/settings before upgrading. Install complete .64 package, refresh GM client. Confirm Dashboard / GM Controls / Expedition Log load and previously saved travel day, hours, pending hex, role assignments, attendance, history, themes and window preferences are retained. Confirm no migration failure notification.
2. Refresh again. Confirm migration does not reapply old data or reset any changed values; no duplicate historical cards.
3. Log in as player on a separate browser. Confirm read-only Dashboard and client UI settings load and no player-client attempt to write world settings.
4. Test fresh world with no historical keys; workspace must load without creating unnecessary saved data.
5. Simulate client storage failure in isolation: warning may appear, but world migration and Dashboard must still initialize (client UI may temporarily use defaults). If world ledger migration fails, abort safely and inspect cause without touching the old ledger.
6. Confirm Custom DC 15/22, Forest + Wild DC 16, persisted per-hex DC/log, Guide remote rolls, Forced March exhaustion, docking/scale/themes and attendance. These gameplay regressions remain **NOT TESTED in live .64** until verified in Foundry.

## 0.4.0-dev.65 | Difficulty layout and GM prompt toggle live checklist

1. With dev.65 installed, GM click Start / Continue once. Confirm initial Hex Travel form opens; click Start / Continue again. The form must close without a saved travel-day, pending-hour, hex count, role, or log change. Click a third time to reopen.
2. In New Travel Day, click twice to open then close confirmation; verify day/hour/pending ledger unchanged. Reopen and confirm the new day: existing behavior should increment day, reset today's hours and proceed to travel setup.
3. Verify switching difficulty modes using mouse and keyboard; default Custom DC 15, Custom DC 22, Forest + Wild DC 16, Mountains + Cataclysmic DC 22. Both fields in a row at normal width, stacked at narrow width, and result updates without roll.
4. Confirm closing a setup with values entered does not alter ledger/history. Verify after starting a Guide roll, Start / Continue will NOT interrupt in-flight roll/retry or Forced March. New Travel Day also cannot cancel active rolling or adjudication.
5. Verify normal Hex Travel success/failure, Midi-QOL requested DC and adjudication, persisted log DC per hex, roster role assignments after refresh, theme colors, dock/undock, attendance and player Dashboard.
6. Confirm dev.64 world/client setting migration remains successful, including refresh and partial prior migration. Original Chapter 4 source and packs unchanged. All listed checks require owner live Foundry verification; local static/simulated validation is not live certification.


## 0.4.0-dev.66 | Current hex HUD, difficulty draft, quiet cancellation

- GM client: choose Custom DC 22, then toggle Start / Continue off and on; the Custom method and value must remain. Choose Mountains + Cataclysmic, close and reopen; the mode/terrain/danger must restore and preview DC 22. Switch back to Custom; its prior 22 must still be available. Refresh Foundry and repeat on that GM client. Verify other clients have independent preferences.
- Difficulty draft preferences are a hidden **client** setting; they never change the in-progress hex, previously saved per-hex difficulty, or live ledger. Only Prompt Guide Roll uses the selected difficulty for a new hex. Test missing/invalid stored preference values and an incomplete custom DC entry: recover to valid defaults/last valid value without starting a roll.
- Dashboard at a partially completed hex (e.g. 5 of 6 hours) shows Hex time remaining 1h and Safe time left 0h independently. Current hex progress bar remains only on Dashboard. Log still shows Hex N in progress and saved Navigation/Travel Dice, but no second bar or 1h-left header. Test completed hex and pending hex across New Travel Day and reload.
- Open New Travel Day, click Cancel or its toolbar button again: no purple info toast, no day/hour/ledger change. Confirm Start New Travel Day still advances the day, and real errors or successful actions still notify.
- Regression: custom/terrain DC is applied to Midi-QOL roll, GM adjudication and saved per-hex metadata; Forced March CON DC, pace, exhaustion, roster, multi-client history, theme/color, migration and original v4.13 source/packs unchanged.
- Validation: local/static checks only; live GM/player Foundry V13.351 / D&D5e 5.2.5 acceptance remains pending.


## 0.4.0-dev.67 | GM New Travel Day time/Rest Recovery (live tests pending)

1. Open New Travel Day; verify compact Day N → N+1, hours reset, pending hex preserved, no time jump selected, Rest Recovery unchecked. Click same toolbar button or Cancel: day and worldTime unchanged.
2. Set 6 PM world time with supported calendar and choose custom 11 PM. Preview shows +5h. Confirm: worldTime +5h (bedtime), day increments once, hours reset, hex remainder retained. No extra 8 hours added.
3. Choose next sunrise, sunset, midday or midnight. Check seasonal Calendaria times and next occurrence selection; the next occurrence is tomorrow when the target time has already passed. Unsupported sunrise/sunset disabled. Test missing Calendaria and missing Rest Recovery.
4. With Rest Recovery installed, check Open Rest Recovery: time advances to bedtime *before* its GM interface opens; choose Long Rest and selected party members. Verify healing/spells/exhaustion are owned solely by Rest Recovery; any rest-duration clock advancement comes from Rest Recovery settings, not from ZFT. Canceling the Rest Recovery UI is **not** a completed rest. No overlapping Guide prompt.
5. If the time advance fails, the ledger must not increment. If Rest Recovery UI fails after the clock/ledger advance, show an error without retrying the clock jump.
6. After a rest spans midnight, ensure the new travel day captures the post-rest calendar date on the next travel event (earlier expedition-day dates remain immutable).
7. Regression: GM/player opening, surviving migration, roster, prior DC, log, pending hours, Forced March, owner rolls, theme layouts and original source.


## 0.4.0-dev.68 | Optional Hex Travel world-time sync and checkbox layout

Prerequisites: Back up world before test. Foundry V13.351 / D&D5e 5.2.5; Calendaria and Rest Recovery optional. Compare world time before and after each action.

1. **OFF by default:** ZFT Overland Travel module setting `Advance world time during Hex Travel` unchecked. Finish a 3h hex; world clock must not change.
2. **ON, safe hours:** Enable setting and start a new hex with safe hours available. For 6h completed, clock advances exactly 6h, ledger counts 6h, and only one complete log card remains. Verify Calendaria date/time.
3. **Partial hex and next day:** Travel a 6h hex while only 2 safe hours remain. Clock advances 2h; after pausing/resuming the next day, completed hours are not added again. Complete remaining 4h; total world advance is 6h, not 10h.
4. **Forced March:** Starting with 8h today, complete a GM-adjudicated forced hour. Clock advances only after all CON decisions resolve and exactly 1h. Cancel/pause before adjudication: no clock advance; previous actor decisions remain saved.
5. **Interrupted clock transaction:** Simulate/fail a time API call in a disposable test world after travel ledger saves. Ledger shows `clockSyncPending`; on resume, the GM is prompted to reconcile. Choosing Cancel must not move time; retry only offered safely when world time equals original, or mark already accounted for after independently verifying the clock. No automatic double advance.
6. **New day, bedtime and Long Rest:** With world-time sync ON, travel hours advance world clock; starting New Travel Day with custom bedtime advances only the idle-time gap, then Rest Recovery owns the entire Long Rest (no extra ZFT 8h).
7. **Checkbox style:** Toggle Rest Recovery checked/unchecked on all ZFT themes at narrow/regular widths. Checkbox stays aligned to text, with no overlap.
8. **Regression:** Roster, exhaustion, past cards, migration, preferences and New Travel Day cancellation unchanged. Test both GM and player clients.

**Local tests are not live Foundry acceptance.**


## v0.4.0-dev.69 | GM setup density, New Day preferences and rest label

1. Open Hex Travel at standard and narrow widths. Confirm Custom DC and Terrain + Danger still compute the same values; the clock checkbox updates `hexTravelAdvanceWorldTime` even if the GM cancels.
2. Switch Custom DC to 22; close/reopen and verify saved choices and clock state. No changes to the travel ledger until a Guide roll proceeds.
3. New Travel Day: select Custom bedtime 11:35 PM and Rest Recovery checked; cancel, reopen, and refresh. Confirm time target/hour/minute/AM-PM/check state persist without time or day changes.
4. Change time target to sunset, cancel, reopen and verify sunset persists. If Calendaria sunrise/sunset is unavailable, the selector falls back to None without an automatic jump.
5. With Rest Recovery disabled, checkbox is disabled and no rest is triggered; existing saved preference should not be erased.
6. Check Rest Recovery checkbox geometry (checked and unchecked) across all five themes and narrow widths: icon left, descriptive text right, no overlap/overflow.
7. Continue normal travel, partial hex, Forced March, New Travel Day time jump and optional Rest Recovery handoff, confirming no duplicate clock changes or exhaustion.

All live cases remain NOT TESTED until exercised in Foundry.


## 0.4.0-dev.70 | Read-only expedition time display

1. GM and player open Dashboard: clock must match Foundry/Calendaria time and the current date must retain the campaign calendar year, independent of expedition day.
2. Change world clock directly in Calendaria, then use New Travel Day and Hex Travel sync: time/date labels update without repainting ledger/roster/log or modifying saved events.
3. In a current partially traveled hex with saved duration: verify the arrival estimate uses only remaining hours; crossing midnight shows tomorrow, and night travel warns without imposing mechanics.
4. After hex completes, ETA becomes unavailable. Without Calendaria, no invented sunrise/sunset. Custom calendars with non-24h days show unsupported rather than an incorrect ETA.
5. Collapse/reopen dashboard, reconnect player client, and resize narrow panes: header must remain readable; all five themes should render without overlap.
6. Regression: original migration, world clock checkpoint, Forced March, Rest Recovery and GM roles remain unchanged. Live verification pending.


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

## 0.4.0-dev.73 | GM toast, local audio, and day-change log state

1. As GM, with the Dashboard and Log open, complete the final travel hour (including a Forced March finish). Confirm Hex N Complete is visible above the Foundry windows, dissolves in and out, and does not recur on refresh. Confirm no popup after merely rolling dice for an unfinished hex.
2. Toggle Hex Travel audio cues ON in Module Settings (client) and set volume to 0.35. Confirm navigation success/failure and Forced March first-decision cues and one completion chime, all GM-only. Set volume to 0 or disable cues and confirm silence. Check a connected player does not hear them.
3. Expand the current day, confirm New Travel Day, and verify the previous day automatically collapses and the new day expands; repeat with Rest Recovery handoff. Manually expand prior day afterward; it remains accessible. Cancel a New Travel Day dialog and confirm log state is unchanged.
4. Refresh GM and player clients. Ensure original past log entries, cross-day hex progress, exhaustion/Forced March outcomes, all five themes and current Calendaria time remain correct.

Local tests do not constitute Foundry live acceptance.

## 0.4.0-dev.74 | Live test plan: no-travel dates and dismissal

1. Start a new day with Rest Recovery. Confirm the new day is provisional until the world time changes; after a rest that crosses midnight, expect the current Log date to update immediately without initiating a Guide roll.
2. Start a subsequent new day without traveling on the prior one. Expect the earlier zero-activity day to retain the real calendar date (not `Date not recorded`), even after reconnect/reload.
3. Repeat with Rest Recovery disabled and the no-clock-advance option. The new day captures its active calendar date without changing Foundry time.
4. Cancel New Travel Day. Confirm no ledger, current date, or history mutations.
5. Finish a hex, click the toast to dismiss, repeat with Enter/Space/Escape, and separately let it dissolve after ten seconds. Confirm no duplicate popups after reload or Log refresh.
6. In the New Travel Day form, confirm old/new daily hours are differentiated, unfinished hex hours retained, and `(next calendar day)` appears on a separate colored line when relevant.

Static test results are not Foundry live acceptance. Keep dev.73 ZIP and a world backup for rollback.

## 0.4.0-dev.75 | Live test plan: multi-client Hex Complete

1. Open the same world as GM and as a player; ensure ZFT Overland Travel is active on both. Complete a fresh hex fully (not merely roll the dice). **PASS** if the GM sees a persistent Hex Complete notice, player sees a separate message, and both reflect the same hex number. **FAIL** for missing or duplicate notices.
2. Leave the GM notice untouched for more than 10 seconds, then refresh the GM client. **PASS** if the same pending notice returns; dismiss it and refresh again. **PASS** if the dismissed notice does not return.
3. Leave the player notice untouched. **PASS** if it disappears after about 10 seconds. Repeat and click to dismiss immediately; ensure no duplicate.
4. While the GM has an undismissed notice, complete a second hex. **PASS** if the first notice stays visible and the second appears on dismissal, rather than replacing it.
5. Have a player reload or join after a hex has already completed. **PASS** if no historical announcement replays. Test with and without optional sound enabled; only GM receives sound.
6. Verify time accounting, navigation, Forced March, rest, Log collapse, day dates, five themes, and existing history are unchanged. Restore dev.74 and world backup if needed.

These are acceptance steps, not claims that a live world has been tested.

## 0.4.0-dev.76 | Live test plan: clean Hex Complete notification

1. Complete a hex while GM and player are connected. **PASS** if both see the completion card with no upper-right X.
2. As GM, click anywhere on the notice and confirm dismissal; repeat using Enter, Space, and Escape while notice is focused. **PASS** if acknowledged notices stay dismissed after refresh.
3. Leave a GM notice untouched beyond 10 seconds and refresh. **PASS** if it remains visible and restores after refresh.
4. Leave a player notice untouched for 10 seconds; repeat by clicking. **PASS** if it auto-dismisses or responds to a click, with no historical replay.
5. Verify queued GM notices, the dissolve effect, audio defaults, and narrow viewport layout. Confirm travel logs, daily hours, clock, existing data, and rest processing remain unchanged.

Local/static validation is not live Foundry acceptance.

## 0.4.0-dev.77 | In-world confirmation tests

1. With an active unfinished hex (e.g., 3h remaining) and sufficient daily safe hours, click Start / Continue. A confirmation should appear showing remaining hours and expected completion, **before** any world-setting or calendar change.
2. Click Cancel, reopen Start / Continue, and verify the same remaining hours, same clock, and the same prompt. Escape also cancels without changes.
3. Confirm Continue Traveling. The existing engine should commit only the remaining hours, advance the clock **once** if synchronization is on, preserve cross-day history, and show Hex Complete only after the final save.
4. With fewer safe hours available than the hex requires, confirm the prompt correctly explains the following Forced March decision. Cancel that Forced March and verify any still-unfinished hours remain saved.
5. Reset/change the expedition ledger while the resume confirmation is open, then confirm. The old suspended workflow must refuse to commit stale hours.
6. Repeat in another GM client and with connected players, and verify no new travel events or notifications are emitted on Cancel. Test all five themes and narrow workflow widths.

The above are live acceptance steps; local tests are not a replacement. No GitHub write.
