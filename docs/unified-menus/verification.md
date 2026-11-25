# Unified Orbital menus

The equipment, settings and mission screens now follow the Home flight deck's navy and pearl visual language. A sticky shared header provides Back, the current section, and Hub / Hangar / Blasters / Drones / Settings navigation. Larger consistent preview panels, continuous catalogue grids, selection marks, spacing and touch targets make switching systems more predictable.

Hangar groups ship inspection, Paint, Upgrades and Pilot. Appearance contains prestige liveries; Engineering retains its flight-systems notes. Settings separates Audio, Steering, Graphics, Accessibility & Feedback, and Interface, with About and model attribution still available. Campaign and Contracts share a section switch; mission rewards sit below their descriptions. Pause, defeat, victory and launch confirmation use matching surfaces and buttons.

## Scope and compatibility

- Original control and card nodes are moved rather than cloned, preserving IDs, listeners, selection order and saved loadouts. No catalogue entries or modes are removed.
- All nine existing script blocks, including embedded assets and gameplay/rendering logic, are byte-identical to main at `63d686b`. One UI organization script and one scoped stylesheet are added.
- No balance changes: health, damage, rates, speeds, spawning, rewards, prices, difficulty and collision radii are unchanged. Five waves and all five unique bosses retain their kits.
- The same native GPU preview surface and renderer remain shared. No new render loops or contexts. One background is encoded once and stored in a static stylesheet rule, away from the frequently updated stage inline style.
- Menu transitions use opacity and translation; they do not scale the live GPU canvas. Large-text and reduced-motion settings are respected.

## Verification

Served the repository with `python -m http.server 8765 --bind 127.0.0.1`, then ran:

```sh
CHROMIUM_PATH=/usr/bin/chromium node tests/verify.cjs
STARFALL_ARTIFACTS=work/menu-audit/play CHROMIUM_PATH=/usr/bin/chromium node tests/graphics-playthrough.cjs
```

[Full verification output](verify.log): every check passed, including frozen balance, collisions, five boss kits, native WebGL paths, physical materials, exhaust, presentation, HD, inspection and reduced motion. No browser runtime errors.

`tests/unified-menus.cjs` is now part of the full suite. It checks nine menu routes at 320, 375 and 430px; sticky headers; 44px primary navigation targets; horizontal overflow; mission text/reward separation; every catalogue option and unique ID; settings organization; native weapon/drone selection; modal layouts; large text; reduced motion; and zero new GPU buffers, textures or programs across 30 steady preview frames. GPU contexts remain bounded to the original shared pair.

[Assisted playthrough result](playthrough.json): launched from Home, exercised pointer steering, completed the first assault, reached the naturally spawned Mothership, paused/resumed, and defeated it. The browser test uses invulnerability and accelerated fixed simulation steps; these are test-page changes only. This verifies the flow, not human difficulty or real-time frame pacing.

No new frame-time benchmark was taken for this UI-only change. The existing software-GPU frame-time limitations documented in [the graphics pass](../orbital-realism/verification.md) remain; this pass does not establish a 60fps guarantee. Steady GPU resource reuse and the unchanged game render/update code were verified.

## Actual served-game screenshots

Captured at a 375px viewport with 2x device scale, using the real game and shared native models. These are screenshots, not concept art.

| Section | Preview |
| --- | --- |
| Hangar | [Ship inspector and fleet](hangar.png) |
| Blasters | [Weapon catalogue](arsenal.png) |
| Drones | [Escort catalogue](drones.png) |
| Appearance | [Paint and prestige liveries](livery.png) |
| Engineering | [Upgrade layout](engineering.png) |
| Pilots | [Pilot selection](pilots.png) |
| Settings | [Organized preferences](settings.png) |
| Campaign | [Mission cards and reward footers](campaign.png) |
| Contracts | [Objectives and achievements](quests.png) |
| Pause | [Matching modal controls](pause.png) |
