# Expedition System Design 1.1 Draft

**Status:** Approved design checkpoint through the Complication Engine foundation. Design-only unless a section explicitly says it is already implemented in dev.87/dev.88.

**Module:** ZFT Overland Travel  
**Repository:** `LuvacZantor/zft-overland-travel`  
**Working implementation baseline:** local `0.4.0-dev.88`  
**GitHub feature checkpoint:** `feature/expedition-system` with the complete `0.4.0-dev.88` source and this design checkpoint; use current branch HEAD  
**Live target:** Foundry V13.351 / D&D5e 5.2.5. Live acceptance remains pending.

## Implemented baseline before this design checkpoint

### dev.87
Created the persistent per-travel-sequence shared record. It freezes expedition context, party/role assignments, Navigation resolution, travel dice, daily committed hours, remaining hours, status/corrections, and phase state. The travel ledger remains authoritative for committed hours and world-clock changes. Geographic map identity remains separate.

### dev.88
Added the two remaining paired expedition-role stages using the frozen dev.87 record:

- Reconnaissance: Scout = Stealth (DEX), Tracker = Investigation (INT)
- Expedition Support: Forager = Survival (WIS), Coordinator = Persuasion (CHA)

Rolls use the frozen party/assignments/DC, preserve original and effective outcomes, and allow independent GM accept/override adjudication. The Roles tab presents Navigation, Reconnaissance, and Support. No Travel Quality, Momentum, Event, Threat, Discovery, Complication, Encounter, travel-hour, clock, Forced March, Exhaustion, theme, pack, asset, or Mount Ironrot implementation changes were part of dev.88.

Prior validation record: 42/42 tests and 46 JS/MJS syntax checks passed. This remains local/simulated evidence, not live Foundry acceptance.

---

# 1. Staged expedition workflow

Approved order:

1. Navigation
2. Reconnaissance
3. Expedition Support
4. Travel Quality
5. Momentum
6. Event
7. Event Resolution

Paired role checks occur concurrently within their stage.

A single shared hex/travel-sequence record carries the frozen context, assignments, rolls, GM adjudication, planned duration, later engine results, and phase state.

## Planned vs committed time

**Planned travel time and committed travel time are separate concepts.**

Planning stages may calculate and revise the projected duration of the hex without changing the travel ledger or world clock.

Only the later travel-commit workflow may convert planned hours into committed travel hours.

Complication delays therefore modify **planned** travel time only until the party actually commits those hours through the existing travel workflow.

---

# 2. Navigation

Roles:

- Guide: Survival (WIS)
- Vanguard: Athletics (STR)

Both use the same GM-selected Navigation DC.

Each failed Navigation role adds its own `1d4` delay to the existing base travel calculation. An absent/unassigned Vanguard is unassisted, not an automatic failure.

An unfinished hex resumes the saved planned/remaining travel state and does not reroll Navigation.

---

# 3. Reconnaissance

Roles:

- Scout: Stealth (DEX)
- Tracker: Investigation (INT)

Reconnaissance is an **information layer**, not a numeric bonus layer.

Combined information state:

- Both succeed: **Full Intelligence**
- One succeeds: **Partial Intelligence**
- Neither succeeds: **No Advance Intelligence**

For Complications:

- Full Intelligence: category, actual situation, Threat-bearing status, and likely consequence are known before response.
- Partial Intelligence: category plus an appropriate warning/clue, but not the complete situation/consequence.
- No Advance Intelligence: the complication is discovered when the party reaches it.

Reconnaissance does not grant generic advantage, `+2`, automatic success, or another persistent track.

---

# 4. Expedition Support

Roles:

- Forager: Survival (WIS)
- Coordinator: Persuasion (CHA)

Forager represents provisions/supplies. Coordinator represents expedition readiness, **not morale**.

Combined descriptive state may be:

- Both succeed: Well Supported
- Forager only: Supplied
- Coordinator only: Ready
- Neither: Strained

For Complication resolution, the mechanical interpretation is hex-local:

- Forager success creates **Supply Readiness**
- Coordinator success creates **Operational Readiness**

Each readiness can mitigate one logically relevant consequence at most once during that hex.

They do not create generic bonuses, do not create a persistent Support track, and do not modify Travel Quality, Momentum, or the Event Roll.

