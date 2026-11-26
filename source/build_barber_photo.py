"""ANAIS Barbershop logo with photographic gold shears and clippers.

Tools: public-domain Wikimedia photos (see README in the output folder), cut out with
BiRefNet, brand marks painted out, recoloured to the logo gold. They are embedded as
PNGs inside the SVG; the lettering stays vector. The A sits in front of the tools and
the round frame, exactly like the sunflower in the Beauty Empire logo.
Usage: python -I build_barber_photo.py <work dir> <out dir> [--no-ring]
"""
import math, os, sys, json, base64
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.varLib import instancer
from PIL import Image

WK, OUT = sys.argv[1], sys.argv[2]
RING = "--no-ring" not in sys.argv
WEB = "--web" in sys.argv
FELIX = r"C:\Windows\Fonts\FELIXTI.TTF"
MONT = r"C:\Users\erick\AppData\Local\Microsoft\Windows\Fonts\Montserrat-VariableFont_wght.ttf"

def glyph_path(font, g, x, y, s):
    gs = font.getGlyphSet(); pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, y))); return pen.getCommands()
def glyph_bounds(font, g):
    gs = font.getGlyphSet(); bp = BoundsPen(gs); gs[g].draw(bp); return bp.bounds
def set_line(font, text, x, base, size, tr=0.0):
    s = size / font["head"].unitsPerEm; cmap, hm = font.getBestCmap(), font["hmtx"]
    px, parts, info = x, [], []
    for i, ch in enumerate(text):
        g = cmap[ord(ch)]; b = glyph_bounds(font, g)
        if ch != " ":
            parts.append(glyph_path(font, g, px, base, s)); info.append((ch, px + b[0] * s, px + b[2] * s, px, s, g))
        px += hm[g][0] * s + (tr if i < len(text) - 1 else 0)
    return " ".join(parts), info[0][1], info[-1][2], info

felix = TTFont(FELIX)
mont = instancer.instantiateVariableFont(TTFont(MONT), {"wght": 420})

BASE, CAP, TRACK = 382, 262, 24
SIZE = CAP / glyph_bounds(felix, "N")[3] * felix["head"].unitsPerEm
_, l0, _, _ = set_line(felix, "ANAÍS", 0, BASE, SIZE, TRACK)
d_word, wl, wr, winfo = set_line(felix, "ANAÍS", 230 - l0, BASE, SIZE, TRACK)
fa = winfo[0]; d_A = glyph_path(felix, fa[5], fa[3], BASE, fa[4]); _s, _px = fa[4], fa[3]
def fu(x, y): return _px + x * _s, BASE - y * _s

TAG_SIZE, TAG_TRACK, TAG_BASE = 44, 34, 478
_, a, b, _ = set_line(mont, "BARBERSHOP", 0, TAG_BASE, TAG_SIZE, TAG_TRACK)
cx_t = (wl + wr) / 2 + 10
d_tag, tl, tr, _ = set_line(mont, "BARBERSHOP", cx_t - (b - a) / 2 - a, TAG_BASE, TAG_SIZE, TAG_TRACK)
rule_y = TAG_BASE - glyph_bounds(mont, "E")[3] * TAG_SIZE / mont["head"].unitsPerEm / 2
RULE_GAP, RULE_L0, RULE_R1 = 34, 292, 1336

SW, GAP = 3.4, 7
LEG = math.degrees(math.atan((684 - 150) / (1495 - 147)))
def leg_x(y):
    yu = (BASE - y) / _s
    return _px + _s * (150 + (684 - 150) * (yu - 147) / (1495 - 147))

# ---------------------------------------------------------------- placement (tunable)
P = json.load(open(os.path.join(WK, "placement.json"))) if os.path.exists(os.path.join(WK, "placement.json")) else {}
CY = P.get("cy", 246)
CX = leg_x(CY) - P.get("d", 118)
R_RING = P.get("ring", 140)
SH_LEN = P.get("shears_len", 372)      # on-page length of the shears
CL_LEN = P.get("clipper_len", 318)     # on-page length of the clipper
CL_ANGLE = P.get("clipper_angle", 40)  # clipper axis, degrees from vertical ("\")
CL_T = P.get("clipper_cross", 0.42)    # where along the clipper (head=0, tail=1) it crosses the shears
SH_DX, SH_DY = P.get("shears_dx", 0), P.get("shears_dy", 0)

info = json.load(open(os.path.join(WK, "tools_info.json")))

def b64(path, max_side):
    im = Image.open(path)
    k = max_side / max(im.size)
    if k < 1:
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    tmp = path.replace(".png", "_embed.png"); im.save(tmp, optimize=True)
    return base64.b64encode(open(tmp, "rb").read()).decode(), im.size

