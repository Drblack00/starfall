"""Optional offline authoring: restore source drone geometry, not helper meshes.

blender --background --python tools/export-hd-drones.py -- SOURCE_ROOT DECODED_ROOT OUTPUT_JSON
The runtime remains a single self-contained HTML, with no Blender/Draco dependency.
Quaternius CC0 sources pinned in THIRD_PARTY_NOTICES.md.
"""
import bpy, sys, json, hashlib, math
from pathlib import Path
from mathutils import Vector

source, decoded, output = map(Path, sys.argv[sys.argv.index('--')+1:])
sources = [
 ('scout','cyberpunk_pack/Enemy_Flying.glb',16),
 ('wasp','cyberpunk_pack/Enemy_Flying_Gun.glb',16),
 ('twin','ultimate_space_pack/Enemy_Flying-transformed.glb',16),
 ('phantom','cyberpunk_pack/Turret_GunDouble.glb',17),
 ('guardian','cyberpunk_pack/Turret_Cannon.glb',22),
 ('swarm','ultimate_space_pack/Enemy_ExtraSmall-transformed.glb',13),
]
result=[]
for slot, relative, size in sources:
 for o in list(bpy.data.objects):bpy.data.objects.remove(o,do_unlink=True)
 path=source/relative
 bpy.ops.import_scene.gltf(filepath=str(decoded/relative if '-transformed' in relative else path),merge_vertices=True)
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.visible_get()]
 excluded=[o.name for o in bpy.context.scene.objects if o.type=='MESH' and not o.visible_get()]
 for o in objects:
  bpy.context.view_layer.objects.active=o
  for m in list(o.modifiers):
   if m.type=='ARMATURE':bpy.ops.object.modifier_apply(modifier=m.name)
 points=[o.matrix_world@v.co for o in objects for v in o.data.vertices]
 lo=Vector([min(v[i] for v in points) for i in range(3)])
 hi=Vector([max(v[i] for v in points) for i in range(3)])
 center=(lo+hi)/2; scale=size/max(hi-lo)
 rows=[];original=sum(len(o.data.polygons) for o in objects)
 for o in objects:
  bpy.context.view_layer.objects.active=o
  # Tiny manufactured edge bevels catch the environment light without changing the silhouette.
  bevel=o.modifiers.new('Manufactured edge highlights','BEVEL');bevel.width=.012/scale
  bevel.segments=2;bevel.limit_method='ANGLE';bevel.angle_limit=math.radians(48)
  bpy.ops.object.modifier_apply(modifier=bevel.name)
  tri=o.modifiers.new('Triangles','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=tri.name)
  mesh=o.data;normal_matrix=o.matrix_world.to_3x3().inverted().transposed()
  uv=mesh.uv_layers.active
  for face in mesh.polygons:
   mat=mesh.materials[face.material_index] if len(mesh.materials)>face.material_index else None
   rgb=list(mat.diffuse_color[:3]) if mat else [.45,.55,.65]
   if mat and mat.use_nodes:
    bsdf=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
    if bsdf:rgb=list(bsdf.inputs['Base Color'].default_value[:3])
   # Neutral titanium with livery panels and dark optical housings.
   tag=2 if max(rgb)-min(rgb)>.2 else 4 if max(rgb)<.07 else 0
   if tag==2:rgb=[.75,.8,.85]
   for li in face.loop_indices:
    v=o.matrix_world@mesh.vertices[mesh.loops[li].vertex_index].co
    n=(normal_matrix@mesh.corner_normals[li].vector).normalized()
    u=uv.data[li].uv if uv else Vector((0,0))
    rows.extend([(v.x-center.x)*scale,-(v.y-center.y)*scale,(v.z-lo.z)*scale,n.x,-n.y,n.z,*rgb,tag,float(u.x),float(u.y)])
 result.append({'key':'drone:'+slot,'name':path.stem,'creator':'Quaternius','sourceFile':relative,
  'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sourceObjects':[o.name for o in objects],
  'excludedObjects':excluded,'detail':'source-geometry-bevelled','sourceFaces':original,
  'triangles':len(rows)//36,'rows':rows})
 print('HD DRONE',slot,len(rows)//36,'triangles')
output.write_text(json.dumps(result,separators=(',',':')))
