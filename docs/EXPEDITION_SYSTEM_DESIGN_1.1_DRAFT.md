# Expedition System Design 1.1 Draft

**Status:** Approved design checkpoint through the Threat Engine baseline. Dev.91 implements automatic orchestration of the staged role/outcome sequence, the explicit travel-commit boundary, Recovery controls, consolidated hex history, the dev.89 Travel Quality/Momentum/Event pipeline, Quiet Travel no-op, Event-resolution gate, and initial persistent multi-Threat framework; downstream specialized engines remain incomplete as noted.

**Module:** ZFT Overland Travel  
**Repository:** `LuvacZantor/zft-overland-travel`  
**Working implementation baseline:** `0.4.0-dev.91` local experimental build  
**GitHub development branch:** `feature/expedition-system-1.1` (remote branch currently still points to the frozen dev.88 checkpoint)  
**Verified GitHub checkpoint before this local design update:** `fca67c46e7c1ca5921a031645c9d9fa99063b469`  
**Live target:** Foundry V13.351 / D&D5e 5.2.5. Live acceptance remains pending.  
**Local build note:** dev.91 automatically proceeds through Reconnaissance → Expedition Support → Travel Quality → Momentum → Event after a hex is staged, while preserving a separate explicit **Commit Travel** boundary before any travel/world-time mutation. It also adds Recovery and consolidated Day → Hex history. Specialized Complication, Opportunity/Discovery, automatic Threat handoffs, and redesigned Encounter integration remain future work. This local implementation has not been pushed to the remote branch.

---

# 1. Implemented baseline

## dev.87

Created the persistent per-travel-sequence shared record. It freezes expedition context, party/role assignments, Navigation resolution, travel dice, daily committed hours, remaining hours, status/corrections, and phase state. The travel ledger remains authoritative for committed hours and world-clock changes. Geographic map identity remains separate.

## dev.88

Added the two remaining paired expedition-role stages using the frozen dev.87 record:

- Navigation: Guide = Survival (WIS), Vanguard = Athletics (STR)
- Reconnaissance: Scout = Stealth (DEX), Tracker = Investigation (INT)
- Expedition Support: Forager = Survival (WIS), Coordinator = Persuasion (CHA)

Reconnaissance and Expedition Support rolls use the frozen party/assignments/DC, preserve original and effective outcomes, and allow independent GM accept/override adjudication. The Roles tab presents Navigation, Reconnaissance, and Support.

No Travel Quality, Momentum, Event, Complication, Quiet Travel, Opportunity, Discovery, Threat, Encounter, travel-hour, clock, Forced March, Exhaustion, theme, pack, asset, or Mount Ironrot implementation changes were part of dev.88.

Prior validation record: 42/42 tests and 46 JS/MJS syntax checks passed. This is local/simulated evidence, not live Foundry acceptance.

---

# 2. Staged expedition workflow

Approved order:

1. Navigation
2. Reconnaissance
3. Expedition Support
4. Travel Quality
5. Momentum
6. Event
7. Event Resolution
8. Travel commitment through the existing travel/Forced March workflow

Paired role checks occur concurrently within their stage. In the normal dev.90 workflow, completion of Navigation/travel-dice staging automatically starts the first incomplete later stage and advances through the ordered sequence without requiring a separate Resolve Role Checks or Resolve Travel Outcome command. GM adjudication prompts remain explicit. If the normal sequence is interrupted, Recovery resumes from authoritative saved phase state and never rerolls a completed phase.

A single shared hex/travel-sequence record carries the frozen context, assignments, rolls, GM adjudication, planned duration, engine results, phase state, and later travel progress.

## Planned vs committed time

**Planned travel time and committed travel time are separate concepts.**

Planning and Event Resolution may revise projected duration without changing the travel ledger or Foundry world clock.

Only the explicit travel-commit workflow converts planned hours into committed travel hours. After Event Resolution, the GM deliberately uses the state-aware **Commit Travel** action for the first commitment or **Continue Travel** for later partial progress. Automatic completion of Expedition stages never advances the travel ledger or world clock by itself.

Therefore:

- Navigation delays modify planned travel time.
- Complication delays modify planned travel time.
- Optional Opportunity pursuit costs or route benefits may modify planned travel time.
- None of those operations directly advances the world clock.
- Once hours have been committed, later planning effects do not retroactively rewrite already committed history.

---

# 3. Navigation

Roles:

- Guide: Survival (WIS)
- Vanguard: Athletics (STR)

Both use the same GM-selected Navigation DC.

Each failed Navigation role adds its own `1d4` delay to the existing base travel calculation. An absent/unassigned Vanguard is unassisted, not an automatic failure.

An unfinished hex resumes the saved planned/remaining travel state and does not reroll Navigation.

---

# 4. Reconnaissance

Roles:

- Scout: Stealth (DEX)
- Tracker: Investigation (INT)

Reconnaissance is an **information layer**, not a numeric bonus layer.

Combined information state:

- Both succeed: **Full Intelligence**
- One succeeds: **Partial Intelligence**
- Neither succeeds: **No Advance Intelligence**

