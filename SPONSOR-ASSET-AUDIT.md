# Sponsor road asset audit

Source: https://drive.google.com/drive/folders/1CX5Z0ul_NA9RgI9p_439_QE7khvmQTyw

Checked 28 September 2026. The final road contains all 16 confirmed presenter, sponsor and partner names, with their supplied roles. Supplied artwork is preserved, cropped for surrounding whitespace and optimized to WebP. Brand names are also live HTML text.

## Logos used

Eventzz Planet, Saregama Entertainment, Ethereum Infracon, MBA Group, Vivanta Group, HST, Eleven Infra, Vishakha, Krish Communication, JG University, Utsav Decor and S House.

## Items requiring confirmation

- Megma, Hungrito and Alpha Hospital: no matching logo file in the supplied folder. Their names appear as store-board lettering.
- Shah Events: `Shah events .pdf` actually displays **Shah Brothers**, with a printing tagline. Do not assume these are interchangeable. The road uses the requested name Shah Events without that logo until confirmed.
- Hospitality: the supplied text “Dhaval sethvala ni company nu mangavanu” is an internal request for a company name, not a publishable partner name. `Presha logo.png` displays **Presha Hospitality**, but no role mapping was confirmed. Hospitality is intentionally pending confirmation; neither the internal note nor Presha is published.
- `New Logo PDF.pdf` is another JG University logo. The named JG Red Logo is used.
- Duplicate MBA JPG and Krish ZIP were not needed because their matching PNG/PDF versions were available.

## Scene artwork

Built-in image generation created `dist/assets/partners/festival-road.webp`; original project characters were reused in `friends-walking.webp`. No sponsor logos or lettering were generated. The full art prompt is recorded in `dist/assets/partners/ART-PROMPT.md`.

## Verification

- Existing `tests/verify-experience.cjs` passes, including all ten story scenes, invitation opening, reduced motion, sound-bar removal and event details.
- Headless Chromium checked every shop pair at 1440×900, 390×844 and 320×640. All 16 names and their available logos load and their signboards fit within the viewport.
- Checked continuous between-pair movement, reverse scrolling, reduced-motion static layout, reload-to-top behavior and lack of horizontal overflow or browser script errors.
- Visually reviewed desktop, phone, compact phone and reading-mode screenshots. Gujarati heading uses the existing self-hosted Gujarati font.
