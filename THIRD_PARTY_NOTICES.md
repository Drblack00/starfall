# Original Rift faction (build 3D-8)

The six current enemy hulls and five boss hulls are original procedural STARFALL
art. They use no player-fleet mesh, texture or downloaded model. Build 3D-8 removes
the six older Quaternius enemy adaptations and their shared atlas from the
embedded combat payload. The historical table below documents prior usage;
existing player-fleet, drone, weapon and ordnance credits remain applicable.

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
| Interceptor | Insurgent | 8,292 |
| Bulwark | Pancake | 2,688 |
| Spectre | Executioner | 3,388 |
| Tempest | Spitfire | 3,512 |
| Nomad | Dispatcher | 748 |
| Solaris | Striker | 4,530 |
| Reaper | Zenith | 2,152 |
| Starforge | Bob | 938 |
| Sovereign | Imperial | 2,642 |

Modifications: normalized to the existing render coordinate system; corrected face
winding to match outward normals; retained the full source topology for all eleven
hulls; linearly packed vertex channels into 16-bit data with 16-bit indices;
embedded the original 2048×2048 color textures as high-quality JPEG (quality 94,
no chroma subsampling); added live paint tint, physical material shading and
per-model engine anchors. Earlier 2,800-triangle/512px adaptations were replaced by
the full source versions in build 3D-10. Both mesh data and textures are embedded in
`index.html`. STARFALL ship names, stats and career unlocks stay unchanged. No
endorsement by Quaternius or the mirror maintainer is implied.

# Historical combat models and equipment (build 3D-5)

The previous release used six Quaternius hull adaptations for enemies, retaining the original
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


# Drone bodies and additional blaster chassis (build 3D-7)

