# Local Validation — 0.4.0-dev.106

**Scope:** Travel Log presentation deduplication only.

## Results

- Full Node regression suite: **118/118 passed**.
- JavaScript/MJS syntax: **72 checked, 0 failures**.
- Relative ES-module imports: **151 checked, 0 missing**.
- JSON files: **2 checked, 0 failures**.
- CSS structural braces: **1661 open / 1661 close**.
- Protected files compared with the complete dev.105 package: **32/32 byte-identical**.
- Protected `src/expeditions/mount-ironrot/MountIronrotV413.source.js` SHA-256: `9f6d6d5236191ace9e554e22dc066927d97ef712f324c7a0d21ffaf311ae7425`.
- Manual-install archive: exactly one top-level `zft-overland-travel/` wrapper with `module.json` directly inside.
- Archive file count: **133 files**.
- Fresh extraction: **118/118 tests passed**, **72 syntax checks**, **151 imports / 0 missing**.

## Behavior covered

- Duplicate upper Navigation roll block is absent from expanded Travel Log hexes.
- Travel Time remains and retains total hours, base dice, pace, delay dice, and original roll detail.
- Authoritative lower Navigation phase retains Guide/Vanguard results, grade, Travel Quality points, and now the saved DC in its header.
- Legacy pre-Vanguard Secondary evidence is preserved rather than discarded.
- No travel, role, Travel Quality, Momentum, Event, Threat, Forced March/Exhaustion, clock, or persistence mechanics changed.

**Evidence level:** locally validated only. Live Foundry V13.351 / D&D5e 5.2.5 acceptance remains required.
