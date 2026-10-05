# The Garba Experience

A continuous, scroll-driven Gujarati invitation with the original illustrated friends and short conversations. The closed invitation box fills the opening screen. Click the centre logo for an automatic 2.9-second door-opening and entry sequence, using the supplied door-opening MP3. The next 3.8-second character descent uses its own MP3; both effects share the intro mute control. Scroll, touch the scene or press Escape to take over. The sequence moves straight into the friends’ story through the courtyard inside. Native scrolling drives the same reversible entry animation. The original card remains available later in the story. They meet, decide on a Garba night, catch their ride, travel through Ahmedabad, enter the venue, take a selfie, hear Kinjal Dave, share a prayer and join the circle.

## Run locally

```sh
python3 -m http.server 8765 --directory dist
```

Open http://localhost:8765. The site is static with committed runtime bundles and no production dependencies. After editing a source CSS or JavaScript file, run `node scripts/build-runtime.cjs` to refresh the bundles and HTML references before uploading `dist/`.

## Self-contained website folder

`dist/` contains the complete website: HTML, CSS, JavaScript, artwork, logos,
fonts, the invitation, calendar and all three audio recordings. The audio's
single location is `dist/assets/audio/`; the duplicate root `Audio_folder/`
has been consolidated into those byte-identical files. The page already uses
relative paths to these files, so no playback URL change is needed.

ZIP `dist/` yourself, preserving its files and subfolders. The hosting team
should place its contents in the domain's public root, with `index.html`
directly in that root. No other repository folder is required. No OpenAI API,
backend, database or build step is required. The booking and maps links use their external services.

## Current implementation

The header's gold **Autoscroll** button starts a 64-second journey, including opening and closing. `dist/autoscroll-timeline.js` owns the timing: opening 3.5s, first chat 5s, invitation 11s, boarding 2.5s, drive 1.5s, entrance 8s, photo 4.5s, devotion 1.5s, stage 3.5s, Garba 1.5s, partners 20s, closing 1.5s. Individual dialogue knots give longer lines more time. The gate stays unobstructed for about 1.8s after the elephant exits while the friends keep walking. Their path continues through the passage reveal without a frozen interval or backward movement. Active sprite poses remain intact; these animations do not use video-frame sequences.

The clock uses elapsed time, so dropped rendering frames do not stretch the journey. Pause preserves the exact timeline position, manual seeking resumes from the matching position. Reading and reduced-motion layouts share the same total. Manual input, other actions, leaving the tab and reaching the bottom stop Autoscroll. Sound controls remain independent. The logo-only opening takes 6.7 seconds; the 3.5-second opening applies to Autoscroll.
- `dist/index.html`: eleven ordered story scenes, original printed invitation, unchanged event details, background Garba music and local photo keepsake.
- `dist/experience.css`: shared cinematic stage, event details, sound controls and keepsake layout.
- `dist/storybook.css`: illustrated scenes, character poses, speech bubbles, mobile compositions and a complete unpinned reading layout.
- `dist/experience.js`: controlled manual scrolling with gradual dialogue slowdowns, character movement, short dialogue beats, reversible hamper doors, selfie moment, reading mode, the automatic opening and its sound effect, sharing and photo export.
- `dist/assets/story/scroll/`: active original character and shared prayer artwork.
- `dist/assets/story/locations/`: the active home, pickup and road environments. Other scene décor lives in `event-decor/`; source notes remain with the artwork.
- `dist/brand-controls.css` and `dist/assets/ui-icons.svg`: prominent logo plaques for The Garba Experience and the three lead partners, responsive handoff spacing, and icons with visible action labels.
- `dist/thank-you.css`: a one-screen closing invitation with the original arch, botanical artwork, partner plaques, event details and six actions. A full-width gold booking button sits above three light secondary buttons; very short landscape uses a compact four-button row. Replay and original invitation are plain gold text links in equal columns below the partner logos and above the artwork. The same clickable partner-logo row sits inside the red arch, below the green details box and above the decorative artwork.

`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node tests/verify-autoscroll.cjs` (with Playwright available) checks start/pause, the opening handoff, manual takeover, keyboard and touch controls, tab visibility, dialogs, resize/reload, end-of-page stopping, reduced motion, no JavaScript and nine header sizes.

Manual wheel, trackpad, touch and navigation-key input is responsive and distance-limited, so a hard gesture cannot sweep through the story. Around each dialogue, speed eases down to 22% at its center and gradually returns to normal outside a 160–260px radius. Input continues without a timed pause, gesture lock or idle-gap requirement, in both directions. The remaining queued distance also shrinks inside a slow zone to avoid a long coast. Ordinary scrolling outside these zones retains the same speed and distance limits. Reduced-motion reading uses small immediate steps; dialog scrolling and browser zoom remain native. Autoscroll uses the separate 63-second timeline. The same stage dissolves through the story; scrolling backwards reverses it. Event details follow naturally at the end.

Reloading returns to the top of the closed invitation box and clears dialogs, the selfie reveal and the local keepsake. A scene anchor is removed on reload; fresh direct links still work. Reduced-motion preferences remain respected.

Reduced-motion preferences, short viewports and oversized text use the reading layout automatically. All story content is available without JavaScript.

The supplied door-opening MP3 plays when the logo is clicked. At the end of the 2.9-second door phase, the descent MP3 plays as the friends lower into view. Vichudo begins from the start when they land, at about 6.7 seconds, and loops throughout the remaining website. The header speaker mutes all website sound; the intro control mutes both effects. Only one track is audible. Scrolling back into an intro phase replaces music with its effect and restores the song position afterward. In static/reduced-motion mode, the logo click starts Vichudo directly. Hidden pages pause audio; reload resets it. Playback failures offer a retry button. All three original recordings reside in `dist/assets/audio/`, which is their single maintained location and is included when serving or uploading only `dist`.

