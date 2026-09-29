# The Garba Experience — continuous story redesign

## Change contract

Restore the original narrative as a connected scroll experience, improve visual continuity and touch use, and provide optional sound without interrupting the journey. Preserve the event details, printed invitation, existing bookings and keepsake capability.

Base: GitHub `main` at `6718b601c6a302ba58e56ba39ba072c2f459372e` (the matching-background revision). The opening now presents the complete closed invitation box before the illustrated storyline.

## Story and presentation

The user's preferred original illustrated characters and painted scenes are restored. The later realistic scenes and long narration are no longer loaded. The journey now has 11 dialogue lines instead of 24, with at most two in any scene. Pickup and driving are visual interludes. Existing complete lines are retained where useful; the constraint is the number of exchanges, not a word limit. Character dialogue is Gujarati with the date in English, and only one compact speech bubble is shown at a time during animated scrolling. Bubbles use 16px text on desktop and 14px on phones and follow the speaking character’s head, including the invitation handoff and shared rear-view poses. A small tail points to the speaker; reading mode retains every line in normal flow.

1. A larger green and gold box fronts the site. Clicking its centre logo runs a 3.8-second automatic door opening and zoom through the courtyard into the first story scene. The same gesture then continues into a 2.8-second descent: the two friends lower from above holding burgundy silk dupattas with gold borders, settle into their standing poses, and only then reveal the conversation. The cloth and character poses follow scroll progress reversibly, with a small stagger between friends. A quiet synthesized opening effect starts from that user gesture, with a separate mute control. There is no card stop or second click. Wheel, touch, navigation keys, Escape and leaving the page cancel the automatic entry and sound. Native scrolling drives the same reversible transition.
2. The friends finish their dupatta entrance, meet and decide they want an amazing Garba night.
3. She introduces The Garba Experience with Kinjal Dave and shows the invitation.
4. Their emerald Mercedes sedan arrives, both friends board, and it leaves.
5. They travel through an illustrated Ahmedabad seen through a Mercedes windscreen, with matching right-hand-drive dashboard overlays for desktop and portrait screens.
6. The car parks; they step out, take each other's hand and enter.
7. They pose at a dedicated Navratri photobooth with a floral light frame, embroidered backdrop, camera and ring light. Separate desktop and portrait backgrounds preserve the setup on phones. Scrolling or tapping reveals their photo.
8. They walk towards the stage and hear Kinjal Dave.
9. They face away from the viewer toward Durga Mata and hold the lit aarti thali towards her, with a gentle shower of marigold, rose and jasmine petals. The 36 decorative petals run only while the scene is visible, pause in background tabs, sit behind the friends and dialogue, and are hidden in reading/reduced-motion modes.
10. They join a sheri-garba circle viewed directly from above. A small Maa Amba shrine stays in the centre, surrounded by rings of neighbours dancing in an old Ahmedabad pol. Matching overhead friend sprites advance along the inner ring with reversible scroll motion; the invitation details follow.

The same original green-kediyu and pink-chaniya-choli characters persist throughout. Pose changes, walking, boarding, the venue approach and the photo reveal are scroll-driven. One sticky stage connects every scene with reversible dissolves. No scroll snapping, intercepted wheel/touch events or pagination is used. The original invitation opens at full resolution.

Original cast, entrance, concert and Garba-circle artwork remain optimized WebP assets, with separate phone artwork for the entrance and car interior. Five new 1536×1024 painted location backgrounds total 2.34 MB. The friends meet in a home courtyard; pickup takes place on the street outside; the drive follows a clear forward-facing road; the photo scene has its own dedicated photobooth; aarti takes place in a full courtyard around the shrine. The old city collage, duplicated entrance at the selfie scene and isolated shrine portrait are no longer loaded. Forward road movement stays aligned to its vanishing point. Phone dialogue placement leaves the shrine visible. These environments are artistic impressions, not verified depictions of the actual venue. Fonts remain self-hosted.

On the sponsor street, the friends reaching a shop frontage automatically reveals a compact card above the street with that partner’s name, role and available logo. It closes between shops, on turns, and when leaving the scene; reverse scrolling visits the same shops in reverse. All 16 shop fronts remain stationary. Automatic cards are nonmodal status panels, so they never steal focus or block scrolling. Shop-board clicks still open full details, including in reading mode.

Reduced motion, short screens and reading mode show all conversations in normal document flow. Hidden cinematic scenes are inert. No-JavaScript visitors can read the complete story. Existing event details, original invitation, booking links, sound choices and local photo keepsakes are preserved.

## Sound and touch

The floating ambient sound bar and score have been removed. The logo-triggered door-opening sound and its own mute control remain available.

Existing official aarti/Garba choices open one visible YouTube player in a nonmodal corner panel. Scrolling remains usable. Starting official playback stops the door-opening sound. The official source link remains available when embedding fails. Playback stops when the panel closes, Escape is pressed, the page hides or the visitor leaves.

Primary touch controls are at least 44 px high. Native scrolling, keyboard navigation, the calendar download, directions, District link and local photo keepsake are preserved.

## Confirmed details retained

The Garba Experience featuring Kinjal Dave. Friday, 9 October 2026, 7:30 pm onwards. Vivenza by Gopi Farm, S.P. Ring Road, Ahmedabad. End time unannounced.

District URL stays exactly `https://www.district.in/events/the-garba-experience-with-kinjal-dave-1970-buy-tickets`; 1970 in the URL is not the event year. One elephant-shaped invitation admits two people; invitation guests bring that elephant pass; District guests follow their ticket instructions. The calendar retains 19:30 IST. Maps uses the venue-name search.

## Fresh evidence

Passed JavaScript syntax and the behavioral suite `tests/verify-experience.cjs`: local asset references, CSS parsing, internal anchors, ten-scene traversal forwards/backwards, brief dialogue switching and reversal, character pose changes, car boarding/departure, hand-in-hand entry, automatic/manual selfie reveal, overlapping dissolves, reversible hamper, reading and reduced-motion switches, no unsolicited audio, absence of the ambient bar, preserved door-sound controls, nonmodal official music, single-player switching, source exclusivity, Escape and background cleanup, share URL, keepsake controls and invalid/oversized image handling, event metadata and booking URL.

The suite uses jsdom and postcss from the existing validation environment, with audio and layout boundaries modeled. A local Chromium render also checked the illustrated scenes at 1440×900, 390×844 and 320×700: scene selection matched the scroll position, all visible images loaded, no page exceptions occurred, and no horizontal overflow appeared. Screenshots were reviewed for background composition, ground placement, driving perspective, the selfie location and shrine framing. The revised opening was checked at 1440×900, 390×844, 360×640 and 320×700: the larger box clears the heading and hint, one logo click reaches the friends with intermediate zoom frames, reverse scrolling closes the doors, and reload returns to the closed box. Keyboard activation transfers focus to the story heading. Reading and reduced-motion modes go directly to the story without the zoom; without JavaScript a direct story link remains available. Actual sound quality, third-party playback and complete canvas export remain unverified.

## Publication status

The configured Sites project `appgprj_6ab0f411cd608191b92795e769008c0e` returns “Sites project not found.” No replacement project or audience change was made. The existing canonical and social metadata are preserved. This revision is prepared for the authorized GitHub update. GitHub source changes do not publish the live Sites website; the existing publication remains unchanged.
