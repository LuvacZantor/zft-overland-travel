# Interface color themes | ZFT Overland Travel

Introduced in `0.4.0-dev.27`, moved to an independent window in **`0.4.0-dev.28`**. Theme changes affect presentation only, and do not alter game rules, party state, or Foundry world time.

## Open the theme editor

1. Open **ZFT Overland Travel / Expedition Dashboard**.
2. Click the **palette** button in the Dashboard header. There is intentionally **no second palette button** in the Expedition Log.
3. Use the independent floating editor to choose a preset or edit individual colors. It can be moved and resized; the columns adapt to narrower viewports.
4. Preview changes in all three ZFT panes. Click **Save Theme** to persist them for your own client, or **Cancel**, Escape, or the editor close button to restore the saved theme. Closing the main Dashboard also discards unsaved changes.

## Presets

- **Zantor Default**: the original gold, copper, parchment, and dark-brown look. This is the baseline when no overrides are selected.
- **Antique Copper**: warmer copper-heavy surfaces and accents.
- **Moonlit Slate**: blue-gray surfaces with restrained warm accents.
- **Verdigris**: weathered green/teal surfaces.
- **Graphite**: neutral charcoal/gray surfaces.

## Individual overrides

The editor has 22 named fields, arranged in four groups:

| Group | Fields |
| --- | --- |
| Surfaces | Window background; Header background; Header gradient end; Panel background; Result / day cards; Party roster; Field backgrounds; Borders and dividers |
| Typography | Primary text; Secondary text; Expedition heading; Gold accent |
| Controls | Buttons; Button hover; Button text; Progress track; Progress fill |
| Results | Navigation result background; Navigation accent border; Secondary result background; Success indicators; Failure indicators |

Each field accepts a native color picker or **six-digit hexadecimal** color such as `#2B363D`; invalid hex values cannot be saved. Each field can revert to its preset value, while **Restore Preset** clears all overrides. Switching presets starts from the chosen preset's colors.

## Storage and scope

- Foundry setting: `zft-overland-travel.interfaceTheme`.
- Scope: **client** (personal preference, not the world expedition ledger).
- Shape: `{ "preset": "zantor", "overrides": {} }`, where `overrides` contains optional `#RRGGBB` colors keyed by theme field.
- CSS theme styles are scoped to ZFT expedition panes and the theme editor, not Foundry itself, ZFT Action HUD, or other modules.
- Default appearance is intentionally a no-op on older styling so the existing look is preserved.
- Some older log entries have saved inline styles and may not fully obey a new palette; the data itself is not modified.

### Source references

- `src/theme/ThemeManager.js`: field definitions, presets, normalization, client setting, theme application.
- `src/theme/ThemeEditor.js`: independent theme window, live preview, keyboard and input handling.
- `src/styles/zft-overland-travel.css`: applied CSS variables and scoped interface styling.

Always test color contrast against character sheet overlays, dice visibility, and result success/failure legibility. No preset guarantees WCAG contrast compliance for arbitrary custom colors.
