"""ANAIS Barbershop logo: crossed shears and clippers in the ANAIS Beauty Empire style.

Same wordmark, gold, line weight and "letter in front of the mark" device as the
sunflower logo. The mark is drawn as white line-art inside an SVG mask and the
gold is painted through it, so the gradient stays upright on rotated tools and
overlaps can be knocked out cleanly. All text is converted to outlines.
"""
import math, os, re, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.varLib import instancer

OUT = sys.argv[1] if len(sys.argv) > 1 else "."
RING = "--no-ring" not in sys.argv
FELIX = r"C:\Windows\Fonts\FELIXTI.TTF"
MONT = r"C:\Users\erick\AppData\Local\Microsoft\Windows\Fonts\Montserrat-VariableFont_wght.ttf"

# ---------------------------------------------------------------- text utils
def glyph_path(font, gname, x, y, scale):
    gs = font.getGlyphSet()
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    gs[gname].draw(TransformPen(pen, (scale, 0, 0, -scale, x, y)))
    return pen.getCommands()

def glyph_bounds(font, gname):
    gs = font.getGlyphSet()
    bp = BoundsPen(gs)
    gs[gname].draw(bp)
    return bp.bounds

def set_line(font, text, x, baseline, size, tracking=0.0):
    s = size / font["head"].unitsPerEm
    cmap, hmtx = font.getBestCmap(), font["hmtx"]
    pen_x, parts, info = x, [], []
    for i, ch in enumerate(text):
        g = cmap[ord(ch)]
        b = glyph_bounds(font, g)
        if ch != " ":
            parts.append(glyph_path(font, g, pen_x, baseline, s))
            info.append((ch, pen_x + b[0] * s, pen_x + b[2] * s, pen_x, s, g))
        pen_x += hmtx[g][0] * s + (tracking if i < len(text) - 1 else 0)
    return " ".join(parts), info[0][1], info[-1][2], info

felix = TTFont(FELIX)
mont = instancer.instantiateVariableFont(TTFont(MONT), {"wght": 420})

# ---------------------------------------------------------------- wordmark (same as the Beauty Empire logo)
BASE, CAP, TRACK = 382, 262, 24
SIZE = CAP / glyph_bounds(felix, "N")[3] * felix["head"].unitsPerEm
word = "ANAÍS"
_, l0, _, _ = set_line(felix, word, 0, BASE, SIZE, TRACK)
d_word, wl, wr, winfo = set_line(felix, word, 230 - l0, BASE, SIZE, TRACK)
firstA = winfo[0]
d_A = glyph_path(felix, firstA[5], firstA[3], BASE, firstA[4])
_s, _px = firstA[4], firstA[3]
def fu(x, y):  # font units of the first A -> page
    return _px + x * _s, BASE - y * _s

# tagline: same face and size; rules keep the same outer ends as the Beauty Empire lockup
TAG_SIZE, TAG_TRACK, TAG_BASE = 44, 34, 478
tag = "BARBERSHOP"
_, a, b, _ = set_line(mont, tag, 0, TAG_BASE, TAG_SIZE, TAG_TRACK)
centre_x = (wl + wr) / 2 + 10
d_tag, tl, tr, _ = set_line(mont, tag, centre_x - (b - a) / 2 - a, TAG_BASE, TAG_SIZE, TAG_TRACK)
tag_cap = glyph_bounds(mont, "E")[3] * TAG_SIZE / mont["head"].unitsPerEm
rule_y = TAG_BASE - tag_cap / 2
RULE_GAP, RULE_L0, RULE_R1 = 34, 292, 1336

# ---------------------------------------------------------------- mark geometry
SW = 3.4          # line weight, same as the sunflower
GAP = 7           # knock-out gap
LEG = math.degrees(math.atan((684 - 150) / (1495 - 147)))  # slant of the A's left leg (~21.6 deg)

def leg_x(y):  # outer edge of the A's left leg at page height y
    yu = (BASE - y) / _s
    return _px + _s * (150 + (684 - 150) * (yu - 147) / (1495 - 147))

CY = 246
CX = leg_x(CY) - 118
SC_ROT = LEG          # shears run parallel to the A's leg
CL_ROT = -40          # clippers cross the other way
R_RING = 140

