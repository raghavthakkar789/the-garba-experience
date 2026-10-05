/* GSAP owns only opt-in iOS Autoscroll; native gestures and scene rendering stay independent. */
(() => {
  'use strict';
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!ios) return;
  const root = document.documentElement;
  let loading = null, loaded = false, generation = 0, tween = null, savedStyles = null, loadTimer = 0;
  function script(src) {
    return new Promise((resolve, reject) => {
      const node = document.createElement('script');
      function finish(error) {
        node.onload = node.onerror = null;
        if (error) { node.remove(); reject(error); } else resolve();
      }
      node.src = src;
      node.onload = () => finish();
      node.onerror = () => finish(Error('Autoscroll library unavailable'));
      document.head.append(node);
    });
  }
  function ready() {
    if (loaded) return Promise.resolve();
    if (!loading) loading = (async () => {
      if (!window.gsap) await script('vendor/gsap-3.15.0/gsap.min.js');
      if (!window.ScrollToPlugin) await script('vendor/gsap-3.15.0/ScrollToPlugin.min.js');
      if (!window.gsap || !window.ScrollToPlugin) throw Error('Autoscroll library did not initialize');
      window.gsap.registerPlugin(window.ScrollToPlugin);
      // Keep the existing real elapsed-time contract after dropped frames.
      window.gsap.ticker.lagSmoothing(0);
      window.gsap.ticker.sleep();
      loaded = true;
    })().catch(error => { loading = null; throw error; });
    return loading;
  }
  function stop() {
    generation++;
    clearTimeout(loadTimer); loadTimer = 0;
    tween?.kill(); tween = null;
    if (root.classList.contains('ios-autoscroll-active')) root.classList.remove('ios-autoscroll-active');
    if (savedStyles) {
      for (const {node,value,priority} of savedStyles) {
        if (value) node.style.setProperty('scroll-behavior', value, priority);
        else node.style.removeProperty('scroll-behavior');
      }
      savedStyles = null;
    }
    // This page uses GSAP exclusively for this adapter, never for native gestures.
    if (loaded) window.gsap.ticker.sleep();
  }
  function start({offset, duration, positionAt, canRun, onStart, onUpdate, onStop, onError}) {
    stop();
    const token = generation;
    function launch() {
      if (token !== generation) return;
      clearTimeout(loadTimer); loadTimer = 0;
      if (!canRun()) { onStop(); return; }
      const gsap = window.gsap, remaining = Math.max(0, duration - offset);
      const from = scrollY, to = positionAt(duration), distance = to - from;
      if (!remaining || distance <= 0) { onStop(); return; }
      savedStyles = [root,document.body].map(node => ({node,
        value:node.style.getPropertyValue('scroll-behavior'),priority:node.style.getPropertyPriority('scroll-behavior')}));
      // ScrollToPlugin must not compete with CSS smooth scrolling. Restore on every exit.
      savedStyles.forEach(({node}) => node.style.setProperty('scroll-behavior','auto','important'));
      let light = root.classList.contains('safety-light-effects');
      gsap.ticker.fps(light ? 30 : 240);
      // The original SVG follows the same scroll path without a second GPU renderer.
      root.classList.add('ios-autoscroll-active');
      onStart();
      tween = gsap.to(window, {
        duration: remaining,
        // Existing gesture handlers own takeover; avoid Safari scroll-offset jitter causing autoKill.
        scrollTo: {y:to, autoKill:false},
        ease: progress => (positionAt(offset + progress * remaining) - from) / distance,
        onUpdate() {
          if (token !== generation) return;
          if (!canRun()) { onStop(); return; }
          const nextLight = root.classList.contains('safety-light-effects');
          if (nextLight !== light) { light = nextLight; gsap.ticker.fps(light ? 30 : 240); }
          onUpdate(Math.min(duration, offset + this.time()));
        },
        onComplete() { if (token === generation) onStop(); },
      });
    }
    const fail = error => { if (token === generation) { stop(); onError(error); } };
    const run = () => { try { launch(); } catch (error) { fail(error); } };
    if (loaded) run();
    else {
      // Timeout cancels this play request, not the shared script download. A late
      // download may serve a later click but must never resurrect cancelled playback.
      loadTimer = setTimeout(() => fail(Error('Autoscroll library load timed out')), 10000);
      ready().then(run, fail);
    }
  }
  window.garbaIOSAutoScroll = Object.freeze({ready, start, stop});
  // Prefetch on iOS so the click can start sound and movement together; never runs on Android/desktop.
  ready().catch(() => {}); // A click retries a failed load; normal native scrolling remains usable.
})();
