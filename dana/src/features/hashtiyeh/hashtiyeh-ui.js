/**
 * hashtiyeh-ui.js — Marginalia UI component
 * Renders annotations in the margin alongside articles
 * Allows the child to add, view, and manage annotations
 *
 * "Social proof through Hashtiyeh. Margins where an older sibling
 * wrote he lies here — the habit arrives from a trusted human,
 * not from the app instructing."
 */

import { Hashtiyeh } from './hashtiyeh.js';

export class HashtiyehUI {
  constructor() {
    this.engine = new Hashtiyeh();
    this.currentArticleId = null;
    this.isOpen = false;
    this.onAnnotationAdded = null; // callback for garden progress
  }

  /**
   * Initialise for an article
   * @param {string} articleId
   */
  setArticle(articleId) {
    this.currentArticleId = articleId;
    this.render();
  }

  /**
   * Get the engine instance
   */
  getEngine() {
    return this.engine;
  }

  /**
   * Render the marginalia panel
   */
  render() {
    const container = document.getElementById('hashtiyeh-panel');
    if (!container || !this.currentArticleId) return;

    const annotations = this.engine.getAnnotations(this.currentArticleId);

    container.innerHTML = `
      <div class="hashtiyeh">
        <div class="hashtiyeh__header">
          <h3 class="hashtiyeh__title">حاشیه‌نویسی</h3>
          <span class="hashtiyeh__count">${annotations.length}</span>
        </div>

        <div class="hashtiyeh__list" id="hashtiyeh-list">
          ${annotations.length === 0
            ? `<p class="hashtiyeh__empty">هنوز حاشیه‌نویسی‌ای نیست.
               <br><small>متنی را انتخاب کنید و یادداشت بگذارید.</small></p>`
            : annotations.map(a => this.renderAnnotation(a)).join('')
          }
        </div>

        <div class="hashtiyeh__add" id="hashtiyeh-add">
          <div class="hashtiyeh__selected" id="hashtiyeh-selected" hidden>
            <p class="hashtiyeh__selected-text" id="hashtiyeh-selected-text"></p>
          </div>
          <textarea
            id="hashtiyeh-input"
            class="hashtiyeh__input"
            placeholder="یادداشت شما..."
            rows="2"
            aria-label="نوشتن حاشیه‌نویسی"
          ></textarea>
          <div class="hashtiyeh__type-select">
            <button class="hashtiyeh__type-btn hashtiyeh__type-btn--active" data-type="note" aria-label="یادداشت">
              📝 یادداشت
            </button>
            <button class="hashtiyeh__type-btn" data-type="correction" aria-label="تصحیح">
              ✏️ تصحیح
            </button>
            <button class="hashtiyeh__type-btn" data-type="question" aria-label="سوال">
              ❓ سوال
            </button>
          </div>
          <button class="btn btn--primary btn--sm" id="btn-add-annotation" disabled>
            افزودن
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  /**
   * Render a single annotation
   */
  renderAnnotation(annotation) {
    const typeIcons = {
      note: '📝',
      correction: '✏️',
      question: '❓',
      link: '🔗',
    };

    const typeLabels = {
      note: 'یادداشت',
      correction: 'تصحیح',
      question: 'سوال',
      link: 'پیوند',
    };

    return `
      <div class="hashtiyeh__annotation" data-id="${annotation.id}">
        <div class="hashtiyeh__annotation-header">
          <span class="hashtiyeh__annotation-type">
            ${typeIcons[annotation.type] || '📝'} ${typeLabels[annotation.type] || 'یادداشت'}
          </span>
          <span class="hashtiyeh__annotation-author">${annotation.author}</span>
        </div>
        ${annotation.selectedText ? `
          <blockquote class="hashtiyeh__annotation-selected">
            «${annotation.selectedText}»
          </blockquote>
        ` : ''}
        <p class="hashtiyeh__annotation-text">${annotation.text}</p>
        <div class="hashtiyeh__annotation-footer">
          <span class="hashtiyeh__annotation-time">${this.formatTime(annotation.timestamp)}</span>
          <button class="hashtiyeh__delete-btn" data-id="${annotation.id}" aria-label="حذف">
            ✕
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Bind event handlers
   */
  bindEvents() {
    const input = document.getElementById('hashtiyeh-input');
    const addBtn = document.getElementById('btn-add-annotation');
    const selectedText = document.getElementById('hashtiyeh-selected-text');
    const selectedContainer = document.getElementById('hashtiyeh-selected');

    // Enable/disable add button based on input
    input?.addEventListener('input', () => {
      if (addBtn) addBtn.disabled = input.value.trim().length === 0;
    });

    // Add annotation
    addBtn?.addEventListener('click', () => this.addAnnotation());

    // Type selection
    document.querySelectorAll('.hashtiyeh__type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.hashtiyeh__type-btn').forEach(b =>
          b.classList.remove('hashtiyeh__type-btn--active')
        );
        e.target.classList.add('hashtiyeh__type-btn--active');
      });
    });

    // Delete annotations
    document.querySelectorAll('.hashtiyeh__delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.deleteAnnotation(id);
      });
    });

    // Listen for text selection in the article
    document.addEventListener('mouseup', () => this.handleTextSelection());
    document.addEventListener('keyup', (e) => {
      if (e.shiftKey) this.handleTextSelection();
    });
  }

  /**
   * Handle text selection in the article
   */
  handleTextSelection() {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    const selectedContainer = document.getElementById('hashtiyeh-selected');
    const selectedTextEl = document.getElementById('hashtiyeh-selected-text');

    if (text && text.length > 2 && this.isWithinArticle(selection.anchorNode)) {
      if (selectedContainer) selectedContainer.hidden = false;
      if (selectedTextEl) selectedTextEl.textContent = text;
    }
  }

  /**
   * Check if a node is within the article content
   */
  isWithinArticle(node) {
    const articleBody = document.getElementById('article-body');
    if (!articleBody || !node) return false;
    return articleBody.contains(node) || articleBody === node;
  }

  /**
   * Add the current annotation
   */
  addAnnotation() {
    const input = document.getElementById('hashtiyeh-input');
    const selectedTextEl = document.getElementById('hashtiyeh-selected-text');
    const activeType = document.querySelector('.hashtiyeh__type-btn--active');

    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    const selectedText = selectedTextEl?.textContent || '';
    const type = activeType?.dataset.type || 'note';

    this.engine.addAnnotation(this.currentArticleId, {
      text,
      selectedText,
      type,
      author: 'من',
    });

    // Clear input
    input.value = '';
    const selectedContainer = document.getElementById('hashtiyeh-selected');
    if (selectedContainer) selectedContainer.hidden = true;

    // Re-render
    this.render();

    // Notify parent (for garden progress)
    if (this.onAnnotationAdded) {
      this.onAnnotationAdded();
    }
  }

  /**
   * Delete an annotation
   */
  deleteAnnotation(annotationId) {
    this.engine.removeAnnotation(this.currentArticleId, annotationId);
    this.render();
  }

  /**
   * Format timestamp for display
   */
  formatTime(timestamp) {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;

      if (diff < 60000) return 'الان';
      if (diff < 3600000) return `${Math.floor(diff / 60000)} پیش`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} ساعت پیش`;

      return date.toLocaleDateString('fa-IR');
    } catch {
      return '';
    }
  }
}
