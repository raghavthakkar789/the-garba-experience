/* Whole closing-page regression: all content fits below the header at normal text size. */
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
let server,browser;
(async()=>{
 const root=path.resolve(__dirname,'../dist'),mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2'};
 server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.evaluate(()=>document.fonts.ready);
 await page.locator('#details img').evaluateAll(imgs=>Promise.all(imgs.map(i=>{i.loading='eager';return i.decode();})));
 async function inspect(label,fitScreen=true){
  await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  await page.waitForTimeout(70);
  const data=await page.evaluate(()=>{
   const section=document.querySelector('#details'),s=section.getBoundingClientRect();
   const card=document.querySelector('.thank-you-details'),c=card.getBoundingClientRect(),issues=[];
   const header=document.querySelector('.masthead').getBoundingClientRect();
   if(document.documentElement.scrollWidth>innerWidth+1)issues.push('horizontal overflow');
   for(const el of section.querySelectorAll('a,button')){
    const r=el.getBoundingClientRect();
    if(r.height<43.5||r.width<43.5)issues.push('small tap target: '+el.textContent.trim());
   }
   const controls=[...section.querySelectorAll('a,button')].map(e=>e.getBoundingClientRect());
   for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){
    const a=controls[i],b=controls[j];if(a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)issues.push('overlapping controls');
   }
   for(const el of section.querySelectorAll('*')){
    const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
    // Partner art intentionally zooms inside its clipped plaque to remove whitespace.
    if(el.matches('.brand-logo img'))continue;
    if(r.left<s.left-1||r.right>s.right+1||r.top<s.top-1||r.bottom>s.bottom+1)issues.push('outside section: '+el.tagName+' '+(el.className.baseVal||el.className)+' '+(el.getAttribute('src')||'')+' '+JSON.stringify({left:r.left,right:r.right,top:r.top,bottom:r.bottom,section:s.toJSON()}));
    for(const node of el.childNodes){if(node.nodeType!==Node.TEXT_NODE||!node.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(node);for(const line of range.getClientRects()){
     if(line.left<s.left-1||line.right>s.right+1||line.bottom>s.bottom+1)issues.push('clipped text: '+node.textContent.trim());
    }}
   }
   return {height:s.height,available:innerHeight-header.height,top:s.top,headerBottom:header.bottom,bottom:s.bottom,width:c.width,issues};
  });
  assert.deepEqual(data.issues,[],label);
  if(fitScreen){assert(data.height<=data.available+1,`${label}: closing page ${data.height}px > ${data.available}px`);assert(data.top>=data.headerBottom-1,`${label}: header covers closing content ${JSON.stringify(data)}`);assert(data.bottom<=await page.evaluate(()=>innerHeight)+1);}
  console.log('PASS '+label+': whole closing page '+Math.round(data.height)+'px');
 }
 for(const [width,height] of [[280,640],[320,568],[320,640],[360,640],[390,844],[430,932],[540,720],[650,900],[651,900],[768,1024],[568,320],[667,375],[844,390],[1024,768],[1440,900],[1920,1080]]){
  await page.setViewportSize({width,height});await inspect(width+'x'+height);
  if(process.env.SCREENSHOT_DIR&&[320,390,568,844,1440].includes(width)){fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,`closing-${width}-${height}.png`)});}
 }
 // All six actions remain present and the relocated original-invitation action works.
 assert.equal(await page.locator('.thank-you-actions a,.thank-you-actions button').count(),6);
 await page.locator('#details [data-view-original]').click();assert(await page.locator('#original-invitation-dialog').evaluate(d=>d.open));await page.locator('#original-invitation-dialog [data-close]').click();
 await page.setViewportSize({width:320,height:640});
 await page.evaluate(()=>{const nodes=[...document.querySelectorAll('#details *')].filter(el=>[...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim())).map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);for(const [el,size] of nodes)el.style.fontSize=size*2+'px';});
 await inspect('320px / 200% text (natural scrolling)',false);
 assert.deepEqual(errors,[]);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
