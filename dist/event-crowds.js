/* Align each guest layer to its painted scene, and animate only visible scenes. */
(() => {
  "use strict";
  const root = document.documentElement;
  const layers = [...document.querySelectorAll(".event-crowd")];
  const scenes = [...new Set(layers.map(layer => layer.closest(".scene")))];
  let pageVisible = true;
  function measure() {
    layers.forEach(layer => {
      const scene = layer.closest(".scene");
      const source = layer.dataset.art ? scene.querySelector(layer.dataset.art) : null;
      const width = layer.clientWidth, height = layer.clientHeight;
      const ratio = source ? (source.naturalWidth / source.naturalHeight || 1.5) : width / height;
      const contain = source && getComputedStyle(source).objectFit === "contain";
      const planeWidth = source ? (contain ? Math.min(width, height * ratio) : Math.max(width, height * ratio)) : width;
      const planeHeight = source ? planeWidth / ratio : height;
      layer.style.setProperty("--plane-width", `${planeWidth}px`);
      layer.style.setProperty("--plane-height", `${planeHeight}px`);
      layer.style.setProperty("--unit-x", `${planeWidth / 100}px`);
      layer.style.setProperty("--unit-y", `${planeHeight / 100}px`);
    });
  }
  function sync() {
    for (const scene of scenes) {
      const running = root.classList.contains("cinematic") &&
        scene.classList.contains("is-visible") && !document.hidden && pageVisible;
      if (running) scene.dataset.crowdRunning = "true";
      else delete scene.dataset.crowdRunning;
    }
  }
  const observer = new MutationObserver(sync);
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  scenes.forEach(scene => observer.observe(scene, { attributes: true, attributeFilter: ["class"] }));
  if (typeof ResizeObserver !== "undefined") {
    const resize = new ResizeObserver(measure);
    layers.forEach(layer => resize.observe(layer));
  }
  document.addEventListener("load", event => {
    if (event.target instanceof HTMLImageElement) measure();
  }, true);
  addEventListener("resize", measure, { passive: true });
  document.addEventListener("visibilitychange", sync);
  addEventListener("pagehide", () => { pageVisible = false; sync(); });
  addEventListener("pageshow", () => { pageVisible = true; measure(); sync(); });
  measure();
  sync();
})();
