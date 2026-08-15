/**
 * garden.js — Progress garden manager
 * Shows learning progress as a growing garden behind Hafez
 *
 * Design rules from PARDIS_VISUAL.md:
 * - Progress is shown as a garden, not a percentage/streak/leaderboard
 * - Discrete states, swapped — not simulated
 * - Cannot be gamed, does not punish absence
 * - Simply evidence that you were here and something grew
 */

export class Garden {
  constructor() {
    this.state = {
      lessonsStarted: 0,
      modulesCompleted: 0,
      coursesCompleted: 0,
      verificationCount: 0,
      hashtiyehCount: 0,
    };

    this.states = [
      { name: 'empty', minLessons: 0 },
      { name: 'damp', minLessons: 1 },
      { name: 'worms', minLessons: 3 },
      { name: 'sapling', minLessons: 5 },
      { name: 'plants', minLessons: 10 },
      { name: 'storm', minLessons: 15 },
      { name: 'tree', minLessons: 20 },
    ];

    this.currentStateIndex = 0;
  }

  /**
   * Initialise the garden
   */
  init() {
    this.loadState();
    this.render();
    console.log(`[Garden] Initialised at state: ${this.getCurrentState().name}`);
  }

  /**
   * Get current garden state
   */
  getCurrentState() {
    return this.states[this.currentStateIndex];
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const saved = localStorage.getItem('dana-garden-state');
      if (saved) {
        this.state = JSON.parse(saved);
        this.calculateState();
      }
    } catch (e) {
      console.warn('[Garden] Could not load state:', e);
    }
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      localStorage.setItem('dana-garden-state', JSON.stringify(this.state));
    } catch (e) {
      console.warn('[Garden] Could not save state:', e);
    }
  }

  /**
   * Calculate current state based on progress
   */
  calculateState() {
    const totalProgress = this.state.lessonsStarted + this.state.verificationCount;

    for (let i = this.states.length - 1; i >= 0; i--) {
      if (totalProgress >= this.states[i].minLessons) {
        this.currentStateIndex = i;
        break;
      }
    }
  }

  /**
   * Record a lesson started
   */
  recordLessonStart() {
    this.state.lessonsStarted++;
    this.calculateState();
    this.saveState();
    this.render();
  }

  /**
   * Record a module completed
   */
  recordModuleComplete() {
    this.state.modulesCompleted++;
    this.calculateState();
    this.saveState();
    this.render();
  }

  /**
   * Record a course completed
   */
  recordCourseComplete() {
    this.state.coursesCompleted++;
    this.calculateState();
    this.saveState();
    this.render();
  }

  /**
   * Record a verification (catching the Jester)
   */
  recordVerification() {
    this.state.verificationCount++;
    this.calculateState();
    this.saveState();
    this.render();
  }

  /**
   * Record a Hashtiyeh annotation
   */
  recordHashtiyeh() {
    this.state.hashtiyehCount++;
    this.saveState();
  }

  /**
   * Render the garden visual
   *
   * Progress is drawn as flat, geometric SVG silhouettes rather than
   * emoji. Each state must be legible by SHAPE and DENSITY alone —
   * never by colour alone — so the silhouette itself grows across
   * the 7 states (a single dot becomes a small forest).
   *
   * NOTE: all markup injected here is a fixed, hardcoded set of inline
   * SVG strings defined in `gardenIcons` below — there is no
   * user-supplied or remote data interpolated into any of it.
   */
  render() {
    const gardenEl = document.getElementById('garden-state');
    if (!gardenEl) return;

    const state = this.getCurrentState();

    // Apply state-specific styling
    gardenEl.className = `garden-state garden-state--${state.name}`;

    // Update garden visual based on state
    switch (state.name) {
      case 'empty':
        gardenEl.innerHTML = '<div class="garden__ground"></div>';
        break;
      case 'damp':
        gardenEl.innerHTML = `
          <div class="garden__ground garden__ground--damp"></div>
          <div class="garden__seed">${gardenIcons.seed()}</div>
        `;
        break;
      case 'worms':
        gardenEl.innerHTML = `
          <div class="garden__ground garden__ground--damp"></div>
          <div class="garden__worms">${gardenIcons.worm()}${gardenIcons.worm()}</div>
        `;
        break;
      case 'sapling':
        gardenEl.innerHTML = `
          <div class="garden__ground"></div>
          <div class="garden__sapling">${gardenIcons.sprout()}</div>
        `;
        break;
      case 'plants':
        gardenEl.innerHTML = `
          <div class="garden__ground"></div>
          <div class="garden__plants">${gardenIcons.plant()}</div>
        `;
        break;
      case 'storm':
        gardenEl.innerHTML = `
          <div class="garden__ground"></div>
          <div class="garden__storm">${gardenIcons.cloud()}</div>
          <div class="garden__plants">${gardenIcons.bigPlant()}</div>
        `;
        break;
      case 'tree':
        gardenEl.innerHTML = `
          <div class="garden__ground"></div>
          <div class="garden__tree">${gardenIcons.forest()}</div>
        `;
        break;
    }
  }
}

