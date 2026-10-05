/* Deterministic recovery lifetimes; no permanent flags or forced page reloads. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../dist/browser-startup.js'),'utf8');
const key='garba-ios-playback';
function boot({ios=true,blocked=false,seed={},now=100000}={}){
 const storage=new Map(Object.entries(seed)),classes=new Set(),events={},timers=new Map();let id=0,time=now;
 const context={navigator:{userAgent:ios?'iPhone':'Desktop',platform:'',maxTouchPoints:0},document:{documentElement:{classList:{add:(...names)=>names.forEach(n=>classes.add(n))}}},
  Date:{now:()=>time},sessionStorage:{getItem:k=>{if(blocked)throw Error('blocked');return storage.get(k)||null},setItem:(k,v)=>{if(blocked)throw Error('blocked');storage.set(k,v)},removeItem:k=>{if(blocked)throw Error('blocked');storage.delete(k)}},
  addEventListener:(name,cb)=>(events[name]??=[]).push(cb),
  setTimeout:(cb,delay)=>{timers.set(++id,{cb,at:time+delay});return id},
  setInterval:(cb,delay)=>{timers.set(++id,{cb,at:time+delay,interval:delay});return id},
  clearInterval:id=>timers.delete(id)};
 context.window=context;vm.runInNewContext(source,context);
 return {context,storage,classes,events,advance(ms){const end=time+ms;while(true){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;time=next[1].at;if(next[1].interval)next[1].at+=next[1].interval;else timers.delete(next[0]);next[1].cb()}time=end}};
}
const b=boot();b.advance(15000);
assert.equal(b.storage.has('garba-ios-startup'),false);
assert(b.context.garbaPlaybackRecovery,'playback recovery must survive the startup guard');
b.context.garbaPlaybackRecovery.start();
assert(b.storage.has(key));b.advance(64000);
const heartbeat=Number(b.storage.get(key));assert(heartbeat>=175000,'marker stays fresh beyond startup and through the full film');
assert(boot({seed:{[key]:String(heartbeat)},now:180000}).classes.has('safety-recovery'),'unclean playback retry enters fallback');
assert(!boot({seed:{[key]:'1000'},now:180000}).classes.has('safety-recovery'),'old playback marker expires');
b.context.garbaPlaybackRecovery.stop();assert(!b.storage.has(key));b.advance(10000);assert(!b.storage.has(key),'stop cancels heartbeat');
b.context.garbaPlaybackRecovery.start();b.events.pagehide.forEach(cb=>cb());assert(!b.storage.has(key),'clean navigation clears playback state');
const restricted=boot({blocked:true});restricted.context.garbaPlaybackRecovery.start();restricted.advance(64000);restricted.context.garbaPlaybackRecovery.stop();
assert.equal(boot({ios:false}).context.garbaPlaybackRecovery,undefined,'desktop gets no recovery work');
console.log('PASS: full-playback heartbeat, interrupted retry, expiry, clean exit, blocked storage and desktop isolation');
