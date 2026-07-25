const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

(async () => {
  const vite = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '3004'], {
    cwd: __dirname,
    stdio: 'ignore',
    detached: true,
  });
  vite.unref();

  await new Promise(r => setTimeout(r, 4000));

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('http://localhost:3004', { waitUntil: 'networkidle2', timeout: 15000 });
  await page.evaluate(() => {
    localStorage.setItem('dana-onboarding', JSON.stringify({
      version: 1, completed: true, currentStepId: 'done',
      answers: { name: 'آزمایش', age: '13-15', future: 'science', curiosity: 'animals' },
      room: 'science',
    }));
  });
  await page.goto('http://localhost:3004', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // Go to reading
  await page.click('#btn-open-reader');
  await new Promise(r => setTimeout(r, 1500));

  // Click the first article
  await page.click('#article-list li:first-child');
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: '../screenshot-article.png' });
  console.log('Article screenshot saved');

  await browser.close();
  vite.kill();
  process.exit(0);
})();
