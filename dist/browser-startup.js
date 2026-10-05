/* Recover within this tab after interrupted iOS startup or Autoscroll playback. */
(() => {
  'use strict';
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!ios) return;
  const root = document.documentElement, key = 'garba-ios-startup';
  const playbackKey = 'garba-ios-playback';
  root.classList.add('ios-native-scroll');
  // A clean navigation clears the marker; a killed WebContent process cannot.
  // An immediate retry uses the existing SVG elephant and lighter soft effects.
  try {
    const previous = Number(sessionStorage.getItem(key));
    const playback = Number(sessionStorage.getItem(playbackKey));
    const recent = (timestamp, age) => timestamp > 0 && Date.now() >= timestamp && Date.now() - timestamp < age;
    if (recent(previous, 60000) || recent(playback, 120000)) {
      root.classList.add('safety-recovery', 'safety-light-effects');
    }
    sessionStorage.removeItem(playbackKey);
    sessionStorage.setItem(key, String(Date.now()));
  } catch { /* Storage can be unavailable in private/restricted browsing. */ }
  function clear() { try { sessionStorage.removeItem(key); } catch {} }
  // Only guard startup: healthy visits and deliberate reloads retain full quality.
  setTimeout(clear, 10000);
  // A lightweight heartbeat covers playback started long after initial loading.
  // Pause, completion, backgrounding and navigation clear it via the controller.
  // Never reload or restart playback automatically; the next user-led visit may recover.
  let heartbeat = 0;
  function markPlayback() {
    try { sessionStorage.setItem(playbackKey, String(Date.now())); } catch {}
  }
  function stopPlayback() {
    clearInterval(heartbeat); heartbeat = 0;
    try { sessionStorage.removeItem(playbackKey); } catch {}
  }
  window.garbaPlaybackRecovery = {
    start() {
      stopPlayback(); markPlayback();
      heartbeat = setInterval(markPlayback, 5000);
    },
    stop: stopPlayback,
  };
  addEventListener('pagehide', () => { clear(); stopPlayback(); });
})();
