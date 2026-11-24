"""Author original, concept-directed STARFALL hulls in Blender (offline only).

blender --background --python tools/author-orbital-fleet.py -- OUTPUT_DIRECTORY
Exports actual closed 3D armor, bays, engines and weapons, plus matching gameplay
LODs. No concept picture is projected or wrapped onto a substitute mesh.
"""
import bpy, math, json, sys, random
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

OUT=Path(sys.argv[sys.argv.index('--')+1]); OUT.mkdir(parents=True,exist_ok=True)
TAU=math.tau
PARTS=[]; DECKS=[]; ENGINES=[]; rng=random.Random(713)

def material(name,rgb,rough=.45,tag=12):
 m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m['tag']=tag+rough*.1 if tag==12 else tag;m['rough']=rough
 m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Metallic'].default_value=.85 if tag!=4 else .1;p.inputs['Roughness'].default_value=rough
 if tag==3:p.inputs['Emission Color'].default_value=(*rgb,1);p.inputs['Emission Strength'].default_value=3
 return m

ARMOR=material('Obsidian titanium',(.19,.215,.25),.48)
DARK=material('Carbon recess',(.035,.045,.055),.74)
FRAME=material('Machined titanium frame',(.36,.40,.44),.33)
EDGE=material('Exposed alloy bevel',(.58,.63,.67),.28)
LIGHT=material('Pale military markings',(.72,.74,.70),.61,0)
GLASS=material('Smoked sensor glass',(.10,.20,.25),.12,4)
ICE=material('Frosted ceramic',(.57,.68,.78),.64)
COPPER=material('Heat-stained copper',(.36,.24,.17),.55)
ACCENTS={k:material(k+' optical emission',v,.3,3) for k,v in {
 'rose':(.90,.30,.47),'amber':(1,.61,.20),'green':(.18,.85,.57),
 'cyan':(.39,.82,1),'violet':(.70,.40,1),'copper':(1,.67,.32),'white':(.88,.97,1)}.items()}
PAINT={k:material(k+' ceramic trim',tuple(c*.36 for c in v.diffuse_color[:3]),.56,12) for k,v in ACCENTS.items()}

def mesh(name,verts,faces,mat=ARMOR,bevel=0,detail=False,smooth=False):
 data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
 obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat);obj['detail']=detail
 if smooth:
  for f in data.polygons:f.use_smooth=True
 if bevel:
  mod=obj.modifiers.new('Manufactured edge radii','BEVEL');mod.width=bevel;mod.segments=2;mod.limit_method='ANGLE';mod.angle_limit=.45
  mod=obj.modifiers.new('Weighted panel normals','WEIGHTED_NORMAL');mod.keep_sharp=True;mod.weight=50
 PARTS.append(obj);return obj