Reconnaissance does not grant generic advantage, `+2`, automatic success, or another persistent track.

## Complication reveal model

- **Full Intelligence:** category, actual situation, Threat-bearing status, and likely consequence are known before response.
- **Partial Intelligence:** category plus an appropriate warning/clue, but not the complete situation/consequence.
- **No Advance Intelligence:** the complication is discovered when the party reaches it.

## Opportunity reveal model

- **Full Intelligence:** category, actual opportunity, likely benefit, obvious pursuit cost/requirement, and known Discovery/Threat relevance are available before the party decides whether to engage.
- **Partial Intelligence:** category plus a meaningful clue indicating the general type of benefit, but not the exact value, requirement, cost, or full situation.
- **No Advance Intelligence:** the party discovers the opportunity only when it reaches the situation.

The GM always has access to the complete generated result. Reconnaissance governs what the expedition can know in advance, not what the GM is allowed to see.

---

# 5. Expedition Support

Roles:

- Forager: Survival (WIS)
- Coordinator: Persuasion (CHA)

Forager represents provisions/supplies. Coordinator represents expedition readiness, **not morale**.

Combined descriptive state may be:

- Both succeed: Well Supported
- Forager only: Supplied
- Coordinator only: Ready
- Neither: Strained

Mechanical interpretation is hex-local:

- Forager success creates **Supply Readiness**.
- Coordinator success creates **Operational Readiness**.

Each readiness may be consumed at most once during that hex when an Event result explicitly permits a logically relevant use.

Support does not create a persistent Support track and does not modify Travel Quality, Momentum, or the Event Roll.

## Complication use

Applicable Supply/Operational Readiness reduces a relevant Complication consequence by one tier, minimum Tier 0. It does not rewrite the original adjudicated roll outcome.

## Opportunity use

There is **no generic Opportunity bonus** from Support.

An Opportunity content entry may explicitly declare a Supply or Operational Readiness interaction through structured metadata. If it does, that entry defines the effect, such as reducing a voluntary pursuit cost, enabling collection/use of a resource, or improving access to the benefit.

Support never grants a generic d20 bonus, advantage, or automatic outcome-tier increase to an Opportunity.

Unused readiness expires with the hex.

---

# 6. Travel Quality

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

# 7. Momentum

Canonical track:

`Deteriorating → Risky → Neutral → Prepared → Favored`

Travel Quality shifts Momentum once per hex:

- Successful: one step better
- Neutral: unchanged
- Poor: one step worse

No additional Momentum-derived tracks or hidden bonuses are introduced.

Event Resolution does not shift Momentum again unless a later, separately approved engine design explicitly introduces such a rule. Quiet Travel and Opportunity do not currently do so.

**Playtest tuning note (November 3, 2026):** current Event modifiers remain `−2 / −1 / 0 / +1 / +2`. If live play shows the endpoint states are too conservative against the four five-point Event bands, the first deterministic tuning candidate is `−3 / −1 / 0 / +1 / +3`. A random Momentum die is not part of the current design because the Event d20 already supplies the random component. This note does not change dev.99 mechanics.

---

# 8. Event Chart

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

**Major Complication** uses the same Complication content library as Complication but resolves using Major severity. **Complication** uses Standard severity.

Threat is **downstream state, not an Event Chart result**. A Complication or Major Complication may be Threat-bearing and later hand off to the Threat Engine.

Opportunity is its own Event Resolution subsystem. Discovery is not a fifth Event result; an Opportunity may produce a Discovery candidate.

---

# 9. Complication Engine

## Core principle

A Complication creates a problem that must be resolved before planned travel is committed.

Reconnaissance determines how much the expedition knows before confronting it.

Expedition Support may mitigate appropriate consequences.

The Complication itself does not change Travel Quality or Momentum after those stages have already resolved.

Threat-bearing Complications may create or interact with persistent Threat, but detailed Threat behavior is intentionally deferred to the Threat Engine design.

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

Across all six categories this produces 384 base details before terrain/context changes presentation.

The separate `docs/COMPLICATION_CONTENT_LIBRARY_DRAFT.md` contains the approved first-pass 384-detail content set.

## Standard vs Major

The Event Chart determines severity:

- **Complication** → Standard
- **Major Complication** → Major

Both use the same rolled content result.

Shared consequence tier mapping:

| Outcome | Standard | Major |
| --- | ---: | ---: |
| Strong Success | Tier 0 | Tier 1 |
| Success | Tier 1 | Tier 2 |
| Failure | Tier 2 | Tier 3 |
| Major Failure | Tier 3 | Tier 4 |

Applicable Support may reduce the final consequence one tier when the content entry permits it.

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

Uses the consequence channel that actually fits the entry: time, supplies, or exposure.

| Tier | Consequence |
| ---: | --- |
| 0 | No meaningful consequence |
| 1 | +1 hour or 1 relevant supply unit |
| 2 | +1d4 hours or 1d4 relevant supply units |
| 3 | +1d4 hours plus 1d4 supplies, or the entry's defined exposure/hazard effect |
| 4 | +2d4 hours plus a significant exposure/hazard effect and logically required resource loss |