/**
 * Inline SVG illustrations for each garden state.
 * Simple, flat, geometric shapes matching the low-poly / manuscript
 * aesthetic. Fills use the app's colour palette (green / saffron / paper)
 * via CSS custom properties, but shape/density carries the meaning —
 * not colour. Every string below is a static literal (no interpolation
 * of external/user data).
 */
const gardenIcons = {
  // A single seed resting on the ground — smallest, roundest mark
  seed: () => `
    <svg width="20" height="20" viewBox="0 0 20 20" role="img" aria-label="دانه‌ای در خاک">
      <ellipse cx="10" cy="13" rx="5" ry="6" fill="var(--color-green)" />
    </svg>
  `,

  // A curled worm — simple S-shaped stroke
  worm: () => `
    <svg width="28" height="18" viewBox="0 0 28 18" role="img" aria-label="کرم خاکی">
      <path d="M3 14 Q3 5 10 5 Q17 5 17 11 Q17 16 23 16"
            fill="none" stroke="var(--color-saffron)" stroke-width="3.5"
            stroke-linecap="round" />
    </svg>
  `,

  // A sprout: single stem with two flat leaf shapes
  sprout: () => `
    <svg width="40" height="56" viewBox="0 0 40 56" role="img" aria-label="جوانه">
      <rect x="18.5" y="20" width="3" height="34" fill="var(--color-green)" />
      <path d="M20 30 C8 26 6 14 12 8 C20 12 22 24 20 30 Z" fill="var(--color-green)" />
      <path d="M20 38 C32 34 34 22 28 16 C20 20 18 32 20 38 Z" fill="var(--color-green)" />
    </svg>
  `,

  // A small plant cluster: three stems of varying height, flat leaves,
  // one saffron bloom to mark growth without relying on colour alone
  plant: () => `
    <svg width="120" height="70" viewBox="0 0 120 70" role="img" aria-label="گیاهان کوچک">
      <rect x="18" y="30" width="3" height="40" fill="var(--color-green)" />
      <path d="M19.5 40 C8 36 6 24 12 18 C20 22 22 34 19.5 40 Z" fill="var(--color-green)" />
      <path d="M19.5 46 C31 42 33 30 27 24 C19 28 17 38 19.5 46 Z" fill="var(--color-green)" />

      <rect x="58.5" y="14" width="3" height="56" fill="var(--color-green)" />
      <path d="M60 26 C48 22 46 10 52 4 C60 8 62 20 60 26 Z" fill="var(--color-green)" />
      <path d="M60 34 C72 30 74 18 68 12 C60 16 58 28 60 34 Z" fill="var(--color-green)" />
      <circle cx="60" cy="10" r="6" fill="var(--color-saffron)" />

      <rect x="98.5" y="26" width="3" height="44" fill="var(--color-green)" />
      <path d="M100 36 C88 32 86 20 92 14 C100 18 102 30 100 36 Z" fill="var(--color-green)" />
    </svg>
  `,

  // The plant cluster grown fuller/taller — same family of shapes,
  // more leaves and a bloom, standing up to the storm above it
  bigPlant: () => `
    <svg width="140" height="80" viewBox="0 0 140 80" role="img" aria-label="گیاهان تنومند">
      <rect x="20" y="24" width="4" height="56" fill="var(--color-green)" />
      <path d="M22 36 C6 30 4 14 12 6 C22 12 25 28 22 36 Z" fill="var(--color-green)" />
      <path d="M22 46 C38 40 40 24 32 16 C22 22 19 38 22 46 Z" fill="var(--color-green)" />
      <circle cx="22" cy="10" r="6" fill="var(--color-saffron)" />

      <rect x="68.5" y="8" width="4" height="72" fill="var(--color-green)" />
      <path d="M70.5 22 C54 16 51 0 60 -8 C70 -2 73 14 70.5 22 Z" fill="var(--color-green)" />
      <path d="M70.5 32 C87 26 90 10 81 2 C71 8 68 24 70.5 32 Z" fill="var(--color-green)" />
      <path d="M70.5 42 C54 38 51 24 60 16 C70 20 73 34 70.5 42 Z" fill="var(--color-green)" />

      <rect x="116" y="26" width="4" height="54" fill="var(--color-green)" />
      <path d="M118 38 C102 32 99 16 108 8 C118 14 121 30 118 38 Z" fill="var(--color-green)" />
      <circle cx="118" cy="10" r="5" fill="var(--color-saffron)" />
    </svg>
  `,

  // A geometric storm cloud with rain lines — flat shapes, no gradients
  cloud: () => `
    <svg width="100" height="50" viewBox="0 0 100 50" role="img" aria-label="طوفان">
      <ellipse cx="30" cy="20" rx="20" ry="14" fill="var(--color-dim)" />
      <ellipse cx="55" cy="16" rx="24" ry="16" fill="var(--color-dim)" />
      <ellipse cx="78" cy="22" rx="16" ry="12" fill="var(--color-dim)" />
      <line x1="30" y1="38" x2="24" y2="48" stroke="var(--color-green)" stroke-width="2.5" stroke-linecap="round" />
      <line x1="50" y1="38" x2="44" y2="48" stroke="var(--color-green)" stroke-width="2.5" stroke-linecap="round" />
      <line x1="70" y1="38" x2="64" y2="48" stroke="var(--color-green)" stroke-width="2.5" stroke-linecap="round" />
    </svg>
  `,

  // A small forest — three overlapping tree silhouettes of different
  // sizes, the fullest and densest state
  forest: () => `
    <svg width="220" height="120" viewBox="0 0 220 120" role="img" aria-label="جنگل کوچک">
      <rect x="26" y="78" width="8" height="34" fill="#6d4c2f" />
      <polygon points="30,30 54,72 6,72" fill="var(--color-green)" />
      <polygon points="30,48 48,80 12,80" fill="var(--color-green)" />

      <rect x="102" y="66" width="12" height="46" fill="#6d4c2f" />
      <polygon points="108,4 142,60 74,60" fill="var(--color-green)" />
      <polygon points="108,30 134,68 82,68" fill="var(--color-green)" />
      <circle cx="108" cy="16" r="6" fill="var(--color-saffron)" />

      <rect x="180" y="80" width="8" height="32" fill="#6d4c2f" />
      <polygon points="184,36 206,76 162,76" fill="var(--color-green)" />
      <polygon points="184,52 200,82 168,82" fill="var(--color-green)" />
    </svg>
  `,
};
