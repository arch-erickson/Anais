/* ANAÍS: salon <-> barbershop switch.
   The site is one page with two views. Links to #barbershop (or any barber section) show the
   barbershop; links to #salon (or any salon section) show the salon. Shared sections like #book
   keep whichever view you are in. Runs before intro.js so a direct visit to #barbershop can skip
   the sunflower entrance, which belongs to the salon. */
(() => {
  'use strict';

  const body = document.body;
  const views = {
    salon: document.querySelector('[data-mode-view="salon"]'),
    barber: document.querySelector('[data-mode-view="barber"]'),
  };
  const TITLES = { salon: 'ANAÍS Beauty Empire', barber: 'The Barbershop at ANAÍS' };
  let mode = null;

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
    document.title = TITLES[next];
    return true;
  };

  const go = (id, smooth) => {
    const switched = setMode(ownerOf(id) || mode || 'salon');
    const target = id && id !== 'salon' && id !== 'barbershop' && id !== 'top' && document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: smooth && !switched ? 'smooth' : 'auto' });
    else window.scrollTo({ top: 0, behavior: smooth && !switched ? 'smooth' : 'auto' });
  };

  // first load
  const first = decodeURIComponent(location.hash.slice(1));
  setMode(ownerOf(first) || 'salon');
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
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (location.hash.slice(1) !== id) history.pushState(null, '', id === 'top' ? location.pathname : '#' + id);
    go(id, true);
  });
  addEventListener('popstate', () => go(decodeURIComponent(location.hash.slice(1)), false));

  // wireframe notes toggle
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
