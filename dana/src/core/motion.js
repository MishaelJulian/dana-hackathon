/**
 * motion.js — intent-driven motion helpers. No dependencies.
 * Every motion answers a communication need (Rams/Munari discipline, 2GB budget):
 *   - screen transitions live in CSS (compositor-only transform/opacity).
 *   - typewrite = the Jester "speaking", a character-voice reveal, not decoration.
 * All motion honors prefers-reduced-motion (instant fallback).
 */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Reveal text character-by-character (RTL-safe via code-point iteration).
 * @param {HTMLElement} el   target element
 * @param {string} textStr   full text to reveal
 * @param {{cps?: number}} opts  characters per second (default 45, readable)
 * @returns {Promise<void>}
 */
export function typewrite(el, textStr, { cps = 45 } = {}) {
  if (REDUCED || !el) {
    if (el) el.textContent = textStr;
    return Promise.resolve();
  }
  const chars = [...textStr]; // code points, so Persian composes correctly
  el.textContent = '';
  let i = 0;
  const delay = 1000 / cps;
  return new Promise((resolve) => {
    const step = () => {
      el.textContent += chars[i] ?? '';
      i++;
      if (i < chars.length) setTimeout(step, delay);
      else resolve();
    };
    step();
  });
}
