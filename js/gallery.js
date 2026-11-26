/* Gallery: category chips, and tiles that hold several photos of the same work.

   - A .shot with more than one <img> shows them in turn, 3 seconds each (a cross-fade:
     the visible photo has .is-on). Tiles pause while off screen or filtered out.
   - Chips with data-filter show only the tiles whose data-cat has that word ("all" shows
     everything). data-cat can hold several words: data-cat="hair blonde" answers to both the
     Hair chip and the Blonde chip.
   - A chip that no tile answers to stays hidden, so every chip on screen does something. */
(() => {
  'use strict';
  const STEP = 3000;

  // rotation
  const shots = [...document.querySelectorAll('.shot')].filter((s) => s.querySelectorAll('img').length > 1);
  const visible = new Set();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
    }));
    shots.forEach((s) => io.observe(s));
  } else {
    shots.forEach((s) => visible.add(s));
  }
  setInterval(() => {
    if (document.hidden) return;
    visible.forEach((shot) => {
      const imgs = [...shot.querySelectorAll('img')];
      const i = imgs.findIndex((img) => img.classList.contains('is-on'));
      imgs[i].classList.remove('is-on');
      imgs[(i + 1) % imgs.length].classList.add('is-on');
    });
  }, STEP);

  // filters
  document.querySelectorAll('[data-gallery-filter]').forEach((bar) => {
    const grid = bar.parentElement.querySelector('.gallery');
    if (!grid) return;
    const has = (tile, f) => (tile.dataset.cat || '').split(/\s+/).includes(f);
    bar.querySelectorAll('[data-filter]').forEach((c) => {
      const f = c.dataset.filter;
      c.hidden = f !== 'all' && ![...grid.children].some((tile) => has(tile, f));
    });
    bar.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter]');
      if (!chip) return;
      bar.querySelectorAll('[data-filter]').forEach((c) => {
        c.classList.toggle('is-on', c === chip);
        c.setAttribute('aria-pressed', String(c === chip));
      });
      const f = chip.dataset.filter;
      [...grid.children].forEach((tile) => { tile.hidden = f !== 'all' && !has(tile, f); });
    });
  });
})();
