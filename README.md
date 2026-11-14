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

## Follow-up: graphics and console UI

The combo regression is fixed in a separate commit: every kill restarts one
reusable Web Animation, including rapid kills while it is running and kills
after it finishes. The hot path has no forced layout read or animation allocation.

The presentation pass adds textured, cached nebula layers with flight/gyro
parallax, luminous near stars, cached atmosphere light, stronger shared ship
specular/panel shading, cached engine flames and glow, and pooled explosion
cores/afterglows and sparks. The five original bosses retain their materials
under sustained hit feedback, gain entrance lighting/brackets, and each has a
separate health-bar signature, accent and segmentation treatment. An expired
intro card now releases touch input instead of leaving an invisible hit target.

Flight HUD and menus share dark console panels, restrained cyan/amber lighting,
refined type, distinct score/objective/boss lanes, larger touch targets and
hover/press/focus states. Screen, confirmation and meter transitions fade/slide;
rapid navigation cancels stale exit timers. Reduced-motion and flash settings
remain respected. All production graphics stay inline in `index.html`, using
the existing assets; no new runtime dependencies or media assets were added.

**Balance remains frozen.** All 21 inspected combat/spawning/damage functions
and the weapon, boss HP/bounty, collision-radius and campaign-size tables match
the revision before this presentation pass. The campaign is still five waves,
with five different bosses and all existing equipment/features.

Verification for the follow-up:

- `tests/verify.cjs` passes: previous collision/pooling/boss checks plus rapid
  combo retriggering, delayed pooled afterglow/reset, shared cached hull identity
  through the actual home/flight paths for all 12 ships, five HUD signatures,
  transition races, intro-card touch release, reduced motion, and HUD/touch
  checks at 320/375/430px (also checking large-text spacing).
- Served the actual page at port 8765 and used a Playwright-driven pilot with
  real pointer/keyboard input and read-only game-state observations: home,
  hangar/back, launch, a complete first assault and Mothership defeat,
  smart bomb and charged shots, pause/resume. Wave 1 cleared in about 103s with
  3 hull remaining; no health/damage/spawn fixtures were applied to this play
  session and no browser runtime errors occurred. All five boss presentations
  were also rendered and visually inspected in phone-sized screenshots.
- The 600-frame seeded stress benchmark compared the combo-fix revision to
  this presentation pass, with the same 120-frame warm-up and workload described
  above. RAF median/p95: **16.7/16.7ms before → 16.7/16.8ms after**;
  maximum: **16.8 → 33.4ms**. Update/render CPU median/p95:
  **0.8/1.7ms → 1.0/2.0ms**. This is additional presentation cost, not a speedup.
  The full UI/play/capture session also had a 16.7ms median and 16.8ms p95,
  but an approximately 500ms maximum across startup, screenshots and shared-host
  load; automatic performance mode activated. A locked 60fps on all hardware
  is not established. Physical mobile hardware/gyro was not verified.

## Reference-led home screen revision

The next presentation revision follows the supplied portrait reference: full-bleed
world/ship artwork, four angular shortcut tiles, large SHIP and MISSION cards,
and a prominent red PLAY action. The selected hull, weapon, drone and destination
use the existing live data and controls. Additional navigation remains available
below the primary cards; resume/unlock notices still appear when relevant.
Phone checks ensure the primary cards are not clipped and Play is visible without
scrolling at 320/375/430px. A stage ResizeObserver refits the gameplay canvas when
moving between the full-height home layout and the original gameplay aspect ratio.

The full-size background ship and selected-ship portrait use the same shared
flight renderer. New machined armour detail is baked into its existing hull cache.
Planet sprites now use a cached spherical material pass with coherent terrain,
diffuse/ambient lighting, ocean specular, cloud shading, emissive fissures and a
lit atmosphere rim. Pixel synthesis happens only on a sprite-cache miss, with
an independent terrain seed; it never runs inside the steady-state render path.
No production assets, dependencies, gameplay constants, waves or boss kits changed.

Verified this revision with the complete regression suite, phone layouts and touch
checks, plus a served-page playthrough: first wave and Mothership defeated in
73 seconds, pause/resume exercised, 3 hull remaining, no browser errors. The
600-frame warm stress sample measured 16.7ms median / 16.8ms p95 RAF intervals
(max 50.1ms), and 0.9ms median / 2.4ms p95 update/render CPU time. The broader
startup/UI/play/capture sample included an 850ms maximum; initial procedural
sprite construction and shared-host load remain limitations, not locked 60fps.
