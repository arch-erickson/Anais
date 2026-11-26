# ANAÍS website: design requests and design audit

Three parts:
1. **What you asked for**: every design change requested so far, in order.
2. **The design intent**: the rules those requests add up to.
3. **The audit**: places on the site today that still break those rules, ranked, with the fix for each.

---

## 1. Design changes you asked for

**Structure and navigation**
1. The salon comes first; its main service is hair color, and it also offers every other salon service. The barbershop is secondary.
2. Menu: Book appointment, Stylists, Services, Gallery, Barbershop. Tapping Barbershop switches the whole site to Barbers, Services, Gallery, Salon.
3. Header for phones first: ES | EN on the left (Spanish by default), logo in the center, menu button on the right.
4. The menu slides in from the right as words on filled bars, without covering the page.
5. Every topic gets its own page instead of one long scroll (Stylists, Services, Gallery, Book…).
6. The Stylists and Barbers pages are a grid of photo and name. Tapping a person opens their own page with their details and a **Chat on WhatsApp** button.

**Look**
7. Salon: cream background with gold. Barbershop: black background with gold. You tried a black salon and a gold barbershop, and rejected both.
8. The Color Studio photo is a 4-photo collage.
9. Every section fits one screen; no scrolling several times within one section. **Relaxed by Erickson on 25 Nov 2026:** "It's okay to space the sections better. No need to compress everything so much. Feels too heavy. Instead make it feel curated and properly spaced like a high end design." Sections are no longer squeezed to fit one screen.
10. No sideways scrolling anywhere.
11. No rounded corners on buttons.
12. Buttons on a person's page run from the left edge to the right edge.
13. The booking page uses the simple sans-serif font. Only the "Reserva tu cita" title keeps the decorative serif.
14. Photo style: a blurred black-and-white background, with the hair saturated, vivid and sharp.

**WhatsApp-first contact**
15. No prices on the site. First "Call for price", then replaced by a link to ask for prices on WhatsApp.
16. No phone number on Services; a WhatsApp link instead.
17. A floating WhatsApp button at the bottom right goes to the main number.
18. Booking ends by sending a WhatsApp request to the stylist, who confirms it. Clients can also message any stylist directly.

**Booking flow**
19. One step at a time: 1 stylist, 2 date and time, 3 service, 4 review and send.
20. A clear **Back** arrow at the bottom, above **Continue**. Continue is grayed out until the step has an answer.
21. Step 1: a grid of photos and names. A selected person gets a 50% black fill and a checkmark.
22. Step 2: a monthly calendar with past days grayed out, and a *preferred* time rather than an exact slot.
23. Step 3: the client picks only the category; details are discussed on WhatsApp.
24. Every step has a "Not sure" option, so clients can always just talk to a stylist.
25. The stylist handles the schedule: every day can be picked, Mondays included, with no salon-hours limits.

**Content and voice**
26. Services include nails (hands and feet).
27. Brand voice: *we specialize in unique hair color, and we're a full-service salon*. Not "color comes first".
28. "How it works" in four clear steps: message us on WhatsApp → come in, booked or walk-in → your new look → follow-up, "see you next time".
29. The services list is grouped into fewer, broader categories with sub-services in dropdowns, instead of every service in one flat list.

---

## 2. The design intent behind those requests

