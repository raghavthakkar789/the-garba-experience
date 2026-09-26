const intro=document.querySelector('.hamper-reveal');
const feeling=document.querySelector('.invitation-excitement');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
let pending=false;
function render(){
 pending=false;
 if(reduced.matches)return;
 const range=Math.max(1,intro.offsetHeight-innerHeight);
 const progress=clamp((scrollY-intro.offsetTop)/range);
 intro.style.setProperty('--progress',progress);
 intro.style.setProperty('--cover',ease((progress-.16)/.29));
 intro.style.setProperty('--letter',ease((progress-.33)/.28));
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(render)}}
addEventListener('scroll',schedule,{passive:true});
addEventListener('resize',schedule);
reduced.addEventListener('change',schedule);
new IntersectionObserver(entries=>entries.forEach(entry=>{
 if(entry.isIntersecting)entry.target.classList.add('is-visible');
}),{threshold:.25}).observe(feeling);
schedule();
