/* Browser regression: dialogue areas slow manual input without locking it. */
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
let browser,server;
(async()=>{
 const root=path.resolve(__dirname,'../dist');
 server=http.createServer((q,s)=>{try{const file=path.join(root,q.url.split('?')[0]==='/'?'index.html':q.url.split('?')[0]);s.end(fs.readFileSync(file));}catch{s.writeHead(404);s.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.evaluate(()=>document.fonts.ready);
 await page.locator('#autoscroll-toggle').click();await page.waitForFunction(()=>!document.querySelector('#invitation').dataset.entering&&scrollY>0);await page.locator('#autoscroll-toggle').click();
 const stops=await page.evaluate(()=>{const scenes=[...document.querySelectorAll('.scene')],journey=document.querySelector('.journey'),spans=scenes.map(s=>Number(s.dataset.scrollSpan)||1),total=spans.reduce((a,b)=>a+b,0),unit=(journey.offsetHeight-document.querySelector('.journey-stage').clientHeight)/total;let start=0;return scenes.flatMap((s,i)=>{const a=[...s.querySelectorAll('.dialogue-beat')].map((line,j)=>({id:s.id,beat:j,y:journey.getBoundingClientRect().top+scrollY+(start+spans[i]*(s.id==='beginning'&&j===0?.42:Math.max(.06,Number(line.dataset.at)+.015)))*unit}));start+=spans[i];return a;});});
 async function place(y){await page.keyboard.press('Escape');await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await page.waitForTimeout(80);}
 async function wheel(delta){await page.mouse.move(180,500);await page.mouse.wheel(0,delta);}
 // A hard gesture must move through every former checkpoint without freezing,
 // while keeping its first 250ms substantially slower than a silent scene.
 for(const stop of stops){
  await place(stop.y-18);const before=await page.evaluate(()=>scrollY);await wheel(20000);
  await page.waitForTimeout(250);const early=await page.evaluate(()=>scrollY);
  assert(early>=before,'forward input never reverses');
  await page.waitForFunction(y=>scrollY>y+10,stop.y,{timeout:2500});
  assert(early-before<170,stop.id+' dialogue speed is bounded');
  assert(await page.evaluate(()=>scrollY)>before+25,stop.id+' continues without another gesture');
 }
 const stop=stops[3];await place(stop.y-18);
 // An uninterrupted wheel/trackpad stream continues without an idle-gap requirement.
 let previous=await page.evaluate(()=>scrollY), previousTime=await page.evaluate(()=>performance.now());
 for(let i=0;i<16;i++){await wheel(20000);await page.waitForTimeout(80);const next=await page.evaluate(()=>scrollY);assert(next>=previous,'continuous input never reverses');const now=await page.evaluate(()=>performance.now());assert(next-previous<=1600*(now-previousTime)/1000+5,'bounded velocity during continuing input');previous=next;previousTime=now;}
 assert(previous>stop.y+100,'one continuing gesture traverses the dialogue');
 // A stale RAF timestamp cannot create reverse motion.
 await place(stop.y-18);
 await page.evaluate(()=>{const raf=window.requestAnimationFrame;window.requestAnimationFrame=function(cb){if(cb.name==='advanceManualScroll'){window.requestAnimationFrame=raf;return raf.call(window,time=>cb(time-10));}return raf.call(window,cb);};});
 await wheel(400);await page.waitForFunction(y=>scrollY>y+10,stop.y,{timeout:2500});
 await place(stop.y-3);await wheel(20);await page.waitForFunction(y=>scrollY>y+10,stop.y,{timeout:2500});
 await place(stop.y+18);await wheel(-20000);await page.waitForFunction(y=>scrollY<y-20,stop.y,{timeout:2500});
 await place(stop.y-18);await page.keyboard.press('End');await page.waitForFunction(y=>scrollY>y+20,stop.y,{timeout:2500});const keyed=await page.evaluate(()=>scrollY);assert(keyed>stop.y+20&&keyed<stop.y+180,'End advances slowly through dialogue');
 // Silent-scene speed and the ordinary wheel distance are unchanged.
 await place(stops[5].y+800);const before=await page.evaluate(()=>scrollY);await wheel(20000);await page.waitForTimeout(250);const early=await page.evaluate(()=>scrollY);assert(early-before<480,'bounded silent-scene velocity');await page.waitForTimeout(1300);assert(await page.evaluate(y=>scrollY-y<=701,before),'bounded impulse');
 await place(stops[5].y+800);const gentleStart=await page.evaluate(()=>scrollY);await wheel(120);await page.waitForFunction(y=>scrollY-y>=170,gentleStart,{timeout:5000});const gentleDistance=await page.evaluate(y=>scrollY-y,gentleStart);assert(gentleDistance>=170&&gentleDistance<=190,'ordinary wheel distance is unchanged');
 // A real finger can continue moving through a dialogue without lifting.
 const session=await page.context().newCDPSession(page);await place(stop.y-18);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:650}]});
 previous=await page.evaluate(()=>scrollY);
 for(let i=1;i<=6;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:180,y:650-i*65}]});await page.waitForTimeout(100);const next=await page.evaluate(()=>scrollY);assert(next>=previous,'same finger gesture never reverses');previous=next;}
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForFunction(y=>scrollY>y+100,stop.y,{timeout:2500});
 await page.keyboard.press('Escape');await page.locator('.header-link').click();
 const exempt=await page.locator('#original-invitation-dialog').evaluate(d=>d.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:500})));assert(exempt,'dialog wheel remains native');await page.keyboard.press('Escape');
 const zoom=await page.evaluate(()=>document.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,ctrlKey:true,deltaY:100})));assert(zoom,'pinch/zoom remains available');
 await page.locator('#autoscroll-toggle').click();assert.equal(await page.locator('#autoscroll-toggle').getAttribute('aria-pressed'),'true');await page.locator('#autoscroll-toggle').click();
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);
 const readStop=await page.locator('#the-invitation .dialogue-beat').first().evaluate(line=>line.getBoundingClientRect().top+scrollY-innerHeight*.35);
 await place(readStop-18);await wheel(20000);await page.waitForTimeout(100);const readFirst=await page.evaluate(()=>scrollY);assert(readFirst>readStop,'reading mode progresses without a lock');
 await wheel(20000);await page.waitForTimeout(100);assert(await page.evaluate(()=>scrollY)>readFirst,'reading mode accepts the next gesture immediately');
 const still=await page.evaluate(()=>scrollY);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>scrollY),still,'reduced motion has no animated coast');
 // Verify speed against a controlled clock; real rendering load must not make
 // wall-clock waits masquerade as a change in the configured velocity.
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(150);
 const clockStart=new Date();await page.clock.install({time:clockStart});await page.clock.pauseAt(new Date(clockStart.getTime()+1000));
 async function timedImpulse(y){
  await page.evaluate(y=>{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));scrollTo({top:y,behavior:'instant'});},y);
  await page.clock.runFor(32);const from=await page.evaluate(()=>scrollY);
  await page.evaluate(()=>document.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:20000})));
  await page.clock.runFor(240);return await page.evaluate(y=>scrollY-y,from);
 }
 const silentDistance=await timedImpulse(stops[5].y+800),dialogueDistance=await timedImpulse(stop.y);
 assert(silentDistance>280&&silentDistance<350,'ordinary speed remains about 1350px/s: '+silentDistance);
 assert(dialogueDistance>45&&dialogueDistance<120,'dialogue eases down without freezing: '+dialogueDistance);
 assert(dialogueDistance<silentDistance*.4,'dialogue is substantially slower than the rest');
 await page.clock.runFor(1200);const settled=await page.evaluate(()=>scrollY);
 await page.clock.runFor(200);assert.equal(await page.evaluate(()=>scrollY),settled,'slow-zone residual coast settles without new input');
 assert.deepEqual(errors,[]);console.log('PASS: eleven continuous dialogue slowdowns; hard/gentle/reverse wheel, ongoing momentum, keyboard, real uninterrupted touch, unchanged silent-scene speed/distance, bounded coast, dialog/zoom exemptions, reduced motion and Autoscroll handoff.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
