/* Count actual WebGL draws at a controlled animation-frame boundary. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');let browser,server;
(async()=>{
 const root=path.resolve(__dirname,'../dist');
 server=http.createServer((req,res)=>{try{const file=path.join(root,req.url.split('?')[0]);res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const ios of [true,false]){
  const page=await browser.newPage();
  await page.route('**/renderer-fixture',r=>r.fulfill({contentType:'text/html',body:`<html class="cinematic ${ios?'ios-native-scroll':''}"><div class="journey-elephant" hidden data-walking="true"><canvas class="elephant-mesh" style="width:300px;height:220px"></canvas></div></html>`}));
  await page.goto(`http://127.0.0.1:${server.address().port}/renderer-fixture`);
  await page.evaluate(()=>{
   window.draws=0;window.uploaded=false;window.frames=new Map();let id=0;
   window.requestAnimationFrame=callback=>{frames.set(++id,callback);return id};
   window.cancelAnimationFrame=id=>frames.delete(id);
   window.step=now=>{const pending=[...frames.values()];frames.clear();pending.forEach(callback=>callback(now))};
   const gl=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,isContextLost:()=>false,drawElements:()=>window.draws++,texImage2D:()=>window.uploaded=true},
    {get:(o,k)=>k in o?o[k]:/^[A-Z_0-9]+$/.test(k)?1:()=>({})});
   HTMLCanvasElement.prototype.getContext=()=>gl;
  });
  await page.addScriptTag({content:fs.readFileSync(path.join(root,'elephant-walk.js'),'utf8')});
  await page.evaluate(()=>document.querySelector('.journey-elephant').hidden=false);
  await page.waitForFunction(()=>window.uploaded,null,{polling:50,timeout:5000});
  await page.evaluate(()=>{window.draws=0;for(let i=0;i<10;i++){dispatchEvent(new Event('resize'));document.querySelector('.journey-elephant').dataset.walking='true'}});
  await page.evaluate(()=>Promise.resolve());
  assert.equal(await page.evaluate(()=>draws),0,'state/resize events must not paint outside the single RAF owner');
  assert.equal(await page.evaluate(()=>{step(100);return draws}),1,'one draw for all queued updates');
  assert(await page.locator('.journey-elephant').evaluate(el=>el.classList.contains('mesh-ready')), 'mesh appears after its first paint');
  const healthy=await page.evaluate(()=>{draws=0;for(let t=116;t<=1092;t+=16)step(t);return draws});
  assert(healthy>=60&&healthy<=62,'healthy devices retain normal frame cadence');
  await page.evaluate(()=>document.documentElement.classList.add('safety-light-effects'));
  await page.evaluate(()=>Promise.resolve());
  const light=await page.evaluate(()=>{draws=0;for(let t=1108;t<=2100;t+=16)step(t);return draws});
  assert(ios?light>=28&&light<=33:light>=60,'only struggling iOS uses the reduced draw budget');
  await page.evaluate(()=>document.querySelector('.journey-elephant').hidden=true);
  await page.evaluate(()=>Promise.resolve());
  assert.equal(await page.evaluate(()=>{draws=0;step(2200);return draws}),0,'hidden renderer stops painting');
  console.log(`PASS ${ios?'iOS':'desktop'}: one paint owner; healthy=${healthy}, light=${light} draws/second; hidden renderer stops`);
  await page.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
