const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const scenes=[...document.querySelectorAll('[data-scene]')];let bounds=[],scheduled=false;
let musicDancing=false,danceTime=0,lastDanceFrame=0;
let ticketProgress=null,ticketFrame=0;
function setMusicDancing(value){musicDancing=value;lastDanceFrame=0;document.querySelector('.dance-floor').dataset.dancing=String(value);schedule()}
const $=s=>document.querySelector(s);const thought=(id,text)=>{const e=$(`#${id} span`);if(e.textContent!==text)e.textContent=text};
function measure(){bounds=scenes.map(el=>({el,top:el.offsetTop,height:el.offsetHeight}));schedule()}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(render)}}
function render(now){scheduled=false;renderOpening();const danceVisible=bounds.some(b=>b.el.dataset.scene==='dance'&&scrollY+innerHeight>b.top&&scrollY<b.top+b.height);if(musicDancing&&!reduced.matches&&!document.hidden&&danceVisible){if(lastDanceFrame)danceTime+=Math.min((now-lastDanceFrame)/1000,.05);lastDanceFrame=now}else lastDanceFrame=0;const mobile=innerWidth<801;for(const b of bounds){if(scrollY+innerHeight<b.top||scrollY>b.top+b.height)continue;const p=reduced.matches?.5:clamp((scrollY-b.top)/Math.max(1,b.height-innerHeight));const name=b.el.dataset.scene;b.el.dataset.progress=p.toFixed(3);
if(name==='friends'){
 const friend=$('.recommending-woman'),arrive=reduced.matches?1:smooth((p-.1)/.18);
 friend.style.transform=`translateX(${(1-arrive)*innerWidth*.65}px)`;friend.style.opacity=String(arrive);
 const show=reduced.matches?1:smooth((p-.32)/.15);
 $('.recommendation-artist').style.opacity=String(show);$('.recommendation-artist').style.transform=`translateY(${(1-show)*35}px) scale(${.9+show*.1})`;
 $('#friends-thought').dataset.voice=p<.27?'thinking':p<.68?'her':'him';
 thought('friends-thought',p<.27?'“Where can I find an amazing Garba night?”':p<.68?'“The Garba Experience! Kinjal Dave will be singing Garba live. Let’s go together!”':'“Kinjal Dave live? That sounds amazing. Let’s go together!”');
 $('#friends-caption').textContent=p<.27?'He’s searching for a night to remember.':p<.68?'She introduces The Garba Experience, featuring Kinjal Dave.':'Two friends. One wonderful plan. And an invitation to open.';
}
if(name==='handover'){
 const pass=reduced.matches?1:smooth((p-.12)/.28),open=reduced.matches?1:smooth((p-.52)/.16),lift=reduced.matches?0:smooth((p-.68)/.27);
 const prop=$('.invitation-prop'),stage=$('.handover-stage'),man=$('.receiving-man'),woman=$('.giving-woman');
 const approach=pass*(mobile?12:35);
 man.dataset.pose=p<.4?'accept':p<.52?'hold':p<.68?'open':'read';
 man.style.transform=`translateX(${approach}px)`;
 woman.style.transform=`translateX(${-approach}px)`;
 const startX=woman.offsetLeft+woman.offsetWidth*.25-approach,startY=stage.clientHeight-woman.offsetHeight*.68;
 const settle=reduced.matches?1:smooth((p-.4)/.1);
 const endX=man.offsetLeft+man.offsetWidth*(.84-settle*.32)+approach,endY=stage.clientHeight-man.offsetHeight*(.57-settle*.06);
 const handX=startX+(endX-startX)*pass,handY=startY+(endY-startY)*pass-Math.sin(pass*Math.PI)*12;
 const x=handX+(stage.clientWidth*.5-handX)*lift,y=handY+(stage.clientHeight*.38-handY)*lift;
 prop.style.left='0';prop.style.top='0';
 prop.style.transform=`translate(${x-prop.offsetWidth/2}px,${y-prop.offsetHeight/2}px) rotate(${(1-pass)*-8}deg) scale(${(mobile?.4:.36)+lift*(mobile?.8:.94)})`;
 prop.dataset.phase=p<.12?'held-by-her':p<.4?'handover':p<.52?'received':p<.68?'opening':'opened';
 $('.envelope-flap').style.transform=`rotateY(${-open*115}deg)`;
 $('.envelope-flap').style.zIndex='4';
 $('.invitation-letter').style.transform=`translateY(${-lift*55}%)`;
 stage.style.opacity='1';
 $('.invitation-handover .story-heading').style.opacity=String(1-lift);
 $('#handover-caption').textContent=p<.12?'A little invitation. A wonderful evening ahead.':p<.4?'She places the invitation in his hands.':p<.52?'He holds it for a moment.':p<.68?'Now, he carefully opens the invitation.':'The invitation opens into The Garba Experience.';
}
if(name==='boarding'){const car=$('.pickup-car'),man=$('.boarding-man'),door=$('.car-door');const arrive=smooth((p-.1)/.23),board=smooth((p-.46)/.13),depart=smooth((p-.72)/.26);car.style.transform=`translateX(${(-1+arrive)*innerWidth*1.15+depart*innerWidth*1.3}px)`;man.style.transform=`translate(${board*innerWidth*(mobile?.29:.34)}px,${board*-12+Math.sin(board*Math.PI*6)*3}px) scale(${1-board*.27})`;man.style.opacity=String(1-smooth((p-.58)/.055));man.dataset.pose=p>.43?'walk':'think';const friend=$('.boarding-woman');friend.style.transform=man.style.transform;friend.style.opacity=man.style.opacity;friend.dataset.pose=man.dataset.pose;door.style.opacity=p>.4&&p<.68?'1':'0';door.style.transform=`perspective(400px) rotateY(${-55*Math.sin(clamp((p-.4)/.28)*Math.PI)}deg)`;$('#plan-thought').style.opacity=p>.62?'0':'1';thought('plan-thought',p<.3?'“The Garba Experience it is. We’re going together!”':p<.46?'“Our ride is here. Let’s go!”':'“Next stop: an unforgettable evening.”');$('#boarding-caption').textContent=p<.12?'Their plan is made. Now for the ride.':p<.34?'An ivory car pulls up outside.':p<.46?'The car waits. They are ready.':p<.68?'They walk over and take their seats.':'And just like that, the evening is on its way.';}
if(name==='tickets'){
 // Time-based damping absorbs wheel/touch jumps without changing the other scenes.
 const target=reduced.matches?1:p,dt=ticketFrame?Math.min((now-ticketFrame)/1000,.05):1/60;
 ticketFrame=now;
 if(ticketProgress===null||reduced.matches)ticketProgress=target;
 ticketProgress+=(target-ticketProgress)*(1-Math.exp(-dt/0.16));
 if(Math.abs(target-ticketProgress)>.0001)schedule();else ticketProgress=target;
 const t=ticketProgress,stage=$('.ticket-courtyard'),w=stage.clientWidth,h=stage.clientHeight;
 const car=$('.venue-arrival-car'),cw=car.offsetWidth,parkX=(w-cw)/2;
 const park=smooth(t/.25),leave=smooth((t-.77)/.22);
 const carX=(-cw-30)+(parkX+cw+30)*park+(w+40-parkX)*leave;
 car.style.transform=`translate3d(${carX}px,0,0)`;
 // Far-side exits stay behind the car; both paths converge on the central entrance.
 [['.ticket-man',.37,.475,.37],['.ticket-woman',.56,.525,.43]].forEach(([sel,doorX,endX,start],i)=>{
  const el=$(sel),step=smooth((t-start)/.12),walk=smooth((t-.53-i*.025)/.40);
  const meet=smooth((t-.47)/.10);
  const x=parkX+cw*doorX+(w*endX-parkX-cw*doorX)*meet;
  const scale=.72-walk*.48;
  const stride=Math.sin(walk*Math.PI*12)*Math.sin(walk*Math.PI)*3;
  el.style.opacity=String(step*(1-smooth((t-.54)/.055)));el.style.left='0';el.style.right='auto';el.style.bottom='0';
  el.style.transform=`translate3d(${x-el.offsetWidth/2}px,${-h*(.10+step*.045+walk*(mobile?.36:.30))+(1-step)*22+stride}px,0) scale(${scale})`;
  el.classList.remove('is-walking');el.dataset.pose='walk';
  el.querySelector('.character-sprite').style.transform=`rotate(${Math.sin(walk*Math.PI*12)*Math.sin(walk*Math.PI)*1.2}deg)`;
 });
 const together=$('.ticket-together'),join=smooth((t-.54)/.055),into=smooth((t-.60)/.34);
 const coupleScale=.72-into*.48,bob=Math.sin(into*Math.PI*16)*Math.sin(into*Math.PI)*2;
 together.style.opacity=String(join*(1-smooth((t-.95)/.045)));
 together.style.transform=`translate3d(${w*.5-together.offsetWidth/2}px,${-h*(.16+into*(mobile?.36:.30))+bob}px,0) scale(${coupleScale}) rotate(${Math.sin(into*Math.PI*16)*Math.sin(into*Math.PI)*.6}deg)`;
 $('.ticket-dialogue').style.opacity=String(smooth((t-.55)/.10));
 $('.ticket-dialogue').textContent='“Our online passes are ready. Let’s head inside!”';
 $('.ticket-next').textContent=t<.25?'Their ride pulls up outside the venue.':t<.4?'The car comes to a gentle stop.':t<.55?'They step out on the venue side of the car.':t<.60?'They take each other’s hand.':t<.94?'Hand in hand, they walk straight into the venue.':'Together, they enter The Garba Experience. ↓';
}
if(name==='gate'){
 const close=smooth(p),panel=$('#at-the-ground');
 $('.gate-photo').style.transform=`scale(${1+close*.09})`;
 $('.arriving-man').style.transform=`translate(${close*innerWidth*(mobile?.09:.12)}px,${-close*24}px) scale(${1-close*.12})`;
 $('.arriving-woman').style.transform=$('.arriving-man').style.transform;
 $('.sound-rings').style.setProperty('--ring-scale',String(.7+close));
 $('.sound-rings').style.setProperty('--ring-opacity',String(.15+close*.35));
 panel.style.setProperty('--arrival-energy',String(.4+close*.6));
 panel.dataset.music=String(musicDancing);
 const her=p>.29&&p<.65;
 $('#gate-thought').dataset.voice=her?'her':'him';
 thought('gate-thought',p<.29?'“Listen to that sound! The stage looks incredible.”':p<.65?'“Those lights and the décor! Look, everyone’s already playing Garba!”':'“This is going to be an amazing night. Let’s get closer!”');
}
if(name==='shrine'){$('.praying-man').style.transform=`translateY(${(1-smooth(p/.25))*30}px)`;$('.praying-woman').style.transform=$('.praying-man').style.transform;$('.shrine-picture img').style.transform=reduced.matches?'none':`scale(${1+p*.04})`;}
if(name==='dance'){
 const floor=$('.dance-floor'),w=floor.clientWidth;
 const join=Math.max(smooth((p-.08)/.35),smooth(danceTime/1.2));
 const dancing=musicDancing||p>.43;
 const rhythm=(musicDancing?danceTime:p*12)*Math.PI*2/1.8;
 [$('.joining-man'),$('.joining-woman')].forEach((person,i)=>{
  person.dataset.pose=dancing?'dance':'walk';
  const beat=dancing?Math.sin(rhythm+i*.6):0;
  const entry=(1-join)*w*(i? .15:-.15);
  person.style.transform=`translate3d(${entry+beat*7}px,${-Math.abs(beat)*4}px,0) rotate(${beat*(i?-3:3)}deg)`;
 });
 thought('dance-thought',dancing?'“This is exactly the night we hoped for!”':'“Come on, let’s join the circle!”');
 $('.ground-photo').style.transform=`scale(${1+smooth(p)*.035})`;

}}
if(ready&&active?.startsWith('garba')&&musicDancing){const volume=arrivalVolume();if(player.getVolume()!==volume)player.setVolume(volume)}
if(musicDancing&&!reduced.matches&&!document.hidden&&danceVisible)schedule();
}
addEventListener('visibilitychange',()=>{lastDanceFrame=0;schedule()});
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',measure);addEventListener('load',measure);document.fonts?.ready.then(measure);reduced.addEventListener('change',measure);measure();
const dock=$('.music-dock'),frame=$('#music-frame'),status=$('#music-status'),soundButton=$('#play-with-sound');
let active=null,tracks={},lastButton=null,player=null,ready=false,apiPromise=null;
const buttons=[...document.querySelectorAll('[data-audio]')];
function report(message,state='loading'){
 status.textContent=message;dock.dataset.playback=state;
 setMusicDancing(state==='playing'&&Boolean(active?.startsWith('garba')));
 buttons.forEach(b=>{const selected=b.dataset.audio===active;b.setAttribute('aria-pressed',String(selected));b.textContent=(selected?'■ Close · ':'▶ ')+(tracks[b.dataset.audio]?.title||'Play music')});
}
function loadAPI(){
 if(window.YT?.Player)return Promise.resolve();
 if(apiPromise)return apiPromise;
 apiPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';
  const timer=setTimeout(()=>{apiPromise=null;script.remove();reject(Error('Music is taking longer to load. Press Play with sound to retry.'))},20000);
  window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);resolve()};
  script.onerror=()=>{clearTimeout(timer);apiPromise=null;script.remove();reject(Error('Could not connect to YouTube. Press Play with sound to retry.'))};
  document.head.append(script);
 });return apiPromise;
}
function playAudibly(){
 if(!active)return;
 if(!ready){startPlayer();return}
 player.unMute();player.setVolume(arrivalVolume());player.playVideo();
 report('Starting sound…');
}
function startPlayer(){
 if(player)return;
 report('Loading music… This may take a moment.');
 loadAPI().then(()=>{
  if(!active||player)return;
  const mount=document.createElement('div');frame.replaceChildren(mount);
  player=new YT.Player(mount,{
   width:'100%',height:200,videoId:tracks[active].youtube,
   playerVars:{playsinline:1,rel:0,origin:location.origin},
   events:{
    onReady:()=>{
     ready=true;
     if(!active){player.stopVideo();return}
     player.loadVideoById(tracks[active].youtube);playAudibly();
    },
    onStateChange:e=>{
     if(!active){if(e.data===1)player.stopVideo();return}
     if(e.data===1)report(player.isMuted()||player.getVolume()===0?'Video is muted. Press Play with sound.':'Playing with sound','playing');
     else if(e.data===2)report('Paused. Press Play with sound to continue.','paused');
     else if(e.data===3)report('Buffering music…','buffering');
     else if(e.data===0)report('Finished. Play again or choose another song.','ended');
    },
    onAutoplayBlocked:()=>{if(active)report('Press Play with sound to start the music.','waiting')},
    onError:()=>{if(active)report('This recording could not play here. Try another song or open it on YouTube.','error')}
   }
  });
 }).catch(e=>{if(active)report(e.message,'error')});
}
function chooseMusic(id,button){
 const t=tracks[id];if(!t?.youtube)return;
 lastButton=button||lastButton;active=id;dock.hidden=false;
 $('#music-choice').value=id;$('#now-playing').textContent=t.title+' · '+t.credit;
 $('#music-source').href='https://www.youtube.com/watch?v='+encodeURIComponent(t.youtube);
 report('Loading '+t.title+'…');
 if(ready){player.loadVideoById(t.youtube);playAudibly()}else startPlayer();
}
function stopMusic(returnFocus=false){
 active=null;if(ready)player.stopVideo();dock.hidden=true;report('Music stopped.','stopped');
 if(returnFocus)lastButton?.focus();
}
buttons.forEach(b=>b.disabled=true);
fetch('story-audio.json').then(r=>{if(!r.ok)throw Error('Music configuration');return r.json()}).then(config=>{
 tracks=config;buttons.forEach(b=>{const t=tracks[b.dataset.audio];b.disabled=!t?.youtube;b.textContent='▶ '+(t?.title||'Music unavailable')})
}).catch(()=>document.querySelectorAll('.audio-note').forEach(n=>n.textContent='Music could not load. Please refresh and try again.'));
buttons.forEach(b=>b.addEventListener('click',()=>{if(active===b.dataset.audio)stopMusic();else chooseMusic(b.dataset.audio,b)}));
soundButton.addEventListener('click',playAudibly);
$('#close-music').addEventListener('click',()=>stopMusic(true));
addEventListener('keydown',e=>{if(e.key==='Escape'&&!dock.hidden)stopMusic(true)});
$('#music-choice').addEventListener('change',e=>chooseMusic(e.target.value));

