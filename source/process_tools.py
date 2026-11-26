"""Turn the BiRefNet cutouts into clean gold tool images.
- paints out printed brand marks
- recolours to the ANAIS gold, keeping the photo's light and shade
Usage: python -I process_tools.py <dl dir> <work dir>"""
import sys, os, json
import numpy as np, cv2
from scipy import ndimage as ndi

DL, WK = sys.argv[1], sys.argv[2]
MODEL = "birefnet-general"

GOLD = [(0.00, (30, 18, 5)), (0.20, (88, 56, 20)), (0.42, (160, 112, 46)),
        (0.62, (210, 164, 86)), (0.80, (236, 204, 138)), (0.93, (250, 232, 186)), (1.0, (255, 249, 230))]
def gold_ramp(t):
    xs = [p for p, _ in GOLD]
    return np.stack([np.interp(t, xs, [c[i] for _, c in GOLD]) for i in range(3)], -1)

def load(name):
    img = cv2.imread(os.path.join(DL, name + ".jpg"))
    a = cv2.imread(os.path.join(WK, f"{name}_alpha_{MODEL}.png"), cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
    return img, a

def clean_alpha(a):
    """Drop faint specks, keep the main object, tidy the matte edge."""
    solid = a > 0.5
    lab, n = ndi.label(solid)
    sizes = ndi.sum(solid, lab, range(1, n + 1))
    keep = lab == (np.argmax(sizes) + 1)
    near = ndi.binary_dilation(keep, iterations=3)
    a = np.where(near, a, 0)
    return np.clip((a - 0.08) / 0.84, 0, 1)

def paint_out(img, mask, radius=8, soften=4):
    out = cv2.inpaint(img, mask.astype(np.uint8) * 255, radius, cv2.INPAINT_TELEA)
    blur = cv2.GaussianBlur(out, (0, 0), soften)
    m = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), soften)[..., None]
    return (out * (1 - m) + blur * m).astype(np.uint8)

def surface_fill(img, mask, ring=28, seed=7):
    """Replace masked pixels with a smooth quadratic surface fitted to the clean metal
    around them, plus matching grain - for repairing flat polished areas."""
    band = ndi.binary_dilation(mask, iterations=ring) & ~ndi.binary_dilation(mask, iterations=2)
    ys, xs = np.where(band)
    yy, xx = np.where(mask)
    sx, sy = xs.mean(), ys.mean(); sc = max(xs.std(), ys.std())
    def design(x, y):
        x, y = (x - sx) / sc, (y - sy) / sc
        return np.stack([np.ones_like(x), x, y, x * x, x * y, y * y, x**3, y**3], 1)
    D, Dm = design(xs.astype(float), ys.astype(float)), design(xx.astype(float), yy.astype(float))
    out = img.astype(np.float32).copy()
    rng = np.random.default_rng(seed)
    for ch in range(3):
        v = img[ys, xs, ch].astype(float)
        coef, *_ = np.linalg.lstsq(D, v, rcond=None)
        resid = v - D @ coef
        keep = np.abs(resid) < 2.5 * resid.std()          # ignore stray specks in the fit
        coef, *_ = np.linalg.lstsq(D[keep], v[keep], rcond=None)
        out[yy, xx, ch] = Dm @ coef
    noise = cv2.GaussianBlur(rng.normal(0, 1, img.shape[:2]).astype(np.float32), (0, 0), 1.2)
    noise *= float(np.std(img[ys, xs].astype(float) - out[ys, xs])) * 0.9 / max(noise[mask].std(), 1e-6)
    out[yy, xx] += noise[yy, xx][:, None]
    m = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 2)[..., None]
    return np.clip(img * (1 - m) + out * m, 0, 255).astype(np.uint8)

