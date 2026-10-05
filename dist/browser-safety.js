/* A bounded, iOS-only rendering safety net. No timeline or asset changes. */
(() => {
  'use strict';
  const root = document.documentElement;
  if (!root.classList.contains('ios-native-scroll')) return;
  let frame = 0, last = 0, windowStart = 0, samples = 0, slow = 0, badWindows = 0;
  let scrollingUntil = 0, pageVisible = true;
  const canSample = () => pageVisible && !document.hidden &&
    root.classList.contains('cinematic') &&
    !root.classList.contains('safety-light-effects') && !document.querySelector('dialog[open]');
  function stop() {
    cancelAnimationFrame(frame);
    frame = last = windowStart = samples = slow = badWindows = 0;
  }
  function sample(now) {
    frame = 0;
    if (!canSample() || now > scrollingUntil) { stop(); return; }
    if (!windowStart) windowStart = now;
    const delta = last ? now - last : 0;
    last = now;
    // Ignore isolated long stalls and suspension; observe sustained low cadence.
    if (delta > 0 && delta < 250) { samples++; if (delta > 40) slow++; }
    if (now - windowStart >= 2500) {
      badWindows = samples >= 30 && slow / samples > .45 ? badWindows + 1 : 0;
      windowStart = now; samples = slow = 0;
      if (badWindows >= 2) {
        root.classList.add('safety-light-effects');
        stop();
        return;
      }
    }
    frame = requestAnimationFrame(sample);
  }
  addEventListener('scroll', () => {
    if (!canSample()) return;
    scrollingUntil = performance.now() + 300;
    if (!frame) frame = requestAnimationFrame(sample);
  }, {passive:true});
  function visibility() {
    root.classList.toggle('safety-page-hidden', !pageVisible || document.hidden);
    if (!pageVisible || document.hidden) stop();
  }
  document.addEventListener('visibilitychange', visibility);
  addEventListener('pagehide', () => { pageVisible = false; visibility(); });
  addEventListener('pageshow', () => { pageVisible = true; visibility(); });
  visibility();
})();
