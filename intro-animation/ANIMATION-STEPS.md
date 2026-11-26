# ANAÍS opening animation

The opening animation of the ANAÍS Beauty Empire site, saved on its own. Everything it needs is
in this folder. This file explains what it does, how it was made, step by step, and how to change it.

---

## 1. What you see

About 6 seconds in all. A click, a tap or any key skips straight to the ending.

| Time | What happens |
|---|---|
| 0 – 1.6 s | A dark, warm field. Gold flowers grow in from the four corners first, then along the edges, until they frame the screen. |
| the whole time | A breeze sways every stem, and gusts roll diagonally across the frame. Gold pollen drifts on the wind. The whole frame slowly travels clockwise around the screen and **breathes**: it pushes in and eases out every 3.4 s. |
| 0 – 3.7 s | In the centre, a gold sunflower photo fades in. It turns slowly and grows from 82 % to full size. |
| 2.1 – 3.0 s | The photo dissolves into the logo's own sunflower, still turning. |
| 3.7 s | A last strong gust. The frame parts outward and fades, and the dark field dissolves evenly onto the cream page. |
| 3.7 – 4.75 s | The sunflower flies up into the header. It keeps turning and eases to a stop exactly on a petal, so it matches the still logo, and lands with a small spring. |
| ~5.2 s | In the header, the landed sunflower dissolves into the logo's sunflower as **"ANAÍS" writes itself in, left to right**, overlapping the flower: the official logo. The big logo in the centre writes itself in at the same time with a soft glow, and the line under it rises in. |

It plays for everyone, including visitors who have "reduce motion" turned on (by choice: see step 9).

---

## 2. What's in this folder

| File | What it is |
|---|---|
| `index.html` | The page: the intro, the header it lands in, and a simple hero. Open it through a local server (see 3). |
| `intro.css` | The page basics plus all the intro styles (the same as `css/intro.css` on the site). |
| `intro.js` | The animation itself: the flower frame, the wind, the breathing, the sunflower, the exit. |
| `intro-flowers.js` | Generated data: the 30 flower pieces, their sizes and where each stem starts. |
| `assets/flowers-photos/gold/` | The 30 gold flower pieces (WebP), plus `sunflower-hero-rich.webp`, the centre sunflower. |
| `anais-icon-sunflower-gold-dark-bg.svg` | The logo's sunflower for the dark background. The photo dissolves into it. |
| `anais-icon-sunflower-gold-light-bg.svg` | The same sunflower for the cream page. It lands in the header. |
| `anais-lockup-flower-gold-light-bg.svg` | The sunflower cut from the official logo, with its right petals tucked behind the A. |
| `anais-lockup-word-gold-light-bg.svg` | "ANAÍS" cut from the official logo, in the same frame as the sunflower, so the two overlap exactly. |
| `anais-logo-gold-light-bg.svg` | The full logo, used big in the centre. |
| `tools/goldmap.py` | Recolours any transparent photo to a shade of gold. |
| `tools/make_pieces.py` | Cuts the flower photos into pieces, finds each stem, recolours, and writes `intro-flowers.js`. |
| `tools/make_sunflower.py` | Cuts out the sunflower head and turns it gold. |

## 3. How to open it

Browsers block some of this from a double-clicked file, so serve the folder:

```powershell
cd C:\Users\erick\Anas\intro-animation
```
```powershell
python -m http.server 5190
```

Then open http://localhost:5190. **Ver de nuevo · Replay** plays it again.
If an edit doesn't show up, press Ctrl+Shift+R.

To freeze the scene at any moment while you tune it, add `?intro-at=` and a time in milliseconds,
for example http://localhost:5190/?intro-at=2500.

---

## 4. How it was made, step by step

### Step 1. The starting idea
The model was the curtain intro of the Los Toros barbershop site: a full-screen scene that plays
once and then opens onto the page. For ANAÍS the idea became gold flowers swaying in the wind,
with a sunflower in the centre that turns and grows a little.

### Step 2. Flowers all around the edge
The first version had flowers only along the bottom. Following a reference image, they moved to a
**frame around the whole screen**, all in gold, fuller in the corners and lighter toward the middle
of each side. The sunflower and logo used the updated ANAÍS logo files.

### Step 3. Trying drawn flowers, and dropping them
- Flowers drawn in code looked too crude.
- A hand-drawn SVG flower library came next (from SVG Repo, CC BY). The drawings were given opaque
  gold fills in several shades so they would layer instead of showing through each other.
- They still didn't feel right, so SVG flowers were dropped altogether.

### Step 4. Real flower photos, turned gold
This is the version that worked ("This is beautiful").
1. **Find photos.** 21 transparent flower PNGs from Pixabay: stems, open blooms, clusters, and foliage.
   They're free for commercial use with no credit required.
