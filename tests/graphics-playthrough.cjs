// Assisted end-to-end wave check. Serve the repository on localhost:8765.
// Only the test page receives invulnerability and accelerated simulation.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const out = process.env.STARFALL_ARTIFACTS || '/tmp/starfall-graphics-review';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:8765');
    await page.waitForFunction(() => document.getElementById('graphics-panel').dataset.state === 'ready');
    await page.locator('#stage').screenshot({ path: path.join(out, 'home.png') });
    await page.locator('#btn-play').click();
    await page.locator('#btn-lc-go').click();
    await page.waitForFunction(() => G.mode === 'playing');
    if (await page.locator('#coach-skip').isVisible()) await page.locator('#coach-skip').click();
    await page.mouse.move(195, 650);
    await page.mouse.down();
    await page.mouse.move(245, 610, { steps: 8 });
    await page.mouse.up();
    await page.evaluate(() => {
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = fn => fn.name === 'loop' ? 0 : raf(fn);
      G.player.invuln = 10000;
      let steps = 0;
      window.reviewSegment = goal => new Promise((resolve, reject) => {
        function frame() {
          for (let i = 0; i < 32; i++) {
            const target = G.boss || G.enemies.filter(e => !e.dead && e.y < G.player.y - 50)
              .sort((a, b) => b.y - a.y)[0];
            Input.dragging = steps % 90 !== 0;
            Input.px = target ? target.x : W / 2;
            Input.py = H - 15;
            update(1 / 60);
            steps++;
            const entered = goal === 'boss' && G.boss && G.boss.state === 'fight';
            const cleared = goal === 'clear' && ['bossdown', 'warp'].includes(G.waveState);
            if (entered || cleared) {
              render();
              resolve({ time: G.runTime, score: G.score, state: G.waveState, boss: G.boss?.kind });
              return;
            }
            if (steps > 60 * 420) { reject(Error('Full-wave play-through timed out')); return; }
          }
          render();
          raf(frame);
        }
        raf(frame);
      });
    });
    const boss = await page.evaluate(() => reviewSegment('boss'));
    // Let real-time DOM entrance animations complete before capturing the fight.
    await page.waitForTimeout(3500);
    await page.locator('#stage').screenshot({ path: path.join(out, 'boss-fight.png') });
    await page.locator('#btn-pause').click();
    await page.locator('#scr-pause.on').waitFor();
    await page.locator('#stage').screenshot({ path: path.join(out, 'pause.png') });
    await page.locator('#btn-resume').click();
    await page.waitForFunction(() => G.mode === 'playing');
    const clear = await page.evaluate(() => reviewSegment('clear'));
    if (errors.length) throw Error(errors.join('\n'));
    console.log(JSON.stringify({ boss, clear, errors, artifacts: out }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
