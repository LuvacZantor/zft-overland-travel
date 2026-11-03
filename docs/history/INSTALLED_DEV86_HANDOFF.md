# ZFT Overland Travel | Development Continuity Handoff

**Prepared:** October 29, 2026  
**Project:** 🛠️ Foundry Scripting  
**Repository:** `LuvacZantor/zft-overland-travel`  
**Remote development branch:** `develop` at `71e507a119a790e3404a9e7a2ccc7563d94d066b` (`0.4.0-dev.77`) when this build was prepared  
**Current complete local test build:** `0.4.0-dev.78`  
**Previous complete build:** `0.4.0-dev.77` (rollback)  
**GitHub write status:** NOT AUTHORIZED / NOT PERFORMED for dev.78  
**Validation status:** Locally tested; live GM/player Foundry V13 verification pending. V14 is not verified.

## Mandatory next-chat startup

Read the current GitHub `LuvacZantor/zft-standards/main/PROJECT-INSTRUCTIONS.md` and applicable linked standards before changing code or repos. Inspect current remote HEAD and manifest, the dev.78 ZIP, and this handoff. Never silently replace dev.78 with older dev.77 source if local dev.78 work is the intended baseline. Keep `src/expeditions/mount-ironrot/MountIronrotV413.source.js` unchanged, alongside packs, assets and existing world-state formats. No remote commit, merge, tag or release is implicitly approved.

## Intent and scope

The owner requested that the already-designed expedition role pairings and skill rolls be realigned. We built a **situational role-check stage** without changing the established Guide navigation/hex-hours/Forced March mechanics or prematurely wiring automatic resource/Threat/Momentum/Event consequences.

Active role groups:

- Navigation: Guide (WIS Survival during Start / Continue) and Vanguard (STR Athletics default, optional DEX Acrobatics or WIS Survival).
- Reconnaissance: Scout (WIS Perception to detect, DEX Stealth for concealed approach), Tracker (INT Investigation for clues, WIS Survival for following tracks).
- Expedition Operations: Forager (WIS Survival or INT Nature), Coordinator (CHA Persuasion, WIS Insight, INT Investigation, WIS Medicine).

Saved role keys and Actor UUID assignments remain unchanged; only pair membership, display labels and the Scout default skill changed. One PC can hold only one role. The Guide alone is required for the existing hex-duration roll; the other five roles are situational and do not automatically roll each new hex.

**GM Expedition Controls → Situational Role Check** prompts the GM for a currently assigned and present non-Guide role, one of the role's allowed skills, a DC from 1–30, and optional narrative context. It uses the established Midi-QOL remote skill roll shape, automatically targets an active owning player or falls back to GM, provides the GM pending-roll recovery controls, and records a successful/failed comparison. Cancel, stale assignment, changed expedition day or cleared log cannot save a result. Separate `hexTravelRoleChecks` world setting holds a bounded record of results; each entry appears in the Expedition Log under its travel day, not under an invented hex. A Clear Log hides earlier entries by log epoch; full expedition Reset clears them. The new setting does not overwrite hex `hexTravelLedger` state. The native Midi-QOL roll also appears in Foundry Chat by design.

**No automatic travel-hour modifiers, supplies, rest effects, exhaustion, Momentum, Threat, new discovery/encounter events or world-clock changes** result from these new situational checks. The GM adjudicates any narrative outcome. The original generic RoleEngine and Event engine remain independent.

## Changed / new module files in dev.78

- `src/engines/hex-travel/HexTravelRoles.js` — paired categories, per-role skill choices, tooltip semantics.
- `src/engines/hex-travel/HexTravelRoleChecks.js` **new** — validates and performs role-appropriate GM-initiated native Midi-QOL checks, recovery, safeguards.
- `src/engines/hex-travel/HexTravelEngine.js` — role preview reads the central pair/skill metadata (Guide navigation formula unchanged).
- `src/engines/hex-travel/HexTravelConsole.js` — GM button, setting, dated log entries, preservation and reset behavior; role editor and reference choices.
- `src/styles/zft-overland-travel.css` — controls and history presentation.
- `module.json`, `src/constants/module-constants.js` — consistent version `0.4.0-dev.78`.
- `README.md`, `docs/DEVELOPMENT_STATUS.md`, `INTEGRATION_TEST_NOTES.md`, this handoff — documentation and acceptance steps.

## Local testing and remaining live acceptance

Run the module's current static checks, all relative-import checks and the new `test-dev78.mjs` outside the installed module, plus archived dev.77 resume regression tests. Preserve the 72-file dev.77 source exactly except the listed changes, and include the new runtime file for a **74-file** manual-install ZIP (including this added handoff). Rollback is the prior `zft-overland-travel-v0.4.0-dev.77.zip` plus a world backup. Automated checks are not live acceptance.

On a backed-up V13 test world with matching D&D5e/Midi-QOL versions, verify assignment persistence, three group headings and role help, every allowed skill alternative, player and GM rolls, cancel/resend/reconnect paths and stale check rejection, day rollover and log clearing. Test the unchanged Guide-only hex travel time, failure delay `1d4+2`, Forced March CON/exhaustion, hex continuation, optional clock sync, theme/window behavior and player read-only logs. Because this changes roll orchestration, verify a real GM and a real player client before trusting a campaign session.

## Next design stage (not implemented)

Build a separately agreed unified travel outcomes design for actionable reconnaissance, optional supplies, category-level outcomes, Momentum and Event/Threat interactions. Do not silently activate the generic party success tally or six automatic rolls. The current user request approved a **local build only**, not a GitHub write or stable release.
