// Behavioral checks. Run with jsdom and postcss available on NODE_PATH.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const postcss = require("postcss");
const base = path.resolve(__dirname, "../dist");
const html = fs.readFileSync(path.join(base, "index.html"), "utf8");
const script = fs.readFileSync(path.join(base, "experience.js"), "utf8");
const tracks = JSON.parse(fs.readFileSync(path.join(base, "story-audio.json")));
const dom = new JSDOM(html, {
  url: "https://garba.example/?source=invitation#celebration",
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const w = dom.window,
  d = w.document;
let frame,
  reducedHandler,
  fetches = 0,
  copied,
  contexts = 0,
  fetchFail = false,
  resolveFetch;
let gateFetch = false,
  hidden = false;
const reduced = {
  matches: false,
  addEventListener: (_, cb) => {
    reducedHandler = cb;
  },
};
w.innerHeight = 900;
w.innerWidth = 1440;
w.scrollY = 8000;
w.performance.getEntriesByType = () => [{ type: "reload" }];
w.matchMedia = () => reduced;
let clock = 0, rafId = 0;
const callbacks = new Map();
w.performance.now = () => clock;
w.requestAnimationFrame = (cb) => { callbacks.set(++rafId, cb); return rafId; };
w.cancelAnimationFrame = (id) => callbacks.delete(id);
frame = (advance = 16) => {
  clock += advance;
  const pending = [...callbacks];
  callbacks.clear();
  pending.forEach(([, cb]) => cb(clock));
};
w.scrollTo = ({ top }) => {
  w.scrollY = top;
  w.dispatchEvent(new w.Event("scroll"));
};
Object.defineProperty(d, "hidden", { get: () => hidden });
Object.defineProperty(d.documentElement, "scrollHeight", { get: () => 13200 });
const journey = d.querySelector(".journey"),
  stage = d.querySelector(".journey-stage");
const scenes = [...d.querySelectorAll(".scene")];
const cinematic = () => d.documentElement.classList.contains("cinematic");
Object.defineProperty(stage, "clientHeight", { get: () => 900 });
Object.defineProperty(journey, "offsetHeight", {
  get: () => (cinematic() ? 10692 : 8100),
});
journey.getBoundingClientRect = () => ({ top: -w.scrollY });
scenes.forEach((s, i) => {
  s.getBoundingClientRect = () => ({ top: i * 900 - w.scrollY });
});
w.HTMLCanvasElement.prototype.getContext = () => ({});
w.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
w.HTMLDialogElement.prototype.close = function () {
  this.open = false;
  this.dispatchEvent(new w.Event("close"));
};
w.fetch = async () => {
  fetches++;
  if (gateFetch)
    await new Promise((r) => {
      resolveFetch = r;
    });
  return { ok: !fetchFail, json: async () => tracks };
};
Object.defineProperty(w.navigator, "clipboard", {
  value: {
    writeText: async (s) => {
      copied = s;
    },
  },
});
const param = () => ({
  value: 0,
  setValueAtTime() {},
  exponentialRampToValueAtTime() {},
  setTargetAtTime() {},
  cancelScheduledValues() {},
});
w.AudioContext = class {
  constructor() {
    contexts++;
    this.currentTime = 0;
    this.state = "suspended";
    this.destination = {};
  }
  createGain() {
    return { gain: param(), connect() {}, disconnect() {} };
  }
  createOscillator() {
    return {
      frequency: param(),
      connect() {},
      disconnect() {},
      start() {},
      stop() {},
    };
  }
  async resume() {
    this.state = "running";
  }
  async suspend() {
    this.state = "suspended";
  }
};
const tick = () => new Promise((r) => setImmediate(r));
const scroll = (cursor) => {
  w.scrollY = (cursor / 18) * 9792;
  w.dispatchEvent(new w.Event("scroll"));
  frame?.();
};
(async () => {
  const ids = [...d.querySelectorAll("[id]")].map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, "unique IDs");
  assert.equal(d.querySelectorAll("h1").length, 1);
  assert.equal(scenes.length, 11, "original ten scenes plus the connected walk home");
  const road = d.querySelector('#partner-road');
  assert.equal(road.parentElement, stage, 'road shares the original story stage');
  assert.equal(road.previousElementSibling.id, 'celebration', 'Garba flows into the walk home');
  assert.equal(d.querySelector('main').lastElementChild.id, 'details', 'original static details remain the ending');
  assert.equal(road.querySelectorAll('.partner-shop').length, 16, 'every confirmed sponsor remains');
  for (const el of d.querySelectorAll("[src],link[href],a[href]")) {
    const value = el.getAttribute("src") || el.getAttribute("href");
    if (value.startsWith("#"))
      assert(d.querySelector(value), `anchor ${value}`);
    else if (!/^(https?:|data:)/.test(value))
      assert(
        fs.existsSync(path.join(base, value.split("?")[0])),
        `asset ${value}`,
      );
  }
  for (const file of [
    "experience.css",
    "storybook.css",
    "button-motion.css",
    "partner-road.css",
    "assets/fonts/fonts.css",
  ]) {
    const css = fs.readFileSync(path.join(base, file), "utf8");
    postcss.parse(css);
    for (const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))
      assert(
        fs.existsSync(path.join(base, path.dirname(file), match[1])),
        `CSS asset ${match[1]}`,
      );
    assert(!/scroll-snap-type/.test(css), "no pagination-like snapping");
  }
  w.eval(fs.readFileSync(path.join(base, 'partner-road.js'), 'utf8'));
  w.eval(script);
  await tick(); // Let the initial pageshow restoration finish before interacting.
  assert.equal(w.scrollY, 0, "reload starts at the top");
  assert.equal(w.location.hash, "", "reload ignores the old scene anchor");
  assert.equal(
    w.location.search,
    "?source=invitation",
    "reload retains URL parameters",
  );
  assert.equal(fetches, 0, "no unsolicited network audio");
  assert.equal(contexts, 0, "no unsolicited generated audio");
  assert.equal(d.querySelectorAll("iframe").length, 0);
  assert(cinematic());
  assert.equal(d.querySelectorAll(".scene.is-active").length, 1);
  assert.equal(scenes[0].id, "invitation", "box comes before the storyline");
  assert.equal(scenes[1].id, "beginning", "friends meet after the box opens");
  assert.equal(d.querySelector(".scene.is-active").id, "invitation");
  assert.equal(
    d.querySelector("#invitation-seal").getAttribute("aria-expanded"),
    "false",
  );
  assert.equal(d.querySelectorAll(".box-hit-area").length, 1);
  assert(d.querySelector("#invitation-seal img"), "logo is inside the opening button");
  d.querySelector("#opening-sound").click(); // Muted entry stays silent; sound synthesis is checked in Chromium.
  d.querySelector("#invitation-seal").focus();
  d.querySelector("#invitation-seal").click();
  frame(1500);
  frame(0);
  assert.equal(d.querySelector(".scene.is-active").id, "invitation", "slow opening remains in the box midway");
  frame(2300);
  frame(0);
  assert.equal(
    d.querySelector(".scene.is-active").id,
    "beginning",
    "one logo click goes directly to the storyline",
  );
  assert.equal(d.activeElement.id, "beginning-title", "logo activation transfers focus into story");
  assert.equal(d.querySelector("#invitation .hamper-interior img").getAttribute("src"),
    d.querySelector("#beginning .scene-art img").getAttribute("src"),
    "box interior leads into the first story scene");
  assert(!d.querySelector("#open-invitation"), "no second continue button");
  // Enter every scene forwards and backwards using native scroll progress.
  for (const sequence of [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ]) {
    for (const i of sequence) {
      scroll(i + 0.25);
      assert.equal(
        d.querySelector(".scene.is-active").id,
        scenes[i].id,
        `scene ${i} reachable`,
      );
      assert.equal(
        scenes.filter((s) => !s.inert).length,
        1,
        "only visible scene interactive",
      );
    }
  }
  scroll(9.85);
  assert(scenes[9].classList.contains('is-visible') && road.classList.contains('is-visible'), 'celebration dissolves directly into the road');
  for (let pair = 0; pair < 8; pair++) {
    scroll(10 + (.04 + pair / 7 * .91) * 8);
    assert.equal(d.querySelector('.scene.is-active'), road, 'road stays within the shared scene controller');
    for (const shop of road.querySelectorAll(`[data-road-pair="${pair}"]`))
      assert.equal(Number(shop.style.opacity), 1, 'each pair gets readable time during the walk');
  }
  for (const line of d.querySelectorAll(".dialogue-beat q")) {
    assert(
      line.textContent.trim().split(/\s+/).length <= 12,
      "dialogue stays brief",
    );
  }
  assert(
    !d.querySelector(".scene-description"),
    "no blocks of narrative explanation",
  );
  assert(
    !d.querySelector('img[src^="assets/journey/"]'),
    "photorealistic replacements are inactive",
  );
  scroll(1.1);
  assert.equal(
    d.querySelector("#beginning .is-speaking").dataset.speaker,
    "him",
  );
  scroll(1.3);
  assert.equal(
    d.querySelector("#beginning .is-speaking").dataset.speaker,
    "her",
  );
  assert.equal(d.querySelectorAll("#beginning .is-speaking").length, 1);
  scroll(1.1);
  assert.equal(
    d.querySelector("#beginning .is-speaking").dataset.speaker,
    "him",
    "dialogue reverses",
  );
  scroll(3.26);
  const parked = parseFloat(
    d.querySelector("#the-plan").style.getPropertyValue("--car-x"),
  );
  assert(Math.abs(parked) < 1, "ride parks for boarding");
  scroll(3.66);
  assert(
    parseFloat(d.querySelector("#the-plan").style.getPropertyValue("--car-x")) >
      100,
    "ride departs",
  );
  assert.equal(
    d
      .querySelector("#the-plan .man")
      .style.getPropertyValue("--person-opacity"),
    "0.000",
    "both friends board",
  );
  scroll(5.6);
  assert.equal(
    d.querySelector("#arrival").style.getPropertyValue("--together-opacity"),
    "1.000",
    "friends enter together",
  );
  scroll(6.6);
  assert.equal(
    d.querySelector("#take-story-photo").getAttribute("aria-pressed"),
    "true",
    "selfie appears with scroll",
  );
  d.querySelector("#take-story-photo").click();
  frame();
  assert.equal(
    d.querySelector("#take-story-photo").getAttribute("aria-pressed"),
    "false",
    "photo retake",
  );
  d.querySelector("#take-story-photo").click();
  frame();
  assert.equal(
    d.querySelector("#take-story-photo").getAttribute("aria-pressed"),
    "true",
    "manual snapshot",
  );
  scroll(9.5);
  assert.equal(d.querySelector("#celebration .man").dataset.pose, "dance");
  assert.equal(d.querySelector("#celebration .woman").dataset.pose, "dance");
  scroll(0.6);
  assert.equal(
    d.querySelector("#invitation").style.getPropertyValue("--open"),
    "1.0000",
    "hamper opens",
  );
  assert(Number(d.querySelector("#invitation").style.getPropertyValue("--enter")) > 0, "opening zoom advances with scroll");
  scroll(0.01);
  assert.equal(
    d.querySelector("#invitation").style.getPropertyValue("--open"),
    "0.0000",
    "hamper closes on reverse",
  );
  assert.equal(d.querySelector("#invitation").style.getPropertyValue("--enter"), "0.0000", "entry zoom reverses");
  scroll(4.85);
  assert.equal(
    d.querySelectorAll(".scene.is-visible").length,
    2,
    "overlapping dissolve",
  );
  assert.equal(d.querySelectorAll(".scene.is-active").length, 1);
  d.querySelector("#motion-toggle").click();
  assert(!cinematic(), "reading mode");
  assert.equal(
    d.querySelector("#invitation-seal").getAttribute("aria-expanded"),
    "false",
  );
  d.querySelector("#invitation-seal").click();
  assert.equal(
    d.querySelector("#invitation-seal").getAttribute("aria-expanded"),
    "true",
    "reading mode opens the box",
  );

  assert(
    [...d.querySelectorAll(".dialogue-beat")].every(
      (line) => !line.hasAttribute("aria-hidden"),
    ),
    "full conversations available in reading mode",
  );
  assert(
    scenes.every((s) => !s.inert && !s.hasAttribute("aria-hidden")),
    "all story accessible without motion",
  );
  d.querySelector("#motion-toggle").click();
  assert(cinematic(), "motion restored");
  reduced.matches = true;
  reducedHandler();
  assert(!cinematic(), "system reduced motion");
  assert(scenes.every((s) => !s.inert));
  reduced.matches = false;
  reducedHandler();
  assert(cinematic());
  assert(!d.querySelector(".sound-controls, #sound-toggle, #sound-volume"), "floating sound bar removed");
  assert(d.querySelector("#opening-sound"), "door sound control remains");
  scroll(8.2);
  d.querySelector("#devotion [data-track]").click();
  await tick();
  assert(!d.querySelector("#music-panel").hidden);
  assert.equal(d.querySelectorAll("iframe").length, 1);
  assert(!d.querySelector("dialog[open]"), "music does not block scrolling");
  assert(d.querySelector("iframe").src.includes(tracks.aarti.youtube));
  scroll(7.3);
  assert.equal(
    d.querySelector(".scene.is-active").id,
    "the-stage",
    "scroll continues during playback",
  );
  d.querySelector('.music-tabs [data-track="garba2"]').click();
  await tick();
  assert.equal(d.querySelectorAll("iframe").length, 1, "one player only");
  assert(d.querySelector("iframe").src.includes(tracks.garba2.youtube));
  d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape" }));
  assert.equal(d.querySelectorAll("iframe").length, 0, "Escape stops music");
  d.querySelector("#the-stage [data-track]").click();
  await tick();
  hidden = true;
  d.dispatchEvent(new w.Event("visibilitychange"));
  assert.equal(d.querySelectorAll("iframe").length, 0, "hidden tabs stop music");
  hidden = false;
  d.querySelector("#share-invitation").click();
  await tick();
  assert.equal(copied, "https://garba.example/");
  scroll(6.2);
  d.querySelector("#make-memory").click();
  assert(d.querySelector("#memory-dialog").open);
  d.querySelector("#memory-dialog [data-close]").click();
  assert(!d.querySelector("#memory-dialog").open);
  const input = d.querySelector("#memory-photo");
  for (const [file, message] of [
    [{ type: "image/heic", size: 100 }, "JPG"],
    [{ type: "image/jpeg", size: 21 * 1024 * 1024 }, "20 MB"],
  ]) {
    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });
    input.dispatchEvent(new w.Event("change"));
    await tick();
    assert(d.querySelector("#memory-status").textContent.includes(message));
  }
  // A restored reload must clear every expanded control before showing the box.
  scroll(6.6);
  d.querySelector("#a-memory").dataset.photo = "true";
  d.querySelector("#make-memory").click();
  d.querySelector("#the-stage [data-track]").click();
  await tick();
  d.querySelector("#motion-toggle").click();
  d.querySelector("#invitation-seal").click();
  d.querySelector(".toast").classList.add("visible");
  w.dispatchEvent(new w.PageTransitionEvent("pageshow", { persisted: false }));
  assert.equal(w.scrollY, 0);
  assert(cinematic(), "reload resets manual reading choice");
  assert.equal(d.querySelector(".scene.is-active").id, "invitation");
  assert.equal(
    d.querySelector("#invitation-seal").getAttribute("aria-expanded"),
    "false",
  );
  assert(!d.querySelector("dialog[open]"), "reload closes dialogs");
  assert(d.querySelector("#music-panel").hidden, "reload closes music");
  assert.equal(d.querySelectorAll("iframe").length, 0);
  assert.equal(
    d.querySelector("#take-story-photo").getAttribute("aria-pressed"),
    "false",
  );
  assert(!d.querySelector("#a-memory").hasAttribute("data-photo"));
  assert(d.querySelector("#download-memory").hidden);
  assert(!d.querySelector(".toast").classList.contains("visible"));
  const metadata = JSON.parse(
    d.querySelector('script[type="application/ld+json"]').textContent,
  );
  assert.equal(metadata.startDate, "2026-10-09T19:30:00+05:30");
  assert(
    html.includes(
      "https://www.district.in/events/the-garba-experience-with-kinjal-dave-1970-buy-tickets",
    ),
  );
  console.log(
    "PASS: local assets/CSS/anchors; eleven-scene forward and reverse scrolling; connected sponsor walk; original static ending; illustrated character motion; concise dialogue beats; photo moment; continuous dissolves; reversible hamper; reading/reduced-motion modes; no floating sound bar; retained opening-sound control; single nonmodal official player; Escape/background cleanup; sharing; keepsake controls/validation; event details.",
  );
  console.log(
    "DOM-level checks only; rendering, actual audio output, third-party playback and photo export need real-browser verification.",
  );
  w.close();
})().catch((error) => {
  console.error(error);
  w.close();
  process.exitCode = 1;
});
