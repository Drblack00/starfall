"""Pack authored Orbital Realism meshes, preserving the existing visual footprint.
python tools/pack-orbital-fleet.py RAW_MESHES_JSON OUTPUT_JSON MANIFEST_JSON
All geometry and LODs are authored offline; no runtime mesh construction required.
"""
import sys,json,hashlib,base64,gc
from pathlib import Path
import numpy as np

source,output,manifest=map(Path,sys.argv[1:])
targets={
 'enemy:diver':(19,18,10),'enemy:charger':(15.5,18,14),
 'enemy:weaver':(18,17,10),'enemy:sentinel':(20,17,12),
 'enemy:lancer':(12,22,12),'enemy:bulwark':(26,14,15),
 'boss:mothership':(109,42,40),'boss:dreadnought':(108,48,34),
 'boss:leviathan':(40,40,33),'boss:cryowarden':(68,68,46),
 'boss:eclipse':(59,63,54),'arm':(9,76,19)}
models=json.loads(source.read_text());scales={};packed=[];lock={}
encode=lambda data:base64.b64encode(data).decode()
for model in models:
 key=model['key'];base=key.removesuffix(':lod');v=np.array(model.pop('rows'),dtype=np.float32).reshape(-1,12)
 if not model['lod']:
  extent=np.max(np.abs(v[:,:3]),axis=0);scales[base]=np.array(targets[base])/extent
 scale=scales[base];v[:,:3]*=scale;v[:,3:6]/=scale;v[:,3:6]/=np.maximum(np.linalg.norm(v[:,3:6],axis=1)[:,None],1e-8)
 for engine in model['engines']:
  # JSON arrays from high and low exports are independent.
  for c in range(3):engine[c]*=float(scale[c])
 faces=v.reshape(-1,3,12);cross=np.cross(faces[:,1,:3]-faces[:,0,:3],faces[:,2,:3]-faces[:,0,:3]);flip=(cross*faces[:,:,3:6].sum(1)).sum(1)<0;faces[flip]=faces[flip][:,[0,2,1],:]
 lo=v.min(0);hi=v.max(0);steps=(hi-lo)/65535
 q=np.round((v-lo)/np.where(steps==0,1,steps)).astype('<u2');unique,ids=np.unique(q,axis=0,return_inverse=True)
 index_bytes=4 if len(unique)>65535 else 2
 vertex_data=unique.tobytes();indices=ids.astype('<u4' if index_bytes==4 else '<u2').tobytes();digest=hashlib.sha256(vertex_data+indices).hexdigest()
 model.update(encoding='indexed-u16le-linear-v1',indexBytes=index_bytes,vertices=len(unique),triangles=len(ids)//3,offsets=lo.tolist(),steps=steps.tolist(),bounds=[v[:,:3].min(0).tolist(),v[:,:3].max(0).tolist()],roof=float(v[:,2].max()),sha256=digest,data=encode(vertex_data),indices=encode(indices))
 packed.append(model);lock[key]={k:model[k] for k in ['sha256','vertices','triangles','bounds','assetId','lod','indexBytes']}
 print(key,len(unique),'vertices',len(ids)//3,'triangles',flush=True);del v,faces,q,unique,ids;gc.collect()
script=Path(__file__).with_name('author-orbital-fleet.py')
payload={'version':1,'creator':'STARFALL','rights':'Original project-authored geometry','authoringSha256':hashlib.sha256(script.read_bytes()).hexdigest(),'models':packed}
output.write_text(json.dumps(payload,separators=(',',':')));manifest.write_text(json.dumps({'authoringSha256':payload['authoringSha256'],'models':lock},indent=2)+'\n')
print(output.stat().st_size,'packed bytes')
