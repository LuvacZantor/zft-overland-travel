# dev.126 Complication Details decision-aid acceptance

Target: Foundry V13.351 / D&D5e 5.2.5. Install dev.126 over dev.125 and restart Foundry because the package version changed.

1. Generate or reopen a pending Navigation Complication and open **View Details**.
2. At 1920×1080, verify Situation is the dominant block and the screen requires materially less scrolling than dev.125.
3. Verify the metadata strip contains only **Reconnaissance** and **Mitigation**. There must be no pre-resolution Threat/Threat Handoff metadata.
4. If Coordinator/Operational Readiness succeeded for the source hex, Mitigation must read **Operational Readiness · optional -1 Severity**. If not, it must read **Unavailable this hex**.
5. Verify **Recovery Objective** and **Suggested Response** are stacked in one full-width guidance list.
6. Verify **Allowed Consequences** is a compact inline row with the correct consequence chips. Threat may still appear here when allowed.
7. Verify **GM Result Control** remains usable: Reroll Primary + Detail, Reroll Detail, Choose Results.
8. Verify **Outcome Guidance** remains on Details but consumes less vertical space and remains readable.
9. Resolve the Complication and verify dev.124 outcome + consequence adjudication is unchanged.
10. Recheck the dev.125 combined Primary/Detail generation screen and saved correction history.