Photo keepsakes remain entirely in the visitor's browser, with no upload or persistence. Calendar, District booking, venue directions, the original invitation and entry-pass wording are preserved.

## Verification

`node tests/verify-browser-safety.cjs` (Playwright, Chromium and `CHROMIUM_EXECUTABLE_PATH`) verifies native touch policy for iPhone and desktop-identifying iPadOS, real Chromium touch movement, unchanged desktop/Android input, stable iOS viewport calculations and the sustained-load fallback. This simulates iOS detection in Chromium; physical iPhone/iPad Safari verification is still required. `tests/verify-ios-touch.cjs` retains the legacy custom-touch regression for non-iOS browsers; it does not test the new native iOS path.

`node tests/verify-runtime.cjs` verifies deterministic runtime bundles, their source order and matching content hashes. The build consolidates the existing nine CSS and ten JavaScript requests plus the new safety modules into one stylesheet and one deferred script. It preserves source content and CSS relative asset paths; no hosting configuration change is required. All source modules remain available for maintenance.

`node --check dist/experience.js`

`tests/verify-experience.cjs` requires `jsdom` and `postcss` in the Node module search path. It checks scene traversal and reversal, dissolves, hamper opening, reading/reduced-motion modes, silent defaults, audio controls, player cleanup, asset references, sharing, keepsake validation and event details. These are DOM-level tests. The background correction was also rendered in Chromium at 1440×900, 390×844 and 320×700, with image loading, scroll scene selection, overflow and screenshot checks. This does not establish audio quality or third-party playback.

See `PRODUCTION-BRIEF.md` for verified results and remaining checks. The existing Sites project ID is preserved. Pushing source changes does not publish the live Sites website.

`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node tests/verify-responsive.cjs` requires Playwright in the Node module search path. It checks 16 viewport sizes from 320×568 to 2560×1080, all cinematic scenes, handoff logo clearance, labelled controls, the final page, dialogs, reduced motion and no-JavaScript content. Set `SCREENSHOT_DIR` to retain review images. The 2 October 2026 run passed in headless Chromium; Safari, Firefox and physical devices were not tested.

`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node tests/verify-brand-cards.cjs` checks the clickable logo plaques and centered name/logo cards, keyboard and focus behavior, and final-page reflow at 12 sizes with normal and doubled text. Ethereum's artwork is enlarged within its bottom plaque. The closing artwork sits below the partner plaques and the two plain text links; the four event buttons remain in the green details box.

`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node tests/verify-final-card.cjs` checks the entire closing page, including logos, artwork, footer and all actions, against the usable viewport at 36 sizes (280×640 through 1920×1080, including 568×320 landscape, portrait tablets, 800×600 small computers and breakpoint boundaries). It checks the logo row placement between details and artwork, 44px button/logo targets (plain text links use at least 24px in compact layouts), control separation, text containment, the original-invitation dialog and 200% text at four phone, tablet and small-computer sizes. Enlarged text remains scrollable rather than being clipped to a fixed height. All six distinct actions remain available, including the two plain text links in the red arch.

`node tests/verify-soundtrack.cjs` (with `jsdom` in the Node module search path) checks door/descent/music sequencing, mute, lifecycle cleanup, autoplay/error recovery, and the HTML media fallback. `dist/site-soundtrack.js` owns this playback lifecycle; the original supplied MP3 and source note are in `dist/assets/audio/`.

`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node tests/verify-manual-scroll.cjs` checks all eleven continuous dialogue slowdowns, hard and gentle gestures, continuous momentum, reverse scrolling, bounded speed/distance, keyboard, real browser touch input, dialog/zoom exemptions and reduced-motion reading.

The separate Aarti, Play Kinjal Dave and Play Garba buttons and their music-selection player have been removed. The Aarti/Garba story scenes and existing background soundtrack remain.

Home and View controls show only their logos, with click actions and accessible names retained.

`BROWSER=webkit node tests/verify-timeline.cjs` checks the 63-second clock, exact extra seconds for doors/descent/climbing, 20-second partner interval, continuously moving entrance, pause/resume, skipped-frame recovery, reading layouts and runtime asset loads. Set `BROWSER=chromium CHROMIUM_EXECUTABLE_PATH=/path/to/chromium` for Chromium. Playwright is a development-only dependency.

The October 2026 cleanup removed 110 unreferenced runtime files (about 86 MiB), including retired site implementations, unused Three.js libraries, earlier artwork and five unused videos. Historical asset prompts and license/source notes remain as provenance; they may describe artwork now retained only in Git history. All current images are single-frame rasters or pose atlases. All three audio tracks, supplied logos, original invitation, fonts and static/mobile fallbacks are preserved.

## iOS reliability fallback

On iPhone/iPad, manual swipes use native browser scrolling, so they do not have the custom dialogue slowdowns used on desktop/Android. The same animations still follow scroll position, and opt-in Autoscroll retains the unchanged 64-second timeline. Toolbar and keyboard height changes retain the stage height and story position; width/orientation changes still reflow normally.

Hidden iOS scenes and background tabs pause CSS animations and release layer hints. Existing scene-specific JavaScript loops already pause when inactive. Artwork stays decoded for reverse scrolling. After two consecutive 2.5-second sampling windows of sustained slow scrolling, iOS alone drops soft character shadows/dialog backdrop blur and lowers the elephant canvas pixel density. It keeps the same assets, paths and motion, and retains this lightweight mode until reload to avoid quality oscillation. Healthy devices keep the original effects.
