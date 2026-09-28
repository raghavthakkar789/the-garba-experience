/* A reversible hand-off: the pass follows her palm, then belongs to his. */
(() => {
  "use strict";
  const scene = document.querySelector("#the-invitation");
  const rig = scene?.querySelector(".handoff-rig");
  if (!rig) return;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const palm = (x, y, dx, dy, degrees) => {
    const a = degrees * Math.PI / 180;
    return [x + dx * Math.cos(a) - dy * Math.sin(a),
      y + dx * Math.sin(a) + dy * Math.cos(a)];
  };
  function draw(progress) {
    const reveal = ease((progress - 0.06) / 0.28);
    const reach = ease((progress - 0.24) / 0.18);
    const receive = ease((progress - 0.43) / 0.17);
    const front = ease((progress - 0.17) / 0.11);
    const herAngle = -80 * (1 - reveal) - 68 * receive;
    const hisAngle = 48 * (1 - reach) - 8 * receive;
    const herPalm = palm(734, 331, -147.5, 56, -80 * (1 - reveal));
    const hisPalm = palm(306, 316, 152.5, 57.5, hisAngle);
    // Her right-hand grip supports the right edge; his palm takes the centre.
    const x = (herPalm[0] - 195) * (1 - receive) + (hisPalm[0] - 135) * receive;
    const y = (herPalm[1] - 188) * (1 - receive) + (hisPalm[1] - 203) * receive;
    rig.style.setProperty("--her-arm", `${herAngle.toFixed(3)}deg`);
    rig.style.setProperty("--his-arm", `${hisAngle.toFixed(3)}deg`);
    // Percentages are relative to the pass itself so transforms scale on phones.
    rig.style.setProperty("--pass-x", `${(x / 270 * 100).toFixed(4)}%`);
    rig.style.setProperty("--pass-y", `${(y / (375 * 270 / 485) * 100).toFixed(4)}%`);
    rig.style.setProperty("--pass-turn", `${(18 * (1 - reveal) - 4 * receive).toFixed(3)}deg`);
    rig.style.setProperty("--front", front.toFixed(4));
    rig.style.setProperty("--rear", (1 - front).toFixed(4));
    rig.style.setProperty("--pass-visible", ease((progress - 0.07) / 0.07).toFixed(4));
    rig.dataset.handoff = progress < 0.07 ? "concealed"
      : progress < 0.34 ? "revealing" : progress < 0.6 ? "offering" : "received";
  }
  scene.addEventListener("story-progress", (event) => draw(event.detail));
  draw(0);
})();
