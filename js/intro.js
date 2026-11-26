/* ANAÍS — entrance animation
   A frame of gold-toned flower photos grows in from every edge of a dark field and
   sways as gusts of wind roll through it. The sunflower in the centre turns slowly and grows a
   little. Then a last gust parts the frame outward, the dark background dissolves onto the page, and the
   sunflower glides up into the header.

   The flowers are gold-toned photos listed in js/intro-flowers.js (see assets/flowers-photos/SOURCES.md).
   The frame is rebuilt to fit whenever the window is resized or a phone is rotated.

   Tweak the timing in T below. Add ?intro-at=2000 to the URL to freeze the scene at 2000 ms. */
(() => {
  'use strict';

  const body = document.body;
  const intro = document.querySelector('.intro');
  if (!intro) return;
  const veil = intro.querySelector('.intro__veil');
  const svg = intro.querySelector('.intro__meadow');
  const bloom = intro.querySelector('.intro__bloom');
  const bloomLight = intro.querySelector('.intro__bloom-light');
  const bloomDark = intro.querySelector('.intro__bloom-dark');
  const bloomPhoto = intro.querySelector('.intro__bloom-photo');
  const slot = document.querySelector('[data-intro-slot]');
  const NS = 'http://www.w3.org/2000/svg';
  const LIB = (window.ANAIS_FLOWERS && window.ANAIS_FLOWERS.items) || [];

  /* ---------- timing (ms) ---------- */
  const T = {
    SWAP_AT: 2100,    // the gold sunflower photo starts fading into the logo's sunflower
    SWAP: 900,        // ...over this long
    EXIT: 3700,       // the frame holds until here, then the scene clears
    FLY: 1050,        // sunflower flight into the header
    SETTLE: 420,      // soft landing (then the ANAÍS logo writes itself in: see css/intro.css)
    PART: 1000,       // the flower frame parts outward
    FADE_DELAY: 120,  // the dark background starts dissolving this long after EXIT
    FADE: 1150,       // ...and takes this long to disappear
  };
  const SPIN = 38;            // sunflower turn speed, degrees per second
  const SYM = 22.5;           // the mark has 16 petals, so it looks the same every 22.5°
  const GROW_FROM = 0.82;     // sunflower starts at 82% size and grows to 100%

  /* ---------- frame motion ---------- */
  const DRIFT = 24;           // px per second the flowers travel clockwise around the screen edge
  const BREATH_IN = .075;     // how far the frame breathes in, as a share of its depth
  const BREATH_SCALE = .035;  // the flowers swell this much at the top of each breath
  const BREATH_PERIOD = 3.4;  // seconds per breath

  /* ---------- depth: each photo is already its own shade of gold; back pieces sit in shadow ---------- */
  const BACK_SHADE = 'brightness(.55) sepia(.35) saturate(1.25)';   // darker but still warm gold
  const FRONT_SHADOW = 'drop-shadow(0 6px 12px rgba(0,0,0,.65))';     // lifts each piece off the ones behind it

  const freezeAt = (() => { const m = /[?&]intro-at=(\d+)/.exec(location.search); return m ? +m[1] : null; })();

  /* ---------- helpers ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInCubic = (t) => t * t * t;
  const easeInOutCubic = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  const easeOutSine = (t) => Math.sin(t * Math.PI / 2);
  const f2 = (v) => (Math.abs(v) < 1e-4 ? 0 : v).toFixed(2);
  const spring = (k, zeta, w) => Math.exp(-zeta * w * k) * Math.cos(w * Math.sqrt(1 - zeta * zeta) * k);
  const DEG = 180 / Math.PI;

  // seeded random, so the frame is composed the same way every visit (and on every resize)
  let seed = 0;
  const reseed = () => { seed = 20261125; };
  const rnd = () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const R = (a, b) => a + (b - a) * rnd();
  const pickFrom = (arr) => arr[Math.floor(rnd() * arr.length)];
  const el = (tag, parent, attrs = {}) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  };

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    body.classList.add('is-revealing', 'is-done');
    body.classList.remove('intro-on');
    removeEventListener('resize', onResize);
  };

  // The full animation plays for everyone, including visitors who have system animations turned off.

  /* ---------- the flower photos ---------- */
  // Gold-toned transparent photos (see assets/flowers-photos). Each knows where its stem starts
  // (ax, ay), how far to turn it so it grows straight up from there (ang), and its length (reach).
  const BY_KIND = { stem: [], head: [], cluster: [], leaf: [] };
  for (const it of LIB) (BY_KIND[it.kind] || BY_KIND.leaf).push(it);
  const pickKind = (kind) => {
    for (const k of [kind, 'stem', 'leaf', 'cluster', 'head']) if (BY_KIND[k] && BY_KIND[k].length) return pickFrom(BY_KIND[k]);
    return null;
  };

  // the photos get their own layer under the pollen, inside the veil so they dissolve with it
  const frameEl = document.createElement('div');
  frameEl.className = 'intro__frame';
  veil.insertBefore(frameEl, svg);
  const layerBack = frameEl.appendChild(document.createElement('div'));
  const layerMid = frameEl.appendChild(document.createElement('div'));
  const layerFront = frameEl.appendChild(document.createElement('div'));
  const frameG = el('g', svg);                       // the pollen, which also parts away at the end
  const layerMotes = el('g', frameG);

  /* ---------- composing the frame (rebuilt on resize) ---------- */
  let W, H, M, BAND, plants = [], motes = [];
  const sweep = (x, y) => x + y * .45;               // gusts roll diagonally across the screen
  // plants on the top edge hang down, so their sway flips to keep the wind going one way
  const windSign = (dir) => { const c = Math.cos(dir); return c >= 0 ? Math.max(c, .6) : Math.min(c, -.6); };
  const FLEX = { leaf: 1.2, stem: 1, cluster: .6, head: .45 };

  /* the path the frame travels: a loop just outside the screen, run clockwise. Along each edge a
     flower keeps facing inward; at each corner it pauses on the corner and turns 90° over a short
     stretch, so pieces swing around the corner instead of jumping. */
  let PATH = [], PATH_LEN = 0;
  const makePath = () => {
    const m = 10, x0 = -m, y0 = -m, x1 = W + m, y1 = H + m, turn = BAND * .8;
    const P = Math.PI;
    PATH = [
      { len: x1 - x0, ax: x0, ay: y0, bx: x1, by: y0, d0: P, d1: P },                 // top, left to right
      { len: turn, ax: x1, ay: y0, bx: x1, by: y0, d0: P, d1: 1.5 * P },              // top-right corner
      { len: y1 - y0, ax: x1, ay: y0, bx: x1, by: y1, d0: 1.5 * P, d1: 1.5 * P },     // right, downward
      { len: turn, ax: x1, ay: y1, bx: x1, by: y1, d0: 1.5 * P, d1: 2 * P },          // bottom-right corner
      { len: x1 - x0, ax: x1, ay: y1, bx: x0, by: y1, d0: 2 * P, d1: 2 * P },         // bottom, right to left
      { len: turn, ax: x0, ay: y1, bx: x0, by: y1, d0: 2 * P, d1: 2.5 * P },          // bottom-left corner
      { len: y1 - y0, ax: x0, ay: y1, bx: x0, by: y0, d0: 2.5 * P, d1: 2.5 * P },     // left, upward
      { len: turn, ax: x0, ay: y0, bx: x0, by: y0, d0: 2.5 * P, d1: 3 * P },          // top-left corner
    ];
    let at = 0;
    for (const seg of PATH) { seg.at = at; at += seg.len; }
    PATH_LEN = at;
  };
  // position on the loop -> point and inward-facing direction (radians, clockwise from up)
  const pathAt = (s) => {
    s = ((s % PATH_LEN) + PATH_LEN) % PATH_LEN;
    for (const seg of PATH) {
      if (s <= seg.at + seg.len) {
        const u = seg.len ? (s - seg.at) / seg.len : 0;
        const k = easeInOutSine(u);
        return { x: lerp(seg.ax, seg.bx, u), y: lerp(seg.ay, seg.by, u), dir: lerp(seg.d0, seg.d1, k) };
      }
    }
    return { x: 0, y: 0, dir: 0 };
  };
  // a root on the screen edge -> its position on the loop (roots are always placed on an edge)
  const pathPos = (bx, by) => {
    const dTop = Math.abs(by + 10), dBottom = Math.abs(by - H - 10), dLeft = Math.abs(bx + 10), dRight = Math.abs(bx - W - 10);
    const best = Math.min(dTop, dBottom, dLeft, dRight);
    if (best === dTop) return PATH[0].at + clamp(bx + 10, 0, PATH[0].len);
    if (best === dRight) return PATH[2].at + clamp(by + 10, 0, PATH[2].len);
    if (best === dBottom) return PATH[4].at + clamp(W + 10 - bx, 0, PATH[4].len);
    return PATH[6].at + clamp(H + 10 - by, 0, PATH[6].len);
  };
  const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  const addPiece = (layer, kind, bx, by, dir, len, back, delay) => {
    const it = pickKind(kind);
    if (!it) return;
    const img = document.createElement('img');
    img.src = it.src; img.alt = ''; img.decoding = 'async';
    img.width = it.w; img.height = it.h;
    img.style.filter = back ? BACK_SHADE : FRONT_SHADOW;
    layer.appendChild(img);
    const rel = len / BAND;
    const s0 = pathPos(bx, by);
    plants.push({
      img, it, s0, off: wrapAngle(dir - pathAt(s0).dir), breath: back ? .7 : 1,
      scale: len / it.reach, flip: rnd() < .5 ? -1 : 1, delay,
      gx: sweep(bx, by), sign: windSign(dir), kind: it.kind,
      th: R(-.03, .03), om: 0, k: R(20, 34) / (.5 + .5 * rel), flex: (.35 + .4 * rel) * (FLEX[it.kind] || 1),
      ph: R(0, 6.28), lean: R(-.06, .06),
    });
  };

  const build = (now) => {
    reseed();
    W = innerWidth; H = innerHeight; M = Math.min(W, H);
    BAND = clamp(M * (H < 520 ? .2 : .23), 64, 240); // how far the frame reaches in (a touch less on short screens)
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    for (const g of [layerBack, layerMid, layerFront, layerMotes]) g.replaceChildren();
    plants = []; motes = [];
    makePath();

    // pieces sprout from the corners first, then along the edges toward the middle
    const delayAt = (bx, by) => {
      if (now > 0) return now - 2000;                // rebuilt mid-intro: already grown
      const dc = Math.min(Math.hypot(bx, by), Math.hypot(W - bx, by), Math.hypot(bx, H - by), Math.hypot(W - bx, H - by));
      return 60 + dc / Math.hypot(W, H) * 1300 + R(0, 240);
    };

    // 1) corner bouquets: a cluster or two, stems and foliage fanning around them
    const CORNERS = [
      { x: 0, y: H, from: 0, to: Math.PI / 2, weight: 1.15 },          // bottom-left
      { x: W, y: H, from: -Math.PI / 2, to: 0, weight: 1.3 },          // bottom-right (fullest, like the reference)
      { x: 0, y: 0, from: Math.PI / 2, to: Math.PI, weight: 1.2 },     // top-left
      { x: W, y: 0, from: -Math.PI, to: -Math.PI / 2, weight: 1 },     // top-right
    ];
    for (const c of CORNERS) {
      const inX = c.x ? -1 : 1, inY = c.y ? -1 : 1;
      const root = (spread) => {                     // just off-screen, spread along one of the two edges
        const off = R(0, BAND * spread);
        return rnd() < .5 ? [c.x + inX * off, c.y - inY * 10] : [c.x - inX * 10, c.y + inY * off];
      };
      const fan = (i, n) => lerp(c.from, c.to, (i + R(.2, .8)) / n);
      const n = Math.max(1, Math.round(c.weight * (M > 600 ? 2 : 1.5)));
      for (let i = 0; i < 2; i++) { const [bx, by] = root(.9); addPiece(layerBack, rnd() < .5 ? 'leaf' : 'stem', bx, by, fan(i, 2), BAND * R(1.2, 1.6), true, delayAt(bx, by) + 80); }
      for (let i = 0; i < n + 1; i++) { const [bx, by] = root(.8); addPiece(layerMid, rnd() < .55 ? 'leaf' : 'stem', bx, by, fan(i, n + 1), BAND * R(.95, 1.35), false, delayAt(bx, by) + 60); }
      for (let i = 0; i < n; i++) { const [bx, by] = root(.45); addPiece(layerFront, 'cluster', bx, by, fan(i, n), BAND * R(.95, 1.25), false, delayAt(bx, by)); }
      if (rnd() < .7) { const [bx, by] = root(.3); addPiece(layerFront, 'head', bx, by, lerp(c.from, c.to, .5) + R(-.3, .3), BAND * R(.55, .75), false, delayAt(bx, by) + 40); }
    }

    // 2) along each edge: lighter toward the middle of each side, fuller toward the corners
    const EDGES = [
      { len: W, at: (u) => [u * W, H + 10], dir: 0 },
      { len: W, at: (u) => [u * W, -10], dir: Math.PI },
      { len: H, at: (u) => [-10, u * H], dir: Math.PI / 2 },
      { len: H, at: (u) => [W + 10, u * H], dir: -Math.PI / 2 },
    ];
    for (const e of EDGES) {
      const step = BAND * .38;
      for (let d = BAND * .9; d < e.len - BAND * .9; d += step * R(.75, 1.25)) {   // the corners are already covered
        const u = d / e.len;
        const nearCorner = Math.max(Math.exp(-u / .15), Math.exp(-(1 - u) / .15));
        if (rnd() > .78 + .2 * nearCorner) continue;
        const [bx, by] = e.at(u);
        const dir = e.dir + R(-.5, .5);
        const size = .8 + .35 * nearCorner;
        const r = rnd();
        if (r < .2) addPiece(layerBack, 'leaf', bx, by, dir, BAND * R(.8, 1.1) * size, true, delayAt(bx, by) + 60);
        else if (r < .55) addPiece(layerMid, 'leaf', bx, by, dir, BAND * R(.6, .95) * size, false, delayAt(bx, by) + 30);
        else if (r < .8) addPiece(layerMid, 'stem', bx, by, dir, BAND * R(.7, 1.05) * size, false, delayAt(bx, by) + 90);
        else if (r < .92) addPiece(layerFront, 'head', bx, by, dir, BAND * R(.4, .55) * size, false, delayAt(bx, by));
        else addPiece(layerFront, 'cluster', bx, by, dir, BAND * R(.6, .8) * size, false, delayAt(bx, by));
      }
    }

    // drifting pollen, so the wind can be seen
    for (let i = 0; i < Math.round((W + H) / 55); i++) {
      motes.push({ x: R(0, W), y: R(0, H), r: R(.7, 1.9), ph: R(0, 6.28), op: R(.25, .7), n: el('circle', layerMotes, { class: 'mote' }) });
    }
    r0 = null;                                       // re-measure the sunflower's box
  };

  /* ---------- wind ---------- */
  // a steady breeze plus gusts that travel diagonally across the screen
  const GUSTS = [{ t: .9, a: .1 }, { t: 2.2, a: .16 }, { t: T.EXIT / 1000 - .1, a: .3 }];
  const GUST_SPEED = 1300;                           // px per second
  const wind = (gx, s) => {
    let w = .035 + .045 * Math.sin(s * 1.25 - gx * .0042) + .028 * Math.sin(s * 2.6 - gx * .011 + 1.7) + .014 * Math.sin(s * 5.3 - gx * .027 + .4);
    for (const g of GUSTS) {
      const u = (s - g.t - gx / GUST_SPEED) / .42;
      if (u > -3 && u < 3) w += g.a * Math.exp(-u * u);
    }
    return w;
  };
  // each piece is a damped spring chasing the wind, so it overshoots and settles like a real stem
  const sway = (p, s, dt) => {
    const target = p.lean + wind(p.gx, s) * p.flex * p.sign;
    const c = 2 * .3 * Math.sqrt(p.k);
    p.om += (p.k * (target - p.th) - c * p.om) * dt;
    p.th += p.om * dt;
  };

  // the whole frame breathes together: 0 at rest, 1 at the deepest point of each breath
  const breathAt = (s) => .5 - .5 * Math.cos(2 * Math.PI * s / BREATH_PERIOD);

  // each flower: carried clockwise around the loop, pushed in and out by the breath, and bent
  // from its base by the wind (part rotation, part skew, so the tip travels further than the stem)
  const drawPiece = (p, t, s) => {
    const grow = easeOutCubic(clamp((t - p.delay) / 950));
    const at = pathAt(p.s0 + DRIFT * s);
    const br = breathAt(s) * p.breath;
    const push = BAND * BREATH_IN * br;
    const x = at.x + Math.sin(at.dir) * push, y = at.y - Math.cos(at.dir) * push;
    const thDeg = p.th * DEG;
    const flutter = (p.kind === 'leaf' ? 2.5 : 1.2) * Math.sin(s * 6.2 + p.ph) * clamp(wind(p.gx, s) * 4, .3, 1.6);
    const sc = Math.max(.001, p.scale * (.35 + .65 * grow) * (1 + BREATH_SCALE * br));
    p.img.style.opacity = f2(clamp(grow * 1.6));
    p.img.style.transform =
      `translate(${f2(x)}px, ${f2(y)}px) rotate(${f2((at.dir + p.off) * DEG + thDeg * .55 + flutter)}deg) skewX(${f2(-thDeg * .45)}deg) ` +
      `scale(${(p.flip * sc).toFixed(4)}, ${sc.toFixed(4)}) rotate(${f2(-p.it.ang)}deg) translate(${f2(-p.it.ax)}px, ${f2(-p.it.ay)}px)`;
  };

  const drawMotes = (t, s, dt) => {
    const vis = clamp((t - 700) / 900);
    for (const m of motes) {
      m.x += (20 + 600 * Math.max(0, wind(sweep(m.x, m.y), s))) * dt;
      m.y += Math.sin(s * 1.6 + m.ph) * 9 * dt - 4 * dt;
      if (m.x > W + 12) { m.x = -12; m.y = R(0, H); }
      const edge = Math.min(m.x, W - m.x, m.y, H - m.y);   // brighter near the frame, faint in the open middle
      const near = clamp(1.4 - edge / BAND, .25, 1);
      m.n.setAttribute('cx', f2(m.x));
      m.n.setAttribute('cy', f2(m.y + 6 * Math.sin(s * 2.3 + m.ph)));
      m.n.setAttribute('r', f2(m.r));
      m.n.setAttribute('opacity', f2(m.op * vis * near * (.6 + .4 * Math.sin(s * 3 + m.ph))));
    }
  };

  /* ---------- the sunflower ---------- */
  const ROT0 = -24;
  const rotAtExit = ROT0 + SPIN * T.EXIT / 1000;
  // land on a whole petal step so it matches the still icon in the header exactly
  const rotLand = Math.ceil((rotAtExit + SPIN * T.FLY / 1000 * .55) / SYM) * SYM;
  let r0 = null;                                     // the sunflower's resting box

  const drawBloom = (t) => {
    if (!r0) {                                       // measure without the current transform
      const keep = bloom.style.transform; bloom.style.transform = 'none';
      r0 = bloom.getBoundingClientRect(); bloom.style.transform = keep;
    }
    const c0 = { x: r0.left + r0.width / 2, y: r0.top + r0.height / 2 };
    let x = 0, y = 0, sc, rot, op = 1, light = 0;
    const base = lerp(GROW_FROM, 1, easeOutSine(clamp(t / T.EXIT)));   // grows a little the whole time

    if (t < T.EXIT) {
      op = easeOutCubic(clamp(t / 1000));
      sc = base * lerp(.94, 1, easeOutCubic(clamp(t / 1200)));          // a gentle opening on arrival
      rot = ROT0 + SPIN * t / 1000;
    } else {
      const r1 = slot.getBoundingClientRect();      // read live, in case the header shifts
      const sEnd = r1.width / r0.width;
      const dx = r1.left + r1.width / 2 - c0.x, dy = r1.top + r1.height / 2 - c0.y;
      const k = t - T.EXIT;
      if (k < T.FLY) {
        const p = k / T.FLY, e = easeInOutCubic(p);
        const lift = 1 + .05 * Math.sin(Math.PI * Math.min(1, p / .3));  // a small breath before it goes
        x = dx * e + Math.min(70, W * .06) * Math.sin(Math.PI * p);
        y = dy * e;
        sc = Math.exp(lerp(Math.log(base), Math.log(sEnd), e)) * lift;
        // keep turning at the same speed, then ease to a stop on a petal step (cubic Hermite)
        const m0 = SPIN * T.FLY / 1000;
        rot = (2 * p ** 3 - 3 * p ** 2 + 1) * rotAtExit + (p ** 3 - 2 * p ** 2 + p) * m0 + (-2 * p ** 3 + 3 * p ** 2) * rotLand;
        light = clamp((p - .4) / .45);
      } else {
        const q = (k - T.FLY) / 1000;
        x = dx; y = dy;
        sc = sEnd * (1 + .07 * spring(q, .45, 26));
        rot = rotLand;
        light = 1;
        if (k >= T.FLY + T.SETTLE) return true;
      }
    }
    // the gold sunflower photo dissolves (opening a touch as it goes) into the logo's sunflower
    const swap = easeInOutSine(clamp((t - T.SWAP_AT) / T.SWAP));
    if (bloomPhoto) {
      bloomPhoto.style.opacity = f2(1 - swap);
      bloomPhoto.style.transform = `scale(${(1 + .08 * swap).toFixed(4)})`;
    }
    bloomDark.style.opacity = f2(swap);
    bloom.style.opacity = f2(op);
    bloom.style.transform = `translate(${f2(x)}px, ${f2(y)}px) rotate(${f2(rot)}deg) scale(${sc.toFixed(4)})`;
    bloomLight.style.opacity = f2(light);
    return false;
  };

  /* ---------- exit: the frame parts outward and the dark background dissolves ---------- */
  const drawExit = (t) => {
    const k = t - T.EXIT;
    if (k < 0) return;
    intro.classList.add('is-leaving');
    body.classList.add('is-revealing');
    const part = easeInCubic(clamp(k / T.PART));
    const sc = 1 + .55 * part;
    frameG.setAttribute('transform', `translate(${f2(W / 2)} ${f2(H / 2)}) scale(${sc.toFixed(4)}) translate(${f2(-W / 2)} ${f2(-H / 2)})`);
    frameG.setAttribute('opacity', f2(1 - part * .85));
    frameEl.style.transform = `scale(${sc.toFixed(4)})`;
    frameEl.style.opacity = f2(1 - part * .85);
    const fade = clamp((k - T.FADE_DELAY) / T.FADE);
    veil.style.opacity = f2(1 - easeInOutSine(fade));
  };

  /* ---------- the loop ---------- */
  let clock = 0, last = null, sim = 0;
  const STEP = 1 / 120;                              // fixed physics step, steady on any refresh rate
  const stepAll = (s) => { for (const p of plants) sway(p, s, STEP); };
  const currentT = () => (freezeAt === null ? clock : freezeAt);
  const drawAll = (t, s, dtMs) => {
    for (const p of plants) drawPiece(p, t, s);
    drawMotes(t, s, dtMs / 1000);
  };

  const frame = (now) => {
    if (finished) return;
    try {
      // advance at most ~2 frames per frame: a busy phone slows a touch instead of skipping
      const dtMs = last === null ? 16 : Math.min(34, Math.max(0, now - last));
      last = now;
      if (freezeAt === null) clock += dtMs;
      const t = currentT(), s = t / 1000;
      if (freezeAt === null) { while (sim < s) { stepAll(sim); sim += STEP; } }
      drawAll(t, s, freezeAt === null ? dtMs : 0);
      drawExit(t);
      if (drawBloom(t)) { finish(); return; }
      requestAnimationFrame(frame);
    } catch (err) {
      console.error('[intro]', err);
      finish();
    }
  };

  // responsive: rebuild the frame for the new size (same composition, already grown in)
  let resizeTimer = 0, lastSize = '';
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const size = innerWidth + 'x' + innerHeight;
      if (finished || size === lastSize) return;
      lastSize = size;
      const t = currentT();
      build(t);
      if (freezeAt !== null) for (let s = 0; s < t / 1000; s += STEP) stepAll(s);
      drawAll(t, t / 1000, 0);
      drawExit(t);
    }, 120);
  }

  build(0);
  lastSize = innerWidth + 'x' + innerHeight;
  addEventListener('resize', onResize);


  // a frozen frame should look mid-breeze, not stiff
  if (freezeAt !== null) { for (let s = 0; s < freezeAt / 1000; s += STEP) stepAll(s); }

  // skip: click, tap or any key jumps to the exit
  const skip = () => { if (clock < T.EXIT) { sim = T.EXIT / 1000; clock = T.EXIT; } };
  intro.addEventListener('pointerdown', skip);
  addEventListener('keydown', skip, { once: true });

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    requestAnimationFrame(frame);
    setTimeout(() => { if (!finished && freezeAt === null) { console.warn('[intro] safety timeout'); finish(); } }, 9000);
  };
  // draw the first frame right away so nothing pops, then start once the page is ready
  drawAll(0, 0, 0);
  if (document.readyState === 'complete') setTimeout(start, 150);
  else addEventListener('load', () => setTimeout(start, 150));
  setTimeout(start, 2500);                           // never wait on a slow font or image
})();
