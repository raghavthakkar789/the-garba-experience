/* Browser layout audit. Requires Playwright and CHROMIUM_EXECUTABLE_PATH. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../dist');
const dimensions = process.env.VIEWPORTS ? JSON.parse(process.env.VIEWPORTS) : [[320,568],[320,640],[360,640],[390,844],[430,932],[650,900],[651,900],[768,1024],[1024,768],[1440,640],[1440,900],[1920,1080],[2560,1080],[844,390],[1280,720],[1024,1366]];
const failures=[], errors=[];
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.mp3':'audio/mpeg','.m4a':'audio/mp4'};
let browser, server;
async function inspect(page, tag) {
 const found=await page.evaluate(()=>{
  const issues=[];
  const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&!el.closest('[hidden],[inert]');};
  if(document.documentElement.scrollWidth>innerWidth+1) issues.push('page overflow '+document.documentElement.scrollWidth);
  const active=document.querySelector('.scene.is-active');
  for(const el of document.querySelectorAll('.masthead a,.masthead button,.scene.is-active .scene-actions a,.scene.is-active .scene-actions button')) {
   if(!visible(el)) continue;const r=el.getBoundingClientRect();
   if(r.left<-.5||r.right>innerWidth+.5||r.top<0||r.bottom>innerHeight+.5)issues.push('control outside viewport: '+el.textContent.trim());
   if(r.height<43.5)issues.push('small control: '+el.textContent.trim()+' '+r.height);
  }
  if(document.documentElement.classList.contains('cinematic')&&active){
   const strip=document.querySelector('.stage-brands').getBoundingClientRect();
   for(const el of active.querySelectorAll('.scene-actions,.elephant-entry-disclaimer')){
    if(!visible(el))continue;const r=el.getBoundingClientRect();
    if(r.bottom>strip.top-2)issues.push('brand strip overlaps '+el.className);
   }
   if(active.id==='the-invitation'){
    const logo=active.querySelector(innerWidth<=650?'.wall-brand-mobile image':'.wall-brand-desktop image').getBoundingClientRect();
    const title=active.querySelector('.story-title').getBoundingClientRect();
    if(logo.width<65||logo.height<40)issues.push('handoff logo too small '+logo.width+'x'+logo.height);
    if(logo.top<title.bottom+8)issues.push('handoff logo overlaps heading');
    const bubble=active.querySelector('.dialogue-beat.is-speaking')?.getBoundingClientRect();
    if(bubble&&logo.right>bubble.left&&logo.left<bubble.right&&logo.bottom>bubble.top-5)issues.push('handoff logo overlaps speech');
   }
  }
  for(const el of document.querySelectorAll('a,button,.photo-input')){
   if(el.matches('.box-hit-area'))continue;
   const logo = el.querySelector('img[alt]') || (el.matches('.shop-open') && el.closest('.partner-shop')?.querySelector('.shop-logo'));
   if(!el.querySelector('svg') && !logo)issues.push('missing icon or logo: '+(el.id||el.textContent.trim()));
   if(!el.textContent.trim() && !(logo && (el.getAttribute('aria-label') || logo.alt)))issues.push('missing action name: '+el.className);
  }
  return issues;
 });
 failures.push(...found.map(x=>tag+': '+x));
}
async function at(page,cursor) {
 await page.evaluate(n=>{const j=document.querySelector('.journey'),span=[...document.querySelectorAll('.scene')].reduce((s,e)=>s+(+e.dataset.scrollSpan||1),0);scrollTo({top:j.offsetTop+(n/span)*(j.offsetHeight-innerHeight),behavior:'instant'});},cursor);
 // Wait for the scroll-driven scene controller, not a fixed machine-speed delay.
 await page.waitForFunction(n=>{
  const scenes=[...document.querySelectorAll('.scene')];let start=0;
  const scene=scenes.find(el=>{const end=start+(+el.dataset.scrollSpan||1);const found=n>=start&&n<end;start=end;return found;});
  return scene?.classList.contains('is-active');
 },cursor);
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
(async()=>{
 server=http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';p=path.join(root,p);
  try{res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));}catch{res.writeHead(404);res.end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height] of dimensions){
  await page.setViewportSize({width,height});await page.goto(url);await page.evaluate(()=>document.fonts.ready);
  await inspect(page,width+'x'+height+' opening');
  if(await page.locator('#invitation-seal').isVisible()){await page.locator('#invitation-seal').click();await page.keyboard.press('Escape');}
  const cinematic=await page.evaluate(()=>document.documentElement.classList.contains('cinematic'));
  if(cinematic){
   for(let i=1;i<=10;i++){await at(page,i+.3);await inspect(page,width+'x'+height+' scene '+i);}
   for(const beat of [.02,.2,.4,.6]){await at(page,2+beat);await inspect(page,width+'x'+height+' handoff '+beat);}
  }
  await page.locator('#details').scrollIntoViewIfNeeded();
  const finalIssues=await page.evaluate(()=>{
   const issues=[],panel=document.querySelector('.thank-you-details'),p=panel.getBoundingClientRect();
   if(p.left<0||p.right>innerWidth)issues.push('final panel outside viewport');
   for(const el of panel.querySelectorAll('a,button')){const r=el.getBoundingClientRect();if(r.left<p.left||r.right>p.right||r.height<44)issues.push('final control bounds '+el.textContent);}
   for(const selector of ['.thank-you-date','.thank-you-venue','.entry-note'])if(parseFloat(getComputedStyle(document.querySelector(selector)).fontSize)<12)issues.push('small final text '+selector);
   if(document.documentElement.scrollWidth>innerWidth+1)issues.push('final overflow');return issues;
  });failures.push(...finalIssues.map(x=>width+'x'+height+': '+x));
  if(process.env.SCREENSHOT_DIR&&[390,1440].includes(width)&&height>800){
   fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});
   await page.locator('#details img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode().catch(()=>{}))));
   await page.locator('#details').screenshot({path:path.join(process.env.SCREENSHOT_DIR,'final-'+width+'.png'),style:'.masthead,.skip-link,.progress-line{visibility:hidden!important}'});
   await at(page,2.6);await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'handoff-'+width+'.png')});
   await at(page,10.1);await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'partners-'+width+'.png')});
  }
  console.log('CHECKED '+width+'x'+height+(cinematic?' cinematic':' static'));
 }
 // Dialog usability and dynamic button labels are checked in a narrow viewport.
 await page.setViewportSize({width:320,height:640});await page.goto(url);await page.evaluate(()=>document.fonts.ready);
 await page.locator('.header-link').click();assert(await page.locator('#original-invitation-dialog').evaluate(d=>d.open));await page.locator('#original-invitation-dialog [data-close]').click();
 await page.locator('#invitation-seal').click();await page.keyboard.press('Escape');
 await at(page,6.3);await page.locator('#take-story-photo').click();assert.equal(await page.locator('#take-story-photo svg').count(),1);
 await page.locator('#make-memory').click();assert(await page.locator('#memory-dialog').evaluate(d=>d.open));await page.locator('#memory-dialog [data-close]').click();
 await at(page,10.1);await page.locator('.shop-open').first().click();assert(await page.locator('#partner-dialog').evaluate(d=>d.open));assert(await page.locator('#partner-dialog').evaluate(d=>d.classList.contains('featured-partner')));await page.locator('#partner-dialog [data-close]').click();
 await page.setViewportSize({width:1440,height:900});await page.goto(url);await page.evaluate(()=>document.fonts.ready);await page.locator('#invitation-seal').click();await page.keyboard.press('Escape');
 await at(page,7.3);assert.equal(await page.locator('.flower-petal').first().evaluate(e=>getComputedStyle(e).animationPlayState),'running');
 await at(page,8.3);assert.equal(await page.locator('.stage-beam').first().evaluate(e=>getComputedStyle(e).animationPlayState),'running');
 const beam=await page.locator('.stage-beam').first().evaluate(e=>getComputedStyle(e).transform);await page.waitForTimeout(150);assert.notEqual(await page.locator('.stage-beam').first().evaluate(e=>getComputedStyle(e).transform),beam);
 await at(page,9.3);const circle=await page.locator('.garba-ring').first().getAttribute('style');await page.waitForTimeout(150);assert.notEqual(await page.locator('.garba-ring').first().getAttribute('style'),circle);
 await at(page,10.1);assert.equal(await page.locator('.stage-beam').first().evaluate(e=>getComputedStyle(e).animationPlayState),'paused');
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url);await page.evaluate(()=>document.fonts.ready);assert(await page.evaluate(()=>document.documentElement.classList.contains('read-mode')));await inspect(page,'reduced motion');
 const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:320,height:640}});await nojs.goto(url);assert(await nojs.locator('.opening-brands').isVisible());assert(await nojs.locator('.thank-you-details').isVisible());
 assert.deepEqual(errors,[],'browser exceptions');
 assert.deepEqual([...new Set(failures)],[],'layout findings');
 console.log('PASS: '+dimensions.length+' viewport sizes, every cinematic scene, four handoff dialogue beats, final-page controls, original invitation/keepsake/partner dialogs, dynamic icon preservation, reduced motion and no-JavaScript.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close();});
