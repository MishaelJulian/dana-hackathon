/**
 * reading-screen.js — Reading screen controller
 * Manages the article list, search, and content display
 */

export class ReadingScreen {
  constructor(zimReader) {
    this.zimReader = zimReader;
    this.currentArticle = null;
    this.elements = {
      sidebar: document.getElementById('reading-sidebar'),
      searchInput: document.getElementById('search-input'),
      articleList: document.getElementById('article-list'),
      content: document.getElementById('reading-content'),
    };

    this.init();
  }

  init() {
    // Set up search
    this.elements.searchInput?.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    // Load article list
    this.loadArticleList();
  }

  /**
   * Load article list into the sidebar
   */
  loadArticleList() {
    if (!this.elements.articleList) return;

    const articles = this.zimReader.search('');

    this.elements.articleList.innerHTML = articles.map(article => `
      <li role="option"
          data-id="${article.id}"
          tabindex="0"
          aria-label="${article.title}">
        ${article.title}
      </li>
    `).join('');

    // Add click handlers
    this.elements.articleList.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', () => this.selectArticle(li.dataset.id));
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectArticle(li.dataset.id);
        }
      });
    });
  }

  /**
   * Handle search input
   */
  handleSearch(query) {
    const results = this.zimReader.search(query);

    if (!this.elements.articleList) return;

    this.elements.articleList.innerHTML = results.map(article => `
      <li role="option"
          data-id="${article.id}"
          tabindex="0"
          aria-label="${article.title}">
        ${article.title}
      </li>
    `).join('');

    // Re-attach click handlers
    this.elements.articleList.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', () => this.selectArticle(li.dataset.id));
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectArticle(li.dataset.id);
        }
      });
    });
  }

  /**
   * Select and display an article
   */
  async selectArticle(articleId) {
    try {
      // Update selection UI
      this.elements.articleList?.querySelectorAll('li').forEach(li => {
        li.setAttribute('aria-selected', li.dataset.id === articleId);
      });

      // Get article content
      const article = await this.zimReader.getArticle(articleId);
      this.currentArticle = article;

      // Render content
      this.renderArticle(article);

      console.log(`[ReadingScreen] Loaded: ${article.title}`);
    } catch (error) {
      console.error('[ReadingScreen] Failed to load article:', error);
    }
  }

  /**
   * Render article content in E-ink mode
   */
  renderArticle(article) {
    if (!this.elements.content) return;

    // Build the article HTML with Hashtiyeh support
    const html = `
      <article class="article" role="document" aria-label="${article.title}">
        <header class="article__header">
          <h1 class="article__title">${article.title}</h1>
          <div class="article__meta">
            <span class="article__source">ویکی‌پدیای فارسی</span>
          </div>
        </header>

        <div class="article__body" id="article-body">
          ${article.html}
        </div>

        <footer class="article__footer">
          <div class="article__verification" id="verification-affordance">
            <button class="btn btn--verify" id="btn-verify" aria-label="بررسی ادعاها">
              <span>🔍</span> بررسی کن
            </button>
          </div>
        </footer>
      </article>
    `;

    this.elements.content.innerHTML = html;

    // Scroll to top
    this.elements.content.scrollTop = 0;
  }

  /**
   * Get current article
   */
  getCurrentArticle() {
    return this.currentArticle;
  }
}
