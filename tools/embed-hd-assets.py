"""Optional offline embedding of restored source meshes and original PBR assets.

python tools/embed-hd-assets.py INDEX FLEET_JSON DRONES_JSON PBR_JSON
Only asset script blocks change; gameplay data and functions are untouched.
"""
import base64,json,re,sys
from pathlib import Path
import numpy as np

index,fleet_path,drone_path,pbr_path=map(Path,sys.argv[1:])
text=index.read_text()
combat=json.loads(re.search(r'id="combat-assets">(.*?)</script>',text,re.S)[1])
for model in json.loads(drone_path.read_text()):
 vertices=np.asarray(model.pop('rows'),dtype=np.float32).reshape(-1,12)
 faces=vertices.reshape(-1,3,12)
 cross=np.cross(faces[:,1,:3]-faces[:,0,:3],faces[:,2,:3]-faces[:,0,:3])
 flip=(cross*faces[:,:,3:6].sum(1)).sum(1)<0
 faces[flip]=faces[flip][:,[0,2,1],:]
 offsets=vertices.min(0);steps=(vertices.max(0)-offsets)/65535
 quantized=np.round((vertices-offsets)/np.where(steps==0,1,steps)).astype('<u2')
 unique,ids=np.unique(quantized,axis=0,return_inverse=True)
 assert len(unique)<65536
 model.update(encoding='indexed-u16le-linear-v1',vertices=len(unique),offsets=offsets.tolist(),steps=steps.tolist(),
  data=base64.b64encode(unique.tobytes()).decode(),indices=base64.b64encode(ids.astype('<u2').tobytes()).decode())
 n=next(i for i,m in enumerate(combat['models']) if m['key']==model['key'])
 combat['models'][n]=model
combat['detail']='source-resolution PBR'
for key,data in [('fleet-assets',json.loads(fleet_path.read_text())),('combat-assets',combat)]:
 text=re.sub(r'(<script[^>]*id="'+key+r'">).*?(</script>)',lambda m:m[1]+json.dumps(data,separators=(',',':'))+m[2],text,flags=re.S)
block='<script type="application/json" id="pbr-assets">'+pbr_path.read_text()+'</script>\n'
if 'id="pbr-assets"' in text:
 text=re.sub(r'<script[^>]*id="pbr-assets">.*?</script>\s*',lambda m:block,text,flags=re.S)
else:text=text.replace('<script type="application/json" id="fleet-assets">',block+'<script type="application/json" id="fleet-assets">',1)
index.write_text(text)
print('Embedded full fleet, six detailed drones, and PBR maps:',index.stat().st_size,'bytes')
