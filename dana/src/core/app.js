/**
 * app.js — Dana application bootstrap
 * Initialises all modules, manages screen transitions
 */

import { Router } from './router.js';
import { ZimReader } from '../features/reading/reader.js';
import { EinkMode } from '../features/reading/eink.js';
import { Jester } from '../features/jester/jester.js';
import { Garden } from '../features/garden/garden.js';
import { HashtiyehUI } from '../features/hashtiyeh/hashtiyeh-ui.js';
import { OnboardingUI } from '../features/onboarding/onboarding-ui.js';
import { Palace } from '../features/palace/palace.js';
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
      btnTheme.textContent = isDark ? '☀️' : '🌙';
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
    if (courseFilters.length >= 4) {
      courseFilters[0].textContent = t('course.all');
      courseFilters[1].textContent = t('course.nature');
      courseFilters[2].textContent = t('course.digital');
      courseFilters[3].textContent = t('course.math');
    }

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

  setupHashtiyeh() {
    // Create toggle button for Hashtiyeh panel
    const readingSection = document.getElementById('screen-reading');
    if (!readingSection) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn--hashtiyeh';
    toggleBtn.id = 'btn-toggle-hashtiyeh';
    toggleBtn.setAttribute('aria-label', 'حاشیه‌نویسی');
    toggleBtn.innerHTML = '📝';
    readingSection.appendChild(toggleBtn);

    toggleBtn.addEventListener('click', () => this.toggleHashtiyeh());

    // Wire up garden progress callback
    this.hashtiyeh.onAnnotationAdded = () => {
      this.garden.recordHashtiyeh();
    };
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
  }

  async startPalace() {
    const canvas = document.getElementById('palace-canvas');
    const loading = document.getElementById('palace-loading');
    const label = document.getElementById('palace-room-label');

    if (!canvas) return;

    // Show loading while Three.js loads
    if (loading) loading.style.display = 'flex';

    // Initialise on first visit
    if (!this.palace.scene) {
      await this.palace.init(canvas);

      // Check if init succeeded
      if (!this.palace.scene) {
        console.error('[Dana] Palace init failed');
        if (loading) {
          loading.innerHTML = '<p style="color: #c62828;">Failed to load 3D engine. Check console for details.</p>';
        }
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

    // Hide loading, start render loop
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
                    <span>🔍</span> ${t('reading.verify')}
                  </button>
                </div>
              ` : `
                <div class="article__verification">
                  <button class="btn btn--verify" id="btn-verify" aria-label="${t('reading.verify')}">
                    <span>🔍</span> ${t('reading.verify')}
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
    }
  }

  renderClaims(claims) {
    const container = document.getElementById('claims-container');
    if (!container) return;

    container.innerHTML = claims.map((claim, i) => `
      <div class="claim" data-index="${i}" id="claim-${i}">
        <p class="claim__text"><strong>${t('claim.prefix')} ${i + 1}:</strong> ${claim.text}</p>
        <div class="claim__actions">
          <button class="btn btn--verify-correct btn--sm" data-action="correct" data-index="${i}">
            ${t('claim.correct')}
          </button>
          <button class="btn btn--verify-wrong btn--sm" data-action="wrong" data-index="${i}">
            ${t('claim.wrong')}
          </button>
        </div>
        <div class="claim__result" id="claim-result-${i}" hidden></div>
      </div>
    `).join('');

    container.querySelectorAll('.claim__actions button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const action = e.target.dataset.action;
        this.verifyClaim(index, action === 'correct');
      });
    });

    document.getElementById('btn-verify-all')?.addEventListener('click', () => {
      this.showAllVerifications(claims);
    });
  }

  verifyClaim(index, childSaysCorrect) {
    if (!this.currentArticle || !this.currentArticle.claims) return;

    const claim = this.currentArticle.claims[index];
    const resultEl = document.getElementById(`claim-result-${index}`);
    if (!resultEl) return;

    const wasCaught = childSaysCorrect !== claim.correct;

    const resultLabel = getLang() === 'en' ? 'Result:' : 'نتیجه:';
    const sourceLabel = getLang() === 'en' ? 'Source:' : 'منبع:';
    const correctText = claim.correct ? t('claim.correct') : t('claim.wrong');

    resultEl.hidden = false;
    resultEl.innerHTML = `
      <div class="claim__verdict ${wasCaught ? 'claim__verdict--caught' : ''}">
        <p><strong>${resultLabel}</strong> ${correctText}</p>
        <p><strong>${sourceLabel}</strong> ${claim.source}</p>
        ${wasCaught && !claim.correct ? `<p class="claim__reward">${t('claim.reward')}</p>` : ''}
      </div>
    `;

    this.garden.recordVerification();

    const claimActions = resultEl.previousElementSibling;
    if (claimActions) claimActions.hidden = true;
  }

  showAllVerifications(claims) {
    claims.forEach((_, i) => {
      const resultEl = document.getElementById(`claim-result-${i}`);
      if (resultEl && resultEl.hidden) {
        this.verifyClaim(i, true);
      }
    });
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
        <span class="encounter__icon">⚖️</span>
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

    const claimLabel = getLang() === 'en' ? 'Claim:' : 'ادعا:';

    dialogue.innerHTML = `
      <div class="dialogue__exchange">
        <div class="dialogue__jester">
          <div class="dialogue__avatar">⚖️</div>
          <div class="dialogue__bubble">
            <p>${exchange.dialogue}</p>
          </div>
        </div>
        <div class="dialogue__claim">
          <p><strong>${claimLabel}</strong> ${exchange.claim}</p>
        </div>
      </div>
    `;

    actions.innerHTML = `
      <button class="btn btn--verify-correct" id="btn-say-correct">
        ${t('claim.correct')}
      </button>
      <button class="btn btn--verify-wrong" id="btn-say-wrong">
        ${t('claim.wrong')}
      </button>
    `;

    document.getElementById('btn-say-correct')?.addEventListener('click', () => {
      this.verifyJesterClaim(true);
    });

    document.getElementById('btn-say-wrong')?.addEventListener('click', () => {
      this.verifyJesterClaim(false);
    });
  }

  verifyJesterClaim(childSaysCorrect) {
    const result = this.jester.verify(childSaysCorrect);
    if (!result) return;

    const dialogue = document.getElementById('jester-dialogue');
    const actions = document.getElementById('jester-actions');

    if (!dialogue || !actions) return;

    const resultLabel = getLang() === 'en' ? 'Result:' : 'نتیجه:';
    const sourceLabel = getLang() === 'en' ? 'Source:' : 'منبع:';

    dialogue.innerHTML += `
      <div class="dialogue__exchange dialogue__exchange--response">
        <div class="dialogue__child">
          <div class="dialogue__bubble dialogue__bubble--child">
            <p>${childSaysCorrect ? t('jester.yes') : t('jester.no')}</p>
          </div>
        </div>
        <div class="dialogue__jester">
          <div class="dialogue__avatar">⚖️</div>
          <div class="dialogue__bubble">
            <p>${result.jesterResponse}</p>
          </div>
        </div>
        <div class="dialogue__verification">
          <p><strong>${resultLabel}</strong> ${result.verification.verdict}</p>
          <p><strong>${sourceLabel}</strong> ${result.verification.found}</p>
        </div>
      </div>
    `;

    this.garden.recordVerification();

    if (result.isComplete) {
      actions.innerHTML = `
        <button class="btn btn--primary" id="btn-jester-done">
          ${t('jester.done')}
        </button>
      `;
      document.getElementById('btn-jester-done')?.addEventListener('click', () => {
        this.jester.reset();
        this.renderEncounterList();
      });
    } else if (result.nextExchange) {
      actions.innerHTML = `
        <button class="btn btn--primary" id="btn-jester-next">
          ${t('jester.next')}
        </button>
      `;
      document.getElementById('btn-jester-next')?.addEventListener('click', () => {
        this.renderJesterExchange(result.nextExchange);
      });
    }

    dialogue.scrollTop = dialogue.scrollHeight;
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
