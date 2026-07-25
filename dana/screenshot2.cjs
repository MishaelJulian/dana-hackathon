const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

(async () => {
  const vite = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '3002'], {
    cwd: __dirname,
    stdio: 'ignore',
    detached: true,
  });
  vite.unref();

  console.log('Waiting for Vite server...');
  await new Promise(r => setTimeout(r, 4000));

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // Skip onboarding
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.evaluate(() => {
      localStorage.setItem('dana-onboarding', JSON.stringify({
        version: 1, completed: true, currentStepId: 'done',
        answers: { name: 'آزمایش', age: '13-15', future: 'science', curiosity: 'animals' },
        room: 'science', startTime: new Date().toISOString(), completionTime: new Date().toISOString(),
      }));
    });
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Go to reading screen
    await page.click('#btn-open-reader');
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '../screenshot-reading.png' });
    console.log('Reading screenshot saved');

    // Go to palace
    await page.click('#btn-back');
    await new Promise(r => setTimeout(r, 1000));
    await page.click('#btn-open-palace');
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: '../screenshot-palace2.png' });
    console.log('Palace screenshot saved');

  } catch (e) {
    console.error('Error:', e.message);
  }

  await browser.close();
  vite.kill();
  process.exit(0);
})();
