/* A progressively enhanced invitation: normal scrolling, optional motion and sound. */
(() => {
  "use strict";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const opening = document.querySelector(".opening");
  const stage = document.querySelector(".opening-stage");
  const scenes = [...document.querySelectorAll(".arrival, .celebration")];
  const clamp = (n) => Math.max(0, Math.min(1, n));
  let frame = 0;
  function renderScroll() {
    frame = 0;
    const height = innerHeight;
    root.style.setProperty(
      "--progress",
      clamp(
        scrollY / Math.max(1, document.documentElement.scrollHeight - height),
      ),
    );
    if (!reduced.matches && root.classList.contains("motion-ready")) {
      const rect = opening.getBoundingClientRect();
      const progress = clamp(
        -rect.top / Math.max(1, opening.offsetHeight - stage.offsetHeight),
      );
      const open = clamp((progress - 0.08) / 0.72);
      opening.style.setProperty("--open", open.toFixed(4));
      opening.style.setProperty("--seal", (1 - clamp(open * 5)).toFixed(4));
      for (const scene of scenes) {
        const r = scene.getBoundingClientRect();
        scene.style.setProperty(
          "--scene",
          clamp((height - r.top) / (height + r.height)).toFixed(4),
        );
      }
    }
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(renderScroll);
  }
  function configureMotion() {
    // Short landscape screens and reduced motion use a complete static composition.
    root.classList.toggle(
      "motion-ready",
      !reduced.matches && innerHeight >= 740,
    );
    if (!root.classList.contains("motion-ready")) {
      opening.style.setProperty("--open", 0);
      opening.style.setProperty("--seal", 1);
    }
    schedule();
  }
  configureMotion();
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", configureMotion, { passive: true });
  reduced.addEventListener("change", configureMotion);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.08 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    root.classList.add("js");
  }

  // Native dialogs handle focus trapping, Escape and returning focus to the opener.
  const music = document.querySelector("#music-dialog");
  const host = music.querySelector(".player-host");
  let tracks;
  let selection = 0;
  let opener;
  const toast = document.querySelector(".toast");
  let toastTimer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 4200);
  }
  async function playTrack(key, button) {
    const token = ++selection;
    if (!music.open) opener = button;
    try {
      if (!tracks) {
        const response = await fetch("story-audio.json");
        if (!response.ok) throw new Error("Music configuration unavailable");
        tracks = await response.json();
      }
      if (token !== selection) return;
      const track = tracks[key];
      if (!track || !/^[\w-]{11}$/.test(track.youtube))
        throw new Error("Invalid track");
      host.replaceChildren();
      const iframe = document.createElement("iframe");
      iframe.title = `${track.title} — ${track.credit}`;
      iframe.allow = "autoplay; encrypted-media; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.src = `https://www.youtube-nocookie.com/embed/${track.youtube}?autoplay=1&rel=0`;
      host.append(iframe);
      music.querySelector(".track-credit").textContent =
        `${track.title} · ${track.credit}`;
      music.querySelector("#youtube-source").href =
        `https://www.youtube.com/watch?v=${track.youtube}`;
      music
        .querySelectorAll("[data-track]")
        .forEach((b) =>
          b.setAttribute("aria-pressed", String(b.dataset.track === key)),
        );
      if (!music.open) music.showModal();
    } catch {
      notify("Music could not load. Please try again when you’re connected.");
    }
  }
  document
    .querySelectorAll("[data-track]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        playTrack(button.dataset.track, button),
      ),
    );
  music.addEventListener("close", () => {
    ++selection;
    host.replaceChildren();
    opener?.focus({ preventScroll: true });
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
      const url = document.querySelector('link[rel="canonical"]').href;
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