def plate(name,points,z,h,mat=ARMOR,bevel=.2,detail=False):
 n=len(points);verts=[(x,y,z) for x,y in points]+[(x,y,z+h) for x,y in points]
 faces=[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 obj=mesh(name,verts,faces,mat,bevel,detail);DECKS.append((points,z+h));return obj

def box(name,x,y,z,w,h,d,mat=ARMOR,bevel=.15,detail=False):
 c=min(w,h)*.15
 return plate(name,[(x-w/2+c,y-h/2),(x+w/2-c,y-h/2),(x+w/2,y-h/2+c),(x+w/2,y+h/2-c),(x+w/2-c,y+h/2),(x-w/2+c,y+h/2),(x-w/2,y+h/2-c),(x-w/2,y-h/2+c)],z,d,mat,bevel,detail)

def cylinder(name,x,y,z,r,depth,mat=FRAME,n=16,axis='z',inner=0,detail=False):
 def point(a,t,radius):
  u,v=math.cos(a)*radius,math.sin(a)*radius
  return (x+u,y+t,z+v) if axis=='y' else (x+u,y+v,z+t)
 verts=[point(i*TAU/n,t,r) for t in [0,depth] for i in range(n)]
 faces=[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 if inner:
  verts += [point(i*TAU/n,t,inner) for t in [0,depth] for i in range(n)]
  faces += [(2*n+i,3*n+i,3*n+(i+1)%n,2*n+(i+1)%n) for i in range(n)]
  for j in [0,1]:
   faces += [(j*n+i,j*n+(i+1)%n,(j+2)*n+(i+1)%n,(j+2)*n+i) for i in range(n)]
 else:faces += [tuple(reversed(range(n))),tuple(range(n,n*2))]
 return mesh(name,verts,faces,mat,.06 if r<3 else .18,detail,smooth=True)

def ring(name,x,y,z,outer,inner,height,mat=FRAME,n=32,detail=False):
 return cylinder(name,x,y,z,outer,height,mat,n,inner=inner,detail=detail)

def beam(name,a,b,w,d,mat=FRAME,detail=False):
 direction=Vector(b)-Vector(a);side=direction.cross(Vector((0,0,1)))
 if side.length<.01:side=Vector((1,0,0))
 side.normalize();up=direction.normalized().cross(side).normalized()
 verts=[tuple(Vector(p)+side*s*w/2+up*t*d/2) for p in [a,b] for s,t in [(-1,-1),(1,-1),(1,1),(-1,1)]]
 return mesh(name,verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],mat,min(w,d)*.12,detail)

def engine(x,y,z,r,accent='cyan',direction=-1):
 ENGINES.append([x,y+direction*r*1.52,z])
 cylinder('Ceramic engine shroud',x,y,z,r,r*1.5*direction,FRAME,16,'y',r*.69)
 cylinder('Dark nozzle throat',x,y+direction*.05,z,r*.64,r*.3*direction,DARK,16,'y')
 cylinder('Engine plasma',x,y+direction*.12,z,r*.43,r*.04,ACCENTS[accent],16,'y')
 cylinder('Nozzle lip',x,y+direction*r*1.35,z,r*1.04,r*.17*direction,EDGE,16,'y',r*.74)

def cannon(x,y,z,length,r,accent='amber',direction=-1):
 cylinder('Gun trunnion',x,y,z,r*1.7,r*.8,ARMOR,16)
 cylinder('Armored accelerator jacket',x,y,z+r,r*1.1,length*.65*direction,FRAME,12,'y')
 cylinder('Gun barrel',x,y+length*.45*direction,z+r,r*.72,length*.55*direction,ARMOR,12,'y')
 cylinder('Bore lip',x,y+length*.95*direction,z+r,r*.9,length*.07*direction,EDGE,12,'y',r*.53)
 cylinder('Dark cannon bore',x,y+length*.96*direction,z+r,r*.49,.04,DARK,12,'y')
 for row in range(3):box('Accelerator cooling rib',x,y+direction*(row+1)*length*.16,z+r*2,r*1.7,.5,.35,DARK,.04,True)
 box('Gun status optic',x,y,z+r*2.1,r*.6,r*.75,.2,ACCENTS[accent],.04,True)

def inside(x,y,poly):
 hit=False;j=len(poly)-1
 for i,(xi,yi) in enumerate(poly):
  xj,yj=poly[j]
  if (yi>y)!=(yj>y) and x<(xj-xi)*(y-yi)/(yj-yi)+xi:hit=not hit
  j=i
 return hit

def roof(x,y,surfaces):return max([z for p,z in surfaces if inside(x,y,p)]+[0])

def panels(step=5,accent='cyan',big=False):
 surfaces=list(DECKS)
 for ix in range(-25 if big else -6,26 if big else 7):
  for iy in range(-9 if big else -5,10 if big else 6):
   x=ix*step+(iy%2)*step*.22;y=iy*step;z=roof(x,y,surfaces)
   w=step*.77;h=step*.64
   if z<2 or rng.random()<.16:continue
   if any(abs(roof(x+sx*w*.55,y+sy*h*.55,surfaces)-z)>.2 for sx,sy in [(-1,-1),(-1,1),(1,-1),(1,1)]):continue
   base=rng.choice([ARMOR,ARMOR,FRAME,PAINT[accent]])
   box('Recessed service gasket',x,y,z+.02,w+.12,h+.12,.09,DARK,.025,True)
   box('Beveled replaceable armor tile',x,y,z+.10,w,h,.21 if not big else .4,base,.08 if not big else .14,True)
   if (ix+iy*3)%5==0:
    for rib in range(3):box('Cooling slot',x+(rib-1)*w*.22,y,z+.37 if not big else z+.58,w*.10,h*.63,.06,DARK,.015,True)
   if (ix-iy)%7==0:box('Service marking',x+w*.32,y,z+.36 if not big else z+.57,w*.07,h*.42,.04,LIGHT,0,True)
   if big and (ix+iy)%4==0:
    for side in [-1,1]:box('Flush armor fastener',x+side*w*.36,y-h*.34,z+.58,.35,.35,.10,EDGE,.02,True)

def emblem(x,y,z,s=1):
 plate('Rift chevron left',[(x-2*s,y+2*s),(x-.1*s,y-.3*s),(x-.3*s,y-2*s)],z,.035,LIGHT,0,True)
 plate('Rift chevron right',[(x+2*s,y+2*s),(x+.1*s,y-.3*s),(x+.3*s,y-2*s)],z,.035,LIGHT,0,True)

def enemy(kind):
 accent={'diver':'rose','charger':'amber','weaver':'green','sentinel':'cyan','lancer':'violet','bulwark':'copper'}[kind]
 if kind=='diver':
  plate('Strike drone keel',[(0,18),(-5,9),(-6,-11),(-3,-15),(3,-15),(6,-11),(5,9)],0,5,ARMOR,.55)
  for s in [-1,1]:
   plate('Swept hooked wing',[(s*4,8),(s*13,3),(s*19,-5),(s*17,-10),(s*11,-4),(s*4,-8)],.5,3,ARMOR,.35)
   plate('Rose leading ceramic',[(s*11,2),(s*18,-4),(s*17,-6),(s*10,0)],3.4,.55,PAINT[accent],.1)
   box('Engine nacelle',s*5,-8,4,4,12,4,ARMOR,.4);engine(s*5,-14,6,1.7,accent)
   box('Hostile sensor',s*6,5,4,1.2,2.5,.5,ACCENTS[accent],.1)
  plate('Predatory upper carapace',[(0,15),(-3,7),(-3,-4),(0,-8),(3,-4),(3,7)],5,3,FRAME,.3)
 elif kind=='charger':
  plate('Armored ram base',[(0,18),(-8,11),(-15,1),(-12,-13),(-7,-16),(7,-16),(12,-13),(15,1),(8,11)],0,6,ARMOR,.55)
  for s in [-1,1]:
   plate('Reinforced shoulder',[(s*3,12),(s*11,6),(s*13,-4),(s*9,-12),(s*4,-8)],5,4,FRAME,.5)
   box('Shoulder armor band',s*9,-1,9,3,9,1.1,ARMOR,.25)
   engine(s*5,-15,6,2.1,accent)
  plate('Battering prow',[(0,17),(-5,8),(-4,-5),(4,-5),(5,8)],6,4,ARMOR,.35)
  box('Aim warning spine',0,1,10,1.1,7,.3,ACCENTS[accent],.1)
  box('Amber sensor slit',0,10,10.2,4,.65,.4,ACCENTS[accent],.1)
 elif kind=='weaver':
  plate('Agile three-lobed body',[(0,16),(-5,7),(-7,-2),(-3,-13),(3,-13),(7,-2),(5,7)],0,5,ARMOR,.4)
  for s in [-1,1]:
   beam('Articulated outrigger', (s*4,0,3),(s*12,0,3),2,2,FRAME)
   cylinder('Gimbal bearing',s*9,0,3,2.5,1,EDGE,12)
   plate('Crescent interception fin',[(s*12,13),(s*17,8),(s*18,-3),(s*15,-10),(s*13,-7),(s*14,3),(s*11,8)],1,3.2,FRAME,.3)
   box('Green fin optics',s*15,3,4.3,.7,4,.25,ACCENTS[accent],.07)
   engine(s*3,-12,4,1.45,accent)
  plate('Recessed emerald optic',[(0,11),(-2,4),(0,-1),(2,4)],5,1.6,GLASS,.25)
 elif kind=='sentinel':
  outline=[(math.sin(i*TAU/8)*20,math.cos(i*TAU/8)*17) for i in range(8)]
  plate('Octagonal shield platform',outline,0,5,ARMOR,.6)
  for i in range(8):
   a=(i+.5)*TAU/8;c,s=math.cos(a),math.sin(a)
   p=[(-3,10),(3,10),(4,15),(-4,15)]
   plate('Ceramic shield sector',[(x*c-y*s,x*s+y*c) for x,y in p],5,1.8,ICE,.2)
  box('Protected sensor bridge',0,0,6,9,13,3,ARMOR,.5)
  box('Cold optical array',0,5,9,6,1,.4,ACCENTS[accent],.1)
  for side in [-1,1]:engine(side*7,-14,4,1.9,accent)
 elif kind=='lancer':
  plate('Twin-rail keel',[(-6,20),(-11,17),(-12,-12),(-6,-18),(6,-18),(12,-12),(11,17),(6,20),(4,-4),(-4,-4)],0,4,ARMOR,.4)
  for side in [-1,1]:
   plate('Armored accelerator spar',[(side*5,21),(side*10,17),(side*10,-10),(side*6,-14)],4,3.5,FRAME,.3)
   box('Recessed violet rail',side*7.3,5,7.5,.65,20,.15,ACCENTS[accent],.07)
   box('Rail shield lip',side*8.7,2,7.2,1,21,.9,ARMOR,.1)
   engine(side*5,-16,4,1.7,accent)
  box('Central fire controller',0,-7,4,6,11,4,ARMOR,.4)
  box('Targeting optics',0,-3,8,1,3,.4,ACCENTS[accent],.1)
 else:
  plate('Fortress lower keel',[(-21,-14),(21,-14),(26,-8),(26,8),(19,14),(-19,14),(-26,8),(-26,-8)],0,5,ARMOR,.6)
  for side in [-1,1]:
   box('Shield generator shoulder',side*18,0,4,13,23,6,FRAME,.65)
   box('Heat-stained shoulder armor',side*18,4,10,11,9,1,COPPER,.3)
   box('External field emitter',side*23,0,10.8,1,7,.25,ACCENTS[accent],.08)
   engine(side*14,-12,5,2.4,accent)
  box('Protected fortress bridge',0,-1,5,16,19,7,ARMOR,.6)
  box('Bridge armored brow',0,7,11,12,6,2,FRAME,.35)
  box('Small amber bridge optics',0,9,13,5,.7,.3,ACCENTS[accent],.08)
 panels(4.4,accent)
 emblem(0,-3,roof(0,-3,DECKS)+.12,.75)

def mothership():
 plate('Carrier armored keel',[(-100,20),(-109,-5),(-85,-30),(-40,-25),(0,-40),(40,-25),(85,-30),(109,-5),(100,20),(45,35),(-45,35)],0,9,ARMOR,1.2)
 for side in [-1,1]:
  x=side*68
  box('Deep open hangar floor',x,-3,9,48,43,1.5,DARK,.35)
  for edge in [-1,1]:box('Hangar side buttress',x+edge*25,-2,10,5,45,10,FRAME,.65)
  box('Hangar rear bulkhead',x,18,10,49,5,12,ARMOR,.6)
  box('Hangar roof beam',x,16,22,51,8,4,FRAME,.6)
  for j in range(5):
   y=-19+j*8
   box('Runway guide light',x-18,y,10.7,.8,3,.3,ACCENTS['cyan'],.1,True)
   box('Runway guide light',x+18,y,10.7,.8,3,.3,ACCENTS['cyan'],.1,True)
   if j%2==0:
    for lane in [-1,1]:plate('Docked hostile fighter',[(x+lane*7,y-2),(x+lane*7-3,y+2),(x+lane*7+3,y+2)],11,1.4,FRAME,.15,True)
  plate('Carrier upper shoulder',[(side*34,28),(side*95,20),(side*103,8),(side*89,4),(side*34,8)],10,9,FRAME,.8)
  for j in range(3):engine(side*(46+j*17),29,11,3.4,'cyan',1)
 plate('Central cathedral bridge',[(-22,31),(22,31),(28,4),(15,-29),(0,-39),(-15,-29),(-28,4)],9,12,FRAME,.9)
 box('Armored command tower',0,16,21,18,22,12,ARMOR,.7)
 box('Reactor hangar recess',0,-8,21,14,24,1,DARK,.3)
 box('Cyan exposed reactor',0,-8,22,7,15,3,ACCENTS['cyan'],.5)
 for side in [-1,1]:beam('Reactor arch', (side*8,-19,24),(side*8,5,31),2,2,EDGE)
 for side in [-1,1]:
  for j in range(3):cannon(side*(34+j*25),22,18,8,1.3,'cyan',-1)
 panels(8,'cyan',True)
 for side in [-1,1]:emblem(side*44,19,roof(side*44,19,DECKS)+.2,2)

def dreadnought():
 plate('Siege battleship keel',[(-108,7),(-84,27),(-35,28),(0,35),(35,28),(84,27),(108,7),(93,-24),(42,-31),(0,-34),(-42,-31),(-93,-24)],0,9,ARMOR,1.1)
 for x in [-66,-22,22,66]:
  box('Independent armored cannon battery',x,-9,8,31,30,10,FRAME,.9)
  box('Battery copper blast plate',x,0,18,28,12,2,COPPER,.3)
  for barrel in [-1,1]:cannon(x+barrel*5,-18,15,25,2.5,'amber',-1)
  for rib in range(4):box('Battery cooling stack',x+(rib-1.5)*5,3,20,2,9,2,DARK,.2,True)
 for side in [-1,1]:
  plate('Angular siege shoulder',[(side*24,23),(side*82,25),(side*100,8),(side*88,-4),(side*27,8)],10,8,COPPER,.8)
  for x in [37,61,84]:engine(side*x,23,10,3.1,'amber',1)
 box('Siege citadel',0,13,17,27,22,9,ARMOR,.8)
 box('Protected amber reactor',0,-1,20,15,11,3,ACCENTS['amber'],.5)
 for j in range(5):box('Reactor shielding ribs',(j-2)*3,-1,23,1.2,13,2,FRAME,.15)
 panels(8,'amber',True)

def leviathan():
 ring('Rotor underframe',0,0,0,38,21,7,ARMOR,36)
 plate('Triangular armored rotor',[(-28,18),(0,-31),(28,18)],7,12,FRAME,.7)
 ring('Central gimbal',0,0,19,19,13,6,EDGE,24)
 plate('Green triangulated reactor',[(-11,7),(0,-13),(11,7)],20,5,ACCENTS['green'],.6)
 for i in range(3):
  a=i*TAU/3;x,y=math.sin(a)*31,math.cos(a)*31
  cylinder('Arm articulation socket',x,y,11,8,9,ARMOR,16)
  ring('Mechanical joint bearing',x,y,20,6,3.5,1.2,EDGE,16)
 panels(7,'green',True)

def arm():
 box('Rotating radial arm beam',0,43,6,10,48,8,FRAME,.55)
 for side in [-1,1]:beam('Arm side rail',(side*7,24,9),(side*7,60,9),2,3,ARMOR)
 cylinder('Root articulated bearing',0,25,5,7,10,ARMOR,16)
 box('Radial accelerator housing',0,61,6,16,21,11,ARMOR,.7)
 cannon(0,61,12,13,3,'green',1)
 for side in [-1,1]:box('Radial green energy channel',side*5,60,17,1.2,16,.6,ACCENTS['green'],.1)
 for j in range(5):box('Arm radiator plate',0,33+j*4,14,9,1.5,1.5,DARK,.12,True)

def cryowarden():
 outline=[(math.sin(i*TAU/8)*49,math.cos(i*TAU/8)*45) for i in range(8)]
 plate('Octagonal fortress foundation',outline,0,12,ARMOR,1)
 for i in range(8):
  a=(i+.5)*TAU/8;sn,cs=math.sin(a),math.cos(a)
  local=[(-7,25),(7,25),(9,42),(0,65),(-9,42)]
  points=[(x*cs+y*sn,-x*sn+y*cs) for x,y in local]
  plate('Ice armored fortress pylon',points,10,12,ICE,.65)
  x,y=sn*38,cs*38
  box('Shield emitter socket',x,y,22,8,8,5,FRAME,.4)
  cylinder('Cold shield emitter',x,y,27,2.1,1,ACCENTS['cyan'],12)
  for j in [-1,1]:
   px=x+j*3;py=y-4
   mesh('Ice accretion shard',[(px-1,py,10),(px+1,py,10),(px,py+2,10),(px,py,3)],[(0,2,1),(0,1,3),(1,2,3),(2,0,3)],ICE,.02,True)
 ring('Cryogenic inner armor',0,0,13,29,17,8,FRAME,24)
 cylinder('Central prism mounting',0,0,21,16,5,ARMOR,8)
 cylinder('Faceted cryo energy column',0,0,26,8,17,ACCENTS['cyan'],6)
 for side in [-1,1]:beam('Reactor restraint',(side*11,-10,24),(side*5,-4,42),2.2,2.2,EDGE)
 panels(7,'cyan',True)

def eclipse():
 ring('Ancient annular engine',0,0,1,52,29,12,ARMOR,48)
 for i in range(16):
  a=i*TAU/16;sn,cs=math.sin(a),math.cos(a);x,y=sn*41,cs*41
  p=[(-4,30),(4,30),(5,49),(-5,49)]
  plate('Independent gravitic coil sector',[(px*cs+py*sn,-px*sn+py*cs) for px,py in p],13,5,FRAME if i%3 else PAINT['violet'],.35)
  cylinder('Magnetic coil iris',x,y,18,2.6,1.3,ACCENTS['violet'],12)
 ring('Inner magnetic race',0,0,19,32,29,1.5,EDGE,48)
 ring('Gravitational lens light',0,0,21,30.3,29.8,.7,ACCENTS['violet'],48)
 for side in [-1,1]:
  box('Gyroscopic service citadel',0,side*47,17,12,23,18,ARMOR,.6)
  for rail in [-1,1]:box('Citadel rail',rail*7,side*48,24,1.6,22,5,FRAME,.18)
 for side in [-1,1]:box('Lateral lens stabilizer',side*48,0,16,20,11,9,FRAME,.5)
 panels(7,'violet',True)

def export_mesh(key,parts,lod=False):
 rows=[];deps=bpy.context.evaluated_depsgraph_get();occluder_vertices=[];occluder_faces=[]
 for obj in parts:
  evaluated=obj.evaluated_get(deps);surface=evaluated.to_mesh();surface.calc_loop_triangles();offset=len(occluder_vertices)
  occluder_vertices.extend(v.co.copy() for v in surface.vertices);occluder_faces.extend(tuple(offset+i for i in tri.vertices) for tri in surface.loop_triangles);evaluated.to_mesh_clear()
 tree=BVHTree.FromPolygons(occluder_vertices,occluder_faces,all_triangles=True);occlusion_cache={}
 radius=8 if key.startswith('boss:') else 2.8
 def contact_ao(v,n):
  cache_key=tuple(round(float(c),4) for c in (*v,*n))
  if cache_key in occlusion_cache:return occlusion_cache[cache_key]
  tangent=n.cross(Vector((0,1,0)) if abs(n.y)<.9 else Vector((1,0,0))).normalized();other=n.cross(tangent).normalized();origin=v+n*.045;occlusion=0
  for x,y in [(0,0),(.8,0),(-.8,0),(0,.8),(0,-.8),(.6,.6),(-.6,-.6)]:
   direction=(n+tangent*x+other*y).normalized();hit=tree.ray_cast(origin,direction,radius)
   if hit[0] is not None:occlusion+=max(0,1-hit[3]/radius)
  value=max(.28,1-occlusion/7*.85);occlusion_cache[cache_key]=value;return value
 changed=[];decimators=[]
 if lod:
  for obj in parts:
   for mod in obj.modifiers:
    if mod.type=='BEVEL':changed.append((mod,mod.segments));mod.segments=1
   if not obj['detail']:
    modifier=obj.modifiers.new('Small-screen silhouette budget','DECIMATE');modifier.ratio=.30;modifier.use_collapse_triangulate=True;decimators.append((obj,modifier))
  bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
 for obj in parts:
  if lod and obj['detail']:continue
  evaluated=obj.evaluated_get(deps);m=evaluated.to_mesh();m.calc_loop_triangles()
  mat=obj.data.materials[0];rgb=list(mat.diffuse_color[:3]);tag=float(mat['tag'])
  for face in m.loop_triangles:
   for li in face.loops:
    v=m.vertices[m.loops[li].vertex_index].co;n=m.corner_normals[li].vector
    rows.extend([v.x,v.y,v.z,n.x,n.y,n.z,*rgb,tag,contact_ao(v,n),0])
  evaluated.to_mesh_clear()
 for obj,modifier in decimators:obj.modifiers.remove(modifier)
 for mod,value in changed:mod.segments=value
 return {'key':key+(':lod' if lod else ''),'family':'rift','creator':'STARFALL','assetId':'starfall-orbital:'+key,'source':'Original Orbital Realism mesh / STARFALL','lod':lod,'pbr':True,'engines':ENGINES,'engineYaw':math.pi if key.startswith('boss:') else 0,'rows':rows}

models=[]
jobs=[('enemy:'+k,lambda k=k:enemy(k)) for k in ['diver','charger','weaver','sentinel','lancer','bulwark']]
jobs += [('boss:mothership',mothership),('boss:dreadnought',dreadnought),('boss:leviathan',leviathan),('boss:cryowarden',cryowarden),('boss:eclipse',eclipse),('arm',arm)]
for index,(key,build) in enumerate(jobs):
 for o in list(bpy.data.objects):bpy.data.objects.remove(o,do_unlink=True)
 PARTS=[];DECKS=[];ENGINES=[];rng=random.Random(731+index*113);build();bpy.context.view_layer.update()
 models += [export_mesh(key,PARTS),export_mesh(key,PARTS,True)]
 print('ORBITAL',key,len(PARTS),'parts',len(models[-2]['rows'])//36,'triangles / LOD',len(models[-1]['rows'])//36,flush=True)
 bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(key.replace(':','-')+'.blend')))
(OUT/'raw-meshes.json').write_text(json.dumps(models,separators=(',',':')))
print('Original Orbital Realism mesh authoring complete.',flush=True)
