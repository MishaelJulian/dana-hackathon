/**
 * icons.js — flat line icons (24×24, stroke=currentColor). No deps.
 * Why: emoji render as tofu-boxes on old Android font stacks and are announced
 * inconsistently by screen readers. These match the nav chevron grammar already
 * in index.html (fill=none, stroke currentColor, width 2) and the garden's flat style.
 * aria-hidden by default — the button's text/aria-label carries meaning.
 */

const PATHS = {
  library: '<path d="M12 6c-1.5-1-4-1.5-6-1.5S2 5 2 5v13s2-1 4-1 4.5.5 6 1.5"/><path d="M12 6c1.5-1 4-1.5 6-1.5S22 5 22 5v13s-2-1-4-1-4.5.5-6 1.5"/><path d="M12 6v12"/>',
  palace: '<path d="M3 21h18"/><path d="M4 21V9M20 21V9M8 21V9M16 21V9M12 21V9"/><path d="M2 9l10-6 10 6"/>',
  scale: '<circle cx="12" cy="4" r="1.3"/><path d="M12 5v16M7 21h10M5 7h14"/><path d="M5 7l-3 6a3 3 0 0 0 6 0z"/><path d="M19 7l-3 6a3 3 0 0 0 6 0z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13C4 8 8 4 20 4c0 8-4 13-9 13z"/><path d="M4 20c3-4 6-6 10-7"/>',
  media: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
  geometry: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/>',
  moon: '<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-3.5-3.5"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M20 17v3M14 20h.01M17 20h.01M20 20h.01"/>',
  camera: '<rect x="2" y="6" width="20" height="14" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 6l1.5-2h5L16 6"/>',
  edit: '<path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.1 1-1.1 1.8v.4"/><path d="M12 17h.01"/>',
  note: '<path d="M8 4h9a2 2 0 0 1 2 2v9l-5 5H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M14 20v-4a2 2 0 0 1 2-2h4"/>',
};

/** SVG markup string (for template literals). Static content — safe to inject. */
export function icon(name, { size = 24 } = {}) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ''}</svg>`;
}

/** SVG as a DOM node (for replaceChildren, avoids innerHTML at call sites). */
export function iconEl(name, opts) {
  const tpl = document.createElement('template');
  tpl.innerHTML = icon(name, opts);
  return tpl.content.firstElementChild;
}
