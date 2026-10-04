/* Closing-page regression: centered content, no clipping, and natural scrolling when needed. */
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
   const logos=section.querySelector('.finale-brands');
   const art=section.querySelector('.thank-you-art').getBoundingClientRect();
   const arch=section.querySelector('.thank-you-arch').getBoundingClientRect(),footer=section.querySelector('.closing-footer').getBoundingClientRect();
   if(Math.abs(arch.bottom-footer.top)>1)issues.push('gold arch sides must reach the footer without a gap');
   const logo=section.querySelector('.thank-you-logo').getBoundingClientRect();
   const heading=section.querySelector('.thank-you-message h2').getBoundingClientRect();
   const message=section.querySelector('.thank-you-message p').getBoundingClientRect();
   for(const rect of [logo,heading,message])if(Math.abs(rect.left+rect.width/2-(s.left+s.width/2))>1)issues.push('logo and thank-you text must share the page center');
   if(logo.bottom>heading.top+1||heading.bottom>message.top+1)issues.push('logo, heading and Gujarati must stack vertically');
   const kicker=section.querySelector('.thank-you-kicker');
   if(!kicker || kicker.parentElement!==card || kicker.getBoundingClientRect().bottom>card.querySelector('.event-facts').getBoundingClientRect().top+1)issues.push('event identity must head the unified green card');
   if(getComputedStyle(logos).display!=='none')issues.push('final partner strip must be hidden');
   const links=section.querySelector('.thank-you-text-links'), n=links.getBoundingClientRect();
   if(card.contains(links)||n.top<c.bottom-1||n.bottom>art.top+1)issues.push('text links must sit between details and artwork');
   const [left,right]=[...links.querySelectorAll('a')].map(el=>el.getBoundingClientRect());
   if(Math.abs(left.width-right.width)>1)issues.push('text links must split the row evenly');
   if(document.documentElement.scrollWidth>innerWidth+1)issues.push('horizontal overflow');
   for(const el of section.querySelectorAll('a,button')){
    const r=el.getBoundingClientRect();
    if(!r.width&&!r.height)continue;
    if(r.height<(el.closest('.thank-you-text-links')?23.5:43.5)||r.width<43.5)issues.push('small tap target: '+el.textContent.trim());
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
  if(fitScreen&&data.height<=data.available+1){assert(data.top>=data.headerBottom-1,`${label}: header covers closing content ${JSON.stringify(data)}`);assert(data.bottom<=await page.evaluate(()=>innerHeight)+1);}
  console.log('PASS '+label+': closing page '+Math.round(data.height)+'px'+(data.height>data.available+1?' (natural vertical scrolling)':' (one screen)'));
 }
 for(const [width,height] of [[280,640],[320,568],[320,640],[360,640],[390,844],[430,932],[540,720],[650,900],[651,900],[768,1024],[568,320],[667,375],[844,390],[1024,768],[1440,900],[1920,1080],[600,960],[720,1280],[800,1280],[800,600],[1024,600],[1280,720],[1366,768],[360,740],[375,667],[390,740],[390,741],[430,740],[480,640],[500,740],[501,740],[501,741],[800,480],[1024,440],[1024,441],[600,800]]){
  await page.setViewportSize({width,height});await inspect(width+'x'+height);
  if(process.env.SCREENSHOT_DIR&&[320,390,568,600,800,844,1024,1280,1440].includes(width)){fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});await page.locator('#details').screenshot({path:path.join(process.env.SCREENSHOT_DIR,`closing-${width}-${height}.png`),style:'.masthead,.progress-line{visibility:hidden!important}'});}
 }
 // All six actions remain present and the relocated original-invitation action works.
 assert.equal(await page.locator('.thank-you-actions a,.thank-you-actions button').count(),4);
 assert.equal(await page.locator('.thank-you-text-links a').count(),2);
 await page.locator('#details [data-view-original]').click();assert(await page.locator('#original-invitation-dialog').evaluate(d=>d.open));await page.locator('#original-invitation-dialog [data-close]').click();
 for(const [width,height] of [[320,640],[390,844],[600,960],[800,600]]){
  await page.goto('http://127.0.0.1:'+server.address().port);await page.evaluate(()=>document.fonts.ready);
  await page.setViewportSize({width,height});
  await page.evaluate(()=>{const nodes=[...document.querySelectorAll('#details *')].filter(el=>[...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim())).map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);for(const [el,size] of nodes)el.style.fontSize=size*2+'px';});
  await inspect(`${width}x${height} / 200% text (natural scrolling)`,false);
 }
 assert.deepEqual(errors,[]);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