def row_fill(img, mask, grain_box=None, avg=6):
    """Fill masked runs row by row, blending between the clean metal just left and right
    of each run, then add matching grain. Keeps the blade's natural shading."""
    H, W = mask.shape
    # smooth base: harmonic (Laplace) fill of the low-frequency image, solved coarse-to-fine
    low = cv2.GaussianBlur(img.astype(np.float32), (0, 0), 2.5)
    ys, xs = np.where(mask)
    pad = 40
    y0, y1, x0, x1 = max(ys.min() - pad, 0), min(ys.max() + pad, H), max(xs.min() - pad, 0), min(xs.max() + pad, W)
    sub, m = low[y0:y1, x0:x1].copy(), mask[y0:y1, x0:x1]
    def solve(v, mm, iters):
        k = np.array([[0, .25, 0], [.25, 0, .25], [0, .25, 0]], np.float32)
        for _ in range(iters):
            v = np.where(mm[..., None], cv2.filter2D(v, -1, k, borderType=cv2.BORDER_REPLICATE), v)
        return v
    # coarse solve, then upsample as the starting guess for the full-res solve
    f = 8
    vs = cv2.resize(sub, (sub.shape[1] // f, sub.shape[0] // f), interpolation=cv2.INTER_AREA)
    ms = cv2.resize(m.astype(np.uint8), (vs.shape[1], vs.shape[0]), interpolation=cv2.INTER_NEAREST).astype(bool)
    vs = solve(vs, ms, 600)
    guess = cv2.resize(vs, (sub.shape[1], sub.shape[0]), interpolation=cv2.INTER_CUBIC)
    sub = np.where(m[..., None], guess, sub)
    sub = solve(sub, m, 300)
    out = img.astype(np.float32).copy()
    m3 = mask[..., None]
    region = out[y0:y1, x0:x1]
    out[y0:y1, x0:x1] = np.where(m[..., None], sub, region)
    # real grain: high-frequency detail from a clean patch of the same blade, mirror-tiled
    hp = img.astype(np.float32) - cv2.GaussianBlur(img.astype(np.float32), (0, 0), 2.5)
    if grain_box is not None:
        gx0, gy0, gx1, gy1 = grain_box
        patch = hp[gy0:gy1, gx0:gx1]
        tile = np.concatenate([patch, patch[:, ::-1]], 1)
        tile = np.concatenate([tile, tile[::-1]], 0)
        reps = (H // tile.shape[0] + 2, W // tile.shape[1] + 2, 1)
        tex = np.tile(tile, reps)[:H, :W]
        out = np.where(m3, out + tex, out)
    return np.clip(out, 0, 255).astype(np.uint8)

def recolour(img, a, lo_pct, hi_pct, gamma, clahe=None):
    L = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)[..., 0]
    if clahe:
        L = cv2.createCLAHE(clipLimit=clahe, tileGridSize=(8, 8)).apply(L)
    L = L.astype(np.float32) / 255
    inside = a > 0.95
    lo, hi = np.percentile(L[inside], lo_pct), np.percentile(L[inside], hi_pct)
    t = np.clip((L - lo) / (hi - lo), 0, 1) ** gamma
    return np.dstack([gold_ramp(t), a * 255]).astype(np.uint8)

def crop(rgba, pad=6):
    ys, xs = np.where(rgba[..., 3] > 6)
    y0, x0 = max(ys.min() - pad, 0), max(xs.min() - pad, 0)
    return rgba[y0:ys.max() + pad + 1, x0:xs.max() + pad + 1], (x0, y0)

info = {}

# ---------------------------------------------------------------- shears
s, a = load("scissors")
a = clean_alpha(a)
H, W = a.shape
lum = cv2.cvtColor(s, cv2.COLOR_BGR2GRAY)
hsv = cv2.cvtColor(s, cv2.COLOR_BGR2HSV)
core = ndi.binary_erosion(a > 0.95, iterations=6)
roi = np.zeros_like(core); roi[int(H * .469):int(H * .534), int(W * .224):int(W * .363)] = True
marks = ndi.binary_dilation(roi & (lum > 70), iterations=15) & (a > 0.5)
s2 = row_fill(s, marks, grain_box=(int(W * .190), int(H * .472), int(W * .222), int(H * .530)))
# pivot screw centre (brass) - used to place the shears
brass = (hsv[..., 1] > 90) & (hsv[..., 2] > 70) & (a > 0.9)
lab, n = ndi.label(brass); sizes = ndi.sum(brass, lab, range(1, n + 1))
py, px = ndi.center_of_mass(lab == (np.argmax(sizes) + 1))
rgba = recolour(s2, a, 1, 99.7, 0.66)
rgba, (ox, oy) = crop(rgba)
info["shears"] = {"w": rgba.shape[1], "h": rgba.shape[0], "pivot": [px - ox, py - oy], "marks_px": int(marks.sum())}
cv2.imwrite(os.path.join(WK, "shears_gold.png"), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))

# ---------------------------------------------------------------- clipper
c, a = load("clipper")
a = clean_alpha(a)
Hc, Wc = a.shape
lumc = cv2.cvtColor(c, cv2.COLOR_BGR2GRAY)
core = ndi.binary_erosion(a > 0.95, iterations=8)
# printed text: small dark marks on the light body (black-hat finds thin dark detail)
bh = cv2.morphologyEx(lumc, cv2.MORPH_BLACKHAT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))
boxes = [(.52, .05, .88, .25),   # maker's name + model at the top
         (.47, .70, .68, .90)]   # lettering on the side of the comb guard
roi = np.zeros_like(core)
for x0, y0, x1, y1 in boxes:
    roi[int(Hc * y0):int(Hc * y1), int(Wc * x0):int(Wc * x1)] = True
txt = ndi.binary_dilation(roi & core & (bh > 14), iterations=5) & (a > 0.5)
c2 = paint_out(c, txt, 7, 3)
rgba = recolour(c2, a, 0.5, 99.0, 2.1, clahe=2.2)
rgba, (ox, oy) = crop(rgba)
# principal axis of the clipper (head -> tail)
ys, xs = np.where(rgba[..., 3] > 128)
cx, cy = xs.mean(), ys.mean()
cov = np.cov(np.vstack([xs - cx, ys - cy]))
evals, evecs = np.linalg.eigh(cov)
ax = evecs[:, np.argmax(evals)]
if ax[1] > 0:  # point from head (bottom) to tail (top)
    ax = -ax
info["clipper"] = {"w": rgba.shape[1], "h": rgba.shape[0], "centre": [cx, cy], "axis": ax.tolist(), "text_px": int(txt.sum())}
cv2.imwrite(os.path.join(WK, "clipper_gold.png"), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))

json.dump(info, open(os.path.join(WK, "tools_info.json"), "w"), indent=1)
print(json.dumps(info))
