/* ANAÍS — entrance animation
   A frame of hand-drawn gold leaves and flowers grows in from every edge of a dark field and
   sways as gusts of wind roll through it. The sunflower in the centre turns slowly and grows a
   little. Then a last gust parts the frame outward, an iris opens onto the page, and the
   sunflower glides up into the header.

   The drawings come from js/intro-flowers.js (see assets/flowers/CREDITS.md).
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
  const slot = document.querySelector('[data-intro-slot]');
  const NS = 'http://www.w3.org/2000/svg';
  const LIB = (window.ANAIS_FLOWERS && window.ANAIS_FLOWERS.items) || [];

  /* ---------- timing (ms) ---------- */
  const T = {
    EXIT: 3300,       // the frame holds until here, then the scene clears
    FLY: 1050,        // sunflower flight into the header
    SETTLE: 420,      // soft landing
    PART: 1000,       // the flower frame parts outward
    IRIS_DELAY: 120,  // iris starts opening this long after EXIT
    IRIS: 1150,
  };
  const SPIN = 26;            // sunflower turn speed, degrees per second
  const SYM = 22.5;           // the mark has 16 petals, so it looks the same every 22.5°
  const GROW_FROM = 0.82;     // sunflower starts at 82% size and grows to 100%

  /* ---------- colour: slightly different golds, layered with opaque fills ---------- */
  const LINE_FRONT = ['#F6E2A6', '#EFD592', '#E6C47C', '#DDB468', '#D2A659'];
  const LINE_BACK = ['#B88A40', '#A87C36', '#C29650', '#9A7031'];
  const FILL_DARK = ['#0B0A08', '#0E0C09', '#120E0A'];          // most pieces: the night shows through nothing
  const FILL_BACK = ['#15110B', '#19130C'];
  const ACCENT = [['#E9D29A', '#8E6629'], ['#DDBE7C', '#7E5A22'], ['#F1DEAA', '#9A7232']];  // [fill, line] for a few lighter-gold pieces
  const ACCENT_SHARE = .16;

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

  /* ---------- reduced motion: a quiet fade, no wind ---------- */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches && freezeAt === null) {
    bloom.style.opacity = '1';
    const go = () => {
      body.classList.add('is-revealing');
      const a = intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, delay: 700, fill: 'forwards' });
      a.finished.then(finish, finish);
    };
    if (document.readyState === 'complete') go(); else addEventListener('load', go);
    setTimeout(finish, 4000);
    return;
  }

  /* ---------- the drawings, defined once and reused with <use> ---------- */
  // Each drawing is its gold outline over a solid silhouette, so pieces in front hide what is
  // behind them. Colours come from CSS variables set on each <use>, so every copy can differ.
  const defs = el('defs', svg);
  const BY_KIND = { leaf: [], bloom: [], grass: [] };
  for (const it of LIB) {
    const g = el('g', defs, { id: 'fl-' + it.id });
    for (const p of it.parts) {
      const pg = el('g', g, { transform: `matrix(${p.m.join(' ')})` });
      el('path', pg, { d: p.b, style: 'fill:var(--fl-fill,#0B0A08)' });
      const line = el('path', pg, { d: p.d, 'fill-rule': 'evenodd', style: 'fill:var(--fl-line,#E2BC72)' });
      if (it.kind === 'bloom') {             // the single-line flowers are very fine: give them a little weight
        line.setAttribute('style', 'fill:var(--fl-line,#E2BC72);stroke:var(--fl-line,#E2BC72);stroke-width:.9px;stroke-linejoin:round');
        line.setAttribute('vector-effect', 'non-scaling-stroke');
      }
    }
    (BY_KIND[it.kind] || BY_KIND.leaf).push(it);
  }

  const frameG = el('g', svg);                       // everything that parts away at the end
  const layerBack = el('g', frameG, { class: 'back' });
  const layerMid = el('g', frameG);
  const layerFront = el('g', frameG);
  const layerMotes = el('g', frameG);

  /* ---------- composing the frame (rebuilt on resize) ---------- */
  let W, H, M, BAND, plants = [], motes = [];
  const sweep = (x, y) => x + y * .45;               // gusts roll diagonally across the screen
  // plants on the top edge hang down, so their sway flips to keep the wind going one way
  const windSign = (dir) => { const c = Math.cos(dir); return c >= 0 ? Math.max(c, .6) : Math.min(c, -.6); };

  const addPiece = (layer, kind, bx, by, dir, len, back, delay) => {
    const list = BY_KIND[kind].length ? BY_KIND[kind] : BY_KIND.leaf;
    if (!list.length) return;
    const it = pickFrom(list);
    const use = el('use', layer, { href: '#fl-' + it.id });
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#fl-' + it.id);
    let line, fill;
    if (back) { line = pickFrom(LINE_BACK); fill = pickFrom(FILL_BACK); }
    else if (kind === 'leaf' && rnd() < ACCENT_SHARE) { [fill, line] = pickFrom(ACCENT); }
    else { line = pickFrom(LINE_FRONT); fill = pickFrom(FILL_DARK); }
    use.style.setProperty('--fl-line', line);
    use.style.setProperty('--fl-fill', fill);
    const rel = len / BAND;
    plants.push({
      use, bx, by, dirDeg: dir * DEG, scale: len / 100, flip: rnd() < .5 ? -1 : 1, delay,
      gx: sweep(bx, by), sign: windSign(dir), kind,
      th: R(-.03, .03), om: 0, k: R(22, 36) / (.5 + .5 * rel), flex: (.4 + .45 * rel) * (kind === 'bloom' ? 1.35 : 1),
      ph: R(0, 6.28), lean: R(-.06, .06),
    });
  };

  const build = (now) => {
    reseed();
    W = innerWidth; H = innerHeight; M = Math.min(W, H);
    BAND = clamp(M * (H < 520 ? .19 : .22), 60, 230); // how far the frame reaches in (a touch less on short screens)
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    for (const g of [layerBack, layerMid, layerFront, layerMotes]) g.replaceChildren();
    plants = []; motes = [];

    // pieces sprout from the corners first, then along the edges toward the middle
    const delayAt = (bx, by) => {
      if (now > 0) return now - 2000;                // rebuilt mid-intro: already grown
      const dc = Math.min(Math.hypot(bx, by), Math.hypot(W - bx, by), Math.hypot(bx, H - by), Math.hypot(W - bx, H - by));
      return 60 + dc / Math.hypot(W, H) * 1300 + R(0, 240);
    };

    // 1) corner clusters: fuller bouquets that fan out from each corner
    const CORNERS = [
      { x: 0, y: H, from: 0, to: Math.PI / 2, weight: 1.15 },          // bottom-left
      { x: W, y: H, from: -Math.PI / 2, to: 0, weight: 1.3 },          // bottom-right (fullest, like the reference)
      { x: 0, y: 0, from: Math.PI / 2, to: Math.PI, weight: 1.2 },     // top-left
      { x: W, y: 0, from: -Math.PI, to: -Math.PI / 2, weight: 1 },     // top-right
    ];
    for (const c of CORNERS) {
      const inX = c.x ? -1 : 1, inY = c.y ? -1 : 1;
      const root = () => {                           // just off-screen, spread along one of the two edges
        const off = R(0, BAND * .65);
        return rnd() < .5 ? [c.x + inX * off, c.y - inY * 8] : [c.x - inX * 8, c.y + inY * off];
      };
      // back row: larger, dimmer leaves for depth
      for (let i = 0; i < 3; i++) {
        const [bx, by] = root();
        addPiece(layerBack, 'leaf', bx, by, lerp(c.from, c.to, R(.08, .92)), BAND * R(.9, 1.35), true, delayAt(bx, by) + 80);
      }
      // flowers rising out of the cluster
      const nb = Math.round((2 + M / 400) * c.weight);
      for (let i = 0; i < nb; i++) {
        const [bx, by] = root();
        addPiece(layerMid, 'bloom', bx, by, lerp(c.from, c.to, (i + R(.2, .8)) / nb), BAND * R(1.05, 1.6), false, delayAt(bx, by) + 120);
      }
      // front leaves
      const nl = Math.round((3 + M / 320) * c.weight);
      for (let i = 0; i < nl; i++) {
        const [bx, by] = root();
        addPiece(layerFront, 'leaf', bx, by, lerp(c.from, c.to, (i + R(.15, .85)) / nl), BAND * R(.55, 1.05), false, delayAt(bx, by));
      }
    }

    // 2) along each edge: lighter toward the middle of each side, fuller toward the corners
    const EDGES = [
      { len: W, at: (u) => [u * W, H + 8], dir: 0 },
      { len: W, at: (u) => [u * W, -8], dir: Math.PI },
      { len: H, at: (u) => [-8, u * H], dir: Math.PI / 2 },
      { len: H, at: (u) => [W + 8, u * H], dir: -Math.PI / 2 },
    ];
    for (const e of EDGES) {
      const step = BAND * .3;
      for (let d = step * .5; d < e.len; d += step * R(.75, 1.25)) {
        const u = d / e.len;
        const nearCorner = Math.max(Math.exp(-u / .15), Math.exp(-(1 - u) / .15));
        if (rnd() > .72 + .28 * nearCorner) continue;
        const [bx, by] = e.at(u);
        const dir = e.dir + R(-.45, .45);
        const r = rnd();
        if (r < .22) addPiece(layerBack, 'leaf', bx, by, dir, BAND * R(.6, 1) * (.8 + .4 * nearCorner), true, delayAt(bx, by) + 60);
        else if (r < .5) addPiece(layerMid, 'bloom', bx, by, dir, BAND * R(.75, 1.25) * (.8 + .4 * nearCorner), false, delayAt(bx, by) + 100);
        else if (r < .56 && BY_KIND.grass.length) addPiece(layerFront, 'grass', bx, by, e.dir, BAND * R(.3, .45), false, delayAt(bx, by));
        else addPiece(layerFront, 'leaf', bx, by, dir, BAND * R(.42, .8) * (.85 + .35 * nearCorner), false, delayAt(bx, by));
      }
    }

    // drifting pollen, so the wind can be seen
    for (let i = 0; i < Math.round((W + H) / 55); i++) {
      motes.push({ x: R(0, W), y: R(0, H), r: R(.7, 1.9), ph: R(0, 6.28), op: R(.25, .7), n: el('circle', layerMotes, { class: 'mote' }) });
    }
    irisMax = Math.hypot(W, H) * .55 + 120;
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

  // bend from the base: part rotation, part skew, so the tip travels further than the stem
  const drawPiece = (p, t, s) => {
    const grow = easeOutCubic(clamp((t - p.delay) / 950));
    const thDeg = p.th * DEG;
    const flutter = (p.kind === 'leaf' ? 2.5 : 1.5) * Math.sin(s * 6.2 + p.ph) * clamp(wind(p.gx, s) * 4, .3, 1.6);
    const sc = Math.max(.001, p.scale * grow);
    p.use.setAttribute('transform',
      `translate(${f2(p.bx)} ${f2(p.by)}) rotate(${f2(p.dirDeg + thDeg * .55 + flutter)}) skewX(${f2(-thDeg * .45)}) scale(${(p.flip * sc).toFixed(4)} ${sc.toFixed(4)})`);
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
    bloom.style.opacity = f2(op);
    bloom.style.transform = `translate(${f2(x)}px, ${f2(y)}px) rotate(${f2(rot)}deg) scale(${sc.toFixed(4)})`;
    bloomLight.style.opacity = f2(light);
    return false;
  };

  /* ---------- exit: the frame parts outward, the iris opens ---------- */
  let irisMax = 0;
  const drawExit = (t) => {
    const k = t - T.EXIT;
    if (k < 0) return;
    intro.classList.add('is-leaving');
    body.classList.add('is-revealing');
    const part = easeInCubic(clamp(k / T.PART));
    const sc = 1 + .55 * part;
    frameG.setAttribute('transform', `translate(${f2(W / 2)} ${f2(H / 2)}) scale(${sc.toFixed(4)}) translate(${f2(-W / 2)} ${f2(-H / 2)})`);
    frameG.setAttribute('opacity', f2(1 - part * .85));
    const ip = clamp((k - T.IRIS_DELAY) / T.IRIS);
    veil.style.setProperty('--iris', f2(lerp(-120, irisMax, easeInOutSine(ip))) + 'px');
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
