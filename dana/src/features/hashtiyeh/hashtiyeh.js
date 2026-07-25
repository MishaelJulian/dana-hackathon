/**
 * hashtiyeh.js — Marginalia overlay engine
 *
 * Hashtiyeh (حاشیه‌نویسی) = marginalia. Testimony from someone who was actually there.
 *
 * Key constraint from MASTER_FOUNDATION_PROMPT.md:
 * "He cannot produce Hashtiyeh. Marginalia is testimony from someone
 * who was actually there. The annotation feature is structurally beyond him."
 *
 * The Jester CANNOT create annotations. Only the child and their siblings can.
 *
 * Format: .hash files (JSON envelope + annotations array)
 * Phase 1: localStorage. Phase 2: file export/import for sibling-to-sibling transfer.
 */

const STORAGE_KEY = 'dana-hashtiyeh';
const FORMAT_VERSION = 1;

export class Hashtiyeh {
  constructor() {
    this.overlays = this.load();
  }

  /**
   * Load all overlays from localStorage
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /**
   * Save all overlays to localStorage
   */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.overlays));
    } catch (e) {
      console.warn('[Hashtiyeh] Save failed:', e);
    }
  }

  /**
   * Get or create an overlay for an article
   * @param {string} articleId
   * @returns {Object} The overlay object
   */
  getOverlay(articleId) {
    if (!this.overlays[articleId]) {
      this.overlays[articleId] = {
        format_version: FORMAT_VERSION,
        base_article_id: articleId,
        author_handle: null,
        annotations: [],
        timestamp: new Date().toISOString(),
      };
    }
    return this.overlays[articleId];
  }

  /**
   * Add an annotation to an article
   * @param {string} articleId
   * @param {Object} annotation - { text, selectedText, position, type }
   * @returns {Object} The created annotation
   */
  addAnnotation(articleId, annotation) {
    const overlay = this.getOverlay(articleId);

    const entry = {
      id: this.generateId(),
      text: annotation.text,
      selectedText: annotation.selectedText || '',
      position: annotation.position || null,
      type: annotation.type || 'note', // 'note', 'correction', 'question', 'link'
      author: annotation.author || 'من',
      timestamp: new Date().toISOString(),
    };

    overlay.annotations.push(entry);
    overlay.timestamp = new Date().toISOString();
    this.save();

    console.log(`[Hashtiyeh] Added annotation to article ${articleId}`);
    return entry;
  }

  /**
   * Remove an annotation
   * @param {string} articleId
   * @param {string} annotationId
   */
  removeAnnotation(articleId, annotationId) {
    const overlay = this.overlays[articleId];
    if (!overlay) return;

    overlay.annotations = overlay.annotations.filter(a => a.id !== annotationId);
    overlay.timestamp = new Date().toISOString();
    this.save();
  }

  /**
   * Get all annotations for an article
   * @param {string} articleId
   * @returns {Array} Array of annotation objects
   */
  getAnnotations(articleId) {
    const overlay = this.overlays[articleId];
    return overlay ? overlay.annotations : [];
  }

  /**
   * Get annotation count for an article
   * @param {string} articleId
   * @returns {number}
   */
  getAnnotationCount(articleId) {
    return this.getAnnotations(articleId).length;
  }

  /**
   * Get total annotation count across all articles
   * @returns {number}
   */
  getTotalCount() {
    return Object.values(this.overlays).reduce(
      (sum, overlay) => sum + overlay.annotations.length, 0
    );
  }

  /**
   * Export an article's overlay as a .hash file
   * @param {string} articleId
   * @returns {string} JSON string of the overlay
   */
  exportOverlay(articleId) {
    const overlay = this.getOverlay(articleId);
    return JSON.stringify(overlay, null, 2);
  }

  /**
   * Import a .hash overlay (merge into existing)
   * @param {string} articleId
   * @param {string} jsonString - The .hash file content
   * @returns {number} Number of annotations imported
   */
  importOverlay(articleId, jsonString) {
    try {
      const incoming = JSON.parse(jsonString);
      if (!incoming.annotations || !Array.isArray(incoming.annotations)) {
        throw new Error('Invalid overlay format');
      }

      const existing = this.getOverlay(articleId);
      const existingIds = new Set(existing.annotations.map(a => a.id));

      let imported = 0;
      for (const annotation of incoming.annotations) {
        if (!existingIds.has(annotation.id)) {
          existing.annotations.push(annotation);
          imported++;
        }
      }

      existing.timestamp = new Date().toISOString();
      this.save();

      console.log(`[Hashtiyeh] Imported ${imported} annotations for article ${articleId}`);
      return imported;
    } catch (e) {
      console.error('[Hashtiyeh] Import failed:', e);
      return 0;
    }
  }

  /**
   * Generate a unique ID for an annotation
   */
  generateId() {
    return `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Check if the Jester is trying to create an annotation
   * This should never happen — but if it does, block it.
   *
   * "He cannot produce Hashtiyeh. Marginalia is testimony from
   * someone who was actually there."
   */
  blockJester() {
    console.warn('[Hashtiyeh] The Jester cannot produce Hashtiyeh.');
    return false;
  }
}