### Resources

A resource unit is the smallest meaningful unit of the affected supply.

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

Threat eligibility is content metadata, not a Complication category.

The Threat Engine will later determine exact creation, persistence, escalation, reduction, and Encounter-trigger behavior.

## Encounter separation

Complications do not contain prebuilt encounters.

A complication may later hand off to Encounter through the Threat Engine or by deliberate GM escalation to a direct confrontation. The Encounter Engine remains responsible for the direct encounter.

---

# 10. Quiet Travel

## Locked current behavior

Quiet Travel means **nothing significant happens** during this Event Resolution.

For the current Expedition System 1.1 workflow:

- no secondary Quiet Travel roll
- no mechanical consequence
- no reward
- no penalty
- no Travel Quality change
- no Momentum change
- no Threat creation/reduction/clearing
- no resource gain/loss
- no rest or Exhaustion effect
- no next-hex advantage
- no planned-time change
- no committed-time change

The Event resolves and normal travel commitment may proceed.

## Legacy Quiet Travel behavior is superseded

The older generic Quiet Travel implementation contains **Recover**, **Prepare**, and **Regroup** choices. Those are not part of Expedition System 1.1:

- Recover conflicts with the established New Travel Day / optional Rest Recovery / world-time architecture.
- Prepare creates a generic cross-hex advantage outside the approved role model.
- Regroup would modify Momentum a second time after Travel Quality already shifted it for the hex.

The legacy source must not be wired into the new Expedition workflow merely because it exists in the dev.88 tree.

## Future Quiet Travel content

A future flavor system may add nonmechanical travel vignettes, but it should be **substantially broader than a simple d8 table** so repeated travel does not become repetitive.

That content is deferred. Quiet Travel currently means: **resolve the Event with no additional event content.**

---

# 11. Opportunity Engine

## Core principle

An Opportunity is a potentially beneficial situation encountered during travel that the party may choose to pursue, investigate, exploit, accept, or ignore.

Opportunity is **not an automatic reward** and is **not a persistent track**.

The Opportunity Engine owns generation and resolution of the current hex's Opportunity. It may output persistent candidates for later systems, especially Discovery, but it does not itself become a persistent meter like Threat.

Opportunity resolves before normal travel hours are committed.

It does not change Travel Quality or Momentum after those stages have already resolved.

## Event handoff

A final Event result of `16–20` routes the current shared hex record into the Opportunity Engine.

The Opportunity Engine receives the frozen expedition context, including at minimum:

- current shared hex/travel-sequence ID
- terrain/context selected by the GM
- region danger selected by the GM
- party/role assignments
- Reconnaissance information state
- Supply Readiness / Operational Readiness state
- planned travel duration and remaining planned hours
- Momentum and Event result for historical context

It does not reroll Navigation, Reconnaissance, Support, Travel Quality, Momentum, or the Event.

---

## 11.1 Nested generation structure

Default generation:

`d6 Opportunity Category → d8 Primary Opportunity Type → d8 Detail`

Six categories × eight primary types × eight details yields **384 base detail combinations** before terrain/context framing.

Random generation is the default content path, but the GM may later be given explicit select/reroll controls. Random rolls and GM-selected effective results must be distinguishable in persisted data.

The content architecture should be Journal/compendium-backed with stable IDs. JavaScript owns rules/state transitions; content owns editable prose and GM guidance.

---

## 11.2 Opportunity categories

### 1. Route / Passage

Potentially improves movement, access, positioning, or route efficiency.

Primary types:

1. Shortcut
2. Hidden Trail
3. Natural Crossing
4. Constructed Route
5. Sheltered Passage
6. Elevated / Vantage Route
7. Alternate Transit
8. Unusual Passage

### 2. Resources / Salvage

Potentially provides useful expedition material, supplies, or valuables.

Primary types:

1. Food / Forage
2. Water
3. Medicinal / Alchemical Resource
4. Fuel / Shelter Material
5. Repair / Crafting Material
6. Equipment / Ammunition Salvage
7. Trade Goods / Valuables
8. Rare / Unusual Resource

### 3. Information / Clues

Potentially gives useful knowledge without making information a generic numeric bonus.

Primary types:

1. Tracks / Signs
2. Route Knowledge
3. Hazard Warning
4. Threat Intelligence
5. Location Clue
6. Map / Marker / Navigation Data
7. Historical / Cultural Evidence
8. Hidden / Secret Knowledge

### 4. Social / Contacts

Potentially provides assistance, trade, access, information, or an ongoing relationship.

Primary types:

1. Fellow Travelers
2. Local Guide
3. Merchant / Trader
4. Patrol / Scouts
5. Skilled Specialist
6. Faction Contact
7. Host / Settlement Contact
8. Unusual Ally / Intelligent Creature

### 5. Site / Landmark

Potentially reveals a useful or memorable place.

Primary types:

