/* ANAÍS: appointment requests over WhatsApp.
   Four steps, one at a time, with Back above Continue at the bottom:
     1 stylist (photo grid)   2 day (calendar) + preferred time   3 service category   4 review
   Every step has a "not sure yet" choice. Continue stays grey until the step has an answer.
   Send opens WhatsApp addressed to the chosen stylist (or the front desk when the client isn't
   sure who) with the request written out; the stylist replies to confirm. Nothing is stored.

   What it lists comes from the page itself, so there is one place to edit:
   - people:     the cards on the Stylists / Barbers pages (data-staff, data-whatsapp, h3, and an
                 <img> once there is a real photo)
   - categories: the category headings on the Services pages
   - front desk: data-wa-salon / data-wa-barber on the form
   Each stylist runs their own schedule, so every day is open here and the time is only a preferred
   part of the day; the stylist confirms the exact time on WhatsApp.

   Also handles the WhatsApp links outside the form: [data-wa] on the stylist cards and the
   floating [data-wa-main] button. */
(() => {
  'use strict';

  const form = document.getElementById('booker');
  if (!form) return;

  /* ---------- settings ---------- */
  const DAYS_AHEAD = 60;          // how far ahead the calendar allows
  const LEAD_MIN = 60;            // today: a part of the day must still have an hour left in it
  const LOCALE = { es: 'es-US', en: 'en-US' };
  // preferred part of the day (no salon hours: the stylist sets the exact time)
  const WINDOWS = [
    { id: 'morning', to: 12, es: 'Mañana', en: 'Morning', hint: ['antes de 12', 'before 12'] },
    { id: 'afternoon', to: 17, es: 'Tarde', en: 'Afternoon', hint: ['12 – 5 p. m.', '12 – 5 pm'] },
    { id: 'evening', to: 22, es: 'Noche', en: 'Evening', hint: ['después de 5', 'after 5'] },
    { id: 'any', to: 22, es: 'Cualquiera', en: 'Any time', hint: ['cualquier hora', 'whenever'] },
  ];

  /* ---------- helpers ---------- */
  const root = document.documentElement;
  const lang = () => (root.lang === 'en' ? 'en' : 'es');
  const $ = (sel, el = form) => el.querySelector(sel);
  const $$ = (sel, el = form) => [...el.querySelectorAll(sel)];
  const slot = (name) => $(`[data-fill="${name}"]`);
  const bi = (es, en) => `<span lang="es">${es}</span><span lang="en">${en}</span>`;
  const t = (es, en) => (lang() === 'en' ? en : es);
  const text = (el) => {                     // visible text of a bilingual element, current language
    const c = el.cloneNode(true);
    c.querySelectorAll(`[lang]:not([lang="${lang()}"]), .badge`).forEach((n) => n.remove());
    return c.textContent.replace(/\s+/g, ' ').trim();
  };
  const waUrl = (number, message) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  const isBarber = () => document.body.classList.contains('is-barber');
  const deskNumber = () => (isBarber() ? form.dataset.waBarber : form.dataset.waSalon);
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fromYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmt = (d, l, opts) => new Intl.DateTimeFormat(LOCALE[l], opts).format(d);
  const both = (d, opts) => bi(fmt(d, 'es', opts), fmt(d, 'en', opts));
  const CHECK = '<svg class="bk-check" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  const UNSURE = { es: 'Aún no sé', en: 'Not sure yet' };

  /* ---------- data read from the page ---------- */
  let staff = [];        // [{ id, wa, nameEl, photo }]
  let cats = [];         // [{ id, el }]
  const readStaff = () => $$(isBarber() ? '#barbers [data-staff]' : '#stylists [data-staff]', document).map((c) => ({
    id: c.dataset.staff, wa: c.dataset.whatsapp, nameEl: c.querySelector('h3'), photo: c.querySelector('img')?.src || null,
  }));
  const readCats = () => $$(isBarber() ? '#barber-services .svc-menu__cat h3' : '#services .svc-menu__cat h3', document)
    .map((h, i) => ({ id: String(i), el: h }));
  const person = (id) => staff.find((p) => p.id === id);

  /* ---------- state ---------- */
  let mode = null;
  let step = 1;
  let state;
  let month;              // first day of the month shown in the calendar
  const reset = () => {
    state = { staff: null, day: null, time: null, dateUnsure: false, cats: new Set(), catUnsure: false };
    const now = new Date();
    month = new Date(now.getFullYear(), now.getMonth(), 1);
    $('#bk-name').value = '';
    $('#bk-first').value = '';
  };
  const valid = (n) => {
    if (n === 1) return !!state.staff;
    if (n === 2) return state.dateUnsure || (!!state.day && !!state.time);
    if (n === 3) return state.catUnsure || state.cats.size > 0;
    if (n === 4) return $('#bk-name').value.trim() !== '';
    return true;
  };

  /* ---------- day / time availability ---------- */
  const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  // every day is open; only today drops the parts of the day that have already gone by
  const windowsFor = (day) => {
    if (day !== ymd(new Date())) return WINDOWS.map((w) => w.id);
    const soonest = new Date().getHours() + new Date().getMinutes() / 60 + LEAD_MIN / 60;
    return WINDOWS.filter((w) => w.to - soonest >= 1).map((w) => w.id);
  };
  const dayOpen = (d) => {
    const start = today0();
    const last = new Date(start); last.setDate(start.getDate() + DAYS_AHEAD);
    return d >= start && d <= last && windowsFor(ymd(d)).length > 0;
  };
  const windowText = (id, l) => {
    const w = WINDOWS.find((x) => x.id === id);
    return id === 'any' ? w[l] : `${w[l]} (${w.hint[l === 'en' ? 1 : 0]})`;
  };

  /* ---------- rendering ---------- */
  const renderStaff = () => {
    const tiles = staff.map((p) => `
      <button type="button" class="bk-person" role="radio" aria-checked="false" data-pick-staff="${p.id}">
        <span class="bk-person__photo">${p.photo ? `<img src="${p.photo}" alt="">` : ''}${CHECK}</span>
        <span class="bk-person__name">${p.nameEl.innerHTML}</span>
      </button>`);
    tiles.push(`
      <button type="button" class="bk-person bk-person--unsure" role="radio" aria-checked="false" data-pick-staff="unsure">
        <span class="bk-person__photo"><span class="bk-person__q" aria-hidden="true">?</span>${CHECK}</span>
        <span class="bk-person__name">${bi(UNSURE.es, UNSURE.en)}</span>
      </button>`);
    slot('staff').innerHTML = tiles.join('');
  };

  const renderCalendar = () => {
    const first = month.getDay();                         // Sunday-first week
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const start = today0();
    const canPrev = month > new Date(start.getFullYear(), start.getMonth(), 1);
    const lastAllowed = new Date(start); lastAllowed.setDate(start.getDate() + DAYS_AHEAD);
    const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= lastAllowed;
    const wk = [...Array(7)].map((_, i) => both(new Date(2026, 1, 1 + i), { weekday: 'narrow' }));   // 1 Feb 2026 is a Sunday
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<span></span>';
    for (let n = 1; n <= days; n++) {
      const d = new Date(month.getFullYear(), month.getMonth(), n);
      const key = ymd(d);
      const open = dayOpen(d);
      const on = key === state.day;
      cells += `<button type="button" class="bk-day${on ? ' is-on' : ''}${key === ymd(start) ? ' is-today' : ''}" data-day="${key}"${open ? '' : ' disabled'} aria-pressed="${on}">${n}</button>`;
    }
    slot('calendar').innerHTML = `
      <div class="bk-cal__head">
        <button type="button" class="bk-cal__nav" data-month="-1"${canPrev ? '' : ' disabled'} aria-label="${t('Mes anterior', 'Previous month')}">‹</button>
        <span class="bk-cal__title">${both(month, { month: 'long', year: 'numeric' })}</span>
        <button type="button" class="bk-cal__nav" data-month="1"${canNext ? '' : ' disabled'} aria-label="${t('Mes siguiente', 'Next month')}">›</button>
      </div>
      <div class="bk-cal__grid">${wk.map((w) => `<span class="bk-cal__wd">${w}</span>`).join('')}${cells}</div>`;
  };

  const renderTimes = () => {
    const ok = state.day ? windowsFor(state.day) : [];
    slot('times').innerHTML = WINDOWS.map((w) => {
      const on = state.time === w.id;
      const hours = bi(w.hint[0], w.hint[1]);
      return `<button type="button" class="bk-time${on ? ' is-on' : ''}" role="radio" aria-checked="${on}" data-time="${w.id}"${ok.includes(w.id) ? '' : ' disabled'}>
        <b>${bi(w.es, w.en)}</b><small>${hours}</small></button>`;
    }).join('');
    const u = $('[data-unsure="2"]');
    u.classList.toggle('is-on', state.dateUnsure);
    u.setAttribute('aria-pressed', String(state.dateUnsure));
  };

  const renderCats = () => {
    const tiles = cats.map((c) => {
      const on = state.cats.has(c.id);
      const h = c.el.cloneNode(true); h.querySelectorAll('.badge').forEach((b) => b.remove());
      return `<button type="button" class="bk-cat${on ? ' is-on' : ''}" aria-pressed="${on}" data-cat="${c.id}">${h.innerHTML}${CHECK}</button>`;
    });
    tiles.push(`<button type="button" class="bk-cat bk-cat--unsure${state.catUnsure ? ' is-on' : ''}" aria-pressed="${state.catUnsure}" data-cat="unsure">${bi(UNSURE.es, UNSURE.en)}${CHECK}</button>`);
    slot('cats').innerHTML = tiles.join('');
  };

  const catNames = () => [...state.cats].sort().map((id) => text(cats.find((c) => c.id === id).el));

  const renderSummary = () => {
    const p = state.staff === 'unsure' ? null : person(state.staff);
    const unsure = bi(UNSURE.es, UNSURE.en);
    const rows = [
      [isBarber() ? bi('Barbero', 'Barber') : bi('Estilista', 'Stylist'), p ? p.nameEl.innerHTML : unsure, 1],
      [bi('Fecha', 'Date'), state.dateUnsure ? unsure
        : `<span class="bk-cap">${both(fromYmd(state.day), { weekday: 'long', day: 'numeric', month: 'long' })}</span><br>${bi(windowText(state.time, 'es'), windowText(state.time, 'en'))}`, 2],
      [bi('Servicio', 'Service'), state.catUnsure ? unsure
        : [...state.cats].sort().map((id) => {
          const h = cats.find((c) => c.id === id).el;
          const inLang = (l) => { const c = h.cloneNode(true); c.querySelectorAll(`[lang]:not([lang="${l}"]), .badge`).forEach((n) => n.remove()); return c.textContent.trim(); };
          return bi(inLang('es'), inLang('en'));
        }).join(', '), 3],
    ];
    slot('summary').innerHTML = rows.map(([k, v, s]) =>
      `<div class="bk-summary__row"><dt>${k}</dt><dd>${v}</dd><button type="button" class="bk-edit" data-goto="${s}">${bi('Cambiar', 'Change')}</button></div>`).join('');
  };

  // selected looks + the Continue / Send button
  const sync = () => {
    $$('[data-pick-staff]').forEach((b) => {
      const on = b.dataset.pickStaff === state.staff;
      b.classList.toggle('is-on', on); b.setAttribute('aria-checked', String(on));
    });
    $('[data-next]').disabled = !valid(step);
    $('[data-send]').disabled = !valid(4);
  };

  /* ---------- steps ---------- */
  const goto = (n, { scroll = true } = {}) => {
    step = n;
    $$('.bk-step').forEach((s) => { s.hidden = Number(s.dataset.step) !== n; });
    slot('step-n').textContent = String(n);
    $$('.bk-progress__bar i').forEach((bar, i) => bar.classList.toggle('is-on', i < n));
    $('[data-back]').hidden = n === 1;
    $('[data-next]').hidden = n === 4;
    $('[data-send]').hidden = n !== 4;
    $('[data-note="4"]').hidden = n !== 4;
    if (n === 2) { renderCalendar(); renderTimes(); }
    if (n === 3) renderCats();
    if (n === 4) renderSummary();
    sync();
    if (scroll) {
      const top = form.getBoundingClientRect().top;
      const header = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 60;
      if (top < header || top > innerHeight * 0.5) scrollTo({ top: scrollY + top - header - 16, behavior: 'smooth' });
    }
  };

  /* ---------- the message ---------- */
  const buildMessage = () => {
    const p = state.staff === 'unsure' ? null : person(state.staff);
    const name = $('#bk-name').value.trim();
    const first = $('#bk-first').value;
    const where = isBarber() ? t('la Barbería de ANAÍS', 'the Barbershop at ANAÍS') : 'ANAÍS';
    const who = p ? text(p.nameEl) : '';
    const role = isBarber() ? t('Barbero', 'Barber') : t('Estilista', 'Stylist');
    const hello = p ? t(`Hola, ${who}.`, `Hi ${who},`) : t('Hola.', 'Hi,');
    const lines = [t(`${hello} Quisiera pedir una cita en ${where}:`, `${hello} I'd like to request an appointment at ${where}:`), ''];
    if (!p) lines.push(`- ${role}: ${t('aún no sé, ¿me recomiendan a alguien?', 'not sure yet, could you recommend someone?')}`);
    if (state.dateUnsure) lines.push(`- ${t('Fecha', 'Date')}: ${t('aún no sé, ¿qué disponibilidad tienen?', 'not sure yet, what availability do you have?')}`);
    else {
      lines.push(`- ${t('Fecha', 'Date')}: ${fmt(fromYmd(state.day), lang(), { weekday: 'long', day: 'numeric', month: 'long' })}`);
      lines.push(`- ${t('Hora preferida', 'Preferred time')}: ${windowText(state.time, lang())}`);
    }
    lines.push(`- ${t('Servicio', 'Service')}: ${state.catUnsure ? t('aún no sé, me gustaría que me aconsejen', 'not sure yet, I\'d like some advice') : catNames().join(', ')}`);
    if (first) lines.push(`- ${t('Primera visita', 'First visit')}: ${first === 'yes' ? t('sí', 'yes') : 'no'}`);
    lines.push(`- ${t('Nombre', 'Name')}: ${name}`);
    lines.push('', t('¿Me confirmas la cita? ¡Gracias!', 'Could you confirm the appointment? Thank you!'));
    return { number: p ? p.wa : deskNumber(), message: lines.join('\n'), who: p ? text(p.nameEl) : t('el salón', 'the salon') };
  };

  /* ---------- events ---------- */
  form.addEventListener('click', (e) => {
    const el = e.target.closest('button, a');
    if (!el || !form.contains(el)) return;
    const d = el.dataset;
    if (d.pickStaff) state.staff = d.pickStaff;
    if (d.month) { month = new Date(month.getFullYear(), month.getMonth() + Number(d.month), 1); renderCalendar(); }
    if (d.day) {
      state.day = d.day; state.dateUnsure = false;
      if (state.time && !windowsFor(d.day).includes(state.time)) state.time = null;
      renderCalendar(); renderTimes();
    }
    if (d.time) { state.time = d.time; state.dateUnsure = false; renderTimes(); }
    if (d.unsure === '2') {
      state.dateUnsure = !state.dateUnsure;
      if (state.dateUnsure) { state.day = null; state.time = null; }
      renderCalendar(); renderTimes();
    }
    if (d.cat) {
      if (d.cat === 'unsure') { state.catUnsure = !state.catUnsure; if (state.catUnsure) state.cats.clear(); }
      else { state.catUnsure = false; state.cats.has(d.cat) ? state.cats.delete(d.cat) : state.cats.add(d.cat); }
      renderCats();
    }
    if ('next' in d && valid(step)) { goto(step + 1); return; }
    if ('back' in d) { goto(step - 1); return; }
    if (d.goto) { goto(Number(d.goto)); return; }
    if ('restart' in d) { restart(); return; }
    sync();
  });
  $('#bk-name').addEventListener('input', sync);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (step !== 4 || !valid(4)) { $('#bk-name').focus(); return; }
    const { number, message, who } = buildMessage();
    const url = waUrl(number, message);
    window.open(url, '_blank', 'noopener');
    slot('done-who').textContent = who;
    slot('done-link').href = url;
    $$('.bk-step, .bk-nav, .bk-progress').forEach((el) => { el.hidden = true; });
    $('.booker__done').hidden = false;
  });

  const restart = () => {
    reset();
    $('.booker__done').hidden = true;
    $$('.bk-nav, .bk-progress').forEach((el) => { el.hidden = false; });
    renderStaff();
    goto(1);
  };

  /* ---------- WhatsApp links outside the form ---------- */
  document.addEventListener('click', (e) => {
    const main = e.target.closest('[data-wa-main]');
    if (main) {
      main.href = waUrl(form.dataset.waSalon, t('Hola, ANAÍS. Tengo una pregunta.', 'Hi ANAÍS, I have a question.'));
      return;
    }
    // "Ask for prices on WhatsApp" on the Services pages: the salon or barbershop front desk
    const desk = e.target.closest('[data-wa-desk]');
    if (desk) {
      desk.href = waUrl(deskNumber(), t('Hola. Quisiera saber el precio de un servicio.', 'Hi, I\'d like to know the price of a service.'));
      return;
    }
    const a = e.target.closest('[data-wa]');
    const card = a && a.closest('[data-staff]');
    if (!card) return;
    const name = text(card.querySelector('h2, h3'));
    const where = card.closest('[data-mode-view="barber"]') ? t('la Barbería de ANAÍS', 'the Barbershop at ANAÍS') : 'ANAÍS';
    a.href = waUrl(card.dataset.whatsapp, t(`Hola, ${name}. Te escribo desde la página de ${where}.`, `Hi ${name}, I'm writing from the ${where} website.`));
  });

  // "Book" on a stylist card opens the Book page with that stylist already chosen
  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-book-staff]')?.closest('[data-staff]');
    if (!card || !person(card.dataset.staff)) return;
    if (!$('.booker__done').hidden) restart();
    state.staff = card.dataset.staff;
    goto(1, { scroll: false });
  });

  /* ---------- salon / barbershop and language ---------- */
  const build = () => {
    mode = isBarber() ? 'barber' : 'salon';
    staff = readStaff();
    cats = readCats();
    reset();
    $('.booker__done').hidden = true;
    $$('.bk-nav, .bk-progress').forEach((el) => { el.hidden = false; });
    renderStaff();
    goto(1, { scroll: false });
  };
  document.addEventListener('anais:route', (e) => { if (e.detail.mode !== mode) build(); });
  const syncLang = () => {
    $$('#bk-first option[data-es]').forEach((o) => { o.textContent = o.dataset[lang()]; });
    if (step === 2) renderCalendar();      // month-nav labels
  };
  document.addEventListener('anais:lang', syncLang);

  build();
  syncLang();
})();
