const assert = require('node:assert/strict'), fs = require('node:fs'), http = require('node:http'), path = require('node:path'), vm = require('node:vm');
const {chromium} = require('playwright');
let browser, server;
const root = path.resolve(__dirname, '../dist');
// Controlled frame cadence tests the fallback without making a real device slow.
function cadence(ios, intervals) {
  const classes = new Set(['cinematic', ...(ios ? ['ios-native-scroll'] : [])]);
  const events = {}, pending = new Map(); let now = 0, serial = 0;
  const document = {hidden:false, querySelector:()=>null, addEventListener:(k,v)=>events[k]=v,
    documentElement:{classList:{contains:k=>classes.has(k),add:k=>classes.add(k),toggle:(k,v)=>v?classes.add(k):classes.delete(k)}}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'browser-safety.js'),'utf8'), {
    document, performance:{now:()=>now}, addEventListener:(k,v)=>events[k]=v,
    requestAnimationFrame:cb=>{pending.set(++serial,cb);return serial},cancelAnimationFrame:id=>pending.delete(id),
  });
  for(const delta of intervals) {now+=delta;events.scroll?.();const jobs=[...pending.values()];pending.clear();jobs.forEach(cb=>cb(now));}
  events.pagehide?.();assert.equal(pending.size,0,'no background sampling');
  if(ios) assert(classes.has('safety-page-hidden'));
  events.pageshow?.();assert(!classes.has('safety-page-hidden'));
  return classes.has('safety-light-effects');
}
assert(!cadence(false,Array(160).fill(50)),'desktop never changes quality');
assert(!cadence(true,Array(500).fill(16)),'healthy iOS retains every effect');
assert(!cadence(true,[...Array(100).fill(16),600,...Array(300).fill(16)]),'isolated stall is not sustained pressure');
assert(cadence(true,Array(160).fill(50)),'sustained slow iOS rendering reduces soft effects');
(async()=>{
  server=http.createServer((req,res)=>{try {
    const name=decodeURIComponent(req.url.split('?')[0]);const file=path.join(root,name==='/'?'index.html':name);
    res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  }catch {res.writeHead(404);res.end()}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const profile of ['iphone','ipad-desktop','android','desktop']) {
    const ios=profile==='iphone'||profile==='ipad-desktop';
    const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:profile!=='desktop',isMobile:profile!=='desktop',
      ...(profile==='iphone'?{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{})});
    if(profile==='ipad-desktop') await page.addInitScript(()=>{Object.defineProperty(navigator,'platform',{get:()=> 'MacIntel'});Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5})});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('ios-native-scroll')),ios,profile);
    await page.locator('#autoscroll-toggle').click();
    await page.waitForFunction(()=>!document.querySelector('#invitation').dataset.entering&&scrollY>0);
    await page.locator('#autoscroll-toggle').click();
    assert.equal(await page.locator('.journey-stage').evaluate(el=>getComputedStyle(el).touchAction),ios?'auto':'pan-x pinch-zoom');
    const y=await page.evaluate(()=>scrollY);
    const prevented=await page.evaluate(()=>{
      const stage=document.querySelector('.journey-stage');
      function event(name,y) {const e=new Event(name,{bubbles:true,cancelable:true});Object.defineProperty(e,'touches',{value:y===null?[]:[{clientY:y}]});stage.dispatchEvent(e);return e.defaultPrevented;}
      event('touchstart',650);const canceled=event('touchmove',400);event('touchend',null);return canceled;
    });
    assert.equal(prevented,!ios,'only non-iOS owns touch movement');
    await page.waitForTimeout(300);
    if(ios) {
      assert.equal(await page.evaluate(()=>scrollY),y,'no competing JS movement on iOS');
      const cdp=await page.context().newCDPSession(page);
      // Real browser touch input (with iOS detection), rather than synthetic scroll.
      for(const cursor of [1.42,2.4,5.9]) {
        await page.evaluate(cursor=>{const j=document.querySelector('.journey'),s=document.querySelector('.journey-stage');scrollTo({top:j.offsetTop+cursor/14*(j.offsetHeight-s.clientHeight),behavior:'instant'})},cursor);
        await page.waitForTimeout(100);const before=await page.evaluate(()=>scrollY);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:650}]});
        for(const y of [610,570,530,490,450]) {await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y}]});await page.waitForTimeout(30)}
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await page.waitForTimeout(350);assert(await page.evaluate(()=>scrollY)>before+50,'native swipe advances through every sampled scene');
      }
      await page.keyboard.press('Escape');
      const geometry=await page.locator('.journey-stage').evaluate(el=>({height:el.clientHeight,y:scrollY}));
      await page.setViewportSize({width:390,height:620});await page.waitForTimeout(150);
      assert(await page.locator('html').evaluate(el=>el.classList.contains('cinematic')),'toolbar/keyboard height does not switch layout');
      assert.equal(await page.locator('.journey-stage').evaluate(el=>el.clientHeight),geometry.height,'stage remains stable');
      assert(Math.abs(await page.evaluate(()=>scrollY)-geometry.y)<2,'viewport resize does not seek story');
      assert.equal(await page.locator('#the-plan .story-person').first().evaluate(el=>getComputedStyle(el).willChange),'auto','hidden layers released');
      await page.locator('#autoscroll-toggle').click();await page.waitForTimeout(350);
      assert.equal(await page.locator('#autoscroll-toggle').getAttribute('aria-pressed'),'true');
      await page.evaluate(()=>dispatchEvent(new Event('touchstart')));
      assert.equal(await page.locator('#autoscroll-toggle').getAttribute('aria-pressed'),'false','native touch stops autoscroll');
      await page.setViewportSize({width:844,height:390});await page.waitForTimeout(100);
      assert(await page.locator('html').evaluate(el=>el.classList.contains('read-mode')),'real orientation changes still reflow');
    } else assert(await page.evaluate(()=>scrollY)>y,'custom scrolling preserved');
    assert.deepEqual(errors,[]);console.log(`PASS ${profile}: touch policy, entry, scene movement, lifecycle and viewport safety`);await page.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
