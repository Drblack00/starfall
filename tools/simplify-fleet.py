"""Optional Blender authoring: cap the four largest source hulls at 2,800 faces.

blender --background --python tools/simplify-fleet.py -- SOURCE_DIR OUTPUT_DIR
The game's HTML requires neither Blender nor this step at runtime.
Quaternius CC0 source models; see THIRD_PARTY_NOTICES.md for the pinned revision.
"""
import sys
from pathlib import Path

import bpy

source, output = map(Path, sys.argv[sys.argv.index("--") + 1:])
output.mkdir(parents=True, exist_ok=True)
for name in ("Insurgent", "Striker", "Spitfire", "Executioner"):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(source / (name + ".glb")), merge_vertices=True)
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        bpy.context.view_layer.objects.active = obj
        triangles = obj.modifiers.new("Triangles", "TRIANGULATE")
        bpy.ops.object.modifier_apply(modifier=triangles.name)
        count = len(obj.data.polygons)
        if count > 2800:
            decimate = obj.modifiers.new("Mobile flight budget", "DECIMATE")
            decimate.ratio = 2800 / count
            bpy.ops.object.modifier_apply(modifier=decimate.name)
        print(name, count, "->", len(obj.data.polygons), "triangles")
    bpy.ops.export_scene.gltf(
        filepath=str(output / (name + ".glb")), export_format="GLB", export_apply=True,
    )
