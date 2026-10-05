/* Isolate the optional GPU elephant from iOS Autoscroll, preserving manual rendering. */
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');let browser,server;
(async()=>{
 const root=path.resolve(__dirname,'../dist');
 server=http.createServer((req,res)=>{try{const n=req.url.split('?')[0],f=path.join(root,n==='/'?'index.html':n);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
 await page.clock.install({time:new Date('2026-10-05T10:00:00Z')});
 await page.addInitScript(()=>{
  window.gpuAttempts=0;window.uploads=[];
  const original=HTMLCanvasElement.prototype.getContext;
  const gl=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,isContextLost:()=>false,texImage2D:(...a)=>uploads.push(a.length===9?[a[3],a[4]]:[a[5].naturalWidth,a[5].naturalHeight])},{get:(o,k)=>k in o?o[k]:/^[A-Z_0-9]+$/.test(k)?1:()=>({})});
  HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl'){gpuAttempts++;return gl}return original.call(this,type,...args)};
 });
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.evaluate(()=>document.fonts.ready);
 await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now())+1000));
 const click=()=>page.locator('#autoscroll-toggle').evaluate(e=>e.click());
 const advance=async ms=>{await page.clock.fastForward(ms-64);for(let i=0;i<4;i++){await page.clock.runFor(16);await page.evaluate(()=>dispatchEvent(new Event('scroll')))}};
 await click();await advance(20500);
 assert.equal(await page.evaluate(()=>gpuAttempts),0,'iOS automatic elephant scene must not allocate WebGL');
 const art=page.locator('.elephant-fallback');assert(await art.isVisible());
 assert.equal(await art.evaluate(e=>getComputedStyle(e).opacity),'1');
 const first=await page.locator('.journey-elephant').evaluate(e=>e.getBoundingClientRect().x);
 await advance(2000);
 const second=await page.locator('.journey-elephant').evaluate(e=>e.getBoundingClientRect().x);assert.notEqual(first,second,'original artwork still follows the journey');
 await click();await page.clock.runFor(100);await page.waitForTimeout(100);await page.clock.runFor(100);
 assert.equal(await page.evaluate(()=>gpuAttempts),1,'manual mode retains the original renderer');
 assert(await page.locator('.journey-elephant').evaluate(e=>e.classList.contains('mesh-ready')));
 await click();await page.clock.runFor(64);
 assert.equal(await page.locator('.journey-elephant').evaluate(e=>e.classList.contains('mesh-ready')),false,'resuming Autoscroll uses original artwork');
 assert.deepEqual(await page.evaluate(()=>uploads.at(-1)),[1,1],'existing full texture is released on automatic takeover');
 assert.equal(await page.locator('.elephant-mesh').evaluate(e=>e.width),1);
 await advance(42000);
 assert.equal(await page.locator('#autoscroll-toggle').getAttribute('aria-pressed'),'false');
 assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('ios-autoscroll-active')),false,'completion clears scoped policy');
 console.log('PASS: iOS Autoscroll allocates no WebGL; artwork still moves; manual renderer returns; resume releases texture; completion clears policy');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