1. Safe Campsite / Shelter
2. Natural Landmark
3. Ruin / Structure
4. Abandoned Camp / Settlement
5. Shrine / Monument
6. Hidden Site
7. Strategic Vantage / Waypoint
8. Cache / Resource Site

### 6. Magical / Strange

Potentially provides a supernatural, planar, magical, or otherwise extraordinary benefit.

Primary types:

1. Beneficial Phenomenon
2. Magical Resource
3. Enchanted Site
4. Portal / Spatial Shortcut
5. Vision / Insight
6. Protective / Restorative Effect
7. Supernatural Contact
8. Rare Planar / Impossible Feature

These categories are functional identities, not restrictions on fiction. Terrain and campaign context change how each result is presented.

---

## 11.3 Party decision and resolution states

An Opportunity can move through these conceptual states:

1. **Generated** — category/primary/detail are fixed for the hex.
2. **Revealed** — information shown according to Reconnaissance state.
3. **Decision** — party chooses whether to pursue or ignore it.
4. **Resolving** — GM records the approach and any required resolution.
5. **Resolved** — benefit/candidate output is recorded.
6. **Declined** — party intentionally ignores it; no failure is recorded.

Ignoring an Opportunity is a valid decision and should not create a Complication or other penalty.

The engine does not automatically retry failed Opportunities. If fiction materially changes and the GM permits another attempt, that is a deliberate GM action and should preserve the prior attempt/correction history rather than silently replacing it.

---

## 11.4 Resolution methods

Opportunity content provides example approaches, not a forced solution.

The GM may resolve an Opportunity through any appropriate method, including:

- ability check
- skill check
- tool check
- saving throw when fiction genuinely calls for one
- spell or class feature
- resource expenditure
- payment/trade
- roleplay
- automatic resolution with no roll
- decline/ignore

The module must not hard-code one skill simply because a content entry suggests common approaches.

### Default d20 outcome bands

When the GM chooses a d20 check against a DC, use:

| Result | Outcome |
| --- | --- |
| DC +5 or more | Strong Success |
| DC through DC +4 | Success |
| Miss by 1–4 | Failure |
| Miss by 5 or more | Major Failure |

Natural 1/20 does not introduce automatic check behavior unless the underlying system/rule being used already does so.

A GM may adjudicate directly without a roll. If a roll occurs, preserve the original outcome and any later GM effective override separately, following the same audit philosophy already used for expedition-role resolution.

---

## 11.5 Opportunity outcome philosophy

Opportunity is the beneficial side of the Event system. Failure should not secretly turn every Opportunity into a Complication.

General interpretation:

- **Strong Success:** enhanced form of the opportunity's benefit.
- **Success:** normal intended benefit.
- **Failure:** limited benefit or missed opportunity, according to the content entry and fiction.
- **Major Failure:** opportunity is lost or cannot be meaningfully exploited.

A Failure or Major Failure does **not automatically**:

- create a Complication
- add a travel delay
- damage equipment
- consume supplies
- create/advance Threat
- trigger an Encounter

If the players voluntarily spend time/resources to pursue an Opportunity, that voluntary pursuit cost may remain spent even when the benefit is not secured. That is a chosen cost, not an automatically generated punishment.

If play genuinely escalates into danger, the GM may hand the fiction to the appropriate later system, but the Opportunity Engine does not manufacture that transition solely from a low roll.

---

## 11.6 Benefit identity by category

These are default benefit channels. Individual content entries define the actual benefit.

### Route / Passage

Typical benefits:

- reduce planned remaining travel time
- reveal a more efficient route
- bypass difficult terrain
- improve access/approach to the destination
- establish a reusable route that may qualify as a Discovery candidate

Any time benefit modifies **planned** travel time only. It never rewinds already committed travel hours or world time.

### Resources / Salvage

Typical benefits:

- food/water
- fuel
- repair/crafting materials
- expedition supplies
- equipment/ammunition salvage
- trade goods or valuables
- unusual resource sources

The first workflow implementation should record abstract/resource benefits without automatically creating/deleting Actor Items unless a later explicit integration defines safe inventory behavior.

### Information / Clues

Typical benefits:

- route knowledge
- hazard warning
- Threat information
- location clues
- map/navigation data
- historical/cultural information
- secrets or useful campaign knowledge

Information is content/state, not a generic `+2` or advantage mechanic.

### Social / Contacts

Typical benefits:

- guide or escort
- trade opportunity
- information
- hospitality
- access
- temporary assistance
- faction relationship/contact

Social Opportunity does not automatically imply permanent faction mechanics. Persistent relationship design may be added later if needed.

### Site / Landmark

Typical benefits:

- shelter or useful camp location
- waypoint
- defensible position
- landmark
- ruin or structure
- cache/resource site
- location worth recording as a Discovery candidate

A useful site does not automatically grant Long Rest benefits. Existing rest systems remain authoritative.

### Magical / Strange

Typical benefits:

- magical shortcut
- temporary supernatural boon
- magical resource
- useful planar effect
- vision/insight
- protective/restorative phenomenon
- extraordinary site/contact
- persistent magical feature that may qualify as a Discovery candidate

