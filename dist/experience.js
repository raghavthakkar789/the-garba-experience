/* A continuous, native-scroll film. Every scene remains readable without JavaScript. */
(() => {
  "use strict";
  const root = document.documentElement;
  const journey = document.querySelector(".journey");
  const stage = document.querySelector(".journey-stage");
  const scenes = [...document.querySelectorAll(".scene")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const motionButton = document.querySelector("#motion-toggle");
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
  let manualRead = false;
  let cinematic = false;
  let activeIndex = 0;
  let journeyTop = 0;
  let travel = 1;
  let stageHeight = 1;
  let lastWidth = innerWidth;
  let lastHeight = innerHeight;
  let soundScene = "welcome";
  function clearSceneState() {
    for (const scene of scenes) {
      scene.classList.remove("is-visible", "is-active");
      scene.inert = false;
      scene.removeAttribute("aria-hidden");
    }
  }
  function measure() {
    stageHeight = stage.clientHeight || innerHeight;
    journeyTop = journey.getBoundingClientRect().top + scrollY;
    travel = Math.max(1, journey.offsetHeight - stageHeight);
  }
  function setMotion(preservePlace = false) {
    const previous = activeIndex;
    let oversizedCopy = false;
    const wasCinematic = cinematic;
    const wasWithin = scrollY < journeyTop + journey.offsetHeight;
    const finaleOffset = scrollY - (journeyTop + journey.offsetHeight);
    cinematic = !manualRead && !reduced.matches && innerHeight >= 640;
    root.classList.toggle("cinematic", cinematic);
    root.classList.toggle("read-mode", !cinematic);
    // Use a stable viewport height; mobile address-bar changes do not reshape the story.
    journey.style.setProperty(
      "--journey-height",
      `${scenes.length * innerHeight * 1.32}px`,
    );
    clearSceneState();
    measure();
    if (
      cinematic &&
      scenes.some(
        (s) => s.querySelector(".scene-copy").scrollHeight > stageHeight - 180,
      )
    ) {
      oversizedCopy = true;
      cinematic = false; // Enlarged text is more important than pinned animation.
      root.classList.remove("cinematic");
      root.classList.add("read-mode");
      measure();
    }
    motionButton.hidden = false;
    motionButton.textContent = cinematic
      ? "Read without animation"
      : "Play scroll animation";
    motionButton.setAttribute("aria-pressed", String(!cinematic));
    motionButton.disabled =
      reduced.matches || innerHeight < 640 || oversizedCopy;
    if (motionButton.disabled) motionButton.textContent = "Reading mode";
    if (preservePlace && wasCinematic !== cinematic) {
      const top = !wasWithin
        ? journeyTop + journey.offsetHeight + finaleOffset
        : cinematic
          ? journeyTop + (previous / scenes.length) * travel
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
      soundScene = scenes[nearest].dataset.sound;
      return;
    }
    const cursor = clamp((scrollY - journeyTop) / travel) * scenes.length;
    const base = Math.min(scenes.length - 1, Math.floor(cursor));
    const local = Math.min(1, cursor - base);
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
      scene.style.setProperty("--scene-opacity", isBase ? 1 : blend.toFixed(4));
      scene.style.setProperty(
        "--copy-opacity",
        isBase ? (1 - blend).toFixed(4) : 1,
      );
      scene.style.setProperty(
        "--copy-y",
        `${(isBase ? -blend * 18 : (1 - blend) * 18).toFixed(2)}px`,
      );
      scene.style.setProperty("--zoom", (1.035 + progress * 0.045).toFixed(4));
      scene.style.setProperty("--pan", `${(progress * -10).toFixed(2)}px`);
      if (scene.id === "invitation") {
        const open = ease((progress - 0.05) / 0.52);
        scene.style.setProperty("--open", open.toFixed(4));
        scene.style.setProperty("--seal", (1 - clamp(open * 4)).toFixed(4));
        scene.style.setProperty(
          "--hamper-scale",
          (1 + progress * 0.025).toFixed(4),
        );
      }
    });
    activeIndex = selected;
    soundScene = scenes[selected].dataset.sound;
    document.querySelector("#current-chapter").textContent =
      scenes[selected].dataset.label;
    stage.style.setProperty("--dust-y", `${(cursor * -9).toFixed(2)}px`);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(renderScroll);
  }
  function scrollToScene(scene, behavior = "smooth") {
    const index = scenes.indexOf(scene);
    const top = cinematic
      ? journeyTop + ((index + 0.06) / scenes.length) * travel
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
  motionButton.addEventListener("click", () => {
    manualRead = !manualRead;
    setMotion(true);
  });
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
  // Warm original ambient sound. No recording, network request or audio starts on page load.
  const soundToggle = document.querySelector("#sound-toggle");
  const soundLabel = document.querySelector("#sound-label");
  const volume = document.querySelector("#sound-volume");
  let audioContext,
    master,
    timer,
    nextBeat = 0,
    beat = 0,
    soundEnabled = false;
  let audioSession = 0;
  const pitches = [220, 261.63, 293.66, 329.63, 392, 440, 392, 329.63];
  function setSoundUI() {
    soundToggle.setAttribute("aria-pressed", String(soundEnabled));
    soundToggle.setAttribute(
      "aria-label",
      soundEnabled ? "Mute ambient sound" : "Enable ambient sound",
    );
    soundLabel.textContent = soundEnabled ? "Sound on" : "Sound off";
  }
  function tone(frequency, at, duration, amplitude, type = "sine") {
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(amplitude, at + 0.025);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.03);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }
  function percussion(at, accent) {
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.frequency.setValueAtTime(accent ? 135 : 185, at);
    oscillator.frequency.exponentialRampToValueAtTime(
      accent ? 58 : 92,
      at + 0.16,
    );
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(
      accent ? 0.28 : 0.13,
      at + 0.006,
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.25);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(at);
    oscillator.stop(at + 0.27);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }
  function scheduleScore() {
    if (!soundEnabled || audioContext.state !== "running") return;
    // Look ahead only 150 ms so chapter changes feel immediate and background tabs stay quiet.
    if (nextBeat < audioContext.currentTime)
      nextBeat = audioContext.currentTime + 0.02;
    while (nextBeat < audioContext.currentTime + 0.15) {
      const dancing = ["stage", "celebration"].includes(soundScene);
      const devotional = soundScene === "devotion";
      const moving = ["journey", "arrival", "memory"].includes(soundScene);
      const step = dancing ? 0.3125 : moving ? 0.44 : 0.65;
      if (beat % 8 === 0) {
        tone(110, nextBeat, step * 7, 0.09);
        tone(164.81, nextBeat, step * 7, 0.035);
      }
      if (beat % (dancing ? 2 : 4) === 0) {
        const note = pitches[Math.floor(beat / 2) % pitches.length];
        tone(
          note * (devotional ? 2 : 1),
          nextBeat,
          devotional ? 2.2 : 1.4,
          0.1,
        );
        tone(note * (devotional ? 4 : 2), nextBeat, 0.8, 0.025);
      }
      if (dancing || (moving && beat % 2 === 0))
        percussion(nextBeat, beat % 4 === 0);
      nextBeat += step;
      beat++;
    }
  }
  function stopAmbient() {
    ++audioSession;
    soundEnabled = false;
    clearInterval(timer);
    if (audioContext) {
      master.gain.cancelScheduledValues(audioContext.currentTime);
      master.gain.setTargetAtTime(0, audioContext.currentTime, 0.08);
    }
    setSoundUI();
  }
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
    else if (restoreFocus) soundToggle.focus({ preventScroll: true });
  }
  async function startAmbient() {
    const session = ++audioSession;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) {
      notify(
        "Ambient sound is unavailable in this browser. You can still play the official tracks.",
      );
      return;
    }
    try {
      if (!audioContext) {
        audioContext = new Audio();
        master = audioContext.createGain();
        master.gain.value = 0;
        master.connect(audioContext.destination);
      }
      stopMusic();
      await audioContext.resume();
      if (session !== audioSession || document.hidden) return;
      soundEnabled = true;
      master.gain.cancelScheduledValues(audioContext.currentTime);
      master.gain.setTargetAtTime(
        (Number(volume.value) / 100) * 0.65,
        audioContext.currentTime,
        0.25,
      );
      nextBeat = audioContext.currentTime + 0.03;
      clearInterval(timer);
      timer = setInterval(scheduleScore, 80);
      scheduleScore();
      setSoundUI();
    } catch {
      stopAmbient();
      notify("Tap Sound on again to enable audio.");
    }
  }
  document.querySelector(".sound-controls").hidden = false;
  soundToggle.addEventListener("click", () =>
    soundEnabled ? stopAmbient() : startAmbient(),
  );
  volume.addEventListener("input", () => {
    if (audioContext && soundEnabled)
      master.gain.setTargetAtTime(
        (Number(volume.value) / 100) * 0.65,
        audioContext.currentTime,
        0.08,
      );
  });
  async function playTrack(key, button) {
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
      stopAmbient();
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
      stopAmbient();
      stopMusic();
      audioContext?.suspend().catch(() => {});
    }
  });
  addEventListener("pagehide", () => {
    stopAmbient();
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
  // Retire older cache-first versions without caching personal photos.
  if ("serviceWorker" in navigator)
    navigator.serviceWorker.register("sw.js").catch(() => {});
})();
