/* ANAÍS — entrance animation
   A frame of gold line-art flowers grows in from every edge of a dark field and sways as gusts
   of wind roll through it. The sunflower in the centre turns slowly and grows a little. Then a
   last gust parts the frame outward, an iris opens onto the page, and the sunflower glides up
   into the header.

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

  // seeded random, so the frame is composed the same way every visit
  let seed = 20261125;
  const rnd = () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const R = (a, b) => a + (b - a) * rnd();
  const pick = (weights) => {
    let r = rnd() * weights.reduce((s, w) => s + w[1], 0);
    for (const [v, w] of weights) { if ((r -= w) <= 0) return v; }
    return weights[0][0];
  };
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

  /* ---------- the stage ---------- */
  const W = innerWidth, H = innerHeight;
  const M = Math.min(W, H);
  const BAND = clamp(M * .2, 80, 210);               // how far the frame reaches in from the edge
  const SZ = clamp(M / 900, .62, 1.15);              // flower head scale
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  // gold that is brightest toward the middle of the screen and deepens into the edges
  const defs = el('defs', svg);
  const grad = el('radialGradient', defs, { id: 'intro-gold', gradientUnits: 'userSpaceOnUse', cx: W / 2, cy: H / 2, r: Math.hypot(W, H) / 2 });
  [['0', '#F6E2A6'], ['.55', '#F2D896'], ['.8', '#E2BC72'], ['.93', '#C99A4A'], ['1', '#A9772E']].forEach(([o, c]) => el('stop', grad, { offset: o, 'stop-color': c }));

  const frameG = el('g', svg);                       // everything that parts away at the end
  const layerBack = el('g', frameG, { class: 'back' });
  const layerGrass = el('g', frameG, { class: 'grass' });
  const layerFront = el('g', frameG, { class: 'front' });
  const layerMotes = el('g', frameG);

  /* ---------- drawing the flowers (gold line art, like the mark) ---------- */
  // an almond petal from r0 to r1 along angle a, the same curve the logo uses
  const petal = (a, r0, r1, hw) => {
    const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux, L = r1 - r0;
    const p = (t, w) => `${f2(ux * (r0 + L * t) + vx * w)} ${f2(uy * (r0 + L * t) + vy * w)}`;
    const k = hw * 1.33;
    return `M${p(0, 0)} C${p(.18, k)} ${p(.62, k)} ${p(1, 0)} C${p(.62, -k)} ${p(.18, -k)} ${p(0, 0)}Z`;
  };
  // the logo's tapered vein: grows from the inner tip of the petal and narrows to a point
  const vein = (a, r0, r1, bw) => {
    const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux, L = .38 * (r1 - r0);
    const q = (t, w) => `${f2(ux * (r0 + L * t) + vx * w)} ${f2(uy * (r0 + L * t) + vy * w)}`;
    return `M${q(0, bw)}Q${q(.55, bw * .7)} ${q(1, 0)}Q${q(.55, -bw * .7)} ${q(0, -bw)}Z`;
  };
  const ring = (fn, n, off, ...args) => {
    let d = '';
    for (let i = 0; i < n; i++) d += fn(-Math.PI / 2 + (i + off) * 2 * Math.PI / n, ...args) + ' ';
    return d;
  };
  const seeds = (g, rDisc, n) => {
    const GOLDEN = Math.PI * (3 - Math.sqrt(5));
    for (let i = 1; i <= n; i++) {
      const r = rDisc * .8 * Math.sqrt(i / n), a = i * GOLDEN;
      el('circle', g, { class: 'd', cx: f2(r * Math.cos(a)), cy: f2(r * Math.sin(a)), r: f2(clamp(rDisc * .055 + .02 * r, .45, 1.3)) });
    }
  };
  const leafPath = (L, w) =>
    `M0 0 C${f2(L * .3)} ${f2(-w)} ${f2(L * .7)} ${f2(-w)} ${f2(L)} 0 C${f2(L * .7)} ${f2(w)} ${f2(L * .3)} ${f2(w)} 0 0Z M${f2(L * .12)} 0 L${f2(L * .7)} 0`;

  // flower heads, drawn at the origin, growing toward −y
  const HEADS = {
    sunflower(g, s) {                               // a small cousin of the mark
      el('path', g, { class: 'p', d: ring(petal, 14, .5, s * .42, s * .9, s * .13) });
      el('path', g, { class: 'p', d: ring(petal, 14, 0, s * .44, s * 1.05, s * .16) });
      el('path', g, { class: 'd', d: ring(vein, 14, 0, s * .44, s * 1.05, s * .035) });
      el('circle', g, { class: 'p', r: f2(s * .48) });
      seeds(g, s * .48, s > 14 ? 34 : 18);
    },
    rose(g, s) {                                    // layered rounded petals around a spiral heart
      el('path', g, { class: 'p', d: ring(petal, 5, 0, s * .12, s, s * .44) });
      el('path', g, { class: 'p', d: ring(petal, 5, .5, s * .08, s * .74, s * .36) });
      let d = '';
      for (let i = 0; i <= 44; i++) {
        const a = i * .3, r = s * .05 + s * .38 * (i / 44);
        d += (i ? 'L' : 'M') + f2(Math.cos(a) * r) + ' ' + f2(Math.sin(a) * r);
      }
      el('path', g, { class: 'p', d, style: 'fill:none' });
    },
    daisy(g, s) {
      el('path', g, { class: 'p', d: ring(petal, 11, 0, s * .26, s, s * .16) });
      el('circle', g, { class: 'p', r: f2(s * .3) });
      seeds(g, s * .3, 6);
    },
    tulip(g, s) {
      el('path', g, { class: 'p', d: `M0 0 C${-.62 * s} 0 ${-.66 * s} ${-.8 * s} ${-.46 * s} ${-1.18 * s} L${-.22 * s} ${-.86 * s} L0 ${-1.24 * s} L${.22 * s} ${-.86 * s} L${.46 * s} ${-1.18 * s} C${.66 * s} ${-.8 * s} ${.62 * s} 0 0 0Z` });
      el('path', g, { class: 'v', d: `M${-.22 * s} ${-.86 * s} Q${-.08 * s} ${-.42 * s} 0 ${-.06 * s} M${.22 * s} ${-.86 * s} Q${.08 * s} ${-.42 * s} 0 ${-.06 * s}` });
    },
    bud(g, s) {
      el('path', g, { class: 'p', d: `M0 0 C${-.42 * s} ${-.2 * s} ${-.36 * s} ${-.82 * s} 0 ${-1.3 * s} C${.36 * s} ${-.82 * s} ${.42 * s} ${-.2 * s} 0 0Z` });
      el('path', g, { class: 'st', d: `M0 0 Q${-.34 * s} ${-.08 * s} ${-.44 * s} ${-.46 * s} M0 0 Q${.34 * s} ${-.08 * s} ${.44 * s} ${-.46 * s}` });
    },
    spike(g, s) {                                   // a lavender-like spike of little florets
      el('path', g, { class: 'st', d: `M0 0 L0 ${-1.9 * s}` });
      for (let i = 0; i < 6; i++) {
        const side = i % 2 ? 1 : -1, cy = -(.25 + i * .3) * s, cx = side * .15 * s * (1 - i / 9);
        el('ellipse', g, { class: 'p', cx: f2(cx), cy: f2(cy), rx: f2(.12 * s), ry: f2(.22 * s), transform: `rotate(${side * 28} ${f2(cx)} ${f2(cy)})` });
      }
      el('ellipse', g, { class: 'p', cx: 0, cy: f2(-2 * s), rx: f2(.09 * s), ry: f2(.17 * s) });
    },
    sprig(g, s) {                                   // a trailing tip of leaves, like ivy
      for (let i = 0; i < 3; i++) {
        const side = i % 2 ? 1 : -1, y = -i * .55 * s;
        el('path', g, { class: 'p', d: leafPath(s * (1 - i * .22), s * .26 * (1 - i * .2)), transform: `translate(0 ${f2(y)}) rotate(${-90 + side * 38})` });
      }
      el('path', g, { class: 'p', d: leafPath(s * .7, s * .2), transform: `translate(0 ${f2(-1.4 * s)}) rotate(-90)` });
    },
  };

  /* ---------- composing the frame ---------- */
  // Each plant has a root on (just outside) a screen edge and grows inward along `dir`
  // (radians, 0 = straight up the screen). It is drawn in its own local frame.
  const plants = [], blades = [], motes = [];
  const EDGES = [
    { name: 'bottom', len: W, at: (u) => [u * W, H + 6], dir: 0 },
    { name: 'top', len: W, at: (u) => [u * W, -6], dir: Math.PI },
    { name: 'left', len: H, at: (u) => [-6, u * H], dir: Math.PI / 2 },
    { name: 'right', len: H, at: (u) => [W + 6, u * H], dir: -Math.PI / 2 },
  ];
  const CORNERS = [
    { x: 0, y: H, from: 0, to: Math.PI / 2, weight: 1.15 },               // bottom-left
    { x: W, y: H, from: -Math.PI / 2, to: 0, weight: 1.3 },               // bottom-right (fullest, like the reference)
    { x: 0, y: 0, from: Math.PI / 2, to: Math.PI, weight: 1.2 },          // top-left
    { x: W, y: 0, from: -Math.PI, to: -Math.PI / 2, weight: 1 },          // top-right
  ];

  // wind is measured along a diagonal sweep, so gusts roll across the whole frame
  const sweep = (x, y) => x + y * .45;
  // turn local sway into consistent on-screen motion: plants on the top edge hang down, so they flip
  const windSign = (dir) => { const c = Math.cos(dir); return c >= 0 ? Math.max(c, .6) : Math.min(c, -.6); };

  const addPlant = (layer, bx, by, dir, len, type, s, delay) => {
    const g = el('g', layer, { transform: `translate(${f2(bx)} ${f2(by)}) rotate(${f2(dir * DEG)})` });
    const stem = el('path', g, { class: 'st' });
    const leaves = [];
    const nLeaves = type === 'sprig' ? 3 : rnd() < .6 ? 1 : 2;
    for (let i = 0; i < nLeaves; i++) {
      const L = clamp(len * R(.18, .3), 12, 54 * SZ);
      leaves.push({
        n: el('path', g, { class: 'p', d: leafPath(L, L * .25) }),
        t: type === 'sprig' ? .25 + i * .22 : R(.2, .5) + i * .15,
        side: i % 2 ? -1 : (rnd() < .5 ? -1 : 1), ph: R(0, 6.28),
      });
    }
    const head = el('g', g);
    HEADS[type](head, s);
    const rel = len / BAND;
    plants.push({
      len, stem, leaves, head, faceOn: type === 'sunflower' || type === 'rose' || type === 'daisy',
      gx: sweep(bx, by), sign: windSign(dir), delay,
      th: R(-.04, .04), om: 0, k: R(26, 42) / (.55 + .6 * rel), flex: .5 + .6 * rel,
      ph: R(0, 6.28), lean: R(-.08, .08),
    });
  };

  // where along the screen the plant sits decides how soon it sprouts: corners first, then inward
  const delayAt = (bx, by) => {
    const dc = Math.min(Math.hypot(bx, by), Math.hypot(W - bx, by), Math.hypot(bx, H - by), Math.hypot(W - bx, H - by));
    return 60 + dc / Math.hypot(W, H) * 1300 + R(0, 220);
  };

  // 1) corner clusters: the big blooms fan out from each corner
  for (const c of CORNERS) {
    const n = Math.round((7 + M / 160) * c.weight);
    for (let i = 0; i < n; i++) {
      const a = lerp(c.from, c.to, (i + R(.15, .85)) / n);
      // roots sit just off-screen, spread a little along one of the corner's two edges
      const off = R(0, BAND * .7), inX = c.x ? -1 : 1, inY = c.y ? -1 : 1;
      const onHorizontal = rnd() < .5;
      const bx = onHorizontal ? c.x + inX * off : c.x - inX * 6;
      const by = onHorizontal ? c.y - inY * 6 : c.y + inY * off;
      const type = pick([['rose', 3], ['sunflower', 2.4], ['daisy', 2], ['tulip', 1], ['sprig', 1.6]]);
      const big = type === 'rose' || type === 'sunflower';
      const len = BAND * (big ? R(.35, 1.05) : R(.6, 1.35));
      addPlant(layerFront, bx, by, a, len, type, (big ? R(22, 40) : R(15, 26)) * SZ, delayAt(bx, by));
    }
    // a few dimmer flowers behind each cluster for depth
    for (let i = 0; i < 7; i++) {
      const a = lerp(c.from, c.to, R(.05, .95));
      addPlant(layerBack, c.x, c.y, a, BAND * R(.9, 1.6), pick([['daisy', 2], ['rose', 1.4], ['sunflower', 1], ['spike', 2], ['sprig', 1.5], ['bud', 1]]), R(14, 24) * SZ, delayAt(c.x, c.y) + 120);
    }
  }

  // 2) along each edge: lighter toward the middle of each side, fuller toward the corners
  for (const e of EDGES) {
    const step = 24 / Math.max(.75, SZ);
    for (let d = step * .5; d < e.len; d += step * R(.7, 1.3)) {
      const u = d / e.len;
      const nearCorner = Math.max(Math.exp(-u / .16), Math.exp(-(1 - u) / .16));
      if (rnd() > .5 + .5 * nearCorner) continue;
      const [bx, by] = e.at(u);
      const front = rnd() < .6;
      const len = BAND * (front ? R(.3, .8) : R(.45, 1)) * (.75 + .45 * nearCorner);
      const type = pick([['daisy', 3], ['bud', 2], ['tulip', 1.6], ['spike', 1.8], ['sprig', 2], ['sunflower', .8], ['rose', .7]]);
      const s = (front ? R(11, 20) : R(9, 15)) * SZ * (type === 'spike' ? .8 : 1) * (1 + .5 * nearCorner);
      addPlant(front ? layerFront : layerBack, bx, by, e.dir + R(-.5, .5), len, type, s, delayAt(bx, by));
    }
    // a fringe of fine grass along every edge
    const gStep = 9 / Math.max(.8, SZ);
    for (let d = 0; d < e.len; d += gStep * R(.6, 1.4)) {
      const [bx, by] = e.at(d / e.len);
      const g = el('g', layerGrass, { transform: `translate(${f2(bx)} ${f2(by)}) rotate(${f2((e.dir + R(-.35, .35)) * DEG)})` });
      blades.push({
        len: R(12, 46) * (.6 + .4 * SZ), w: R(1, 2.1), n: el('path', g, { class: 'gb' }),
        gx: sweep(bx, by), sign: windSign(e.dir), delay: delayAt(bx, by) * .8,
        th: R(-.1, .1), om: 0, k: R(40, 70), flex: R(.8, 1.4), lean: R(-.15, .15),
      });
    }
  }

  // drifting pollen, so the wind can be seen
  for (let i = 0; i < Math.round((W + H) / 55); i++) {
    motes.push({ x: R(0, W), y: R(0, H), r: R(.7, 1.9), ph: R(0, 6.28), op: R(.25, .7), n: el('circle', layerMotes, { class: 'mote' }) });
  }

  /* ---------- wind ---------- */
  // a steady breeze plus gusts that travel diagonally across the screen
  const GUSTS = [{ t: .9, a: .11 }, { t: 2.2, a: .18 }, { t: T.EXIT / 1000 - .1, a: .34 }];
  const GUST_SPEED = 1300;                           // px per second
  const wind = (gx, s) => {
    let w = .04 + .05 * Math.sin(s * 1.25 - gx * .0042) + .03 * Math.sin(s * 2.6 - gx * .011 + 1.7) + .016 * Math.sin(s * 5.3 - gx * .027 + .4);
    for (const g of GUSTS) {
      const u = (s - g.t - gx / GUST_SPEED) / .42;
      if (u > -3 && u < 3) w += g.a * Math.exp(-u * u);
    }
    return w;
  };
  // each stem is a damped spring chasing the wind, so it overshoots and settles like a real stem
  const sway = (p, s, dt) => {
    const target = p.lean + wind(p.gx, s) * p.flex * p.sign;
    const c = 2 * .3 * Math.sqrt(p.k);
    p.om += (p.k * (target - p.th) - c * p.om) * dt;
    p.th += p.om * dt;
  };

  const drawPlant = (p, t, s) => {
    const grow = easeOutCubic(clamp((t - p.delay) / 950));
    const hh = Math.max(.01, p.len * grow), th = p.th;
    const cx = hh * .5 * Math.sin(th * .35), cy = -hh * .55;
    const tx = hh * Math.sin(th), ty = -hh * Math.cos(th);
    p.stem.setAttribute('d', `M0 0 Q${f2(cx)} ${f2(cy)} ${f2(tx)} ${f2(ty)}`);
    // the head follows the stem's direction at the tip, with a little flutter
    const ang = Math.atan2(tx - cx, cy - ty) * DEG;
    const flutter = (p.faceOn ? 4 : 7) * Math.sin(s * 6.5 + p.ph) * clamp(wind(p.gx, s) * 4, .3, 1.6);
    p.head.setAttribute('transform', `translate(${f2(tx)} ${f2(ty)}) rotate(${f2(ang + flutter)}) scale(${f2(grow)})`);
    for (const l of p.leaves) {
      const u = l.t, a = 1 - u;
      const lx = 2 * a * u * cx + u * u * tx, ly = 2 * a * u * cy + u * u * ty;
      const dx = 2 * a * cx + 2 * u * (tx - cx), dy = 2 * a * cy + 2 * u * (ty - cy);
      const la = Math.atan2(dy, dx) * DEG + l.side * (52 + 6 * Math.sin(s * 3.1 + l.ph));
      l.n.setAttribute('transform', `translate(${f2(lx)} ${f2(ly)}) rotate(${f2(la)}) scale(${f2(clamp((grow - .2) / .8))})`);
    }
  };

  const drawBlade = (b, t) => {
    const grow = easeOutCubic(clamp((t - b.delay) / 700));
    const hh = b.len * grow, th = b.th;
    const cx = hh * .45 * Math.sin(th * .4), cy = -hh * .55;
    const tx = hh * Math.sin(th), ty = -hh * Math.cos(th);
    b.n.setAttribute('d', `M${f2(-b.w)} 0 Q${f2(cx - b.w * .5)} ${f2(cy)} ${f2(tx)} ${f2(ty)} Q${f2(cx + b.w * .5)} ${f2(cy)} ${f2(b.w)} 0Z`);
  };

  const drawMotes = (t, s, dt) => {
    const vis = clamp((t - 700) / 900);
    for (const m of motes) {
      m.x += (20 + 600 * Math.max(0, wind(sweep(m.x, m.y), s))) * dt;
      m.y += Math.sin(s * 1.6 + m.ph) * 9 * dt - 4 * dt;
      if (m.x > W + 12) { m.x = -12; m.y = R(0, H); }
      // brighter near the frame, faint in the open middle
      const edge = Math.min(m.x, W - m.x, m.y, H - m.y);
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
  let r0 = null;                                     // the sunflower's resting box, measured once

  const drawBloom = (t) => {
    if (!r0) r0 = bloom.getBoundingClientRect();
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
  const irisMax = Math.hypot(W, H) * .55 + 120;
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
  const stepAll = (s) => { for (const p of plants) sway(p, s, STEP); for (const b of blades) sway(b, s, STEP); };

  const frame = (now) => {
    if (finished) return;
    try {
      // advance at most ~2 frames per frame: a busy phone slows a touch instead of skipping
      const dtMs = last === null ? 16 : Math.min(34, Math.max(0, now - last));
      last = now;
      if (freezeAt === null) clock += dtMs;
      const t = freezeAt === null ? clock : freezeAt;
      const s = t / 1000;
      if (freezeAt === null) { while (sim < s) { stepAll(sim); sim += STEP; } }
      for (const p of plants) drawPlant(p, t, s);
      for (const b of blades) drawBlade(b, t);
      drawMotes(t, s, freezeAt === null ? dtMs / 1000 : 0);
      drawExit(t);
      if (drawBloom(t)) { finish(); return; }
      requestAnimationFrame(frame);
    } catch (err) {
      console.error('[intro]', err);
      finish();
    }
  };

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
  plants.forEach((p) => drawPlant(p, 0, 0));
  blades.forEach((b) => drawBlade(b, 0));
  if (document.readyState === 'complete') setTimeout(start, 150);
  else addEventListener('load', () => setTimeout(start, 150));
  setTimeout(start, 2500);                           // never wait on a slow font or image
})();