No magical Opportunity should silently replace normal rest, healing, spell, or Actor-resource rules without an explicit content/mechanical definition.

---

## 11.7 Voluntary pursuit costs

Some Opportunities may require a voluntary cost to exploit, such as:

- additional planned time
- payment
- expendable supplies
- spell/resource use
- detour
- trade/concession

These costs are content metadata and must be visible according to Reconnaissance information quality when reasonably knowable.

A voluntary time cost modifies planned travel time only and remains separate from committed travel hours until normal travel commitment.

Opportunity content should not invent mandatory costs merely to make every positive result a tradeoff. Cost is used only when the fiction actually calls for it.

---

## 11.8 Reconnaissance interaction

Reconnaissance changes **information**, not the Opportunity roll or outcome.

### Full Intelligence

Before engagement, the party can know:

- Opportunity category
- actual situation
- likely benefit
- obvious pursuit cost/requirement
- known Discovery potential
- known Threat relevance

### Partial Intelligence

Before engagement, the party receives:

- category
- meaningful clue
- general benefit family

Exact benefit value, hidden requirement, full situation, and non-obvious cost remain unrevealed.

### No Advance Intelligence

The party encounters the Opportunity when it reaches it and makes its decision then.

---

## 11.9 Expedition Support interaction

Support is **entry-specific**, not a blanket Opportunity modifier.

Opportunity content may declare:

- `supply` applicability
- `operational` applicability
- a content-specific Support effect

Examples of acceptable effects include:

- reducing a voluntary pursuit cost
- enabling safe collection/transport of a resource
- improving access because the expedition is properly prepared
- preserving part of a benefit that would otherwise be inaccessible

Support does not automatically:

- add to the d20 roll
- grant advantage
- upgrade every Opportunity outcome
- create additional rewards

Each readiness can still be consumed at most once in the hex.

---

## 11.10 Discovery boundary

**Discovery is not an Event Chart result.**

An Opportunity may produce a **Discovery candidate** when the result represents something durable enough to remember or revisit, such as:

- reusable route/passage
- persistent location/site/landmark
- renewable resource source
- durable world/map information
- persistent magical feature
- another future Discovery type approved by the Discovery design

The Opportunity Engine identifies and records the candidate. It does **not** yet define the final world-level Discovery registry, map representation, sharing rules, or persistence lifecycle.

Until the Discovery subsystem is designed, implementation may retain the candidate on the shared hex record without creating a separate global Discovery database.

Discovery candidates must not assume scene coordinates, a permanent geographic hex ID, or a particular map implementation. The current travel-sequence record remains separate from geographic map identity.

---

## 11.11 Threat boundary

An Opportunity may reveal information relevant to a Threat, but Opportunity is not itself a Threat state machine.

Content may carry a future-facing `threatRelevant` or `threatCandidate` marker when appropriate.

The Opportunity Engine must not create, advance, reduce, clear, or trigger Encounter from Threat until the Threat Engine design defines that contract.

Low Opportunity rolls do not automatically create Threat.

---

## 11.12 Opportunity content schema

The eventual Journal/compendium-backed content should use stable structured metadata accompanying readable GM content.

Minimum planned fields:

- `id`
- `category`
- `primaryType`
- `detailId`
- `title`
- `situation`
- `partialClue`
- `benefitTags`
- `pursuitCostTags`
- `supportTags`
- `supportEffect`
- `discoveryEligible`
- `discoveryKind` when known
- `threatRelevant`
- `terrainTags`
- `suggestedApproaches`
- `outcomeGuidance.strongSuccess`
- `outcomeGuidance.success`
- `outcomeGuidance.failure`
- `outcomeGuidance.majorFailure`

Stable IDs are required so editable content can be referenced without matching display names.

Terrain/context tags change presentation and suitability; they do not require separate engine code for each terrain.

---

## 11.13 Shared-record persistence

The Opportunity result belongs to the existing shared travel-sequence/hex record.

The implementation should preserve enough structured data to reconstruct what happened without parsing rendered HTML.

Minimum planned Opportunity record data:

- schema version
- category roll and effective category ID
- primary roll and effective primary ID
- detail roll and effective detail ID
- Reconnaissance reveal level
- resolution status (`generated`, `revealed`, `resolving`, `resolved`, `declined`)
- party decision
- selected resolution method/approach
- actor/document reference when applicable
- DC when applicable
- original roll/result when applicable
- original outcome
- effective GM-adjudicated outcome
- Support readiness consumed, if any
- voluntary pursuit costs
- applied benefit data/tags
- net planned-time delta, if any
- Discovery candidate, if any
- future Threat candidate/reference, if any
- correction/audit information consistent with the existing shared-record philosophy

Opportunity does not create a separate persistent Opportunity track.

---

# 12. Opportunity category default outcome guidance

This section provides baseline content-authoring guidance. Individual entries can be more specific.

## Route / Passage

