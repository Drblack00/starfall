#!/usr/bin/env python3
"""Pack optional Blender exports into the self-contained combat-assets payload.
python3 tools/pack-combat.py RAW_JSON INDEX_WITH_FLEET OUTPUT_JSON
Requires numpy. Enemy hulls are authored in index.html and never sourced from the fleet.
"""
import base64
import json
import re
import sys
from pathlib import Path
import numpy as np

raw, index, output = map(Path, sys.argv[1:])
models = [m for m in json.loads(raw.read_text()) if not m['key'].startswith('enemy:')]
fleet = json.loads(re.search(r'id="fleet-assets">(.*?)</script>', index.read_text())[1])
packed = []
for model in models:
    vertices = np.asarray(model.pop('rows'), dtype=np.float32).reshape(-1, 12)
    if model['key'] == 'round':
        vertices[:, 9] = 3
    faces = vertices.reshape(-1, 3, 12)
    cross = np.cross(faces[:, 1, :3] - faces[:, 0, :3], faces[:, 2, :3] - faces[:, 0, :3])
    flip = (cross * faces[:, :, 3:6].sum(1)).sum(1) < 0
    faces[flip] = faces[flip][:, [0, 2, 1], :]
    low = vertices.min(0)
    steps = (vertices.max(0) - low) / 65535
    quantized = np.round((vertices - low) / np.where(steps == 0, 1, steps)).astype('<u2')
    unique, indices = np.unique(quantized, axis=0, return_inverse=True)
    model.update(encoding='indexed-u16le-linear-v1', vertices=len(unique), offsets=low.tolist(), steps=steps.tolist(),
                 data=base64.b64encode(unique.tobytes()).decode(),
                 indices=base64.b64encode(indices.astype('<u2').tobytes()).decode())
    packed.append(model)
metadata = {
    'license': 'CC0-1.0', 'kenneySource': 'https://kenney.nl/assets/space-kit',
    'blasterSource': 'https://kenney.nl/assets/blaster-kit',
    'downloadRepository': 'https://github.com/Hidencod/tge-assets',
    'sourceRevision': '3ddcc695adbba9fb918cf31b7c139b3f95b76910',
    'cyberpunkSource': 'https://quaternius.com/packs/cyberpunkgamekit.html',
    'ultimateSpaceSource': 'https://quaternius.com/packs/ultimatespacekit.html',
    'quaterniusWeaponsSource': 'https://quaternius.com/packs/scifimodularguns.html',
    'quaterniusSourceRevision': fleet['sourceRevision'], 'textures': {}, 'models': packed,
}
output.write_text(json.dumps(metadata, separators=(',', ':')))
print('Packed', len(packed), 'models', output.stat().st_size, 'bytes')
