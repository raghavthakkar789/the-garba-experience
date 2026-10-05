/* Real-browser checks for explicit opt-in autoscroll and manual takeover. */
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
let browser,server;
(async()=>{
 const root=path.resolve(__dirname,'../dist'),types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2','.mp3':'audio/mpeg','.m4a':'audio/mp4'};
 server=http.createServer((q,s)=>{const name=q.url.split('?')[0],file=path.join(root,name==='/'?'index.html':name);try{s.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');s.end(fs.readFileSync(file));}catch{s.writeHead(404);s.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},...(process.env.IOS?{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',hasTouch:true}:{})}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:'+server.address().port;
 async function ready(){await page.goto(url);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(150);}
 const button=page.locator('#autoscroll-toggle');
 async function pressed(value){assert.equal(await button.getAttribute('aria-pressed'),String(value));}
 async function paused(){await page.waitForFunction(()=>document.querySelector('#autoscroll-toggle').getAttribute('aria-pressed')==='false',{},{timeout:2000});await pressed(false);await page.waitForTimeout(100);const y=await page.evaluate(()=>scrollY);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>scrollY),y,'scroll holds after pause');}
 await ready();await pressed(false);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>scrollY),0,'no unsolicited autoscroll');
 await button.click();await pressed(true);await page.waitForTimeout(500);assert(await page.evaluate(()=>scrollY>0));await button.click();await paused();
 // Fresh start must complete the original entry, then continue into the story.
 await ready();const introStarted=Date.now();await button.click();await page.waitForFunction(()=>!document.querySelector('#invitation').dataset.entering&&scrollY>0,{},{timeout:10000});assert(Date.now()-introStarted>=3450 && Date.now()-introStarted<5200,'autoscroll completes the 3.5-second intro');await pressed(true);const landed=await page.evaluate(()=>scrollY);await page.waitForTimeout(450);assert(await page.evaluate(y=>scrollY>y+10,landed),'continues beyond landing');
 await page.locator('#soundtrack-toggle').click();await pressed(true);await page.mouse.wheel(0,30);await paused();
 await button.click();await pressed(true);await page.locator('.header-link').click();await paused();assert(await page.locator('#original-invitation-dialog').evaluate(d=>d.open));await page.locator('#original-invitation-dialog [data-close]').click();await pressed(false);
 await button.focus();await page.keyboard.press('Enter');await pressed(true);await page.keyboard.press('Escape');await paused();
 await button.focus();await page.keyboard.press('Space');await pressed(true);await page.keyboard.press('ArrowDown');await page.waitForTimeout(400);await paused();
 await button.click();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await paused();await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await pressed(false);
 await button.click();await page.evaluate(()=>document.dispatchEvent(new Event('touchstart',{bubbles:true})));await paused();
 await button.click();await page.evaluate(()=>dispatchEvent(new Event('pagehide')));await paused();
 await button.click();await page.setViewportSize({width:430,height:932});await paused();
 await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight-innerHeight-8,behavior:'instant'}));await button.click();await page.waitForFunction(()=>document.querySelector('#autoscroll-toggle').getAttribute('aria-pressed')==='false');assert(await page.evaluate(()=>Math.abs(scrollY-(document.documentElement.scrollHeight-innerHeight))<=1),'stops at document end');
 await ready();await button.click();await page.reload();await page.evaluate(()=>document.fonts.ready);await pressed(false);assert.equal(await page.evaluate(()=>scrollY),0);
 await page.emulateMedia({reducedMotion:'reduce'});await ready();await button.click();await pressed(true);const staticY=await page.evaluate(()=>scrollY);await page.waitForTimeout(400);assert(await page.evaluate(y=>scrollY>y,staticY),'explicit autoscroll works in reading mode');await button.click();await paused();
 // All three header controls stay visible, separated and usable after audio is enabled.
 for(const [width,height] of [[280,640],[320,568],[320,640],[390,844],[650,900],[651,900],[768,1024],[1024,768],[1440,900]]){
  await page.setViewportSize({width,height});
  const issues=await page.locator('.masthead').evaluate(header=>{const rects=[...header.querySelectorAll('a,button')].filter(e=>!e.hidden).map(e=>({name:e.textContent.trim(),r:e.getBoundingClientRect()})),a=[];for(const {name,r} of rects){if(r.left<0||r.right>innerWidth||r.height<44)a.push(name+' bounds');}for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a1=rects[i].r,b=rects[j].r;if(a1.left<b.right&&a1.right>b.left&&a1.top<b.bottom&&a1.bottom>b.top)a.push('overlapping controls');}return a;});assert.deepEqual(issues,[],`${width}x${height}`);
  if(process.env.SCREENSHOT_DIR&&[390,1440].includes(width)){fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});await page.locator('.masthead').screenshot({path:path.join(process.env.SCREENSHOT_DIR,`autoscroll-${width}.png`)});}
 }
 const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto(url);assert(!(await nojs.locator('#autoscroll-toggle').isVisible()));
 assert.deepEqual(errors,[]);console.log('PASS: fixed-duration intro, opt-in start, full intro and continuation, pause/resume, mute independence, manual takeover, dialogs, keyboard, touch, page exit, resize, reload, end stop, reduced motion, no-JS, and nine header sizes');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
