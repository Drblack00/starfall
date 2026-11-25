# STARFALL: next-flight review

**Design samples only. No production gameplay changes and no merge requested.**

Open `index.html` with its `assets` directory, or extract the downloadable review ZIP and open its `index.html`. The review includes animated samples, clickable equipment/settings concepts, all 15 hull ability proposals, and three original audio sketches. There are no external dependencies or autoplay audio. Selection buttons store review preferences only, using `sf-review-*` keys; they never change game saves.

## Visuals, motion and audio

- [Entrance choices](formations.png) · [animated entrance clip](entrances.mp4) · [GIF](entrances.gif)
- [Hyperspace choices](jump.png) · [animated defeat-to-jump clip](hyperspace.mp4) · [GIF](hyperspace.gif)
- [Home, equipment and settings concepts](interface.png)
- [All fifteen ability proposals](abilities.png)
- Listen: [Orbital Assault](assets/orbital.mp3) · [Reactor Siege](assets/reactor.mp3) · [Deep Vector](assets/vector.mp3)
- [Download the interactive review pack](STARFALL-review.zip)
- [Model and music credits](ASSET-CREDITS.md)

## Review choices

| Area | A | B | C |
| --- | --- | --- | --- |
| Enemy arrivals | **Spearhead:** five-ship banking V | **Crossfire:** six craft in opposing flank pairs | **Escort:** armored lead with four screens |
| Hyperspace | **Orbital Slingshot:** deep blue lens tunnel | **Rift Lens:** rotating violet aperture | **Solar Corridor:** amber thrust rails |
| Music | **Orbital Assault:** 132 BPM hybrid electronic | **Reactor Siege:** 148 BPM industrial | **Deep Vector:** 118 BPM cinematic breakbeat |

Recommended: rotate all three squad types through the existing campaign, use Orbital Slingshot for travel, and develop Orbital Assault with a Reactor Siege boss layer. Use warning → bank/brake → lock → attack for entrances, and staged reactor failure → wreck clearance → alignment → accelerating jump → eased arrival for travel. The preview timeline is illustrative; it is not a change to game spawn or transition timing.

Squad changes alter enemy concurrency and pressure even if total counts stay fixed. Before implementation, settle safe lanes, maximum simultaneous squads, first-shot telegraphs and wave distribution. Do not add enemies or change frozen baseline values without an explicit reviewed gameplay change. Five waves and all five unique bosses remain the intended structure.

## Hull identity proposals

These are interaction designs, not tuned values. Each needs explicit cooldown, duration, damage and boss-interaction rules in an implementation review.

| Hull | Proposed special | Distinct decision |
| --- | --- | --- |
| Vanguard | Dash Slash | Commit to a forward cutting lane |
| Phantom | Phase Lance | Line up a charged piercing beam |
| Aegis | Reflection Dome | Angle a shield to return fire |
| Interceptor | Vector Drift | Choose a high-speed strafe exit |
| Bulwark | Siege Anchor | Trade movement for lane control |
| Spectre | Decoy Echo | Divert enemy aim while repositioning |
| Tempest | Arc Chain | Arrange targets for a branching link |
| Nomad | Salvage Field | Gather loose pickups and debris |
| Solaris | Corona Wall | Deny a directional approach |
| Reaper | Execution Mark | Maintain focus on one priority target |
| Starforge | Mine Constellation | Set a trap, then clear the deployment area |
| Sovereign | Gravity Well | Place a bounded projectile/foe control field |
| Gunship | Orbital Designator | Predict movement for a delayed strike |
| Wraith | Phase Rewind | Return along a recent visible flight path |
| Carrier | Interceptor Wing | Direct temporary escorts between guard/intercept/focus |

## Interface direction

Larger ordinary-case helper copy, a strong reading surface behind controls, a single primary action, short system labels and a consistent hierarchy. Home ends at Play. Equipment shares one preview area and tabs. Settings groups display, audio, accessibility and controls with descriptions beside the relevant option. These concepts do not remove inventory, progression, contracts or other existing features; secondary routes would remain available in the complete implementation.

## What these samples actually render

Enemy/player/drone/weapon/boss pictures were captured from the existing native STARFALL 3D renderer. The standalone prototype animates cached 2D captures on Canvas, over the existing orbital scenery. It does not implement new 3D gameplay, physically accurate destruction, new models or a production hyperspace shader. Its small sprite/canvas budget is useful for motion review, but is not a performance benchmark of a final native 3D implementation.

The original live `index.html`, all assets, balance locks and game renderer are unchanged. Final native effects should use the existing pools, prewarmed GPU resources, shared renderer, reduced-motion support and bounded effects. Avoid full-screen strobe, camera jumps, spawn invulnerability exploits, and large flashes concealing attack telegraphs.

The three audio files are original synthesized composition sketches, not finished orchestral recordings. Listen before choosing; final instrument quality and interactive transitions are still production work. [Composer source](source/music.py) is included for reproducibility. The game retains all existing third-party model attribution.

## Verification

Serve repository root on localhost:8765, then run `node tests/flight-review.cjs`. Checks cover controls/selection, actual frame changes, reduced-motion stability, audio decoding and stereo duration, no horizontal overflow at 320/390/768/1320px, and browser runtime errors. `STARFALL_REVIEW_EXPORT=1` also exports screenshots and frame sequences. Final results are in [sample checks](sample-checks.json) and [game verification](verify.log).

The media are exported from this actual prototype. They are review samples, not captures of changes deployed to the live game.
