"""Segment the two tool photos with BiRefNet (via rembg) and save their alpha mattes.
Usage: python -I segment_tools.py <dl dir> <out dir> [model]"""
import sys, os
from PIL import Image
from rembg import new_session, remove

DL, OUT = sys.argv[1], sys.argv[2]
MODEL = sys.argv[3] if len(sys.argv) > 3 else "birefnet-general"
os.makedirs(OUT, exist_ok=True)
session = new_session(MODEL)
for name in ("scissors", "clipper"):
    img = Image.open(os.path.join(DL, name + ".jpg")).convert("RGB")
    mask = remove(img, session=session, only_mask=True)
    mask.save(os.path.join(OUT, f"{name}_alpha_{MODEL}.png"))
    print(name, img.size, "done", flush=True)
