/**
 * onboarding-ui.js — "Future Self" quest UI
 * Renders the onboarding steps as a guided, interactive experience
 */

import { Onboarding } from './onboarding.js';

export class OnboardingUI {
  constructor() {
    this.engine = new Onboarding();
    this.onComplete = null;
  }

  /**
   * Check if onboarding is needed
   */
  needsOnboarding() {
    return !this.engine.isComplete();
  }

  /**
   * Start the onboarding experience
   */
  start(container) {
    if (!container) return;

    this.engine.onComplete = (state) => {
      if (this.onComplete) this.onComplete(state);
    };

    this.render(container);
  }

  /**
   * Render the current step
   */
  render(container) {
    const step = this.engine.getCurrentStep();
    if (!step) {
      this.showCompletion(container);
      return;
    }

    container.innerHTML = `
      <div class="onboarding">
        <div class="onboarding__progress">
          <div class="onboarding__progress-bar" id="onboarding-progress"></div>
        </div>

        <div class="onboarding__step" id="onboarding-step">
          ${this.renderStep(step)}
        </div>
      </div>
    `;

    this.updateProgress();
    this.bindEvents(container, step);
  }

  /**
   * Render a step based on its type
   */
  renderStep(step) {
    switch (step.type) {
      case 'narrative':
        return this.renderNarrative(step);
      case 'input':
        return this.renderInput(step);
      case 'choice':
        return this.renderChoice(step);
      case 'room-builder':
        return this.renderRoomBuilder(step);
      default:
        return '';
    }
  }

  renderNarrative(step) {
    return `
      <div class="onboarding__illustration">${step.illustration || ''}</div>
      <h2 class="onboarding__title">${step.title}</h2>
      <p class="onboarding__text">${step.text}</p>
      <button class="btn btn--primary onboarding__next" id="btn-onboarding-next">
        ادامه
      </button>
    `;
  }

  renderInput(step) {
    const val = this.engine.state.answers[step.field] || '';
    return `
      <h2 class="onboarding__title">${step.title} <span class="form-required" aria-hidden="true">*</span></h2>
      <p class="onboarding__text">${step.text}</p>
      <input
        type="text"
        id="onboarding-input"
        class="onboarding__input"
        placeholder="${step.placeholder || ''}"
        value="${val}"
        aria-label="${step.title}"
        maxlength="24"
        autocomplete="off"
        autofocus
      >
      <div class="form-meta">
        <span class="form-hint" id="onboarding-hint" role="status"></span>
        <span class="form-count" id="onboarding-count">${val.length}/24</span>
      </div>
      <button class="btn btn--primary onboarding__next" id="btn-onboarding-next" disabled>
        ادامه
      </button>
    `;
  }

  renderChoice(step) {
    const currentAnswer = this.engine.state.answers[step.field];
    return `
      <h2 class="onboarding__title">${step.title}</h2>
      <p class="onboarding__text">${step.text}</p>
      <div class="onboarding__options" id="onboarding-options">
        ${step.options.map(opt => `
          <button
            class="onboarding__option ${currentAnswer === opt.value ? 'onboarding__option--selected' : ''}"
            data-value="${opt.value}"
            aria-label="${opt.label}"
          >
            ${opt.label}
          </button>
        `).join('')}
      </div>
    `;
  }

  renderRoomBuilder(step) {
    const room = this.engine.getRoom();
    const answers = this.engine.state.answers;

    return `
      <h2 class="onboarding__title">${step.title}</h2>
      <p class="onboarding__text">${step.text}</p>

      <div class="onboarding__room" id="onboarding-room">
        <div class="onboarding__room-icon" style="background: ${room?.color || '#1F4A3F'}">
          ${room?.icon || '🏛️'}
        </div>
        <h3 class="onboarding__room-name">${room?.name || 'اتاق تو'}</h3>
        <p class="onboarding__room-desc">${room?.description || ''}</p>

        <div class="onboarding__room-details">
          <p><strong>نام:</strong> ${answers.name || 'ناشناس'}</p>
          <p><strong>علاقه:</strong> ${this.getCuriosityLabel(answers.curiosity)}</p>
          <p><strong>دوره‌ها:</strong> ${this.getCourseLabels(room?.courses || [])}</p>
        </div>
      </div>

      <button class="btn btn--primary onboarding__next" id="btn-onboarding-next">
        باغ من
      </button>
    `;
  }

  /**
   * Bind event handlers
   */
  bindEvents(container, step) {
    const nextBtn = container.querySelector('#btn-onboarding-next');
    const input = container.querySelector('#onboarding-input');

    if (step.type === 'input' && input) {
      input.addEventListener('input', () => {
        const len = input.value.trim().length;
        if (nextBtn) nextBtn.disabled = len === 0;
        const count = document.getElementById('onboarding-count');
        if (count) count.textContent = `${input.value.length}/24`;
        const hint = document.getElementById('onboarding-hint');
        if (hint) hint.textContent = (input.value.length > 0 && len === 0) ? 'فقط فاصله کافی نیست' : '';
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
          this.engine.submitAnswer(input.value.trim());
          this.render(container);
        }
      });
    }

    if (step.type === 'choice') {
      container.querySelectorAll('.onboarding__option').forEach(btn => {
        btn.addEventListener('click', () => {
          this.engine.submitAnswer(btn.dataset.value);
          this.render(container);
        });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (step.type === 'input' && input) {
          this.engine.submitAnswer(input.value.trim());
        } else {
          this.engine.submitAnswer(null);
        }
        this.render(container);
      });
    }
  }

  /**
   * Update progress bar
   */
  updateProgress() {
    const bar = document.getElementById('onboarding-progress');
    if (!bar) return;

    const steps = ['welcome', 'name', 'age', 'future', 'curiosity', 'place', 'room', 'done'];
    const currentIndex = steps.indexOf(this.engine.state.currentStepId);
    const progress = ((currentIndex + 1) / steps.length) * 100;

    bar.style.width = `${progress}%`;
  }

  /**
   * Show completion screen
   */
  showCompletion(container) {
    const room = this.engine.getRoom();

    container.innerHTML = `
      <div class="onboarding onboarding--complete">
        <div class="onboarding__illustration">🌳</div>
        <h2 class="onboarding__title">باغ تو آماده است</h2>
        <p class="onboarding__text">
          ${this.engine.state.answers.name || 'دوست عزیز'}،
          اولین اتاق کاخ ذهن تو ساخته شد.
          ${room?.icon || ''} ${room?.name || ''}
        </p>
        <button class="btn btn--primary onboarding__enter" id="btn-onboarding-enter">
          ورود به دانا
        </button>
      </div>
    `;

    container.querySelector('#btn-onboarding-enter')?.addEventListener('click', () => {
      if (this.onComplete) this.onComplete(this.engine.state);
    });
  }

  /**
   * Get curiosity label
   */
  getCuriosityLabel(value) {
    const labels = {
      animals: '🦁 حیوانات',
      stars: '⭐ آسمان و ستارگان',
      math: '🧮 اعداد و معماها',
      media: '📰 اخبار و رسانه',
      history: '🏛️ تاریخ و فرهنگ',
      computers: '💻 کامپیوتر و اینترنت',
    };
    return labels[value] || value || '';
  }

  /**
   * Get course labels
   */
  getCourseLabels(courses) {
    const labels = {
      nature: 'طبیعت ایران',
      math: 'ریاضیات به مثابه بازی',
      literacy: 'سواد دیجیتال و رسانه',
    };
    return courses.map(c => labels[c] || c).join('، ');
  }
}
