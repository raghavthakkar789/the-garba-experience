/* Real GSAP/ScrollToPlugin: isolate platform dispatch, takeover and dependency failures. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');let browser,server;
(async()=>{
 const root=path.resolve(__dirname,'../dist');
 server=http.createServer((req,res)=>{try{const n=req.url.split('?')[0],f=path.join(root,n==='/'?'index.html':n);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 const iphone='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
 for(const mode of ['iphone','ipad','android','desktop']){
  const ios=['iphone','ipad'].includes(mode),page=await browser.newPage({viewport:{width:390,height:844},userAgent:mode==='iphone'?iphone:mode==='ipad'?'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15':mode==='android'?'Mozilla/5.0 (Linux; Android 14) Chrome/120.0 Mobile Safari/537.36':'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0'});
  const requests=[],errors=[];page.on('request',r=>{if(r.url().includes('/vendor/'))requests.push(r.url())});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(mode=>{
   if(mode==='ipad'){Object.defineProperty(navigator,'platform',{value:'MacIntel'});Object.defineProperty(navigator,'maxTouchPoints',{value:5})}
   window.driverCalls={plugin:0,legacy:0};const original=window.scrollTo;
   window.scrollTo=function(...args){const stack=Error().stack||'';if(stack.includes('ScrollToPlugin.min.js'))driverCalls.plugin++;if(stack.includes('advanceAutoScroll'))driverCalls.legacy++;return original.apply(this,args)};
  },mode);
  await page.goto(url);await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>!!window.gsap),ios);assert.equal(requests.length,ios?2:0,'only iOS downloads GSAP');
  const styles=()=>page.evaluate(()=>[document.documentElement,document.body].map(n=>[n.style.getPropertyValue('scroll-behavior'),n.style.getPropertyPriority('scroll-behavior')]));
  const before=await styles();await page.locator('#autoscroll-toggle').click();await page.waitForTimeout(450);
  assert(await page.evaluate(()=>scrollY)>0);
  const calls=await page.evaluate(()=>driverCalls);
  assert(ios?calls.plugin>0&&calls.legacy===0:calls.legacy>0&&calls.plugin===0,`${mode}: exactly one driver ${JSON.stringify(calls)}`);
  if(ios)assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.journey-stage')).touchAction),'auto');
  await page.locator('#autoscroll-toggle').click();const y=await page.evaluate(()=>scrollY);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>scrollY),y);
  assert.deepEqual(await styles(),before,'restore original CSS scrolling after pause');
  if(ios)assert.equal(await page.evaluate(()=>gsap.getTweensOf(window).length),0,'no orphan scroll tween');
  assert.deepEqual(errors,[]);console.log(`PASS ${mode}: vendor isolation, one driver, native-touch policy, pause and CSS restoration`);await page.close();
 }
 for(const mode of ['failed-load','cancel-loading','timeout-loading']){
  const page=await browser.newPage({viewport:{width:390,height:844},userAgent:iphone});let release;
  const gate=new Promise(r=>release=r);
  await page.route('**/vendor/**',async route=>{
   if(mode==='failed-load')return route.abort();
   await gate;return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,new URL(route.request().url()).pathname),'utf8')});
  });
  if(mode==='timeout-loading')await page.clock.install();
  await page.goto(url,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
  const button=page.locator('#autoscroll-toggle');await button.click();
  if(mode==='cancel-loading'){
   assert.equal(await button.getAttribute('aria-busy'),'true');await button.click();release();await page.waitForTimeout(300);
  }else if(mode==='timeout-loading'){await page.clock.fastForward(10050);release();await page.waitForTimeout(300);
  }else await page.waitForFunction(()=>document.querySelector('#autoscroll-toggle').getAttribute('aria-pressed')==='false');
  assert.equal(await button.getAttribute('aria-pressed'),'false');assert.equal(await button.getAttribute('aria-busy'),null);
  assert.equal(await page.evaluate(()=>scrollY),0,'a failed/cancelled load never starts late');
  if(mode!=='failed-load'){
   await button.click();await page.waitForTimeout(200);assert(await page.evaluate(()=>scrollY)>0,'later explicit start succeeds');await button.click();
  }
  console.log(`PASS ${mode}: safe cancellation/failure without a competing legacy loop`);await page.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
