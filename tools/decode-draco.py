"""Offline-only Draco expansion for pinned Quaternius source GLBs.
python3 tools/decode-draco.py SOURCE_GLB_ROOT OUTPUT_ROOT
Requires DracoPy and numpy. No decoder is shipped to the game.
"""
import json
import struct
import sys
from pathlib import Path
import numpy as np
import DracoPy
source, output = map(Path, sys.argv[1:])
for name in ('Enemy_Flying-transformed.glb', 'Enemy_ExtraSmall-transformed.glb'):
    relative = Path('ultimate_space_pack') / name
    raw = (source / relative).read_bytes()
    length = struct.unpack_from('<I', raw, 12)[0]
    doc = json.loads(raw[20:20 + length])
    binary = bytearray(raw[28 + length:])
    def write_accessor(index, values):
        accessor = doc['accessors'][index]
        dtype = {5121: 'u1', 5123: '<u2', 5125: '<u4', 5126: '<f4'}[accessor['componentType']]
        data = np.asarray(values, dtype=dtype).tobytes()
        binary.extend(b'\0' * (-len(binary) % 4))
        view = {'buffer': 0, 'byteOffset': len(binary), 'byteLength': len(data)}
        accessor['bufferView'] = len(doc['bufferViews'])
        accessor['byteOffset'] = 0
        doc['bufferViews'].append(view)
        binary.extend(data)
    for mesh in doc['meshes']:
        for primitive in mesh['primitives']:
            ext = primitive.get('extensions', {}).pop('KHR_draco_mesh_compression', None)
            if not ext:
                continue
            view = doc['bufferViews'][ext['bufferView']]
            begin = view.get('byteOffset', 0)
            decoded = DracoPy.decode(bytes(binary[begin:begin + view['byteLength']]))
            attributes = {a['unique_id']: a['data'] for a in decoded.attributes}
            for semantic, unique_id in ext['attributes'].items():
                write_accessor(primitive['attributes'][semantic], attributes[unique_id])
            write_accessor(primitive['indices'], decoded.faces)
    for key in ('extensionsRequired', 'extensionsUsed'):
        if key in doc:
            doc[key] = [e for e in doc[key] if e != 'KHR_draco_mesh_compression']
    doc['buffers'][0]['byteLength'] = len(binary)
    payload = json.dumps(doc, separators=(',', ':')).encode()
    payload += b' ' * (-len(payload) % 4)
    binary.extend(b'\0' * (-len(binary) % 4))
    data = struct.pack('<III', 0x46546C67, 2, 28 + len(payload) + len(binary))
    data += struct.pack('<II', len(payload), 0x4E4F534A) + payload
    data += struct.pack('<II', len(binary), 0x004E4942) + binary
    target = output / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    print(relative, len(data), 'bytes')
