# Shared Hex Travel Records

## Scope of 0.4.0-dev.87

This build adds a persistent record for each newly committed hex travel sequence. The GM continues to select the conditions manually. The record has no map coordinates and does not discover terrain, identify a map tile, or remember a geographic location for a later visit.

## Dev.88 role-resolution extension

Dev.88 keeps schema 1 and the same `hexTravelLedger.hexRecords` owner. New records start `phases.reconnaissance` and `phases.support` as `pending`; dev.87 records whose values are `notImplemented` remain valid and can transition directly to `completed` when the GM resolves them. No migration fabricates old rolls.

Completed paired-role data is stored under `record.roles.reconnaissance` and `record.roles.support`. Each phase stores the saved DC, resolution timestamp, pair grade, and two role slots. A checked slot retains Actor identity, fixed skill/ability, original total, original `rolledSuccess`, GM `ruling`, effective `success`, margin, and roller ID. Unassigned or start-of-hex absent slots are recorded as such without a roll. Role resolution writes only the record collection within the current ledger and does not change travel hours, clock checkpoints, Exhaustion, Travel Quality, Momentum, Threat, supplies, or Events.

The Roles tab is a read-only view of these same records; it is not a second persistence source.

The record is an additive `hexRecords` collection inside the existing `zft-overland-travel.hexTravelLedger` world setting. The existing ledger remains authoritative for committed hours, pending hours, Forced March, and clock reconciliation. Record progress is saved in the same ledger checkpoint as those travel hours. No independent world-time writer or new world setting is introduced.

The standalone generic Travel Manager, its expedition state, all remaining role mechanics, Travel Quality, Momentum, Threat, and event resolution retain their existing behavior. Future phases are explicitly `notImplemented`; this build does not roll an event, grant a benefit, or execute those phases.

## Baseline and preservation

- GitHub baseline: `LuvacZantor/zft-overland-travel`, `feature/expedition-system`, commit `caccc9f1acd46b97f05c8e60813bfc7efc871fcc`, version `0.4.0-dev.86`.
- Owner-supplied installed package: `zft-overland-travel(5).zip`, SHA256 `991e260ab9e77a14eb3a41c3f1b88bc777e92fbde35a38387b4beab17c81a884`.
- All common runtime, pack, asset, and rules files in that package match the GitHub baseline byte for byte. Its handoff was an older dev.78 document, retained in `docs/history/INSTALLED_DEV86_HANDOFF.md`.
- The uploaded package also contains five unreferenced older source files. They are retained verbatim: `HexTravelRoleChecks.js` and the four legacy Mount Ironrot files `IronrotConsole.js`, `IronrotDice.js`, `IronrotRoles.js`, and `MountIronrot.js`. They are not imported or activated by this change.
- Original `MountIronrotV413.source.js`, all `packs/`, all `assets/`, themes, fixed role skills, and existing generic engines are preserved.

## Record lifecycle

1. Opening the new-hex setup, selecting conditions, and rolling Navigation retain the existing behavior. No durable shared record is created by opening or canceling a prompt.
2. After the GM confirms Navigation and the existing travel dice are evaluated, the first saved pending-hours checkpoint creates one record with the existing stable hex-card ID.
3. Safe travel and each fully adjudicated Forced March hour update the matching record from actual `hexHourSegments`, immediately before the existing ledger/clock checkpoint.
4. Pausing or canceling unfinished-hex continuation retains the record. New Travel Day preserves its ID, original selections, and results. Later travel hours are associated with the new expedition day.
5. Travel is complete only when its committed hours account for its rolled duration and its pending hours reach zero. A display card's `complete` stage only means travel dice are ready and is not used as the completion trigger.
6. Completed records remain in the collection. The 15-card display limit and the generic engine's 50-entry history limit do not truncate shared records.