**Quaternius**, from [Cyberpunk Game Kit](https://quaternius.com/packs/cyberpunkgamekit.html),
[Ultimate Space Kit](https://quaternius.com/packs/ultimatespacekit.html) and
[Sci-Fi Modular Gun Pack](https://quaternius.com/packs/scifimodularguns.html).
The official pack pages identify these packs as [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)
and permit personal/commercial projects. Downloaded from the existing pinned
[showcase mirror](https://github.com/trebeljahr/quaternius-showcase/tree/0128ca510d653bb04d6d1e4885bd8890b5050b4f/public/glb),
revision `0128ca510d653bb04d6d1e4885bd8890b5050b4f`; no mirror application code is included.

| Role | Source file | Triangles | Original GLB SHA-256 |
| --- | --- | ---: | --- |
| drone:scout | cyberpunk_pack/Enemy_Flying.glb | 4566 | `7e3a27532b43807b375e3d3ad9cbe1f7e20d8bb723f2dcc2a3c9efb38da73a5b` |
| drone:wasp | cyberpunk_pack/Enemy_Flying_Gun.glb | 4604 | `af82b5b458530b31ce9694cf0461649839e1e822a922203faa16f4c32c21e595` |
| drone:twin | ultimate_space_pack/Enemy_Flying-transformed.glb | 4588 | `d3ebd094f1c571eec7da8d7c67f47c8c24b30abc9a0801ba20cdbaf2e3a371d1` |
| drone:phantom | cyberpunk_pack/Turret_GunDouble.glb | 1504 | `06dbb0e4f89a5a94827f522d518097db73bc00239ffa59902fdc3728ebc9e72a` |
| drone:guardian | cyberpunk_pack/Turret_Cannon.glb | 1318 | `1c731f445be1f70124d666a42fc70c7387de39ed7ad73b3af8604e3e79a8f4bd` |
| drone:swarm | ultimate_space_pack/Enemy_ExtraSmall-transformed.glb | 1756 | `178d4479b08fe0cbdf953e288f5b21c8f1483c9578db5d726ad4985c7334c414` |
| frame:ar1 | AR_1.glb | 1200 | `0370edb381d2f298efbc9ac7dd4ec11d22d3b0137bb135df1b89a2a284af9125` |
| frame:ar4 | AR_4.glb | 1199 | `d249dddf433609cccf01d1abe4f8f13d9eee4e1ba33a4bd9617598e6e6a0af60` |
| frame:ar6 | AR_6.glb | 1199 | `0bb077776559d354b41834595c9c92ddd93318c1a893718ccf53e93f7e0a35ac` |
| frame:smg | SMG_1.glb | 1199 | `4a92c6765ce2e7688afd962ec1b741c95ace183a90d448d7e094a342d62114f2` |
| frame:sniper1 | Sniper_1.glb | 1199 | `f802c0ba8fbc02e87329883b8486ed50c1f7d12eb2b0e5604ffcf247e77dfcd5` |
| frame:sniper3 | Sniper_3.glb | 1199 | `963ed4310d791f2035aecd241e6fd64444398e92c5ac4def6be1f4faff622f3e` |

Modifications: source armature poses baked for static escorts; non-visible objects
excluded (including the importer's material-preview helper); triangulated and
restored to source geometry for drones, with small manufactured edge bevels;
weapon chassis retain their approximately 1,200-triangle adaptations; source materials sampled into metal/livery/glass vertex channels;
normalized to the existing escort/weapon extents; outward winding and indexed
16-bit packing. The six drone slots replace their earlier Kenney hull visuals;
abilities and numbers remain unchanged. Source turret bodies are adapted into
hovering escorts. Six new gun bodies become cosmetic alternatives for the three
existing cannons, with deck-sampled mounting and shared cached rigs.

The offline Draco expansion helper requires DracoPy/numpy; two Ultimate Space
source files use Draco compression. No decoder, source archive, animation rig or
runtime model request is shipped. Source object and excluded-object names are
recorded with original file hashes in `combat-assets`. The original player hulls
and their licenses remain unchanged. No endorsement by Quaternius or the mirror
maintainer is implied.

The new procedural action score is original project-authored synthesis; it uses
no third-party recording, sample or composition.


# Original PBR materials and geometry detail (build 3D-10)

The 1024×1024 normal and occlusion/roughness/metallic surface maps and eight-level
RGBM studio reflection atlas are original STARFALL assets, authored deterministically
by `tools/make-pbr-materials.py`. They are embedded, decoded once, shared across
models, and reused by the same physical material shader in inspection and flight.
No stock photograph, third-party environment map, model-viewer screenshot or AI-generated
model is included in these maps.

The six Rift enemy hulls and all five unique boss hulls retain their original
STARFALL silhouettes. Higher-resolution curved surfaces, static service panels,
recessed radiators, optical housings and distinct boss machinery are original
STARFALL mesh work. The three game-authored specialist player hulls and the repair,
jammer and kamikaze drones receive matching service detail. Gameplay LODs derive
from these same faction designs; full-detail models remain in Ultra and inspection.
These visual changes do not alter collision radii or
combat properties. Exact current geometry counts and original downloaded-file
hashes are recorded in `tests/graphics-source-lock.json`.

The previously discussed Drone Ball and AI-41 models are not included in this
release. No claim of downloading or integrating those account-gated assets is made.

The exhaust follow-up uses original STARFALL geometry and procedural shader work:
three intersecting flame ribbons with a white-hot core, colored sheath, pressure
bands and advected turbulence. Its Canvas fallback is an original cached
procedural flame image. No downloaded fire footage, texture or simulation code is
included, and the effect introduces no additional third-party license.


# Orbital Realism original assets (build 3D-11)

The six enemy hulls, five flagship hulls and separate Leviathan arm, each with a
matching LOD, are original STARFALL geometry authored by the included Blender
script `tools/author-orbital-fleet.py`. No downloaded model or concept-art
projection is used for these faction hulls. Packed geometry and baked vertex
contact shadows are embedded in `orbital-meshes`; their hashes and topology are
recorded in `tests/orbital-mesh-lock.json`. Existing imported player, weapon and
drone models retain their credits and licenses above.

The five Orbital Realism scenery plates are original AI-generated artwork created
for this project from its approved art direction, embedded as two WebP atlases in
`orbital-scenes`. They are background illustrations, not third-party space
photographs or 3D planet assets. The six-enemy and five-boss concept boards are
references for original modeling; those pictures are not shipped as model skins.
No external paid image-to-3D generation service was used.
