/* All sponsor/partner card names and artwork across portrait, landscape and enlarged text. */
const assert = require('node:assert/strict'), fs = require('node:fs'), http = require('node:http'), path = require('node:path');
const engines = require('playwright');
let browser, server;
(async () => {
  const root = path.resolve(__dirname, '../dist');
  const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
  server = http.createServer((req,res) => {
    const file = path.join(root, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
    try { res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const engine = process.env.BROWSER || 'chromium';
  browser = await engines[engine].launch(engine === 'chromium' ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']} : {});
  const url = 'http://127.0.0.1:' + server.address().port, errors = [];
  function inspect(card) {
    const issues = [], bounds = card.getBoundingClientRect();
    if (bounds.left < 0 || bounds.top < 0 || bounds.right > innerWidth + 1 || bounds.bottom > innerHeight + 1) issues.push('card outside viewport');
    if (card.scrollWidth > card.clientWidth + 1) issues.push('horizontal overflow');
    const name = card.querySelector('h2,h3'), role = card.querySelector('p'), logo = card.querySelector('img');
    for (const el of [name, role]) {
      const b = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (b.width < 10 || b.height < 10 || style.clipPath !== 'none' || style.visibility === 'hidden') issues.push('hidden text: '+el.textContent);
      if (parseFloat(style.fontSize) < (el === name ? 24 : 12)) issues.push('small text');
      const range = document.createRange(); range.selectNodeContents(el);
      for (const r of range.getClientRects()) if (r.left < bounds.left || r.right > bounds.right || r.top < bounds.top || r.bottom > bounds.bottom) issues.push('clipped text: '+el.textContent);
    }
    if (!logo.hidden) {
      const b = logo.getBoundingClientRect();
      if (!logo.complete || !logo.naturalWidth || b.width < 140 || b.height < 80) issues.push('logo too small or missing');
    }
    return issues;
  }
  for (const [width,height] of [[280,640],[320,568],[320,640],[390,844],[430,932],[600,800],[650,900],[768,1024],[844,390],[1024,768],[1440,900],[1920,1080]]) {
    let page = await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url,{waitUntil:'domcontentloaded'}); await page.evaluate(() => document.fonts.ready);
    const shops = page.locator('.shop-open');
    for (let i=0; i<16; i++) {
      await shops.nth(i).click();
      const dialog = page.locator('#partner-dialog');
      await dialog.locator('img').evaluate(img => img.hidden ? null : img.decode());
      assert.deepEqual(await dialog.evaluate(inspect),[],`${engine} ${width}x${height} partner ${i}`);
      if (process.env.SCREENSHOT_DIR && [390,1440].includes(width) && [1,2,4,9,15].includes(i)) {
        fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});
        await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,`card-${engine}-${width}-${i}.png`)});
      }
      if ([1,10,15].includes(i)) {
        await dialog.evaluate(d => { for(const el of d.querySelectorAll('h2,p')) el.style.fontSize = parseFloat(getComputedStyle(el).fontSize)*2+'px'; });
        const overflow = await dialog.evaluate(d => d.scrollWidth > d.clientWidth+1);
        assert(!overflow,'200% text must reflow horizontally');
        await dialog.locator('[data-close]').click();
        await dialog.evaluate(d => d.querySelectorAll('h2,p').forEach(el=>el.style.removeProperty('font-size')));
      } else await page.keyboard.press('Escape');
    }
    for (let i=0;i<4;i++) {
      await page.locator('.opening-brands .brand-plaque').nth(i).focus();
      await page.keyboard.press('Enter');
      await page.locator('#partner-dialog-logo').evaluate(img=>img.decode());
      assert.deepEqual(await page.locator('#partner-dialog').evaluate(inspect),[],`bottom brand ${i}, ${width}x${height}`);
      await page.keyboard.press('Escape');
    }
    if (height>=640) {
      await page.close();
      page = await browser.newPage({viewport:{width,height}});
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await page.evaluate(()=>document.fonts.ready);
      await page.locator('#autoscroll-toggle').click();
      await page.waitForFunction(()=>!document.querySelector('#invitation').dataset.entering && scrollY>0);
      await page.locator('#autoscroll-toggle').click();
      await page.evaluate(()=>{
        const j=document.querySelector('.journey'),s=document.querySelector('.journey-stage');
        const span=[...document.querySelectorAll('.scene')].reduce((sum,s)=>sum+(Number(s.dataset.scrollSpan)||1),0);
        scrollTo({top:j.getBoundingClientRect().top+scrollY+10.2/span*(j.offsetHeight-s.clientHeight),behavior:'instant'});
      });
      await page.waitForFunction(()=>document.querySelector('#partner-road').classList.contains('is-active')).catch(async e=>{ console.error(await page.evaluate(()=>({y:scrollY,root:document.documentElement.className,active:document.querySelector('.scene.is-active')?.id,height:document.querySelector('.journey').offsetHeight,stage:document.querySelector('.journey-stage').clientHeight}))); throw e; });
      await page.locator('.shop-logo').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
      await page.waitForTimeout(500);
      const stops = await page.evaluate(()=>{
        const road=document.querySelector('#partner-road'),card=road.querySelector('.partner-auto-card'),stops={};
        for(let i=0;i<=1000;i++) {
          road.dispatchEvent(new CustomEvent('story-progress',{detail:i/1000}));
          if(!card.hidden && card.style.getPropertyValue('--partner-card-opacity')==='1.0000') stops[road.dataset.nearbyShop]=i/1000;
        }
        return Object.values(stops);
      });
      assert.equal(stops.length,16,'all automatic cards have a readable center hold: '+await page.evaluate(()=>JSON.stringify({hidden:document.hidden,root:document.documentElement.className,road:document.querySelector('#partner-road').className})));
      for(const progress of stops) {
        await page.evaluate(p=>{
          const j=document.querySelector('.journey'),stage=document.querySelector('.journey-stage'),scenes=[...document.querySelectorAll('.scene')];
          const index=scenes.findIndex(s=>s.id==='partner-road');
          const spans=scenes.map(s=>Number(s.dataset.scrollSpan)||1), total=spans.reduce((a,b)=>a+b,0);
          const cursor=spans.slice(0,index).reduce((a,b)=>a+b,0)+p*spans[index];
          scrollTo({top:j.getBoundingClientRect().top+scrollY+cursor/total*(j.offsetHeight-stage.clientHeight),behavior:'instant'});
        },progress);
        await page.waitForTimeout(80);
        const card=page.locator('.partner-auto-card');
        await card.locator('img').evaluate(img=>img.hidden ? null : img.decode());
        assert.deepEqual(await card.evaluate(inspect),[],`automatic card ${width}x${height}, ${progress}`);
      }
      if(process.env.SCREENSHOT_DIR && [390,1440].includes(width)) await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,`automatic-${engine}-${width}.png`)});
    }
    console.log(`PASS ${engine} ${width}x${height}: 16 partner cards, four brand cards, large text reflow${height>=640?', 16 automatic cards':''}`);
    await page.close();
  }
  assert.deepEqual(errors,[]);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
