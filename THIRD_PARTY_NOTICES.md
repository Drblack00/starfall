# Nitro Blade

**Nitro Blade** by **VertaScan** — [original model on Sketchfab](https://sketchfab.com/3d-models/nitro-blade-6c34eb48b0c44667864a2af3fed92d6c).
Licensed under [Creative Commons Attribution](https://creativecommons.org/licenses/by/4.0/). The supplied Sketchfab licensing screenshot permits commercial use and requires author credit. Credit and license links also appear on the game's home screen.

The user supplied the OBJ and grill texture in `nitro-blade.zip`. The original OBJ references a material library that was absent from that archive. This adaptation reconstructs metal, glass, and emissive materials using its named material groups, retains the supplied grill texture, normalizes the mesh, and triangulates/decimates it for the browser. Home and flight use the same 5,068-triangle game-ready mesh, with indexed vertices and outward face winding. The older 1,881-triangle mesh remains embedded as source data but is no longer substituted for the player during flight. Vertex channels are linearly packed into 16-bit values for decoding on browsers without stream decompression; position quantization error is below 0.001 rendering units. Both meshes are embedded in `index.html`, along with the texture; the original archive is not required at runtime.

This model is used for the Vanguard visual. Drones and the five bosses use game-authored procedural geometry. The other eleven player ships use the Quaternius models listed below. No endorsement by the original creator is implied.

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
