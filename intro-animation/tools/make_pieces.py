"""Cut the chosen transparent PNGs into single pieces, find where each one 'grows from',
recolour each to its own shade of gold, and save small WebP files plus a data file for the intro.

Usage:  python make_pieces.py <folder of original PNGs> <animation folder> <contact-sheet.png>
Writes  <animation folder>/assets/flowers-photos/gold/*.webp  and  <animation folder>/intro-flowers.js
The contact sheet shows every piece turned upright, with a red ring where its stem starts."""
import os, sys, json, math
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from goldmap import goldmap, PALETTES

src, anas, sheet_out = sys.argv[1], sys.argv[2], sys.argv[3]
gold_dir = os.path.join(anas, 'assets', 'flowers-photos', 'gold'); os.makedirs(gold_dir, exist_ok=True)

# kind: stem (single flower on a stem), head (bloom with no real stem), cluster (several blooms), leaf (foliage)
SOURCES = {
  'ai-generated-8472201': 'stem', 'ai-generated-9045533': 'stem', 'peony-5738281': 'stem',
  'flower-4872354': 'stem', 'flower-5428127': 'stem', 'eucalyptus-9380158': 'leaf',
  'autumn-1008520': 'leaf', 'fir-2740412': 'leaf', 'flower-7694593': 'head', 'rose-3189881': 'head',
  'flowers-4573503': 'cluster', 'flowers-5199309': 'cluster', 'flowers-4872352': 'cluster',
  'flower-3037770': 'cluster', 'roses-4993297': 'cluster', 'ai-generated-8855411': 'cluster',
  # sheets: split into separate pieces
  'leaves-8842346': 'split', 'flowers-5472172': 'split', 'flowers-6190047': 'split',
  'ai-generated-9551813': 'split', 'rose-9551838': 'split',
}
PAL = list(PALETTES)
MAXSIDE = 560
KIND_FIX = {'ai-generated-9551813-0': 'cluster', 'ai-generated-9551813-1': 'stem', 'ai-generated-9551813-2': 'leaf',
            'ai-generated-9551813-3': 'head', 'ai-generated-9551813-4': 'leaf', 'rose-9551838-0': 'cluster', 'rose-9551838-1': 'cluster'}

def anchor_of(mask):
    """Stem base = the opaque point farthest from the piece's centre of mass (stems are long and thin).
    Returns anchor (x,y), the angle that turns anchor->centre to straight up, and the reach."""
    ys, xs = np.nonzero(mask)
    cy, cx = ys.mean(), xs.mean()
    d2 = (xs - cx) ** 2 + (ys - cy) ** 2
    k = int(np.argmax(d2)); ax, ay = float(xs[k]), float(ys[k])
    ang = math.degrees(math.atan2(cx - ax, ay - cy))   # clockwise from up
    reach = float(np.sqrt(((xs - ax) ** 2 + (ys - ay) ** 2).max()))
    return ax, ay, ang, reach

