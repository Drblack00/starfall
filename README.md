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

## Home and combat presentation (build 3D-5)

Home now ends at **Play**. Its duplicate lower navigation, pilot strip, decorative
readouts and footer have been removed. Fleet and Upgrade stay on the ship card;
the cannon and drone summary open Arsenal and Drone Bay directly. Help and model
credits are in Settings, career/unlock notices are in Contracts, and a saved run
appears inside the mission card. All existing systems remain accessible.

Home, hangar, settings preview and gameplay reuse the **same live GPU canvas and
craft renderer**, including the selected mounted weapon. Animated menu previews no
longer copy GPU frames into 2D canvases every frame. A single snapshot preserves
the outgoing ship during the leaving fade; opaque menus suspend hidden flight
rendering, including customization opened from pause; static card art is cached per section,
model revision, unlock state and equipment. One animation scheduler handles game
and menu art, and hidden ship/planet previews are skipped. The stage keeps the same
aspect ratio across screens, avoiding geometry jumps during navigation.

Keyboard Enter respects focused controls and launch confirmation, Escape returns
from menus or pauses play, and text editing no longer triggers game shortcuts.
Selection states are exposed to assistive technology, focus returns to the home
control, and primary phone controls remain reachable. Tests cover 320, 375 and
430 pixel widths, all system routes, stable layout, paused customization without repeated GPU canvas movement, and
zero steady GPU preview copies. No game mechanics are changed.

**Seventeen additional combat model adaptations** are embedded in `index.html`:

| Role | Model / creator | Triangles |
| --- | --- | ---: |
| enemy:diver | Quaternius / Dispatcher | 600 |
| enemy:weaver | Quaternius / Spitfire | 600 |
| enemy:charger | Quaternius / Striker | 600 |
| enemy:sentinel | Quaternius / Omen | 600 |
| enemy:lancer | Quaternius / Zenith | 600 |
| enemy:bulwark | Quaternius / Challenger | 600 |
| drone:scout | Kenney / craft-speedera | 280 |
| drone:wasp | Kenney / craft-speederb | 270 |
| drone:twin | Kenney / craft-speederc | 292 |
| drone:phantom | Kenney / craft-speederd | 322 |
| drone:guardian | Kenney / craft-miner | 384 |
| drone:swarm | Kenney / craft-racer | 280 |
| equipment:pulse | Kenney / blaster-a | 470 |
| equipment:scatter | Kenney / blaster-h | 296 |
| equipment:lance | Kenney / blaster-e | 638 |
| bomb | Kenney / grenade-a | 96 |
| round | Kenney / bullet-foam-tip | 12 |

The six enemy types use distinct detailed Quaternius hulls with a shared weathered
texture atlas and a 600-triangle budget. Charger aim still blinks at 10 Hz (steady
with reduced motion/flashes off), with an added hull highlight. Its rush heading
now follows its actual velocity; elite armor sits above the imported hull and
retains its enlarged/gold treatment. These are visual cues, not collision changes.

Kenney's CC0 Space Kit and Blaster Kit supply the six drone bodies, three mounted
weapons, smart bomb and blaster round. Source colors are adapted to the game's
metal/livery materials; existing drone counts and abilities and the three existing
gun types are preserved. The same cannon mesh appears on the menu and gameplay
ship. The smart-bomb body rises, turns and fades into its existing shockwave;
blaster rounds use an indexed 3D mesh shared with the existing spark batch. No new weapon stats or unlocks are added.

Ship and mounted cannon geometry is combined into one cached draw, with a bounded
24-variant rig cache. The hull vertex/index prefix remains intact, and both home
and gameplay share the same combined mesh. GPU texture caching shares one atlas
across all enemy batches. Meshes, textures,
instance storage and existing bullet/particle pools are reused. The HTML remains
self-contained, approximately **4.18 MB raw / 1.86 MB gzip**; existing assets are
unchanged, with no framework, runtime model downloads or build step. The five
assault/boss waves and five unique boss ability kits remain intact. **Balance
changes: none** — all 34 frozen functions and eight data blocks still match main.

Optional offline asset authoring (not required for running/deploying):

```sh
blender --background --python tools/export-combat.py -- QUATERNIUS_DIR KENNEY_PACKS /tmp/combat-raw.json
python3 tools/pack-combat.py /tmp/combat-raw.json index.html /tmp/combat-assets.json
```

