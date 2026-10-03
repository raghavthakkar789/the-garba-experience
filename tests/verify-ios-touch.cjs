/* WebKit/Chromium mobile-layout regression. Synthetic events model Safari's
 * non-cancelable moves; physical iPhone/iPad verification remains separate. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const engines = require('playwright');
let browser, server;
(async () => {
  const root = path.resolve(__dirname, '../dist');
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
  server = http.createServer((req, res) => {
    const file = path.join(root, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
    try { res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const engine = process.env.BROWSER || 'webkit';
  browser = await engines[engine].launch(engine === 'chromium' ? {
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  } : {});
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = 'http://127.0.0.1:' + server.address().port;
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  const gesture = (type, y, cancelable = false, count = 1, selector = '.journey-stage') => page.evaluate(({ type, y, cancelable, count, selector }) => {
    const event = new Event(type, { bubbles: true, cancelable });
    Object.defineProperty(event, 'touches', { value: y === null ? [] : Array.from({ length: count }, (_, identifier) => ({ clientY: y, identifier })) });
    document.querySelector(selector).dispatchEvent(event);
    return event.defaultPrevented;
  }, { type, y, cancelable, count, selector });
  async function swipe(cancelable = false) {
    await gesture('touchstart', 650);
    await gesture('touchmove', 550, cancelable);
    await gesture('touchend', null);
  }
  await swipe();
  assert.equal(await page.evaluate(() => scrollY), 0, 'swiping cannot skip the unopened box');
  await page.locator('#invitation-seal').tap();
  await page.waitForFunction(() => !document.querySelector('#invitation').dataset.entering && scrollY > 0);
  assert.equal(await page.locator('.scene.is-active').getAttribute('id'), 'beginning');
  assert(!(await page.locator('html').getAttribute('class')).includes('invitation-locked'));
  assert.equal(await page.locator('.journey-stage').evaluate(el => getComputedStyle(el).touchAction), 'pan-x pinch-zoom');
  const landing = await page.evaluate(() => scrollY);
  await swipe();
  await page.waitForTimeout(300);
  assert(Math.abs(await page.evaluate(() => scrollY) - landing) < 2, 'first dialogue holds');
  await page.waitForTimeout(350);
  await swipe();
  await page.waitForTimeout(400);
  const moved = await page.evaluate(() => scrollY);
  assert(moved > landing + 30, 'non-cancelable swipe must advance after the opening');
  assert(moved <= landing + 701, 'swipe distance remains bounded');
  // Every dialogue must release a new touch gesture, including fractional scroll stops.
  const stops = await page.evaluate(() => {
    const scenes = [...document.querySelectorAll('.scene')], journey = document.querySelector('.journey');
    const spans = scenes.map(s => Number(s.dataset.scrollSpan) || 1), total = spans.reduce((a,b) => a+b,0);
    const unit = (journey.offsetHeight - document.querySelector('.journey-stage').clientHeight) / total;
    let start = 0;
    return scenes.flatMap((scene,index) => {
      const lines = [...scene.querySelectorAll('.dialogue-beat')].map(line => {
        const beat = Number(line.dataset.at) || 0;
        return journey.getBoundingClientRect().top + scrollY + (start + (scene.id === 'beginning' && beat === 0 ? .42 : Math.max(.06,beat+.015))*spans[index])*unit;
      });
      start += spans[index]; return lines;
    });
  });
  for (const stop of stops) {
    await page.keyboard.press('Escape');
    await page.evaluate(y => scrollTo({top:y-18,behavior:'instant'}),stop);
    await page.waitForTimeout(80);
    await swipe();
    await page.waitForTimeout(150);
    const held = await page.evaluate(() => scrollY);
    assert(Math.abs(held-stop)<2,`touch catches every dialogue: stop ${stop}, actual ${held}, scene ${await page.locator('.scene.is-active').getAttribute('id')}`);
    await page.waitForTimeout(500);
    await swipe();
    await page.waitForTimeout(300);
    assert(await page.evaluate(y=>scrollY>y+20,held),`touch resumes after dialogue at ${stop}, actual ${await page.evaluate(()=>scrollY)}`);
  }
  // Start the next swipe during the pause and keep moving after it expires.
  await page.keyboard.press('Escape');
  await page.evaluate(y=>scrollTo({top:y-18,behavior:'instant'}),stops[3]);
  await page.waitForTimeout(80);
  await swipe(); await page.waitForTimeout(150);
  const paused = await page.evaluate(()=>scrollY);
  await gesture('touchstart',650);
  for(let i=1;i<=9;i++) {
    await gesture('touchmove',650-i*12);
    if(i===2) assert.equal(await page.evaluate(()=>scrollY),paused,'minimum half-second pause remains');
    await page.waitForTimeout(80);
  }
  await gesture('touchend',null); await page.waitForTimeout(200);
  assert(await page.evaluate(y=>scrollY>y+20,paused),'new swipe beginning during pause resumes once 500ms expires');
  await page.keyboard.press('Escape');
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),moved);
  await page.waitForTimeout(80);
  await page.keyboard.press('Escape');
  await gesture('touchstart', 650);
  assert(!(await gesture('touchmove', 600, true, 2)), 'pinch is not canceled');
  await gesture('touchmove', 450, true);
  await gesture('touchend', null);
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => scrollY), moved, 'pinch cannot turn into a stale single-finger swipe');
  await page.locator('.header-link').tap();
  assert(await page.locator('#original-invitation-dialog').evaluate(el => el.open));
  assert(!(await gesture('touchstart', 600, true, 1, '#original-invitation-dialog')));
  assert(!(await gesture('touchmove', 400, true, 1, '#original-invitation-dialog')), 'dialog scrolling stays native');
  await gesture('touchend', null);
  await page.keyboard.press('Escape');
  await page.locator('#autoscroll-toggle').tap();
  const autoStart = await page.evaluate(() => scrollY);
  await page.waitForTimeout(700);
  assert(await page.evaluate(y => scrollY > y, autoStart), 'Autoscroll still advances');
  await page.locator('#autoscroll-toggle').tap();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.journey-stage').evaluate(el => getComputedStyle(el).touchAction), 'auto', 'reading mode retains native gestures');
  assert.deepEqual(errors, []);
  console.log(`PASS ${engine}: entry unlock, all eleven dialogue stops/resumes, early fresh swipe, non-cancelable touch, bounded movement, pinch, dialog scrolling, Autoscroll, reading-mode touch policy.`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await browser?.close(); server?.close(); });
