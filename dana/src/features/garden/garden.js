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
        gardenEl.innerHTML = '<div class="garden__ground garden__ground--damp"></div>';
        break;
      case 'worms':
        gardenEl.innerHTML = `
          <div class="garden__ground garden__ground--damp"></div>
          <div class="garden__worms">🐛🐛</div>
        `;
        break;
      case 'sapling':
        gardenEl.innerHTML = `
          <div class="garden__ground"></div>
          <div class="garden__sapling">🌱</div>
        `;
        break;
      case 'plants':
        gardenEl.innerHTML = `
          <div class="garden__ground"></div>
          <div class="garden__plants">🌿🌸🌿</div>
        `;
        break;
      case 'storm':
        gardenEl.innerHTML = `
          <div class="garden__ground"></div>
          <div class="garden__storm">⛈️</div>
          <div class="garden__plants">🌿🌸🌿</div>
        `;
        break;
      case 'tree':
        gardenEl.innerHTML = `
          <div class="garden__ground"></div>
          <div class="garden__tree">🌳</div>
          <div class="garden__plants">🌿🌸🌿🐦</div>
        `;
        break;
    }
  }
}
