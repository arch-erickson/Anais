"""Gradient-map a transparent PNG to gold: the image's own light and shade become shades of gold,
transparency is kept. Several gold palettes give each flower a slightly different shade."""
import numpy as np
from PIL import Image

PALETTES = {   # dark -> light
    'rich':      ['#1E1205', '#6B4512', '#B47F2A', '#E2B95E', '#FFF0C4'],
    'champagne': ['#2E2111', '#86663A', '#C9A870', '#EBD5A2', '#FFF7E3'],
    'antique':   ['#170E05', '#553712', '#93682F', '#C49A58', '#EDD5A0'],
    'rose':      ['#22140B', '#6E4628', '#B58456', '#E0BC8E', '#FBEBD6'],
    'honey':     ['#221204', '#7A4A0E', '#C98A22', '#F0C15A', '#FFF1C8'],
}
def _hex(h): return np.array([int(h[i:i+2], 16) for i in (1, 3, 5)], dtype=np.float32)

def goldmap(im, palette='rich', contrast=1.0):
    im = im.convert('RGBA')
    a = np.asarray(im).astype(np.float32)
    rgb, alpha = a[..., :3], a[..., 3]
    lum = (rgb @ np.array([.2126, .7152, .0722], dtype=np.float32)) / 255
    m = alpha > 128
    if m.sum() > 50:                                # stretch each image's own tonal range
        lo, hi = np.percentile(lum[m], [2, 98])
        lum = np.clip((lum - lo) / max(hi - lo, 1e-3), 0, 1)
    lum = np.clip(.5 + (lum - .5) * contrast, 0, 1)
    stops = np.stack([_hex(c) for c in PALETTES[palette]])
    x = lum * (len(stops) - 1)
    i0 = np.clip(np.floor(x).astype(int), 0, len(stops) - 2)
    f = (x - i0)[..., None]
    out = stops[i0] * (1 - f) + stops[i0 + 1] * f
    res = np.dstack([out, alpha]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(res, 'RGBA')
