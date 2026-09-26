# The Garba Experience — an evening to belong

## Creative direction

A personal Gujarati invitation in forest green, maroon, warm ivory and antique gold. Fine elephant and lotus details come from the supplied hamper. Cormorant Garamond provides expressive display typography; Manrope keeps details clear. Fonts and all opening artwork are served locally.

## Visitor journey

1. **Open the hamper.** A clean cover based on the supplied physical front sits on the supplied pale paper texture. Two independently hinged doors open reversibly with scrolling, revealing a maroon invitation inside. The logo sits over the central seal. A direct invitation link avoids any mandatory interaction.
2. **Read the invitation.** The untouched original printed card keeps every organizer logo and original line; a readable HTML companion carries the principal wording, Gujarati verse, performer, date and venue. Clicking the printed card opens its full resolution.
3. **Feel the anticipation.** “Are you excited for it?” is a brief, expressive maroon typographic interlude.
4. **Arrive together.** Two proportionately rendered adult friends enter a lantern-lit evening. The extended car/boarding/ticket-counter sequence and comic speech bubbles are removed.
5. **Pause, then celebrate.** A quiet Durga Mata illustration and optional aarti lead into an expansive Garba scene and Kinjal Dave credit. Music is always opt-in. A small optional photo keepsake replaces the full selfie chapter.
6. **Make the evening yours.** The final card has the date, time, venue, District booking link, calendar download, directions search, sharing and the distinction between physical invitation passes and District tickets.

## Active files and motion

`dist/index.html`, `dist/experience.css` and `dist/experience.js` form the active implementation. Legacy styles and scripts remain inactive for reference. There is no build step.

The three main motion treatments are the reversible 3D door opening, a subtle arrival image movement and the celebration reveal. Normal page scrolling is retained. Reduced-motion visitors and short viewports receive a complete static opening, followed by all invitation content. Text does not depend on motion to become available; without JavaScript, the full page remains readable. A skip link leads directly to event details.

Artwork is illustrative. The new hamper cover is a generated recreation, not original production vector artwork. The arrival, shrine and concert scenes are imagined and do not document the actual venue. Optimized WebP delivery images are used; the supplied original invitation remains intact.

## Music and keepsakes

Music uses one visible YouTube player, created only after a user clicks a selection. Switching tracks replaces the player; close and Escape remove it. Direct official source links remain available. No recordings are downloaded or rehosted.

- Jai Aadhyashakti — T-Series Gujarati: https://www.youtube.com/watch?v=alCtB1c2czU
- Navrangi 2.0 — Kinjal Dave / KD Digital: https://www.youtube.com/watch?v=BPbbBR0X2GY
- Navrat — Kinjal Dave / Zee Music Gujarati: https://www.youtube.com/watch?v=W05ABD6ilbo

Configuration: `dist/story-audio.json`. External playback remains dependent on YouTube, browser and regional availability.

The optional memory dialog accepts a local JPG, PNG or WebP up to 20 MB and exports a framed PNG using canvas. It does not request camera access, upload photos or persist them. Native dialogs provide focus containment and keyboard closing. Files that cannot be decoded receive a retry message.

## Confirmed event details

The Garba Experience featuring Kinjal Dave. Friday, 9 October 2026, 7:30 pm onwards. Vivenza by Gopi Farm, S.P. Ring Road, Ahmedabad. End time unannounced.

Booking URL remains exactly https://www.district.in/events/the-garba-experience-with-kinjal-dave-1970-buy-tickets . The URL's 1970 is not the event year. Invitation guests carry their elephant-shaped physical pass; District guests follow their ticket instructions. Directions use a venue-name Maps search, not an unverified coordinate pin. The calendar file preserves 19:30 IST.

## Verification of this redesign

Passed: JavaScript syntax, CSS parsing, duplicate IDs, internal anchors and all referenced local files. DOM-level interaction checks passed for no unsolicited music, door opening and reversal, reduced-motion switching, single-player track changes, close cleanup, invitation sharing, memory-dialog controls and invalid/oversized photo validation. These checks use a DOM test harness, not a rendering engine.

Browser visual verification and end-to-end image export remain unconfirmed: the available preview browser blocks the local server with ERR_BLOCKED_BY_CLIENT; the local browser package download was invalid. No claim of pixel-level or mobile-device verification is made. Before publishing, review the opening, all chapter layouts, dialog keyboard behavior, photo export and YouTube playback on desktop and phone.

Publishing is currently blocked: the configured Sites project `appgprj_6ab0f411cd608191b92795e769008c0e` returns “Sites project not found.” The ID and site audience have not been changed. GitHub source changes do not by themselves update the live Sites publication.
