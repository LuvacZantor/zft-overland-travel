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
