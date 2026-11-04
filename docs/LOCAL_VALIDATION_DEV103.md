# Local Validation — 0.4.0-dev.103

**Date:** November 3, 2026  
**Target for live acceptance:** Foundry V13.351 / D&D5e 5.2.5  
**Evidence level:** locally validated only

## Scope

- Promote Dashboard NEXT messaging to a workflow-first CURRENT STEP panel above stats/results.
- Add restrained phase color identity for Navigation, Reconnaissance, Expedition Support and Event stages.
- Correct Log role-grade semantics so Failed is red, Partial amber, Strong green, pending confirmation amber.
- Reuse semantic Dashboard result color in Expedition Outcome/Event Log tiles.
- Clarify New Travel Day wording so fresh daily allowance and unfinished-hex carryover are distinct concepts.
- No gameplay/persistence changes.

## Automated validation

- Node test suite: **110/110 passed**.
- Dev.103 regression coverage includes Current Step placement, phase accents, role-grade color classes, semantic outcome classes, and New Travel Day wording.
- Existing Expedition workflow, Event, Threat, ledger, Forced March, correction, persistence and historical UI tests remain passing.

## Preservation requirements

- Protected `src/expeditions/mount-ironrot/MountIronrotV413.source.js` must remain SHA-256 `9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425`.
- Packs/assets/migration/themes must remain unchanged from dev.102.
- Current Momentum mechanics remain `−2 / −1 / 0 / +1 / +2`.
- Explicit Roll Event and explicit Commit Travel boundaries remain unchanged.

## Required live acceptance

Use the dev.103 section at the top of `INTEGRATION_TEST_NOTES.md`. Static/package checks do not certify visual behavior in Foundry.