Blender 4.3.2, numpy and Pillow were used. Source repositories, pinned revisions,
original GLB SHA-256 values and licenses are retained in the embedded metadata and
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). `tests/verify.cjs` checks the new
geometry, shared enemy texture, mounted weapon identity, drone/round/bomb use,
material resets, WebGL backends, context recovery, menu navigation and phone UI.
Verified by serving the page in Chromium and playing an assault through its boss,
including charge/special fire and pause/resume, using native WebGL1: clear in
91.7 seconds, all four hull points intact, no browser errors. Across that run,
median frame interval was 16.7 ms and p95 33.4 ms; the maximum including startup,
navigation and screenshots was 1,366.7 ms.

A 600-frame isolated comparison against the prior PR #7 commit (`3a40488`):

| Measurement | Previous | Updated |
| --- | ---: | ---: |
| Home frame median / p95 | 16.7 / 16.8 ms | 16.7 / 16.7 ms |
| Home GPU-to-2D preview copies | 599 | 0 |
| Crowded combat JS median / p95 | 0.6 / 2.4 ms | 0.6 / 1.7 ms |
| Crowded combat frame median / p95 | 16.7 / 50.0 ms | 16.8 / 50.1 ms |
| Crowded combat draw calls | 19 | 19 |

The stress scene includes the fifth boss, twelve enemies, maximum weapons, three
drones and particle bursts. It does not sustain 60 fps at the tail in this software
browser, although the added geometry preserves its draw count and median frame
interval. Physical iPhone Safari performance remains unverified.

## Imported textured fleet (build 3D-4, historical)

