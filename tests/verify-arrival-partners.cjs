/* Arrival dialogue clearance and the three supplied partner logos. */
const assert = require('node:assert/strict'), fs = require('node:fs'), http = require('node:http'), path = require('node:path');
const engines = require('playwright');
let browser, server;
(async () => {
  const root = path.resolve(__dirname, '../dist');
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
  server = http.createServer((req, res) => {
    const file = path.join(root, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
    try { res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const engine = process.env.BROWSER || 'chromium';
  browser = await engines[engine].launch(engine === 'chromium' ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage'] } : {});
  let page;
  const errors = [];
  const url = 'http://127.0.0.1:' + server.address().port;
  async function seek(cursor) {
    await page.evaluate(cursor => {
      const journey = document.querySelector('.journey'), stage = document.querySelector('.journey-stage');
      const span = [...document.querySelectorAll('.scene')].reduce((sum, scene) => sum + (Number(scene.dataset.scrollSpan) || 1), 0);
      scrollTo({ top: journey.getBoundingClientRect().top + scrollY + cursor / span * (journey.offsetHeight - stage.clientHeight), behavior: 'instant' });
    }, cursor);
    await page.waitForTimeout(100);
  }
  for (const [width, height] of [[320,640], [390,844], [768,1024], [1440,900]]) {
    page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url, { waitUntil: 'domcontentloaded' }); await page.evaluate(() => document.fonts.ready);
    await page.locator('#autoscroll-toggle').click();
    await page.waitForFunction(() => !document.querySelector('#invitation').dataset.entering && scrollY > 0);
    await page.locator('#autoscroll-toggle').click();
    for (const cursor of [5.06,5.3,5.435,5.5,5.6,5.435]) {
      await seek(cursor);
      const result = await page.evaluate(() => {
        const line = document.querySelector('#arrival .dialogue-beat.is-speaking');
        const bubble = line.getBoundingClientRect(), ride = document.querySelector('.journey-elephant').getBoundingClientRect();
        const overlapsX = ride.right > bubble.left && ride.left < bubble.right;
        return { clear: !overlapsX || bubble.bottom + 12 <= ride.top, inside: bubble.left >= 0 && bubble.right <= innerWidth && bubble.top >= 0 && bubble.bottom <= innerHeight, text: line.textContent };
      });
      assert(result.clear, `${width}x${height} cursor ${cursor}: bubble/tail overlaps elephant`);
      assert(result.inside, `${width}x${height} cursor ${cursor}: bubble outside frame`);
    }
    await seek(5.6);
    assert(await page.locator('.journey-elephant').evaluate(el => el.hidden), 'elephant clears the entrance viewing hold');
    assert.equal(await page.locator('#arrival').evaluate(el => el.style.getPropertyValue('--passage-opacity')), '0.0000', 'gate stays visible before the passage');
    if (process.env.SCREENSHOT_DIR && [390,1440].includes(width)) {
      fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `arrival-${engine}-${width}.png`) });
    }
    let previousFeet = Infinity;
    for (const cursor of [5.905, 5.93, 5.955]) {
      await seek(cursor);
      const interior = await page.evaluate(() => {
        const scene = document.querySelector('#arrival'), art = scene.querySelector('.entry-passage-art img');
        const box = scene.getBoundingClientRect(), feet = scene.querySelector('.together-art').getBoundingClientRect();
        const zoom = Number(scene.style.getPropertyValue('--zoom'));
        const planeHeight = Math.max(box.height, box.width * art.naturalHeight / art.naturalWidth) * zoom;
        const next = document.querySelector('#a-memory');
        return {passage:Number(scene.style.getPropertyValue('--passage-opacity')),
          nextVisible:next.classList.contains('is-visible'),
          floor:(feet.bottom - box.top - box.height / 2) / planeHeight + .5,
          feet:feet.bottom};
      });
      assert.equal(interior.passage, 1, 'interior decor is fully revealed during its extra second');
      assert(!interior.nextVisible, 'photo scene must not cover the interior viewing interval');
      assert(interior.floor > .665 && interior.floor < .9, 'friends must remain on the passage floor, below its far doorway');
      assert(interior.feet < previousFeet, 'friends continue walking into the passage');
      previousFeet = interior.feet;
    }
    if (process.env.SCREENSHOT_DIR && [390,1440].includes(width))
      await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR, `interior-${engine}-${width}.png`)});
    await seek(10.2);
    for (const [name, file] of [['Hungrito','hungrito.svg'],['Magma','magma.svg'],['Alpha Hospital','alpha-hospital.webp']]) {
      const shop = page.locator('.partner-shop').filter({ has: page.locator('.shop-name', { hasText: name }) });
      const logo = shop.locator('.shop-logo');
      assert.equal(await logo.getAttribute('src'), 'assets/partners/' + file);
      await logo.evaluate(img => img.decode());
      await shop.locator('.shop-open').click();
      assert.equal(await page.locator('#partner-dialog-name').textContent(), name);
      const dialogLogo = page.locator('#partner-dialog-logo');
      await dialogLogo.evaluate(img => img.decode());
      assert(await dialogLogo.isVisible());
      assert.equal(await dialogLogo.getAttribute('src'), 'assets/partners/' + file);
      if (process.env.SCREENSHOT_DIR && width === 390) await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `partner-${name.replaceAll(' ','-')}.png`) });
      await page.keyboard.press('Escape');
    }
    console.log(`PASS ${engine} ${width}x${height}: both arrival bubbles clear elephant in forward/reverse travel; all three supplied logos decode and open in partner dialogs.`);
    await page.close();
  }
  assert.deepEqual(errors, []);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await browser?.close(); server?.close(); });
