const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const base = path.join(__dirname, "../dist");

async function verify(webAudio) {
  const dom = new JSDOM(fs.readFileSync(path.join(base, "index.html"), "utf8"), {
    runScripts: "outside-only", url: "https://garba.example/", pretendToBeVisual: true,
  });
  const w = dom.window, d = w.document;
  const ids = ["door-sound", "descent-sound", "site-soundtrack"];
  const audio = ids.map(id => d.getElementById(id));
  const [door, descent, music] = audio;
  const button = d.getElementById("soundtrack-toggle");
  let hidden = false, plays = 0, contexts = 0, loads = 0;
  const gainByAudio = new Map(), failures = new Map(), errors = new Map();
  Object.defineProperty(d, "hidden", { get: () => hidden });
  for (const item of audio) {
    Object.defineProperty(item, "paused", { value: true, writable: true });
    Object.defineProperty(item, "error", { get: () => errors.get(item) });
    item.play = () => {
      plays++;
      if (failures.has(item)) { const error = failures.get(item); failures.delete(item); return Promise.reject(error); }
      item.paused = false;
      return Promise.resolve();
    };
    item.pause = () => { item.paused = true; };
    item.load = () => { loads++; errors.delete(item); };
  }
  if (webAudio) w.AudioContext = class {
    constructor() { contexts++; this.currentTime = 0; this.state = "running"; this.destination = {}; }
    resume() { return Promise.resolve(); }
    createGain() {
      return { connect() {}, gain: { value: 0, cancelScheduledValues() {}, setValueAtTime(v) { this.value = v; } } };
    }
    createMediaElementSource(item) { return { connect(gain) { gainByAudio.set(item, gain); } }; }
  };
  const audible = () => audio.filter(item => !item.paused &&
    (webAudio ? gainByAudio.get(item)?.gain.value > 0 : !item.muted)).map(item => item.id);
  const only = id => assert.deepEqual(audible(), id ? [id] : []);
  w.eval(fs.readFileSync(path.join(base, "site-soundtrack.js"), "utf8"));
  const sound = w.garbaSoundtrack;
  assert.equal(plays, 0, "no unsolicited playback");
  assert.equal(contexts, 0, "no context before user activation");
  assert(button.hidden);
  assert(music.loop && !door.loop && !descent.loop);
  assert(audio.every(item => item.preload === "none"));
  for (const item of audio) assert(fs.existsSync(path.join(base, item.getAttribute("src"))));

  sound.begin(true); await Promise.resolve(); await Promise.resolve(); only("door-sound");
  sound.setScene(.99); await Promise.resolve(); only("door-sound");
  door.dispatchEvent(new w.Event("ended")); await Promise.resolve(); only();
  sound.setScene(1); await Promise.resolve(); only("descent-sound");
  assert.equal(descent.currentTime, 0);
  sound.setScene(1.41); await Promise.resolve(); only("descent-sound");
  music.currentTime = 4; // Priming must not skip the beginning of the song.
  sound.setScene(1.42); await Promise.resolve(); only("site-soundtrack");
  assert.equal(music.currentTime, 0);
  music.currentTime = 37;
  for (const cursor of [2, 3, 8, 10, 14]) { sound.setScene(cursor); await Promise.resolve(); only("site-soundtrack"); }
  assert.equal(music.currentTime, 37, "scene changes do not restart the song");
  sound.setScene(1.2); await Promise.resolve(); only("descent-sound");
  sound.setScene(2); await Promise.resolve(); only("site-soundtrack");
  assert.equal(music.currentTime, 37, "return from intro preserves song position");
  button.click(); await Promise.resolve(); only(); button.click(); await Promise.resolve(); only("site-soundtrack");
  assert.equal(music.currentTime, 37);
  hidden = true; d.dispatchEvent(new w.Event("visibilitychange")); await Promise.resolve(); only();
  hidden = false; d.dispatchEvent(new w.Event("visibilitychange")); await Promise.resolve(); only("site-soundtrack");
  w.dispatchEvent(new w.Event("pagehide")); await Promise.resolve(); only();
  w.dispatchEvent(new w.Event("pageshow")); await Promise.resolve(); only("site-soundtrack");
  button.click();
  hidden = true; d.dispatchEvent(new w.Event("visibilitychange"));
  hidden = false; d.dispatchEvent(new w.Event("visibilitychange")); await Promise.resolve(); only();
  button.click();

  sound.begin(true); await Promise.resolve(); await Promise.resolve(); only("door-sound");
  d.getElementById("opening-sound").click(); await Promise.resolve(); only();
  sound.setScene(1); await Promise.resolve(); only(); // Intro mute covers both effects.
  sound.setScene(1.42); await Promise.resolve(); only("site-soundtrack");
  d.getElementById("opening-sound").click();
  sound.begin(true); await Promise.resolve(); sound.cancelIntro(); await Promise.resolve(); only();
  sound.setScene(.4); await Promise.resolve(); only();
  sound.setScene(1); await Promise.resolve(); only("descent-sound");
  sound.setScene(1.42); await Promise.resolve(); only("site-soundtrack");
  sound.reset(); sound.setScene(2); await Promise.resolve(); only(); assert(button.hidden);
  sound.begin(false); await Promise.resolve(); await Promise.resolve(); only("site-soundtrack");

  sound.reset();
  failures.set(music, new w.DOMException("Gesture needed", "NotAllowedError"));
  sound.begin(false); await Promise.resolve(); await Promise.resolve(); only();
  assert.equal(button.dataset.state, "retry");
  button.click(); await Promise.resolve(); await Promise.resolve(); only("site-soundtrack");
  errors.set(music, { code: 2 }); music.dispatchEvent(new w.Event("error")); await Promise.resolve(); only();
  assert.equal(button.dataset.state, "retry");
  button.click(); await Promise.resolve(); await Promise.resolve(); only("site-soundtrack");
  assert.equal(loads, 1);
  sound.reset();
  failures.set(descent, new w.DOMException("Gesture needed", "NotAllowedError"));
  sound.begin(true); await Promise.resolve(); await Promise.resolve(); only("door-sound");
  sound.setScene(1); await Promise.resolve(); only(); assert.equal(button.dataset.state, "retry");
  button.click(); await Promise.resolve(); await Promise.resolve(); only("descent-sound");
  errors.set(descent, { code: 2 }); descent.dispatchEvent(new w.Event("error")); await Promise.resolve(); only();
  sound.setScene(1.42); await Promise.resolve(); only("site-soundtrack"); // Failed effects cannot strand music.

  let reject;
  music.play = () => new Promise((_, fail) => { reject = fail; });
  sound.begin(false); sound.reset();
  reject(new w.DOMException("Old request", "NotAllowedError")); await Promise.resolve();
  only(); assert(button.hidden, "late failures cannot revive reset sessions");
  dom.window.close();
}
(async () => {
  await verify(true);
  await verify(false);
  console.log("PASS: three-track scene sequencing; no overlap; loops; reverse scroll; mute; visibility; reset; blocked autoplay and media-error retry; HTML media fallback.");
})().catch(error => { console.error(error); process.exitCode = 1; });