All twelve player ships now have imported 3D hulls. Vanguard retains the user-supplied
Nitro Blade; the other eleven use distinct models by **Quaternius** from the
[Ultimate Spaceships Pack](https://quaternius.com/packs/ultimatespaceships.html),
licensed [CC0](https://creativecommons.org/publicdomain/zero/1.0/) for commercial use.
Choose a ship in the Fleet/hangar; existing career locks stay in place.

| STARFALL slot | Imported model | Triangles |
| --- | --- | ---: |
| Phantom | Omen | 1,426 |
| Aegis | Challenger | 1,748 |
| Interceptor | Insurgent | 2,800 |
| Bulwark | Pancake | 2,688 |
| Spectre | Executioner | 2,800 |
| Tempest | Spitfire | 2,800 |
| Nomad | Dispatcher | 748 |
| Solaris | Striker | 2,800 |
| Reaper | Zenith | 2,152 |
| Starforge | Bob | 938 |
| Sovereign | Imperial | 2,642 |

Each model uses indexed triangles, normals and UVs, plus its weathered
surface texture reduced to 512×512. The four largest hulls are adapted to a mobile budget of
2,800 triangles; the remaining seven retain their source topology. The same
mesh, material shader, paint and engine renderer appears at home and in flight. Per-model exhaust anchors follow the banking
hull. Paint colors tint the textured accent areas while preserving neutral panels.
All data is embedded in `index.html`; there is no runtime model download, new external
asset, framework or build step. HTML transfer size is approximately 3.55 MB raw /
1.58 MB with HTTP gzip (main 3D-3: 1.36 / 0.40 MB). Eleven extra textured models
increase startup decoding and memory; the two existing contexts together can hold
about 29 MiB of fleet texture storage including mipmaps.

The surrounding scene gains layered nebula filaments, shaded planetary clouds
and an atmospheric rim. Sky/terrain detail uses a baked, reusable cloud texture;
the planet rim stays in its existing draw pass. Exhaust tapers smoothly instead of ending in a solid cone.
Textures use linear mip filtering to reduce distant detail shimmer. Player-only
supersampling increases edge quality when world quality is above 75%, then returns
to native density on slower devices. The player is never downsampled with the world.
World detail now recovers gradually after four stable 60Hz sampling windows; the
previous sub-14.5 ms recovery threshold could never recover on a 60Hz display.

Performance work includes an allocation-free identity-transform path for stars,
straight bolts and glows; a draw-uniform material fast path for imported hulls;
a polynomial glow falloff; cached texture bindings; and an
opacity veil for idle dimming that avoids filtering both live GPU canvases. Geometry,
textures and fixed instance storage are cached and reused; the equipped hull is
prewarmed without uploading unused ships to both GPU contexts. Existing bullet/particle
pools and swept collisions remain in place. **Gameplay balance changes: none.** All
34 frozen combat/economy functions and eight data blocks are unchanged; the five
assault/boss waves and five unique boss ability kits are retained.

`tests/verify.cjs` additionally checks all eleven imported meshes against their packed
vertices and indices, decoded textures, distinct rendered silhouettes, actual lit
flight pixels, exact home/flight geometry identity, reusable texture/buffer objects,
the transform fast path, 60Hz quality recovery, and WebGL1 compatibility. See the PR for final play and
frame-time results. The final locally served WebGL1 playthrough selected Aegis in
the hangar, cleared the first assault and Mothership, paused/resumed, and finished
with all four hull points and no browser errors in 63.7 seconds. No gameplay
fixtures were used in that playthrough. Its measured window, including startup,
navigation and screenshots, had 16.7 ms median / 33.4 ms p95 / 916.6 ms maximum
frame intervals.

Final 600-frame stress samples after 120 warm-up frames compared main `3652e9b`
with this build in the same cloud Chromium environment:

| Visual hull | Main frame interval median / p95 | New frame interval median / p95 | Main / new JS p95 |
| --- | --- | --- | --- |
| Vanguard | 16.7 / 50.0 ms | 16.7 / 50.0 ms | 1.3 / 1.2 ms |
| Interceptor | 16.7 / 33.4 ms | 16.7 / 33.4 ms | 1.0 / 1.0 ms |

Maximum frame intervals were 149.9 / 50.1 ms for main/new Vanguard and 50.1 / 50.1 ms
for Interceptor. Maximum JS work was 12.7 / 15.4 ms and 3.1 / 29.0 ms respectively.
Adaptive world scale ended at 30% for both Vanguard runs and 42% / 30% for
main/new Interceptor; the player remained at native density. P95 still exceeds the
16.7 ms target: sustained 60fps on physical iPhone Safari has not been verified.

The cached cloud texture can optionally be regenerated with
`python3 tools/make-nebula.py <output-data-uri.txt>`.

Asset provenance, licenses and transformations are in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Optional offline regeneration uses
`blender --background --python tools/simplify-fleet.py -- <source-dir> <lod-dir>`, then
`python3 tools/import-fleet.py <source-dir> <output.json> --optimized-dir <lod-dir>`
with numpy and Pillow. This reproduces the embedded data from the pinned source
files (Blender 4.3.2 was used) and is **not** needed to run or deploy the game. The `fleet-assets` payload records every original
GLB's SHA-256 and the source repository revision.

## Visible 3D flight (build 3D-3, historical)

The home preview and gameplay now use the **exact same 5,068-triangle Nitro Blade
hull**, rendered by the same live GPU craft/engine renderer. This game-ready
adaptation replaces the earlier mismatch between a 15,213-triangle home preview
and a coarse 1,881-triangle flight mesh. The previous 1,881-triangle adaptation
remains embedded as source data but is not substituted for the player in flight.

The player's view reuses the existing menu-preview GPU surface at native pixel
density and follows the gameplay coordinates with a cropped perspective view.
The surrounding world, enemies, five unique bosses, drones, projectiles and
pooled effects remain live 3D with adaptive 30–100% raster resolution. No third
GPU context or per-frame GPU-to-HUD image copy is introduced. Returning home
pauses the hidden world renderer while the live ship preview continues.

All static meshes use indexed geometry, with source triangles, normals, UVs and
material seams retained. Face winding and procedural hull normals are corrected,
so opaque geometry can use back-face culling. Buffers and upload views are
cached/prewarmed, and supported 3D devices skip unused 2D flight textures.

The ship has a 1.35x **visual-only** scale, neutral metal, painted accents, stronger
fill/specular/rim lighting, and attached volumetric engine plumes. Invulnerability
pulses a highlight while the hull remains opaque. Soft stars, distance fog and
removal of floating black shadows improve depth. Contextual hints sit below the
upper HUD, away from the default ship/charge lane. All gameplay positions,
collision radii, health, damage, movement, rates, spawn counts/timing, scores,
rewards and prices are unchanged; all frozen balance checks remain green.

Verification checks the indexed mesh against packed source triangles, outward
face winding, exact active preview/flight geometry identity, actual lit ship
pixels, native player pixel density at minimum world quality, alignment across
the playfield while banking, both GPU backends, and graphics recovery. Existing
phone, five-boss, pooling, transition and compatibility checks remain green.
Final validation used a locally served page in Chromium. `tests/verify.cjs`
passed every check. An input-driven WebGL1 playthrough visited home, cleared the
first assault and Mothership, and paused/resumed, finishing with three hull
points and no browser errors in 59.3 seconds. This run used no gameplay fixtures.

A separate 600-frame benchmark (after 120 warm-up frames) compared merged main
`e8d9a2e` with this build on the same cloud browser:

| Measurement | Main | Build 3D-3 |
| --- | ---: | ---: |
| Frame interval, median | 16.7 ms | 16.7 ms |
| Frame interval, p95 | 33.3 ms | 33.4 ms |
| Frame interval, maximum | 50.1 ms | 50.1 ms |
| JavaScript frame work, median / p95 | 0.4 / 0.8 ms | 0.5 / 1.0 ms |
| JavaScript frame work, maximum | 4.5 ms | 29.9 ms |

Both runs reached approximately 32% world resolution; the new player surface
stayed at native density. These results match the baseline frame profile, but
p95 still misses the 16.7 ms target. The broader playthrough measured 16.7 ms
median / 33.4 ms p95, with a 1.13-second maximum across startup and screenshot
capture. Neither measurement proves sustained 60fps on an iPhone; physical
Safari testing remains outstanding. The self-contained HTML is about 1.36 MB
(0.40 MB with HTTP gzip), down from main's 2.32 MB (0.72 MB gzip).

The older sections that follow record earlier revisions; their coarse player
LOD and whole-scene low-resolution descriptions no longer describe flight.

## Initial top-down 3D test ship (historical)

The primary renderer uses native WebGL2, with native WebGL1 compatibility: perspective-projected, lit triangle
meshes for ships, enemies, five distinct bosses, drones, equipment, projectiles,
and environment geometry. The original top-down controls and XY simulation stay
unchanged. HUD text and touch input remain on the full-resolution overlay.
There is no framework, runtime download, or build step. Browsers without either supported 3D backend
use the existing 2D compatibility renderer with a visible notice; context loss
also uses that renderer until WebGL recovers.

The Vanguard uses **Nitro Blade by VertaScan**, supplied by the user under CC
Attribution. The embedded preview mesh has 15,213 triangles; its flight LOD has
1,881 triangles. Both derive from the same supplied OBJ and use the same shaders
and material groups. The grill texture is embedded too. The archive lacked its
referenced MTL, so metal/glass/emissive materials were reconstructed. This is a
first 3D test integration, rather than a claim that the archive included complete
PBR materials. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution,
source and modifications. The other eleven ships and all five bosses have
procedural 3D meshes; no additional third-party models were downloaded.

Meshes and fixed-capacity instance buffers are warmed before combat. Rendering
reuses existing bullet/particle pools and uploads used ranges of typed arrays.
On slow graphics devices, dynamic raster resolution falls from 100% toward 30%;
projected shadows are disabled below 75%. HUD/input resolution and all gameplay
numbers remain unchanged. Resolution recovers on returning home. This policy
prioritizes motion on weak devices and can visibly soften the 3D scene.

Run the existing checks with the repository served on port 8765:

```sh
python3 -m http.server 8765
# In a second terminal with Playwright installed:
CHROMIUM_PATH=/usr/bin/chromium node tests/verify.cjs
CHROMIUM_PATH=/usr/bin/chromium node tests/benchmark.cjs
```

`tests/verify.cjs` includes the original balance/collision/pooling/UI checks plus
`tests/webgl.cjs`: embedded mesh decoding/depth, shared preview/flight provenance,
LOD, five boss geometries, charger aim/rush/elite cues, finite warp transforms,
steady instance-buffer reuse, GL errors, context recovery, and compatibility
fallback. Phone HUD/touch tests cover 320/375/430px. All checks pass. The 34 frozen
combat/economy functions and eight data declarations remain byte-for-byte locked:
**no balance, speed, scoring, price, spawn or collision-radius changes**.

Served-page Playwright input completed the first assault and Mothership fight in
67.8 seconds with three hull points remaining, including home/hangar navigation,
charge releases, bomb input, and pause/resume. No gameplay fixtures were applied
to that play session; no browser errors occurred. All five boss presentations
were captured separately. Physical phone/gyro testing and a full five-wave
manual clear remain unverified.

An isolated seeded comparison against main (`67df524`) used 600 frames after
120 warm-up frames in headless Chromium with the cloud software WebGL renderer:

| Measurement | Main (2D) | This branch (3D) |
| --- | ---: | ---: |
| Frame interval median / p95 | 16.7 / 33.4 ms | 16.7 / 33.4 ms |
| Frame interval maximum | 50.0 ms | 116.7 ms |
| Update/render CPU median / p95 | 0.9 / 1.6 ms | 0.4 / 0.7 ms |
| Update/render CPU maximum | 7.9 ms | 27.4 ms |

The 3D renderer settled at 31.6% raster resolution on this software device,
with 11 geometry draws and 248 instances in the final stress frame. This is a
real quality tradeoff: the 3D scene softens while the HUD stays full resolution.
An early unoptimized version missed the target substantially; lower-detail
flight/projectile/ring meshes, prewarmed buffers, conditional shadows and stable
dynamic resolution brought median/p95 back to the baseline. Maximum stalls
remain worse. These measurements establish neither locked 60fps nor console
fidelity on every device; hardware GPU/physical-phone verification is still
needed. The broader home/play/pause/capture run measured 16.7 ms median,
50.1 ms p95 and a 1116.7 ms maximum, including startup/captures and concurrent
verification work; use the isolated comparison for steady-state assessment.

The older sections that follow describe previous 2D revisions.

## 3D startup compatibility fix (build 3D-2)

The GitHub Pages artifact for merge `ccec7dc` was downloaded and compared with
main: its `index.html` is identical and contains Nitro Blade plus the WebGL
renderer. That verifies the deployment contents, not the state of a particular
phone tab. A screenshot of the old ship alone cannot distinguish stale HTML
from graphics/model startup failure.

This revision addresses those startup failures:

- Try real-time WebGL1 with native instancing and vertex arrays if WebGL2 cannot
  initialize. Both use the same mesh registry and material/lighting shader code;
  WebGL1 shader syntax is adapted at initialization. A WebGL2 shader failure
  retries WebGL1 on a fresh canvas. 2D is a last fallback when both fail.
- Load embedded, linearly packed 16-bit vertex channels directly, without browser
  stream decompression. Position error is below 0.000412 game units; these are
  rendering vertices only, with unchanged gameplay collision data. The complete
  HTML grows from 1.85 to 2.32 MB uncompressed but shrinks from 1.10 to 0.72 MB
  under HTTP gzip. No runtime downloads or build step are introduced.
- Show actual 3D/model readiness and **BUILD 3D-2** in the Ship header. Tap this
  indicator for backend details, the actual startup error, a local **RETRY 3D**
  action, and a versioned reload link. Retrying preserves the game state and
  removes abandoned scene canvases. Unsupported devices explicitly say **2D
  COMPATIBILITY**; a failed preview/model is identified separately.
- Stop retrying a failed preview context every animation frame. Retry is bounded
  and user initiated. Both backends prewarm fixed buffers; WebGL1 also prewarms
  upload views to avoid allocating typed-array slices during frames.

`tests/verify.cjs` passes, including new cases disabling WebGL2 and browser stream
decompression together, simulating WebGL2 shader failure, inspecting real Nitro
flight/preview geometry and all five bosses on WebGL1, explicit fallback errors,
retry recovery, and bounded preview failures. Existing 320/375/430px menu/HUD/
touch checks and all frozen balance checks remain green. A served-page playthrough
with WebGL2 disabled cleared the first assault and boss, including pause/resume,
in 67.4 seconds without browser errors (one hull point remaining). Its broad
startup/play/capture sample was 16.7 ms median / 33.4 ms p95; startup/captures
included a 950 ms maximum. These are Chromium software-GPU compatibility tests;
physical Safari/iPhone verification remains unconfirmed.

Isolated seeded 600-frame benchmark after 120 warm-up frames on the cloud
software GPU (all at 30% dynamic raster resolution):

| Measurement | Merged main WebGL2 | Fix WebGL2 | Fix WebGL1 |
| --- | ---: | ---: | ---: |
| Frame median / p95 | 16.7 / 50.0 ms | 16.7 / 49.9 ms | 16.7 / 50.0 ms |
| Frame maximum | 83.4 ms | 50.1 ms | 66.7 ms |
| CPU median / p95 | 0.4 / 2.2 ms | 0.3 / 2.0 ms | 0.4 / 2.6 ms |
| CPU maximum | 8.8 ms | 8.2 ms | 27.1 ms |

Use `STARFALL_WEBGL1=1 CHROMIUM_PATH=/usr/bin/chromium node tests/benchmark.cjs`
to exercise the compatibility backend. These results retain the baseline frame
profile; they do not establish locked 60fps on hardware or software devices.

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

## Attached-video reference pass

Branch `improve/video-reference-visuals` starts from main commit
`5144be4c8a14148f13010003b2fe32a85e7cb5fb`. Both supplied videos were reviewed:
the menu/inventory clip establishes the cut-corner cards, red actions, close-up
ship presentation and illuminated equipment modules; the combat/results clip
establishes industrial orbital scenery, layered metallic craft and readable
energy trails. The reference clips and extracted frames are not production assets.

This pass adds a cached material library inside `index.html`:

- Shared player hulls use extruded armour plates, beveled edge lighting,
  independently shaded nacelles, recessed glass and machined panel detail.
  Home, fleet cards, settings and flight retain the same model/renderer.
- Six enemy classes use separate cached hull materials. Drone bodies gain raised
  armour; live drone flames reuse cached engine textures. Engineering/cannon
  cards gain reactor and barrel previews using the same material vocabulary.
- All five original boss bodies and ability kits remain. Additional cached
  surface detail is different for each boss; the Leviathan's three arm plates
  track the existing blocking-arm rotation. Intro cards reuse the flight material.
- Five independently themed orbital shipyards scroll below combat, with
  parallax, shaded decks, service modules and emissive strips. These sprites are
  scenery only, outside all spawning and collision collections. Their wrap period
  moves the whole structure offscreen before it wraps, avoiding a visible jump.
- Projectile glow/core shapes are cached. Each pooled player projectile resolves
  its texture once and clears that reference when recycled. Smaller transparent
  sprite margins and a bounded station footprint reduce overdraw. Material
  construction is warmed at the existing sector-announce boundary, with its own
  seeded generator. Steady combat does no plate/mesh generation.
- Menu actions/cards, the portal tile, equipment previews and the slow home
  backdrop drift follow the visual language in the clips. Reduced-motion styles,
  original navigation, live stats and actual purchase rules are retained.

Rendering remains Canvas 2D; the material pass bakes extruded plate shading into
reusable sprites. No build step, framework, production file or external asset was
added. The single HTML runtime, existing assets, five-wave campaign, and one
assault plus one distinct boss per wave remain intact.

### Verification for this revision

`tests/verify.cjs` passes with no browser runtime errors. It now checks cached
station/enemy/boss/equipment/laser paths, distinct station and boss textures,
steady cache size, pooled projectile visual reset and the previous collision,
combo, touch, reduced-motion, transition and 12-ship shared-hull checks. Phone
layouts are checked at 320/375/430px. `tests/balance-lock.json` locks 34 original
combat/economy function bodies and eight balance data blocks against main,
including upgrade pricing, rewards, scoring, movement, attacks and collisions.
All of those checks pass: **no balance or gameplay-number changes**.

Served-page browser-driven input completed the first assault and Mothership fight
in about 84 seconds with 3 hull remaining, including home/hangar navigation,
charged shots, smart bomb and pause/resume. No combat fixtures were applied to
that play session. All five boss presentations were inspected in phone-sized
renders. Physical phone hardware/gyro and a full manual five-wave clear were not
verified.

The warmed seeded stress benchmark uses the existing `tests/benchmark.cjs`
workload and 600 samples after 120 warm-up frames:

| Measurement | Main | This branch |
| --- | ---: | ---: |
| RAF median / p95 | 16.7 / 16.8ms | 16.7 / 16.8ms |
| RAF maximum | 50.0ms | 33.5ms |
| Update/render CPU median / p95 | 1.0 / 1.7ms | 0.8 / 1.5ms |
| Update/render CPU maximum | 7.4ms | 5.9ms |

An earlier material version increased frame-time p95 to 33.4ms. Reducing the
station footprint, dropping redundant background rotation, trimming projectile
transparent margins and avoiding straight-bolt transforms corrected that
regression in the isolated comparison above. The broader startup/UI/play/capture
session measured 16.7ms median / 16.8ms p95 with a 900ms maximum. Cold asset work,
screenshots and shared-host scheduling can still stall; these measurements do
not establish locked 60fps on all hardware.
