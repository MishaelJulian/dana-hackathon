/**
 * transfer.js — Local file transfer
 * Wi-Fi Direct / BLE / QR for sharing Hashtiyeh overlays
 *
 * Phase 1: QR code handoff (simplest thing that works)
 * Phase 2: Wi-Fi Direct / BLE
 */

export class Transfer {
  constructor() {
    this.isSupported = this.checkSupport();
  }

  /**
   * Check if transfer is supported
   */
  checkSupport() {
    return {
      wifiDirect: 'wifiDirect' in navigator,
      bluetooth: 'bluetooth' in navigator,
      qr: true, // Always supported (camera + display)
      webShare: 'share' in navigator,
    };
  }

  /**
   * Export a Hashtiyeh overlay as a downloadable file
   * @param {Object} overlay - The overlay data
   * @param {string} filename - The filename
   */
  exportOverlay(overlay, filename = 'hashtiyeh.hash') {
    const data = JSON.stringify(overlay, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
    console.log(`[Transfer] Exported: ${filename}`);
  }

  /**
   * Share a file using the Web Share API
   * @param {File} file - The file to share
   */
  async shareFile(file) {
    if (!this.isSupported.webShare) {
      console.warn('[Transfer] Web Share API not supported');
      return false;
    }

    try {
      await navigator.share({
        files: [file],
        title: 'دانا - حاشیه‌نویسی',
      });
      return true;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[Transfer] Share failed:', error);
      }
      return false;
    }
  }
}
