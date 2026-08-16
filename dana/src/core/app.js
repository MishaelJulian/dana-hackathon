/**
 * app.js — Dana application bootstrap
 * Initialises all modules, manages screen transitions
 */

import { Router } from './router.js';
import { startLoading, showEmpty, showError } from './states.js';
import { typewrite } from './motion.js';
import { icon, iconEl } from './icons.js';
import { ZimReader } from '../features/reading/reader.js';
import { EinkMode } from '../features/reading/eink.js';
import { Jester } from '../features/jester/jester.js';
import { Garden } from '../features/garden/garden.js';
import { HashtiyehUI } from '../features/hashtiyeh/hashtiyeh-ui.js';
import { OnboardingUI } from '../features/onboarding/onboarding-ui.js';
import { Palace } from '../features/palace/palace.js';
import { VerificationRegistry } from '../features/verification/registry.js';
import { t, getLang, toggleLang, initLang } from './i18n.js';
import { toggleTheme, initTheme } from './darkmode.js';

class DanaApp {
  constructor() {
    this.router = new Router();
    this.zimReader = null;
    this.einkMode = new EinkMode();
    this.jester = new Jester();
    this.garden = new Garden();
    this.hashtiyeh = new HashtiyehUI();
    this.onboarding = new OnboardingUI();
    this.palace = new Palace();
    this.registry = new VerificationRegistry();
    this.currentArticle = null;

    this.init();
  }

  async init() {
    initLang();
    initTheme();

    await this.initZimReader();
    this.setupNavigation();
    this.setupToggles();
    this.setupReadingScreen();
    this.setupHashtiyeh();
    this.setupEscapeClose();
    this.setupViewToggle();
    this.updateUITranslations();

    this.router.register('landing', () => this.showScreen('screen-landing'));
    this.router.register('reading', () => this.showScreen('screen-reading'));
    this.router.register('palace', () => {
      this.showScreen('screen-palace');
      this.startPalace();
    });
    this.router.register('jester', () => {
      this.showScreen('screen-jester');
      this.startJesterEncounter();
    });

    this.garden.init();

    // Check if onboarding is needed
    if (this.onboarding.needsOnboarding()) {
      this.startOnboarding();
    } else {
      this.router.navigate('landing');
    }

    console.log('[Dana] App initialised');
    console.log(`[Dana] Articles: ${this.zimReader.getArticleCount()}`);
  }

  setupNavigation() {
    const btnBack = document.getElementById('btn-back');
    const btnOpenReader = document.getElementById('btn-open-reader');
    const btnOpenPalace = document.getElementById('btn-open-palace');
    const btnOpenJester = document.getElementById('btn-open-jester');

    btnBack?.addEventListener('click', () => this.router.back());
    btnOpenReader?.addEventListener('click', () => this.router.navigate('reading'));
    btnOpenPalace?.addEventListener('click', () => this.router.navigate('palace'));
    btnOpenJester?.addEventListener('click', () => this.router.navigate('jester'));
  }

  setupToggles() {
    const btnLang = document.getElementById('btn-lang');
    const btnTheme = document.getElementById('btn-theme');

    btnLang?.addEventListener('click', () => {
      toggleLang();
      this.updateUITranslations();
      this.updateLangButton();
      // Re-render current screen content
      if (this.currentArticle) {
        this.selectArticle(this.currentArticle.id);
      }
    });

    btnTheme?.addEventListener('click', () => {
      const isDark = toggleTheme();
      this.updateThemeButton();
    });

    this.updateLangButton();
    this.updateThemeButton();
  }

  updateLangButton() {
    const btnLang = document.getElementById('btn-lang');
    if (btnLang) {
      btnLang.textContent = t('lang.toggle');
      btnLang.setAttribute('aria-label', getLang() === 'fa' ? 'Switch to English' : 'تغییر به فارسی');
    }
  }

  updateThemeButton() {
    const btnTheme = document.getElementById('btn-theme');
    if (btnTheme) {
      const isDark = document.documentElement.classList.contains('dark');
      btnTheme.replaceChildren(iconEl(isDark ? 'sun' : 'moon'));
      btnTheme.setAttribute('aria-label', isDark ? 'Light mode' : 'حالت تاریک');
    }
  }

