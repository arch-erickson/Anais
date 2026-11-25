"""Generate a clean vector version of the ANAIS Beauty Empire logo.

All text is converted to outlines so the SVGs need no fonts installed.
"""
import math, os, re, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.varLib import instancer

OUT = sys.argv[1] if len(sys.argv) > 1 else "."
FELIX = r"C:\Windows\Fonts\FELIXTI.TTF"
MONT = r"C:\Users\erick\AppData\Local\Microsoft\Windows\Fonts\Montserrat-VariableFont_wght.ttf"

# ---------------------------------------------------------------- text utils
def glyph_path(font, gname, x, y, scale):
    gs = font.getGlyphSet()
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    tpen = TransformPen(pen, (scale, 0, 0, -scale, x, y))
    gs[gname].draw(tpen)
    return pen.getCommands()

def glyph_bounds(font, gname):
    gs = font.getGlyphSet()
    bp = BoundsPen(gs)
    gs[gname].draw(bp)
    return bp.bounds  # xMin, yMin, xMax, yMax (font units)

def set_line(font, text, x, baseline, size, tracking=0.0, cap=None):
    """Lay out text; returns (path_d, ink_left, ink_right, per-glyph info)."""
    upm = font["head"].unitsPerEm
    s = size / upm
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    pen_x = x
    parts, info = [], []
    for i, ch in enumerate(text):
        g = cmap[ord(ch)]
        adv = hmtx[g][0] * s
        b = glyph_bounds(font, g)
        if ch != " ":
            parts.append(glyph_path(font, g, pen_x, baseline, s))
            info.append((ch, pen_x + b[0] * s, pen_x + b[2] * s, pen_x, s, g))
        pen_x += adv + (tracking if i < len(text) - 1 else 0)
    ink_l = info[0][1]
    ink_r = info[-1][2]
    return " ".join(parts), ink_l, ink_r, info

def text_width(font, text, size, tracking):
    _, l, r, _ = set_line(font, text, 0, 0, size, tracking)
    return r - l

felix = TTFont(FELIX)
mont = instancer.instantiateVariableFont(TTFont(MONT), {"wght": 420})

# ---------------------------------------------------------------- layout
W, H = 1600, 600
BASE = 382            # wordmark baseline
CAP = 262             # wordmark cap height target
cap_units = glyph_bounds(felix, "N")[3]
SIZE = CAP / cap_units * felix["head"].unitsPerEm
TRACK = 24

word = "ANAÍS"
ww = text_width(felix, word, SIZE, TRACK)
WORD_X0 = 230         # ink-left of the first A
d_word0, l0, r0, _ = set_line(felix, word, 0, BASE, SIZE, TRACK)
shift = WORD_X0 - l0
d_word, wl, wr, winfo = set_line(felix, word, shift, BASE, SIZE, TRACK)

# split first "A" from rest so the flower can interact with it
firstA = winfo[0]
d_A = glyph_path(felix, firstA[5], firstA[3], BASE, firstA[4])
rest = []
for ch, il, ir, px, s, g in winfo[1:]:
    rest.append(glyph_path(felix, g, px, BASE, s))
d_rest = " ".join(rest)

# tagline
TAG_SIZE = 44
TAG_TRACK = 26
TAG_BASE = 478
tag = "BEAUTY EMPIRE"
tw = text_width(mont, tag, TAG_SIZE, TAG_TRACK)
centre_x = (wl + wr) / 2 + 10
tag_x0 = centre_x - tw / 2
d_tag0, tl0, tr0, _ = set_line(mont, tag, 0, TAG_BASE, TAG_SIZE, TAG_TRACK)
d_tag, tl, tr, _ = set_line(mont, tag, tag_x0 - tl0, TAG_BASE, TAG_SIZE, TAG_TRACK)
tag_cap = glyph_bounds(mont, "E")[3] * TAG_SIZE / mont["head"].unitsPerEm
rule_y = TAG_BASE - tag_cap / 2
RULE_GAP, RULE_LEN = 34, 150

# ---------------------------------------------------------------- sunflower
F = 0.93
_s = firstA[4]; _px = firstA[3]
CY = 236
_yu = (BASE - CY) / _s
_leg_x = _px + _s * (150 + (684 - 150) * (_yu - 147) / (1495 - 147))
R_DISC = 80 * F
CX = _leg_x - R_DISC + 16
R_PETAL_IN, R_PETAL_OUT = 84 * F, 204 * F
N_PETALS = 16

def pt(r, a):
    return CX + r * math.cos(a), CY + r * math.sin(a)

