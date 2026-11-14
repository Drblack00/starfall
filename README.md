# STARFALL

STARFALL is an original space shooter by Drblack Ventures: five skies, five bosses, one ship — pilot through Deep Space, the Ember Nebula, the Void Rift, the Cryo Abyss and the Event Horizon, and take down every boss to win.

**Play:** https://starfall-xr9e.onrender.com

## Controls

- **Move:** drag on screen (or arrow keys / WASD on desktop), or enable TILT and lean the phone
- **Fire:** automatic while playing
- **Special power (smart bomb):** tap the bomb button, press B, or touch with two fingers
- **Idle drift:** lift all fingers off the screen and the game eases down to a near-stop; touch again to resume full speed
- **Pause:** the pause button, top-right (music and sound toggles live in the pause menu)

The game is a single self-contained HTML file (`index.html`) — no build step. This repo is deployed as a static site on Render (see `render.yaml`).

## Verification for the performance/gameplay pass

The supplied revision has **five waves, one distinct boss per wave** (`TOTAL_WAVES = 5`),
not 5 acts × 4 waves. This pass preserves that existing campaign, all five boss
renderers/ability kits, all assets, and the shared home/gameplay ship renderer.
The playable game still needs only `index.html` and `assets/`; the scripts below
are development checks, with no production dependency or build step.

No balance constants changed: boss HP/bounties, weapon damage/rates/speeds,
spawn schedules/counts, rewards, and difficulty multipliers are unchanged.
Gameplay corrections do affect outcomes: swept projectile collisions prevent
missed hits; overlapping piercing bolts now hit each target only once per bolt;
boss contact remains active during attack wind-ups/bursts; Lancers ease out of
portals; losing focus clears held controls. The existing collision radii remain
unchanged. Recycled enemy bullets carry generation IDs so delayed bomb hits
cannot target a different bullet that reused the same object.

To reproduce from the repository root, install Playwright as a development tool,
then serve the page and run the checks in another terminal:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
python3 -m http.server 8765
```

```sh
node tests/verify.cjs
node tests/benchmark.cjs
```

For an installed system Chromium, prefix the Node commands with
`CHROMIUM_PATH=/path/to/chromium`. To compare a previous revision:

```sh
git show e773390:index.html > /tmp/starfall-before.html
node tests/benchmark.cjs /tmp/starfall-before.html index.html
```

The scripts instrument an intercepted **test-only response**, disable the normal
game RAF to avoid double-stepping, and drive the existing update/render functions.
They do not change the shipped page or add a debugging API to it. Regression
checks cover swept collisions, piercing-hit bookkeeping, recycled flags, stale
bomb references, contact damage for all five bosses, portal arrival, and a
20-second simulation/render for every distinct boss.

Verified on 2026-11-14 with local HTTP serving and Chromium on the shared Linux
host. Manual play covered launch, the opening assault into the Mothership fight,
keyboard steering, smart bomb, pause, and resume. The home/gameplay Vanguard
visually matched; both continue to use `drawShipModel` and the same hull cache.
No browser runtime errors occurred in the regression checks.

Seeded stress benchmark: Eclipse fight, level-5 weapon, three drones, an
80-particle explosion every 60 frames; 120 warm-up frames then 600 samples.
Player invulnerability and extra boss HP are **test fixtures only**.

| Measurement | Before | After |
| --- | ---: | ---: |
| RAF interval median | 16.7ms | 16.7ms |
| RAF interval p95 | 16.8ms | 16.8ms |
| RAF interval max | 33.3ms | 49.9ms |
| Update + render CPU median | 0.9ms | 1.0ms |
| Update + render CPU p95 | 1.7ms | 1.8ms |
| Update + render CPU max | 5.2ms | 5.9ms |

Typical cadence meets the 60fps target, but this host still exhibits occasional
long frames; these measurements do not establish a locked 60fps or a CPU-time
speedup. Pools remove repeated projectile/particle object creation after reuse,
static sky grain and enemy bolt art are cached, meter/heart DOM writes are
suppressed when unchanged, and the FPS watchdog now measures real elapsed time
rather than the clamped simulation delta. Manual play under shared-host load
also triggered the existing automatic performance mode.
