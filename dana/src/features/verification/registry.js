/**
 * registry.js — Minimum Shared State for Verification
 * 
 * Persists user verification outcomes (Supported, Rejected, Inconclusive)
 * so that the Palace, Jester, and Hashtiyeh can share state without a complex
 * state management framework.
 */

const STORAGE_KEY = 'dana-verifications';

export class VerificationRegistry {
  constructor() {
    this.records = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('[VerificationRegistry] Could not load state:', e);
      return {};
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch (e) {
      console.warn('[VerificationRegistry] Could not save state:', e);
    }
  }

  /**
   * Record a verification decision
   * @param {string} encounterId - e.g. 'cheetah-intro'
   * @param {number} exchangeIndex - e.g. 0
   * @param {string} courseId - e.g. 'nature'
   * @param {string} status - 'supported', 'rejected', or 'inconclusive'
   * @param {string} sourceArticleId
   */
  record(encounterId, exchangeIndex, courseId, status, sourceArticleId) {
    const key = `${encounterId}_${exchangeIndex}`;
    this.records[key] = {
      status,
      courseId,
      sourceArticleId,
      timestamp: new Date().toISOString()
    };
    this.save();
    console.log(`[VerificationRegistry] Recorded ${key} as ${status}`);
  }

  /**
   * Get the status of a specific claim
   */
  getRecord(encounterId, exchangeIndex) {
    return this.records[`${encounterId}_${exchangeIndex}`] || null;
  }

  /**
   * Get total number of resolved claims (supported or rejected) for a specific course
   * Used by Palace to spawn trees
   */
  getResolvedCountForCourse(courseId) {
    return Object.values(this.records).filter(
      r => r.courseId === courseId && (r.status === 'supported' || r.status === 'rejected')
    ).length;
  }
}