def petal(a, r_in, r_out, half_w):
    """Pointed almond petal along angle a (cubic beziers, both ends pointed)."""
    L = r_out - r_in
    ux, uy = math.cos(a), math.sin(a)
    vx, vy = -uy, ux
    bx, by = CX + r_in * ux, CY + r_in * uy
    tx, ty = CX + r_out * ux, CY + r_out * uy
    def p(t, w):
        return (bx + ux * L * t + vx * w, by + uy * L * t + vy * w)
    k = half_w * 1.33
    c1 = p(0.18, k); c2 = p(0.62, k)
    c3 = p(0.62, -k); c4 = p(0.18, -k)
    f = lambda q: f"{q[0]:.2f} {q[1]:.2f}"
    return (f"M{bx:.2f} {by:.2f} C{f(c1)} {f(c2)} {tx:.2f} {ty:.2f} "
            f"C{f(c3)} {f(c4)} {bx:.2f} {by:.2f}Z")

a0 = -math.pi / 2
# petals that would sit behind the A are left out, so the letter reads as rising out of the flower
FRONT_SKIP, BACK_SKIP = 50, 62   # degrees either side of "east"
def _deg(a):
    return (math.degrees(a) + 180) % 360 - 180
front_angles = [a0 + i * 2 * math.pi / N_PETALS for i in range(N_PETALS)]
front_angles = [a for a in front_angles if abs(_deg(a)) > FRONT_SKIP]
back_angles = [a0 + (i + 0.5) * 2 * math.pi / N_PETALS for i in range(N_PETALS)]
back_angles = [a for a in back_angles if abs(_deg(a)) > BACK_SKIP]
front = [petal(a, R_PETAL_IN, R_PETAL_OUT, 25 * F) for a in front_angles]
# a back row of petals peeking out between the front ones
back = [petal(a, R_PETAL_IN + 4 * F, R_PETAL_OUT - 14 * F, 21 * F) for a in back_angles]
# centre vein on each front petal: grows out of the petal's inner tip and tapers to a point
VEIN_LEN = 0.38      # fraction of petal length
VEIN_BASE = 1.7      # half-width at the base
def vein(a):
    L = VEIN_LEN * (R_PETAL_OUT - R_PETAL_IN)
    ux, uy = math.cos(a), math.sin(a)
    vx, vy = -uy, ux
    bx, by = CX + R_PETAL_IN * ux, CY + R_PETAL_IN * uy
    q = lambda t, w: (bx + ux * L * t + vx * w, by + uy * L * t + vy * w)
    f = lambda p: f"{p[0]:.2f} {p[1]:.2f}"
    l0, r0 = q(0, VEIN_BASE), q(0, -VEIN_BASE)
    cl, cr = q(0.55, VEIN_BASE * 0.7), q(0.55, -VEIN_BASE * 0.7)
    tip = q(1, 0)
    return f"M{f(l0)}Q{f(cl)} {f(tip)}Q{f(cr)} {f(r0)}Z"
veins = [vein(a) for a in front_angles]

# phyllotaxis seed head
GOLDEN = math.pi * (3 - math.sqrt(5))
seeds = []
c = 3.55 * F
i = 1
while True:
    r = c * math.sqrt(i + 1.5)
    if r > R_DISC - 9 * F:
        break
    a = i * GOLDEN
    x, y = CX + r * math.cos(a), CY + r * math.sin(a)
    rad = 1.05 + 1.05 * (r / R_DISC)
    seeds.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{rad:.2f}"/>')
    i += 1

# ---------------------------------------------------------------- A geometry
# Left leg of the A: find the outer-left edge line from the glyph's bounding box.
A_l, A_r = firstA[1], firstA[2]
def _fu(x, y):
    return _px + x * _s, BASE - y * _s
def _on_inner(y):
    return 203 + (639 - 203) / (1221 - 121) * (y - 121)
_t = _fu(_on_inner(2600), 2600); _b = _fu(_on_inner(-900), -900)
# the seed disc is trimmed along the inside of the A's left leg
CLIP = f"M-50 -50H{_t[0]:.2f}V{_t[1]:.2f}L{_b[0]:.2f} {_b[1]:.2f}V{H+50}H-50Z"

GAP = 7  # knock-out gap where the A crosses the flower

