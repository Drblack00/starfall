#!/usr/bin/env python3
"""Optional deterministic texture authoring; outputs a self-contained PNG data URI."""
import base64
import io
import sys
from pathlib import Path

import numpy as np
from PIL import Image

rng = np.random.default_rng(1437)
size = 256

def noise(grid):
    values = rng.random((grid, grid))
    axis = np.arange(size) * grid / size
    integer = np.floor(axis).astype(int)
    fraction = axis - integer
    fraction = fraction * fraction * (3 - 2 * fraction)
    x, y = integer[None, :], integer[:, None]
    u, v = fraction[None, :], fraction[:, None]
    a = values[y % grid, x % grid] * (1 - u) + values[y % grid, (x + 1) % grid] * u
    b = values[(y + 1) % grid, x % grid] * (1 - u) + values[(y + 1) % grid, (x + 1) % grid] * u
    return a * (1 - v) + b * v

cloud = sum(noise(4 * 2**i) * .5**i for i in range(5)) / 1.9375
ridge = np.clip(1 - abs(cloud * 2 - 1), 0, 1)**5
texture = np.stack((cloud, ridge * noise(8), noise(32)), axis=-1)
image = Image.fromarray(np.round(texture * 255).astype('uint8'), 'RGB')
output = io.BytesIO()
image.save(output, format='PNG', optimize=True)
Path(sys.argv[1]).write_text('data:image/png;base64,' + base64.b64encode(output.getvalue()).decode('ascii'))
