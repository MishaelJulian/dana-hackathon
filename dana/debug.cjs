const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

(async () => {
  const vite = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '3003'], {
    cwd: __dirname,
    stdio: 'ignore',
    detached: true,
  });
  vite.unref();

  await new Promise(r => setTimeout(r, 4000));

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Capture console
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3003', { waitUntil: 'networkidle2', timeout: 15000 });
  await page.evaluate(() => {
    localStorage.setItem('dana-onboarding', JSON.stringify({
      version: 1, completed: true, currentStepId: 'done',
      answers: { name: 'آزمایش', age: '13-15', future: 'science', curiosity: 'animals' },
      room: 'science',
    }));
  });
  await page.goto('http://localhost:3003', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // Go to reading
  await page.click('#btn-open-reader');
  await new Promise(r => setTimeout(r, 2000));

  // Debug: check article list
  const debug = await page.evaluate(() => {
    const list = document.getElementById('article-list');
    const sidebar = document.getElementById('reading-sidebar');
    return {
      listExists: !!list,
      listHTML: list ? list.innerHTML.substring(0, 500) : 'null',
      listChildCount: list ? list.children.length : 0,
      sidebarExists: !!sidebar,
      sidebarWidth: sidebar ? getComputedStyle(sidebar).width : 'null',
      sidebarDisplay: sidebar ? getComputedStyle(sidebar).display : 'null',
      readingDisplay: document.querySelector('.reading') ? getComputedStyle(document.querySelector('.reading')).display : 'null',
    };
  });
  console.log('DEBUG:', JSON.stringify(debug, null, 2));

  await browser.close();
  vite.kill();
  process.exit(0);
})();
