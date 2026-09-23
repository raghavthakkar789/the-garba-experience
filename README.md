# The Garba Experience

A static, continuous scroll invitation. Open dist/index.html through a local HTTP server. No build step is required.

- dist/invitation.css and invitation.js preserve the original opening, event card, sharing and transparent video rendering.
- dist/story.css and story.js implement the traveller’s linear story, sprite poses, scroll choreography and music controls.
- dist/story-audio.json contains official YouTube selections. Music loads only on a button press; direct source links handle unavailable embeds.
- dist/assets/story contains optimized generated artwork. These scenes are imagined, not venue photography.
- PRODUCTION-BRIEF.md documents event facts, narrative, asset treatment and verification limits.

Publishing uses the existing project ID in .openai/hosting.json and the dist static directory. Preserve current site audience.
