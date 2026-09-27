# The Garba Experience

A continuous, scroll-driven Gujarati invitation with the original illustrated friends and short conversations. The closed invitation box fills the opening screen. Click it or scroll to open its doors and reveal the original card, then continue into the friends’ story. They meet, decide on a Garba night, catch their ride, travel through Ahmedabad, enter the venue, take a selfie, hear Kinjal Dave, share a prayer and join the circle.

## Run locally

```sh
python3 -m http.server 8765 --directory dist
```

Open http://localhost:8765. The site is static: no build or production dependencies.

## Current implementation

- `dist/index.html`: ten ordered story scenes, original printed invitation, unchanged event details, optional music player and local photo keepsake.
- `dist/experience.css`: shared cinematic stage, event details, sound controls and keepsake layout.
- `dist/storybook.css`: illustrated scenes, character poses, speech bubbles, mobile compositions and a complete unpinned reading layout.
- `dist/experience.js`: native scroll progress, character movement, short dialogue beats, reversible hamper doors, selfie moment, reading mode, original Web Audio ambience, official music selection, sharing and photo export.
- `dist/assets/story/scroll/`: optimized original illustrated characters, entrance, concert and Garba-circle artwork.
- `dist/assets/story/locations/`: five painted environments matched to the action: home courtyard, pickup street, driving road, selfie corner and shrine courtyard. The later realistic story backgrounds and city collage are no longer loaded.
- `dist/story-audio.json`: existing official YouTube selections. Official recordings are not downloaded or rehosted.

The story does not use pagination, scroll snapping, intercepted wheel/touch events or next-page buttons. Mouse wheel, trackpad, touch and keyboard all use the browser's native scroll. The same stage dissolves through the story; scrolling backwards reverses it. Event details follow naturally at the end.

Reloading returns to the top of the closed invitation box and clears open music, dialogs, the selfie reveal and the local keepsake. A scene anchor is removed on reload; fresh direct links still work. Reduced-motion preferences remain respected.

“Read without animation” exposes all scenes in normal document flow. Reduced-motion preferences, short viewports and oversized text use the reading layout automatically. All story content is available without JavaScript.

Sound is silent until explicitly enabled. “Sound on” starts an original ambient score generated locally with Web Audio; its instrumentation follows the story. Aarti and Garba selections use a visible, nonmodal official YouTube player so visitors can continue scrolling. Switching between ambience and official music stops the other source. Closing the player, pressing Escape, hiding the tab or leaving the page stops playback. YouTube playback depends on network, browser and regional availability.

Photo keepsakes remain entirely in the visitor's browser, with no upload or persistence. Calendar, District booking, venue directions, the original invitation and entry-pass wording are preserved.

## Verification

`node --check dist/experience.js`

`tests/verify-experience.cjs` requires `jsdom` and `postcss` in the Node module search path. It checks scene traversal and reversal, dissolves, hamper opening, reading/reduced-motion modes, silent defaults, audio controls, player cleanup, asset references, sharing, keepsake validation and event details. These are DOM-level tests. The background correction was also rendered in Chromium at 1440×900, 390×844 and 320×700, with image loading, scroll scene selection, overflow and screenshot checks. This does not establish audio quality or third-party playback.

See `PRODUCTION-BRIEF.md` for verified results and remaining checks. The existing Sites project ID is preserved. Pushing source changes does not publish the live Sites website.
