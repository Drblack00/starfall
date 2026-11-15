#!/usr/bin/env python3
"""Pack optional Blender exports into the self-contained combat-assets payload.
python3 tools/pack-combat.py RAW_JSON INDEX_WITH_FLEET OUTPUT_JSON
Requires numpy and Pillow; no runtime build step.
"""
import sys,json,re,io,base64
from pathlib import Path
import numpy as np
from PIL import Image
raw,index,out=map(Path,sys.argv[1:]);models=json.loads(raw.read_text());fleet=json.loads(re.search(r'id="fleet-assets">(.*?)</script>',index.read_text())[1]);by_name={m['name']:m for m in fleet['models']}
atlas=Image.new('RGB',(1024,512),(20,30,40));enemies=[m for m in models if m['key'].startswith('enemy:')]
for i,m in enumerate(enemies):
 image=Image.open(io.BytesIO(base64.b64decode(by_name[m['name']]['texture'].split(',')[1]))).convert('RGB').resize((240,240),Image.Resampling.LANCZOS)
 padded=Image.fromarray(np.pad(np.array(image),((8,8),(8,8),(0,0)),mode='edge'))
 atlas.paste(padded,((i%4)*256,(i//4)*256))
buffer=io.BytesIO();atlas.save(buffer,format='JPEG',quality=88,optimize=True)
packed=[]
for m in models:
 a=np.asarray(m.pop('rows'),dtype=np.float32).reshape(-1,12)
 if m['key'].startswith('enemy:'):
  i=enemies.index(m);a[:,10]=((i%4)*256+8+np.clip(a[:,10],0,1)*240)/1024;a[:,11]=((i//4)*256+8+np.clip(a[:,11],0,1)*240)/512;m['textureKey']='hostiles'
 if m['key']=='round':a[:,9]=3
 # Orient the triangles to their interpolated normals after coordinate conversion.
 faces=a.reshape(-1,3,12);cross=np.cross(faces[:,1,:3]-faces[:,0,:3],faces[:,2,:3]-faces[:,0,:3]);flip=(cross*faces[:,:,3:6].sum(1)).sum(1)<0;faces[flip]=faces[flip][:,[0,2,1],:]
 low=a.min(0);steps=(a.max(0)-low)/65535;quantized=np.round((a-low)/np.where(steps==0,1,steps)).astype('<u2');unique,ids=np.unique(quantized,axis=0,return_inverse=True)
 m.update(encoding='indexed-u16le-linear-v1',vertices=len(unique),offsets=low.tolist(),steps=steps.tolist(),data=base64.b64encode(unique.tobytes()).decode(),indices=base64.b64encode(ids.astype('<u2').tobytes()).decode())
 packed.append(m)
meta={'license':'CC0-1.0','kenneySource':'https://kenney.nl/assets/space-kit','blasterSource':'https://kenney.nl/assets/blaster-kit','downloadRepository':'https://github.com/Hidencod/tge-assets','sourceRevision':'3ddcc695adbba9fb918cf31b7c139b3f95b76910','cyberpunkSource':'https://quaternius.com/packs/cyberpunkgamekit.html','ultimateSpaceSource':'https://quaternius.com/packs/ultimatespacekit.html','quaterniusWeaponsSource':'https://quaternius.com/packs/scifimodularguns.html','quaterniusSourceRevision':fleet['sourceRevision'],'textures':{'hostiles':'data:image/jpeg;base64,'+base64.b64encode(buffer.getvalue()).decode()},'models':packed}
out.write_text(json.dumps(meta,separators=(',',':')));print('Packed',len(packed),'models',out.stat().st_size,'bytes')