  updateUITranslations() {
    // Nav
    const navTitle = document.getElementById('nav-title');
    if (navTitle) navTitle.textContent = t('nav.title');

    // Landing
    const btnReader = document.getElementById('btn-open-reader');
    const btnPalace = document.getElementById('btn-open-palace');
    const btnJester = document.getElementById('btn-open-jester');
    const tagline = document.querySelector('.landing__tagline');

    if (btnReader) btnReader.querySelector('.btn__label').textContent = t('landing.library');
    if (btnPalace) btnPalace.querySelector('.btn__label').textContent = t('landing.palace');
    if (btnJester) btnJester.querySelector('.btn__label').textContent = t('landing.jester');
    if (tagline) tagline.textContent = t('landing.tagline');

    // Course filters
    const courseFilters = document.querySelectorAll('.btn--course');
    const courseIcons = [null, 'leaf', 'media', 'geometry'];
    const courseKeys = ['course.all', 'course.nature', 'course.digital', 'course.math'];
    courseFilters.forEach((btn, i) => {
      if (i > 3) return;
      const label = document.createElement('span');
      label.className = 'btn--course-label';
      label.textContent = t(courseKeys[i]);
      const kids = courseIcons[i] ? [iconEl(courseIcons[i], { size: 18 }), label] : [label];
      btn.replaceChildren(...kids);
    });

    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.placeholder = t('reading.search');

    // Reading placeholder
    const placeholder = document.querySelector('.reading__placeholder p');
    if (placeholder) placeholder.textContent = t('reading.select');

    // Jester
    const jesterTitle = document.querySelector('.jester__header h2');
    const jesterSubtitle = document.querySelector('.jester__subtitle');
    const jesterSelectLabel = document.querySelector('.jester__select-label');
    if (jesterTitle) jesterTitle.textContent = t('jester.title');
    if (jesterSubtitle) jesterSubtitle.textContent = t('jester.subtitle');
    if (jesterSelectLabel) jesterSelectLabel.textContent = t('jester.select');

    // Palace
    const palaceLabel = document.getElementById('palace-room-label');
    const palaceHint = document.getElementById('palace-nav-hint');
    const palaceLoading = document.querySelector('.palace__loading p');
    if (palaceLabel) palaceLabel.textContent = t('landing.palace');
    if (palaceHint) palaceHint.textContent = t('palace.hint');
    if (palaceLoading) palaceLoading.textContent = t('palace.loading');

    // Hashtiyeh
    const btnHashtiyeh = document.getElementById('btn-toggle-hashtiyeh');
    if (btnHashtiyeh) btnHashtiyeh.setAttribute('aria-label', t('hashtiyeh.label'));
  }

  setupReadingScreen() {
    const articleList = document.getElementById('article-list');
    const searchInput = document.getElementById('search-input');
    const courseFilters = document.getElementById('course-filters');

    if (!articleList || !searchInput) return;

    this.currentCourse = 'all';
    this.setupLibraryLoader(articleList, searchInput);
    this.renderArticleList(articleList, '');

    searchInput.addEventListener('input', (e) => {
      this.renderArticleList(articleList, e.target.value);
    });

    // Course filter buttons
    if (courseFilters) {
      courseFilters.querySelectorAll('.btn--course').forEach(btn => {
        btn.addEventListener('click', () => {
          courseFilters.querySelectorAll('.btn--course').forEach(b => b.classList.remove('btn--course-active'));
          btn.classList.add('btn--course-active');
          this.currentCourse = btn.dataset.course;
          this.renderArticleList(articleList, searchInput.value);
        });
      });
    }
  }

