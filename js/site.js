/* ANAÍS: site behaviour.
   1. Language: Spanish by default, ES | EN toggle in the header, choice remembered.
   2. Menu: the button on the right slides the menu words in from the right edge.
   3. Salon <-> barbershop: one page, two views. Links to #barbershop (or any barber section) show
      the barbershop; links to #salon (or any salon section) show the salon. Shared sections like
      #book keep whichever view you are in.
   Runs before intro.js so a direct visit to #barbershop can skip the sunflower entrance, which
   belongs to the salon. */
(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;

  /* ---------- 1. language ---------- */
  const TITLES = {
    salon: { es: 'ANAÍS Beauty Empire', en: 'ANAÍS Beauty Empire' },
    barber: { es: 'La Barbería de ANAÍS', en: 'The Barbershop at ANAÍS' },
  };
  const MENU_LABEL = { es: ['Abrir menú', 'Cerrar menú'], en: ['Open menu', 'Close menu'] };
  const langButtons = document.querySelectorAll('[data-lang]');
  const menuBtn = document.querySelector('.menu-btn');
  const menu = document.getElementById('menu');
  let mode = null;

  const lang = () => (root.lang === 'en' ? 'en' : 'es');

  const setLang = (next) => {
    root.lang = next;
    try { localStorage.setItem('anais-lang', next); } catch (e) {}
    langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === next)));
    document.querySelectorAll('[data-es-placeholder]').forEach((el) => {
      el.placeholder = el.dataset[next + 'Placeholder'];
    });
    if (mode) document.title = TITLES[mode][next];
    syncMenuLabel();
  };
  langButtons.forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

  /* ---------- 2. menu ---------- */
  function syncMenuLabel() {
    const open = menu.classList.contains('is-open');
    menuBtn.setAttribute('aria-label', MENU_LABEL[lang()][open ? 1 : 0]);
  }
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    syncMenuLabel();
  };
  menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  // a tap anywhere outside the menu words closes it; the page itself stays usable
  document.addEventListener('pointerdown', (e) => {
    if (menu.classList.contains('is-open') && !menu.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
  });

  /* ---------- 3. salon <-> barbershop ---------- */
  const views = {
    salon: document.querySelector('[data-mode-view="salon"]'),
    barber: document.querySelector('[data-mode-view="barber"]'),
  };

  // which view owns this id? (null = shared, keep current view)
  const ownerOf = (id) => {
    if (!id) return null;
    const el = document.getElementById(id);
    if (!el) return null;
    if (views.barber.contains(el)) return 'barber';
    if (views.salon.contains(el)) return 'salon';
    return null;
  };

  const setMode = (next) => {
    if (next === mode) return false;
    mode = next;
    body.classList.toggle('is-barber', next === 'barber');
    views.salon.hidden = next !== 'salon';
    views.barber.hidden = next !== 'barber';
    document.title = TITLES[next][lang()];
    return true;
  };

  const go = (id, smooth) => {
    const switched = setMode(ownerOf(id) || mode || 'salon');
    const target = id && id !== 'salon' && id !== 'barbershop' && id !== 'top' && document.getElementById(id);
    const behavior = smooth && !switched ? 'smooth' : 'auto';
    if (target) target.scrollIntoView({ behavior });
    else window.scrollTo({ top: 0, behavior });
  };

  // first load
  const first = decodeURIComponent(location.hash.slice(1));
  setMode(ownerOf(first) || 'salon');
  setLang(lang());
  if (mode === 'barber') {                     // no sunflower entrance on the barbershop
    document.querySelector('.intro')?.remove();
    body.classList.remove('intro-on');
    body.classList.add('is-revealing', 'is-done');
  }

  // in-page links
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setMenu(false);
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (location.hash.slice(1) !== id) history.pushState(null, '', id === 'top' ? location.pathname : '#' + id);
    go(id, true);
  });
  addEventListener('popstate', () => go(decodeURIComponent(location.hash.slice(1)), false));

  /* ---------- wireframe notes toggle ---------- */
  const toggle = document.querySelector('.wf-toggle');
  if (toggle) {
    const apply = (off) => {
      body.classList.toggle('wf-notes-off', off);
      toggle.setAttribute('aria-pressed', String(!off));
      toggle.textContent = 'Wireframe notes: ' + (off ? 'off' : 'on');
    };
    apply(localStorage.getItem('anais-wf-notes') === 'off');
    toggle.addEventListener('click', () => {
      const off = !body.classList.contains('wf-notes-off');
      localStorage.setItem('anais-wf-notes', off ? 'off' : 'on');
      apply(off);
    });
  }
})();
