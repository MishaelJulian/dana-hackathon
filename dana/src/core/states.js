/**
 * states.js — loading / empty / error UI on the timing ladder.
 * No dependencies. Honors prefers-reduced-motion. aria-live for AT.
 *
 * Timing ladder (Dana spec):
 *   <1s   → nothing (caller just shows the result)
 *   ~0.8s → plain spinner        (covers the "phone is thinking" gap before a stare sets in)
 *   ~5s   → spinner + static text
 *   ~10s  → spinner + live step text + progress bar (real steps, not decorative)
 *   >15s  → non-technical error (still works offline — "wait and try again")
 *
 * ponytail: one module, escalating setTimeouts; caller calls .done()/.fail()/.step().
 * Verified via the Puppeteer palace-load walkthrough (states mount on the real slow path).
 */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Start a loading state that escalates on the ladder.
 * @param {HTMLElement} container - element to render the state into (cleared).
 * @param {{steps?: string[], label?: string, errorTitle?: string, errorHint?: string}} opts
 * @returns {{done: Function, fail: Function, step: Function}}
 */
export function startLoading(container, opts = {}) {
  const {
    steps = [],
    label = 'در حال آماده‌سازی…',
    errorTitle = 'این بخش الان باز نشد',
    errorHint = 'اینترنت لازم نیست — چند لحظه صبر کن و دوباره امتحان کن.',
  } = opts;

  container.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'state state--loading';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.hidden = true; // <1s: show nothing
  container.appendChild(el);

  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  let stepIdx = 0;

  at(800, () => { el.hidden = false; el.innerHTML = spinner(); });
  at(5000, () => { el.innerHTML = spinner() + text(label); });
  at(10000, () => {
    if (steps.length) {
      el.innerHTML = spinner() + `<p class="state__text" id="state-step">${steps[0]}</p>` + bar(pct(0, steps.length));
      stepIdx = 1;
      tick();
    } else {
      el.innerHTML = spinner() + text(label) + bar(60);
    }
  });
  at(15000, () => finish('fail'));

  function tick() {
    if (stepIdx >= steps.length) return;
    const s = el.querySelector('#state-step');
    const f = el.querySelector('.state__bar-fill');
    if (s) s.textContent = steps[stepIdx];
    if (f) f.style.width = pct(stepIdx, steps.length);
    stepIdx++;
    at(1200, tick);
  }

  function finish(kind, errorNode) {
    timers.forEach(clearTimeout);
    if (kind === 'done') {
      el.remove();
    } else {
      el.hidden = false;
      el.className = 'state state--error';
      el.setAttribute('role', 'alert');
      el.innerHTML = errorNode
        ? ''
        : `<p class="state__title">${errorTitle}</p><p class="state__hint">${errorHint}</p>`;
      if (errorNode) el.appendChild(errorNode);
    }
  }

  return {
    done: () => finish('done'),
    fail: (node) => finish('fail', node),
    step: (t) => { const s = el.querySelector('#state-step'); if (s) s.textContent = t; },
  };
}

/**
 * Render an empty state (zero results / nothing yet). Designed for children:
 * supportive and clear, never a dead-end.
 */
export function showEmpty(container, { title, hint = '', icon = '' } = {}) {
  container.innerHTML = `
    <div class="state state--empty" role="status">
      ${icon ? `<div class="state__icon" aria-hidden="true">${icon}</div>` : ''}
      <p class="state__title">${title}</p>
      ${hint ? `<p class="state__hint">${hint}</p>` : ''}
    </div>`;
}

/**
 * Render an error state. Every error = what happened + a next step, non-technical,
 * never a generic "something went wrong", never silent. Built with textContent (no XSS).
 */
export function showError(container, { title, hint = '' } = {}) {
  container.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'state state--error';
  box.setAttribute('role', 'alert');
  const h = document.createElement('p');
  h.className = 'state__title';
  h.textContent = title;
  box.appendChild(h);
  if (hint) {
    const p = document.createElement('p');
    p.className = 'state__hint';
    p.textContent = hint;
    box.appendChild(p);
  }
  container.appendChild(box);
}

// --- helpers ---
const pct = (i, n) => `${Math.round(((i + 1) / n) * 100)}%`;
const text = (t) => `<p class="state__text">${t}</p>`;
const bar = (p) =>
  `<div class="state__bar" aria-hidden="true"><div class="state__bar-fill" style="width:${typeof p === 'number' ? p + '%' : p}"></div></div>`;
const spinner = () =>
  REDUCED
    ? `<div class="state__dot" aria-hidden="true"></div>`
    : `<div class="state__spinner" aria-hidden="true"></div>`;
