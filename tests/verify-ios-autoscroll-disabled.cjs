/* iOS has native manual scrolling only; other platforms keep opt-in Autoscroll. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');let browser,server;
(async()=>{
 const root=path.resolve(__dirname,'../dist');
 server=http.createServer((req,res)=>{try{const n=req.url.split('?')[0],f=path.join(root,n==='/'?'index.html':n);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 const profiles=[
  {name:'iPhone Safari',ios:true,ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'},
  {name:'iPhone Chrome',ios:true,ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120.0 Mobile/15E148 Safari/604.1'},
  {name:'iPod',ios:true,ua:'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'},
  {name:'iPad desktop mode',ios:true,ua:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',platform:'MacIntel',touch:5},
  {name:'Android',ios:false,ua:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36'},
  {name:'Mac desktop',ios:false,ua:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Safari/605.1.15',platform:'MacIntel',touch:0},
  {name:'Windows touch PC',ios:false,ua:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',platform:'Win32',touch:10},
 ];
 for(const p of profiles){
  const page=await browser.newPage({viewport:{width:390,height:844},userAgent:p.ua});
  if(p.platform)await page.addInitScript(p=>{Object.defineProperty(navigator,'platform',{value:p.platform});Object.defineProperty(navigator,'maxTouchPoints',{value:p.touch})},p);
  const vendor=[],errors=[];page.on('request',r=>{if(r.url().includes('/vendor/'))vendor.push(r.url())});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.evaluate(()=>document.fonts.ready);
  const button=page.locator('#autoscroll-toggle');
  assert.equal(await button.isVisible(),!p.ios,p.name+': visibility');
  assert.equal(await button.isEnabled(),!p.ios,p.name+': disabled state');
  assert.deepEqual(vendor,[],'GSAP is not requested');
  assert(await page.evaluate(()=>!window.gsap&&!window.garbaIOSAutoScroll),'no automatic driver library is initialized');
  if(p.ios){
   await button.evaluate(e=>{e.disabled=false;e.dispatchEvent(new MouseEvent('click',{bubbles:true}));e.disabled=true});
   await page.waitForTimeout(150);
   assert.equal(await button.getAttribute('aria-pressed'),'false','synthetic clicks cannot start iOS Autoscroll');
   assert.equal(await page.evaluate(()=>scrollY),0);
   assert.equal(await page.evaluate(()=>sessionStorage.getItem('garba-ios-playback')),null);
   await page.locator('#invitation-seal').click();await page.waitForTimeout(200);await page.keyboard.press('Escape');
   assert(await page.evaluate(()=>scrollY)>0,'normal invitation opening still works');
   assert.equal(await page.locator('.journey-stage').evaluate(e=>getComputedStyle(e).touchAction),'auto');
   await page.setViewportSize({width:844,height:390});await page.emulateMedia({reducedMotion:'reduce'});
   assert.equal(await button.isVisible(),false,'stays hidden in reading/landscape mode');
  }else{
   await button.click();await page.waitForTimeout(250);assert(await page.evaluate(()=>scrollY)>0,'non-iOS Autoscroll still advances');await button.click();
  }
  assert.deepEqual(errors,[]);console.log(`PASS ${p.name}: correct controls, no GSAP, ${p.ios?'blocked Autoscroll and preserved entry':'working Autoscroll'}`);await page.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