# shears: photo has blades pointing left; rotate so blades point up-right along the A's leg
sh = info["shears"]
sh_data, (sw_, shh) = b64(os.path.join(WK, "shears_gold.png"), 700 if WEB else 1400)
k_sh = SH_LEN / sh["w"]
sh_rot = 90 + LEG  # (-1,0) -> (sin LEG, -cos LEG)
pvx, pvy = sh["pivot"]
sh_tf = (f'translate({CX + SH_DX:.2f} {CY + SH_DY:.2f}) rotate({sh_rot:.2f}) '
         f'scale({k_sh * sh["w"] / sw_:.5f}) translate({-pvx * sw_ / sh["w"]:.2f} {-pvy * sw_ / sh["w"]:.2f})')

# clipper: rotate its head->tail axis to point down-right at CL_ANGLE from vertical
cl = info["clipper"]
cl_data, (cw_, chh) = b64(os.path.join(WK, "clipper_gold.png"), 480 if WEB else 1100)
ax, ay = cl["axis"]                                    # head -> tail, in image pixels
img_ang = math.degrees(math.atan2(ay, ax))
target = math.degrees(math.atan2(math.cos(math.radians(CL_ANGLE)), math.sin(math.radians(CL_ANGLE))))
cl_rot = target - img_ang
# length of the clipper along its axis, in image pixels
import numpy as np
A = np.array(Image.open(os.path.join(WK, "clipper_gold.png")))[..., 3]
ys, xs = np.where(A > 128)
proj = (xs - cl["centre"][0]) * ax + (ys - cl["centre"][1]) * ay
pmin, pmax = proj.min(), proj.max()
k_cl = CL_LEN / (pmax - pmin)
cross_img = (cl["centre"][0] + ax * (pmin + CL_T * (pmax - pmin)), cl["centre"][1] + ay * (pmin + CL_T * (pmax - pmin)))
kk = cl["w"] / cw_
cl_tf = (f'translate({CX:.2f} {CY:.2f}) rotate({cl_rot:.2f}) scale({k_cl * kk:.5f}) '
         f'translate({-cross_img[0] / kk:.2f} {-cross_img[1] / kk:.2f})')

def _inner(y): return 203 + (639 - 203) / (1221 - 121) * (y - 121)
_t, _b = fu(_inner(2600), 2600), fu(_inner(-900), -900)
WEDGE = f"M{_t[0]:.2f} -100L{_b[0]:.2f} {_b[1]:.2f}H3000V-100Z"

PAD = 36
VB = (math.floor(min(CX - 190, RULE_L0) - PAD), math.floor(min(CY - 215, BASE - glyph_bounds(felix, 'Iacute')[3] * _s) - PAD))
VB = VB + (math.ceil(max(wr, RULE_R1) + PAD - VB[0]), math.ceil(max(CY + 210, TAG_BASE) + PAD - VB[1]))

DARK = [("0", "#F6E2A6"), ("0.35", "#D9AE5F"), ("0.62", "#B8863A"), ("0.82", "#E2BC72"), ("1", "#A9772E")]
LIGHT = [("0", "#D8B062"), ("0.35", "#BE8D3E"), ("0.62", "#946525"), ("0.82", "#C49A4E"), ("1", "#7E5520")]