def build(variant):
    v = VARIANTS[variant]
    gold = "url(#gold)" if v["gradient"] else v["gold"]
    tag_fill = v["tag"]
    bg = f'<rect x="{VIEWBOX[0]}" y="{VIEWBOX[1]}" width="{VIEWBOX[2]}" height="{VIEWBOX[3]}" fill="{v["bg"]}"/>' if v.get("bg") else ""
    defs = []
    if v["gradient"]:
        defs.append(f'''<linearGradient id="gold" gradientUnits="userSpaceOnUse" x1="0" y1="90" x2="0" y2="{BASE}">
      {"".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in v["stops"])}
    </linearGradient>''')
    defs.append(f'<clipPath id="wedge"><path d="{CLIP}"/></clipPath>')
    defs.append(f'''<mask id="knock" maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}">
      <rect width="{W}" height="{H}" fill="#fff"/>
      <path d="{d_A}" fill="#000" stroke="#000" stroke-width="{GAP*2}" stroke-linejoin="round"/>
    </mask>
    <mask id="backmask" maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}">
      <rect width="{W}" height="{H}" fill="#fff"/>
      <path d="{" ".join(front)}" fill="#000" stroke="#000" stroke-width="{v['sw']*2.2:.2f}"/>
      <circle cx="{CX}" cy="{CY}" r="{R_PETAL_IN + 18 * F:.2f}" fill="#000"/>
    </mask>''')
    sw = v["sw"]
    flower = f'''<g id="sunflower" mask="url(#knock)">
    <g id="petals" fill="none" stroke="{gold}" stroke-linejoin="round" stroke-linecap="round">
      <path d="{" ".join(back)}" stroke-width="{sw*0.8:.2f}" mask="url(#backmask)"/>
      <path d="{" ".join(front)}" stroke-width="{sw}"/>
      <path d="{" ".join(veins)}" fill="{gold}" stroke="none"/>
    </g>
    <g id="seed-head" clip-path="url(#wedge)">
    <g fill="none" stroke="{gold}">
      <circle cx="{CX}" cy="{CY}" r="{R_DISC}" stroke-width="{sw*1.1:.2f}"/>
      <circle cx="{CX}" cy="{CY}" r="{R_DISC-5.5}" stroke-width="{sw*0.4:.2f}" stroke-dasharray="0.1 5.2"/>
    </g>
    <g fill="{gold}">
      <circle cx="{CX}" cy="{CY}" r="4.2"/>
      {"".join(seeds)}
    </g>
    </g>
  </g>'''
    rules = (f'<path d="M{tl-RULE_GAP-RULE_LEN:.2f} {rule_y:.2f}H{tl-RULE_GAP:.2f}'
             f'M{tr+RULE_GAP:.2f} {rule_y:.2f}H{tr+RULE_GAP+RULE_LEN:.2f}" '
             f'stroke="{gold}" stroke-width="2.4" stroke-linecap="round" fill="none"/>')
    vb = VIEWBOX
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]:.0f} {vb[1]:.0f} {vb[2]:.0f} {vb[3]:.0f}" width="{vb[2]:.0f}" height="{vb[3]:.0f}">
  <title>ANAÍS Beauty Empire</title>
  <defs>
    {"".join(defs)}
  </defs>
  {bg}
  {flower}
  <g id="wordmark" fill="{gold}">
    <path d="{d_A}"/>
    <path d="{d_rest}"/>
  </g>
  <g id="tagline">
    <path d="{d_tag}" fill="{tag_fill}"/>
    {rules}
  </g>
