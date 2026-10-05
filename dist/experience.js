/* A scroll-driven film with continuous manual dialogue slowdowns. Every scene remains readable without JavaScript. */
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
  let arrivalFloor = { baseFeet: 0, planeHeight: 1 };
  let lastWidth = innerWidth;
  let lastHeight = innerHeight;
  const opening = document.querySelector(".opening-scene");
  const openingButtons = [
    ...document.querySelectorAll("[data-open-invitation]"),
  ];
  const sealButton = document.querySelector("#invitation-seal");
  let readingBoxOpen = false;
  let entryUnlocked = false;
  let entryHasAdvanced = false;
  let focusStoryOnArrival = false;
  // One user gesture runs the doors and camera move on a deliberate timeline.
  const openingSoundButton = document.querySelector("#opening-sound");
  const soundtrack = window.garbaSoundtrack;
  let entryFrame = 0;
  const autoScrollButton = document.querySelector("#autoscroll-toggle");
  const timeline = window.garbaTimeline;
  let autoScrolling = false, autoScrollFrame = 0;
  let autoStarted = 0, autoOffset = 0, autoElapsed = 0, autoLastPosition = -1;
  function autoPosition(cursor) {
    const end = Math.max(0, root.scrollHeight - innerHeight);
    const storyEnd = cinematic ? journeyTop + travel
      : document.querySelector(".finale").getBoundingClientRect().top + scrollY;
    if (cursor >= storySpan)
      return Math.min(end, storyEnd + (end - storyEnd) * (cursor - storySpan));
    if (cinematic) return journeyTop + cursor / storySpan * travel;
    let index = scenes.length - 1;
    while (index > 0 && cursor < sceneStarts[index]) index--;
    const from = scenes[index].getBoundingClientRect().top + scrollY;
    const to = index + 1 < scenes.length
      ? scenes[index + 1].getBoundingClientRect().top + scrollY : storyEnd;
    return Math.min(end, from + (to - from) * (cursor - sceneStarts[index]) / sceneSpans[index]);
  }
  function autoTimeAtPosition(position) {
    // Monotonic mapping also supports normal-flow / reduced-motion layouts.
    let low = 0, high = storySpan + 1;
    for (let i = 0; i < 40; i++) {
      const middle = (low + high) / 2;
      if (autoPosition(middle) < position) low = middle; else high = middle;
    }
    return timeline.timeAt((low + high) / 2);
  }
  function updateAutoScrollButton() {
    autoScrollButton.setAttribute("aria-pressed", String(autoScrolling));
    autoScrollButton.setAttribute("aria-label", autoScrolling ? "Pause automatic scrolling" : "Start automatic scrolling");
    autoScrollButton.querySelector(".control-label").textContent = autoScrolling ? "Pause" : "Autoscroll";
    autoScrollButton.querySelector("use").setAttribute("href", `assets/ui-icons.svg#${autoScrolling ? "pause" : "play"}`);
  }
  function stopAutoScroll() {
    if (autoScrolling) delete opening.dataset.entering;
    autoScrolling = false;
    cancelAnimationFrame(autoScrollFrame);
    autoScrollFrame = 0;
    updateAutoScrollButton();
  }
  function advanceAutoScroll(now) {
    if (!autoScrolling) return;
    if (document.hidden || document.querySelector("dialog[open]")) { stopAutoScroll(); return; }
    // Absolute elapsed time: a dropped rendering frame cannot lengthen the journey.
    autoElapsed = Math.min(timeline.duration, autoOffset + Math.max(0, now - autoStarted) / 1000);
    if (autoElapsed < timeline.openingDuration && cinematic) opening.dataset.entering = "true";
    else delete opening.dataset.entering;
    window.scrollTo({ top: autoPosition(timeline.cursorAt(autoElapsed)), behavior: "instant" });
    autoLastPosition = scrollY;
    if (autoElapsed >= timeline.duration) { stopAutoScroll(); return; }
    autoScrollFrame = requestAnimationFrame(advanceAutoScroll);
  }
  autoScrollButton.hidden = false;
  autoScrollButton.addEventListener("click", () => {
    cancelManualScroll();
    if (autoScrolling) { stopAutoScroll(); return; }
    if (document.querySelector("dialog[open]")) return;
    const fresh = !entryUnlocked || scrollY <= journeyTop;
    if (entryFrame) { cancelAnimationFrame(entryFrame); entryFrame = 0; }
    if (fresh) {
      entryUnlocked = true;
      readingBoxOpen = true;
      root.classList.remove("invitation-locked");
      soundtrack?.begin(cinematic);
      if (!cinematic) updateOpening(1);
      focusStoryOnArrival = cinematic;
    }
    if (scrollY >= root.scrollHeight - innerHeight - 1) return;
    autoOffset = fresh ? 0 : Math.abs(scrollY - autoLastPosition) <= 2
      ? autoElapsed : autoTimeAtPosition(scrollY);
    autoScrolling = true;
    autoStarted = performance.now();
    if (autoOffset < timeline.openingDuration && cinematic) opening.dataset.entering = "true";
    updateAutoScrollButton();
    autoScrollFrame = requestAnimationFrame(advanceAutoScroll);
  });
  const scrollControl = target => target?.closest?.("#autoscroll-toggle, #soundtrack-toggle, #opening-sound");
  addEventListener("wheel", stopAutoScroll, { passive:true });
  addEventListener("touchstart", event => { if (!scrollControl(event.target)) stopAutoScroll(); }, { passive:true });
  document.addEventListener("pointerdown", event => { if (!scrollControl(event.target)) stopAutoScroll(); }, { passive:true });
  document.addEventListener("keydown", event => {
    const activatesControl = event.key === " " && scrollControl(event.target);
    if (event.key === "Escape" || (!activatesControl && ["ArrowUp","ArrowDown","PageUp","PageDown","Home","End"," "].includes(event.key))) stopAutoScroll();
  });
  document.addEventListener("click", event => {
    if (event.target.closest?.("a,button,input,select,textarea") && !scrollControl(event.target)) stopAutoScroll();
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopAutoScroll(); });
  addEventListener("pagehide", stopAutoScroll);
  // Manual input stays continuous, with eased reading zones around each dialogue.
  // Autoscroll has its own timeline and never uses this speed profile.
  let manualFrame = 0, manualTarget = 0, manualPosition = 0, manualLast = 0;
  let touchY = null;
  const dialogueBeats = scenes.flatMap((scene, index) =>
    [...scene.querySelectorAll(".dialogue-beat")].map(line => {
      const beat = Number(line.dataset.at) || 0;
      const local = scene.id === "beginning" && beat === 0 ? .42 : Math.max(.06, beat + .015);
      return { line, cursor: sceneStarts[index] + local * sceneSpans[index] };
    }));
  function stopManualMotion() {
    cancelAnimationFrame(manualFrame);
    manualFrame = 0;
  }
  function cancelManualScroll() {
    stopManualMotion();
  }
  function dialogueCenters() {
    return dialogueBeats.map(({ line, cursor }) => cinematic
      ? journeyTop + cursor / storySpan * travel
      : Math.max(0, line.getBoundingClientRect().top + scrollY - innerHeight * .35));
  }
  function dialogueSpeed(position, centers) {
    const radius = clamp(innerHeight * .26, 160, 260);
    const distance = Math.min(...centers.map(center => Math.abs(position - center)));
    // Smoothstep joins the ordinary speed without a sudden brake or a full stop.
    return .22 + .78 * ease(distance / radius);
  }
  function advanceManualScroll(now) {
    manualFrame = 0;
    if (autoScrolling || entryFrame || document.hidden || document.querySelector("dialog[open]")) {
      cancelManualScroll(); return;
    }
    const direction = Math.sign(manualTarget - manualPosition);
    const factor = dialogueSpeed(manualPosition, dialogueCenters());
    const speed = clamp(innerHeight * 1.6, 800, 1600) * factor;
    // Keep the remaining coast short even when a fast gesture enters a slow zone.
    const remaining = Math.min(Math.abs(manualTarget - manualPosition), Math.min(700, innerHeight * .85) * factor);
    manualTarget = manualPosition + direction * remaining;
    // A same-frame input can arrive after the RAF timestamp; never step backwards.
    const step = Math.min(64, Math.max(0, now - manualLast)) / 1000 * speed;
    manualLast = now;
    manualPosition += direction * Math.min(remaining, step);
    window.scrollTo({ top: manualPosition, behavior: "instant" });
    if (Math.abs(manualTarget - manualPosition) > .5) manualFrame = requestAnimationFrame(advanceManualScroll);
  }
  function manualScroll(delta) {
    if (!delta || (cinematic && !entryUnlocked)) return;
    const now = performance.now();
    if (!manualFrame) { manualPosition = scrollY; manualTarget = scrollY; }
    const budget = Math.min(700, innerHeight * .85);
    const amount = clamp(delta * 1.5, -budget, budget);
    if (Math.sign(amount) !== Math.sign(manualTarget - manualPosition)) manualTarget = manualPosition;
    manualTarget = clamp(manualTarget + amount, Math.max(0, manualPosition - budget),
      Math.min(root.scrollHeight - innerHeight, manualPosition + budget));
    if (reduced.matches) {
      // Immediate, spatially weighted steps: no animated coast and no dialogue lock.
      // Sampling along the path prevents a large key/wheel event jumping a slow zone.
      const centers = dialogueCenters(), direction = Math.sign(manualTarget - manualPosition);
      let input = Math.abs(manualTarget - manualPosition);
      while (input > 0) {
        const step = Math.min(input, 16);
        manualPosition += direction * step * dialogueSpeed(manualPosition, centers);
        input -= step;
      }
      window.scrollTo({ top: manualPosition, behavior: "instant" });
    } else if (!manualFrame) {
      manualLast = now;
      manualFrame = requestAnimationFrame(advanceManualScroll);
    }
  }
  const localScrollTarget = target => target?.closest?.("dialog, input, textarea, select, [contenteditable=true], iframe");
  addEventListener("wheel", event => {
    if (event.ctrlKey || event.metaKey || localScrollTarget(event.target) || document.querySelector("dialog[open]") || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    manualScroll(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1));
  }, { passive:false });
  addEventListener("touchstart", event => {
    stopManualMotion();
    touchY = event.touches?.length === 1 && !localScrollTarget(event.target) && !scrollControl(event.target) ? event.touches[0].clientY : null;
  }, { passive:true });
  addEventListener("touchmove", event => {
    if (event.touches.length !== 1) { touchY = null; stopManualMotion(); return; }
    if (touchY === null || document.querySelector("dialog[open]")) return;
    const y = event.touches[0].clientY, delta = touchY - y;
    touchY = y;
    // The cinematic stage owns vertical swipes through touch-action. WebKit may
    // mark those moves non-cancelable; they still carry the finger's movement.
    if (event.cancelable) event.preventDefault();
    else if (!cinematic || !stage.contains(event.target)) return;
    manualScroll(delta * 2);
  }, { passive:false });
  for (const name of ["touchend", "touchcancel"]) addEventListener(name, () => { touchY = null; }, { passive:true });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") { cancelManualScroll(); return; }
    if (event.ctrlKey || event.metaKey || event.altKey || localScrollTarget(event.target) || document.querySelector("dialog[open]")) return;
    if ([" ", "Enter"].includes(event.key) && event.target.closest?.("button,a,summary")) return;
    const direction = { ArrowDown:1, PageDown:1, End:1, ArrowUp:-1, PageUp:-1, Home:-1, " ":event.shiftKey ? -1 : 1 }[event.key];
    if (!direction) return;
    event.preventDefault();
    manualScroll(direction * (event.key.startsWith("Arrow") ? 48 : 640));
  });
  document.addEventListener("pointerdown", () => stopManualMotion(), { passive:true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelManualScroll(); });
  addEventListener("pagehide", cancelManualScroll);
  function cancelEntry() {
    if (entryFrame) cancelAnimationFrame(entryFrame);
    entryFrame = 0;
    delete opening.dataset.entering;
    focusStoryOnArrival = false;
    soundtrack?.cancelIntro();
  }
  function beginEntry() {
    cancelManualScroll();
    if (entryFrame) return;
    entryUnlocked = true;
    root.classList.remove("invitation-locked");
    soundtrack?.begin(cinematic);
    if (!cinematic) {
      readingBoxOpen = true;
      updateOpening(1);
      scrollToScene(document.querySelector("#beginning"), "instant");
      document.querySelector("#beginning-title").focus({ preventScroll: true });
      return;
    }
    const from = scrollY;
    const to = journeyTop + (1.42 / storySpan) * travel;
    const doorDuration = 2900, descentDuration = 3800;
    let lastEntryTime = performance.now(), elapsed = 0;
    opening.dataset.entering = "true";
    focusStoryOnArrival = true;
    const advance = (now) => {
      // The logo-only entry also adds a second to each opening phase.
      elapsed += now - lastEntryTime;
      lastEntryTime = now;
      const doorTime = clamp(elapsed / doorDuration);
      // Finish the original door/camera move, then lower the friends on silk.
      const progress = elapsed <= doorDuration
        ? doorTime < 0.66
          ? 0.48 * ease(doorTime / 0.66)
          : 0.48 + 0.52 * ease((doorTime - 0.66) / 0.34)
        : 1 + 0.42 * clamp((elapsed - doorDuration) / descentDuration);
      window.scrollTo({ top: from + (to - from) * progress / 1.42, behavior: "instant" });
      if (elapsed < doorDuration + descentDuration) entryFrame = requestAnimationFrame(advance);
      else {
        entryFrame = 0;
        delete opening.dataset.entering;
      }
    };
    entryFrame = requestAnimationFrame(advance);
  }
  openingSoundButton.hidden = false;
  for (const event of ["wheel", "touchstart"])
    addEventListener(event, (input) => {
      if (input.type === "touchstart" && scrollControl(input.target)) return;
      if (entryFrame) cancelEntry();
    }, { passive: true });
  addEventListener("pagehide", cancelEntry);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && entryFrame) cancelEntry();
    opening.querySelector(".seal-prompt").style.animationPlayState = document.hidden ? "paused" : "running";
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === " " && scrollControl(event.target)) return;
    if (entryFrame && ["Escape", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) cancelEntry();
  });
  document.addEventListener("pointerdown", (event) => {
    if (entryFrame && !event.target.closest?.("#invitation-seal, #opening-sound, #soundtrack-toggle, #autoscroll-toggle")) cancelEntry();
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
        // Continue into the passage until the scene dissolves.
        walk = clamp((progress - 0.41) / 0.59);
      const passage = ease((progress - 0.74) / 0.16);
      scene.style.setProperty("--passage-opacity", passage.toFixed(4));
      person("man", -(1 - step) * w * .1, -(1 - step) * h * .24, step * (1 - joined), .65, "walk");
      person("woman", -(1 - step) * w * .22, -(1 - step) * h * .24, step * (1 - joined), .65, "walk");
      // Follow the center carpet in image space, accounting for cover cropping.
      // The far floor sits below the doorway; a viewport-only path lifted the
      // friends into the backdrop. Keep moving until the dissolve completes.
      const floorY = h / 2 + arrivalFloor.planeHeight * .19 * (1.035 + progress * .045);
      together(joined, 0.8 - walk * 0.49, walk * (floorY - arrivalFloor.baseFeet));
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
      button.querySelector(".control-label").textContent = showPhoto
        ? "Back to the moment"
        : "Take their photo";
    }
    if (scene.id === "the-stage")
      together(1, 1 - progress * 0.12, -progress * h * 0.025);
    if (scene.id === "celebration") {
      const approach = ease((progress - 0.08) / 0.78);
      scene.style.setProperty("--garba-zoom", (1 + approach * 1.15).toFixed(4));
    }
    if (scene.id === "devotion")
      scene.style.setProperty(
        "--prayer-tilt",
        `${Math.sin(progress * Math.PI * 3) * 1.4}deg`,
      );
  }

  // One shared elephant survives the scene dissolves; only its surroundings change.
  function animateElephant(cursor) {
    const visible = cursor >= 3 && cursor < 5.58;
    elephantRide.hidden = !visible;
    elephantRide.setAttribute("aria-hidden", String(!visible));
    elephantRide.dataset.walking = String(visible && (
      cursor < 3.22 || (cursor > 3.5 && cursor < 5.08) || cursor > 5.38));
    if (!visible) return;
    const enter = ease((cursor - 3.02) / .20);
    const travel = ease((cursor - 3.52) / 1.55);
    const leave = ease((cursor - 5.38) / .18);
    const board = ease((cursor - 3.36) / .11);
    const dismount = ease((cursor - 5.17) / .18);
    elephantRide.style.setProperty("--ride-x", `${((1 - enter) * -innerWidth * 1.2 + travel * innerWidth * .05 + leave * innerWidth * 1.2).toFixed(2)}px`);
    elephantRide.style.setProperty("--ride-opacity", (1 - ease((cursor - 5.54) / .04)).toFixed(4));
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
    let bubbleY = headY - 12;
    // The shared elephant is above the scene's stacking context. Keep the
    // arrival bubble and its tail physically clear while the elephant exits.
    if (scene.id === "arrival" && !elephantRide.hidden) {
      const ride = elephantRide.getBoundingClientRect();
      const left = box.left + centre - width / 2;
      if (ride.right > left && ride.left < left + width)
        bubbleY = Math.min(bubbleY, ride.top - box.top - 16);
    }
    line.style.setProperty("--bubble-x", `${centre.toFixed(2)}px`);
    line.style.setProperty("--bubble-y", `${bubbleY.toFixed(2)}px`);
    line.style.setProperty("--bubble-tip", `${clamp(headX - centre + width / 2, 14, width - 14).toFixed(2)}px`);
    line.style.setProperty("--speaker-visible", getComputedStyle(target).opacity);
    if (scene.id === "the-invitation") fitInvitationLogo(scene);
  }
  function fitInvitationLogo(scene) {
    const mobile = innerWidth <= 650;
    const svg = scene.querySelector(mobile ? ".wall-brand-mobile" : ".wall-brand-desktop");
    const logo = svg.querySelector("image");
    const matrix = svg.getScreenCTM?.();
    if (!matrix) return;
    const upper = scene.querySelector(".story-title").getBoundingClientRect().bottom + (!mobile && innerHeight <= 800 ? 22 : 30);
    const lower = Math.min(...[...scene.querySelectorAll(".dialogue-beat")].map(beat => {
      const person = scene.querySelector(beat.dataset.speaker === "her" ? ".handoff-woman" : ".handoff-man");
      const head = person.getBoundingClientRect();
      return head.top + head.height * .08 - 12 - beat.offsetHeight;
    })) - 12;
    const preferred = new DOMPoint(mobile ? 512 : 768, mobile ? 465 : 370).matrixTransform(matrix);
    const ratio = mobile ? 230 / 157 : 152 / 104;
    const height = Math.max(0, Math.min((mobile ? 157 : 104) * matrix.d, lower - upper));
    const top = clamp(preferred.y, upper, Math.max(upper, lower - height));
    const point = new DOMPoint(preferred.x, top).matrixTransform(matrix.inverse());
    const artHeight = height / matrix.d;
    logo.style.setProperty("x", `${point.x - artHeight * ratio / 2}px`);
    logo.style.setProperty("y", `${point.y}px`);
    logo.style.setProperty("width", `${artHeight * ratio}px`);
    logo.style.setProperty("height", `${artHeight}px`);
  }
  function clearSceneState() {
    document.querySelectorAll(".invitation-wall-branding image").forEach(logo => logo.removeAttribute("style"));
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
      ].forEach((prop) => scene.style.removeProperty(prop));
    }
  }
  function measure() {
    stageHeight = stage.clientHeight || innerHeight;
    journeyTop = journey.getBoundingClientRect().top + scrollY;
    travel = Math.max(1, journey.offsetHeight - stageHeight);
    const arrival = document.querySelector("#arrival");
    const friends = arrival.querySelector(".together-art");
    const art = arrival.querySelector(".entry-passage-art img");
    // Read geometry only on layout changes, never on each animation frame.
    arrivalFloor = {
      baseFeet: friends.offsetTop + friends.offsetHeight * .95,
      planeHeight: Math.max(stageHeight, arrival.clientWidth * Number(art.getAttribute("height")) / Number(art.getAttribute("width"))),
    };
  }
  function setMotion(preservePlace = false) {
    cancelManualScroll();
    stopAutoScroll();
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
    root.classList.toggle("invitation-locked", cinematic && !entryUnlocked);
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
    // Wheel, touch, keyboard and restored scroll positions cannot open a sealed box.
    if (cinematic) {
      if (entryUnlocked && entryHasAdvanced && !entryFrame && !autoScrolling && scrollY <= journeyTop) {
        entryUnlocked = false;
        entryHasAdvanced = false;
        soundtrack?.reset();
      }
      root.classList.toggle("invitation-locked", !entryUnlocked);
      if (!entryUnlocked && scrollY !== journeyTop)
        window.scrollTo({ top: journeyTop, behavior: "instant" });
    }
    root.style.setProperty(
      "--progress",
      clamp(scrollY / Math.max(1, root.scrollHeight - innerHeight)).toFixed(5),
    );
    if (!cinematic) {
      soundtrack?.setScene(1.42);
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
    if (entryUnlocked) soundtrack?.setScene(cursor);
    if (entryUnlocked && cursor > .05) entryHasAdvanced = true;
    animateElephant(cursor);
    let base = scenes.length - 1;
    while (base > 0 && cursor < sceneStarts[base]) base--;
    const local = clamp((cursor - sceneStarts[base]) / sceneSpans[base]);
    const fadeAt = scenes[base].id === "arrival" ? .96 : scenes[base].id === "a-memory" ? .90 : .70;
    const blend = base < scenes.length - 1 ? ease((local - fadeAt) / (1 - fadeAt)) : 0;
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
    cancelManualScroll();
    stopAutoScroll();
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
        (innerHeight >= 640) !== (lastHeight >= 640) ||
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
      button.querySelector(".control-label").textContent = show ? "Back to the moment" : "Take their photo";
      schedule();
    });
  const invitationViewer = document.querySelector("#original-invitation-dialog");
  let invitationOpener, invitationScroll = 0;
  document.querySelectorAll("[data-view-original]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      cancelEntry();
      invitationOpener = link;
      invitationScroll = scrollY;
      invitationViewer.showModal();
    });
  });
  invitationViewer.addEventListener("close", () => {
    window.scrollTo({ top: invitationScroll, behavior: "instant" });
    invitationOpener?.focus({ preventScroll: true });
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
    cancelManualScroll();
    stopAutoScroll();
    soundtrack?.reset();
    cancelEntry();
    document
      .querySelectorAll("dialog[open]")
      .forEach((dialog) => dialog.close());
    document.querySelectorAll("details[open]").forEach((details) => {
      details.open = false;
    });
    document.activeElement?.blur();
    clearTimeout(toastTimer);
    toast.classList.remove("visible");
    autoElapsed = autoOffset = 0;
    autoLastPosition = -1;
    readingBoxOpen = false;
    entryUnlocked = false;
    entryHasAdvanced = false;
    focusStoryOnArrival = false;
    const photoScene = document.querySelector("#a-memory");
    delete photoScene.dataset.photo;
    photoScene.style.setProperty("--photo-opacity", "0");
    photoScene.style.setProperty("--photo-scale", "0.85");
    photoScene.style.setProperty("--dialogue-opacity", "1");
    const photoButton = document.querySelector("#take-story-photo");
    photoButton.setAttribute("aria-pressed", "false");
    photoButton.querySelector(".control-label").textContent = "Take their photo";
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
