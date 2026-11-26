/* ANAÍS: the map on the Visit page.
   A black map with beige streets and the ANAÍS sunflower as the pin, on the salon's address.

   - Drawn with MapLibre GL (open source) on OpenStreetMap data served by OpenFreeMap: both free,
     no account and no key. Google's own map can only be restyled through a paid Google Maps
     Platform key, so the pin and the "Get directions" button open Google Maps instead.
   - The colours are in COLORS below; the place is on the #visit-map element in index.html
     (data-lat, data-lng, data-zoom, data-pin, data-directions, and data-streets: the streets
     that meet at the salon, which are named in larger letters and before any other street).
   - Nothing is downloaded until someone opens the Visit page.
   - On a phone one finger scrolls the page and two fingers move the map; on a computer the
     mouse wheel scrolls the page and Ctrl + wheel zooms the map. */
(() => {
  'use strict';

  const box = document.getElementById('visit-map');
  if (!box) return;

  const VERSION = '5.24.1';
  const CDN = `https://unpkg.com/maplibre-gl@${VERSION}/dist/maplibre-gl`;
  // fingerprints of those two files: the browser refuses them if they ever change
  const SRI = {
    js: 'sha384-nXMl9YiLoSG5KBPTFgvxVuIqQQcqIvo0bFrvoEaGJC6r7IibIzF1S36Zbf/sKBtL',
    css: 'sha384-uTttxo/aOKbdE5RlD/SPzSDoDmNvGlUYPjONi2MN/b7c9HPSvW07OIuyP7uL6jxK',
  };

  const COLORS = {
    land: '#0E0C0A',        // the site's black
    water: '#1D1A15',
    green: '#131510',
    building: '#15120E',
    buildingEdge: '#211D17',
    street: '#E9DDC5',      // beige
    rail: '#5C5546',
    label: '#E9DDC5',
    place: '#9A907B',
  };

  const LINES = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];
  const roads = (classes) => ['all', LINES, ['match', ['get', 'class'], classes, true, false]];
  const width = (stops) => ['interpolate', ['exponential', 1.5], ['zoom'], ...stops];
  const ROUND = { 'line-cap': 'round', 'line-join': 'round' };
  const FONT = ['Noto Sans Regular'];
  const FONT_BOLD = ['Noto Sans Bold'];
  // the streets that meet at the salon: people find the place by this corner, so their names
  // are bigger, repeat more often along the street and are placed before every other name
  const CORNER = (box.dataset.streets || '').split('|').filter(Boolean);
  const isCorner = ['match', ['get', 'name'], CORNER.length ? CORNER : [''], true, false];

  const STYLE = {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: { osm: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
    layers: [
      { id: 'land', type: 'background', paint: { 'background-color': COLORS.land } },
      { id: 'green', type: 'fill', source: 'osm', 'source-layer': 'landcover',
        filter: ['match', ['get', 'class'], ['grass', 'wood'], true, false], paint: { 'fill-color': COLORS.green } },
      { id: 'water', type: 'fill', source: 'osm', 'source-layer': 'water', paint: { 'fill-color': COLORS.water } },
      { id: 'waterway', type: 'line', source: 'osm', 'source-layer': 'waterway', paint: { 'line-color': COLORS.water, 'line-width': 1.2 } },
      { id: 'building', type: 'fill', source: 'osm', 'source-layer': 'building', minzoom: 14,
        paint: { 'fill-color': COLORS.building, 'fill-outline-color': COLORS.buildingEdge } },
      { id: 'rail', type: 'line', source: 'osm', 'source-layer': 'transportation', filter: roads(['rail', 'transit']),
        paint: { 'line-color': COLORS.rail, 'line-width': 1, 'line-dasharray': [4, 3] } },
      { id: 'street-small', type: 'line', source: 'osm', 'source-layer': 'transportation', filter: roads(['minor', 'service', 'track']),
        layout: ROUND, paint: { 'line-color': COLORS.street, 'line-opacity': 0.55, 'line-width': width([12, 0.4, 15, 1.6, 18, 9]) } },
      { id: 'street-main', type: 'line', source: 'osm', 'source-layer': 'transportation', filter: roads(['tertiary', 'secondary', 'primary', 'trunk']),
        layout: ROUND, paint: { 'line-color': COLORS.street, 'line-width': width([10, 0.6, 14, 2.2, 16, 5, 18, 14]) } },
      { id: 'street-highway', type: 'line', source: 'osm', 'source-layer': 'transportation', filter: roads(['motorway']),
        layout: ROUND, paint: { 'line-color': COLORS.street, 'line-width': width([8, 0.8, 14, 3, 16, 7, 18, 18]) } },
      { id: 'street-name', type: 'symbol', source: 'osm', 'source-layer': 'transportation_name', minzoom: 13.5,
        filter: ['!', isCorner],
        layout: { 'symbol-placement': 'line', 'text-field': ['get', 'name'], 'text-font': FONT, 'text-letter-spacing': 0.06,
                  'text-size': ['interpolate', ['linear'], ['zoom'], 14, 10, 17, 13] },
        paint: { 'text-color': COLORS.label, 'text-halo-color': COLORS.land, 'text-halo-width': 2 } },
      { id: 'place-name', type: 'symbol', source: 'osm', 'source-layer': 'place',
        filter: ['match', ['get', 'class'], ['neighbourhood', 'quarter', 'suburb', 'town', 'city'], true, false],
        layout: { 'text-field': ['get', 'name'], 'text-font': FONT, 'text-size': 11, 'text-transform': 'uppercase',
                  'text-letter-spacing': 0.22, 'text-max-width': 8 },
        paint: { 'text-color': COLORS.place, 'text-halo-color': COLORS.land, 'text-halo-width': 1.5 } },
      // last in the list = placed first, so nothing can push these two names off the map
      { id: 'street-name-corner', type: 'symbol', source: 'osm', 'source-layer': 'transportation_name', minzoom: 12, filter: isCorner,
        layout: { 'symbol-placement': 'line', 'symbol-spacing': 110, 'text-field': ['get', 'name'], 'text-font': FONT_BOLD,
                  'text-letter-spacing': 0.05, 'text-padding': 1, 'text-max-angle': 60,
                  'text-size': ['interpolate', ['linear'], ['zoom'], 13, 12, 15, 14.5, 17, 17] },
        paint: { 'text-color': '#F6F1E8', 'text-halo-color': COLORS.land, 'text-halo-width': 2.5 } },
    ],
  };

  const WORDS = {
    es: {
      'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + la rueda del ratón para acercar el mapa',
      'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + desplazamiento para acercar el mapa',
      'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa',
      'NavigationControl.ZoomIn': 'Acercar',
      'NavigationControl.ZoomOut': 'Alejar',
      'AttributionControl.ToggleAttribution': 'Créditos del mapa',
    },
    en: {
      'CooperativeGesturesHandler.WindowsHelpText': 'Use Ctrl + scroll to zoom the map',
      'CooperativeGesturesHandler.MacHelpText': 'Use ⌘ + scroll to zoom the map',
      'CooperativeGesturesHandler.MobileHelpText': 'Use two fingers to move the map',
      'NavigationControl.ZoomIn': 'Zoom in',
      'NavigationControl.ZoomOut': 'Zoom out',
      'AttributionControl.ToggleAttribution': 'Map credits',
    },
  };

  const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
  const place = [Number(box.dataset.lng), Number(box.dataset.lat)];
  let library = null;     // a promise, once the Visit page has been opened
  let map = null;

  const fetchLibrary = () => {
    if (library) return library;
    library = new Promise((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = CDN + '.css'; css.integrity = SRI.css; css.crossOrigin = 'anonymous';
      const js = document.createElement('script');
      js.src = CDN + '.js'; js.integrity = SRI.js; js.crossOrigin = 'anonymous';
      js.onload = () => (window.maplibregl ? resolve(window.maplibregl) : reject(new Error('map library missing')));
      js.onerror = () => reject(new Error('map library did not load'));
      document.head.append(css, js);
    });
    return library;
  };

  const draw = (gl) => {
    if (map) { map.remove(); map = null; }
    map = new gl.Map({
      container: box, style: STYLE, center: place, zoom: Number(box.dataset.zoom) || 15,
      minZoom: 10, maxZoom: 18, cooperativeGestures: true, dragRotate: false, pitchWithRotate: false,
      attributionControl: false, locale: WORDS[lang()],
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new gl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new gl.AttributionControl({ compact: true }), 'bottom-right');

    // the pin: the ANAÍS sunflower; it opens Google Maps with directions to the salon
    const pin = document.createElement('a');
    pin.className = 'map-pin';
    pin.href = box.dataset.directions;
    pin.target = '_blank';
    pin.rel = 'noopener';
    pin.setAttribute('aria-label', lang() === 'en' ? 'ANAÍS: get directions on Google Maps' : 'ANAÍS: cómo llegar en Google Maps');
    const flower = document.createElement('img');
    flower.src = box.dataset.pin;
    flower.alt = '';
    pin.append(flower);
    new gl.Marker({ element: pin, anchor: 'center' }).setLngLat(place).addTo(map);

    map.once('load', () => box.classList.add('is-ready'));     // hides the stand-in underneath
  };

  const show = () => {
    if (document.body.dataset.page !== 'visit') return;
    if (map) { map.resize(); return; }
    fetchLibrary().then(draw).catch(() => { /* the stand-in (pin + "Open in Google Maps") stays */ });
  };

  document.addEventListener('anais:route', show);
  document.addEventListener('anais:lang', () => { if (map && window.maplibregl) draw(window.maplibregl); });
  show();
})();
