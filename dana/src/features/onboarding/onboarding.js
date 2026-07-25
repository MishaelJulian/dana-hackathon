/**
 * onboarding.js — "Future Self" onboarding quest
 *
 * "Instead of a registration form: an interactive, deterministic
 * 'what do you want to be as an adult?' quest that builds the
 * user's first Mind-Palace room and charts a learning trajectory."
 *
 * Based on Hayy ibn Yaqzan — the self-taught child on an island
 * who reasons his way to knowledge from first principles.
 *
 * Deterministic, no AI. Each step is authored.
 */

const STORAGE_KEY = 'dana-onboarding';
const VERSION = 1;

/**
 * The quest steps — each is an authored moment, not generated
 */
const STEPS = [
  {
    id: 'welcome',
    type: 'narrative',
    title: 'به دانا خوش آمدی',
    text: 'قبل از شروع، می‌خواهم تو را بهتر بشناسم. چند سوالم دارد — فقط صادق باش.',
    illustration: '🌅',
    next: 'name',
  },
  {
    id: 'name',
    type: 'input',
    title: 'نام تو',
    text: 'چه اسمی داری؟ (یا هر اسمی که می‌خواهی صدات کنیم)',
    placeholder: 'نام...',
    field: 'name',
    next: 'age',
  },
  {
    id: 'age',
    type: 'choice',
    title: 'سن تو',
    text: 'چند سالته؟',
    options: [
      { label: '۱۰-۱۲', value: '10-12' },
      { label: '۱۳-۱۵', value: '13-15' },
      { label: '۱۶-۱۸', value: '16-18' },
      { label: 'بزرگ‌تر', value: '18+' },
    ],
    field: 'age',
    next: 'future',
  },
  {
    id: 'future',
    type: 'choice',
    title: 'آینده‌ات',
    text: 'وقتی بزرگ شدی، دوست داری چه کاره شوی؟',
    options: [
      { label: '🔬 دانشمند', value: 'scientist', room: 'science' },
      { label: '🎨 هنرمند', value: 'artist', room: 'art' },
      { label: '💻 مهندس', value: 'engineer', room: 'tech' },
      { label: '📚 معلم', value: 'teacher', room: 'education' },
      { label: '🌍 فعال اجتماعی', value: 'activist', room: 'society' },
      { label: '✍️ نویسنده', value: 'writer', room: 'literature' },
    ],
    field: 'future',
    next: 'curiosity',
  },
  {
    id: 'curiosity',
    type: 'choice',
    title: 'کنجکاوی تو',
    text: 'چه چیزی بیشتر از همه کنجکاوت می‌کند؟',
    options: [
      { label: '🦁 حیوانات', value: 'animals', course: 'nature' },
      { label: '⭐ آسمان و ستارگان', value: 'stars', course: 'nature' },
      { label: '🧮 اعداد و معماها', value: 'math', course: 'math' },
      { label: '📰 اخبار و رسانه', value: 'media', course: 'literacy' },
      { label: '🏛️ تاریخ و فرهنگ', value: 'history', course: 'nature' },
      { label: '💻 کامپیوتر و اینترنت', value: 'computers', course: 'literacy' },
    ],
    field: 'curiosity',
    next: 'place',
  },
  {
    id: 'place',
    type: 'narrative',
    title: 'باغ تو',
    text: 'حالا می‌دانم تو کی هستی. باغ تو در حال رشد است...',
    illustration: '🌱',
    next: 'room',
  },
  {
    id: 'room',
    type: 'room-builder',
    title: 'اتاق تو',
    text: 'اولین اتاق کاخ ذهن تو ساخته شد. اینجا شروع می‌کنی.',
    next: 'done',
  },
  {
    id: 'done',
    type: 'narrative',
    title: 'شروع کن',
    text: 'آماده‌ای؟ اولین قدم را بردار.',
    illustration: '🚪',
    action: 'enter-app',
  },
];

/**
 * Room configurations based on future choice
 */
const ROOMS = {
  science: {
    name: 'اتاق علوم',
    icon: '🔬',
    color: '#1a237e',
    courses: ['nature', 'math'],
    description: 'دنیا را کشف کن — از اتم تا کهکشان',
  },
  art: {
    name: 'اتاق هنر',
    icon: '🎨',
    color: '#880e4f',
    courses: ['nature', 'literature'],
    description: 'زیبایی را ببین و بساز',
  },
  tech: {
    name: 'اتاق فناوری',
    icon: '💻',
    color: '#006064',
    courses: ['math', 'literacy'],
    description: 'ابزارهای آینده را یاد بگیر',
  },
  education: {
    name: 'اتاق آموزش',
    icon: '📚',
    color: '#33691e',
    courses: ['literacy', 'nature'],
    description: 'دیگران را راهنمایی کن',
  },
  society: {
    name: 'اتاق جامعه',
    icon: '🌍',
    color: '#bf360c',
    courses: ['literacy', 'nature'],
    description: 'تغییر را شروع کن',
  },
  literature: {
    name: 'اتاق ادبیات',
    icon: '✍️',
    color: '#4a148c',
    courses: ['literature', 'math'],
    description: 'با کلمات دنیا را بساز',
  },
};

export class Onboarding {
  constructor() {
    this.state = this.load();
    this.currentStep = null;
    this.onComplete = null;
  }

  /**
   * Load state from localStorage
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.version === VERSION) return data;
      }
    } catch {}
    return this.defaultState();
  }

  defaultState() {
    return {
      version: VERSION,
      completed: false,
      currentStepId: 'welcome',
      answers: {},
      room: null,
      startTime: null,
      completionTime: null,
    };
  }

  /**
   * Check if onboarding is complete
   */
  isComplete() {
    return this.state.completed;
  }

  /**
   * Get the current step
   */
  getCurrentStep() {
    if (this.state.completed) return null;
    return STEPS.find(s => s.id === this.state.currentStepId) || null;
  }

  /**
   * Get the user's room configuration
   */
  getRoom() {
    return this.state.room ? ROOMS[this.state.room] : null;
  }

  /**
   * Get recommended courses based on answers
   */
  getCourses() {
    if (!this.state.room) return [];
    const room = ROOMS[this.state.room];
    return room ? room.courses : [];
  }

  /**
   * Submit an answer for the current step
   * @param {string} value - The selected/inputted value
   */
  submitAnswer(value) {
    const step = this.getCurrentStep();
    if (!step) return;

    if (!this.state.startTime) {
      this.state.startTime = new Date().toISOString();
    }

    // Save answer
    if (step.field) {
      this.state.answers[step.field] = value;
    }

    // Determine room from future choice
    if (step.id === 'future' && step.options) {
      const option = step.options.find(o => o.value === value);
      if (option?.room) {
        this.state.room = option.room;
      }
    }

    // Move to next step
    if (step.next === 'done') {
      this.complete();
    } else {
      this.state.currentStepId = step.next;
    }

    this.save();
  }

  /**
   * Complete onboarding
   */
  complete() {
    this.state.completed = true;
    this.state.completionTime = new Date().toISOString();
    this.save();

    if (this.onComplete) {
      this.onComplete(this.state);
    }
  }

  /**
   * Save state to localStorage
   */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('[Onboarding] Save failed:', e);
    }
  }

  /**
   * Reset onboarding (for testing)
   */
  reset() {
    this.state = this.defaultState();
    this.save();
  }
}
