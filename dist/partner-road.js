/* The road is the final chapter of the shared story, never a separate scroller. */
(() => {
  'use strict';
  const road = document.querySelector('#partner-road');
  if (!road) return;
  const shops = [...road.querySelectorAll('.partner-shop')];
  const pairs = Math.max(...shops.map(shop => Number(shop.dataset.roadPair))) + 1;
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  function render(progress) {
    const cursor = clamp((progress - .04) / .91) * (pairs - 1);
    road.style.setProperty('--road-progress', progress.toFixed(4));
    road.style.setProperty('--walk-bob', `${Math.sin(progress * 240) * 2.5}px`);
    road.style.setProperty('--walk-sway', `${Math.sin(progress * 120) * .7}deg`);
    road.style.setProperty('--walk-depth', (1.06 - progress * .16).toFixed(3));
    const mobile = innerWidth <= 650;
    shops.forEach((shop, index) => {
      const distance = Number(shop.dataset.roadPair) - cursor;
      const side = index % 2 ? 1 : -1;
      const opacity = clamp((1 - Math.abs(distance)) * 3);
      const scale = distance >= 0 ? 1 - distance * .5 : 1 - distance * .2;
      const spread = (mobile ? 24 : 33) * (1 - distance * .55);
      shop.style.opacity = opacity.toFixed(3);
      shop.style.zIndex = String(20 - Math.round(distance * 10));
      shop.style.transform = `translate(-50%, 0) translate(${side * spread}vw, ${-distance * (mobile ? 22 : 26)}vh) scale(${scale})`;
    });
  }
  road.addEventListener('story-progress', event => render(event.detail));
  new MutationObserver(() => {
    if (!document.documentElement.classList.contains('cinematic')) {
      shops.forEach(shop => shop.removeAttribute('style'));
      road.removeAttribute('style');
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
})();
