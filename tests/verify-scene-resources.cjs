const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');let browser,server;
(async()=>{
 const root=path.resolve(__dirname,'../dist');
 server=http.createServer((req,res)=>{try{const name=req.url.split('?')[0],file=path.join(root,name==='/'?'index.html':name);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const ios of [true,false]){
  const page=await browser.newPage({viewport:{width:390,height:844},...(ios?{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{})});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.evaluate(()=>document.fonts.ready);
  if(ios) assert(await page.locator('[data-resources=parked]').count()>5,'distant scenes must release media on iOS');
  else assert.equal(await page.locator('[data-resources=parked]').count(),0,'desktop resources unchanged');
  await page.locator('#autoscroll-toggle').click();await page.waitForTimeout(100);await page.locator('#autoscroll-toggle').click();
  for(const cursor of [1.5,2.4,3.2,5.94,8.2,13,14,8.2,5.94,2.4,1.5]){
   await page.evaluate(c=>{const j=document.querySelector('.journey'),s=document.querySelector('.journey-stage');scrollTo({top:j.offsetTop+c/14*(j.offsetHeight-s.clientHeight),behavior:'instant'})},cursor);await page.waitForTimeout(100);
   const result=await page.evaluate(async()=>{
    const visible=[...document.querySelectorAll('.scene.is-visible')];
    const images=visible.flatMap(s=>[...s.querySelectorAll('img[src]')]);
    await Promise.all(images.map(i=>i.decode().catch(()=>{})));
    return {parkedVisible:visible.some(s=>s.dataset.resources==='parked'),
     emptyVisible:images.some(i=>i.getAttribute('src')?.startsWith('data:')||!i.naturalWidth),
     held:[...document.querySelectorAll('.scene,.finale')].filter(s=>s.dataset.resources!=='parked').length,
     stale:[...document.querySelectorAll('[data-resources=parked] img')].filter(i=>i.hasAttribute('src') && !i.getAttribute('src').startsWith('data:')).map(i=>[i.closest('[data-resources]').id,i.className,i.getAttribute('src')])};
   });
   assert(!result.parkedVisible && !result.emptyVisible,`${ios} ${cursor}: visible art restored`);
   if(ios){assert(result.held<=3,JSON.stringify(result));assert.deepEqual(result.stale,[],`${cursor}`)}
  }
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
  assert.equal(await page.locator('[data-resources=parked]').count(),0,'reading mode restores the complete document');
  assert.equal(await page.locator('.scene img[src^="data:"]').count(),0);
  assert.deepEqual(errors,[]);console.log(`PASS ${ios?'iOS':'desktop'}: bounded scene window, forward/reverse assets, reading mode`);await page.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
