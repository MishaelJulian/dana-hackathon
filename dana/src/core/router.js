/**
 * router.js — Simple client-side router
 * Hash-based routing for SPA navigation
 */

export class Router {
  constructor() {
    this.routes = new Map();
    this.history = [];
    this.current = null;

    // Listen for hash changes
    window.addEventListener('hashchange', () => this.onHashChange());

    // Handle initial route
    if (window.location.hash) {
      this.onHashChange();
    }
  }

  register(name, handler) {
    this.routes.set(name, handler);
  }

  navigate(name, addToHistory = true) {
    if (!this.routes.has(name)) {
      console.warn(`[Router] Route "${name}" not registered`);
      return;
    }

    if (addToHistory && this.current) {
      this.history.push(this.current);
    }

    this.current = name;
    window.location.hash = name;

    // Execute handler
    const handler = this.routes.get(name);
    if (handler) {
      handler();
    }
  }

  back() {
    if (this.history.length > 0) {
      const previous = this.history.pop();
      this.current = previous;
      window.location.hash = previous;

      const handler = this.routes.get(previous);
      if (handler) {
        handler();
      }
    } else {
      this.navigate('landing', false);
    }
  }

  onHashChange() {
    const hash = window.location.hash.slice(1) || 'landing';
    const handler = this.routes.get(hash);

    if (handler) {
      this.current = hash;
      handler();
    }
  }

  getCurrent() {
    return this.current;
  }
}
