# ANAÍS

Website for ANAÍS Beauty Empire: a color-first hair salon with a barbershop under the same roof.

The site is one page with two views:

- **Salon** (default): menu is *Book appointment · Stylists · Services · Barbershop*
- **Barbershop** (`#barbershop`): menu is *Book appointment · Barbers · Services · Salon*, dark palette, logo placeholder until the barbershop logo is made

This is currently a **wireframe**. Grey crossed boxes are photo placeholders, and the orange dashed notes mark decisions still to make (toggle them with the button at the bottom left).

## Run locally

```
python -m http.server 5173
```

Then open http://localhost:5173.

## Files

- `index.html`: all page content (salon view, barbershop view, shared booking + footer)
- `css/site.css`: base palette, header, buttons, hero
- `css/sections.css`: section layouts and the salon/barbershop mode switch
- `css/wireframe.css`: placeholders and decision notes (remove when real content is in)
- `css/intro.css`, `js/intro.js`: sunflower entrance animation (salon only)
- `js/site.js`: ES/EN language toggle (Spanish default), slide-out menu, salon/barbershop switching
- `source/build_logo.py`, `*.svg`, `preview/`: logo and icon sources and exports

## Language

Spanish is the default. Every piece of copy is written twice, side by side:
`<span lang="es">…</span><span lang="en">…</span>`. The ES | EN toggle in the header switches which one shows and remembers the choice.

## Photos

`photos/facebook/` holds salon photos saved from the owner's Facebook (hair, salon, promos, nails, maybe). It is git-ignored, so client photos stay out of the repo until the owner approves which ones go on the site.
