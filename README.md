# The Garba Experience

A continuous, scroll-driven Gujarati invitation with the original illustrated friends and short conversations. The closed invitation box fills the opening screen. Click the centre logo for a slow, automatic 3.8-second door-opening and entry sequence, using the supplied door-opening MP3. The next 2.8-second character descent uses its own MP3; both effects share the intro mute control. Scroll, touch the scene or press Escape to take over. The sequence moves straight into the friends’ story through the courtyard inside. Native scrolling drives the same reversible entry animation. The original card remains available later in the story. They meet, decide on a Garba night, catch their ride, travel through Ahmedabad, enter the venue, take a selfie, hear Kinjal Dave, share a prayer and join the circle.

## Run locally

```sh
python3 -m http.server 8765 --directory dist
```

Open http://localhost:8765. The site is static: no build or production dependencies.

## Current implementation

- `dist/index.html`: ten ordered story scenes, original printed invitation, unchanged event details, optional music player and local photo keepsake.
- `dist/experience.css`: shared cinematic stage, event details, sound controls and keepsake layout.
- `dist/storybook.css`: illustrated scenes, character poses, speech bubbles, mobile compositions and a complete unpinned reading layout.
- `dist/experience.js`: native scroll progress, character movement, short dialogue beats, reversible hamper doors, selfie moment, reading mode, the automatic opening and its sound effect, official music selection, sharing and photo export.
- `dist/assets/story/scroll/`: optimized original illustrated characters, entrance, concert and Garba-circle artwork.
- `dist/assets/story/locations/`: five painted environments matched to the action: home courtyard, pickup street, driving road, selfie corner and shrine courtyard. The later realistic story backgrounds and city collage are no longer loaded.
- `dist/story-audio.json`: existing official YouTube selections. Official recordings are not downloaded or rehosted.
- `dist/brand-controls.css` and `dist/assets/ui-icons.svg`: prominent logo plaques for The Garba Experience and the three lead partners, responsive handoff spacing, and icons with visible action labels.
- `dist/thank-you.css`: the closing invitation with larger event details, contrasting action buttons and room for the original decorative artwork.

The story does not use pagination, scroll snapping, intercepted wheel/touch events or next-page buttons. Mouse wheel, trackpad, touch and keyboard all use the browser's native scroll. The same stage dissolves through the story; scrolling backwards reverses it. Event details follow naturally at the end.

Reloading returns to the top of the closed invitation box and clears open music, dialogs, the selfie reveal and the local keepsake. A scene anchor is removed on reload; fresh direct links still work. Reduced-motion preferences remain respected.

“Read without animation” exposes all scenes in normal document flow. Reduced-motion preferences, short viewports and oversized text use the reading layout automatically. All story content is available without JavaScript.

The supplied door-opening MP3 plays when the logo is clicked. At the end of the 3.8-second door phase, the descent MP3 plays as the friends lower into view. Vichudo begins from the start when they land, at about 6.6 seconds, and loops throughout the remaining website. The header speaker mutes all website sound; the intro control mutes both effects. Only one track is audible. Scrolling back into an intro phase replaces music with its effect and restores the song position afterward. In static/reduced-motion mode, the logo click starts Vichudo directly. Official YouTube selections pause website audio; closing the player restores the current track. Hidden pages pause audio; reload resets it. Playback failures offer a retry button. All three recordings are copied unchanged from `Audio_folder/` into `dist/assets/audio/` so static hosting includes them.

Photo keepsakes remain entirely in the visitor's browser, with no upload or persistence. Calendar, District booking, venue directions, the original invitation and entry-pass wording are preserved.

## Verification

`node --check dist/experience.js`

`tests/verify-experience.cjs` requires `jsdom` and `postcss` in the Node module search path. It checks scene traversal and reversal, dissolves, hamper opening, reading/reduced-motion modes, silent defaults, audio controls, player cleanup, asset references, sharing, keepsake validation and event details. These are DOM-level tests. The background correction was also rendered in Chromium at 1440×900, 390×844 and 320×700, with image loading, scroll scene selection, overflow and screenshot checks. This does not establish audio quality or third-party playback.

See `PRODUCTION-BRIEF.md` for verified results and remaining checks. The existing Sites project ID is preserved. Pushing source changes does not publish the live Sites website.

`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node tests/verify-responsive.cjs` requires Playwright in the Node module search path. It checks 16 viewport sizes from 320×568 to 2560×1080, all cinematic scenes, handoff logo clearance, labelled controls, the final page, dialogs, reduced motion and no-JavaScript content. Set `SCREENSHOT_DIR` to retain review images. The 2 October 2026 run passed in headless Chromium; Safari, Firefox and physical devices were not tested.

`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node tests/verify-brand-cards.cjs` checks the clickable logo plaques and centered name/logo cards, keyboard and focus behavior, and final-page reflow at 12 sizes with normal and doubled text. Ethereum's artwork is enlarged within its bottom plaque. The closing artwork now occupies its own responsive row, while event facts and buttons wrap to their available content width.

`node tests/verify-soundtrack.cjs` (with `jsdom` in the Node module search path) checks door/descent/music sequencing, mute, official-player exclusivity, lifecycle cleanup, autoplay/error recovery, and the HTML media fallback. `dist/site-soundtrack.js` owns this playback lifecycle; the original supplied MP3 and source note are in `dist/assets/audio/`.