  // Runtime library loader — drop a Dana bundle (.json) or a .zim to swap the offline
  // library live, no rebuild, no network. Feedback flows through the state-system.
  setupLibraryLoader(articleList, searchInput) {
    const search = document.querySelector('.reading__search');
    if (!search || document.getElementById('library-file')) return;

    const label = document.createElement('label');
    label.className = 'btn btn--course reading__load';
    label.setAttribute('role', 'button');
    label.setAttribute('aria-label', 'بارگذاری فایل کتابخانه');
    const span = document.createElement('span');
    span.className = 'btn--course-label';
    span.textContent = 'بارگذاری کتابخانه';
    label.append(iconEl('library', { size: 18 }), span);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.zim,application/json';
    input.className = 'sr-only';
    input.id = 'library-file';
    label.appendChild(input);

    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const content = document.getElementById('reading-content');
      const loader = content ? startLoading(content, { label: 'در حال باز کردن کتابخانه…' }) : null;
      try {
        const n = await this.zimReader.loadFile(file);
        loader?.done();
        this.currentCourse = 'all';
        this.currentArticle = null;
        this.renderArticleList(articleList, searchInput.value);
        if (content) showEmpty(content, { title: `${n} مقاله بارگذاری شد`, hint: 'یک مقاله را انتخاب کن' });
      } catch (err) {
        loader?.done();
        const msg = err.message === 'ZIM_NEEDS_READER'
          ? { title: 'فایل ZIM شناسایی شد', hint: 'خواندن مستقیم ZIM به‌زودی اضافه می‌شود؛ فعلاً از فایل کتابخانهٔ دانا (JSON) استفاده کن.' }
          : { title: 'این فایل باز نشد', hint: 'یک فایل کتابخانهٔ معتبر انتخاب کن.' };
        if (content) showError(content, msg); else console.error('[Dana] library load:', err);
      }
      input.value = '';
    });

    search.parentElement.insertBefore(label, search);
  }

  setupHashtiyeh() {
    // Create toggle button for Hashtiyeh panel
    const readingSection = document.getElementById('screen-reading');
    if (!readingSection) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn--hashtiyeh';
    toggleBtn.id = 'btn-toggle-hashtiyeh';
    toggleBtn.setAttribute('aria-label', 'حاشیه‌نویسی');
    toggleBtn.replaceChildren(iconEl('pen'));
    readingSection.appendChild(toggleBtn);

    toggleBtn.addEventListener('click', () => this.toggleHashtiyeh());

    // Wire up garden progress callback
    this.hashtiyeh.onAnnotationAdded = () => {
      this.garden.recordHashtiyeh();
    };
  }

  // Testing aid: toggle between full-browser view and a phone-app frame (mirrored in the APK).
  setupViewToggle() {
    if (document.querySelector('.view-toggle')) return;
    const btn = document.createElement('button');
    btn.className = 'view-toggle';
    btn.setAttribute('aria-label', 'تغییر نمای گوشی و مرورگر');
    const apply = () => {
      const appMode = localStorage.getItem('dana-view') === 'app';
      document.body.classList.toggle('app-frame', appMode);
      btn.textContent = appMode ? 'نمای گوشی' : 'نمای مرورگر';
    };
    btn.addEventListener('click', () => {
      const next = localStorage.getItem('dana-view') === 'app' ? 'browser' : 'app';
      localStorage.setItem('dana-view', next);
      apply();
    });
    document.body.appendChild(btn);
    apply();
  }

  // Escape closes whichever popover is open, restoring focus to its trigger (WCAG 2.1.2 / 2.4.3)
  setupEscapeClose() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const nodeInfo = document.getElementById('palace-node-info');
      if (nodeInfo && !nodeInfo.hidden) {
        nodeInfo.hidden = true;
        document.getElementById('palace-canvas')?.focus?.();
        return;
      }
      if (this.hashtiyeh.isOpen) {
        this.toggleHashtiyeh();
        document.getElementById('btn-toggle-hashtiyeh')?.focus();
      }
    });
  }

  toggleHashtiyeh() {
    const reading = document.querySelector('.reading');
    if (!reading) return;

    this.hashtiyeh.isOpen = !this.hashtiyeh.isOpen;
    reading.classList.toggle('reading--hashtiyeh-open', this.hashtiyeh.isOpen);

    if (this.hashtiyeh.isOpen && this.currentArticle) {
      this.hashtiyeh.setArticle(this.currentArticle.id);
    }
  }

  startOnboarding() {
    this.showScreen('screen-onboarding');
    const container = document.getElementById('onboarding-container');

    this.onboarding.onComplete = (state) => {
      console.log('[Dana] Onboarding complete:', state.answers);
      this.garden.init();
      this.router.navigate('landing');
    };

    this.onboarding.start(container);

    // Testing skip — bypass registration during dev (persists completion)
    if (container && !document.getElementById('btn-skip-onboarding')) {
      const skip = document.createElement('button');
      skip.id = 'btn-skip-onboarding';
      skip.className = 'onboarding__skip';
      skip.textContent = getLang() === 'en' ? 'Skip (testing)' : 'رد کردن (تست)';
      skip.addEventListener('click', () => {
        this.onboarding.engine.state.completed = true;
        this.onboarding.engine.save();
        this.garden.init();
        this.router.navigate('landing');
      });
      container.appendChild(skip);
    }
  }

  async startPalace() {
    const canvas = document.getElementById('palace-canvas');
    const loading = document.getElementById('palace-loading');
    const label = document.getElementById('palace-room-label');

    if (!canvas) return;

    // Loading on the timing ladder — 3D + WASM decompression can be slow on Android Go
    let loader = null;
    if (loading) {
      loading.style.display = 'flex';
      loader = startLoading(loading, {
        label: t('palace.loading'),
        steps: [t('palace.loading'), 'ساخت اتاق‌های کاخ…', 'آماده‌سازی نمای سه‌بعدی…'],
      });
    }

    // Initialise on first visit
    if (!this.palace.scene) {
      await this.palace.init(canvas);

      // Check if init succeeded
      if (!this.palace.scene) {
        console.error('[Dana] Palace init failed');
        loader?.fail();
        return;
      }

      this.palace.loadRoom(this.palace.getSavedRoom());

      this.palace.onRoomChange = (course) => {
        if (label) label.textContent = `${course.icon} ${course.name}`;
      };

      // Handle room node selection
      this.palace.onNodeSelect = (node) => {
        this.showNodeInfo(node);
      };
    }

    // Update label with current room
    const config = this.palace.getRoomConfig();
    if (label) label.textContent = `${config.icon} ${config.name}`;

    // Refresh flora based on verified claims
    this.palace.refreshFlora();

    // Hide loading, start render loop
    loader?.done();
    if (loading) loading.style.display = 'none';
    this.palace.start();
  }

  showNodeInfo(node) {
    const infoPanel = document.getElementById('palace-node-info');
    const nameEl = document.getElementById('palace-node-name');
    const enterBtn = document.getElementById('btn-enter-node');

    if (!infoPanel || !nameEl) return;

    nameEl.textContent = `${node.courseIcon} ${node.courseName}`;
    infoPanel.hidden = false;

    // Wire up enter button — navigate to reading screen with course filter
    enterBtn?.replaceWith(enterBtn.cloneNode(true));
    const newEnterBtn = document.getElementById('btn-enter-node');
    newEnterBtn?.addEventListener('click', () => {
      infoPanel.hidden = true;
      this.router.navigate('reading');
    });
  }

  renderArticleList(listElement, query) {
    let articles = this.zimReader.search(query);

    // Filter by course
    if (this.currentCourse && this.currentCourse !== 'all') {
      articles = articles.filter(a => a.course === this.currentCourse);
    }

    // Empty state — never a blank list (children need a clear, supportive next step)
    if (articles.length === 0) {
      showEmpty(listElement, {
        title: query ? 'چیزی پیدا نشد' : 'هنوز درسی اینجا نیست',
        hint: query ? 'یک کلمهٔ دیگر را امتحان کن' : 'به‌زودی اضافه می‌شود',
      });
      return;
    }

    listElement.innerHTML = articles.map(article => `
      <li role="option"
          data-id="${article.id}"
          tabindex="0"
          aria-label="${article.title}">
        ${article.title}
      </li>
    `).join('');

    listElement.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', () => this.selectArticle(li.dataset.id));
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectArticle(li.dataset.id);
        }
      });
    });
  }

  async selectArticle(articleId) {
    try {
      document.getElementById('article-list')?.querySelectorAll('li').forEach(li => {
        li.setAttribute('aria-selected', li.dataset.id === articleId);
      });

      const article = await this.zimReader.getArticle(articleId);
      this.currentArticle = article;

      const content = document.getElementById('reading-content');
      if (content) {
        const hasClaims = article.claims && article.claims.length > 0;

        content.innerHTML = `
          <article class="article" role="document" aria-label="${article.title}">
            <header class="article__header">
              <h1 class="article__title">${article.title}</h1>
              <div class="article__meta">
                <span class="article__source">${t('reading.source')}</span>
              </div>
            </header>

            <div class="article__body" id="article-body">
              ${article.html}
            </div>

            <footer class="article__footer">
              ${hasClaims ? `
                <div class="article__verification">
                  <p class="verification__prompt">${t('claim.prompt')}</p>
                  <div id="claims-container"></div>
                  <button class="btn btn--verify" id="btn-verify-all" aria-label="${t('reading.verify.all')}">
                    ${icon('search', { size: 18 })} ${t('reading.verify')}
                  </button>
                </div>
              ` : `
                <div class="article__verification">
                  <button class="btn btn--verify" id="btn-verify" aria-label="${t('reading.verify')}">
                    ${icon('search', { size: 18 })} ${t('reading.verify')}
                  </button>
                </div>
              `}
            </footer>
          </article>
        `;

        if (hasClaims) {
          this.renderClaims(article.claims);
        }

        content.scrollTop = 0;
        this.garden.recordLessonStart();

        // Update Hashtiyeh panel if open
        if (this.hashtiyeh.isOpen) {
          this.hashtiyeh.setArticle(article.id);
        }

        console.log(`[Dana] Loaded article: ${article.title}`);
      }
    } catch (error) {
      console.error('[Dana] Failed to load article:', error);
      const content = document.getElementById('reading-content');
      if (content) {
        showError(content, {
          title: 'این مقاله باز نشد',
          hint: 'یک مقالهٔ دیگر را انتخاب کن، یا چند لحظه بعد دوباره امتحان کن.',
        });
      }
    }
  }

  renderClaims(claims) {
    const container = document.getElementById('claims-container');
    if (!container) return;

    container.innerHTML = claims.map((claim, i) => {
      const record = this.registry.getRecord(claim.encounterId, claim.exchangeIndex);
      
      let actionsHtml = '';
      let resultHtml = '';
      
      if (record) {
        const correctText = record.status === 'supported' ? 'تایید شد (Supported)' : record.status === 'rejected' ? 'رد شد (Rejected)' : 'شواهد کافی نیست (Inconclusive)';
        resultHtml = `
          <div class="claim__result">
            <div class="claim__verdict">
              <p><strong>وضعیت ثبت شده:</strong> ${correctText}</p>
              <p><strong>منبع:</strong> ${claim.source}</p>
            </div>
          </div>
        `;
      } else {
        actionsHtml = `
          <div class="claim__actions" id="claim-actions-${i}">
            <button class="btn btn--verify-correct btn--sm" data-action="supported" data-index="${i}">تایید شد</button>
            <button class="btn btn--verify-wrong btn--sm" data-action="rejected" data-index="${i}">رد شد</button>
            <button class="btn btn--secondary btn--sm" data-action="inconclusive" data-index="${i}">شواهد کافی نیست</button>
          </div>
          <div class="claim__result" id="claim-result-${i}" hidden></div>
        `;
      }

      return `
        <div class="claim" data-index="${i}" id="claim-${i}">
          <p class="claim__text"><strong>${t('claim.prefix')} ${i + 1}:</strong> ${claim.text}</p>
          ${actionsHtml}
          ${resultHtml}
        </div>
      `;
    }).join('');

    container.querySelectorAll('.claim__actions button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const action = e.target.dataset.action;
        this.verifyClaim(index, action);
      });
    });

    const verifyAllBtn = document.getElementById('btn-verify-all');
    if (verifyAllBtn) verifyAllBtn.hidden = true;
  }

  verifyClaim(index, action) {
    if (!this.currentArticle || !this.currentArticle.claims) return;

    const claim = this.currentArticle.claims[index];
    const resultEl = document.getElementById(`claim-result-${index}`);
    if (!resultEl) return;

    // Record in registry
    this.registry.record(claim.encounterId, claim.exchangeIndex, claim.courseId, action, this.currentArticle.id);

    // Auto-generate Hashtiyeh note
    let hashtiyehText = '';
    if (action === 'supported') hashtiyehText = `من این ادعا را بررسی و تایید کردم: "${claim.text}"`;
    else if (action === 'rejected') hashtiyehText = `من مچ دلقک را گرفتم! این ادعا رد شد: "${claim.text}"`;
    else hashtiyehText = `بررسی ادعا بی‌نتیجه بود: "${claim.text}"`;

    this.hashtiyeh.getEngine().addAnnotation(this.currentArticle.id, {
      text: hashtiyehText,
      selectedText: '',
      type: action === 'rejected' ? 'correction' : 'note',
      author: 'من'
    });
    
    this.garden.recordVerification();
    
    if (this.hashtiyeh.isOpen) {
      this.hashtiyeh.render();
    } else {
      this.toggleHashtiyeh();
    }

    const correctText = action === 'supported' ? 'تایید شد' : action === 'rejected' ? 'رد شد' : 'شواهد کافی نیست';
    
    resultEl.hidden = false;
    resultEl.innerHTML = `
      <div class="claim__verdict">
        <p><strong>وضعیت ثبت شده:</strong> ${correctText}</p>
        <p><strong>منبع:</strong> ${claim.source}</p>
      </div>
    `;

    const claimActions = document.getElementById(`claim-actions-${index}`);
    if (claimActions) claimActions.hidden = true;
  }

  showAllVerifications(claims) {
    // Deprecated in new verification loop
  }

  startJesterEncounter() {
    this.jester.reset();
    this.renderEncounterList();
  }

  renderEncounterList() {
    const container = document.getElementById('jester-encounters');
    const selectPanel = document.getElementById('jester-select');
    const dialogue = document.getElementById('jester-dialogue');
    const actions = document.getElementById('jester-actions');

    if (!container) return;

    // Hide dialogue, show selection
    if (dialogue) dialogue.hidden = true;
    if (actions) actions.hidden = true;
    if (selectPanel) selectPanel.hidden = false;

    const encounters = this.jester.getEncounters();

    container.innerHTML = encounters.map(enc => `
      <button class="btn btn--encounter" data-encounter="${enc.id}">
        <span class="encounter__icon">${icon('scale', { size: 20 })}</span>
        <span class="encounter__topic">${getLang() === 'en' ? this.translateTopic(enc.topic) : enc.topic}</span>
        <span class="encounter__count">${enc.exchanges.length} ${t('jester.questions')}</span>
      </button>
    `).join('');

    container.querySelectorAll('.btn--encounter').forEach(btn => {
      btn.addEventListener('click', () => {
        this.startSpecificEncounter(btn.dataset.encounter);
      });
    });
  }

  startSpecificEncounter(encounterId) {
    const selectPanel = document.getElementById('jester-select');
    const dialogue = document.getElementById('jester-dialogue');
    const actions = document.getElementById('jester-actions');

    this.jester.reset();
    const encounter = this.jester.startEncounter(encounterId);
    if (!encounter) return;

    // Hide selection, show dialogue
    if (selectPanel) selectPanel.hidden = true;
    if (dialogue) dialogue.hidden = false;
    if (actions) actions.hidden = false;

    this.renderJesterExchange(encounter);
  }

  translateTopic(topic) {
    const topics = {
      'گربه‌سانان ایران': 'Iranian big cats',
      'ریاضیات': 'Mathematics',
      'پرنده‌شناسی ایران': 'Iranian ornithology',
      'سواد رسانه‌ای': 'Media literacy',
      'هندسه و الگوها': 'Geometry & patterns',
    };
    return topics[topic] || topic;
  }

  renderJesterExchange(exchange) {
    const dialogue = document.getElementById('jester-dialogue');
    const actions = document.getElementById('jester-actions');

    if (!dialogue || !actions) return;

    const record = this.registry.getRecord(exchange.encounterId, exchange.exchangeIndex);
    const claimLabel = getLang() === 'en' ? 'Claim:' : 'ادعا:';

    dialogue.innerHTML = `
      <div class="dialogue__exchange">
        <div class="dialogue__jester">
          <div class="dialogue__avatar">${icon('scale', { size: 22 })}</div>
          <div class="dialogue__bubble">
            <p>${exchange.dialogue}</p>
          </div>
        </div>
        <div class="dialogue__claim">
          <p><strong>${claimLabel}</strong> ${exchange.claim}</p>
        </div>
      </div>
    `;

    // Jester "speaks" — typewriter reveal of his line (character voice; glossary Typewriter Matrix)
    const jesterLine = dialogue.querySelector('.dialogue__jester .dialogue__bubble p');
    if (jesterLine) typewrite(jesterLine, exchange.dialogue);

    if (record) {
      const correctText = record.status === 'supported' ? 'تایید شد' : record.status === 'rejected' ? 'رد شد' : 'شواهد کافی نیست';
      dialogue.innerHTML += `
        <div class="dialogue__exchange dialogue__exchange--response">
          <div class="dialogue__child">
            <div class="dialogue__bubble dialogue__bubble--child">
              <p>من قبلاً این را بررسی کردم. وضعیت: ${correctText}</p>
            </div>
          </div>
          <div class="dialogue__jester">
            <div class="dialogue__avatar">⚖️</div>
            <div class="dialogue__bubble">
              <p>بسیار عالی! تو یک محقق واقعی هستی.</p>
            </div>
          </div>
        </div>
      `;
      
      this.jester.exchangeIndex++; // advance Jester state internally
      const isComplete = this.jester.isEncounterComplete();
      
      if (isComplete) {
        actions.innerHTML = `
          <button class="btn btn--primary" id="btn-jester-done">
            ${t('jester.done')}
          </button>
        `;
        document.getElementById('btn-jester-done')?.addEventListener('click', () => {
          this.jester.reset();
          this.renderEncounterList();
        });
      } else {
        actions.innerHTML = `
          <button class="btn btn--primary" id="btn-jester-next">
            ${t('jester.next')}
          </button>
        `;
        document.getElementById('btn-jester-next')?.addEventListener('click', () => {
          this.renderJesterExchange(this.jester.getCurrentExchange());
        });
      }
      return;
    }

    actions.innerHTML = `
      <button class="btn btn--primary" id="btn-investigate-source">
        🔍 ${getLang() === 'en' ? 'Investigate Source' : 'بررسی منبع'}
      </button>
    `;

    document.getElementById('btn-investigate-source')?.addEventListener('click', () => {
      this.router.navigate('reading');
      this.selectArticle(exchange.sourceArticleId);
    });
  }

  verifyJesterClaim(childSaysCorrect) {
    // Deprecated in new verification loop
  }

  async initZimReader() {
    try {
      this.zimReader = new ZimReader();
      await this.zimReader.init();
      console.log('[Dana] ZIM reader ready');
    } catch (error) {
      console.error('[Dana] ZIM reader init failed:', error);
    }
  }

  showScreen(screenId) {
    // Stop palace when navigating away
    if (screenId !== 'screen-palace' && this.palace.isActive) {
      this.palace.stop();
      // Hide node info panel
      const infoPanel = document.getElementById('palace-node-info');
      if (infoPanel) infoPanel.hidden = true;
    }

    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('screen--active');
    });

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('screen--active');
      // Move focus to the new screen so keyboard/SR users track the change (WCAG 2.4.3)
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }

    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
      btnBack.hidden = screenId === 'screen-landing';
    }

    // Show/hide Hashtiyeh button
    const btnHashtiyeh = document.getElementById('btn-toggle-hashtiyeh');
    if (btnHashtiyeh) {
      btnHashtiyeh.style.display = screenId === 'screen-reading' ? 'flex' : 'none';
    }

    if (screenId === 'screen-reading') {
      this.einkMode.enable();
    } else {
      this.einkMode.disable();
    }
  }

  getReader() {
    return this.zimReader;
  }

  getGarden() {
    return this.garden;
  }

  getJester() {
    return this.jester;
  }
}

const app = new DanaApp();
export default app;
