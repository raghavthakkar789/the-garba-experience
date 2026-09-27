# The Garba Experience

A continuous, scroll-driven Gujarati invitation with a cinematic story: two friends share an invitation, open the hamper, travel through Ahmedabad, arrive together, make a photo memory, pause for a prayer, hear Kinjal Dave and join the Garba circle.

## Run locally

```sh
python3 -m http.server 8765 --directory dist
```

Open http://localhost:8765. The site is static: no build or production dependencies.

## Current implementation

- `dist/index.html`: nine ordered story scenes, original printed invitation, unchanged event details, optional music player and local photo keepsake.
- `dist/experience.css`: one sticky cinematic stage, overlapping scene dissolves, full-bleed imagery, mobile compositions and a complete unpinned reading layout.
- `dist/experience.js`: native scroll progress, reversible hamper doors, scene transitions, reading mode, original Web Audio ambience, official music selection, sharing and photo export.
- `dist/assets/journey/`: three optimized cinematic illustrations for the invitation exchange, drive and photo moment. Illustrations are imagined, not photographs of the actual venue.
- `dist/story-audio.json`: existing official YouTube selections. Official recordings are not downloaded or rehosted.

The story does not use pagination, scroll snapping, intercepted wheel/touch events or next-page buttons. Mouse wheel, trackpad, touch and keyboard all use the browser's native scroll. The same stage dissolves through the story; scrolling backwards reverses it. Event details follow naturally at the end.

“Read without animation” exposes all scenes in normal document flow. Reduced-motion preferences, short viewports and oversized text use the reading layout automatically. All story content is available without JavaScript.

Sound is silent until explicitly enabled. “Sound on” starts an original ambient score generated locally with Web Audio; its instrumentation follows the story. Aarti and Garba selections use a visible, nonmodal official YouTube player so visitors can continue scrolling. Switching between ambience and official music stops the other source. Closing the player, pressing Escape, hiding the tab or leaving the page stops playback. YouTube playback depends on network, browser and regional availability.

Photo keepsakes remain entirely in the visitor's browser, with no upload or persistence. Calendar, District booking, venue directions, the original invitation and entry-pass wording are preserved.

## Verification

`node --check dist/experience.js`

`tests/verify-experience.cjs` requires `jsdom` and `postcss` in the Node module search path. It checks scene traversal and reversal, dissolves, hamper opening, reading/reduced-motion modes, silent defaults, audio controls, player cleanup, asset references, sharing, keepsake validation and event details. These are DOM-level tests, not a rendering engine or an audio-quality assessment.

See `PRODUCTION-BRIEF.md` for verified results and remaining checks. The existing Sites project ID is preserved. Pushing source changes does not publish the live Sites website.
