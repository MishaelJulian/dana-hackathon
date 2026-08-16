// Pitch-video asset capture. Records motion .webm walkthroughs + hi-res stills.
// Beats: home/garden -> palace (3D) -> reader -> jester (verify). Mobile + desktop.
// ponytail: playwright recordVideo, no new deps. Best-effort per beat; one failure won't kill the run.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(__dirname, '../video-assets');
const PORT = 3007;
const URL = `http://localhost:${PORT}`;

const SEED = () => {
  localStorage.setItem('dana-onboarding', JSON.stringify({
    version: 1, completed: true, currentStepId: 'done',
    answers: { name: 'آزمایش', age: '13-15', future: 'science', curiosity: 'animals' },
    room: 'science', startTime: new Date().toISOString(), completionTime: new Date().toISOString(),
  }));
  localStorage.setItem('dana-garden-state', JSON.stringify({
    lessonsStarted: 3, modulesCompleted: 2, coursesCompleted: 1,
    verificationCount: 4, hashtiyehCount: 2,
  }));
};

const wait = ms => new Promise(r => setTimeout(r, ms));

async function clickIf(page, sel, pause = 1500) {
  try {
    const el = await page.$(sel);
    if (!el) { console.log(`  skip (absent): ${sel}`); return false; }
    await el.click({ timeout: 3000 });
    await wait(pause);
    return true;
  } catch (e) { console.log(`  skip (err): ${sel} -> ${e.message}`); return false; }
}

// Induce camera motion over the 3D canvas so the clip isn't static.
async function orbit(page, sel = '#palace-canvas') {
  try {
    const box = await (await page.$(sel))?.boundingBox();
    if (!box) return;
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 0; i < 30; i++) { await page.mouse.move(cx + Math.sin(i / 5) * 160, cy + Math.cos(i / 7) * 90); await wait(90); }
    await page.mouse.up();
  } catch (e) { console.log('  orbit skip:', e.message); }
}

async function walkthrough(browser, label, viewport) {
  const dir = path.join(OUT, label);
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport, recordVideo: { dir, size: viewport }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  console.log(`\n[${label}] ${viewport.width}x${viewport.height}`);

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
  await page.evaluate(SEED);
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
  await wait(2500);
  await page.screenshot({ path: path.join(dir, '1-home.png') });
  console.log('  home ✓');

  // Palace
  if (await clickIf(page, '#btn-open-palace', 6500)) {
    await wait(1500); await orbit(page);
    await page.screenshot({ path: path.join(dir, '2-palace.png') });
    await clickIf(page, '#btn-enter-node', 2500);
    await page.screenshot({ path: path.join(dir, '2b-palace-node.png') });
    console.log('  palace ✓');
    await clickIf(page, '#btn-back', 2000);
  }

  // Reader
  if (await clickIf(page, '#btn-open-reader', 3000)) {
    await page.mouse.wheel(0, 500); await wait(1500);
    await page.mouse.wheel(0, 500); await wait(1500);
    await page.screenshot({ path: path.join(dir, '3-reader.png') });
    console.log('  reader ✓');
    await clickIf(page, '#btn-back', 2000);
  }

  // Jester (verify = MIL / critical-thinking hook)
  if (await clickIf(page, '#btn-open-jester', 3000)) {
    await page.screenshot({ path: path.join(dir, '4-jester.png') });
    await clickIf(page, '#btn-say-correct', 2000) || await clickIf(page, '#btn-verify', 2000);
    await clickIf(page, '#btn-jester-next', 2500);
    await page.screenshot({ path: path.join(dir, '4b-jester-result.png') });
    console.log('  jester ✓');
  }

  await wait(1000);
  await page.close();
  await ctx.close(); // flushes video
  // rename the auto-named webm
  const webm = fs.readdirSync(dir).find(f => f.endsWith('.webm'));
  if (webm) fs.renameSync(path.join(dir, webm), path.join(dir, `walkthrough-${label}.webm`));
  console.log(`  saved -> video-assets/${label}/`);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const vite = spawn('node', ['node_modules/vite/bin/vite.js', '--port', String(PORT)],
    { cwd: __dirname, stdio: 'ignore', detached: true });
  vite.unref();
  console.log('vite warming up...');
  await wait(4500);

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    await walkthrough(browser, 'mobile', { width: 390, height: 844 });   // real target device
    await walkthrough(browser, 'desktop', { width: 1280, height: 800 }); // projector/pitch
  } catch (e) { console.error('FATAL:', e.message); }
  await browser.close();
  try { process.kill(-vite.pid); } catch {}
  console.log('\nDONE. Assets in video-assets/');
  process.exit(0);
})();
