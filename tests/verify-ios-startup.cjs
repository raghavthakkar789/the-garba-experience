/* Exercise iOS boot without allocating WebGL, and recovery after an unclean load. */
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');let browser,server;
(async()=>{
 const root=path.resolve(__dirname,'../dist');
 server=http.createServer((req,res)=>{const name=req.url.split('?')[0],file=path.join(root,name==='/'?'index.html':name);try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const mode of ['ios','recovery','playback-recovery','storage-blocked','desktop']){
  const page=await browser.newPage({viewport:{width:390,height:844},...(mode==='desktop'?{}:{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'})});
  await page.addInitScript(mode=>{
   window.webglAttempts=0;
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl'){window.webglAttempts++;throw Error('Simulated unavailable GPU')}return original.call(this,type,...args)};
   if(mode==='recovery') sessionStorage.setItem('garba-ios-startup',String(Date.now()));
   if(mode==='playback-recovery') sessionStorage.setItem('garba-ios-playback',String(Date.now()-15000));
   if(mode==='storage-blocked') Storage.prototype.getItem=function(){throw Error('Storage unavailable')};
  },mode);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>window.webglAttempts),mode==='desktop'?1:0,'iOS must not allocate GPU at startup');
  assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('safety-recovery')),mode.includes('recovery'));
  await page.locator('#invitation-seal').click();await page.waitForTimeout(150);await page.keyboard.press('Escape');
  assert(await page.evaluate(()=>scrollY)>0,'entry remains usable without GPU');
  await page.evaluate(()=>{const j=document.querySelector('.journey'),s=document.querySelector('.journey-stage');scrollTo({top:j.offsetTop+3.2/14*(j.offsetHeight-s.clientHeight),behavior:'instant'})});await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>window.webglAttempts),mode.includes('recovery')?0:1,'mesh deferred until boarding; bypassed during crash recovery');
  assert(await page.locator('.journey-elephant .elephant-fallback').isVisible(),'original elephant artwork survives GPU failure');
  assert(!(await page.locator('.journey-elephant').getAttribute('class')).includes('mesh-ready'));
  assert.equal(await page.evaluate(()=>window.garbaTimeline.duration),64);
  await page.evaluate(()=>dispatchEvent(new Event('pagehide')));
  if(mode!=='storage-blocked') assert.equal(await page.evaluate(()=>sessionStorage.getItem('garba-ios-startup')),null,'clean navigation clears recovery marker');
  assert.deepEqual(errors,[]);console.log(`PASS ${mode}: startup, delayed/disabled GPU, visible fallback, entry and clean navigation`);await page.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
