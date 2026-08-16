/**
 * qr.js — QR generate + camera scan for offline device-to-device Hashtiyeh transfer.
 * No pairing, no internet. EC level Q (~25–30% recoverable — survives ~30% damage),
 * short payload (fewer modules = easier scan on a cheap camera), centre mark in the
 * redundant quiet-zone. Uses qrcode + jsqr (bundled offline).
 */
import QRCode from 'qrcode';
import jsQR from 'jsqr';

/**
 * Render a QR of `text` into a canvas, e-paper coloured, with a centre "دانا" mark.
 * @returns {Promise<void>}
 */
export async function renderQR(canvas, text, { size = 240 } = {}) {
  await QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: 'Q',
    margin: 2,
    width: size,
    color: { dark: '#1A1A1A', light: '#F4F3EE' },
  });
  // Centre mark sits in the error-correction redundancy (Q tolerates the occlusion).
  const ctx = canvas.getContext('2d');
  const s = size * 0.18, c = size / 2;
  ctx.fillStyle = '#F4F3EE';
  ctx.fillRect(c - s / 2, c - s / 2, s, s);
  ctx.fillStyle = '#1A1A1A';
  ctx.font = `bold ${Math.round(s * 0.5)}px Vazirmatn, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('دانا', c, c + 1);
}

/**
 * Scan a QR from the rear camera. Calls onResult(dataString) once, then stops.
 * @returns {Promise<Function>} stop() — call to release the camera.
 */
export async function startScan(video, onResult) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  video.srcObject = stream;
  video.setAttribute('playsinline', '');
  await video.play();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let raf = null, stopped = false;

  const stop = () => {
    stopped = true;
    if (raf) cancelAnimationFrame(raf);
    stream.getTracks().forEach((t) => t.stop());
  };

  const tick = () => {
    if (stopped) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (code && code.data) {
        onResult(code.data);
        stop();
        return;
      }
    }
    raf = requestAnimationFrame(tick);
  };
  tick();
  return stop;
}