The stored `createdAt`, `completedAt`, and correction timestamps are real-world audit times from `Date.now()`. They are not fabricated in-game arrival timestamps. A completed travel record can coexist with `clockSyncPending`; the existing GM clock-reconciliation workflow still owns that situation.

### Existing travel and manual corrections

Pre-dev.87 completed or unfinished travel is not automatically backfilled. Its original details may be incomplete, and current preferences may differ from those used to begin it. Such travel continues normally with no invented record and no repeated Navigation checks. The first new hex begun with dev.87 or later creates the first complete record.

Both manual ledger editors preserve existing records. The previously active record is marked `interrupted`, with the entered before/after counters retained as a correction. The existing editor clears the active hex association; subsequent manually entered pending hours are not falsely attributed to the old sequence.

Clear Expedition Log retains the ledger and its records. Explicit Reset Travel clears the record collection together with the rest of the expedition's travel data. Canceling either action retains the existing data.

## Data contract

The ledger field has shape `{ schema: 1, records: [...] }`. Each record contains:

| Field | Meaning |
| --- | --- |
| `schema`, `id`, `number` | Record format, stable sequence ID, and display sequence number |
| `createdAt`, `completedAt`, `start` | Audit times and starting expedition day/hour |
| `context.identity` | Expedition display identity selected at the start |
| `context.difficulty` | Exact selected Custom DC or Terrain + Danger result |
| `context.pace` | Selected pace ID, label, and multiplier |
| `context.party`, `context.assignments` | Present actor UUID/name snapshots and saved role assignments |
| `navigation` | Original check totals, rolled pass/fail, GM rulings, effective outcomes, role skills, roller IDs, and saved delays |
| `travel` | Original dice/calculation, rolled hours, committed hours, remaining hours, per-day segments, and status |
| `status` | `inProgress`, `completed`, or `interrupted` for this travel sequence |
| `phases` | Navigation/travel status; Reconnaissance/Support are `pending` or `completed` in dev.88 (legacy dev.87 may say `notImplemented`); later phases remain `notImplemented` |
| `roles` | Optional dev.88 saved Reconnaissance/Support resolutions, including original totals and effective GM outcomes |
| `corrections` | Manual correction history when the active sequence was detached |

Custom DC deliberately keeps terrain and danger `null`, exactly as the existing difficulty selection does. This build does not infer them from the description, scene, token, previous hex, or a preference default.

The input context is frozen when the GM submits new-hex setup. Later role, attendance, name, or difficulty-preference changes do not retroactively rewrite the saved context. Unsupported record schemas or malformed record collections fail clearly instead of being replaced with empty data.

## Public read API

Available after the module's normal ready hook:

```js
game.zftOverlandTravel.hexRecords.current(); // Active recorded sequence, or null
game.zftOverlandTravel.hexRecords.latest();  // Most recently created record, or null
game.zftOverlandTravel.hexRecords.get(id);   // Exact stable sequence ID, or null
game.zftOverlandTravel.hexRecords.list();    // All saved sequence records
game.zftOverlandTravel.hexRecords.inspect(); // Versions, ledger, current/latest record, clock checkpoint
```

These methods read settings and return independent copies. Changing a returned object does not edit the world. There is no public write endpoint. The display snapshot omits the records collection so it cannot become a second record authority.

## Live acceptance test

Use a copied test world and keep the supplied dev.86 package plus a pre-install world backup. Install the complete dev.88 ZIP into `Data/modules/` so the manifest is `Data/modules/zft-overland-travel/module.json`. Do not delete mutable compendiums or assets. Reload Foundry and the participating player client.

The established baseline is Foundry V13.351 / D&D5e 5.2.5 with active Midi-QOL and the existing required ZFT Tools integration. Test using the actual installed versions and include them in the result. No new Foundry V14 compatibility claim is made by this build.

### Read-only diagnostic

After each test below, open F12 and run:

```js
console.log(JSON.stringify(game.zftOverlandTravel.hexRecords.inspect(), null, 2));
```