def band(d, w, extra=""):
    """An outlined band along path d (outer white stroke, inner black stroke)."""
    return (f'<path d="{d}" fill="none" stroke="#fff" stroke-width="{w:.2f}" stroke-linecap="round" stroke-linejoin="round"{extra}/>'
            f'<path d="{d}" fill="none" stroke="#000" stroke-width="{w - 2 * SW:.2f}" stroke-linecap="round" stroke-linejoin="round"{extra}/>')

def shape(d, extra=""):
    """A closed outline that hides what is behind it."""
    return f'<path d="{d}" fill="#000" stroke="#fff" stroke-width="{SW}" stroke-linejoin="round"{extra}/>'

def taper(x0, y0, x1, y1, w):
    """Tapered line, full width at (x0,y0), pointed at (x1,y1) - same motif as the petal veins."""
    L = math.hypot(x1 - x0, y1 - y0); ux, uy = (x1 - x0) / L, (y1 - y0) / L; vx, vy = -uy, ux
    q = lambda t, k: (x0 + ux * L * t + vx * k, y0 + uy * L * t + vy * k)
    f = lambda p: f"{p[0]:.2f} {p[1]:.2f}"
    return (f'<path d="M{f(q(0, w))}Q{f(q(.55, w * .7))} {f(q(1, 0))}Q{f(q(.55, -w * .7))} {f(q(0, -w))}Z" fill="#fff"/>')

# --- shears (local: pivot at 0,0, blades up)
def blade(side):
    s = side
    return (f"M0 16 C{s*13} 16 {s*17} 6 {s*16} -8 L{s*14} -80 "
            f"Q{s*11} -150 0 -196 Z")

def shears():
    out = []
    # back blade (left) with its handle crossing to the right ring
    out.append(f'<g transform="rotate(-5)">{shape(blade(-1))}{taper(-6, -26, -3, -150, 1.6)}</g>')
    out.append(band("M2 8 C4 40 18 58 30 80", 12))
    out.append(band("M42 108 m-24 0 a24 29 0 1 0 48 0 a24 29 0 1 0 -48 0", 12, ' transform="rotate(-14 42 108)"'))
    # front blade (right) with its handle crossing to the left ring + finger tang
    out.append(f'<g transform="rotate(5)">{shape(blade(1))}{taper(6, -26, 3, -150, 1.6)}</g>')
    out.append(band("M-2 8 C-4 40 -18 58 -30 80", 12))
    out.append(band("M-42 108 m-24 0 a24 29 0 1 0 48 0 a24 29 0 1 0 -48 0", 12, ' transform="rotate(14 -42 108)"'))
    out.append(band("M-62 128 Q-80 150 -70 172", 9))
    # pivot screw
    out.append(f'<circle r="9" fill="#000" stroke="#fff" stroke-width="{SW}"/><path d="M-4.2 -4.2L4.2 4.2" stroke="#fff" stroke-width="{SW*0.7:.2f}" stroke-linecap="round"/>')
    return "".join(out)

def shears_silhouette():
    bw = 12 + 2 * GAP
    return (f'<g transform="rotate(-5)"><path d="{blade(-1)}"/></g><g transform="rotate(5)"><path d="{blade(1)}"/></g>'
            f'<path d="M2 8 C4 40 18 58 30 80M-2 8 C-4 40 -18 58 -30 80M-62 128 Q-80 150 -70 172" fill="none" stroke-width="{bw}"/>'
            f'<ellipse cx="42" cy="108" rx="24" ry="29" fill="none" stroke-width="{bw}" transform="rotate(-14 42 108)"/>'
            f'<ellipse cx="-42" cy="108" rx="24" ry="29" fill="none" stroke-width="{bw}" transform="rotate(14 -42 108)"/>'
            '<circle r="9"/>')

# --- clippers (local: crossing point at 0,0, blade head up)
CL_TOP, CL_BOT = -186, 96
def clipper_body():
    return (f"M-34 {CL_TOP+30} L34 {CL_TOP+30} C36 -90 31 0 29 {CL_BOT-30} "
            f"Q29 {CL_BOT} 0 {CL_BOT+2} Q-29 {CL_BOT} -29 {CL_BOT-30} C-31 0 -36 -90 -34 {CL_TOP+30} Z")

def clipper_head():
    teeth, x0, x1 = 11, -37, 37
    w = (x1 - x0) / teeth
    d = f"M{x0} {CL_TOP+30} V{CL_TOP+10}"
    for i in range(teeth):
        xa = x0 + i * w
        d += f" L{xa + w/2:.2f} {CL_TOP} L{xa + w:.2f} {CL_TOP+10}"
    d += f" V{CL_TOP+30} Z"
    return d

