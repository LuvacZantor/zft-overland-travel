# Local Validation — ZFT Overland Travel 0.4.0-dev.120

Evidence level: **locally validated** only. Live Foundry V13.351 / D&D5e 5.2.5 acceptance is pending.

## Scope

- Pending Navigation / Reconnaissance / Expedition Support in the active Travel Log, including the pre-Travel-Time Navigation-prompt state.
- Reset Current Travel safety boundary.
- Reusable GM-controlled dice helper, including Complication detail d8 and resolution d20 integration.
- Route Obscured Standard/Major consequence tiers, Operational Readiness mitigation, and planned-time delay.
- Player-facing Complication summary.

## Automated validation

- Active regression suite: **164/164 passed**. Historical dev.95/dev.96 cosmetic experiments remain intentionally excluded under the established rollback convention.
- JavaScript/MJS syntax: **91 files passed**.
- Relative imports: **217 checked, 0 missing**.
- JSON: valid.
- CSS structure: balanced braces.
- Protected Mount Ironrot source, migration, themes, packs, and assets: unchanged from dev.119.
- Complete manual-install ZIP: one top-level `zft-overland-travel/` directory with `module.json` directly inside.
- Fresh-extraction active regression suite: **164/164 passed**.
- Archive content: **168 files**.

## Live acceptance still required

1. Start a new hex and verify Navigation, Reconnaissance, and Expedition Support are visible as Pending while Navigation player prompts are still outstanding.
2. Verify Reset Current Travel restarts an uncommitted active hex only and preserves older completed history.
3. Generate Route Obscured using normal/exact/forced-detail d8 control, then resolve it using normal/exact/forced-outcome d20 control. Confirm Foundry/Dice So Nice still shows real visible dice.
4. Verify Reconnaissance changes information only and never changes/preselects the Complication outcome.
5. Verify Operational Readiness is offered only when the Coordinator succeeded, reduces the consequence by one tier, and is recorded as used.
6. Verify Tier 2+ Navigation delays visibly roll 1d4/2d4 and increase planned/remaining travel without immediately changing Travel Hours Today or world time.
7. Verify resolved GM/player Complication cards show the saved outcome and appropriate consequence summary.
