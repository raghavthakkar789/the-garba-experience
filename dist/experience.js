/* A continuous, native-scroll film. Every scene remains readable without JavaScript. */
(() => {
  "use strict";
  const isReload =
    performance.getEntriesByType?.("navigation")?.[0]?.type === "reload";
  if (isReload && location.hash)
    history.replaceState(
      history.state,
      "",
      location.pathname + location.search,
    );
  const root = document.documentElement;
  const journey = document.querySelector(".journey");
  const stage = document.querySelector(".journey-stage");
  const elephantRide = document.querySelector(".journey-elephant");
  const scenes = [...document.querySelectorAll(".scene")];
  // The final walking chapter needs time for every shop, within the same film.
  const sceneSpans = scenes.map((scene) => Number(scene.dataset.scrollSpan) || 1);
  const sceneStarts = [];
  const storySpan = sceneSpans.reduce((total, span) => {
    sceneStarts.push(total);
    return total + span;
  }, 0);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const ease = (v) => {
    const x = clamp(v);
    return x * x * (3 - 2 * x);
  };
  const toast = document.querySelector(".toast");
  let toastTimer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 4400);
  }

  let frame = 0;
  let cinematic = false;
  let activeIndex = 0;
  let journeyTop = 0;
  let travel = 1;
  let stageHeight = 1;
  let lastWidth = innerWidth;
  let lastHeight = innerHeight;
  const opening = document.querySelector(".opening-scene");
  const openingButtons = [
    ...document.querySelectorAll("[data-open-invitation]"),
  ];
  const sealButton = document.querySelector("#invitation-seal");
  let readingBoxOpen = false;
  let focusStoryOnArrival = false;
  // One user gesture runs the doors and camera move on a deliberate timeline.
  const openingSoundButton = document.querySelector("#opening-sound");
  let entryFrame = 0;
  let openingSoundEnabled = true;
  let doorContext, doorSource;
  let doorSession = 0;
  function stopDoorSound() {
    ++doorSession;
    if (doorSource) {
      doorSource.onended = null;
      try { doorSource.stop(); } catch {}
      doorSource.disconnect();
      doorSource = undefined;
    }
    if (doorContext) {
      Promise.resolve(doorContext.close()).catch(() => {});
      doorContext = undefined;
    }
  }
  function cancelEntry() {
    if (entryFrame) cancelAnimationFrame(entryFrame);
    entryFrame = 0;
    delete opening.dataset.entering;
    focusStoryOnArrival = false;
    stopDoorSound();
  }
  async function playDoorSound() {
    stopDoorSound();
    if (!openingSoundEnabled) return;
    stopMusic();
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    const session = doorSession;
    try {
      const context = doorContext = new Audio();
      await context.resume();
      if (session !== doorSession || document.hidden) return;
      const duration = 3.65, rate = context.sampleRate;
      const buffer = context.createBuffer(1, Math.ceil(rate * duration), rate);
      const data = buffer.getChannelData(0);
      let phase = 0, wood = 0, air = 0, seed = 137;
      const envelope = (t, start, length) => {
        const p = (t - start) / length;
        return p > 0 && p < 1 ? Math.sin(Math.PI * p) ** 2 : 0;
      };
      // A quiet latch, warm wooden hinge friction and a soft air release.
      for (let i = 0; i < data.length; i++) {
        const t = i / rate;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const noise = seed / 2147483648 - 1;
        wood += 0.045 * (noise - wood);
        air += 0.2 * (noise - air);
        phase += 2 * Math.PI * (125 + 24 * Math.sin(t * 2.7) + 5 * Math.sin(t * 41)) / rate;
        const hinge = (Math.sin(phase) + 0.3 * Math.sin(phase * 2)) * 0.055;
        const latch = t < 0.22 ? Math.sin(t * 2 * Math.PI * 180) * Math.exp(-t * 32) * 0.12 : 0;
        data[i] = latch + (hinge + wood * 0.35) * envelope(t, 0.3, 2.35)
          + air * 0.28 * envelope(t, 2.45, 1.15);
      }
      const source = doorSource = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.onended = () => { if (session === doorSession) stopDoorSound(); };
      source.start();
    } catch {
      if (session === doorSession) stopDoorSound();
      // Audio support never blocks opening the invitation.
    }
  }
  function beginEntry() {
    if (entryFrame) return;
    if (!cinematic) {
      readingBoxOpen = true;
      updateOpening(1);
      scrollToScene(document.querySelector("#beginning"), "instant");
      document.querySelector("#beginning-title").focus({ preventScroll: true });
      return;
    }
    const from = scrollY;
    const to = journeyTop + (1.42 / storySpan) * travel;
    const started = performance.now();
    opening.dataset.entering = "true";
    focusStoryOnArrival = true;
    playDoorSound();
    const advance = (now) => {
      const elapsed = now - started;
      const doorTime = clamp(elapsed / 3800);
      // Finish the original door/camera move, then lower the friends on silk.
      const progress = elapsed <= 3800
        ? doorTime < 0.66
          ? 0.48 * ease(doorTime / 0.66)
          : 0.48 + 0.52 * ease((doorTime - 0.66) / 0.34)
        : 1 + 0.42 * clamp((elapsed - 3800) / 2800);
      window.scrollTo({ top: from + (to - from) * progress / 1.42, behavior: "instant" });
      if (elapsed < 6600) entryFrame = requestAnimationFrame(advance);
      else {
        entryFrame = 0;
        delete opening.dataset.entering;
      }
    };
    entryFrame = requestAnimationFrame(advance);
  }
  openingSoundButton.hidden = false;
  openingSoundButton.addEventListener("click", () => {
    openingSoundEnabled = !openingSoundEnabled;
    openingSoundButton.setAttribute("aria-pressed", String(openingSoundEnabled));
    openingSoundButton.textContent = openingSoundEnabled ? "Opening sound on" : "Opening sound off";
    if (!openingSoundEnabled) stopDoorSound();
  });
  for (const event of ["wheel", "touchstart"])
    addEventListener(event, (input) => {
      if (input.type === "touchstart" && input.target.closest?.("#opening-sound")) return;
      if (entryFrame) cancelEntry();
    }, { passive: true });
  addEventListener("pagehide", cancelEntry);
  document.addEventListener("keydown", (event) => {
    if (event.key === " " && event.target.closest?.("#opening-sound")) return;
    if (entryFrame && ["Escape", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) cancelEntry();
  });
  document.addEventListener("pointerdown", (event) => {
    if (entryFrame && !event.target.closest?.("#invitation-seal, #opening-sound")) cancelEntry();
  }, { passive: true });
  function updateOpening(open, enter = 0) {
    opening.style.setProperty("--enter", enter.toFixed(4));
    // Counter-scale the courtyard to keep it sharp as the box aperture expands.
    opening.style.setProperty(
      "--portal-inverse",
      (1.08 / (1 + enter * 3.5)).toFixed(4),
    );
    opening.style.setProperty("--entry-copy", (1 - clamp(open * 2)).toFixed(4));
    opening.style.setProperty("--open", open.toFixed(4));
    opening.style.setProperty("--seal", (1 - clamp(open * 4)).toFixed(4));
    const revealed = open >= 0.95;
    opening.dataset.open = String(revealed);
    openingButtons.forEach((button) => {
      button.hidden = button === sealButton && open >= 0.25;
      button.setAttribute("aria-expanded", String(revealed));
      button.setAttribute(
        "aria-label",
        revealed ? "Follow their story" : "Open your invitation",
      );
    });
  }

  // Dialogue beats and the original illustrated cast advance with native scroll.
  function animateStory(scene, progress) {
    const beats = [...scene.querySelectorAll(".dialogue-beat")];
    let spoken = 0;
    beats.forEach((line, i) => {
      if (progress >= Number(line.dataset.at)) spoken = i;
    });
    beats.forEach((line, i) => {
      line.classList.toggle("is-speaking", i === spoken);
      line.setAttribute("aria-hidden", String(i !== spoken));
    });
    scene.dataset.speaker = beats[spoken]?.dataset.speaker || "him";
    const w = innerWidth,
      h = stageHeight;
    const person = (
      who,
      x = 0,
      y = 0,
      opacity = 1,
      scale = 1,
      pose = "think",
      tilt = 0,
    ) => {
      const el = scene.querySelector(`.story-person.${who}`);
      if (!el) return;
      el.style.setProperty("--person-x", `${x.toFixed(2)}px`);
      el.style.setProperty("--person-y", `${y.toFixed(2)}px`);
      el.style.setProperty("--person-opacity", opacity.toFixed(3));
      el.style.setProperty("--person-scale", scale.toFixed(3));
      el.style.setProperty("--person-tilt", `${tilt.toFixed(2)}deg`);
      el.dataset.pose = pose;
    };
    const together = (opacity, scale, y) => {
      scene.style.setProperty("--together-opacity", opacity.toFixed(3));
      scene.style.setProperty("--together-scale", scale.toFixed(3));
      scene.style.setProperty("--together-y", `${y.toFixed(2)}px`);
    };
    if (scene.id === "beginning") {
      for (const [who, delay, direction] of [["man", 0, 1], ["woman", 0.025, -1]]) {
        const lower = ease((progress - delay) / 0.28);
        const land = ease((progress - 0.29 - delay) / 0.065);
        const el = scene.querySelector(`.story-person.${who}`);
        person(who);
        el.style.setProperty("--descent-y", `${(-(1 - lower) * h * 1.25).toFixed(2)}px`);
        el.style.setProperty("--descent-turn", `${(Math.sin(lower * Math.PI * 2) * 4 * direction * (1 - land)).toFixed(2)}deg`);
        el.style.setProperty("--landed", land.toFixed(4));
      }
      // Finish before the automatic endpoint; scroll positions round to pixels.
      const arrived = ease((progress - 0.385) / 0.025);
      scene.style.setProperty("--arrival-copy", arrived.toFixed(4));
      beats.forEach((line, i) => line.setAttribute("aria-hidden", String(arrived < 1 || i !== spoken)));
    }
    if (scene.id === "the-plan") {
      const board = ease((progress - 0.25) / 0.22);
      const fade = 1 - ease((progress - 0.36) / 0.11);
      person(
        "man",
        board * w * 0.10,
        -board * h * 0.31,
        fade,
        0.7 - board * 0.25,
        board > 0 ? "walk" : "think",
      );
      person(
        "woman",
        -board * w * 0.12,
        -board * h * 0.3,
        fade,
        0.7 - board * 0.25,
        board > 0 ? "walk" : "think",
      );
    }
    if (scene.id === "the-drive")
      scene.style.setProperty("--road-zoom", (1 + progress * 0.16).toFixed(3));
    if (scene.id === "arrival") {
      const step = ease((progress - 0.17) / 0.18);
      const joined = ease((progress - 0.34) / 0.07),
        walk = ease((progress - 0.42) / 0.26);
      const passage = ease((progress - 0.49) / 0.18);
      scene.style.setProperty("--passage-opacity", passage.toFixed(4));
      person("man", -(1 - step) * w * .1, -(1 - step) * h * .24, step * (1 - joined), .65, "walk");
      person("woman", -(1 - step) * w * .22, -(1 - step) * h * .24, step * (1 - joined), .65, "walk");
      together(
        joined,
        0.8 - walk * 0.49,
        -walk * h * 0.2 + passage * h * 0.12 + Math.sin(walk * Math.PI * 10) * 2,
      );
    }
    if (scene.id === "a-memory") {
      const gather = ease(progress / 0.22);
      const showPhoto = scene.dataset.photo
        ? scene.dataset.photo === "true"
        : progress > 0.54;
      const photo = showPhoto ? 1 : 0;
      scene.style.setProperty("--photo-opacity", photo);
      scene.style.setProperty("--photo-scale", showPhoto ? 1 : 0.85);
      scene.style.setProperty("--dialogue-opacity", 1 - photo);
      person(
        "man",
        (1 - gather) * -w * 0.1,
        0,
        1 - photo,
        1,
        gather < 1 ? "walk" : "think",
      );
      person(
        "woman",
        (1 - gather) * w * 0.1,
        0,
        1 - photo,
        1,
        gather < 1 ? "walk" : "think",
      );
      const button = scene.querySelector("#take-story-photo");
      button.setAttribute("aria-pressed", String(showPhoto));
      button.textContent = showPhoto
        ? "Back to the moment"
        : "Take their photo";
    }
    if (scene.id === "the-stage")
      together(1, 1 - progress * 0.12, -progress * h * 0.025);
    if (scene.id === "celebration") {
      const approach = ease((progress - 0.08) / 0.78);
      scene.style.setProperty("--garba-zoom", (1 + approach * 1.15).toFixed(4));
      scene.style.setProperty("--garba-dialogue-opacity", (1 - ease((progress - 0.42) / 0.14)).toFixed(4));
    }
    if (scene.id === "devotion")
      scene.style.setProperty(
        "--prayer-tilt",
        `${Math.sin(progress * Math.PI * 3) * 1.4}deg`,
      );
  }

  // One shared elephant survives the scene dissolves; only its surroundings change.
  function animateElephant(cursor) {
    const visible = cursor >= 3 && cursor < 5.72;
    elephantRide.hidden = !visible;
    elephantRide.setAttribute("aria-hidden", String(!visible));
    elephantRide.dataset.walking = String(visible && (
      cursor < 3.22 || (cursor > 3.5 && cursor < 5.08) || cursor > 5.38));
    if (!visible) return;
    const enter = ease((cursor - 3.02) / .20);
    const travel = ease((cursor - 3.52) / 1.55);
    const leave = ease((cursor - 5.38) / .32);
    const board = ease((cursor - 3.36) / .11);
    const dismount = ease((cursor - 5.17) / .18);
    elephantRide.style.setProperty("--ride-x", `${((1 - enter) * -innerWidth * 1.2 + travel * innerWidth * .05 + leave * innerWidth * 1.2).toFixed(2)}px`);
    elephantRide.style.setProperty("--ride-opacity", (1 - ease((cursor - 5.62) / .1)).toFixed(4));
    elephantRide.style.setProperty("--riders-opacity", (board * (1 - dismount)).toFixed(4));
    elephantRide.style.setProperty("--riders-y", `${(dismount * stageHeight * .13).toFixed(2)}px`);
  }

  function positionDialogue(scene) {
    const line = scene.querySelector(".dialogue-beat.is-speaking");
    if (!line) return;
    const her = line.dataset.speaker === "her";
    let target, xPart = 0.5, yPart = 0.08;
    if (scene.id === "the-invitation") {
      target = scene.querySelector(her ? ".handoff-woman" : ".handoff-man");
    } else if (scene.id === "devotion") {
      target = scene.querySelector(".aarti-art");
      xPart = her ? 0.72 : 0.27;
      yPart = her ? 0.1 : 0.02;
    } else if (scene.id === "celebration") {
      target = scene.querySelector(her ? ".garba-woman" : ".garba-man");
      yPart = 0.30;
    } else if (scene.id === "arrival" && !elephantRide.hidden &&
      Number(elephantRide.style.getPropertyValue("--riders-opacity")) > .4) {
      target = elephantRide.querySelector(".elephant-riders");
      xPart = her ? .32 : .72;
      yPart = .12;
    } else {
      const together = scene.querySelector(".together-art");
      if (together && Number(getComputedStyle(together).opacity) > 0.5) {
        target = together;
        xPart = her ? 0.72 : 0.28;
      } else target = scene.querySelector(her ? ".story-person.woman" : ".story-person.man");
    }
    if (!target) return;
    const bounds = target.getBoundingClientRect();
    const box = scene.getBoundingClientRect();
    const headX = bounds.left - box.left + bounds.width * xPart;
    const headY = bounds.top - box.top + bounds.height * yPart;
    const width = line.offsetWidth;
    const centre = clamp(headX, width / 2 + 12, box.width - width / 2 - 12);
    line.style.setProperty("--bubble-x", `${centre.toFixed(2)}px`);
    line.style.setProperty("--bubble-y", `${(headY - 12).toFixed(2)}px`);
    line.style.setProperty("--bubble-tip", `${clamp(headX - centre + width / 2, 14, width - 14).toFixed(2)}px`);
    line.style.setProperty("--speaker-visible", getComputedStyle(target).opacity);
  }
  // The moving circle keeps the small speech bubble attached between scroll events.
  document.querySelector("#celebration").addEventListener("garba-frame", (event) => {
    if (cinematic) positionDialogue(event.currentTarget);
  });
  function clearSceneState() {
    elephantRide.hidden = true;
    elephantRide.setAttribute("aria-hidden", "true");
    for (const scene of scenes) {
      scene.classList.remove("is-visible", "is-active");
      scene.inert = false;
      scene.removeAttribute("aria-hidden");
      scene
        .querySelectorAll(".dialogue-beat")
        .forEach((line) => { line.removeAttribute("aria-hidden"); line.removeAttribute("style"); });
      scene
        .querySelectorAll(".story-person")
        .forEach((person) => person.removeAttribute("style"));
      [
        "--together-opacity",
        "--together-scale",
        "--together-y",
        "--road-zoom",
        "--prayer-tilt",
        "--dialogue-opacity",
        "--arrival-copy",
        "--passage-opacity",
        "--garba-zoom",
        "--garba-dialogue-opacity",
      ].forEach((prop) => scene.style.removeProperty(prop));
    }
  }
  function measure() {
    stageHeight = stage.clientHeight || innerHeight;
    journeyTop = journey.getBoundingClientRect().top + scrollY;
    travel = Math.max(1, journey.offsetHeight - stageHeight);
  }
  function setMotion(preservePlace = false) {
    cancelEntry();
    const previous = activeIndex;
    const wasCinematic = cinematic;
    const wasWithin = scrollY < journeyTop + journey.offsetHeight;
    const finaleOffset = scrollY - (journeyTop + journey.offsetHeight);
    cinematic = !reduced.matches && innerHeight >= 640;
    root.classList.toggle("cinematic", cinematic);
    root.classList.toggle("read-mode", !cinematic);
    // Use a stable viewport height; mobile address-bar changes do not reshape the story.
    journey.style.setProperty(
      "--journey-height",
      `${storySpan * innerHeight * 1.32}px`,
    );
    clearSceneState();
    if (!cinematic) updateOpening(readingBoxOpen ? 1 : 0);
    measure();
    if (
      cinematic &&
      scenes.some(
        (s) => (s.querySelector(".scene-copy")?.scrollHeight || 0) > stageHeight - 180,
      )
    ) {
      cinematic = false; // Enlarged text is more important than pinned animation.
      root.classList.remove("cinematic");
      root.classList.add("read-mode");
      updateOpening(readingBoxOpen ? 1 : 0);
      measure();
    }
    openingSoundButton.hidden = !cinematic;
    if (preservePlace && wasCinematic !== cinematic) {
      const top = !wasWithin
        ? journeyTop + journey.offsetHeight + finaleOffset
        : cinematic
          ? journeyTop + (sceneStarts[previous] / storySpan) * travel
          : scenes[previous].getBoundingClientRect().top + scrollY;
      window.scrollTo({ top, behavior: "instant" });
    }
    renderScroll();
  }
  function renderScroll() {
    frame = 0;
    root.style.setProperty(
      "--progress",
      clamp(scrollY / Math.max(1, root.scrollHeight - innerHeight)).toFixed(5),
    );
    if (!cinematic) {
      let nearest = 0,
        distance = Infinity;
      scenes.forEach((s, i) => {
        const r = Math.abs(s.getBoundingClientRect().top);
        if (r < distance) {
          distance = r;
          nearest = i;
        }
      });
      activeIndex = nearest;
      return;
    }
    const cursor = clamp((scrollY - journeyTop) / travel) * storySpan;
    animateElephant(cursor);
    let base = scenes.length - 1;
    while (base > 0 && cursor < sceneStarts[base]) base--;
    const local = clamp((cursor - sceneStarts[base]) / sceneSpans[base]);
    const blend = base < scenes.length - 1 ? ease((local - 0.7) / 0.3) : 0;
    const selected = blend > 0.5 ? base + 1 : base;
    scenes.forEach((scene, i) => {
      const isBase = i === base;
      const isNext = i === base + 1 && blend > 0;
      const visible = isBase || isNext;
      const active = i === selected;
      scene.classList.toggle("is-visible", visible);
      scene.classList.toggle("is-active", active);
      scene.inert = !active;
      scene.setAttribute("aria-hidden", String(!active));
      if (i <= selected + 1)
        scene.querySelectorAll("img[loading=lazy]").forEach((img) => {
          img.loading = "eager";
        });
      if (!visible) return;
      const progress = isBase ? local : 0;
      animateStory(scene, progress);
      if (["partner-road", "the-invitation", "celebration"].includes(scene.id))
        scene.dispatchEvent(new CustomEvent("story-progress", { detail: progress }));
      scene.style.setProperty("--scene-opacity", isBase ? 1 : blend.toFixed(4));
      scene.style.setProperty(
        "--copy-opacity",
        isBase
          ? (1 - ease(blend * 2)).toFixed(4)
          : ease((blend - 0.45) / 0.55).toFixed(4),
      );
      scene.style.setProperty(
        "--copy-y",
        `${(isBase ? -blend * 18 : (1 - blend) * 18).toFixed(2)}px`,
      );
      scene.style.setProperty("--zoom", (1.035 + progress * 0.045).toFixed(4));
      scene.style.setProperty("--pan", `${(progress * -10).toFixed(2)}px`);
      if (scene === opening)
        updateOpening(
          ease((progress - 0.05) / 0.4),
          ease((progress - 0.24) / 0.6),
        );
    });
    scenes.filter((scene) => scene.classList.contains("is-visible")).forEach(positionDialogue);
    const photoButton = document.querySelector("#take-story-photo");
    if (photoButton) photoButton.disabled = false;
    if (focusStoryOnArrival && scenes[selected].id === "beginning") {
      focusStoryOnArrival = false;
      document.querySelector("#beginning-title").focus({ preventScroll: true });
    }
    activeIndex = selected;
    document.querySelector("#current-chapter").textContent =
      scenes[selected].dataset.label;
    stage.style.setProperty("--dust-y", `${(cursor * -9).toFixed(2)}px`);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(renderScroll);
  }
  // Re-anchor after responsive art and Gujarati fonts finish decoding/layout.
  document.addEventListener("load", (event) => {
    if (event.target instanceof HTMLImageElement) schedule();
  }, true);
  document.fonts?.ready.then(schedule);
  function scrollToScene(scene, behavior = "smooth") {
    cancelEntry();
    const index = scenes.indexOf(scene);
    const top = cinematic
      ? journeyTop + ((sceneStarts[index] + 0.06) / storySpan) * travel
      : scene.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top, behavior: reduced.matches ? "instant" : behavior });
  }
  document.querySelectorAll('a[href^="#"]').forEach((link) =>
    link.addEventListener("click", (event) => {
      const scene = scenes.find(
        (s) => `#${s.id}` === link.getAttribute("href"),
      );
      if (!scene) return;
      event.preventDefault();
      scrollToScene(scene);
    }),
  );
  openingButtons.forEach((button) => button.addEventListener("click", beginEntry));
  addEventListener("scroll", schedule, { passive: true });
  addEventListener(
    "resize",
    () => {
      if (
        innerWidth !== lastWidth ||
        Math.abs(innerHeight - lastHeight) > 180
      ) {
        lastWidth = innerWidth;
        lastHeight = innerHeight;
        setMotion(true);
      } else {
        measure();
        schedule();
      }
    },
    { passive: true },
  );
  reduced.addEventListener("change", () => setMotion(true));
  setMotion();
  document.fonts?.ready.then(() => {
    setMotion(true);
  });
  const hashScene = scenes.find((s) => `#${s.id}` === location.hash);
  if (hashScene)
    requestAnimationFrame(() => scrollToScene(hashScene, "instant"));
  addEventListener("hashchange", () => {
    const target = scenes.find((s) => `#${s.id}` === location.hash);
    if (target) scrollToScene(target, "instant");
  });
  document
    .querySelector("#take-story-photo")
    .addEventListener("click", (event) => {
      const button = event.currentTarget;
      const photoScene = document.querySelector("#a-memory");
      const show = button.getAttribute("aria-pressed") !== "true";
      photoScene.dataset.photo = String(show);
      button.setAttribute("aria-pressed", String(show));
      button.textContent = show ? "Back to the moment" : "Take their photo";
      schedule();
    });
  const music = document.querySelector("#music-panel");
  const host = music.querySelector(".player-host");
  let tracks,
    selection = 0,
    musicOpener;
  function stopMusic(restoreFocus = false) {
    ++selection;
    host.replaceChildren();
    music.hidden = true;
    document
      .querySelectorAll("[data-track]")
      .forEach((b) => b.setAttribute("aria-pressed", "false"));
    if (restoreFocus && musicOpener && !musicOpener.closest("[inert]"))
      musicOpener.focus({ preventScroll: true });
    else if (restoreFocus)
      document.querySelector(".header-link").focus({ preventScroll: true });
  }
  async function playTrack(key, button) {
    stopDoorSound();
    const token = ++selection;
    musicOpener = button.closest("#music-panel") ? musicOpener : button;
    try {
      if (!tracks) {
        const response = await fetch("story-audio.json");
        if (!response.ok) throw Error("Music configuration unavailable");
        tracks = await response.json();
      }
      if (token !== selection) return;
      const track = tracks[key];
      if (!track || !/^[\w-]{11}$/.test(track.youtube))
        throw Error("Invalid track");
      host.replaceChildren();
      const iframe = document.createElement("iframe");
      iframe.title = `${track.title} — ${track.credit}`;
      iframe.allow = "autoplay; encrypted-media; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.src = `https://www.youtube-nocookie.com/embed/${track.youtube}?autoplay=1&rel=0&playsinline=1`;
      host.append(iframe);
      music.querySelector(".track-credit").textContent =
        `${track.title} · ${track.credit}`;
      document.querySelector("#youtube-source").href =
        `https://www.youtube.com/watch?v=${track.youtube}`;
      document
        .querySelectorAll("[data-track]")
        .forEach((b) =>
          b.setAttribute("aria-pressed", String(b.dataset.track === key)),
        );
      music.hidden = false;
      document.querySelector("#close-music").focus({ preventScroll: true });
    } catch {
      notify("Music could not load. Please try again when you’re connected.");
    }
  }
  document.querySelectorAll("[data-track]").forEach((b) => {
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => playTrack(b.dataset.track, b));
  });
  document
    .querySelector("#close-music")
    .addEventListener("click", () => stopMusic(true));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !music.hidden) {
      stopMusic(true);
      event.preventDefault();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelEntry();
      stopMusic();
    }
  });
  addEventListener("pagehide", () => {
    stopMusic();
  });
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog
      .querySelector("[data-close]")
      .addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    });
  });

  document
    .querySelector("#share-invitation")
    .addEventListener("click", async () => {
      const url = location.origin + location.pathname;
      const data = {
        title: "The Garba Experience",
        text: "Join me for an evening with Kinjal Dave. 9 October 2026 · 7:30 pm onwards · Ahmedabad.",
        url,
      };
      try {
        if (navigator.share) await navigator.share(data);
        else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          notify("Invitation link copied. See you in the circle.");
        } else {
          window.prompt("Copy the invitation link:", url);
        }
      } catch (error) {
        if (error.name !== "AbortError")
          notify(
            "Sharing is unavailable. You can copy the address from your browser.",
          );
      }
    });

  // Local-only photo keepsake: no upload, camera access, account or storage service.
  const memory = document.querySelector("#memory-dialog");
  const canvas = document.querySelector("#memory-canvas");
  const context = canvas.getContext("2d");
  const download = document.querySelector("#download-memory");
  const status = document.querySelector("#memory-status");
  const initialMemoryStatus = status.textContent;
  let photoVersion = 0;
  let downloadUrl;
  document
    .querySelector("#make-memory")
    .addEventListener("click", () => memory.showModal());
  document
    .querySelector("#memory-photo")
    .addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const version = ++photoVersion;
      download.hidden = true;
      canvas.classList.remove("has-photo");
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        status.textContent = "Please choose a JPG, PNG or WebP photo.";
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        status.textContent = "Please choose a photo smaller than 20 MB.";
        return;
      }
      status.textContent = "Creating your keepsake…";
      let photo;
      try {
        photo = await createImageBitmap(file);
        await document.fonts.ready;
        if (version !== photoVersion) return;
        const w = 1080,
          h = 1350;
        context.fillStyle = "#183b31";
        context.fillRect(0, 0, w, h);
        context.strokeStyle = "#c7a66b";
        context.lineWidth = 2;
        context.strokeRect(28, 28, w - 56, h - 56);
        context.strokeRect(39, 39, w - 78, h - 78);
        context.fillStyle = "#eadbb6";
        context.textAlign = "center";
        context.font = "22px Manrope, Arial";
        context.fillText("THE GARBA EXPERIENCE", w / 2, 105);
        const x = 80,
          y = 150,
          pw = 920,
          ph = 900;
        const scale = Math.max(pw / photo.width, ph / photo.height);
        context.save();
        context.beginPath();
        context.rect(x, y, pw, ph);
        context.clip();
        context.drawImage(
          photo,
          x + (pw - photo.width * scale) / 2,
          y + (ph - photo.height * scale) / 2,
          photo.width * scale,
          photo.height * scale,
        );
        context.restore();
        context.font = 'italic 68px "Cormorant Garamond", Georgia';
        context.fillText("Our night to remember.", w / 2, 1160);
        context.font = "20px Manrope, Arial";
        context.fillText("AHMEDABAD  ·  09 OCTOBER 2026", w / 2, 1224);
        context.font = "17px Manrope, Arial";
        context.fillText("Devotion. Rhythm. Togetherness.", w / 2, 1270);
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
        if (version !== photoVersion) return;
        if (!blob) throw new Error("Canvas export failed");
        if (downloadUrl) URL.revokeObjectURL(downloadUrl);
        downloadUrl = URL.createObjectURL(blob);
        download.href = downloadUrl;
        download.hidden = false;
        canvas.classList.add("has-photo");
        status.textContent =
          "Your keepsake is ready. Save it to share with your friends.";
      } catch {
        if (version === photoVersion)
          status.textContent =
            "That photo could not be opened. Please try another JPG, PNG or WebP.";
      } finally {
        photo?.close();
      }
    });
  function resetReloadState() {
    cancelEntry();
    openingSoundEnabled = true;
    openingSoundButton.setAttribute("aria-pressed", "true");
    openingSoundButton.textContent = "Opening sound on";
    stopMusic();
    document
      .querySelectorAll("dialog[open]")
      .forEach((dialog) => dialog.close());
    document.querySelectorAll("details[open]").forEach((details) => {
      details.open = false;
    });
    document.activeElement?.blur();
    clearTimeout(toastTimer);
    toast.classList.remove("visible");
    readingBoxOpen = false;
    focusStoryOnArrival = false;
    const photoScene = document.querySelector("#a-memory");
    delete photoScene.dataset.photo;
    photoScene.style.setProperty("--photo-opacity", "0");
    photoScene.style.setProperty("--photo-scale", "0.85");
    photoScene.style.setProperty("--dialogue-opacity", "1");
    const photoButton = document.querySelector("#take-story-photo");
    photoButton.setAttribute("aria-pressed", "false");
    photoButton.textContent = "Take their photo";
    ++photoVersion; // Ignore any photo processing that was still pending.
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = undefined;
    download.removeAttribute("href");
    download.hidden = true;
    document.querySelector("#memory-photo").value = "";
    canvas.classList.remove("has-photo");
    canvas.width = canvas.width;
    status.textContent = initialMemoryStatus;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setMotion();
    updateOpening(0);
  }
  // Reset immediately, then again after the browser restores form/page state.
  if (isReload) resetReloadState();
  addEventListener("pageshow", (event) => {
    if (isReload && !event.persisted) resetReloadState();
  });

  // Retire older cache-first versions without caching personal photos.
  if ("serviceWorker" in navigator)
    navigator.serviceWorker.register("sw.js").catch(() => {});
})();
