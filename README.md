# The Garba Experience

A responsive, continuous-scroll invitation for Kinjal Dave's evening in Ahmedabad on 9 October 2026. A forest-green hamper opens into the invitation, followed by anticipation, two friends' arrival, a devotional pause and the Garba celebration.

## Run locally

```sh
python3 -m http.server 8765 --directory dist
```

Open http://localhost:8765. No build step or production dependencies are required.

## Active implementation

- `dist/index.html`: semantic journey, original invitation, event details and native dialogs.
- `dist/experience.css`: green, maroon, ivory and gold design; dedicated phone layouts; reduced-motion fallback.
- `dist/experience.js`: reversible hinged doors, lightweight scroll effects, opt-in music, sharing and local photo keepsakes.
- `dist/story-audio.json`: official YouTube selections. Playback begins only after a user clicks; closing the dialog removes the player.
- `dist/assets/hamper-doors.webp`: recreated cover inspired by the supplied physical hamper, with the supplied logo overlaid in HTML.
- `dist/assets/arrival-evening.webp`, `devotion.webp`, `celebration.webp`: optimized imagined scenes, not actual venue photography.
- `dist/assets/invitation-paper.webp`: optimized supplied paper texture.
- `dist/assets/invitation.jpg`: unchanged original invitation with its wording and organizer logos.
- `dist/assets/fonts`: self-hosted Cormorant Garamond and Manrope, with OFL licenses.

Earlier scripts, styles and artwork remain in the repository for reference, but are not loaded by the active page. No ticket-counter, boarding sequence, cartoon sprites or separate selfie chapter remains in the current journey.

Photo keepsakes are drawn and exported entirely in the visitor's browser. Photos are not uploaded or persisted. Music requires YouTube connectivity; the player provides an official source link if embedding is unavailable.

## Publishing and validation

Use the existing project ID in `.openai/hosting.json` and the `dist` static directory. Preserve the current site audience. See `PRODUCTION-BRIEF.md` for verification results and outstanding hosting/browser limitations.
