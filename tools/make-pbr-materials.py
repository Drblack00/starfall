"""Author STARFALL's embedded PBR surface maps and prefiltered RGBM studio lighting.

Offline only: python tools/make-pbr-materials.py OUTPUT_JSON
Creates original texture assets from deterministic mathematical surface descriptions.
No downloaded texture, runtime generator, framework, or build step is required.
"""
import base64, io, json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

size=1024
rng=np.random.default_rng(73194)
y,x=np.mgrid[:size,:size]
px=x%128;py=y%128
edge=np.minimum.reduce([px,127-px,py,127-py]).astype(float)
height=np.clip(edge/3,0,1)*.65
# Machined cooling slots, inset service panels, screw heads and small scratches.
vent=(px>25)&(px<102)&(py>42)&(py<78)
height-=vent*np.where(py%9<3,.23,.03)
inset=(px>16)&(px<111)&(py>91)&(py<112)
height-=inset*.13
for bx,by in [(9,9),(118,9),(9,118),(118,118)]:
 radius=np.hypot(px-bx,py-by)
 height+=np.clip((4-radius)/2,0,1)*.22
 height-=(radius<3)&(abs(px-bx)<1)
grain=rng.normal(0,.014,(size,size))
height+=grain
for _ in range(600):
 sx,sy=rng.integers(0,size,2);length=int(rng.integers(2,16))
 height[sy,sx:min(size,sx+length)]-=.03
dx=(np.roll(height,-1,1)-np.roll(height,1,1))*.8
dy=(np.roll(height,-1,0)-np.roll(height,1,0))*.8
normal=np.stack([-dx,-dy,np.ones_like(dx)],axis=2)
normal/=np.linalg.norm(normal,axis=2,keepdims=True)
normal_rgba=np.dstack([normal*.5+.5,np.clip(height,0,1)])
ao=np.clip(.9+height*.1-(edge<2)*.2,0,1)
rough=np.clip(.45+grain*1.5+vent*.15-inset*.08,.25,.7)
metal=np.clip(.85+inset*.08-vent*.15,0,1)
wear=np.clip((abs(dx)+abs(dy))*.8,0,.25)
orm=np.stack([ao,rough,metal,wear],axis=2)
def png(array):
 out=io.BytesIO();Image.fromarray(np.clip(array*255,0,255).astype('uint8'),'RGBA').save(out,format='PNG',optimize=True)
 return 'data:image/png;base64,'+base64.b64encode(out.getvalue()).decode()

# Eight roughness slices in a power-of-two atlas: no float-texture or texture-LOD extension.
width,height=256,128
v,u=np.mgrid[:height,:width]
theta=(u+.5)/width*2*np.pi-np.pi;phi=(v+.5)/height*np.pi
dirs=np.stack([np.sin(phi)*np.cos(theta),np.cos(phi),np.sin(phi)*np.sin(theta)],axis=2)
sky=np.clip(dirs[:,:,2]*.5+.5,0,1)
env=np.zeros((height,width,3),dtype=float)
env[:]=np.array([.11,.16,.23])+sky[:,:,None]*np.array([.17,.2,.24])
for direction,colour,spread in [([-0.5,.6,.65],[5.8,5.1,3.9],.10),([.8,-.2,.5],[1.0,2.0,3.5],.08),([-.2,-.8,.1],[.3,.8,1.4],.05)]:
 d=np.array(direction);d=d/np.linalg.norm(d)
 lobe=np.exp((np.sum(dirs*d,axis=2)-1)/spread)
 env+=lobe[:,:,None]*np.array(colour)
atlas=[]
for level in range(8):
 # The linear-radiance blur is baked, not repeated per frame.
 blur=[]
 for channel in range(3):
  im=Image.fromarray(np.uint8(np.clip(env[:,:,channel]/8,0,1)*255),'L')
  im=im.filter(ImageFilter.GaussianBlur((level/7)**2*22))
  blur.append(np.asarray(im).astype(float)/255*8)
 values=np.stack(blur,axis=2)
 multiplier=np.maximum(1/255,np.ceil(np.max(values,axis=2)/8*255)/255)
 rgb=values/(multiplier[:,:,None]*8)
 atlas.append(np.dstack([rgb,multiplier]))
result={'version':1,'creator':'STARFALL','resolution':size,'environmentLevels':8,
        'normal':png(normal_rgba),'orm':png(orm),'environment':png(np.concatenate(atlas,axis=0))}
Path(sys.argv[1]).write_text(json.dumps(result,separators=(',',':')))
print('Authored 1024px PBR normal/ORM maps and eight-level RGBM reflection atlas.')
