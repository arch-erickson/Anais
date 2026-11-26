"""Cut the head out of the sunflower photo, feather its edge into a soft circle and turn it gold.
This is the photo that turns in the centre before it dissolves into the logo's sunflower.

Usage:  python make_sunflower.py <sun-flower-1952014.png> <animation folder>
Writes  <animation folder>/assets/flowers-photos/gold/sunflower-hero-rich.webp  (640 x 640)
Source: Pixabay image 1952014 (Pixabay Content License, no credit required)."""
import os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from goldmap import goldmap

src, out_dir = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
a = np.asarray(im)[..., 3] > 40
cx, cy = 357, 365                                   # centre of the head in this photo (measured by eye)
ys, xs = np.nonzero(a[:700])
up = ys < cy                                        # radius from the upper petals only: the stem leaves from below
r = np.sqrt((xs[up] - cx) ** 2 + (ys[up] - cy) ** 2).max() + 6
yy, xx = np.mgrid[:im.height, :im.width]
soft = np.clip((r - np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)) / 18, 0, 1)   # feather the circle edge over 18 px
arr = np.asarray(im).copy()
arr[..., 3] = (arr[..., 3] * soft).astype(np.uint8)
head = Image.fromarray(arr).crop((int(cx - r), int(cy - r), int(cx + r), int(cy + r)))
g = goldmap(head, 'rich', contrast=1.1).resize((640, 640), Image.LANCZOS)
out = os.path.join(out_dir, 'assets', 'flowers-photos', 'gold', 'sunflower-hero-rich.webp')
os.makedirs(os.path.dirname(out), exist_ok=True)
g.save(out, 'WEBP', quality=82, method=6)
print(out, os.path.getsize(out) // 1024, 'KB')
