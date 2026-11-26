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
9. Every section fits one screen; no scrolling several times within one section.
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
| A | **Phone first, one screen per section.** Nothing scrolls sideways and nothing scrolls inside a section. | 3, 9, 10 |
| B | **WhatsApp is the front door.** Every point where a client might decide or hesitate offers WhatsApp. No phone numbers and no prices; a person confirms everything. | 15–18, 24, 28 |
| C | **One clear next step.** One task per screen, with the main button full width at the bottom and Back above it. Disabled means gray. Two button styles only: the gold outline for the most important action, the standard button for the rest. | 12, 19–21 |
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

### High: visible on every visit

1. **One button system.** *(Rules C, E)*
   - Today there are three different looks:
     - outlined gold text buttons (home hero, Color Studio, cross-links, barbershop hero)
     - solid gold buttons (booking)
     - solid green and outlined buttons (profile pages)
   - **Decided by Erickson (25 Nov 2026):** two button styles are fine. The **gold outline** button is always the most important button on a screen. The **standard** (solid) button is for everything else.
   - Fix, used everywhere: at most one gold outline button per screen, on the single most important action; every other button is the standard one. Both are full width on phones, with square corners. Open question: whether WhatsApp buttons keep their green or follow these two styles.
   - Where: hero "Reservar cita" / "Explorar el color", "Reservar consulta de color", "Visitar la barbería" / "Visitar el salón", barbershop hero, footer "Unirme".

2. **Make the home page follow the 4-step journey.** *(Rules B, C)*
   - The hero's main button is "Reservar cita", but step 1 of the journey is "Escríbenos por WhatsApp".
   - Fix: make WhatsApp the main hero button and Book the second one, and use the same pair at the end of the home page.

3. **Contrast is too low for small text.** *(Accessibility)* Measured against the 4.5:1 minimum for normal-size text:
   - white on the gold button: 3.2:1
   - white on WhatsApp green: 3.5:1
   - green link on cream: 3.1:1
   - gold text on cream: 2.9:1

   Fix: a deeper gold for any filled button or selected tile that has text, and a deeper green for text and button backgrounds. Keep the bright green only on the floating icon. The barbershop's gold on black passes (9.8:1).

4. **The phone number and email are still on the Book page.** *(Rule B)*
   - "Contacto: (000) 000-0000 / hello@…" sits under the booking steps.
   - Fix: replace them with a "Chatea por WhatsApp" button.

5. **The Book page is two screens.** *(Rules A, C)*
   - The address, hours and map sit under the booking steps, so the page keeps going after the task ends.
   - Fix: move "Visítanos" to its own small page (linked from the menu and footer), or to the footer, so Book only books.

### Medium: consistency

6. **Fonts on labels.** *(Rule D)*
   - These are still in the serif:
     - the "Visítanos / Horario / Contacto" headings
     - the "How it works" step titles
     - the step numbers
     - the barbershop logo placeholder
   - Keep the serif for page titles, the hero line, profile names and review quotes; switch the rest to the sans-serif.

7. **Gendered words.** *(Rule I)*
   - "Todas las estilistas" (back link on profiles) → "Todo el equipo".
   - "De nuestras clientas" (reviews) → "Lo que dicen de nosotros".
   - Placeholder bios are already neutral; keep real bios neutral unless the person says otherwise.

8. **Grid → detail everywhere.** *(Rule F)*
   - The team grid opens a page, but gallery and before/after tiles don't open anything.
   - Fix: tapping a photo opens it full screen with "¿Quieres este look? Escríbenos" (WhatsApp).

9. **Links that should open the right dropdown.** *(Rule F)*
   - "Ver menú de color" (Color Studio) and the service links should land on Services with that category already open.

10. **The floating WhatsApp button covers content.** *(Rule A)*
    - On phones it covers the right end of the last row on long pages (e.g. the last services row, the footer).
    - Fix: about 80 px of empty space at the bottom of each page on phones.

11. **Tap targets.** *(Accessibility)*
    - Calendar days are 34 × 34 px; the usual minimum is 44 px.
    - Fix: enlarge to about 42 px. The calendar still fits one screen.

12. **Gallery filters.** *(Rules C, F)*
    - Only the Nails filter works, per the photo session; the other chips are decoration.
    - Fix: make them all work, or remove them.

### Low: completeness and parity

13. **Barbershop parity.** *(Rule H)*
    - The barbershop home is only the hero and the link back to the salon.
    - Fix: add the 4-step "How it works" and a gallery preview, and replace the round logo placeholder once the logo exists.

14. **Footer sign-up.** *(Rule B)*
    - "Ofertas y novedades" collects email addresses.
    - Decide: switch it to "Recibe ofertas por WhatsApp", or keep email for newsletters.

15. **Hours.** *(Rule B)*
    - The listed hours are placeholders, and booking no longer depends on them.
    - Fix: show real salon hours, or replace the list with "Horario según tu estilista · escríbenos por WhatsApp".

16. **One screen per section, re-check on desktop** after the new services dropdowns and team grid. An open services category may run past the screen on purpose; only one stays open at a time.

17. **Photos.** *(Rule J)*
    - When real photos replace the placeholders (collage, team, gallery, before/after), use the same treatment as the 44 edited photos: blurred black-and-white background, vivid hair.

18. **Placeholders still waiting on the salon** (not design, but they block a final review):
    - every WhatsApp number (currently +1 555 010 00xx)
    - stylist and barber names, photos and bios
    - which days walk-ins are welcome, and when the follow-up message is sent
    - the barbershop name and logo
    - confirming the nail list and the Brows & lashes category
