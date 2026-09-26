# The Garba Experience

A static, continuous scroll invitation. Open dist/index.html through a local HTTP server. No build step is required.

The visitor first sees the physical hamper front on the supplied paper texture. Scrolling reveals the printed invitation, then the animated “Are you excited for it?” message, before the two friends' journey begins.

- dist/hamper.css and hamper.js control the new scroll opening; assets/hamper-front.jpeg and hamper-texture.jpg are the supplied reference images.
- dist/invitation.css and invitation.js provide the event card, sharing and transparent video rendering.
- dist/story.css and story.js implement the friends' linear story, sprite poses, scroll choreography and music controls.
- dist/story-audio.json contains official YouTube selections. Music loads only on a button press; direct source links handle unavailable embeds.
- dist/assets/story contains optimized generated artwork. These scenes are imagined, not venue photography.
- PRODUCTION-BRIEF.md documents event facts, narrative, asset treatment and verification limits.

Publishing uses the existing project ID in .openai/hosting.json and the dist static directory. Preserve current site audience.
