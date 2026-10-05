const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');let browser,server;
(async()=>{
 const root=path.resolve(__dirname,'../dist');
 server=http.createServer((req,res)=>{try{const n=req.url.split('?')[0],f=path.join(root,n==='/'?'index.html':n);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
 await page.addInitScript(()=>{
  window.uploads=[];window.textureCount=0;
  const original=HTMLCanvasElement.prototype.getContext;
  const gl=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,isContextLost:()=>false,
   createTexture:()=>{window.textureCount++;return{}},texImage2D:(...a)=>window.uploads.push(a.length===9?[a[3],a[4]]:[a[5].naturalWidth,a[5].naturalHeight])},
   {get:(o,k)=>k in o?o[k]:/^[A-Z_0-9]+$/.test(k)?1:()=>({})});
  HTMLCanvasElement.prototype.getContext=function(type,...a){return type==='webgl'?gl:original.call(this,type,...a)};
 });
 await page.goto(url);await page.evaluate(()=>document.fonts.ready);
 await page.locator('#invitation-seal').click();await page.waitForTimeout(100);await page.keyboard.press('Escape');
 const seek=async c=>{await page.evaluate(c=>{const j=document.querySelector('.journey'),s=document.querySelector('.journey-stage');scrollTo({top:j.offsetTop+c/14*(j.offsetHeight-s.clientHeight),behavior:'instant'})},c);await page.waitForTimeout(100)};
 await seek(3.2);await page.waitForFunction(()=>document.querySelector('.journey-elephant').classList.contains('mesh-ready'));
 assert.deepEqual(await page.evaluate(()=>window.uploads.at(-1)),[2048,1536]);
 await seek(6.4);await page.waitForFunction(()=>document.querySelector('.elephant-mesh').width===1);
 assert.deepEqual(await page.evaluate(()=>window.uploads.at(-1)),[1,1],'offscreen texture reduced to four bytes');
 await seek(3.2);await page.waitForFunction(()=>document.querySelector('.journey-elephant').classList.contains('mesh-ready'));
 assert.deepEqual(await page.evaluate(()=>window.uploads.at(-1)),[2048,1536],'reverse traversal restores original texture');
 assert.equal(await page.evaluate(()=>window.textureCount),1,'reuse the texture handle instead of leaking contexts');
 await page.close();
 const fault=await browser.newPage({viewport:{width:390,height:844}}),errors=[],warnings=[];
 fault.on('pageerror',e=>errors.push(e.message));fault.on('console',e=>{if(e.type()==='warning')warnings.push(e.text())});
 await fault.route('**/runtime.*.js',route=>{
  const file=path.join(root,path.basename(new URL(route.request().url()).pathname));
  const body=fs.readFileSync(file,'utf8').replace('/* event-crowds.js */\ntry {','/* event-crowds.js */\ntry { throw Error("Injected optional effect failure");');
  return route.fulfill({contentType:'text/javascript',body});
 });
 await fault.goto(url);await fault.evaluate(()=>document.fonts.ready);
 await fault.locator('#autoscroll-toggle').click();await fault.waitForTimeout(300);
 assert(await fault.evaluate(()=>scrollY)>0,'story starts even when an optional module throws');
 assert.equal(await fault.evaluate(()=>window.garbaTimeline.duration),64);
 assert(warnings.some(w=>w.includes('Optional effect unavailable: event-crowds.js')));
 assert.deepEqual(errors,[]);
 console.log('PASS: GPU release/restoration with simulated GL, handle reuse, optional-effect failure isolation and story startup');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
