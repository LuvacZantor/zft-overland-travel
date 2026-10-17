# Mount Ironrot: rules and workflow

This file records the **agreed table adaptation**, not the generic ZFT Overland Travel module's mechanics.

## Travel time (one custom-map hex)

The official adventure discusses 2d4 hours **between locations**; this campaign uses a **custom hex map** and deliberately adapts that to **2d4 hours per hex at Normal pace**.

| Chosen pace | Multiplier on 2d4 base hours | Calculation |
|---|---:|---|
| Fast | 0.75 | round UP |
| Normal | 1.00 | round UP |
| Slow | 1.50 | round UP |

Roll pace-adjusted travel time as **`Math.ceil((2d4 result) * multiplier)`**. Travel times are in-game hours, not table time.

## Navigation check and failure

- One selected navigator makes a **DC 15 Wisdom (Survival)** check for the hex.
- In Mount Ironrot outdoor conditions, navigation Survival checks have environmental **Disadvantage**.
- Slow pace gives **Advantage** to Survival (and Perception), which can cancel the environmental Disadvantage; the standard rules/system and GM corrections still determine the final roll.
- Fast pace gives Disadvantage to Perception, Survival, and Stealth; Normal pace gives Disadvantage to Stealth.
- The roll dialog remains adjustable by the actual roller; the GM reviews the result and may override an incorrect success/failure before time is rolled.
- **If navigation fails, add `1d4 + 2` hours (3–6 hours) AFTER applying pace and rounding to base time.** This replaces the adventure's doubled-time navigation penalty for this hex adaptation.
- On navigation success, no delay die is rolled.

**Examples (illustrative):** `2d4 = 5` at Fast pace -> `ceil(5 × .75) = 4` hours. A failed navigation penalty die of `2` adds `2+2 = 4` hours, giving **8** hours. If the pace is Slow, `ceil(5 × 1.5) = 8` hours before any failure penalty.

The macro evaluates one native Foundry `Roll`: `2d4` after success, or `2d4 + 1d4 + 2` after failure. The base two d4 and the extra delay d4 are shown separately on the final themed card, and Dice So Nice can animate the real rolls.

## Optional secondary exploration activity

Selected **before entering each hex**. **None** is default and means no secondary check or penalty. When chosen, assign a **different main character** from the navigator. **v4.4 prevents invalid selection in the UI:** the selected navigator is excluded from the Secondary PC dropdown; changing the navigator dynamically refreshes that dropdown without unnecessarily losing a valid secondary selection. A single-character roster cannot select a secondary activity. A user with permission may roll for either character, even though the **two selected PCs must be different**. One optional secondary activity per hex:

| Activity | Skill | Purpose / GM adjudication |
|---|---|---|
| None | — | No secondary check |
| Scout Ahead | Perception | Spot threats and hazards ahead |
| Arcane Survey | Arcana | Notice magical anomalies |
| Investigate Route | Investigation | Find clues, ruins or landmarks |
| Conceal Party | Stealth | Avoid detection / improve approach |
| Environmental Assessment | Nature | Identify surrounding hazards |

The secondary skill check has **no universal DC, automatic pass/fail reward, or travel-time penalty** in the macro. Consequences and discoveries are adjudicated by the GM. Relevant travel-pace skill modifiers apply. These activities are optional table additions, not specified Chapter 4 rules.

## Actor selection and cross-client skill rolls

- Only the **GM initiates** the travel macro.
- Main characters come exclusively from assigned **Player Configuration** actors, not token placement or currently connected accounts.
- The **character** being checked and the **user** who rolls are separate selections.
- Auto roller selection prioritizes the assigned online player, then another connected player with **Owner** permission, then GM. GM can explicitly choose an eligible roller.
- Uses Midi-QOL's existing `MidiQOL.socket().executeAsUser("rollAbility", userId, request)` API to open the selected user's skill dialog on their client. This is **not** a whispered roll-request message, contested roll, or required helper module.
- Rolls are configurable / non-fast-forwarded. The script waits for each result; a canceled/failed request can be retried or rerouted to the GM.
- **Current behavior is sequential:** navigation first, then secondary check (if selected), then GM review, then travel dice. Secondary checks are **not** prompted simultaneously in v4.3.

## Progressive chat card

1. **Started:** one public Mount Ironrot card posted with pace, actors, and pending checks.
2. **Navigation complete:** replace the card with a fresh latest-message card showing navigation total.
3. **Secondary complete (optional):** replace with the secondary total.
4. **GM confirmation / rolling:** update the existing card's status to **ROLLING TRAVEL DICE**, keeping it visible.
5. **Complete:** create final chat message including native Foundry dice roll data. When Dice So Nice supports `waitFor3DAnimationByMessageID`, wait for dice animation before deleting the previous progress card, avoiding a disappearing-card gap.

Intermediate *travel status* cards are removed; actual skill-check roll messages still appear separately in chat. Reposting progress cards generally keeps the journey near the bottom of chat but **cannot force every client to scroll**. Dice So Nice animation timing may vary between clients.

## Outside macro scope

Travel can normally proceed up to **8 in-game hours per day** before forced-march considerations, but tracking travel across days / partial hexes is manual. Food, water, encumbrance, exhaustion, encounter resolution, in-game clock advancement, tokens and hex map movement are **not automated**. There is no safe assumption that foraging is available in the Mournland. Keep GM adjudication and established adventure content separate from this convenience macro.
