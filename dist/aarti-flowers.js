/* A quiet shower of marigold, rose and jasmine petals, only during aarti. */
(() => {
  const shower = document.querySelector("#devotion .flower-shower");
  if (!shower) return;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 36; i++) {
    const petal = document.createElement("i");
    petal.className = `flower-petal petal-${i % 3}`;
    petal.style.setProperty("--petal-left", `${(i * 37 + 11) % 100}%`);
    petal.style.setProperty("--petal-size", `${8 + i % 7}px`);
    petal.style.setProperty("--petal-drift", `${(i % 2 ? 1 : -1) * (22 + i % 5 * 11)}px`);
    petal.style.setProperty("--petal-duration", `${7 + i % 6 * 0.7}s`);
    petal.style.setProperty("--petal-delay", `${-i * 0.73}s`);
    petal.style.setProperty("--petal-turn", `${180 + i % 5 * 90}deg`);
    fragment.append(petal);
  }
  shower.append(fragment);
  const pauseWhenHidden = () => {
    shower.dataset.paused = String(document.hidden);
  };
  document.addEventListener("visibilitychange", pauseWhenHidden);
  pauseWhenHidden();
})();
