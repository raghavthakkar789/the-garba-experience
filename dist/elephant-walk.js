/* Four planted-foot steps, with a quiet saddle and a stop for boarding. */
(() => {
  'use strict';
  const ride = document.querySelector('.journey-elephant');
  if (!ride) return;
  const root = document.documentElement;
  const legs = [...ride.querySelectorAll('.elephant-leg')];
  const offsets = { 'rear-near': 0, 'front-near': .25, 'rear-far': .5, 'front-far': .75 };
  const feet = { 'rear-near': [1580,1190], 'front-near': [1040,1190], 'rear-far': [1320,1184], 'front-far': [785,1180] };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, last = 0, phase = 0, weight = 0, pageVisible = true;
  const permitted = () => root.classList.contains('cinematic') && !ride.hidden &&
    !document.hidden && pageVisible && !reduced.matches;
  function paint() {
    for (const leg of legs) {
      const t = (phase + offsets[leg.dataset.leg]) % 1;
      const stance = .64;
      const swing = Math.max(0, (t - stance) / (1 - stance));
      const eased = swing * swing * (3 - 2 * swing);
      const angle = (t < stance ? 8 - 16 * t / stance : -8 + 16 * eased) * weight;
      const lift = t < stance ? 0 : Math.sin(swing * Math.PI) * 30 * weight;
      const [x, y] = leg.dataset.hip.split(',').map(Number);
      // Counter the vertical component of rotation during contact, then lift on recovery.
      const [footX, footY] = feet[leg.dataset.leg];
      const radians = angle * Math.PI / 180;
      const ground = (footY - y) * (1 - Math.cos(radians)) - (footX - x) * Math.sin(radians);
      leg.setAttribute('transform', `translate(0 ${(ground - lift).toFixed(3)}) rotate(${angle.toFixed(3)} ${x} ${y})`);
    }
    const rise = Math.sin(phase * Math.PI * 8) * .8 * weight;
    ride.style.setProperty('--gait-rise', `${rise.toFixed(3)}px`);
    ride.style.setProperty('--saddle-rise', `${(-rise * .45).toFixed(3)}px`);
  }
  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  }
  function tick(now) {
    frame = 0;
    if (!permitted()) { stop(); return; }
    const dt = last ? Math.min((now - last) / 1000, .2) : 0;
    last = now;
    const target = ride.dataset.walking === 'true' ? 1 : 0;
    weight += (target - weight) * (1 - Math.exp(-dt * 12));
    if (!target && weight < .001) weight = 0;
    phase = (phase + dt * weight / 2.3) % 1;
    paint();
    if (target || weight) frame = requestAnimationFrame(tick);
    else last = 0;
  }
  function sync() {
    if (!permitted()) {
      stop();
      if (!root.classList.contains('cinematic') || reduced.matches) {
        weight = 0; paint();
      }
      return;
    }
    if (!frame && (ride.dataset.walking === 'true' || weight)) frame = requestAnimationFrame(tick);
  }
  const observer = new MutationObserver(sync);
  observer.observe(root, {attributes:true, attributeFilter:['class']});
  observer.observe(ride, {attributes:true, attributeFilter:['hidden', 'data-walking']});
  document.addEventListener('visibilitychange', sync);
  addEventListener('pagehide', () => { pageVisible = false; stop(); });
  addEventListener('pageshow', () => { pageVisible = true; sync(); });
  reduced.addEventListener('change', sync);
  paint();
  sync();
})();