Mitigation reduces an applicable consequence by one tier, minimum Tier 0. It does not rewrite the original adjudicated roll outcome.

---

# 5. Travel Quality

Each participating role result contributes:

| Individual result | Contribution |
| --- | --- |
| DC +5 or more | 2 success points |
| DC through DC +4 | 1 success point |
| Miss by 1–4 | 1 failure point |
| Miss by 5 or more | 2 failure points |
| Absent / unassigned | 0 |

A GM binary override contributes 1 point to the selected side rather than inventing a margin.

Party Travel Quality:

- successes > failures: **Successful**
- successes = failures: **Neutral**
- failures > successes: **Poor**

Travel Quality has no direct Event modifier beyond its effect on Momentum.

---

# 6. Momentum

Canonical track:

`Deteriorating → Risky → Neutral → Prepared → Favored`

Travel Quality shifts Momentum once per hex:

- Successful: one step better
- Neutral: unchanged
- Poor: one step worse

No additional Momentum-derived tracks or hidden bonuses are introduced.

---

# 7. Event Chart

Roll:

`1d20 + Momentum modifier`

Clamp final result to 1–20.

Momentum modifiers:

| Momentum | Modifier |
| --- | ---: |
| Favored | +2 |
| Prepared | +1 |
| Neutral | 0 |
| Risky | -1 |
| Deteriorating | -2 |

Final Event Chart:

| Final d20 | Event |
| ---: | --- |
| 1–5 | Major Complication |
| 6–10 | Complication |
| 11–15 | Quiet Travel |
| 16–20 | Opportunity |

These are the four authoritative Event results for Expedition System Design 1.1.

**Major Complication** uses the same Complication content library as Complication, but resolves using the Major severity column of the shared consequence ladder. **Complication** uses Standard severity.

Threat is **downstream state, not an Event Chart result**. A Complication or Major Complication may be Threat-bearing and can later hand off to the Threat Engine. Opportunity is expected to lead into Discovery. The detailed Opportunity/Discovery, Threat, and Encounter engines are not fully designed in this checkpoint.

---

# 8. Complication Engine

## Core principle

A Complication creates a problem that must be resolved before planned travel is committed.

Reconnaissance determines how much the expedition knows before confronting it.

Expedition Support may mitigate appropriate consequences.

The Complication itself does not change Travel Quality or Momentum after those stages have already resolved.

Threat-bearing Complications may create or interact with persistent Threat, but the detailed Threat Engine is intentionally deferred.

## Categories

1. Navigation
2. Environment
3. Resources
4. Omen
5. Social
6. Magical / Strange

## Content structure

Each category uses:

`d8 primary complication type → d8 detail result`

This produces 64 detail combinations per category and 384 across all six categories before terrain/context changes presentation.

The content is structured improv support, not a scripted encounter and not a forced solution list.

Each result should provide:

- Situation
- Standard framing
- Major framing
- 2–4 example approaches
- Strong Success guidance
- Success guidance
- Failure guidance
- Major Failure guidance
- consequence tags
- Support applicability
- Threat eligibility

Players may use any plausible response. The GM chooses the relevant ability check, skill, tool, save, spell/resource expenditure, roleplay resolution, or no roll when appropriate.

## Standard vs Major

The Event Chart determines which severity column is used:

- **Complication** → Standard severity
- **Major Complication** → Major severity

Standard and Major use the **same rolled content result**.

Major increases scope, persistence, stakes, or consequence rather than substituting a separate unrelated table.

Shared consequence tier mapping:

| Outcome | Standard | Major |
| --- | ---: | ---: |
| Strong Success | Tier 0 | Tier 1 |
| Success | Tier 1 | Tier 2 |
| Failure | Tier 2 | Tier 3 |
| Major Failure | Tier 3 | Tier 4 |

Applicable Supply/Operational Readiness reduces the final consequence one tier, minimum Tier 0.

## Category consequence identity

### Navigation
Primary consequence: added planned travel time.

| Tier | Consequence |
| ---: | --- |
| 0 | No additional planned time |
| 1 | +1 hour |
| 2 | +1d4 hours |
| 3 | +2d4 hours |
| 4 | +2d4 hours plus the entry's secondary setback |

### Environment
Uses the consequence channel that actually fits the rolled entry: time, supplies, or exposure.