function renderOpening(){
 const opening=$('.opening-journey');
 const p=reduced.matches?.5:clamp((scrollY-opening.offsetTop)/Math.max(1,opening.offsetHeight-innerHeight));
 document.querySelectorAll('.opening-layer').forEach(el=>{
  const enter=+el.dataset.enter;
  const reveal=reduced.matches?1:smooth((p*.55-enter)/.13);
  const offset=(1-reveal)*110;
  const direction=el.dataset.direction;
  el.style.transform=direction==='top'?`translateY(${-offset}%)`:direction==='bottom'?`translateY(${offset}%)`:`translateX(${direction==='left'?-offset:offset}%)`;
  el.style.opacity=String(reveal);
 });
 opening.dataset.phase=p<.86?'enter':'complete';
 $('.opening-timeline i').style.transform=`scaleX(${p})`;
 $('#opening-cue').textContent=p<.86?'SCROLL TO REVEAL THE CELEBRATION ↓':'CONTINUE INTO THE STORY ↓';
}

// Scoped atmosphere and staggered copy only after the first three scenes.
const paintedChapters=document.querySelectorAll('.painted-chapter');
const paintedObserver=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.classList.toggle('chapter-visible',entry.isIntersecting)},{threshold:0,rootMargin:'0px'});
paintedChapters.forEach(chapter=>{
 chapter.classList.add('motion-ready');paintedObserver.observe(chapter);
 const panel=chapter.querySelector('.story-panel');if(!panel)return;
 const atmosphere=document.createElement('div');atmosphere.className='evening-atmosphere';atmosphere.setAttribute('aria-hidden','true');
 for(let i=0;i<15;i++){const mote=document.createElement('i');mote.style.cssText=`--x:${5+(i*29)%90}%;--y:${18+(i*17)%74}%;--duration:${5+i%5}s;--delay:${-i*.7}s`;atmosphere.append(mote)}
 const light=document.createElement('div');light.className='evening-light';light.setAttribute('aria-hidden','true');panel.append(light,atmosphere);
});

// A user-started Garba track grows from distant to full sound as they approach.
function arrivalVolume(){
 const gate=document.querySelector('#at-the-ground'),rect=gate.getBoundingClientRect();
 if(rect.top>0||rect.bottom<innerHeight)return 85;
 return Math.round(38+47*smooth(clamp(-rect.top/Math.max(1,gate.offsetHeight-innerHeight))));
}
