/* ANAÍS: photo viewer.
   Tapping a gallery photo, a gallery preview photo or a before / after photo opens it full
   screen, with one button: "Want this look? Message us" on WhatsApp (the salon's front desk, or
   the barbershop's for barbershop photos). The message names the photo, so the salon knows which
   look the client means.

   A tile that holds several photos of the same work (js/gallery.js) opens on the one showing and
   gets previous / next arrows. Placeholders open too, so the pattern can be tried before the real
   photos are in. The viewer is a <dialog>: Esc, the close button, a tap outside the photo, or the
   phone's back gesture closes it. */
(() => {
  'use strict';

  const box = document.getElementById('lightbox');
  const form = document.getElementById('booker');
  if (!box || !box.showModal) return;

  const stage = box.querySelector('[data-lb-stage]');
  const cap = box.querySelector('[data-lb-cap]');
  const nav = box.querySelector('[data-lb-nav]');
  const count = box.querySelector('[data-lb-count]');
  const wa = box.querySelector('[data-lb-wa]');
  const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
  const t = (es, en) => (lang() === 'en' ? en : es);

  // every tile that opens: gallery tiles, gallery preview tiles, before / after figures
  const TILES = '.gallery > *, .gallery-preview > *, .ba > figure';
  document.querySelectorAll(TILES).forEach((tile) => {
    tile.dataset.zoom = '';
    tile.tabIndex = 0;
    tile.setAttribute('role', 'button');
  });

  // text of a bilingual element in the current language; alt text is written "Spanish / English"
  const textOf = (el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll(`[lang]:not([lang="${lang()}"])`).forEach((n) => n.remove());
    return c.textContent.replace(/\s+/g, ' ').trim();
  };
  const altOf = (img) => {
    const parts = (img.alt || '').split(' / ');
    return (parts[lang() === 'en' ? parts.length - 1 : 0] || '').trim();
  };

  let photos = [];        // the <img>s of the open tile (empty for a placeholder)
  let index = 0;
  let caption = '';
  let barber = false;

  const show = () => {
    stage.textContent = '';
    if (photos.length) {
      const img = new Image();
      img.src = photos[index].currentSrc || photos[index].src;
      img.alt = caption;
      stage.append(img);
    }
    nav.hidden = photos.length < 2;
    count.textContent = `${index + 1} / ${photos.length}`;
    cap.textContent = caption;
    // the WhatsApp message: which look, and the photo's address so the salon can open it
    const look = caption ? `: ${caption}` : '';
    const hello = barber
      ? t(`Hola. Les escribo a la Barbería de ANAÍS: quiero este look${look}.`, `Hi, I'm writing to the Barbershop at ANAÍS: I'd like this look${look}.`)
      : t(`Hola, ANAÍS. Quiero este look${look}.`, `Hi ANAÍS, I'd like this look${look}.`);
    const link = photos.length ? '\n' + new URL(photos[index].getAttribute('src'), location.href).href : '';
    const number = form ? (barber ? form.dataset.waBarber : form.dataset.waSalon) : '';
    wa.href = `https://wa.me/${number}?text=${encodeURIComponent(hello + link)}`;
  };

  const open = (tile) => {
    photos = [...tile.querySelectorAll('img')];
    index = Math.max(0, photos.findIndex((img) => img.classList.contains('is-on')));
    barber = !!tile.closest('[data-mode-view="barber"]');
    const figcaption = tile.querySelector('figcaption');
    caption = figcaption ? textOf(figcaption) : (photos.map(altOf).find(Boolean) || '');
    show();
    if (!photos.length) stage.append((tile.querySelector('.ph') || tile).cloneNode(true));   // placeholder
    stage.querySelectorAll('[data-zoom]').forEach((el) => { el.removeAttribute('data-zoom'); el.removeAttribute('tabindex'); el.removeAttribute('role'); });
    box.showModal();
  };

  document.addEventListener('click', (e) => {
    const tile = e.target.closest('[data-zoom]');
    if (tile && !box.open) open(tile);
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-zoom]')) {
      e.preventDefault();
      open(e.target);
    }
  });

  box.addEventListener('click', (e) => {
    const step = e.target.closest('[data-lb-step]');
    if (step) {
      index = (index + Number(step.dataset.lbStep) + photos.length) % photos.length;
      show();
      return;
    }
    // close: the button, or a tap on the dark area around the photo
    if (e.target.closest('[data-lb-close]') || e.target === box || e.target === stage) box.close();
  });
  box.addEventListener('keydown', (e) => {
    if (photos.length < 2) return;
    if (e.key === 'ArrowRight') { index = (index + 1) % photos.length; show(); }
    if (e.key === 'ArrowLeft') { index = (index - 1 + photos.length) % photos.length; show(); }
  });
  // leaving the page (a menu link, the back button) closes the viewer too
  document.addEventListener('anais:route', () => { if (box.open) box.close(); });
})();
