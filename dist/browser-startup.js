/* Recover within this tab if iOS terminates the page during startup. */
(() => {
  'use strict';
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!ios) return;
  const root = document.documentElement, key = 'garba-ios-startup';
  root.classList.add('ios-native-scroll');
  // A clean navigation clears the marker; a killed WebContent process cannot.
  // An immediate retry uses the existing SVG elephant and lighter soft effects.
  try {
    const previous = Number(sessionStorage.getItem(key));
    if (previous && Date.now() - previous < 60000) {
      root.classList.add('safety-recovery', 'safety-light-effects');
    }
    sessionStorage.setItem(key, String(Date.now()));
  } catch { /* Storage can be unavailable in private/restricted browsing. */ }
  function clear() { try { sessionStorage.removeItem(key); } catch {} }
  // Only guard startup: healthy visits and deliberate reloads retain full quality.
  setTimeout(clear, 10000);
  addEventListener('pagehide', clear);
})();
