# Orbital Realism review

This branch implements the approved direction with original Blender models and
illustrated orbital scenery. The concept boards are art references; the images
in this directory are actual game captures. The models are an interpretation,
not an exact reconstruction of the concept images.

The embedded models make GitHub's HTML diff large. [runtime-code.diff](runtime-code.diff)
shows the runtime changes with encoded asset payloads omitted; the checked manifests
and offline authoring scripts cover those payloads.

## What changed

- A shared native 3D ship on the new orbital Home screen, four organized system
  routes, mission destination and Play as the final Home section.
- Six original enemy hulls and five unique flagships, with real armor, hangars,
  batteries, rotating arms, shield pylons and gravity-engine geometry.
- Baked contact shadows and separate material finishes; attached animated exhaust.
- Eased enemy depth arrivals and grouped boss approaches within the original
  timing windows. Charger aim/rush, gold elites and combat telegraphs remain.
- Five embedded environment plates with cached GPU textures, subtle drift,
  layered moving stars and existing sector crossfades. The scenery is layered
  illustration; ships, enemies, bosses and equipment are real-time 3D.
- Corner HUD controls, a compact tutorial strip, fixed combo display and a
  phone-safe boss bar. The previous central tutorial duplication is removed.

Runtime remains one `index.html` plus the existing assets, without a framework,
build step, external model request or extra GPU context. Existing player hulls,
source-detail drones, equipment, audio and gameplay systems remain. All frozen
combat/economy hashes stay unchanged: **no balance numbers changed**.

## Fidelity and GPU budget

Full enemy hulls contain 5,184–11,600 triangles; full flagships 11,952–66,308,
plus the separate 5,120-triangle Leviathan arm. Inspection and Ultra retain those
meshes. Adaptive flight uses same-design LODs: enemies 684–764 triangles,
flagships 638–4,472, arms 424. No full-detail mesh changed during LOD tuning.
All geometry, including the small LODs, has baked contact occlusion, evaluated in
the vertex stage. Adaptive faction materials omit subpixel normal-map noise while
retaining geometric normals and GGX lighting; source-detail inspection and Ultra
retain the full surface maps. Distant exhaust reduces overdraw under GPU pressure.

Full large bosses use 32-bit indices. WebGL1 without the required extension uses
the matching 16-bit LOD while retaining native 3D. Buffers, programs, textures
and LOD variants are warmed outside combat and reused. Both flight shader bundles
are compiled during loading, and photographic sky textures are shared across
quality modes rather than uploaded on the first combat frame. The stress fixture submits
37,108 triangles versus main's 36,730, including the additional enemy exhaust.

## Reproduce

Serve on localhost and run from the repository root:

```sh
python -m http.server 8765 --bind 127.0.0.1
CHROMIUM_PATH=/usr/bin/chromium node tests/verify.cjs
CHROMIUM_PATH=/usr/bin/chromium STARFALL_ARTIFACTS=/tmp/starfall-play node tests/graphics-playthrough.cjs
STARFALL_ARTIFACTS=/tmp/starfall-review node tests/orbital-preview.cjs
```

`graphics-playthrough.cjs` clicks Home/launch, steers, completes the full first
assault and naturally spawned Mothership, pauses/resumes and defeats the boss.
It accelerates simulation and grants invulnerability only in its test page.
`orbital-preview.cjs` captures the Home and actual GPU model previews, then a
flight fixture arranging all six enemy types together for inspection.

The new verification checks packed-byte hashes, authoring revision, actual
contact-shadow pixel changes, valid 16/32-bit drawing, five cached plates,
continuous boss transforms, reduced motion, phone targets and HUD bounds, and
zero steady GPU buffer/texture allocations. Existing swept collision, frozen
balance, pooling, charger/elite, boss abilities, touch, menus, context recovery,
inspection and source-asset fidelity checks remain.

Final `tests/verify.cjs`: **all checks passed**, no browser runtime errors.
The [complete log](verification.txt) is included. The final assisted run entered
the naturally spawned boss at 28.15 simulated seconds and defeated it at 52.89,
including Pause/Resume, with no browser errors ([output](playthrough.json)).

## Frame-time measurements

Headless Chromium uses SwiftShader software rendering on this host; these are
not measurements from a physical phone. The comparison uses main `0a0200b`,
390×844, DPR 1, HD Cinematic, Interceptor, Eclipse, twelve enemies, three drones
and recurring explosions, with 120 warm-up frames per run.

The final paired 600-frame sample, candidate first, after geometry and material tuning:

| Measurement (ms) | Main | Orbital |
| --- | ---: | ---: |
| CPU submission median / p95 / max | 1.2 / 4.4 / 21.5 | 1.4 / 7.2 / 39.9 |
| rAF spacing median / p95 / max | 83.4 / 116.6 / 150.0 | 83.4 / 116.7 / 199.9 |

Combat raster width remains 390px; both submit 18 draws and retain 112 free
pooled particles at the end. Median and p95 cadence match within timing precision in this paired run. CPU
submission and the worst frame are higher, so the tail remains a review concern. The host varied: main
measured 66.7 / 100.1ms median/p95 in an earlier run. No 60fps claim is made.
Physical-phone testing and full-detail Ultra GPU profiling remain necessary;
the PR stays draft for art, frame-tail and device review. The raw final output is
[performance-hd.txt](performance-hd.txt).

## Actual captures

- [Home](home.png): shared native ship, 44px primary targets, organized systems, Play at the end.
- [Flight fixture](gameplay.png): all six enemies arranged together for inspection.
- [Enemy model previews](enemies.png) and [boss model previews](bosses.png): the
  actual GPU geometry with a tilted review camera, not concept art.
- [Naturally spawned Mothership fight](boss-fight.png): assisted full-wave run.