| # | Rule | Comes from requests |
|---|------|---------------------|
| A | **Phone first, with room to breathe.** Nothing scrolls sideways and nothing scrolls inside a section. Sections are spaced generously so the page feels curated and high-end; a section may be taller than the screen, and content is never compressed or boxed up just to make it fit. Booking steps are the exception: Continue stays on screen. | 3, 9, 10 |
| B | **WhatsApp is the front door.** Every point where a client might decide or hesitate offers WhatsApp. No phone numbers and no prices; a person confirms everything. | 15–18, 24, 28 |
| C | **One clear next step.** One task per screen, with the main button full width at the bottom and Back above it. Disabled means gray. Two button styles only: the **gold outline** for the main button of a screen, and a simple button with **no outline and no fill** (just the words) for the rest. No solid gold buttons: Erickson rejected them on 25 Nov 2026. | 12, 19–21 |
| D | **Two fonts, two jobs.** The serif (Cormorant) is for big display titles only. Everything you read or tap is in the sans-serif (Montserrat). | 13 |
| E | **Square shapes.** Buttons, tiles, inputs and tags have square corners. Only icons are round (the WhatsApp bubble, step numbers). | 11 |
| F | **Fewer choices first, details on demand.** Grid → detail page. Broad category → dropdown. | 5, 6, 23, 29 |
| G | **Always an escape hatch.** "Not sure" is always a valid answer and leads to a conversation. | 24 |
| H | **Two worlds, same system.** Salon is cream and gold; barbershop is black and gold. Every pattern exists on both sides. | 2, 7 |
| I | **Voice: unique color specialists, full-service salon.** Warm, short, Spanish first, gender-neutral. | 27, 28 |
| J | **Photography: vivid hair on a quiet black-and-white background.** | 14 |

---

## 3. Design audit: site-wide changes to match that intent

Ranked by how much each one shows. "Where" says the page or element; "Rule" points to section 2.

