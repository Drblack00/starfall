# Nitro Blade

**Nitro Blade** by **VertaScan** — [original model on Sketchfab](https://sketchfab.com/3d-models/nitro-blade-6c34eb48b0c44667864a2af3fed92d6c).
Licensed under [Creative Commons Attribution](https://creativecommons.org/licenses/by/4.0/). The supplied Sketchfab licensing screenshot permits commercial use and requires author credit. Credit and license links also appear on the game's home screen.

The user supplied the OBJ and grill texture in `nitro-blade.zip`. The original OBJ references a material library that was absent from that archive. This adaptation reconstructs metal, glass, and emissive materials using its named material groups, retains the supplied grill texture, normalizes the mesh, and triangulates/decimates it for the browser. Home and flight use the same 5,068-triangle game-ready mesh, with indexed vertices and outward face winding. The older 1,881-triangle mesh remains embedded as source data but is no longer substituted for the player during flight. Vertex channels are linearly packed into 16-bit values for decoding on browsers without stream decompression; position quantization error is below 0.001 rendering units. Both meshes are embedded in `index.html`, along with the texture; the original archive is not required at runtime.

This model is used for the Vanguard visual. The other ships, drones, and five bosses use game-authored procedural geometry. No endorsement by the original creator is implied.