2. **Turn them gold.** `tools/goldmap.py` uses a *gradient map*. Each pixel's brightness picks a
   colour on a five-step gold scale, from almost black to pale cream. The flower keeps all its own
   light, shade and detail, but in gold. Transparency is kept. There are five scales, so the frame
   has natural variety: **rich, champagne, antique, rose, honey**. Each piece gets the next one in turn.
3. **Cut them into pieces.** `tools/make_pieces.py` splits the sheets that hold several flowers into
   single pieces (it finds the separate shapes with `scipy`). It sorts every piece as a *stem*, *head*,
   *cluster* or *leaf*, shrinks it to 560 px at most, and saves it as a small WebP. That gave
   30 pieces, about 1.4 MB.
4. **Find where each stem starts.** For each piece, the opaque point farthest from its centre of
   mass is the base of the stem. The script stores that point, the angle that turns the piece
   upright, and its length. With those, `intro.js` can plant any piece on the screen edge, pointing
   inward, at any size. The script also makes a contact sheet showing every piece upright, with a
   red ring on its stem base, to check them by eye.
5. **Layer them.** The pieces sit in three layers:
   - Back: darkened with a warm filter, so it reads as shadow.
   - Middle: foliage and stems.
   - Front: blooms and clusters, each with a soft drop shadow that lifts it off the ones behind.

   Because the photos are opaque, they layer like a real arrangement.

### Step 5. Composing the frame (`build()` in `intro.js`)
- **Seeded randomness.** It uses a fixed seed, so the arrangement is the same on every visit.
- **Corner bouquets first.** Each corner gets:
  - back foliage;
  - mid stems and leaves fanned across the corner;
  - one or two front clusters;
  - often an open bloom.

  The bottom-right corner is the fullest.
- **Then the edges.** Pieces are spaced along each side, fewer toward the middle of a side and
  more toward the corners.
- **Growing in.** Pieces grow from the corners first, then along the edges toward the middle.
- **Responsive.** The frame's depth scales with the screen: about 23 % of the shorter side, between
  64 and 240 px, and a little less on short screens. When the window is resized or a phone is
  rotated, the frame is rebuilt in the same arrangement, already grown in.

### Step 6. Wind
- **A breeze.** A steady breeze made of three overlapping slow waves.
- **Gusts.** Three gusts at 0.9 s, 2.2 s and 3.6 s. Each travels diagonally across the screen at
  1300 px/s, so you can watch it move through the frame. The last one is the strongest and sets
  up the exit.
- **Springy stems.** Every piece is a damped spring chasing the wind, so it overshoots and settles
  like a real stem.
  - Leaves bend most and heavy blooms least.
  - Pieces on the top edge hang down, so their sway is flipped and the wind still blows one way.
- **Bending from the base.** The bend is part rotation and part skew, so the tip travels further
  than the base. Leaves also flutter faster on top.
- **Steady physics.** The physics runs in fixed steps of 1/120 s, so it looks the same on any screen
  refresh rate. A frame never advances more than about two frames' worth, so a slow phone runs a
  touch slower instead of jumping.
- **Pollen.** Gold specks are carried by the same wind. They're brighter near the frame and faint
  in the open middle.

### Step 7. The frame travels and breathes
- **Travel.** All the flowers ride a loop just outside the screen, clockwise, at 24 px per second.
  At each corner a piece pauses on the corner and swings 90° over a short stretch, so it turns the
  corner smoothly instead of jumping.
- **Breathing.** Every 3.4 s the whole frame eases inward by 7.5 % of its depth and the flowers
  swell by 3.5 %, then it eases back out. Back pieces breathe a little less, which adds depth.

### Step 8. The sunflower
1. **The photo.** A sunflower photo from Pixabay (image 1952014). `tools/make_sunflower.py` cuts
   out the head, feathers its edge into a soft circle, turns it gold on the *rich* scale, and saves
   it at 640 px.
2. **Turning and growing.** In the centre it turns at 38° per second and grows from 82 % to 100 %.
   It opens gently on arrival and has a soft warm glow behind it.
3. **Becoming the logo.** From 2.1 s to 3.0 s the photo dissolves, opening slightly as it goes,
   into the logo's own sunflower, which keeps turning.
4. **The flight.** At 3.7 s it flies to the header logo's sunflower spot, which is measured live in
   case the header moves:
   - It arcs a little sideways and takes a small breath before it goes.
   - It shrinks smoothly to the header size.
   - It crossfades from the dark-background version to the cream-background version.
5. **Stopping on a petal.** The mark has 16 petals, so it looks identical every 22.5°. The spin
   keeps its speed into the flight and then eases (a Hermite curve) to a stop on a whole 22.5°
   step. The landed flower therefore matches the still logo exactly, with no snap.
6. **Landing.** It settles with a small spring.