**Applied 25 Nov 2026** (uncommitted, for review). Each item below starts with its status. Done: 1, 3-13, 16. Rejected by Erickson: 2 (WhatsApp as the hero's main button). Left for a decision or for content: 14, 15, 17. Skipped: 18. Open questions are at the end.

### High: visible on every visit

1. **One button system.** *(Rules C, E)*
   - **Status: Done (25 Nov 2026).** The rule in `css/site.css`, with a comment there to stick with it: `.btn--key`, the **gold outline**, is the main button of a screen (Reservar cita, Continuar, Reservar consulta de color); `.btn`, every other button, is **plain words** with no outline and no fill. No solid gold buttons anywhere. Checked on every page at phone and desktop size, salon and barbershop: at most one gold outline per screen, the rest plain, text at 5.3:1 or better. All buttons share one size, type and square corners, and are full width on phones (327-335 px on a 375 px screen). Continue is grey until the step has an answer. WhatsApp buttons are still solid green (`.btn--wa`): open question below.
   - Today there are three different looks:
     - outlined gold text buttons (home hero, Color Studio, cross-links, barbershop hero)
     - solid gold buttons (booking)
     - solid green and outlined buttons (profile pages)
   - **Decided by Erickson (25 Nov 2026):** two button styles. The **gold outline** button is the main button of a screen. Every other button is **simple: no outline, no fill**, like the old second button of the hero. An earlier reading of this decision ("standard = solid gold") was a mistake; he saw the solid gold buttons on the site and rejected them the same day.
   - Fix, used everywhere: at most one gold outline button per screen, on the main action; every other button is the simple one. Do not introduce solid gold buttons. Both are full width on phones, with square corners. Open question: whether WhatsApp buttons keep their green or follow these two styles.
   - Where: hero "Reservar cita" / "Explorar el color", "Reservar consulta de color", "Visitar la barbería" / "Visitar el salón", barbershop hero, footer "Unirme".

2. **Make the home page follow the 4-step journey.** *(Rules B, C)*
   - **Status: Rejected for the hero by Erickson (25 Nov 2026).** WhatsApp was tried as the hero's main button; he asked for "Reservar cita" back as the main button (gold outline) with "Conoce a las estilistas" below it as the simple one. The barbershop hero mirrors it ("Reservar silla", "Conoce a los barberos"). WhatsApp is the floating button. Kept from this item: both home pages end with a closing section that repeats the hero's pair (book, then meet the team).
   - The hero's main button is "Reservar cita", but step 1 of the journey is "Escríbenos por WhatsApp".
   - Fix: make WhatsApp the main hero button and Book the second one, and use the same pair at the end of the home page.

3. **Contrast is too low for small text.** *(Accessibility)* Measured against the 4.5:1 minimum for normal-size text:
   - **Status: Done.** Measured after the change: selected day / time / category tile, "Especialidad" badge and the menu's "Reservar cita" bar are white on a deeper gold `#8F6326`, 5.3:1 (barbershop: black on `#C9A05A`, 8.1:1). WhatsApp buttons are white on `#117540`, 5.8:1. Green links are `#117540` on cream, 5.1:1 (barbershop `#4CC981` on black, 9.3:1). Gold text is `--gold-deep` `#7E5520` on cream, 5.8:1. Dimmed small labels raised to at least 5:1. The bright green is only on the floating icon. Still under 4.5:1: a disabled Continue button (grey on grey, 3.3:1, exempt as disabled) and the hover colours of the two buttons (about 2.9:1 while hovering).
   - white on the gold button: 3.2:1
   - white on WhatsApp green: 3.5:1
   - green link on cream: 3.1:1
   - gold text on cream: 2.9:1

   Fix: a deeper gold for any filled button or selected tile that has text, and a deeper green for text and button backgrounds. Keep the bright green only on the floating icon. The barbershop's gold on black passes (9.8:1).

4. **The phone number and email are still on the Book page.** *(Rule B)*
   - **Status: Done.** No phone number or email anywhere on the site. "Chatea por WhatsApp" is on the new Visit page.
   - "Contacto: (000) 000-0000 / hello@…" sits under the booking steps.
   - Fix: replace them with a "Chatea por WhatsApp" button.

5. **The Book page is two screens.** *(Rules A, C)*
   - **Added 25 Nov 2026 at Erickson's request:** the Visit page is centred, shows the real address (809 Hunts Point Ave, Bronx, NY 10474) and has a live map in black with beige streets, with the ANAÍS sunflower as the pin (`js/map.js`). The map is drawn with MapLibre on OpenStreetMap data (free, no key); a restyled *Google* map needs a paid Google Maps Platform key, so the pin and "Cómo llegar" open Google Maps instead. Hours are still placeholders.
   - **Status: Done.** "Visítanos" is its own page (`#visit`: address, hours, map, WhatsApp button), linked from the menu and the footer on both sides. The Book page is only the booking steps, centred. Every step fits one screen: the tallest, the calendar in a six-week month, is 804 of 812 px on a phone and 797 of 800 px on a laptop.
   - The address, hours and map sit under the booking steps, so the page keeps going after the task ends.
   - Fix: move "Visítanos" to its own small page (linked from the menu and footer), or to the footer, so Book only books.

### Medium: consistency

6. **Fonts on labels.** *(Rule D)*
   - **Status: Done.** Serif is now only on `h2` titles, the hero line, profile names and review quotes. Step titles, step numbers, the Visit headings and both barbershop logo placeholders are Montserrat.
   - These are still in the serif:
     - the "Visítanos / Horario / Contacto" headings
     - the "How it works" step titles
     - the step numbers
     - the barbershop logo placeholder
   - Keep the serif for page titles, the hero line, profile names and review quotes; switch the rest to the sans-serif.

7. **Gendered words.** *(Rule I)*
   - **Status: Done.** "Todo el equipo" (both sides), "Lo que dicen de nosotros", and also "Especialistas en color, corte y peinado" (was "cortadoras") and "Nombre" under each review (was "Nombre de clienta"). Not changed: the hero's second button, "Conoce a las estilistas", added later in another session; "Conoce al equipo" would match.
   - "Todas las estilistas" (back link on profiles) → "Todo el equipo".
   - "De nuestras clientas" (reviews) → "Lo que dicen de nosotros".
   - Placeholder bios are already neutral; keep real bios neutral unless the person says otherwise.

8. **Grid → detail everywhere.** *(Rule F)*
   - **Status: Done.** Gallery photos, the barbershop's gallery preview and before / after tiles open full screen (`js/lightbox.js`) with "¿Quieres este look? Escríbenos". The WhatsApp message names the photo and carries its address. A tile with several photos gets previous / next.
   - The team grid opens a page, but gallery and before/after tiles don't open anything.
   - Fix: tapping a photo opens it full screen with "¿Quieres este look? Escríbenos" (WhatsApp).

9. **Links that should open the right dropdown.** *(Rule F)*
   - **Status: Done.** "Ver menú de color" opens Services with Color open. Every category has its own address (`#menu-color`, `#menu-nails`, `#barber-menu-cuts` ...), so any future link can do the same.
   - "Ver menú de color" (Color Studio) and the service links should land on Services with that category already open.

10. **The floating WhatsApp button covers content.** *(Rule A)*
    - **Status: Done.** 96 px of empty space under the footer on phones. At the end of every page the last line now stops 24 px above the button (it used to sit under it). The hero's buttons also stop 16 px above it.
    - On phones it covers the right end of the last row on long pages (e.g. the last services row, the footer).
    - Fix: about 80 px of empty space at the bottom of each page on phones.

11. **Tap targets.** *(Accessibility)*
    - **Status: Done.** Calendar days are 44 x 42 px on phones (were 34 x 34), 44 x 44 on tablets, 44 x 36 on short laptop screens; the month arrows are 44 x 40. The step still fits one phone screen.
    - Calendar days are 34 × 34 px; the usual minimum is 44 px.
    - Fix: enlarge to about 42 px. The calendar still fits one screen.

12. **Gallery filters.** *(Rules C, F)*
    - **Status: Done.** Every chip on screen works: Todo (9 photos), Cabello (3), Uñas (6). The five colour chips are hidden until a hair photo is tagged for them (`data-cat="hair blonde"`), then they appear on their own.
    - Only the Nails filter works, per the photo session; the other chips are decoration.
    - Fix: make them all work, or remove them.

### Low: completeness and parity

13. **Barbershop parity.** *(Rule H)*
    - **Status: Done, except the logo.** The barbershop home now has the 4-step "Cómo funciona", a gallery preview with "Ver la galería", and the closing pair. The logo placeholder stays until the logo exists (item 18).
    - The barbershop home is only the hero and the link back to the salon.
    - Fix: add the 4-step "How it works" and a gallery preview, and replace the round logo placeholder once the logo exists.

14. **Footer sign-up.** *(Rule B)*
    - **Status: Left: Erickson's decision** (WhatsApp offers or email newsletter). Only the "Unirme" button changed, to the plain button style.
    - "Ofertas y novedades" collects email addresses.
    - Decide: switch it to "Recibe ofertas por WhatsApp", or keep email for newsletters.

15. **Hours.** *(Rule B)*
    - **Status: Left: needs the salon's real hours, or Erickson's choice of the "según tu estilista" line.** The placeholder hours moved to the Visit page with the rest of that block.
    - The listed hours are placeholders, and booking no longer depends on them.
    - Fix: show real salon hours, or replace the list with "Horario según tu estilista · escríbenos por WhatsApp".

16. **One screen per section, re-check on desktop** after the new services dropdowns and team grid. An open services category may run past the screen on purpose; only one stays open at a time.
    - **Superseded on 25 Nov 2026 by the relaxed rule A.** The one-screen figures in this status and in items 5, 10 and 11 describe the site before the spacing change. Now: 88 px above and below each section on phones (was 40-56), 24 px side margins, more room between a title, its text and its buttons; on desktop about 96 px above and below each section at 800 px tall (was 56). Home sections on a phone run 420-1,100 px. The booking calendar keeps Continue on screen in a five-week month (800 of 812 px) and scrolls 33 px in a six-week month; days are 44 x 44.
    - **Status: Done.** At 1280 x 800 every section fits (limit 732 px under the header, 800 px for a page's first screen): salon home 800 / 724 / 601 / 465 / 431 / 380 / 260, barbershop home 800 / 441 / 487 / 380 / 260, Stylists 652, profile 755, Services 785 (was 865), Gallery 765, Book 797 at its tallest (was 959), Visit 632. Same result in English.

17. **Photos.** *(Rule J)*
    - **Status: Left: nothing to change until real photos arrive.** The rule stands for the collage, team, gallery and before / after photos.
    - When real photos replace the placeholders (collage, team, gallery, before/after), use the same treatment as the 44 edited photos: blurred black-and-white background, vivid hair.

18. **Placeholders still waiting on the salon** (not design, but they block a final review):
    - **Status: Skipped on purpose:** waits on the salon.
    - every WhatsApp number (currently +1 555 010 00xx)
    - stylist and barber names, photos and bios
    - which days walk-ins are welcome, and when the follow-up message is sent
    - the barbershop name and logo
    - confirming the nail list and the Brows & lashes category

### Open questions after applying the audit

1. **WhatsApp buttons: green or the two styles?** They are still solid green ("Chatea por WhatsApp" on profiles and Visit, "Enviar por WhatsApp" in booking, "¿Quieres este look?" on photos). Deleting the `.btn--wa` rules in `css/site.css` turns them into gold outline buttons.
2. **"Conoce a las estilistas"** in the hero (Erickson's wording) is gendered, and item 7 removes that wording elsewhere. Keep it as he said it, or use "Conoce al equipo" as the closing section does?
3. **Button hover colours** (gold text, and cream on gold for the outline button, as before the audit) are about 2.9:1 while hovering. Use the deeper gold on hover?
4. **Footer sign-up** (item 14) and **hours** (item 15) still need a decision.
5. **Menu:** "Visítanos" was added between Galería and Barbería / Salón. Keep it in the menu, or footer only?

---

## 4. Screens: which layout each device gets (audit of 25 Nov 2026)

Erickson asked for a phone-landscape audit and an iPad audit: iPad upright should feel like the phone, iPad sideways should be the desktop version.

| Screen | Layout | Checked at |
|---|---|---|
| Phone upright | Mobile: one column, photo hero with the text over it, full-width buttons | 375 x 812 |
| iPad upright | Mobile, in one centred column 680 px wide, bigger titles, buttons capped at 440 px | 768 x 1024, 820 x 1180 |
| iPad sideways | Desktop, unchanged | 1024 x 768, 1180 x 820, 1366 x 1024 |
| Computer | Desktop | 1280 x 800 |
| Phone sideways | Desktop columns, re-measured for a screen about 375 px tall | 667 x 375, 844 x 390, 932 x 430 |

The two media queries that decide this are written out at the top of `css/sections.css`.

**What was wrong on a phone held sideways, and is fixed**
- The menu's last bar (Barbería / Salón) fell below the screen and could not be reached: it ended at 413 px on a 375-390 px screen. Now it ends at 289 px.
- On the widest phones the hero was 560 px tall on a 430 px screen, with its buttons below the fold. Now the hero is exactly one screen at every size, with the text beside the photo.
- The header took 68 of 375 px; it is 52 px there now.
- Profile photos were squashed to 127-182 px tall; they are at least 240 px.
- In the photo viewer the photo shrank to about 103 x 137 px; it now sits beside its caption and button at about 257 x 343 px.
- The steps, reviews, Color Studio and before / after sections stacked in one very long column (up to 1,259 px for one section); they now use two to four columns.
- Booking: step 1 is one row of people, step 2 has the calendar beside the time, step 4 has the summary beside the fields.
- The barbershop footer was 24 px wider than a 667 px screen (the only sideways scroll found). Fixed.

**What was wrong on an iPad, and is fixed**
- Upright, an iPad got a mix: the phone's hero with desktop spacing, a three-across team grid with 212 x 440 px portraits, and a two-column profile with a 290 x 640 px photo. It is now the mobile layout throughout.
- Sideways it already matched the desktop and still does: same columns, same hero.

**Not checkable in the preview** (it has a mouse, not a touch screen): the 12.9-inch iPad upright (1024 px wide) is sent to the mobile layout by a touch-screen test, and touch screens keep 44 px calendar days where laptops get 36 px.

## 5. Other changes of 25 Nov 2026

- **Map pin:** the gold sunflower photo from the entrance animation, turning once every 30 seconds. The two streets that meet at the salon, Hunts Point Avenue and Lafayette Avenue, are named in larger letters and placed before any other street name.
- **Color Studio:** the four placeholders are now four photos of the salon's own colour work (copper, golden blonde, caramel balayage, cherry red), cropped to the hair. They still need the house treatment (item 17).
- **Team: placeholders.** Names are invented: Anaís, Carolina, Yaritza, Marisol; Ángel, Manny, Luis. All seven portraits are free-licence stock headshots from unsplash.com (Erickson, 25 Nov 2026: "use headshots from online ... placeholders for now"); they are not the salon's people. The photo pages are listed in a comment above the team grid in `index.html`. Names and photos must both be replaced before launch (item 18).