- **Strong Success:** best/fastest useful route secured; enhanced planned-time or access benefit.
- **Success:** intended route/access benefit secured.
- **Failure:** limited route benefit or the better route is not secured.
- **Major Failure:** opportunity to exploit the route is lost; no automatic extra delay beyond any voluntary pursuit cost already chosen.

## Resources / Salvage

- **Strong Success:** greater quantity, quality, efficiency, or an additional useful aspect.
- **Success:** normal resource benefit.
- **Failure:** small/limited usable benefit or resource cannot be efficiently recovered.
- **Major Failure:** no useful resource secured; no automatic resource loss.

## Information / Clues

- **Strong Success:** precise/comprehensive actionable information.
- **Success:** useful information sufficient to act on.
- **Failure:** incomplete or low-value information.
- **Major Failure:** no useful information obtained. Do not automatically provide false information unless the specific fiction explicitly supports deception and the GM chooses it.

## Social / Contacts

- **Strong Success:** especially favorable help/access/relationship.
- **Success:** normal intended assistance or agreement.
- **Failure:** limited assistance or no agreement.
- **Major Failure:** contact/opportunity closes without benefit. Hostility is not automatic.

## Site / Landmark

- **Strong Success:** full value plus an additional useful aspect, access, or durable Discovery potential.
- **Success:** normal useful site/landmark benefit.
- **Failure:** partial use or limited information/access.
- **Major Failure:** no meaningful benefit obtained; the site is not automatically hazardous.

## Magical / Strange

- **Strong Success:** enhanced, clearer, longer, or more useful supernatural benefit.
- **Success:** normal intended magical/strange benefit.
- **Failure:** weak/brief/partial benefit or inability to capitalize on it.
- **Major Failure:** no benefit secured. Harmful backlash is not automatic.

---

# 13. Content-library strategy

## Complications

The first-pass 384-detail library already exists separately in:

`docs/COMPLICATION_CONTENT_LIBRARY_DRAFT.md`

It remains draft content for implementation/live review, not immutable prose.

## Opportunities

The Opportunity Engine is designed for the same eventual scale:

- 6 categories
- 8 primary types per category
- 8 details per primary type
- 384 base detail combinations

The full 384-entry Opportunity library does **not** need to be authored before workflow implementation begins.

For the first workflow build, use a small representative content fixture set with stable IDs covering every category and the major resolution paths. This allows live testing of:

- generation
- Reconnaissance reveal levels
- pursue/decline behavior
- roll/direct adjudication
- Strong Success / Success / Failure / Major Failure
- Support opt-in behavior
- planned-time deltas
- Discovery candidate output
- persistence/reload

Once the engine workflow is accepted, the production Opportunity library can be expanded without redesigning the engine.

---

# 14. Legacy engine warning

The dev.88 repository already contains older generic engine files, including Event, Quiet Travel, Discovery, Complication, Threat, and Encounter code.

Those files predate the approved Expedition System 1.1 design and contain behavior that conflicts with current decisions, including the old Event distribution and old Quiet Travel Recover/Prepare/Regroup behavior.

**They are scaffolding/reference code, not design authority.**

When implementation begins:

- inspect each legacy engine before reuse
- preserve unrelated working module behavior
- do not wire old rules into the new Expedition workflow simply because code exists
- replace or adapt only what is required by the approved 1.1 contract
- preserve original/reference source files designated immutable by the module handoff

---

# 15. First Expedition System workflow implementation — dev.89 checkpoint

Dev.89 implements the first end-to-end staged workflow slice while deliberately leaving specialized content engines incomplete. The implemented sequence is:

1. Travel Quality calculation from the six resolved expedition-role results.
2. Momentum shift once per hex.
3. Event roll using `1d20 + Momentum modifier`, clamped 1–20.
4. Persist Event result in the shared hex record.
5. Event routing:
   - Major Complication → Complication Engine, Major severity
   - Complication → Complication Engine, Standard severity
   - Quiet Travel → immediate no-op resolution
   - Opportunity → Opportunity Engine
6. Persist Event Resolution data before travel commitment.
7. Return control to the established travel/Forced March commitment workflow.
8. Preserve reload/resume behavior so completed design stages are not rerolled merely because the dashboard/client reloads.

For Opportunity, the Event route and manual-resolution bridge exist in dev.89, but the specialized Opportunity content engine is not yet wired. Full Opportunity behavior/content follows workflow acceptance.

The initial multi-Threat persistence and GM controls are implemented in dev.89. Automatic Complication-created Threats, Recon-driven visibility, Threat-to-Encounter handoff, and redesigned Encounter behavior remain deferred rather than being guessed.

---

# 16. Roadmap after Opportunity

Current design progression:

