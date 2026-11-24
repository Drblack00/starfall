"""Offline embedding of authored hulls and approved environment plates.
python tools/embed-orbital-assets.py INDEX MESH_JSON ORBITAL_EMBER_ECLIPSE_PNG RIFT_CRYO_PNG
No gameplay block is edited, and no runtime network assets are introduced.
"""
from pathlib import Path
import sys,json,base64,io,re,hashlib
from PIL import Image
index,mesh,a,b=map(Path,sys.argv[1:]);text=index.read_text()
atlases=[]
for path,columns in [(a,3),(b,2)]:
 image=Image.open(path).convert('RGB');out=io.BytesIO();image.save(out,'WEBP',quality=92,method=6)
 atlases.append({'columns':columns,'width':image.width,'height':image.height,'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'image':'data:image/webp;base64,'+base64.b64encode(out.getvalue()).decode()})
scenes={'creator':'STARFALL','style':'Orbital Realism','atlases':atlases,'sectors':[[0,0],[0,1],[1,0],[1,1],[0,2]]}
for key,value in [('orbital-meshes',mesh.read_text()),('orbital-scenes',json.dumps(scenes,separators=(',',':')))]:
 block='<script type="application/json" id="'+key+'">'+value+'</script>\n'
 if 'id="'+key+'"' in text:text=re.sub(r'<script[^>]*id="'+key+r'">.*?</script>\s*',lambda m:block,text,flags=re.S)
 else:text=text.replace('    <div id="stage">',block+'    <div id="stage">',1)
index.write_text(text);print(index.stat().st_size,'bytes; authored meshes and five distinct scenes embedded')
