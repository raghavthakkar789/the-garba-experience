# The Garba Experience — continuous story redesign

## Change contract

Restore the original narrative as a connected scroll experience, improve visual continuity and touch use, and provide optional sound without interrupting the journey. Preserve the event details, printed invitation, existing bookings and keepsake capability.

Base: GitHub `main` at `fdce57db570cbc1627d22a5fec0d214e0bc69ae3` (the completed merge-conflict repair). Changes are isolated in this checkout; prior work was not overwritten.

## Story and presentation

1. A friend asks where to go for Garba; she brings an invitation.
2. The forest-green hamper opens reversibly through scrolling.
3. The original invitation and its Gujarati wording reveal the evening.
4. The friends dress up, board their ride and travel through Ahmedabad.
5. Passes ready, they arrive and walk into the venue together.
6. They join other friends for a photo; visitors can make a local keepsake.
7. They pause together for Durga Mata and aarti.
8. The lights and Kinjal Dave's music draw them towards the stage.
9. The circle welcomes them, then invites the visitor to join.

A single sticky stage holds the entire animated story. Scenes overlap during dissolves; no pagination, snapping or scroll interception is used. All transitions and the hamper opening reverse when scrolling upward. The original invitation opens at full resolution. Native-flow event details follow the last scene.

The palette stays forest green, maroon and antique gold. Three new 1536×1024 cinematic scene assets depict the invitation, drive and photo moment; their optimized WebP files total approximately 1.1 MB. Existing arrival, shrine and Garba artwork is reused. Artwork is illustrative, not documentation of the venue. Fonts remain self-hosted.

Reduced motion, short screens and oversized text use an unpinned reading layout. A persistent reading-mode control is available. Hidden cinematic scenes are inert, preventing invisible controls from receiving keyboard focus. Without JavaScript, every scene is in the document flow.

## Sound and touch

The original ambient score is synthesized with Web Audio only after a visitor taps Sound on. A quiet tonal bed develops into gentle percussion as the story reaches the celebration. Volume and mute remain available. This is original ambience, not Kinjal Dave music or a recording of aarti.

Existing official aarti/Garba choices open one visible YouTube player in a nonmodal corner panel. Scrolling remains usable. Ambient sound and official playback are mutually exclusive. The official source link remains available when embedding fails. Playback stops when the panel closes, Escape is pressed, the page hides or the visitor leaves.

Primary touch controls are at least 44 px high. Native scrolling, keyboard navigation, the calendar download, directions, District link and local photo keepsake are preserved.

## Confirmed details retained

The Garba Experience featuring Kinjal Dave. Friday, 9 October 2026, 7:30 pm onwards. Vivenza by Gopi Farm, S.P. Ring Road, Ahmedabad. End time unannounced.

District URL stays exactly `https://www.district.in/events/the-garba-experience-with-kinjal-dave-1970-buy-tickets`; 1970 in the URL is not the event year. Invitation guests carry the elephant-shaped pass; District guests follow their ticket instructions. The calendar retains 19:30 IST. Maps uses the venue-name search.

## Fresh evidence

Passed JavaScript syntax and the behavioral suite `tests/verify-experience.cjs`: local asset references, CSS parsing, internal anchors, nine-scene traversal forwards/backwards, overlapping dissolves, reversible hamper, reading and reduced-motion switches, no unsolicited audio, opt-in ambience/mute, nonmodal official music, single-player switching, source exclusivity, Escape and background cleanup, share URL, keepsake controls and invalid/oversized image handling, event metadata and booking URL.

The suite uses jsdom and postcss from the existing validation environment, with audio and layout boundaries modeled. It does not establish rendered layout quality, actual sound quality, third-party playback or complete canvas export. Browser installation failed because its download was invalid, and this buildless site has no compatible managed browser preview. Desktop/phone visual review, a listening check and real-browser keepsake export remain unverified.

## Publication status

The configured Sites project `appgprj_6ab0f411cd608191b92795e769008c0e` returns “Sites project not found.” No replacement project or audience change was made. The existing canonical and social metadata are preserved. This revision is prepared for the authorized GitHub update. GitHub source changes do not publish the live Sites website; the existing publication remains unchanged.
