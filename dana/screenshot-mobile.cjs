const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

(async () => {
  const vite = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '3005'], {
    cwd: __dirname,
    stdio: 'ignore',
    detached: true,
  });
  vite.unref();

  await new Promise(r => setTimeout(r, 4000));

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  // Mobile viewport (iPhone-sized)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:3005', { waitUntil: 'networkidle2', timeout: 15000 });
  await page.evaluate(() => {
    localStorage.setItem('dana-onboarding', JSON.stringify({
      version: 1, completed: true, currentStepId: 'done',
      answers: { name: 'آزمایش', age: '13-15', future: 'science', curiosity: 'animals' },
      room: 'science',
    }));
  });
  await page.goto('http://localhost:3005', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // Landing
  await page.screenshot({ path: '../screenshot-mobile-landing.png' });
  console.log('Mobile landing saved');

  // Reading with article
  await page.click('#btn-open-reader');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '../screenshot-mobile-reading.png' });
  console.log('Mobile reading saved');

  // Click article
  await page.click('#article-list li:first-child');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '../screenshot-mobile-article.png' });
  console.log('Mobile article saved');

  // Back to landing, then palace
  await page.click('#btn-back');
  await new Promise(r => setTimeout(r, 1000));
  await page.click('#btn-open-palace');
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: '../screenshot-mobile-palace.png' });
  console.log('Mobile palace saved');

  await browser.close();
  vite.kill();
  process.exit(0);
})();
