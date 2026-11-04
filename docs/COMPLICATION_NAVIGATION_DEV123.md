# Navigation Complication Engine — dev.123

## Runtime scope

Navigation is the first fully testable Complication category. The eight narrative primary Complications remain distinct for story variety:

1. Route Obscured
2. Path Blocked
3. False Trail
4. Dangerous Crossing
5. Forced Detour
6. Landmark Problem
7. Route Split
8. Progress Lost

Each primary owns eight d8 narrative detail results. A new Navigation Complication rolls a visible GM-controlled d8 for the primary and a second visible GM-controlled d8 for the detail. Existing saved Complications reopen without rerolling.

## Recovery and outcome

Recovery can use Roll / Check or Direct Adjudication. The default Roll / Check DC is the saved Navigation DC and remains GM-editable. A roll resolves as Strong Success, Success, Failure, or Major Failure. Standard and Major Complications translate that outcome into Consequence Severity 0 through 4. Operational Readiness is explicit opt-in mitigation and reduces final Consequence Severity by one, minimum zero.

The consequence phase performs no random roll. The GM selects exactly one allowed consequence for this test implementation.

## Deterministic consequence baselines

| Consequence | Severity 0 | Severity 1 | Severity 2 | Severity 3 | Severity 4 |
|---|---:|---:|---:|---:|---:|
| Lost Time | 0 h | +1 h | +2 h | +4 h | +8 h |
| Lost Progress | 0% | 10% | 25% | 50% | 100% |
| Resource Loss | 0% | 10% | 25% | 50% | 100% |
| HP Damage | 0% max HP | 10% | 20% | 35% | 50% |
| Exhaustion | +0 | +1 | +2 | +3 | +4 |
| Threat | Future Threat Engine handoff carrying final Consequence Severity | | | | |

Resource Loss is restricted to Rations, Water, Healer's Kit Uses, Healing Potions, Ammunition, and Light / Fuel. The GM also selects the exact tracked Foundry Item being reduced.

Disease and Curse are separate future consequence handoffs/subsystems. Generic D&D conditions do not use one universal overland severity table.

## Allowed consequences by primary

| Primary | Allowed consequences |
|---|---|
| Route Obscured | Lost Time, Lost Progress, Threat |
| Path Blocked | Lost Time, Resource Loss, HP Damage, Exhaustion |
| False Trail | Lost Time, Lost Progress, Threat |
| Dangerous Crossing | Lost Time, Resource Loss, HP Damage, Exhaustion, Threat |
| Forced Detour | Lost Time, Lost Progress, Threat |
| Landmark Problem | Lost Time, Lost Progress, Threat |
| Route Split | Lost Time, Lost Progress, Threat |
| Progress Lost | Lost Time, Lost Progress, Threat |

## Boundaries

- Off Route is not a consequence type. It is a narrative/recovery problem that can lead to Lost Time or Lost Progress.
- Threat is only a recorded downstream handoff in dev.123. The Threat Engine is not being designed implicitly here.
- Lost Time and Lost Progress change planned/remaining travel only. They do not rewind or directly advance world time.
- HP Damage and Exhaustion target selected attending character Actors without requiring scene Tokens.
- One consequence per Complication is the current test rule. Multi-consequence stacking is deferred until playtesting shows a need.
