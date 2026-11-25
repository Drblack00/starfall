# STARFALL / Foundry Flight

An interactive overhaul sample informed by the supplied **Phoenix 2 gameplay video**. This is a design review branch, not a deployed gameplay change.

## Review media

- [Home](home.png) · [Hangar](hangar.png) · [Blasters](weapons.png) · [Drones](drones.png) · [Settings](settings.png)
- [Spearhead](squad.png) · [Crossfire](crossfire.png) · [Armored escort](escort.png)
- [Boss combat](boss.png) · [Defeat](defeat.png) · [Hyperspace](warp.png)
- [Native 3D motion clip](foundry-flight.mp4) · [Animated preview](preview.gif)
- [Original action-score sketch](action-study.mp3)
- [All five boss models](bosses.png) · [Presentation overview](overview.png)

## Open the interactive sample

Serve repository root and visit `/docs/phoenix-overhaul/`:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

The sample loads the existing game engine in a same-origin iframe. The roughly 50MB embedded fleet is loaded once. It needs an HTTP server and native WebGL; opening the HTML directly with a `file:` URL will not provide a reliable same-origin engine session.

Use Play Sample or the encounter cue buttons. Drag to steer during combat. Use Hangar to inspect and select hulls, Blasters to select a cannon, and Drone Bay to inspect escorts. The native model and mounted rig are reused in flight. Controls work at phone widths; the sample device remains tall enough for readable type and touch targets, and the native viewport retains its aspect ratio. Settings and the review page scroll where needed.

## What the video contributed

The supplied video is **188.95 seconds, 432×936, 20fps**, with audio. I inspected a timeline covering the full recording and denser frame sequences around the heavy-enemy encounters and victory transition. The footage's 20fps encoding cannot establish the original game's device frame rate.

| Reference segment | Observation | STARFALL interpretation |
| --- | --- | --- |
| 00:00–00:30 | The industrial world scrolls continuously beneath the ship. Small high-contrast HUD elements leave the field open. | A scrolling native 3D foundry: deck plates, rails, elevated crossbeams, turbine mechanisms and light channels. Compact corner HUD and bottom actions. |
| 00:46–00:59 | Heavy enemies arrive together, expose bright cores and launch readable red bead patterns. | Banked squad arrivals, deliberate braking, contrasting cores and rounded red projectiles. |
| 01:04–01:30 | Curving blue/gold weapon trails make targeting feel active. | Native mesh segments form moving tracking trails with luminous heads, alongside straight cyan fire. |
| 01:36–02:16 | A large flagship dominates the upper field; bright attacks communicate changes in pressure. | Five separate native flagship meshes with visible cores and restrained top health rails. Scripted visual studies retain their separate identities. |
| 02:16–02:28 | Reactor bursts resolve into a continuous bright travel sequence. | Sequential core ruptures, pooled sparks/chunks, ship alignment, exhaust spool and a native 3D tunnel. The sample avoids a full-screen strobe. |
| 02:40–03:08 | Ship, mission and system panels have distinct hierarchy and primary actions. | One command deck with clear system routes; common equipment panels and grouped Settings. Home ends at Play. |

No Phoenix 2 artwork, meshes, interface graphics, characters, music or video frames are included in the runtime or repository. The recording is a reference for pacing, composition, readability and motion.

## What is native 3D here

The sample uses the existing `SF3D` WebGL renderer, its physical ship materials, the actual embedded player/enemy/boss/drone/weapon triangle meshes, shared mounted rigs, instancing, and the existing animated exhaust shader. It does not use cached craft screenshots. The foundry is original geometry with depth, cheaper distant-surface lighting and independently moving mechanisms. The fleet retains its existing physical materials. Round projectiles are a prewarmed 16-segment mesh. The tunnel uses native instanced geometry and depth.

Player hull inspection and flight use the same `getRig` output. Enemy hulls remain separate from the arsenal. Five boss models are prewarmed and separately selectable: Mothership, Dreadnought, Leviathan, Cryowarden and Eclipse. Their scripted visual studies differ; these are not replacements for the production kits or a new balanced campaign.

The mock encounter is a 36-second continuous loop: Spearhead → Crossfire → armored escort → flagship → staged destruction → hyperspace → arrival. Drag steering and special/escort/bomb buttons preview motion and effects. It has **no collision resolution, damage, rewards or progression**. Displayed score/HP and encounter timing are illustrative.

The fifteen hull ability concepts from the prior review are carried forward. Their signature effects are visual prototypes; timing, damage, cooldowns and competitive rules are not implemented as gameplay. Special effects can be reviewed with any selected hull, but this is not a completed fifteen-ability combat system.

## Scope and performance

- Production `index.html`, existing assets, balance locks, wave structure, all five boss kits and the standard verification runner are byte-unchanged from main at `d1b966c`.
- Sample-only state and appearance changes occur in the embedded engine instance. The production loop is suspended there, and the review controller submits the native scene. It does not write game saves or progress.
- A fixed 256-slot typed particle pool, prewarmed instance storage and bounded primitive batches serve the new effects. No per-frame mesh construction or steady GPU buffer/texture/program creation.
- The native scene and overlay pause together. Hidden/paused samples do not keep submitting the scene; reduced motion steadies camera, engine and travel effects.
- The prototype's lighting, industrial environment and effects are a new art direction. This is not a claim of photorealism, finished AAA production assets, or 60fps on every phone.
- The exported motion clip is an **offline 24fps** rendering of selected native scenes with a thin capture HUD: squad arrival, boss engagement, then a continuous defeat-to-hyperspace sequence. Crossfades between those chapters join editorial excerpts; the interactive sample itself runs the full 36-second loop. The clip demonstrates paths and timing, not measured live device frame pacing. Actual UI screenshots come from the interactive page.
- Music is the original Orbital Assault electronic composition sketch from the preceding review, presented as a candidate for the overhaul. It is not music extracted from the reference or a finished adaptive soundtrack.

## Verification

```sh
CHROMIUM_PATH=/usr/bin/chromium node tests/phoenix-overhaul.cjs
CHROMIUM_PATH=/usr/bin/chromium node tests/verify.cjs
```

The dedicated check verifies native WebGL pixels, selected Home/flight rig identity, equipment selection, pause/resume, all five distinct boss meshes, bounded typed effects, no steady GPU resource creation, readable phone layouts at 320/390/768/1360px, reduced motion, large text, original audio decoding, and unchanged game saves. `STARFALL_OVERHAUL_EXPORT=1` also captures the screenshots and offline native frames.

[Sample verification results](sample-checks.log) · [Full game checks](verify.log). CPU submission figures are diagnostic sample measurements and exclude GPU execution/presentation time; they cannot establish a 60fps result.

[Existing model credits](ASSET-CREDITS.md) remain applicable.

The first full-suite run, concurrent with the native export/check browser, hit the existing menu test's 1px sticky-header tolerance during an animation (1.36px observed). The suite was then rerun alone; the final output is the linked verification log. No production or test tolerance was changed.
