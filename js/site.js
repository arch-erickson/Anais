/* ANAÍS: site behaviour.
   1. Language: Spanish by default, ES | EN toggle in the header, choice remembered.
   2. Menu: the button on the right slides the menu words in from the right edge.
   3. Salon <-> barbershop: one page, two views. Links to #barbershop (or any barber section) show
      the barbershop; links to #salon (or any salon section) show the salon. Shared sections like
      #book keep whichever view you are in.
   4. Pages: Stylists, Services, Gallery, Book (and the barber ones) are separate pages, one shown
      at a time, instead of one long scroll.
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
  let titleHook = null;                        // set by the pages code below

  const lang = () => (root.lang === 'en' ? 'en' : 'es');

  const setLang = (next) => {
    root.lang = next;
    try { localStorage.setItem('anais-lang', next); } catch (e) {}
    langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === next)));
    document.querySelectorAll('[data-es-placeholder]').forEach((el) => {
      el.placeholder = el.dataset[next + 'Placeholder'];
    });
    if (titleHook) titleHook();
    syncMenuLabel();
    document.dispatchEvent(new CustomEvent('anais:lang', { detail: { lang: next } }));
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
    return true;
  };

  /* ---------- 4. pages ----------
     Each [data-page] block is its own page; only one shows at a time. #salon and #barbershop
     (and #top, the logo) are the two home pages. An id inside a page (like #color on the salon
     home) opens that page and scrolls to it. */
  /* profile pages: one per stylist / barber, built from their card on the Stylists / Barbers page
     (photo, name, and the hidden .person__details: role, specialties, bio). #stylist-1, #barber-2 ... */
  const bi = (es, en) => `<span lang="es">${es}</span><span lang="en">${en}</span>`;
  const textIn = (el, l) => {
    const c = el.cloneNode(true);
    c.querySelectorAll(`[lang]:not([lang="${l}"])`).forEach((n) => n.remove());
    return c.textContent.trim();
  };
  const PROFILE_NAMES = {};
  document.querySelectorAll('.person[data-profile]').forEach((card) => {
    const id = card.dataset.profile;
    const barber = !!card.closest('[data-mode-view="barber"]');
    const list = barber ? 'barbers' : 'stylists';
    const h3 = card.querySelector('h3');
    const sec = document.createElement('section');
    sec.className = 'page sec profile';
    sec.id = id;
    sec.dataset.page = id;
    sec.dataset.staff = card.dataset.staff;
    sec.dataset.whatsapp = card.dataset.whatsapp;
    sec.innerHTML = `
      <a class="profile__back" href="#${list}">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
        ${bi('Todo el equipo', 'The whole team')}</a>
      <div class="profile__body">
        <div class="profile__photo"></div>
        <div class="profile__text">
          <h2>${h3.innerHTML}</h2>
          ${card.querySelector('.person__details').innerHTML}
          <div class="profile__actions">
            <a class="btn btn--key btn--wa" href="#" data-wa target="_blank" rel="noopener">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><use href="#icon-whatsapp"/></svg>
              ${bi('Chatea por WhatsApp', 'Chat on WhatsApp')}</a>
            <a class="btn" href="#book" data-book-staff>${bi('Reservar cita', 'Book appointment')}</a>
          </div>
        </div>
      </div>`;
    sec.querySelector('.profile__photo').append(card.querySelector('img, .ph').cloneNode(true));
    document.getElementById(list).after(sec);
    PROFILE_NAMES[id] = { es: textIn(h3, 'es'), en: textIn(h3, 'en') };
  });

  const pages = [...document.querySelectorAll('[data-page]')];
  const PAGE_NAMES = {
    stylists: { es: 'Estilistas', en: 'Stylists' },
    services: { es: 'Servicios', en: 'Services' },
    gallery: { es: 'Galería', en: 'Gallery' },
    barbers: { es: 'Barberos', en: 'Barbers' },
    'barber-services': { es: 'Servicios', en: 'Services' },
    'barber-gallery': { es: 'Galería', en: 'Gallery' },
    book: { es: 'Reservar', en: 'Book' },
    visit: { es: 'Visítanos', en: 'Visit us' },
  };
  Object.assign(PAGE_NAMES, PROFILE_NAMES);
  const homeOf = (m) => (m === 'barber' ? 'barbershop' : 'salon');
  let page = null;

  // which page does this id open? Unknown ids fall back to the current home page.
  const pageFor = (id) => {
    if (!id || id === 'top') return homeOf(mode || 'salon');
    const el = document.getElementById(id);
    if (!el) return homeOf(mode || 'salon');
    if (el.matches('[data-mode-view]')) return homeOf(el.dataset.modeView);
    return el.closest('[data-page]')?.dataset.page || homeOf(mode || 'salon');
  };

  const syncTitle = () => {
    const name = PAGE_NAMES[page];
    document.title = (name ? name[lang()] + ' · ' : '') + TITLES[mode][lang()];
  };
  titleHook = syncTitle;

  const showPage = (next) => {
    if (next === page) return false;
    page = next;
    body.dataset.page = next;                  // lets CSS adjust per page (e.g. no floating WhatsApp on Book)
    pages.forEach((p) => { p.hidden = p.dataset.page !== next; });
    body.classList.toggle('on-profile', !!pages.find((p) => p.dataset.page === next)?.classList.contains('profile'));
    document.querySelectorAll('.menu a, .footer__nav a').forEach((a) => {
      const target = pageFor(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (target === next && next !== homeOf(mode)) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    syncTitle();
    return true;
  };

  // a link to a services category (#menu-color, #barber-menu-cuts ...) lands on the Services
  // page with that category already open, and the others closed
  const openCategory = (el) => {
    if (!el || !el.matches('.svc-menu__cat')) return false;
    el.parentElement.querySelectorAll('.svc-menu__cat').forEach((cat) => { cat.open = cat === el; });
    return true;
  };

  const go = (id, smooth) => {
    const switchedMode = setMode(ownerOf(id) || mode || 'salon');
    const switchedPage = showPage(pageFor(id));
    const el = id && document.getElementById(id);
    const category = openCategory(el);
    // e.g. #color on the home page. The first category of a menu already sits under the page
    // heading, so the page opens at the top; a later one is scrolled to.
    const inner = el && !el.matches('[data-page], [data-mode-view]') && !(category && !el.previousElementSibling);
    const behavior = smooth && !switchedMode && !switchedPage ? 'smooth' : 'auto';
    if (inner) el.scrollIntoView({ behavior });
    else window.scrollTo({ top: 0, behavior });
    document.dispatchEvent(new CustomEvent('anais:route', { detail: { mode, page } }));
  };

  // first load
  const first = decodeURIComponent(location.hash.slice(1));
  setMode(ownerOf(first) || 'salon');
  showPage(pageFor(first));
  openCategory(first && document.getElementById(first));
  setLang(lang());
  if (page !== 'salon') {                      // the sunflower entrance only plays on the salon home
    document.querySelector('.intro')?.remove();
    body.classList.remove('intro-on');
    body.classList.add('is-revealing', 'is-done');
  }

  // in-page links
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (a.target === '_blank') return;          // WhatsApp links: booking.js fills in the real address
    e.preventDefault();
    setMenu(false);
    let id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (id === 'top') id = mode === 'barber' ? 'barbershop' : '';   // the logo goes to this side's home
    const url = id ? '#' + id : location.pathname;
    if (location.hash.slice(1) !== id) history.pushState(null, '', url);
    go(id, true);
  });
  addEventListener('popstate', () => go(decodeURIComponent(location.hash.slice(1)), false));

  /* ---------- 5. service menus: dropdowns, one category open at a time ----------
     Each category is a <details>; opening one closes the others so the page stays short.
     Services with variations are their own small dropdown inside. */
  document.querySelectorAll('.svc-menu').forEach((list) => {
    const cats = [...list.querySelectorAll('.svc-menu__cat')];
    cats.forEach((cat) => cat.addEventListener('toggle', () => {
      if (cat.open) cats.forEach((other) => { if (other !== cat) other.open = false; });
    }));
  });
})();
