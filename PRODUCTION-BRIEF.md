# The Garba Experience — continuous story redesign

## Change contract

Restore the original narrative as a connected scroll experience, improve visual continuity and touch use, and provide optional sound without interrupting the journey. Preserve the event details, printed invitation, existing bookings and keepsake capability.

Base: GitHub `main` at `c1d33df111c1dfb894c8866c2e507573e0053e7f` (the restored illustrated story). This correction matches the environments to each story action while retaining the cast, dialogue and continuous scroll.

## Story and presentation

The user's preferred original illustrated characters and painted scenes are restored. The later realistic scenes and long narration are no longer loaded. Each scene has a small title and two or three short dialogue beats; only one speech bubble is shown at a time during animated scrolling. Dialogue lines contain at most 12 words.

1. The friends meet and decide they want an amazing Garba night.
2. She gives him the invitation; the hamper opens with the scroll.
3. The original printed invitation appears.
4. Their car arrives, both friends board, and it leaves.
5. They travel through an illustrated Ahmedabad seen through the windscreen.
6. The car parks; they step out, take each other's hand and enter.
7. They pose for a selfie. Scrolling or tapping reveals their photo.
8. They walk towards the stage and hear Kinjal Dave.
9. They pause together for aarti before Durga Mata.
10. They join the circle and dance; the invitation details follow.

The same original green-kediyu and pink-chaniya-choli characters persist throughout. Pose changes, walking, boarding, the venue approach and the photo reveal are scroll-driven. One sticky stage connects every scene with reversible dissolves. No scroll snapping, intercepted wheel/touch events or pagination is used. The original invitation opens at full resolution.

Original cast, entrance, concert and Garba-circle artwork remain optimized WebP assets, with separate phone artwork for the entrance and car interior. Five new 1536×1024 painted location backgrounds total 2.34 MB. The meeting and gift exchange share a home courtyard; pickup takes place on the street outside; the drive follows a clear forward-facing road; the selfie has its own floral alcove; aarti takes place in a full courtyard around the shrine. The old city collage, duplicated entrance at the selfie scene and isolated shrine portrait are no longer loaded. Forward road movement stays aligned to its vanishing point. Phone dialogue placement leaves the shrine visible. These environments are artistic impressions, not verified depictions of the actual venue. Fonts remain self-hosted.

Reduced motion, short screens and reading mode show all conversations in normal document flow. Hidden cinematic scenes are inert. No-JavaScript visitors can read the complete story. Existing event details, original invitation, booking links, sound choices and local photo keepsakes are preserved.

## Sound and touch

The original ambient score is synthesized with Web Audio only after a visitor taps Sound on. A quiet tonal bed develops into gentle percussion as the story reaches the celebration. Volume and mute remain available. This is original ambience, not Kinjal Dave music or a recording of aarti.

Existing official aarti/Garba choices open one visible YouTube player in a nonmodal corner panel. Scrolling remains usable. Ambient sound and official playback are mutually exclusive. The official source link remains available when embedding fails. Playback stops when the panel closes, Escape is pressed, the page hides or the visitor leaves.

Primary touch controls are at least 44 px high. Native scrolling, keyboard navigation, the calendar download, directions, District link and local photo keepsake are preserved.

## Confirmed details retained

The Garba Experience featuring Kinjal Dave. Friday, 9 October 2026, 7:30 pm onwards. Vivenza by Gopi Farm, S.P. Ring Road, Ahmedabad. End time unannounced.

District URL stays exactly `https://www.district.in/events/the-garba-experience-with-kinjal-dave-1970-buy-tickets`; 1970 in the URL is not the event year. Invitation guests carry the elephant-shaped pass; District guests follow their ticket instructions. The calendar retains 19:30 IST. Maps uses the venue-name search.

## Fresh evidence

Passed JavaScript syntax and the behavioral suite `tests/verify-experience.cjs`: local asset references, CSS parsing, internal anchors, ten-scene traversal forwards/backwards, brief dialogue switching and reversal, character pose changes, car boarding/departure, hand-in-hand entry, automatic/manual selfie reveal, overlapping dissolves, reversible hamper, reading and reduced-motion switches, no unsolicited audio, opt-in ambience/mute, nonmodal official music, single-player switching, source exclusivity, Escape and background cleanup, share URL, keepsake controls and invalid/oversized image handling, event metadata and booking URL.

The suite uses jsdom and postcss from the existing validation environment, with audio and layout boundaries modeled. A local Chromium render also checked the illustrated scenes at 1440×900, 390×844 and 320×700: scene selection matched the scroll position, all visible images loaded, no page exceptions occurred, and no horizontal overflow appeared. Screenshots were reviewed for background composition, ground placement, driving perspective, the selfie location and shrine framing. Phone reading mode kept all ten scenes visible without overflow. Actual sound quality, third-party playback and complete canvas export remain unverified.

## Publication status

The configured Sites project `appgprj_6ab0f411cd608191b92795e769008c0e` returns “Sites project not found.” No replacement project or audience change was made. The existing canonical and social metadata are preserved. This revision is prepared for the authorized GitHub update. GitHub source changes do not publish the live Sites website; the existing publication remains unchanged.