def build(stops=None, flat=None, tag_fill="#F3EDE2", bg=None, icon=False, lockup=False):
    paint = "url(#gold)" if stops else flat
    if icon:
        side = 460; x, y, w, h = round(CX - side / 2), round(CY - side / 2 + 4), side, side
    elif lockup:  # mark + ANAIS only, no tagline (for a site header)
        x = math.floor(CX - 152)
        y = math.floor(min(CY - 182, BASE - glyph_bounds(felix, 'Iacute')[3] * _s) - 6)
        w, h = math.ceil(wr + 8 - x), math.ceil(max(CY + 192, BASE + 6) - y)
    else:
        x, y, w, h = VB
    defs = []
    if stops:
        defs.append(f'<linearGradient id="gold" gradientUnits="userSpaceOnUse" x1="0" y1="90" x2="0" y2="{BASE}">'
                    + "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops) + '</linearGradient>')
    defs.append(f'<image id="clipper-img" width="{cw_}" height="{chh}" href="data:image/png;base64,{cl_data}"/>')
    defs.append(f'<image id="shears-img" width="{sw_}" height="{shh}" href="data:image/png;base64,{sh_data}"/>')
    knock = "" if icon else (f'<path d="{WEDGE}" fill="#000"/>'
                             f'<path d="{d_A}" fill="#000" stroke="#000" stroke-width="{2 * GAP}" stroke-linejoin="round"/>')
    defs.append(f'<mask id="knock" maskUnits="userSpaceOnUse" x="{x}" y="{y}" width="{w}" height="{h}">'
                f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#fff"/>{knock}</mask>')
    # ring is hidden behind the tools (with a small gap) so the photos sit cleanly on it
    defs.append(f'<mask id="ringmask" maskUnits="userSpaceOnUse" x="{x}" y="{y}" width="{w}" height="{h}">'
                f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#fff"/>'
                f'<g filter="url(#grow)"><use href="#clipper-img" transform="{cl_tf}"/><use href="#shears-img" transform="{sh_tf}"/></g></mask>')
    defs.append('<filter id="grow" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">'
                '<feComponentTransfer in="SourceAlpha"><feFuncA type="linear" slope="40"/></feComponentTransfer>'
                '<feMorphology operator="dilate" radius="5"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>')
    defs.append('<filter id="lift" x="-20%" y="-20%" width="140%" height="140%">'
                '<feDropShadow dx="3" dy="5" stdDeviation="5" flood-color="#000" flood-opacity="0.55"/></filter>')
    if flat:  # one-colour versions: tools become solid silhouettes
        defs.append(f'<filter id="flat" color-interpolation-filters="sRGB"><feFlood flood-color="{flat}"/>'
                    '<feComposite in2="SourceAlpha" operator="in"/></filter>')
    tool_filter = ' filter="url(#flat)"' if flat else ""
    gap = ""
    if flat:  # keep the silhouettes apart: cut a gap in the clipper around the shears
        defs.append(f'<mask id="shgap" maskUnits="userSpaceOnUse" x="{x}" y="{y}" width="{w}" height="{h}">'
                    f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#fff"/>'
                    f'<g filter="url(#grow)"><use href="#shears-img" transform="{sh_tf}"/></g></mask>')
        gap = ' mask="url(#shgap)"'
    lift = "" if flat else ' filter="url(#lift)"'
    ring = ""
    if RING:
        ring = (f'<g mask="url(#ringmask)" fill="none" stroke="{paint}">'
                f'<circle cx="{CX:.2f}" cy="{CY:.2f}" r="{R_RING}" stroke-width="{SW * 1.1:.2f}"/>'
                f'<circle cx="{CX:.2f}" cy="{CY:.2f}" r="{R_RING - 7}" stroke-width="{SW * .45:.2f}" stroke-linecap="round" stroke-dasharray="0.1 5.6"/></g>')
    bgr = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    text = "" if icon else f'<path id="wordmark" d="{d_word}" fill="{paint}"/>' if lockup else (f'<path id="wordmark" d="{d_word}" fill="{paint}"/>'
                            f'<g id="tagline"><path d="{d_tag}" fill="{tag_fill}"/>'
                            f'<path d="M{RULE_L0} {rule_y:.2f}H{tl - RULE_GAP:.2f}M{tr + RULE_GAP:.2f} {rule_y:.2f}H{RULE_R1}" '
                            f'stroke="{paint}" stroke-width="2.4" stroke-linecap="round" fill="none"/></g>')
    title = "ANAÍS Barbershop" + (" - shears and clippers mark" if icon else "")
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="{x} {y} {w} {h}" width="{w}" height="{h}">
  <title>{title}</title>
  <defs>{"".join(defs)}</defs>
  {bgr}
  <g id="mark" mask="url(#knock)">
    {ring}
    <g{gap}><use href="#clipper-img" transform="{cl_tf}"{tool_filter}/></g>
    <g{lift}><use href="#shears-img" transform="{sh_tf}"{tool_filter}/></g>
  </g>
  {text}
</svg>
'''

FILES = {
    "anais-barbershop-logo-gold-on-black": build(DARK, bg="#0B0B0B"),
    "anais-barbershop-logo-gold-transparent": build(DARK),
    "anais-barbershop-logo-gold-light-bg": build(LIGHT, tag_fill="#1A1A1A"),
    "anais-barbershop-logo-black": build(flat="#111111", tag_fill="#111111"),
    "anais-barbershop-logo-white": build(flat="#FFFFFF", tag_fill="#FFFFFF"),
    "anais-barbershop-icon-gold-on-black": build(DARK, bg="#0B0B0B", icon=True),
    "anais-barbershop-icon-gold-transparent": build(DARK, icon=True),
    "anais-barbershop-icon-gold-light-bg": build(LIGHT, icon=True),
    "anais-barbershop-icon-black": build(flat="#111111", icon=True),
    "anais-barbershop-icon-white": build(flat="#FFFFFF", icon=True),
}
if WEB:
    FILES = {"anais-barbershop-lockup-gold-dark-bg": build(DARK, lockup=True),
             "anais-barbershop-logo-gold-dark-bg": build(DARK)}
os.makedirs(OUT, exist_ok=True)
for n, svg in FILES.items():
    open(os.path.join(OUT, n + ".svg"), "w", encoding="utf-8").write(svg)
print("VB", VB, "CX", round(CX), "sh_rot", round(sh_rot, 1), "cl_rot", round(cl_rot, 1), "sizes KB",
      round(len(next(iter(FILES.values()))) / 1024))