| Tier | Consequence |
| ---: | --- |
| 0 | No meaningful consequence |
| 1 | +1 hour or 1 relevant supply unit |
| 2 | +1d4 hours or 1d4 relevant supply units |
| 3 | +1d4 hours plus 1d4 supplies, or the entry's defined exposure/hazard effect |
| 4 | +2d4 hours plus a significant exposure/hazard effect and logically required resource loss |

The Journal entry constrains which channels make sense. Do not apply irrelevant losses merely because the generic ladder permits them.

### Resources

A resource unit is the smallest meaningful unit of the affected supply: ration, waterskin-equivalent, healer's-kit use, fuel unit, etc.

| Tier | Consequence |
| ---: | --- |
| 0 | No loss |
| 1 | Lose/use 1 unit or require trivial repair |
| 2 | Lose/use 1d4 units or meaningful repair |
| 3 | Lose/use 2d4 units, or important item/mount temporarily unusable |
| 4 | 2d4-unit loss plus serious shortage, key equipment failure, lost carrying capability, or need to resupply |

### Omen
Primary consequence is warning quality and Threat exposure, not automatic time loss.

| Tier | Consequence |
| ---: | --- |
| 0 | Precise warning: nature/source, direction, and urgency understood |
| 1 | Clear warning sufficient for an informed decision |
| 2 | Partial warning; an important fact remains unknown |
| 3 | Late warning; danger understood only after exposure |
| 4 | Compromised warning; evidence misleads, danger detects the party, or contact becomes imminent |

### Social

| Tier | Consequence |
| ---: | --- |
| 0 | Favorable resolution; no meaningful cost |
| 1 | Brief delay or nominal concession |
| 2 | +1d4 hours, modest payment/resource concession, or minor obligation |
| 3 | +2d4 hours, substantial concession, access restriction, or meaningful faction consequence |
| 4 | Goal/passage blocked without a new plan, serious faction consequence, pursuit/detention, or escalation toward confrontation |

### Magical / Strange

| Tier | Consequence |
| ---: | --- |
| 0 | Anomaly avoided, understood, or neutralized |
| 1 | +1 hour or harmless/brief magical disruption |
| 2 | +1d4 hours or one meaningful temporary magical interference |
| 3 | +2d4 hours plus a defined magical effect such as displacement, suppression, condition, or resource drain |
| 4 | +2d4 hours plus severe anomaly effect, major displacement, dangerous magical condition, or Threat escalation where appropriate |

## Threat-bearing complications

Threat eligibility is content metadata, not a separate complication category.

General tendency:

- Navigation: conditional
- Environment: conditional when the hazard is active/escalating
- Resources: uncommon
- Omen: most likely
- Social: conditional when hostility/pursuit/coercion develops
- Magical / Strange: conditional when the phenomenon is active, harmful, aware, or escalating

Detailed Threat persistence and transition behavior belongs to the later Threat Engine design.

## Encounter separation

Complications do not contain prebuilt encounters.

A complication may later hand off to the Encounter Engine through:

1. Threat reaching its Encounter trigger, or
2. GM decision that the situation has become a direct confrontation.

The Encounter Engine remains responsible for generating/resolving the direct encounter.

---

# 9. Planned content architecture

The Complication content library should ultimately be **Journal/compendium-backed**, not hard-coded as prose in JavaScript.

The module code should own rules/state transitions. The content library should own editable situation text and GM guidance.

Stable structured metadata should accompany readable Journal content, including:

- `category`
- `primaryType`
- `detailId`
- `severity`
- `consequenceTags`
- `supportTags`
- `threatEligible`
- `suggestedApproaches`
- `outcomeGuidance`

Stable IDs should be used so user-editable content can be referenced without depending on display-name matching.

---

# 10. Complication content library

The complete first-pass 384-detail library is maintained separately in:

`docs/COMPLICATION_CONTENT_LIBRARY_DRAFT.md`

That library is approved as a **draft content set for eventual implementation and live review**, not as immutable final prose.

---

# 11. Next design target

Continue with **Quiet Travel**.

After Quiet Travel:

1. Opportunity / Discovery
2. Threat
3. Encounter

Do not implement the remaining design-only systems merely because they are documented here. Build implementation only after the relevant design is settled and the owner requests it.