def clippers():
    out = []
    # cord first so the body sits over it
    out.append(f'<path d="M0 {CL_BOT+18} C0 {CL_BOT+60} 18 {CL_BOT+80} 14 {CL_BOT+130}" fill="none" stroke="#fff" stroke-width="{SW*1.6:.2f}" stroke-linecap="round"/>')
    out.append(band(f"M0 {CL_BOT} V{CL_BOT+20}", 16))
    out.append(shape(clipper_body()))
    out.append(shape(clipper_head()))
    out.append(f'<path d="M-30 {CL_TOP+20} H30" stroke="#fff" stroke-width="{SW*0.6:.2f}" stroke-linecap="round"/>')
    # housing seam
    out.append(f'<path d="M-33 {CL_TOP+58} Q0 {CL_TOP+68} 33 {CL_TOP+58}" fill="none" stroke="#fff" stroke-width="{SW*0.7:.2f}" stroke-linecap="round"/>')
    # taper lever on the side
    out.append(band(f"M-34 {CL_TOP+48} L-50 {CL_TOP+64}", 8))
    out.append(f'<circle cx="-52" cy="{CL_TOP+66}" r="6" fill="#000" stroke="#fff" stroke-width="{SW}"/>')
    # power switch
    out.append(f'<rect x="-9" y="{CL_TOP+92}" width="18" height="46" rx="9" fill="#000" stroke="#fff" stroke-width="{SW}"/>')
    out.append(f'<circle cx="0" cy="{CL_TOP+106}" r="4" fill="#fff"/>')
    # dotted grip (a nod to the sunflower's seed head)
    for row in range(4):
        y = 36 + row * 11
        cols = [-12, 0, 12] if row % 2 == 0 else [-6, 6]
        for x in cols:
            out.append(f'<circle cx="{x}" cy="{y}" r="2.3" fill="#fff"/>')
    return "".join(out)

def clippers_silhouette():
    return (f'<path d="{clipper_body()}"/><path d="{clipper_head()}"/>'
            f'<path d="M-34 {CL_TOP+48} L-50 {CL_TOP+64}" fill="none" stroke-width="{8 + 2 * GAP}"/>'
            f'<circle cx="-52" cy="{CL_TOP+66}" r="6"/>')

def tf(rot):
    return f'translate({CX:.2f} {CY:.2f}) rotate({rot:.2f})'

# the region right of the inside edge of the A's left leg is hidden
def _inner(y):  # inner edge of the left leg, font units
    return 203 + (639 - 203) / (1221 - 121) * (y - 121)
_t, _b = fu(_inner(2600), 2600), fu(_inner(-900), -900)
WEDGE = f"M{_t[0]:.2f} -100L{_b[0]:.2f} {_b[1]:.2f}H3000V-100Z"

def mark_mask(with_letter=True):
    parts = ['<rect x="-1000" y="-1000" width="4000" height="3000" fill="#000"/>']
    if RING:
        parts.append(f'<circle cx="{CX:.2f}" cy="{CY:.2f}" r="{R_RING}" fill="none" stroke="#fff" stroke-width="{SW*1.1:.2f}"/>')
        parts.append(f'<circle cx="{CX:.2f}" cy="{CY:.2f}" r="{R_RING-7}" fill="none" stroke="#fff" stroke-width="{SW*0.45:.2f}" stroke-linecap="round" stroke-dasharray="0.1 5.6"/>')
    # clippers behind
    parts.append(f'<g transform="{tf(CL_ROT)}" fill="#000" stroke="#000" stroke-width="{2*GAP+SW}" stroke-linejoin="round">{clippers_silhouette()}</g>')
    parts.append(f'<g transform="{tf(CL_ROT)}">{clippers()}</g>')
    # shears in front
    parts.append(f'<g transform="{tf(SC_ROT)}" fill="#000" stroke="#000" stroke-width="{2*GAP+SW}" stroke-linejoin="round">{shears_silhouette()}</g>')
    parts.append(f'<g transform="{tf(SC_ROT)}">{shears()}</g>')
    if with_letter:
        parts.append(f'<path d="{WEDGE}" fill="#000"/>')
        parts.append(f'<path d="{d_A}" fill="#000" stroke="#000" stroke-width="{2*GAP}" stroke-linejoin="round"/>')
    return "".join(parts)