</svg>
'''

PAD = 36
_x0 = min(CX - R_PETAL_OUT, tl - RULE_GAP - RULE_LEN) - PAD
_x1 = max(wr, tr + RULE_GAP + RULE_LEN) + PAD
_y0 = min(CY - R_PETAL_OUT, BASE - glyph_bounds(felix, 'Iacute')[3] * SIZE / felix['head'].unitsPerEm) - PAD
_y1 = max(CY + R_PETAL_OUT, TAG_BASE) + PAD
VIEWBOX = (math.floor(_x0), math.floor(_y0), math.ceil(_x1 - _x0), math.ceil(_y1 - _y0))

DARK = [("0","#F6E2A6"),("0.35","#D9AE5F"),("0.62","#B8863A"),("0.82","#E2BC72"),("1","#A9772E")]
LIGHT = [("0","#D8B062"),("0.35","#BE8D3E"),("0.62","#946525"),("0.82","#C49A4E"),("1","#7E5520")]

VARIANTS = {
    "anais-logo-gold-on-black": dict(stops=DARK, gradient=True, tag="#F3EDE2", bg="#0B0B0B", sw=3.4),
    "anais-logo-gold-transparent": dict(stops=DARK, gradient=True, tag="#F3EDE2", sw=3.4),
    "anais-logo-gold-light-bg": dict(stops=LIGHT, gradient=True, tag="#1A1A1A", sw=3.4),
    "anais-logo-black": dict(gradient=False, gold="#111111", tag="#111111", sw=3.4),
    "anais-logo-white": dict(gradient=False, gold="#FFFFFF", tag="#FFFFFF", sw=3.4),
}

os.makedirs(OUT, exist_ok=True)
for name in VARIANTS:
    with open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8") as fh:
        fh.write(build(name))
def build_icon(stops, bg=None):
    allf = [a0 + i * 2 * math.pi / N_PETALS for i in range(N_PETALS)]
    allb = [a0 + (i + 0.5) * 2 * math.pi / N_PETALS for i in range(N_PETALS)]
    fr = [petal(a, R_PETAL_IN, R_PETAL_OUT, 25 * F) for a in allf]
    bk = [petal(a, R_PETAL_IN + 4 * F, R_PETAL_OUT - 14 * F, 21 * F) for a in allb]
    vn = [vein(a) for a in allf]
    sw = 3.4
    pad = 16
    side = math.ceil(2 * (R_PETAL_OUT + pad)); x0, y0 = round(CX - side / 2), round(CY - side / 2)
    rect = f'<rect x="{x0:.2f}" y="{y0:.2f}" width="{side:.2f}" height="{side:.2f}" fill="{bg}"/>' if bg else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {side} {side}" width="{side:.0f}" height="{side:.0f}">
  <title>ANAÍS Beauty Empire – sunflower mark</title>
  <defs>
    <linearGradient id="gold" gradientUnits="userSpaceOnUse" x1="0" y1="{CY - R_PETAL_OUT:.2f}" x2="0" y2="{CY + R_PETAL_OUT:.2f}">
      {"".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)}
    </linearGradient>
    <mask id="backmask" maskUnits="userSpaceOnUse" x="{x0:.2f}" y="{y0:.2f}" width="{side:.2f}" height="{side:.2f}">
      <rect x="{x0:.2f}" y="{y0:.2f}" width="{side:.2f}" height="{side:.2f}" fill="#fff"/>
      <path d="{" ".join(fr)}" fill="#000" stroke="#000" stroke-width="{sw*2.2:.2f}"/>
      <circle cx="{CX}" cy="{CY}" r="{R_PETAL_IN + 18 * F:.2f}" fill="#000"/>
    </mask>
  </defs>
  {rect}
  <g fill="none" stroke="url(#gold)" stroke-linejoin="round" stroke-linecap="round">
    <path d="{" ".join(bk)}" stroke-width="{sw*0.8:.2f}" mask="url(#backmask)"/>
    <path d="{" ".join(fr)}" stroke-width="{sw}"/>
    <path d="{" ".join(vn)}" fill="url(#gold)" stroke="none"/>
    <circle cx="{CX}" cy="{CY}" r="{R_DISC}" stroke-width="{sw*1.1:.2f}"/>
    <circle cx="{CX}" cy="{CY}" r="{R_DISC-5.5}" stroke-width="{sw*0.4:.2f}" stroke-dasharray="0.1 5.2"/>
  </g>
  <g fill="url(#gold)">
    <circle cx="{CX}" cy="{CY}" r="4.2"/>
    {"".join(seeds)}
  </g>
</svg>
'''

with open(os.path.join(OUT, "anais-icon-sunflower-gold.svg"), "w", encoding="utf-8") as fh:
    fh.write(build_icon(DARK))
with open(os.path.join(OUT, "anais-icon-sunflower-gold-light-bg.svg"), "w", encoding="utf-8") as fh:
    fh.write(build_icon(LIGHT))
# one-colour and on-black sunflower marks
_icon = build_icon(DARK)
for _name, _col in [("anais-icon-sunflower-black", "#111111"), ("anais-icon-sunflower-white", "#FFFFFF")]:
    with open(os.path.join(OUT, _name + ".svg"), "w", encoding="utf-8") as fh:
        fh.write(re.sub(r"\s*<linearGradient.*?</linearGradient>", "", _icon, flags=re.S).replace("url(#gold)", _col))
_vb = re.search(r'viewBox="(\S+) (\S+) (\S+) (\S+)"', _icon).groups()
with open(os.path.join(OUT, "anais-icon-sunflower-gold-on-black.svg"), "w", encoding="utf-8") as fh:
    fh.write(_icon.replace("<defs>", f'<rect x="{_vb[0]}" y="{_vb[1]}" width="{_vb[2]}" height="{_vb[3]}" fill="#0B0B0B"/>\n  <defs>', 1))
print("word ink", round(wl), round(wr), "tag", round(tl), round(tr), "A", round(A_l), round(A_r))