1. Navigation — designed and implemented baseline
2. Reconnaissance — designed and implemented in dev.88
3. Expedition Support — designed and implemented in dev.88
4. Travel Quality — implemented in the staged dev.89 workflow
5. Momentum — persistent staged Momentum implemented in dev.89
6. Event Chart — corrected four-result chart implemented in dev.89
7. Complication / Major Complication — routed by dev.89; specialized engine/content integration still pending
8. Quiet Travel — implemented in dev.89 as the locked no-op
9. Opportunity Engine — routed by dev.89; specialized engine/content integration still pending
10. Discovery — minimum Opportunity handoff defined; full persistence/system design deferred
11. Threat Engine — initial multiple-Threat persistence and GM controls implemented in dev.89; automatic event/Recon handoffs pending
12. Encounter Engine — next major engine redesign; must support standalone use and travel/Threat handoff
13. Broad Quiet Travel flavor library — later content enhancement
14. Full Opportunity 384-detail content library — after workflow behavior is tested and stable

Do not implement Encounter, global Discovery persistence, automatic Threat source rules, or the full Opportunity content library by implication. Each should follow its approved design and requested development scope.

---

# 17. Current design invariants to preserve during development

- The existing travel ledger remains authoritative for committed travel hours and world-clock changes.
- Planned time and committed time remain separate.
- The current shared travel-sequence/hex record remains the workflow owner for one crossing.
- Geographic map identity remains separate from travel-sequence identity.
- All six fixed role skills remain unchanged unless separately redesigned.
- Reconnaissance is information, not a generic bonus.
- Support is hex-local readiness, not a persistent track.
- Travel Quality shifts Momentum once per hex.
- Momentum modifies the Event roll; Event Resolution does not automatically shift Momentum again.
- Event Chart has exactly four current results: Major Complication, Complication, Quiet Travel, Opportunity.
- Threat is downstream state, not an Event Chart result.
- Discovery is not a fifth Event result.
- Quiet Travel currently has no secondary roll or mechanic.
- Opportunity is its own engine but not a persistent track.
- Failure in Opportunity does not automatically become Complication/Threat/Encounter.
- Event Resolution never advances committed travel time directly.
- Existing themes, packs/assets, optional Calendaria/Rest Recovery behavior, GM/player permissions, history, and designated original source must be preserved.
- Live Foundry acceptance remains distinct from local/static validation.

---

# 18. Threat Engine — approved first-implementation baseline

**Dev.89 implementation note:** the persistent multiple-Threat collection, stages, explicit GM create/advance/reduce/resolve controls, and Hidden/Partial/Full player visibility are implemented. Automatic Complication/Major Complication creation/advancement, Recon-driven visibility, and Encounter handoff remain pending.

## Scope

Threat is persistent expedition pressure that develops out of Overland Travel. It is downstream state, **not** an Event Chart result.

The first implementation remains intentionally broad. Detailed timers, automatic simulation, content-specific advancement rules, Encounter aftermath, and Opportunity/Discovery interactions are later enhancements unless explicitly added.

## Multiple simultaneous Threats

The expedition may have multiple distinct Threats at the same time. There is no single global Threat meter.

Examples include:

- a warband tracking the party
- an approaching supernatural storm
- a territorial predator
- hostile scouts or faction pursuit
- an escalating magical phenomenon

Each Threat has its own identity, stage, history, and resolution state. Resolving one Threat does not clear unrelated Threats.

## Four-stage progression

Canonical first-pass stages:

`Emerging → Developing → Imminent → Immediate`

These stages are deliberately generic enough to represent creatures, weather, factions, environmental forces, or supernatural dangers.

**Immediate** means the Threat can no longer remain background expedition pressure and requires direct resolution. The normal future handoff is the Encounter Engine, but the GM may resolve the situation manually when an Encounter is not appropriate.

## Primary creation sources for first implementation

The first functional Threat Engine needs only these creation paths:

1. **Complication**
2. **Major Complication**
3. **GM introduction**

Starting stages:

- Complication-created Threat → **Emerging**
- Major Complication-created Threat → **Developing**
- GM-created Threat → **GM selects the starting stage**

Later enhancement priority:

1. existing Threat development creates/transforms another Threat
2. Encounter aftermath leaves a persistent Threat
3. Opportunity / Discovery exposes, creates, or interacts with Threats

These later paths are valid design directions but are not required for the first functional Overland Travel workflow.

## Advancement

Threats advance only when something in the fiction actually worsens them.

For the first implementation:

- a later Complication or Major Complication involving the **same danger** may advance that Threat one stage
- the GM may manually advance a Threat
- Threats do **not** advance automatically merely because a hex, travel day, or amount of world time passes

No generic Threat timer is part of the first implementation.

## Reduction and resolution

Threats may move backward or be resolved when the fiction improves:

`Immediate → Imminent → Developing → Emerging → Resolved`

For the first implementation:

- the GM may manually reduce or resolve a Threat
- a Complication/Major Complication involving the same Threat may reduce or resolve it when its actual outcome justifies that result
- Threats do not automatically decay with time
- resolved Threats remain in history rather than being silently deleted

## Same Threat vs new Threat

When a Threat-bearing Complication resolves:

- if it clearly concerns the **same existing danger**, it may update that Threat
- if it represents a **different independent danger**, create a new Threat
- when ambiguous, the **GM decides**

Do not auto-match Threats by display name, prose, or fuzzy text comparison.

## Reconnaissance interaction

