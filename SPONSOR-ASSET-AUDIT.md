# Sponsor road asset audit

Source: https://drive.google.com/drive/folders/1CX5Z0ul_NA9RgI9p_439_QE7khvmQTyw

## Current implementation — 3 October 2026

All sixteen presenter, sponsor and partner boards use their supplied logos: Eventzz Planet, Saregama Entertainment, Ethereum Infracon, MBA Group, Vivanta Group, HST, Eleven Infra, Vishakha, Krish Communication, JG University, Utsav Decor, S House, Magma, Hungrito, Alpha Hospital and Shah Brothers. The supplied Magma artwork resolves the earlier “Megma” placeholder. Shah Brothers is the user-confirmed replacement for Shah Events.

The Garba Experience and the three lead partners also have prominent logo plaques in the opening, stage and closing page. Each clickable logo opens a centered card with its name, role and artwork. Responsive partner cards provide larger logos and readable wrapping text. Names remain accessible on logo-only plaques.

The complete stationary market uses `market-courtyard.webp`, `painted-shop.webp` and `friends-sidewalk.webp`. Scroll advances the friends along its winding route; the shops remain stationary. Autoscroll dedicates 20 seconds to this chapter. Visitors can pause or open a partner card for longer viewing.

## Retained source history

The original generated street and walking artwork were superseded and removed in the approved cleanup. Their prompts remain in `dist/assets/partners/` for provenance; earlier assets remain recoverable from Git history. No sponsor logos or lettering were generated.

Hospitality remains unassigned: the earlier internal note was not a publishable company name, and no confirmed role mapping was supplied for Presha Hospitality. No additional partner has been inferred.

## Verification coverage

`verify-arrival-partners.cjs` checks the supplied Hungrito, Magma and Alpha Hospital logos and arrival speech clearance. `verify-partner-cards.cjs` and `verify-brand-cards.cjs` cover responsive logo/name cards, keyboard focus and dialogs. `verify-timeline.cjs` covers the twenty-second partner interval. Browser automation complements, but does not replace, physical-device review.
