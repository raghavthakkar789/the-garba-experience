const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const opening = document.querySelector('.hamper-scroll');
const excitement = document.querySelector('.excitement');
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
let queued = false;

function render() {
  queued = false;
  const rect = opening.getBoundingClientRect();
  const progress = clamp(-rect.top / Math.max(1, opening.offsetHeight - innerHeight));
  const open = reduced.matches ? 0 : smooth((progress - .07) / .52);
  opening.style.setProperty('--door-angle', `${open * 105}deg`);
  opening.style.setProperty('--door-opacity', `${1 - smooth((progress - .54) / .13)}`);
  opening.style.setProperty('--opened', `${smooth((progress - .45) / .2)}`);
  opening.dataset.phase = reduced.matches ? 'static' : progress < .07 ? 'closed' : progress < .67 ? 'opening' : 'open';
  // Keep the image link reachable by keyboard; focusing it also reveals the card.
  const reveal = reduced.matches ? 1 : smooth((innerHeight - excitement.getBoundingClientRect().top) / (innerHeight * .62));
  excitement.style.setProperty('--excited-opacity', `${reveal}`);
  excitement.style.setProperty('--excited-shift', `${(1 - reveal) * 35}px`);
  excitement.style.setProperty('--excited-em-shift', `${(1 - reveal) * 65}px`);
  excitement.style.setProperty('--excited-rotation', `${(1 - reveal) * -5}deg`);
}
function schedule() {
  if (!queued) { queued = true; requestAnimationFrame(render); }
}
// Progressive enhancement: without scripts the front and invitation stack normally.
document.documentElement.classList.add('hamper-motion');
opening.querySelector('.invitation-facsimile').addEventListener('focus', () => {
  if (!reduced.matches && opening.dataset.phase !== 'open') {
    window.scrollTo({ top: opening.offsetTop + (opening.offsetHeight - innerHeight) * .72, behavior: 'instant' });
  }
});
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule);
addEventListener('load', schedule);
reduced.addEventListener('change', schedule);
document.fonts?.ready.then(schedule);
render();