Reconnaissance changes what the party knows; it does not move Threat stages.

- **Full Intelligence:** identify the Threat, its current stage, and evidence/signs of escalation
- **Partial Intelligence:** identify signs of danger and its general nature without complete Threat/stage information
- **No Advance Intelligence:** no additional Threat information beyond what becomes obvious through play/events

Threat records may therefore contain GM-only facts separately from player-revealed information.

## Expedition Support interaction

Supply Readiness and Operational Readiness do not directly advance, reduce, or clear Threats in the first implementation.

Support may mitigate the Complication consequence that produced or interacted with the Threat, but it receives no second automatic Threat benefit.

Specific direct Threat-countering uses may be designed later if live testing demonstrates a need.

## Persistence

Threats are persistent across:

- hex completion
- new travel days
- pause/exit
- client reload
- resumed expedition travel

They remain active until explicitly reduced/resolved by an applicable workflow or GM decision.

Minimum persistent Threat identity should support:

- stable Threat ID
- name / identity
- source
- current stage
- active/resolved status
- creation timestamp/context
- last change timestamp/context
- history of stage changes
- GM notes
- player-revealed information separately from hidden GM information

The exact persisted schema may evolve during the first implementation, but it must support multiple Threats and preserve history safely.

## GM / player presentation

GM view may show the complete Threat record, including hidden identity/details, stage, source, history, notes, and controls.

Player view shows only information legitimately revealed through Reconnaissance or subsequent events.

GM controls may reveal/conceal information and advance/reduce/resolve a Threat without rewriting its historical record.

## Encounter boundary

When a Threat reaches **Immediate**:

- it requires direct resolution
- the normal future path is a handoff to the Encounter Engine
- the GM may resolve it manually instead
- other active Threats remain unchanged

Encounter design remains a separate major system because it must ultimately support both:

1. encounters generated from Overland Travel / Threat
2. standalone Encounter Engine use outside travel

The first Expedition implementation must not couple Encounter so tightly to travel that standalone use becomes impossible.

---

# 19. First integrated module slice

The first testable module integration should now target the following vertical slice:

1. preserve dev.88 Navigation, Reconnaissance, Expedition Support and shared hex records
2. calculate Travel Quality from all six effective/adjudicated role results
3. shift persistent Momentum exactly once per hex
4. roll `1d20 + Momentum modifier`, clamped 1–20
5. save the authoritative Event result to the shared hex record
6. route the Event:
   - Major Complication → Complication Engine / Major severity
   - Complication → Complication Engine / Standard severity
   - Quiet Travel → completed no-op
   - Opportunity → Opportunity Engine
7. show Travel Quality, Momentum and Event status in the Events tab
8. retain unresolved specialized Event routing across refresh/reload rather than rerolling
9. introduce the persistent multi-Threat state contract and basic GM-created Threat capability
10. preserve the normal travel/Forced March commitment workflow and never let Event Resolution directly advance committed time

For this first slice, Complication/Opportunity content may use a small representative fixture set rather than requiring the full content libraries to be runtime-complete.

Encounter remains standalone/unwired until its separate design is settled.

## Local prototype evidence

A pure, no-Foundry prototype of the Travel Quality → Momentum → Event pipeline and multi-Threat state contract was prepared against the dev.88 record shape on November 2, 2026.

Locally validated behaviors:

- approved Travel Quality margin tiers
- GM binary overrides count as one point to the selected side
- all six saved roles participate when checked
- Momentum shifts once and clamps at its endpoints
- corrected Event Chart uses `1d20 + Momentum modifier`
- Quiet Travel resolves as a no-op
- Complication/Major Complication/Opportunity route to specialized pending engines
- multiple named Threats coexist independently
- explicit advance/reduce/resolve behavior
- no automatic Threat advancement with elapsed travel time

Prototype test result: **11/11 passing**.

This is local/simulated evidence only. It is not yet wired into Foundry and is not a dev.89 module build.

---

# 20. Updated roadmap

Current progression:

1. Navigation — designed and implemented baseline
2. Reconnaissance — designed and implemented in dev.88
3. Expedition Support — designed and implemented in dev.88
4. Travel Quality — designed; pure prototype locally validated
5. Momentum — designed; pure Expedition prototype locally validated
6. Event Chart — corrected and designed; pure Expedition prototype locally validated
7. Complication / Major Complication — engine/content foundation designed; runtime integration pending
8. Quiet Travel — locked as no-op for first implementation
9. Opportunity Engine — foundation designed; runtime integration/content fixtures pending
10. Discovery — minimum Opportunity handoff only; broader persistence deferred
11. Threat Engine — **first-implementation baseline now designed; multi-Threat state prototype locally validated**
12. Encounter Engine — next major system design; must support standalone and travel-overlay use
13. Broad Quiet Travel flavor library — later enhancement
14. Full Opportunity content library — expand after workflow testing
15. Secondary Threat creation/integration paths — later enhancement after first functional Threat workflow

The next development work should be implementation/testing of the vertical slice above rather than expanding design depth indefinitely.