# ---------------------------------------------------------------- output
DARK = [("0", "#F6E2A6"), ("0.35", "#D9AE5F"), ("0.62", "#B8863A"), ("0.82", "#E2BC72"), ("1", "#A9772E")]
LIGHT = [("0", "#D8B062"), ("0.35", "#BE8D3E"), ("0.62", "#946525"), ("0.82", "#C49A4E"), ("1", "#7E5520")]

MARK_TOP, MARK_BOT = CY - 232, CY + 236   # generous; trimmed by viewBox below
PAD = 36
_x0 = min(CX - 175, RULE_L0) - PAD
_x1 = max(wr, RULE_R1) + PAD
_y0 = min(CY - 215, BASE - glyph_bounds(felix, "Iacute")[3] * _s) - PAD
_y1 = max(CY + 205, TAG_BASE) + PAD
VB = (math.floor(_x0), math.floor(_y0), math.ceil(_x1 - _x0), math.ceil(_y1 - _y0))

def grad(stops, y1, y2):
    return (f'<linearGradient id="gold" gradientUnits="userSpaceOnUse" x1="0" y1="{y1:.2f}" x2="0" y2="{y2:.2f}">'
            + "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops) + '</linearGradient>')

def build(stops=None, flat=None, tag_fill="#F3EDE2", bg=None):
    paint = "url(#gold)" if stops else flat
    x, y, w, h = VB
    defs = (grad(stops, 90, BASE) if stops else "") + f'<mask id="mark" maskUnits="userSpaceOnUse" x="{x}" y="{y}" width="{w}" height="{h}">{mark_mask()}</mask>'
    bgr = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    rules = (f'<path d="M{RULE_L0} {rule_y:.2f}H{tl-RULE_GAP:.2f}M{tr+RULE_GAP:.2f} {rule_y:.2f}H{RULE_R1}" '
             f'stroke="{paint}" stroke-width="2.4" stroke-linecap="round" fill="none"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}" width="{w}" height="{h}">
  <title>ANAÍS Barbershop</title>
  <defs>{defs}</defs>
  {bgr}
  <rect id="shears-and-clippers" x="{x}" y="{y}" width="{w}" height="{h}" fill="{paint}" mask="url(#mark)"/>
  <path id="wordmark" d="{d_word}" fill="{paint}"/>
  <g id="tagline"><path d="{d_tag}" fill="{tag_fill}"/>{rules}</g>
</svg>
'''

def build_icon(stops=None, flat=None, bg=None):
    paint = "url(#gold)" if stops else flat
    side = 2 * 228
    x, y = round(CX - side / 2), round(CY - side / 2 + 4)
    defs = (grad(stops, CY - 215, CY + 215) if stops else "") + f'<mask id="mark" maskUnits="userSpaceOnUse" x="{x}" y="{y}" width="{side}" height="{side}">{mark_mask(False)}</mask>'
    bgr = f'<rect x="{x}" y="{y}" width="{side}" height="{side}" fill="{bg}"/>' if bg else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {side} {side}" width="{side}" height="{side}">
  <title>ANAÍS Barbershop - shears and clippers mark</title>
  <defs>{defs}</defs>
  {bgr}
  <rect x="{x}" y="{y}" width="{side}" height="{side}" fill="{paint}" mask="url(#mark)"/>
</svg>
'''

FILES = {
    "anais-barbershop-logo-gold-on-black": build(DARK, bg="#0B0B0B"),
    "anais-barbershop-logo-gold-transparent": build(DARK),
    "anais-barbershop-logo-gold-light-bg": build(LIGHT, tag_fill="#1A1A1A"),
    "anais-barbershop-logo-black": build(flat="#111111", tag_fill="#111111"),
    "anais-barbershop-logo-white": build(flat="#FFFFFF", tag_fill="#FFFFFF"),
    "anais-barbershop-icon-gold-on-black": build_icon(DARK, bg="#0B0B0B"),
    "anais-barbershop-icon-gold-dark-bg": build_icon(DARK),
    "anais-barbershop-icon-gold-light-bg": build_icon(LIGHT),
    "anais-barbershop-icon-black": build_icon(flat="#111111"),
    "anais-barbershop-icon-white": build_icon(flat="#FFFFFF"),
}
os.makedirs(OUT, exist_ok=True)
for name, svg in FILES.items():
    with open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8") as fh:
        fh.write(svg)
print("VB", VB, "CX", round(CX), "tag", round(tl), round(tr))
