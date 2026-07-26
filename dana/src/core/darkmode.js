/**
 * darkmode.js — Dark mode toggle with localStorage persistence
 */

let isDark = localStorage.getItem('dana-theme') === 'dark';

export function initTheme() {
  applyTheme(isDark);
}

export function isDarkMode() {
  return isDark;
}

export function toggleTheme() {
  isDark = !isDark;
  localStorage.setItem('dana-theme', isDark ? 'dark' : 'light');
  applyTheme(isDark);
  return isDark;
}

function applyTheme(dark) {
  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
