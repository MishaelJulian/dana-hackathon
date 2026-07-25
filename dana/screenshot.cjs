const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

(async () => {
  const vite = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '3001'], {
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
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Skip onboarding — mark it complete in localStorage
    await page.evaluate(() => {
      localStorage.setItem('dana-onboarding', JSON.stringify({
        version: 1, completed: true, currentStepId: 'done',
        answers: { name: 'آزمایش', age: '13-15', future: 'science', curiosity: 'animals' },
        room: 'science', startTime: new Date().toISOString(), completionTime: new Date().toISOString(),
      }));
      localStorage.setItem('dana-garden-state', JSON.stringify({
        lessonsStarted: 3, modulesCompleted: 0, coursesCompleted: 0,
        verificationCount: 1, hashtiyehCount: 0,
      }));
    });

    // Reload to apply
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '../screenshot-landing.png' });
    console.log('Landing screenshot saved');

    // Click palace button
    await page.click('#btn-open-palace');
    await new Promise(r => setTimeout(r, 6000));
    await page.screenshot({ path: '../screenshot-palace.png' });
    console.log('Palace screenshot saved');

  } catch (e) {
    console.error('Error:', e.message);
  }

  await browser.close();
  vite.kill();
  process.exit(0);
})();
