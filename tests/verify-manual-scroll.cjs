/* Browser regression: aggressive manual input must stop at every dialogue. */
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
 // Every line must catch a huge wheel gesture and expose the intended speaker.
 for(const stop of stops){await place(stop.y-18);await wheel(20000);await page.waitForTimeout(450);assert(Math.abs(await page.evaluate(()=>scrollY)-stop.y)<2,stop.id+' dialogue stop');assert.equal(await page.locator('#'+stop.id+' .dialogue-beat').nth(stop.beat).getAttribute('aria-hidden'),'false');}
 const stop=stops[3];await place(stop.y-18);await wheel(20000);
 for(let i=0;i<18;i++){await page.waitForTimeout(90);await wheel(20000);}
 assert(Math.abs(await page.evaluate(()=>scrollY)-stop.y)<2,'momentum cannot pass a dialogue, even after minimum reading time');
 // Reproduce an RAF timestamp slightly older than the gesture that scheduled it.
 await page.evaluate(()=>{const raf=window.requestAnimationFrame;window.requestAnimationFrame=function(cb){if(cb.name==='advanceManualScroll'){window.requestAnimationFrame=raf;return raf.call(window,time=>cb(time-10));}return raf.call(window,cb);};});
 await page.waitForTimeout(300);await wheel(400);await page.waitForTimeout(400);assert(await page.evaluate(y=>scrollY>y+10,stop.y),'fresh gesture resumes: '+JSON.stringify({stop:stop.y,actual:await page.evaluate(()=>scrollY)}));
 // Slow wheel input also stops, and reverse gestures stop on the same line.
 await place(stop.y-3);await wheel(20);await page.waitForTimeout(200);assert(Math.abs(await page.evaluate(()=>scrollY)-stop.y)<2);
 await place(stop.y+18);await wheel(-20000);await page.waitForTimeout(300);assert(Math.abs(await page.evaluate(()=>scrollY)-stop.y)<2);
 await place(stop.y-18);await page.keyboard.press('End');await page.waitForTimeout(300);assert(Math.abs(await page.evaluate(()=>scrollY)-stop.y)<2,'End cannot skip dialogue');
 // A huge gesture in a silent scene is both speed-limited and distance-limited.
 await place(stops[5].y+800);const before=await page.evaluate(()=>scrollY);await wheel(20000);await page.waitForTimeout(250);const early=await page.evaluate(()=>scrollY);assert(early-before<480,'bounded velocity');await page.waitForTimeout(1300);assert(await page.evaluate(y=>scrollY-y<=701,before),'bounded impulse, no long coast');
 await place(stops[5].y+800);const gentleStart=await page.evaluate(()=>scrollY);await wheel(120);await page.waitForTimeout(450);const gentleDistance=await page.evaluate(y=>scrollY-y,gentleStart);assert(gentleDistance>=170&&gentleDistance<=190,'ordinary wheel gesture moves easily without excessive resistance');
 // Real touch input: swipe through a checkpoint, then lift and deliberately resume.
 const session=await page.context().newCDPSession(page);await place(stop.y-18);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:650}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:180,y:150}]});await page.waitForTimeout(400);
 assert(Math.abs(await page.evaluate(()=>scrollY)-stop.y)<2,'touch stops at dialogue');
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(1300);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:650}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:180,y:350}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(350);assert(await page.evaluate(y=>scrollY>y+10,stop.y),'fresh touch can resume');
 await page.keyboard.press('Escape');await page.locator('.header-link').click();
 const exempt=await page.locator('#original-invitation-dialog').evaluate(d=>d.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:500})));assert(exempt,'dialog wheel remains native');await page.keyboard.press('Escape');
 const zoom=await page.evaluate(()=>document.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,ctrlKey:true,deltaY:100})));assert(zoom,'pinch/zoom remains available');
 await page.locator('#autoscroll-toggle').click();assert.equal(await page.locator('#autoscroll-toggle').getAttribute('aria-pressed'),'true');await page.locator('#autoscroll-toggle').click();
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);
 const readStop=await page.locator('#the-invitation .dialogue-beat').first().evaluate(line=>line.getBoundingClientRect().top+scrollY-innerHeight*.35);
 await place(readStop-18);await wheel(20000);await page.waitForTimeout(100);assert(Math.abs(await page.evaluate(()=>scrollY)-readStop)<2,'reading mode stops at dialogue without animated scrolling');
 await wheel(20000);await page.waitForTimeout(100);assert(Math.abs(await page.evaluate(()=>scrollY)-readStop)<2,'reading mode holds against another immediate gesture');
 assert.deepEqual(errors,[]);console.log('PASS: all eleven dialogue stops, hard/soft wheel, reverse, continuous momentum, fresh gesture resume, bounded silent-scene speed/distance, End key, real touch stop/resume, dialog and zoom exemptions, reduced-motion reading stops, Autoscroll handoff.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