### Step 9. Making it play for everyone
This computer has Windows "reduce motion" turned on, which first made the intro show only a still
fade. At your request the reduced-motion version was removed, so the full animation always plays.
The centre sunflower was also made to turn visibly.

### Step 10. The exit: dissolve, no circle
An earlier ending opened a growing circle of light in the middle. You didn't like the white circle,
so now the frame parts outward (scaling up and fading) on the last gust. At the same moment the
whole dark field dissolves evenly onto the page, starting 0.12 s later and taking 1.15 s.

### Step 11. The official logo, formed in the header
You wanted the sunflower to land in the header and then "ANAÍS" to appear there too,
*overlapping the sunflower* like the official logo.
1. The official logo was split into two files that share the logo's exact frame:
   - `anais-lockup-flower…svg` holds the sunflower, with its right petals tucked behind the A.
   - `anais-lockup-word…svg` holds "ANAÍS".

   Stacked, they *are* the logo.
2. The header logo is three stacked layers, all in the logo's proportions (1344 × 412):
   - the landing slot (`.brand__icon`), the plain sunflower the intro lands on;
   - the logo's sunflower (`.brand__flower`);
   - the word (`.brand__word`).
3. When the sunflower lands, the landing slot dissolves into the logo's sunflower. This starts
   0.2 s after the landing and takes 0.6 s. Meanwhile the word is revealed left to right by a
   moving soft-edged mask over 1.3 s, as if it were being written, and its A crosses over the
   flower.
4. At the same time, the big logo in the centre of the page writes itself in the same way over
   1.9 s, with a warm glow. The rest of the hero rises in after it.

The header logo is 50 px tall on desktop and 44 px on phones.

### Step 12. Safety nets
- **Skip.** Click, tap or any key jumps to the exit.
- **Start time.** It starts 150 ms after the page loads, and never waits more than 2.5 s for a
  slow font or image.
- **If something goes wrong.**
  - If anything errors, it finishes at once and shows the page.
  - A 9 s timeout ends it no matter what.
  - Even if the script never runs, a CSS rule hides the intro after 12 s.
- **With JavaScript off,** the intro is skipped and the logo shows fully.
- **On the live site,** `?v=` version tags on the CSS and JS links make Chrome load new versions
  instead of cached ones.

---

## 5. How to tune it

All the timing is at the top of `intro.js`.

| Setting | Now | What it changes |
|---|---|---|
| `T.SWAP_AT`, `T.SWAP` | 2100, 900 ms | When the photo starts dissolving into the logo sunflower, and how long that takes |
| `T.EXIT` | 3700 ms | How long the frame holds before the ending |
| `T.FLY` | 1050 ms | How long the flight into the header takes |
| `T.SETTLE` | 420 ms | The landing spring |
| `T.PART` | 1000 ms | How long the frame takes to part outward |
| `T.FADE_DELAY`, `T.FADE` | 120, 1150 ms | When the dark field starts dissolving, and how long that takes |
| `SPIN` | 38 °/s | How fast the sunflower turns |
| `GROW_FROM` | 0.82 | The sunflower's starting size |
| `DRIFT` | 24 px/s | How fast the frame travels around the edge (0 stops it) |
| `BREATH_IN`, `BREATH_SCALE` | 0.075, 0.035 | How deep each breath goes, and how much the flowers swell |
| `BREATH_PERIOD` | 3.4 s | The length of one breath |
| `BACK_SHADE` | brightness .55 | How dark the back layer is |
| `GUSTS` (in the wind section) | 3 gusts | When the gusts come and how strong they are |

The header hand-off and the word reveal are timed in `intro.css`, under "the header becomes the
official logo". The big logo reveal is under `.hero__logo`.

**To change the flowers,** put different transparent PNGs in a folder and list them in `SOURCES`
at the top of `tools/make_pieces.py`, with their kind. Then run:

```powershell
python tools\make_pieces.py <folder of PNGs> . contact-sheet.png
```

It rewrites the gold pieces and `intro-flowers.js`. The tools need Python with
`pillow`, `numpy` and `scipy`.

**To use it on another page,** copy:
- the `.intro` block, the header logo block and the two script tags from `index.html`;
- part 2 of `intro.css`;
- the files listed in section 2.

The intro lands on whatever element carries `data-intro-slot`.

---

## 6. Credits and sources
- **Flower photos and the sunflower:** Pixabay, under the
  [Pixabay Content License](https://pixabay.com/service/license-summary/). Free for commercial use,
  no credit required. The untouched originals and a full list are in the site repo, in
  `assets/flowers-photos/originals/` and `assets/flowers-photos/SOURCES.md`.
- **Logo and sunflower mark:** ANAÍS's own files.
- **Fonts:** Montserrat and Cormorant Garamond, from Google Fonts.
