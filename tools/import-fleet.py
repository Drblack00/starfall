#!/usr/bin/env python3
"""Optional offline authoring; the shipped HTML needs no build step.

Input: public/glb/spaceships_pack from trebeljahr/quaternius-showcase at
0128ca510d653bb04d6d1e4885bd8890b5050b4f (Quaternius CC0 models).
Requires numpy and Pillow. Outputs the embedded fleet-assets JSON payload.
This imports the pinned pack's static, single-primitive GLBs, not arbitrary glTF.
"""
import argparse
import base64
import hashlib
import io
import json
import struct
from pathlib import Path

import numpy as np
from PIL import Image

SOURCE_REVISION = "0128ca510d653bb04d6d1e4885bd8890b5050b4f"
MODELS = {
    "phantom": "Omen", "aegis": "Challenger", "interceptor": "Insurgent",
    "bulwark": "Pancake", "spectre": "Executioner", "tempest": "Spitfire",
    "nomad": "Dispatcher", "solaris": "Striker", "reaper": "Zenith",
    "starforge": "Bob", "sovereign": "Imperial",
}
ENGINES = {
    "phantom": [[-6, -26, 4], [6, -26, 4]],
    "aegis": [[-6, -25, 4], [6, -25, 4]],
    "interceptor": [[0, -27, 4]],
    "bulwark": [[-7, -20, 4], [7, -20, 4]],
    "spectre": [[-8, -24, 4], [8, -24, 4]],
    "tempest": [[-9, -18, 5], [9, -18, 5]],
    "nomad": [[0, -27, 4]],
    "solaris": [[-5, -26, 4], [5, -26, 4]],
    "reaper": [[0, -27, 4]], "starforge": [[0, -14, 4]],
    "sovereign": [[-5, -26, 4], [5, -26, 4]],
}


def import_model(path, slot, name, original_path, texture_size=2048):
    raw = path.read_bytes()
    magic, version, length = struct.unpack_from("<III", raw)
    assert magic == 0x46546C67 and version == 2 and length == len(raw)
    json_length, kind = struct.unpack_from("<II", raw, 12)
    assert kind == 0x4E4F534A
    doc = json.loads(raw[20:20 + json_length])
    buf = raw[28 + json_length:]
    assert len(doc["meshes"]) == 1 and len(doc["nodes"]) == 1
    assert not any(k in doc["nodes"][0] for k in ("matrix", "translation", "rotation", "scale"))

    def accessor(index):
        item = doc["accessors"][index]
        view = doc["bufferViews"][item["bufferView"]]
        assert "sparse" not in item
        dtype = {5126: "<f4", 5125: "<u4", 5123: "<u2"}[item["componentType"]]
        size = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[item["type"]]
        assert view.get("byteStride", size * np.dtype(dtype).itemsize) == size * np.dtype(dtype).itemsize
        return np.frombuffer(
            buf, dtype=dtype, count=item["count"] * size,
            offset=view.get("byteOffset", 0) + item.get("byteOffset", 0),
        ).reshape(item["count"], size).copy()

    primitives = doc["meshes"][0]["primitives"]
    assert len(primitives) == 1 and primitives[0].get("mode", 4) == 4
    primitive = primitives[0]
    pos = accessor(primitive["attributes"]["POSITION"])
    norm = accessor(primitive["attributes"]["NORMAL"])
    uv = accessor(primitive["attributes"]["TEXCOORD_0"])
    ids = accessor(primitive["indices"]).ravel()
    low, high = pos.min(0), pos.max(0)
    scale = 54 / max(high[2] - low[2], high[0] - low[0])
    center = (low + high) / 2
    out = np.zeros((len(ids), 12), dtype=np.float32)
    # Source +Z is the nose; swap Y/Z into the existing craft coordinate system.
    out[:, 0] = (pos[ids, 0] - center[0]) * scale
    out[:, 1] = (pos[ids, 2] - center[2]) * scale
    out[:, 2] = (pos[ids, 1] - low[1]) * scale
    out[:, 3:6] = norm[ids][:, [0, 2, 1]]
    out[:, 6:9] = 1
    out[:, 9] = 8  # Textured craft material in the shared runtime shader.
    out[:, 10:12] = uv[ids]

    faces = out.reshape(-1, 3, 12)
    cross = np.cross(faces[:, 1, :3] - faces[:, 0, :3], faces[:, 2, :3] - faces[:, 0, :3])
    swap = np.sum(cross * faces[:, :, 3:6].sum(1), axis=1) < 0
    faces[swap] = faces[swap][:, [0, 2, 1], :]
    offsets = out.min(0)
    steps = (out.max(0) - offsets) / 65535
    safe_steps = np.where(steps == 0, 1, steps)
    quantized = np.round((out - offsets) / safe_steps).astype("<u2")
    unique, inverse = np.unique(quantized, axis=0, return_inverse=True)
    assert len(unique) <= 65536

    view = doc["bufferViews"][doc["images"][0]["bufferView"]]
    start = view.get("byteOffset", 0)
    image = Image.open(io.BytesIO(buf[start:start + view["byteLength"]])).convert("RGB")
    image.thumbnail((texture_size, texture_size), Image.Resampling.LANCZOS)
    jpeg = io.BytesIO()
    image.save(jpeg, format="JPEG", quality=94, subsampling=0, optimize=True)
    encode = lambda value: base64.b64encode(value).decode("ascii")
    return {
        "ship": slot, "name": name, "sourceFile": path.name,
        "sha256": hashlib.sha256(original_path.read_bytes()).hexdigest(),
        "triangles": len(ids) // 3, "vertices": len(unique),
        "offsets": offsets.tolist(), "steps": steps.tolist(),
        "encoding": "indexed-u16le-linear-v1", "data": encode(unique.tobytes()),
        "indices": encode(inverse.astype("<u2").tobytes()),
        "texture": "data:image/jpeg;base64," + encode(jpeg.getvalue()),
        "textureSize": list(image.size),
        "detail": "source-resolution",
        "engines": ENGINES[slot],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--optimized-dir", type=Path, help="Optional Blender flight-budget meshes")
    parser.add_argument("--texture-size", type=int, default=2048, help="Maximum embedded texture edge")
    args = parser.parse_args()
    models = []
    for slot, name in MODELS.items():
        original = args.source_dir / (name + ".glb")
        path = args.optimized_dir / original.name if args.optimized_dir else original
        if not path.exists():
            path = original
        model = import_model(path, slot, name, original, args.texture_size)
        if path != original:
            model["optimizedSha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
            source_bytes = original.read_bytes()
            json_length = struct.unpack_from("<I", source_bytes, 12)[0]
            source_doc = json.loads(source_bytes[20:20 + json_length])
            source_primitive = source_doc["meshes"][0]["primitives"][0]
            model["originalTriangles"] = source_doc["accessors"][source_primitive["indices"]]["count"] // 3
        models.append(model)
        print(slot, name, model["triangles"], "triangles")
    pack = {
        "creator": "Quaternius", "license": "CC0-1.0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
        "url": "https://quaternius.com/packs/ultimatespaceships.html",
        "downloadRepository": "https://github.com/trebeljahr/quaternius-showcase",
        "sourceRevision": SOURCE_REVISION, "models": models,
    }
    args.output.write_text(json.dumps(pack, separators=(",", ":")))
    print("PACK BYTES", args.output.stat().st_size)


if __name__ == "__main__":
    main()