This prints the module/core/system versions, ledger counters, number of records, current record, latest record, legacy-active indicator, and clock checkpoint. It does not change anything. Save the output or provide a screenshot of the relevant fields if a test fails.

| Test | Action | Expected result |
| --- | --- | --- |
| Upgrade preservation | Before starting new travel, inspect the existing dashboard, roles, themes, and log. Run the diagnostic. | Prior data remain. Zero records is expected on the first upgrade. Old unfinished travel may show `legacyActive: true`. |
| Setup cancellation | Open Start / Continue for a new hex and cancel. Also test canceling the GM Navigation review before travel time is rolled. | No record is created; travel counters and clock remain unchanged. Native Navigation rolls may remain in Foundry Chat as before. |
| New sequence | Start a new hex with explicitly chosen conditions and complete Navigation review. | One record appears. Conditions, pace, present party, role assignments, check totals, GM rulings, and travel dice match what was used. |
| Guaranteed pause | In the copied test world, before starting that new sequence, set Hours Today to 7 and Pending Hours to 0 through Edit Travel Ledger. Start a new hex, then choose Cancel / Exit at the Forced March decision. | Exactly one safe hour is added. The current record remains `inProgress`, has one committed hour, and retains the correct remaining duration. |
| Resume cancellation | Record the current ID and counters. Open Start / Continue for that unfinished hex and cancel its confirmation. | Same ID, record count, original rolls, committed/remaining hours, and world time. |
| Refresh and new day | Refresh GM/player clients, verify the same record, then confirm New Travel Day with no optional clock jump or rest. | Same active ID and original context. Daily hours reset; the record's committed and remaining travel hours are preserved. |
| Complete the crossing | Continue the unfinished hex. If safe hours run out, either adjudicate the remaining Forced March hours or repeat the pause/new-day path. | No repeated Navigation or travel dice. Day segments reflect actual hours. At completion, `current` is null and `latest.status` is `completed`; committed hours equal rolled hours and remaining hours are zero. |
| Start another hex | Begin a subsequent new hex with different selected conditions. | A different ID and one additional record. The earlier record retains its original conditions and results. |
| Forced March | Complete one forced hour through the existing party CON review, including a GM decision. | Exactly one hour is added to the associated record only after the hour is adjudicated. Existing save DCs and exhaustion behavior remain intact. |
| Clock option | Repeat a short sequence with the existing clock option enabled. | World time advances by committed travel hours exactly once. Creating or inspecting a record adds no clock movement. |
| Presentation and edits | In the copied world, clear the Expedition Log, then inspect records. Separately edit the active ledger and inspect its saved record. | Clear Log retains records. Ledger correction retains the old record as `interrupted` and removes its active association. |
| Explicit reset | In the copied world only, confirm Reset Travel with RESET. | Records and travel counters reset with the existing workflow. Actor exhaustion is handled exactly as before. |

For every tested row, report PASS or FAIL with the actual module/core/system versions. Local/simulated tests do not certify live Foundry, remote player dialogs, optional calendar/rest modules, or multi-GM concurrency. The new-hex checkpoint rejects a ledger that visibly changed during Navigation; it is not a general distributed lock or server-side compare-and-swap transaction.

## Rollback

The new field is additive; old ledger fields retain their existing format. However, dev.86's old hydration code does not preserve `hexRecords` on later ledger writes. For a complete rollback, restore the pre-install world backup together with dev.86. Merely downgrading the module may discard newly created dev.87 records on the next travel operation.

## Local verification

Run the included Node tests with:

```sh
node tests/hex-records.test.mjs
node tests/hex-records-integration.test.mjs
```

Validation evidence for dev.87 is in `docs/LOCAL_VALIDATION_DEV87.md`; dev.88 evidence is recorded in `docs/LOCAL_VALIDATION_DEV88.md`. Live acceptance remains pending until the owner tests the installed build.