pieces = []
for name, kind in SOURCES.items():
    im = Image.open(os.path.join(src, name + '.png')).convert('RGBA')
    a = np.asarray(im)[..., 3]
    if kind == 'split':
        lab, n = ndimage.label(ndimage.binary_dilation(a > 24, iterations=6))
        sizes = ndimage.sum(np.ones_like(a), lab, range(1, n + 1))
        keep = [i + 1 for i, s in enumerate(sizes) if s > a.size * .012]
        regions = [(lab == i) & (a > 0) for i in keep]
    else:
        regions = [a > 0]
    for j, reg in enumerate(regions):
        ys, xs = np.nonzero(reg)
        pad = 6
        x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, im.width)
        y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, im.height)
        crop = np.asarray(im)[y0:y1, x0:x1].copy()
        crop[..., 3] = np.where(reg[y0:y1, x0:x1], crop[..., 3], 0)
        piece = Image.fromarray(crop, 'RGBA')
        sub_kind = kind
        if kind == 'split':
            sub_kind = 'leaf' if name.startswith('leaves') else ('head' if name == 'flowers-6190047' else 'stem')
            if name in ('ai-generated-9551813', 'rose-9551838'):
                # these sheets mix stemmed roses, loose heads and single leaves; tell them apart by shape
                ys2, xs2 = np.nonzero(crop[..., 3] > 24)
                ex, ey = np.ptp(xs2), np.ptp(ys2); elong = (max(ex, ey) + 1) / (min(ex, ey) + 1)
                sub_kind = 'stem' if elong > 1.7 else 'head'
        pid = f'{name}-{j}' if kind == 'split' else name
        sub_kind = KIND_FIX.get(pid, sub_kind)
        pal = PAL[len(pieces) % len(PAL)]
        g = goldmap(piece, pal)
        s = min(1.0, MAXSIDE / max(g.size))
        if s < 1: g = g.resize((round(g.width * s), round(g.height * s)), Image.LANCZOS)
        m = np.asarray(g)[..., 3] > 40
        if m.sum() < 400: continue
        ax, ay, ang, reach = anchor_of(m)
        fn = f'{pid}-{pal}.webp'
        g.save(os.path.join(gold_dir, fn), 'WEBP', quality=74, method=6)
        pieces.append(dict(id=pid, src=f'assets/flowers-photos/gold/{fn}', kind=sub_kind, palette=pal,
                           w=g.width, h=g.height, ax=round(ax, 1), ay=round(ay, 1), ang=round(ang, 1), reach=round(reach, 1)))

# contact sheet: each piece upright as the intro will place it, anchor marked
C, cols = 200, 8
rows = (len(pieces) + cols - 1) // cols
sh = Image.new('RGB', (C * cols, (C + 16) * rows), '#0b0a08'); d = ImageDraw.Draw(sh)
for k, p in enumerate(pieces):
    g = Image.open(os.path.join(anas, p['src']))
    big = Image.new('RGBA', (g.width * 3, g.height * 3)); ox, oy = g.width, g.height
    big.paste(g, (ox, oy))
    r = big.rotate(p['ang'], center=(ox + p['ax'], oy + p['ay']), resample=Image.BICUBIC)   # PIL rotates counter-clockwise
    bb = r.getbbox(); r = r.crop(bb); acx, acy = ox + p['ax'] - bb[0], oy + p['ay'] - bb[1]
    sc = (C - 20) / max(r.size); r = r.resize((max(1, int(r.width * sc)), max(1, int(r.height * sc))))
    x, y = (k % cols) * C, (k // cols) * (C + 16)
    px, py = x + (C - r.width) // 2, y + (C - r.height) // 2
    sh.paste(r, (px, py), r)
    d.ellipse([px + acx * sc - 4, py + acy * sc - 4, px + acx * sc + 4, py + acy * sc + 4], outline='#ff4040', width=2)
    d.text((x + 4, y + C), f"{p['id'][:22]} {p['kind']}", fill='#9a8460')
sh.save(sheet_out)
total = sum(os.path.getsize(os.path.join(anas, p['src'])) for p in pieces)
js = ('/* Gold flower photos for the intro frame (generated by tools/make_pieces.py; do not edit by hand).\n'
      ' * Source photos: Pixabay, free for commercial use under the Pixabay Content License (no credit required).\n'
      ' * For each piece: w/h = image size in px, ax/ay = where its stem starts, ang = degrees to turn it\n'
      ' * so it grows straight up from that point, reach = px from that point to its far tip. */\n'
      'window.ANAIS_FLOWERS = ' + json.dumps({'items': pieces}, separators=(',', ':')) + ';\n')
open(os.path.join(anas, 'intro-flowers.js'), 'w', encoding='utf-8').write(js)
print(len(pieces), 'pieces,', total // 1024, 'KB of WebP')
