/**
 * eink.js — E-ink reading mode manager
 * Manages the monochrome, high-contrast reading mode
 * for outdoor daylight legibility and battery economy
 */

export class EinkMode {
  constructor() {
    this.isActive = false;
    this.body = document.body;
  }

  /**
   * Enable E-ink reading mode
   * Applies monochrome, high-contrast styles
   */
  enable() {
    if (this.isActive) return;

    this.body.classList.add('eink-mode');
    this.isActive = true;

    // Set HTML direction to RTL (Persian default)
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'fa');

    console.log('[EinkMode] Enabled');
  }

  /**
   * Disable E-ink reading mode
   * Restores normal colour mode
   */
  disable() {
    if (!this.isActive) return;

    this.body.classList.remove('eink-mode');
    this.isActive = false;

    console.log('[EinkMode] Disabled');
  }

  /**
   * Toggle E-ink mode
   */
  toggle() {
    if (this.isActive) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Check if E-ink mode is active
   */
  getActive() {
    return this.isActive;
  }
}
