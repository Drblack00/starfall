# Nitro Blade

**Nitro Blade** by **VertaScan** — [original model on Sketchfab](https://sketchfab.com/3d-models/nitro-blade-6c34eb48b0c44667864a2af3fed92d6c).
Licensed under [Creative Commons Attribution](https://creativecommons.org/licenses/by/4.0/). The supplied Sketchfab licensing screenshot permits commercial use and requires author credit. Credit and license links also appear on the game's home screen.

The user supplied the OBJ and grill texture in `nitro-blade.zip`. The original OBJ references a material library that was absent from that archive. This adaptation reconstructs metal, glass, and emissive materials using its named material groups, retains the supplied grill texture, normalizes the mesh, and triangulates/decimates it for the browser. Home and flight use the same 5,068-triangle game-ready mesh, with indexed vertices and outward face winding. The older 1,881-triangle mesh remains embedded as source data but is no longer substituted for the player during flight. Vertex channels are linearly packed into 16-bit values for decoding on browsers without stream decompression; position quantization error is below 0.001 rendering units. Both meshes are embedded in `index.html`, along with the texture; the original archive is not required at runtime.

This model is used for the Vanguard visual. The five bosses use game-authored procedural geometry. Drones, weapons and ordnance use the Kenney models listed below. The other eleven player ships use the Quaternius models listed below. No endorsement by the original creator is implied.

# Ultimate Spaceships Pack

**Quaternius** — [official pack page](https://quaternius.com/packs/ultimatespaceships.html).
The official page identifies the pack as **CC0** and permits personal and commercial
projects. [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).
Credit and source links also appear on the game's home screen.

Downloaded GLBs from the [Quaternius showcase model mirror](https://github.com/trebeljahr/quaternius-showcase/tree/0128ca510d653bb04d6d1e4885bd8890b5050b4f/public/glb/spaceships_pack),
revision `0128ca510d653bb04d6d1e4885bd8890b5050b4f`. Its
[model license inventory](https://github.com/trebeljahr/quaternius-showcase/blob/0128ca510d653bb04d6d1e4885bd8890b5050b4f/LICENSES.md)
also identifies these models as Quaternius CC0 assets. No showcase application code
is included. The downloaded source files total about 33 MB and are not required at
runtime. Original file hashes are retained in the embedded `fleet-assets` metadata.

| STARFALL slot | Source model | Triangles |
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

Modifications: normalized to the existing render coordinate system; corrected face
winding to match outward normals; retained source topology for seven hulls;
decimated Insurgent (8,292), Striker (4,530), Spitfire (3,512), and Executioner
(3,388) to 2,800 triangles each using Blender 4.3.2 while retaining UV mapping;
linearly packed vertex channels into 16-bit data with 16-bit indices; resized the
source color textures to 512×512 JPEG; added shader paint tint, lighting and per-model
engine anchors. Both mesh data and textures are embedded in `index.html`. Model
names are credited here; existing STARFALL ship names, stats and career unlocks stay
unchanged. No endorsement by Quaternius or the mirror maintainer is implied.

# Combat models and equipment (build 3D-5)

Six Quaternius hull adaptations supply the enemy fleet, retaining the original
creator's CC0 license and the pinned source revision above. These adaptations
have 600 triangles each, outward normals and normalized/packed indexed vertices.
Their source UVs are remapped into one guttered 1024×512 atlas derived from the
pack's color textures. Charger/elite cue overlays are game-authored.

Additional models by **Kenney** come from the official
[Space Kit](https://kenney.nl/assets/space-kit) and
[Blaster Kit](https://kenney.nl/assets/blaster-kit), both licensed
[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) for personal
and commercial use. Credit and source links are available in Settings → model credits.

Downloaded from [Hidencod/tge-assets](https://github.com/Hidencod/tge-assets/tree/3ddcc695adbba9fb918cf31b7c139b3f95b76910/packs),
revision `3ddcc695adbba9fb918cf31b7c139b3f95b76910`. The mirror identifies its model
library as Kenney CC0 assets; no library/editor application code is included.

| Game role | Source model / creator | Triangles |
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

Modifications: applied node transforms, normalized axes and display dimensions,
triangulated and budgeted geometry, reconstructed vertex/material colors for
Kenney equipment, mapped colored panels to the game's livery, added weapon mounts
and ordnance animation, and packed indexed geometry into portable 16-bit data.
Original GLB SHA-256 hashes, source filenames and revisions are in `combat-assets`.
No original archives or model downloads are required at runtime. No endorsement
by either creator or mirror maintainer is implied.

The blaster round is normalized to a unit projectile with a 12-triangle budget,
emissive material, and reused spark-batch rendering. Mounted weapon geometry is
combined with the unchanged hull geometry into cached rigs to avoid extra draws.


# Drone-mounted cannons (build 3D-6)

**Quaternius — [Sci-Fi Modular Gun Pack](https://quaternius.com/packs/scifimodularguns.html)**,
licensed [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).
The official pack page explicitly permits personal and commercial projects.
Downloaded from the same pinned [Quaternius showcase mirror](https://github.com/trebeljahr/quaternius-showcase/tree/0128ca510d653bb04d6d1e4885bd8890b5050b4f/public/glb/modular_sci_fi_guns_pack),
revision `0128ca510d653bb04d6d1e4885bd8890b5050b4f`. Its license inventory also identifies
this pack as Quaternius CC0. No mirror application code is included.

| Role | Source file | Triangles | Original GLB SHA-256 |
| --- | --- | ---: | --- |
| mount:pulse | Barrel_AR_1.glb | 240 | `d31a8aed1067745a8ba7dfd962fd626a2aa9ca55a8f568baac812bcdef09876a` |
| mount:scatter | Barrel_Grenade_1.glb | 240 | `0c3f2a0865141ebde4571c04beaf144a5592e7fcc4b5e88367b9e334e03af81f` |
| mount:lance | Barrel_Sniper_1.glb | 239 | `2b4b5bf422215b02cd3c7d56434c3a02120165233ed733f38d4b65423dd2e2a2` |

Modifications: triangulated/decimated to at most 240 triangles, converted source
materials into neutral metal/colored-panel vertex channels, normalized to a
10-unit barrel, rotated the original +X barrel to local +Y (craft nose), corrected
face winding, quantized into indexed 16-bit geometry. Each model is scaled/placed
on existing drone hulls and combined into cached rigs at load/first use. The same
rig is shown in catalogue art, live Drone Bay and combat. Drone counts, projectile
origins, rates, damage and abilities are unchanged. Original hashes and filenames
also appear in `combat-assets`; model/source credit is in Settings.

Research also rechecked the official Kenney Blaster Kit and Space Kit CC0 pages;
the existing three ship-mounted cannons and six drone hulls remain from those
packs. No additional license-restricted or account-gated models were included.
