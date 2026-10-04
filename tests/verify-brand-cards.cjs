/* Focused browser regression: clickable brand plaques and final-page reflow. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../dist');
let browser, server;
(async () => {
  const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2','.mp3':'audio/mpeg','.m4a':'audio/mp4'};
  server = http.createServer((req, res) => {
    const name = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(root, name === '/' ? 'index.html' : name);
    try { res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH, args:['--no-sandbox','--disable-dev-shm-usage']});
  const page = await browser.newPage({reducedMotion:'reduce'});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const [width,height] of [[280,640],[320,568],[320,640],[390,844],[540,720],[650,900],[651,900],[768,1024],[844,390],[1024,768],[1440,900],[1920,1080]]) {
    await page.setViewportSize({width,height});
    await page.goto(url); await page.evaluate(() => document.fonts.ready);
    await page.locator('#details').scrollIntoViewIfNeeded();
    await page.locator('#details img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode().catch(() => {}))));
    for (const enlarged of [false,true]) {
      if (enlarged) await page.evaluate(() => {
        const textElements = [...document.querySelectorAll('#details *')]
          .filter(el => [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()))
          .map(el => [el,parseFloat(getComputedStyle(el).fontSize)]);
        textElements.forEach(([el,size]) => { el.style.fontSize = (size * 2) + 'px'; });
      });
      const failures = await page.evaluate(() => {
        const issues = [], final = document.querySelector('#details'), bounds = final.getBoundingClientRect();
        const art = final.querySelector('.thank-you-art').getBoundingClientRect();
        const details = final.querySelector('.thank-you-details').getBoundingClientRect();
        if (art.left < details.right - 1 && art.right > details.left + 1 && art.top < details.bottom - 1 && art.bottom > details.top + 1) issues.push('art overlaps details');
        const children = [...final.querySelector('.thank-you-scene').children].filter(e => !e.matches('.thank-you-arch'));
        children.slice(1).forEach((el,i) => { if (el.getBoundingClientRect().top < children[i].getBoundingClientRect().bottom - 1) issues.push('overlapping final sections'); });
        for (const el of final.querySelectorAll('*')) {
          if (el.closest('.thank-you-art') || el.matches('.thank-you-arch,.brand-logo img')) continue;
          const r = el.getBoundingClientRect();
          if (r.width && (r.left < bounds.left - 1 || r.right > bounds.right + 1)) issues.push('element outside final page: ' + el.className);
          for (const node of el.childNodes) {
            if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
            const range = document.createRange(); range.selectNodeContents(node);
            for (const line of range.getClientRects()) {
              if (line.left < bounds.left - 1 || line.right > bounds.right + 1) issues.push('text outside final page: ' + node.textContent);
              const control = el.closest('a,button');
              if (control) { const c = control.getBoundingClientRect(); if (line.left < c.left - 1 || line.right > c.right + 1 || line.bottom > c.bottom + 1) issues.push('clipped control label: ' + node.textContent); }
            }
          }
        }
        for (const a of final.querySelectorAll('a,button')) if (a.getBoundingClientRect().height < 44) issues.push('small touch control');
        return issues;
      });
      assert.deepEqual(failures, [], `${width}x${height}, enlarged=${enlarged}`);
      if (!enlarged && process.env.SCREENSHOT_DIR && [390,1440].includes(width)) {
        fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});
        await page.locator('#details').screenshot({path:path.join(process.env.SCREENSHOT_DIR,`final-${width}.png`),style:'.masthead,.skip-link,.progress-line{visibility:hidden!important}'});
      }
    }
    // Fresh layout after the text-size stress test.
    await page.goto(url); await page.locator('#details').scrollIntoViewIfNeeded();
    for (let i=0;i<4;i++) {
      const trigger = page.locator('.finale-brands .brand-plaque').nth(i);
      const name = await trigger.getAttribute('data-brand-name');
      const source = await trigger.locator('img').getAttribute('src');
      await trigger.click();
      const dialog = page.locator('#partner-dialog');
      assert(await dialog.evaluate(d => d.open));
      assert.equal(await dialog.locator('#partner-dialog-name').textContent(),name);
      assert.equal(await dialog.locator('#partner-dialog-role').textContent(),i === 0 ? 'The event' : i === 3 ? 'Partner' : 'Presented by');
      assert.equal(await dialog.locator('img').getAttribute('src'),source);
      assert(await dialog.locator('#partner-dialog-name').isVisible());
      const box = await dialog.boundingBox();
      assert(box.x >= 0 && box.y >= 0 && box.x+box.width <= width+1 && box.y+box.height <= height+1,'dialog fits viewport');
      assert(Math.abs(box.x+box.width/2-width/2)<2 && Math.abs(box.y+box.height/2-height/2)<2,'dialog centered');
      if (width === 390 && i === 3 && process.env.SCREENSHOT_DIR) await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'ethereum-card.png')});
      await page.keyboard.press('Escape');
      assert(await trigger.evaluate(el => el === document.activeElement),'focus returns to plaque');
    }
    console.log(`PASS ${width}x${height}: final page, 200% text, all four brand cards`);
  }
  await page.setViewportSize({width:390,height:844}); await page.emulateMedia({reducedMotion:'no-preference'}); await page.goto(url);
  for (let i=0;i<4;i++) {
    const trigger=page.locator('.stage-brands .brand-plaque').nth(i);await trigger.click();
    assert(await page.locator('#partner-dialog').evaluate(d=>d.open));await page.locator('#partner-dialog [data-close]').click();
  }
  const keyboardTrigger=page.locator('.stage-brands .brand-ethereum');await keyboardTrigger.focus();await page.keyboard.press('Enter');
  assert(await page.locator('#partner-dialog').evaluate(d=>d.open));await page.mouse.click(5,5);assert(!(await page.locator('#partner-dialog').evaluate(d=>d.open)));
  const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:320,height:640}});await nojs.goto(url);
  assert(await nojs.locator('.opening-brands a').first().isVisible());assert.equal(await nojs.locator('.opening-brands a').count(),4);
  assert.deepEqual(errors,[]);
  console.log('PASS: cinematic rail pointer/keyboard access, close/backdrop/Escape, focus return, and no-JavaScript logo links');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
