/* Scroll drives the entire road; no autoplay, wheel interception or pagination. */
(() => {
  'use strict';
  const road = document.querySelector('#partner-road');
  if (!road) return;
  const root = document.documentElement;
  const shops = [...road.querySelectorAll('.partner-shop')];
  const pairs = Math.max(...shops.map(shop => Number(shop.dataset.roadPair))) + 1;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let enabled = false, frame = 0, top = 0, travel = 1;
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  function render() {
    frame = 0;
    if (!enabled) return;
    const progress = clamp((scrollY - top) / travel);
    const cursor = progress * (pairs - 1);
    road.style.setProperty('--road-progress', progress.toFixed(4));
    // A gentle step follows distance travelled and stops as soon as scrolling stops.
    road.style.setProperty('--walk-bob', `${Math.sin(progress * 240) * 2.5}px`);
    road.style.setProperty('--walk-sway', `${Math.sin(progress * 120) * .7}deg`);
    const mobile = innerWidth <= 650;
    shops.forEach((shop, index) => {
      const distance = Number(shop.dataset.roadPair) - cursor;
      const side = index % 2 ? 1 : -1;
      const visible = Math.abs(distance) < 1;
      const opacity = clamp((1 - Math.abs(distance)) * 3);
      const scale = distance >= 0 ? 1 - distance * .5 : 1 - distance * .2;
      const spread = (mobile ? 24 : 33) * (1 - distance * .55);
      const y = -distance * (mobile ? 22 : 26);
      shop.style.opacity = visible ? opacity.toFixed(3) : '0';
      shop.style.zIndex = String(20 - Math.round(distance * 10));
      shop.style.transform = `translate(-50%, 0) translate(${side * spread}vw, ${y}vh) scale(${scale})`;
    });
  }
  function schedule() { if (enabled && !frame) frame = requestAnimationFrame(render); }
  function setup() {
    enabled = !reduced.matches && !root.classList.contains('read-mode') && innerHeight >= 640;
    road.classList.toggle('road-animated', enabled);
    road.style.setProperty('--road-height', innerHeight * (pairs * 1.15 + 1));
    if (enabled) {
      top = road.getBoundingClientRect().top + scrollY;
      travel = Math.max(1, road.offsetHeight - road.querySelector('.partner-road-stage').offsetHeight);
      render();
    } else {
      shops.forEach(shop => shop.removeAttribute('style'));
      road.style.removeProperty('--walk-bob');
      road.style.removeProperty('--walk-sway');
    }
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', setup, { passive: true });
  addEventListener('pageshow', setup);
  addEventListener('load', setup, { once: true });
  reduced.addEventListener('change', setup);
  new MutationObserver(setup).observe(root, { attributes: true, attributeFilter: ['class'] });
  // Earlier story geometry may change when fonts finish loading.
  document.fonts?.ready.then(setup);
  setup();
})();
