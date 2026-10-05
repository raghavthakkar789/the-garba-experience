/* Black-box browser timing contract, including a stalled frame and pause/resume. */
const assert = require('node:assert/strict'), fs = require('node:fs'), http = require('node:http'), path = require('node:path');
const engines = require('playwright');
let browser, server;
// Exact added time belongs to the three requested actions, not nearby waits.
const vm = require('node:vm'), context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../dist/autoscroll-timeline.js'), 'utf8'), context);
const timeline = context.window.garbaTimeline;
const close = (actual, expected) => assert(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
close(timeline.timeAt(1), 1.5 * 1.9 / 4.7 + 1);
close(timeline.timeAt(1.42) - timeline.timeAt(1), 1.5 * 2.8 / 4.7 + 1);
close(timeline.timeAt(3.47) - timeline.timeAt(3.25), 1.5 * .22 + 1);
close(timeline.duration, 64);
close(timeline.timeAt(5.96) - timeline.timeAt(5.90), 1);
close(timeline.timeAt(14) - timeline.timeAt(10), 20);
for(let seconds = 25.3; seconds < 30.4; seconds += .1)
  assert(timeline.cursorAt(seconds + .1) > timeline.cursorAt(seconds), 'entrance cursor must not freeze');
(async () => {
  const root = path.resolve(__dirname, '../dist');
  const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
  server = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
    try { res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const engine = process.env.BROWSER || 'chromium';
  browser = await engines[engine].launch(engine === 'chromium' ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']} : {});
  const url = `http://127.0.0.1:${server.address().port}`;
  for (const mode of ['cinematic', 'short', 'reduced']) {
    const page = await browser.newPage({...(process.env.IOS ? {userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',hasTouch:true} : {}),viewport:mode === 'short' ? {width:844,height:390} : {width:390,height:844},reducedMotion:mode === 'reduced' ? 'reduce' : 'no-preference'});
    const errors = [], missing = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', res => {if(res.status() >= 400) missing.push(res.url());});
    // Install before scripts load so GSAP and performance.now share the controlled clock.
    await page.clock.install({time:new Date("2026-10-03T12:00:00Z")});
    await page.goto(url); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(100);
    if (process.env.IOS_LIGHT) await page.evaluate(() => document.documentElement.classList.add('safety-light-effects'));
    const playbackMarked = () => page.evaluate(() => sessionStorage.getItem('garba-ios-playback') !== null);
    await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 1000));
    const advance = async ms => {
      if (ms > 64) await page.clock.fastForward(ms - 64);
      // Flush the browser scroll event between virtual frames. A single clock
      // jump can otherwise observe the new scrollY before its animation render.
      for (let remaining = Math.min(64, ms); remaining > 0; remaining -= 16) {
        await page.clock.runFor(Math.min(16, remaining));
        await page.evaluate(() => dispatchEvent(new Event('scroll')));
      }
    };
    const button = page.locator('#autoscroll-toggle');
    // DOM activation avoids locator stability timers changing the controlled clock.
    const click = () => button.evaluate(el => el.click());
    const state = () => page.evaluate(() => {
      const journey = document.querySelector('.journey'), stage = document.querySelector('.journey-stage');
      return {cursor:(scrollY - journey.offsetTop) / (journey.offsetHeight - stage.clientHeight) * 14,
        y:scrollY,end:document.documentElement.scrollHeight-innerHeight,
        running:document.querySelector('#autoscroll-toggle').getAttribute('aria-pressed') === 'true',
        gate:Number(document.querySelector('#arrival').style.getPropertyValue('--passage-opacity')),
        elephant:!document.querySelector('.journey-elephant').hidden};
    });
    await click();
    assert.equal(await playbackMarked(), !!process.env.IOS, 'playback marker only on iOS');
    await advance(3504);
    assert((await state()).running);
    if(mode === 'cinematic') assert(Math.abs((await state()).cursor - 1.42) < .03, 'opening is included in total');
    // Skip rendering to simulate a busy main thread: timing must catch up.
    await page.clock.fastForward(19496);
    await advance(32);
    if(mode === 'cinematic') assert(Math.abs((await state()).cursor - windowlessCursor(23.032)) < .04, 'dropped frames do not stretch time');
    await advance(3268); // 26.3 s, inside the clear-gate viewing interval.
    const gate = await state();
    if(mode === 'cinematic') {assert(gate.cursor>5.6 && gate.cursor<5.62);assert(!gate.elephant, JSON.stringify(gate));assert.equal(gate.gate,0);}
    if (process.env.IOS) assert(await playbackMarked(), 'playback remains guarded after startup expires');
    await click(); const paused = (await state()).y;
    assert.equal(await playbackMarked(), false, 'pause clears recovery state');
    await advance(5000); assert.equal((await state()).y,paused);
    await click(); await advance(1000);
    if(mode === 'cinematic') {
      const resumed = await state();
      assert(resumed.cursor > gate.cursor + .07 && resumed.cursor < gate.cursor + .10, 'friends continue walking after resume');
      assert(!resumed.elephant); assert.equal(resumed.gate, 0, 'gate stays visible while friends move');
    }
    await advance(15200); // 42.5 s active time.
    // Two quantized samples (pause and resume) can differ by up to 50ms at 30fps.
    if(mode === 'cinematic') assert(Math.abs(timeline.timeAt((await state()).cursor)-42.5)<(process.env.IOS_LIGHT?.05:.03),'partner section starts at 42.5s: '+JSON.stringify(await state()));
    await advance(10000);
    if(mode === 'cinematic') assert(Math.abs((await state()).cursor-12)<.02,'partners receive twenty seconds: '+JSON.stringify(await state()));
    await advance(10000);
    if(mode === 'cinematic') assert(Math.abs((await state()).cursor-14)<.02,'partners end at 62.5s');
    assert((await state()).running,'finale remains in total duration');
    await advance(1550);
    const end = await state(); assert(!end.running,`${mode}: stops at 64s`);assert(Math.abs(end.y-end.end)<=1,`${mode}: reaches page end`);
    assert.equal(await playbackMarked(), false, 'completion clears recovery state');
    assert.deepEqual(errors,[]); assert.deepEqual(missing,[]);
    console.log(`PASS ${engine} ${mode}: 64s total, pause time excluded, stalled frame recovery, page end, no missing runtime assets`);
    await page.close();
  }
})().catch(error => {console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
function windowlessCursor(seconds) { return 4 + (seconds-22)/1.5; }
