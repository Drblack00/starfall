"""Optional Blender authoring for CC0 combat meshes. No runtime dependency.
blender --background --python tools/export-combat.py -- QUATERNIUS_DIR KENNEY_PACKS OUTPUT_JSON
"""
import bpy,sys,json,hashlib,math
from pathlib import Path
from mathutils import Vector
source,kenney,output=map(Path,sys.argv[sys.argv.index('--')+1:])
models=[('enemy:diver',source/'Dispatcher.glb',600,38,'y'),('enemy:weaver',source/'Spitfire.glb',600,42,'y'),('enemy:charger',source/'Striker.glb',600,42,'y'),('enemy:sentinel',source/'Omen.glb',600,42,'y'),('enemy:lancer',source/'Zenith.glb',600,44,'y'),('enemy:bulwark',source/'Challenger.glb',600,48,'y')]
for key,name,size in [('scout','craft-speedera',16),('wasp','craft-speederb',16),('twin','craft-speederc',16),('phantom','craft-speederd',17),('guardian','craft-miner',22),('swarm','craft-racer',13)]:models.append(('drone:'+key,kenney/'space-kit'/(name+'.glb'),480,size,'y'))
for key,pack,name,size,axis in [('pulse','blaster-kit','blaster-a',32,'y'),('scatter','blaster-kit','blaster-h',32,'y'),('lance','blaster-kit','blaster-e',32,'y'),('bomb','blaster-kit','grenade-a',2,'z'),('round','blaster-kit','bullet-foam-tip',1,'y')]:models.append((('equipment:'+key if key in ['pulse','scatter','lance'] else key),kenney/pack/(name+'.glb'),640 if key in ['pulse','scatter','lance'] else (12 if key=='round' else 96),size,axis))
result=[]
for key,path,budget,size,axis in models:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.gltf(filepath=str(path),merge_vertices=True)
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
 for o in objects:
  bpy.context.view_layer.objects.active=o
  tri=o.modifiers.new('Triangles','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=tri.name)
 total=sum(len(o.data.polygons) for o in objects)
 for o in objects:
  bpy.context.view_layer.objects.active=o
  if total>budget:
   dec=o.modifiers.new('Combat budget','DECIMATE');dec.ratio=budget/total;bpy.ops.object.modifier_apply(modifier=dec.name)
  tri=o.modifiers.new('Triangles','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=tri.name)
 points=[o.matrix_world@v.co for o in objects for v in o.data.vertices]
 lo=Vector([min(v[i] for v in points) for i in range(3)]);hi=Vector([max(v[i] for v in points) for i in range(3)]);center=(lo+hi)/2
 scale=size/max(hi.x-lo.x,hi.y-lo.y,hi.z-lo.z)
 rows=[];sample_cache={}
 for o in objects:
  mesh=o.data;normal_matrix=o.matrix_world.to_3x3().inverted().transposed();uv=mesh.uv_layers.active
  for face in mesh.polygons:
   mat=mesh.materials[face.material_index] if len(mesh.materials)>face.material_index else None
   color=list(mat.diffuse_color[:3]) if mat else [.5,.6,.7];image=None
   if mat and mat.use_nodes:
    for node in mat.node_tree.nodes:
     if node.type=='TEX_IMAGE' and node.image:image=node.image;break
    bsdf=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
    if bsdf and not image:color=list(bsdf.inputs['Base Color'].default_value[:3])
   if image and not key.startswith('enemy:') and image.name not in sample_cache:sample_cache[image.name]=list(image.pixels[:])
   for li in face.loop_indices:
    v=o.matrix_world@mesh.vertices[mesh.loops[li].vertex_index].co;n=(normal_matrix@mesh.corner_normals[li].vector).normalized();u=uv.data[li].uv if uv else Vector((0,0));rgb=color[:];tag=0
    if key.startswith('enemy:'):rgb=[1,1,1];tag=8
    elif image:
     pixels=sample_cache[image.name];ix=min(image.size[0]-1,max(0,int(u.x*image.size[0])));iy=min(image.size[1]-1,max(0,int(u.y*image.size[1])));offset=(iy*image.size[0]+ix)*4;rgb=pixels[offset:offset+3]
    if not key.startswith('enemy:'):
     # Keep industrial metal neutral and use the runtime livery for colored panels.
     if max(rgb)-min(rgb)>.2:tag=2;rgb=[.75,.8,.85]
     elif max(rgb)<.07:tag=4
    # Blender is Z-up; source ships point -Y after glTF import.
    px=(v.x-center.x)*scale;py=-(v.y-center.y)*scale;pz=(v.z-lo.z)*scale
    if key=='round':
     py=(v.z-center.z)/(hi.z-lo.z);px=(v.x-center.x)/(hi.x-lo.x);pz=-(v.y-center.y)/(hi.y-lo.y);n=Vector((n.x,-n.z,-n.y))
    rows.extend([px,py,pz,n.x,-n.y,n.z,*rgb,tag,float(u.x),float(u.y)])
 result.append({'key':key,'name':path.stem,'creator':'Quaternius' if key.startswith('enemy:') else 'Kenney','sourceFile':str(path.relative_to(source if key.startswith('enemy:') else kenney)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'triangles':len(rows)//36,'rows':rows})
 print('EXPORTED',key,len(rows)//36)
output.write_text(json.dumps(result,separators=(',',':')))
